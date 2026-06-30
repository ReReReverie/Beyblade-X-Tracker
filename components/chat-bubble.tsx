import Link from "next/link";

export function ChatBubble() {
  return (
    <Link className="chat-bubble" href="/chat" aria-label="Open chat">
      <span className="chat-bubble__dot" aria-hidden="true" />
      <span>Chat</span>
    </Link>
  );
}
