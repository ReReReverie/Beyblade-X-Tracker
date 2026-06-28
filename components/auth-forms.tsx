"use client";

import { FormEvent, useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

export function SignInForm({ googleEnabled }: { googleEnabled: boolean }) {
  const router = useRouter();
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const form = new FormData(event.currentTarget);
    const result = await signIn("credentials", {
      login: form.get("login"),
      password: form.get("password"),
      redirect: false
    });
    if (result?.error) {
      setError("Email or password did not match.");
      return;
    }
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
      <button type="submit">Sign in</button>
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

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.get("name"),
        email: form.get("email"),
        password: form.get("password")
      })
    });
    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      setError(data.error || "Could not create account.");
      return;
    }
    await signIn("credentials", {
      login: form.get("email"),
      password: form.get("password"),
      callbackUrl: "/dashboard"
    });
    router.refresh();
  }

  return (
    <form onSubmit={submit}>
      <label>
        Display name
        <input name="name" maxLength={80} />
      </label>
      <label>
        Email
        <input name="email" type="email" required />
      </label>
      <label>
        Password
        <input name="password" type="password" minLength={8} required />
      </label>
      {error ? <p className="danger">{error}</p> : null}
      <button type="submit">Create account</button>
    </form>
  );
}
