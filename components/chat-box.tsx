"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";

type Message = {
  id: number;
  role: "user" | "bot";
  body: string;
  href?: string;
};

export function ChatBox({ signedIn, initialRemaining }: { signedIn: boolean; initialRemaining: number }) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      role: "bot",
      body: signedIn
        ? "Type a combo or battle. Examples: Phoenix Wing 9-60 Point or Wizard Rod 1-60 Hexa vs Phoenix Wing 3-60 Rush 1-0."
        : "Sign in first, then I can create combos and log battles from your saved parts."
    }
  ]);
  const [text, setText] = useState("");
  const [remaining, setRemaining] = useState(initialRemaining);
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const body = text.trim();
    if (!body || busy) return;

    const userMessage: Message = { id: Date.now(), role: "user", body };
    setMessages((current) => [...current, userMessage]);
    setText("");
    setBusy(true);

    try {
      const response = await fetch("/api/chat-combo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: body })
      });
      const result = await response.json().catch(() => ({}));
      if (typeof result.remaining === "number") setRemaining(result.remaining);

      setMessages((current) => [
        ...current,
        {
          id: Date.now() + 1,
          role: "bot",
          body: response.ok ? result.message : result.error || "I could not handle that request.",
          href: response.ok && result.combo?.id ? `/combos/${result.combo.id}` : undefined
        }
      ]);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="chat-page">
      <div className="chat-panel">
        <div className="chat-limit">
          <span className="tag">{remaining} chats left today</span>
        </div>
        <div className="chat-messages" aria-live="polite">
          {messages.map((message) => (
            <div className={message.role === "user" ? "chat-message chat-message--user" : "chat-message"} key={message.id}>
              {message.body}
              {message.href ? <Link className="button button-small" href={message.href}>Open combo</Link> : null}
            </div>
          ))}
        </div>
        <form className="chat-input" onSubmit={submit}>
          <label>
            Message
            <input disabled={!signedIn || remaining <= 0 || busy} value={text} onChange={(event) => setText(event.target.value)} placeholder="Wizard Rod 1-60 Hexa vs Phoenix Wing 3-60 Rush 1-0" />
          </label>
          <button disabled={!signedIn || remaining <= 0 || busy} type="submit">{busy ? "Creating" : "Send"}</button>
        </form>
      </div>
    </section>
  );
}
