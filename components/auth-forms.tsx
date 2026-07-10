"use client";

import { FormEvent, useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { notifyAuthSessionChanged } from "@/components/auth-session-events";
import { hideLoadingOverlay, showLoadingOverlay } from "@/components/loading-overlay-events";

export function SignInForm({ googleEnabled }: { googleEnabled: boolean }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

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

  return (
    <form onSubmit={submit}>
      <label>
        Email or username
        <input name="login" required />
      </label>
      <label>
        Password
        <input name="password" type="password" required />
      </label>
      {error ? <p className="danger">{error}</p> : null}
      <button type="submit" disabled={loading}>{loading ? "Signing in" : "Sign in"}</button>
      {googleEnabled ? (
        <button className="secondary" type="button" onClick={() => signIn("google", { callbackUrl: "/dashboard" })}>
          Continue with Google
        </button>
      ) : null}
    </form>
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
      setLoading(false);
      hideLoadingOverlay();
      return;
    }
    const result = await signIn("credentials", {
      login: form.get("username"),
      password: form.get("password"),
      redirect: false
    });
    setLoading(false);
    hideLoadingOverlay();
    if (result?.error) {
      setError("Account created, but automatic sign in failed. Please sign in.");
      return;
    }
    notifyAuthSessionChanged();
    router.push("/");
    router.refresh();
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


