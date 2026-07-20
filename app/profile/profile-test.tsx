"use client";

export function ProfileTest({ name }: { name?: string | null }) {
  return <h1>Hello {name || "user"}</h1>;
}
