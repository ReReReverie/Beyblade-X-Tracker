"use client";

import { FormEvent, useRef, useState, useEffect } from "react";
import Link from "next/link";

type Message = {
  id: number;
  role: "user" | "bot";
  body: string;
  href?: string;
  suggestions?: string[];
};


function FormatMessage({ text }: { text: string }) {
  // Simple markdown-like rendering for bold and line breaks
  const lines = text.split("\n");
  return (
    <div className="chat-message__body">
      {lines.map((line, i) => {
        if (!line.trim()) return <br key={i} />;
        // Bold: **text**
        const parts = line.split(/(\*\*[^*]+\*\*)/g);
        return (
          <p key={i} style={{ margin: "0.15rem 0" }}>
            {parts.map((part, j) => {
              if (part.startsWith("**") && part.endsWith("**")) {
                return <strong key={j}>{part.slice(2, -2)}</strong>;
              }
              return <span key={j}>{part}</span>;
            })}
          </p>
        );
      })}
    </div>
  );
}


export function ChatBox({ signedIn, initialRemaining }: { signedIn: boolean; initialRemaining: number }) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      role: "bot",
      body: signedIn
        ? [
            "**Beyblade X Assistant** — Create combos, log battles, view stats, and manage your collection via chat.",
            "",
            "**Commands:**",
            "help — See all commands & examples",
            "my parts — Browse your part inventory",
            "my combos — List your recent combos",
            "my stats — Win rate & battle record",
            "my battles — Recent battle history",
            "my decks — View your 3v3 decks",
            "create deck — Build a new deck",
            "",
            "Or just type a combo (e.g. Phoenix Wing 9-60 Point) or battle (e.g. ComboA vs ComboB 1-0)."
          ].join("\n")
        : "Sign in first, then I can help you manage your combos, parts, battles, and decks.",
      suggestions: signedIn ? ["help", "my stats", "my combos", "my parts"] : undefined
    }
  ]);
  const [text, setText] = useState("");
  const [remaining, setRemaining] = useState(initialRemaining);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);


  function sendMessage(body: string) {
    if (!body.trim() || busy) return;
    const userMessage: Message = { id: Date.now(), role: "user", body };
    setMessages((current) => [...current, userMessage]);
    setText("");
    setBusy(true);

    fetch("/api/chat-combo", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: body })
    })
      .then((res) => res.json().then((data) => ({ ok: res.ok, data })))
      .then(({ ok, data }) => {
        if (typeof data.remaining === "number") setRemaining(data.remaining);
        setMessages((current) => [
          ...current,
          {
            id: Date.now() + 1,
            role: "bot",
            body: ok ? data.message : data.error || "I could not handle that request.",
            href: ok && data.combo?.id ? `/combos/${data.combo.id}` : undefined,
            suggestions: data.suggestions || undefined
          }
        ]);
      })
      .catch(() => {
        setMessages((current) => [
          ...current,
          {
            id: Date.now() + 1,
            role: "bot",
            body: "Network error. Please try again.",
            suggestions: ["help"]
          }
        ]);
      })
      .finally(() => setBusy(false));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    sendMessage(text);
  }

  function handleSuggestionClick(suggestion: string) {
    sendMessage(suggestion);
  }


  return (
    <section className="chat-page">
      <div className="chat-panel">
        <div className="chat-limit">
          <span className="tag">{remaining} chats left today</span>
        </div>
        <div className="chat-messages" aria-live="polite">
          {messages.map((message) => (
            <div
              className={message.role === "user" ? "chat-message chat-message--user" : "chat-message"}
              key={message.id}
            >
              {message.role === "bot" ? (
                <FormatMessage text={message.body} />
              ) : (
                message.body
              )}
              {message.href && (
                <Link className="button button-small" href={message.href}>
                  Open combo
                </Link>
              )}
              {message.suggestions && message.suggestions.length > 0 && (
                <div className="chat-suggestions">
                  {message.suggestions.map((s) => (
                    <button
                      key={s}
                      type="button"
                      className="chat-suggestion-chip"
                      onClick={() => handleSuggestionClick(s)}
                      disabled={busy || remaining <= 0}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
          {busy && (
            <div className="chat-message">
              <span className="chat-typing">Thinking...</span>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
        <form className="chat-input" onSubmit={handleSubmit}>
          <label htmlFor="chat-message">
            Message
            <input
              id="chat-message"
              name="message"
              disabled={!signedIn || remaining <= 0 || busy}
              value={text}
              onChange={(event) => setText(event.target.value)}
              placeholder={signedIn ? "Try: help, my stats, or type a combo..." : "Sign in to use chat"}
            />
          </label>
          <button disabled={!signedIn || remaining <= 0 || busy} type="submit">
            {busy ? "..." : "Send"}
          </button>
        </form>
      </div>
    </section>
  );
}
