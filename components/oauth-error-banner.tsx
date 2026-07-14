"use client";

import { useSearchParams } from "next/navigation";

/**
 * Isolated component that reads ?error= from the URL.
 * Wrapped in its own <Suspense fallback={null}> so it doesn't
 * force the entire sign-in form into a skeleton/loading state.
 */
export function OAuthErrorBanner() {
  const searchParams = useSearchParams();
  const urlError = searchParams.get("error");

  if (!urlError) return null;

  const message =
    urlError === "OAuthAccountNotLinked"
      ? "This email is already associated with a password account. Please sign in with your credentials."
      : "Authentication failed. Please try again.";

  return <p className="danger">{message}</p>;
}
