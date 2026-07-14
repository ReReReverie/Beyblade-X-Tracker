import { PrismaAdapter } from "@auth/prisma-adapter";
import { compare } from "bcryptjs";
import type { NextAuthOptions, Profile } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { prisma } from "@/lib/prisma";

/* ─── Providers ─────────────────────────────────────────────────────── */

const providers: NextAuthOptions["providers"] = [
  CredentialsProvider({
    name: "Email or username",
    credentials: {
      login: { label: "Email or username", type: "text" },
      password: { label: "Password", type: "password" }
    },
    async authorize(credentials) {
      const login = credentials?.login?.toLowerCase().trim();
      const password = credentials?.password;
      if (!login || !password) return null;

      const user = await prisma.user.findFirst({
        where: {
          OR: [{ email: login }, { username: login }]
        }
      });
      if (!user?.passwordHash) return null;

      const valid = await compare(password, user.passwordHash);
      if (!valid) return null;

      return { id: user.id, email: user.email, name: user.name, image: user.image, username: user.username };
    }
  })
];

const googleEnabled =
  process.env.GOOGLE_CLIENT_ID &&
  process.env.GOOGLE_CLIENT_SECRET;

if (googleEnabled) {
  providers.push(
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      // Allow users who signed up via credentials to later link their Google account
      allowDangerousEmailAccountLinking: true,
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code"
        }
      }
    })
  );
}

/* ─── Auth Options ──────────────────────────────────────────────────── */

export const authOptions: NextAuthOptions = {
  ...(googleEnabled ? { adapter: PrismaAdapter(prisma) } : {}),
  session: { strategy: "jwt" },
  pages: {
    signIn: "/auth/signin",
    error: "/auth/signin" // Redirect OAuth errors back to sign-in page with ?error= param
  },
  providers,
  callbacks: {
    /**
     * Control whether a sign-in attempt is allowed.
     * For Google OAuth: if the email already exists as a credentials-only account
     * and allowDangerousEmailAccountLinking is true, NextAuth will auto-link.
     * This callback provides a hook for additional custom logic if needed.
     */
    async signIn({ user, account, profile }) {
      // Always allow credentials sign-in (already validated in authorize)
      if (account?.provider === "credentials") return true;

      // For Google OAuth — ensure the email is verified by Google
      if (account?.provider === "google") {
        const googleProfile = profile as Profile & { email_verified?: boolean };
        if (!googleProfile?.email_verified) {
          return false; // Reject unverified Google emails
        }
        return true;
      }

      return true;
    },

    async jwt({ token, user, account }) {
      // On initial sign-in (credentials or OAuth), populate token
      if (user) {
        token.sub = user.id;
      }

      // On OAuth sign-in, the adapter may have just created the user — fetch fresh data
      if (account && token.sub) {
        const dbUser = await prisma.user.findUnique({
          where: { id: token.sub },
          select: { role: true, username: true }
        });
        token.role = dbUser?.role || "USER";
        token.username = dbUser?.username || null;
      } else if (user) {
        // Credentials sign-in — user object already resolved
        const dbUser = await prisma.user.findUnique({
          where: { id: user.id },
          select: { role: true, username: true }
        });
        token.role = dbUser?.role || "USER";
        token.username = dbUser?.username || null;
      }

      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub || "";
        session.user.role = String(token.role || "USER");
        session.user.username = typeof token.username === "string" ? token.username : null;
      }
      return session;
    }
  }
};
