"use client";

import { FormEvent, useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { notifyAuthSessionChanged } from "@/components/auth-session-events";
import { hideLoadingOverlay, showLoadingOverlay } from "@/components/loading-overlay-events";

function GoogleIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  );
}

export function SignInForm({ googleEnabled }: { googleEnabled: boolean }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);
    const form = new FormData(event.currentTarget);
    const result = await signIn("credentials", {
      login: form.get("login"),
      password: form.get("password"),
      redirect: false
    });
    setLoading(false);
    if (result?.error) {
      setError("Username/email or password did not match.");
      return;
    }
    notifyAuthSessionChanged();
    router.push("/dashboard");
    router.refresh();
  }

  function handleGoogleSignIn() {
    setGoogleLoading(true);
    setError("");
    signIn("google", { callbackUrl: "/dashboard" });
  }

  return (
    <div className="signin-container">
      {/* Google OAuth section — displayed first for prominence */}
      {googleEnabled && (
        <>
          <button
            type="button"
            className="google-signin-button"
            onClick={handleGoogleSignIn}
            disabled={googleLoading}
            aria-label="Sign in with Google"
          >
            {googleLoading ? (
              <span className="google-signin-button__spinner" />
            ) : (
              <GoogleIcon />
            )}
            <span>{googleLoading ? "Redirecting…" : "Sign in with Google"}</span>
          </button>

          <div className="signin-divider" role="separator">
            <span className="signin-divider__line" />
            <span className="signin-divider__text">or sign in with credentials</span>
            <span className="signin-divider__line" />
          </div>
        </>
      )}

      {/* Credentials form */}
      <form onSubmit={submit}>
        <label>
          Email or username
          <input name="login" required autoComplete="username" />
        </label>
        <label>
          Password
          <input name="password" type="password" required autoComplete="current-password" />
        </label>
        {error && <p className="danger">{error}</p>}
        <button type="submit" disabled={loading}>
          {loading ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </div>
  );
}

export function SignUpForm() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);
    showLoadingOverlay();
    try {
      const form = new FormData(event.currentTarget);
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.get("name"),
          username: form.get("username"),
          email: form.get("email"),
          password: form.get("password")
        })
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        setError(data.error || "Could not create account.");
        return;
      }

      const result = await signIn("credentials", {
        login: form.get("username"),
        password: form.get("password"),
        redirect: false
      });
      if (result?.error) {
        setError("Account created, but automatic sign in failed. Please sign in.");
        return;
      }
      notifyAuthSessionChanged();
      router.push("/");
      router.refresh();
    } catch (error) {
      console.error("Signup request failed:", error);
      setError("Could not reach the server. Please try again.");
    } finally {
      setLoading(false);
      hideLoadingOverlay();
    }
  }

  return (
    <form onSubmit={submit}>
      <label>
        Display name
        <input name="name" maxLength={80} />
      </label>
      <label>
        Username
        <input name="username" minLength={3} maxLength={40} required />
      </label>
      <label>
        Email
        <input name="email" type="email" placeholder="(optional)" />
      </label>
      <label>
        Password
        <input name="password" type="password" minLength={8} required />
      </label>
      {error ? <p className="danger">{error}</p> : null}
      <button type="submit" disabled={loading}>{loading ? "Creating" : "Create account"}</button>
    </form>
  );
}


