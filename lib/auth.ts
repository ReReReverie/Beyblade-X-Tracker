import { PrismaAdapter } from "@auth/prisma-adapter";
import { compare } from "bcryptjs";
import type { NextAuthOptions, Profile } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { prisma } from "@/lib/prisma";

const defaultAdminUsername = process.env.DEFAULT_ADMIN_USERNAME || "admin";
const adminLoginAliases = new Set(["admin", "rereverie", defaultAdminUsername]);

const providers: NextAuthOptions["providers"] = [
  CredentialsProvider({
    name: "Email or username",
    credentials: {
      login: { label: "Email or username", type: "text" },
      password: { label: "Password", type: "password" }
    },
    async authorize(credentials) {
      const login = credentials?.login?.trim();
      const password = credentials?.password;
      if (!login || !password) return null;

      let user = null;

      if (adminLoginAliases.has(login)) {
        user = await prisma.user.findFirst({
          where: { username: defaultAdminUsername }
        });
      }

      if (!user) {
        user = await prisma.user.findFirst({
          where: {
            OR: [{ email: login }, { username: login }]
          }
        });
      }

      if (!user?.passwordHash) return null;

      const valid = await compare(password, user.passwordHash);
      if (!valid) return null;

      return { id: user.id, email: user.email, name: user.name, image: user.image, username: user.username };
    }
  })
];

const googleEnabled = process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET;

if (googleEnabled) {
  providers.push(
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
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

export const authOptions: NextAuthOptions = {
  ...(googleEnabled ? { adapter: PrismaAdapter(prisma) } : {}),
  session: { strategy: "jwt" },
  pages: {
    signIn: "/auth/signin",
    error: "/auth/signin"
  },
  providers,
  callbacks: {
    async signIn({ account, profile }) {
      if (account?.provider === "credentials") return true;
      if (account?.provider === "google") {
        const googleProfile = profile as Profile & { email_verified?: boolean };
        return Boolean(googleProfile?.email_verified);
      }
      return true;
    },
    async jwt({ token, user, account }) {
      if (user) {
        token.sub = user.id;
      }

      if (account && token.sub) {
        const dbUser = await prisma.user.findUnique({
          where: { id: token.sub },
          select: { role: true, username: true }
        });
        token.role = dbUser?.role || "USER";
        token.username = dbUser?.username || null;
      } else if (user) {
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
