export const dynamic = "force-dynamic";

import { Suspense } from "react";
import { SignUpForm } from "@/components/auth-forms";

export default function SignUpPage() {
  return (
    <section className="band">
      <h1>Create account</h1>
      <p>Start your catalog with measured weights, condition ratings, source labels, and photos.</p>
      <Suspense fallback={null}>
        <SignUpForm />
      </Suspense>
    </section>
  );
}

