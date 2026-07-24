export const dynamic = "force-dynamic";

import { Suspense } from "react";
import Link from "next/link";
import { SignInForm } from "@/components/auth-forms";
import { OAuthErrorBanner } from "@/components/oauth-error-banner";

export default function SignInPage() {
  return (
    <section className="band signin-page">
      <h1>Sign in</h1>
      <p>
        Sign in with Google or use your credentials to access your parts, combos, photos, and battles.
      </p>
      {/* Only the error banner needs searchParams — isolate it in its own Suspense */}
      <Suspense fallback={null}>
        <OAuthErrorBanner />
      </Suspense>
      <SignInForm googleEnabled={true} />
      <p>
        If you lose your password, it cannot be recovered. Please keep it somewhere secure.
      </p>
      <p>
        New here? <Link href="/auth/signup">Create an account</Link>
      </p>
    </section>
  );
}

