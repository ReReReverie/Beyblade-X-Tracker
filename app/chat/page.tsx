import { ChatBox } from "@/components/chat-box";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";

export const dynamic = "force-dynamic";

function startOfUtcDay(date = new Date()) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

export default async function ChatPage() {
  const sessionUser = await getSessionUser();
  const usage = sessionUser
    ? await prisma.chatUsage.findUnique({ where: { userId_day: { userId: sessionUser.user.id, day: startOfUtcDay() } } })
    : null;
  const remaining = Math.max(10 - (usage?.count || 0), 0);

  return (
    <div className="list">
      <section className="band">
        <span className="tag tag--filled">Assistant</span>
        <h1>Tracker chat</h1>
        <p>Your all-in-one Beyblade X assistant. Create combos, log battles, check stats, manage decks, and browse your inventory — all from chat. Type <strong>help</strong> to see every command.</p>
      </section>
      <ChatBox signedIn={Boolean(sessionUser)} initialRemaining={remaining} />
    </div>
  );
}
