export const dynamic = "force-dynamic";

import { Suspense } from "react";
import Link from "next/link";
import { SignInForm } from "@/components/auth-forms";
import { OAuthErrorBanner } from "@/components/oauth-error-banner";

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
      {/* Only the error banner needs searchParams — isolate it in its own Suspense */}
      <Suspense fallback={null}>
        <OAuthErrorBanner />
      </Suspense>
      <SignInForm googleEnabled={googleEnabled} />
      <p>
        New here? <Link href="/auth/signup">Create an account</Link>
      </p>
    </section>
  );
}

