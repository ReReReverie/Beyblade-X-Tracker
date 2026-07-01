import Link from "next/link";
import { SignInForm } from "@/components/auth-forms";

export default function SignInPage() {
  const googleEnabled = Boolean(
    process.env.GOOGLE_AUTH_ENABLED === "true" &&
      process.env.GOOGLE_CLIENT_ID &&
      process.env.GOOGLE_CLIENT_SECRET
  );

  return (
    <section className="band">
      <h1>Sign in</h1>
      <p>Use email/password to access your parts, combos, photos, and battles.</p>
      <SignInForm googleEnabled={googleEnabled} />
      <p>
        New here? <Link href="/auth/signup">Create an account</Link>
      </p>
    </section>
  );
}
