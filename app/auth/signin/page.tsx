export const dynamic = "force-dynamic";

import { Suspense } from "react";
import Link from "next/link";
import { SignInForm } from "@/components/auth-forms";

export default function SignInPage() {
  const googleEnabled = Boolean(
    process.env.GOOGLE_AUTH_ENABLED === "true" &&
      process.env.GOOGLE_CLIENT_ID &&
      process.env.GOOGLE_CLIENT_SECRET
  );

  return (
    <section className="band signin-page">
      <h1>Sign in</h1>
      <p>
        {googleEnabled
          ? "Sign in with Google or use your credentials to access your parts, combos, photos, and battles."
          : "Use your username/password to access your parts, combos, photos, and battles."}
      </p>
      <Suspense fallback={<SignInFormSkeleton />}>
        <SignInForm googleEnabled={googleEnabled} />
      </Suspense>
      <p>
        New here? <Link href="/auth/signup">Create an account</Link>
      </p>
    </section>
  );
}

function SignInFormSkeleton() {
  return (
    <div className="signin-container">
      <div className="skeleton skeleton--button" style={{ width: "100%", height: "52px" }} />
      <div className="signin-divider" role="separator">
        <span className="signin-divider__line" />
        <span className="signin-divider__text">or sign in with credentials</span>
        <span className="signin-divider__line" />
      </div>
      <div style={{ display: "grid", gap: "0.8rem" }}>
        <div className="skeleton skeleton--line" style={{ height: "52px", width: "100%" }} />
        <div className="skeleton skeleton--line" style={{ height: "52px", width: "100%" }} />
        <div className="skeleton skeleton--button" style={{ width: "160px" }} />
      </div>
    </div>
  );
}

