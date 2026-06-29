import { redirect } from "next/navigation";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { CollapsibleComboCard } from "@/components/collapsible-combo-card";
import { ComboVisibilityForm } from "@/components/combo-visibility-form";
import { BattleForm, ComboForm, DeckForm, PartForm, PhotoForm } from "@/components/dashboard-forms";
import { DeleteButton } from "@/components/delete-button";
import { authOptions } from "@/lib/auth";
import { battlesForCombo } from "@/lib/battle-history";
import { formatManufacturer, formatPartType, formatVisibility, pct } from "@/lib/format";
import { prisma } from "@/lib/prisma";
import { comboCondition, comboWeight } from "@/lib/stats";

export const dynamic = "force-dynamic";

type DashboardTab = "log" | "parts" | "combos" | "history" | "profile";

export default async function DashboardPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/auth/signin");

  const userId = session.user.id;
  const params = await searchParams;
  const requestedTab = params.tab;
  const activeTab: DashboardTab =
    requestedTab === "parts" || requestedTab === "combos" || requestedTab === "history" || requestedTab === "profile"
      ? requestedTab
      : "log";
  const [parts, combos, followedCombos, decks, battles] = await Promise.all([
    prisma.part.findMany({
      where: { ownerId: userId },
      include: { photos: { take: 1, orderBy: { createdAt: "desc" } } },
      orderBy: { createdAt: "desc" },
      take: 60
    }),
    prisma.combo.findMany({
      where: { ownerId: userId },
      include: {
        parts: { include: { part: true }, orderBy: { role: "asc" } },
        photos: { take: 1, orderBy: { createdAt: "desc" } },
        wins: { select: { id: true } },
        battlesA: { select: { id: true } },
        battlesB: { select: { id: true } }
      },
      orderBy: { createdAt: "desc" },
      take: 40
    }),
    prisma.combo.findMany({
      where: {
        visibility: "PUBLIC",
        stars: { some: { userId } },
        NOT: { ownerId: userId }
      },
      include: {
        parts: { include: { part: true }, orderBy: { role: "asc" } },
        photos: { take: 1, orderBy: { createdAt: "desc" } },
        wins: { select: { id: true } },
        battlesA: { select: { id: true } },
        battlesB: { select: { id: true } }
      },
      orderBy: { createdAt: "desc" },
      take: 40
    }),
    prisma.deck.findMany({
      where: { OR: [{ ownerId: userId }, { visibility: "PUBLIC" }] },
      include: { slots: { include: { combo: true }, orderBy: { slot: "asc" } } },
      orderBy: { createdAt: "desc" },
      take: 60
    }),
    prisma.battle.findMany({
      where: { ownerId: userId },
      include: { comboA: true, comboB: true, winner: true, deckA: true, deckB: true, deckWinner: true },
      orderBy: { playedAt: "desc" },
      take: 240
    })
  ]);

  const blades = parts.filter((part) => part.type === "BLADE");
  const ratchets = parts.filter((part) => part.type === "RATCHET");
  const bits = parts.filter((part) => part.type === "BIT");
  const options = [...combos, ...followedCombos].map((combo) => ({ id: combo.id, name: combo.name }));
  const deckOptions = decks.map((deck) => ({ id: deck.id, name: deck.name }));
  const partOptions = parts.map((part) => ({ id: part.id, name: `${part.name} (${formatPartType(part.type)})` }));
  const tabLinks: Array<{ id: DashboardTab; label: string }> = [
    { id: "log", label: "Log" },
    { id: "parts", label: "Parts" },
    { id: "combos", label: "Combos" },
    { id: "history", label: "History" },
    { id: "profile", label: "Profile" }
  ];

  return (
    <div className="list">
      <section className="band">
        <h1>Dashboard</h1>
        <p>
          Manage your measured parts, photos, combos, and match logs.
          {session.user.role === "ADMIN" ? " Signed in as admin." : ""}
        </p>
      </section>
      <nav className="dashboard-tabs" aria-label="Dashboard sections">
        {tabLinks.map((tab) => (
          <Link className={activeTab === tab.id ? "button dashboard-tab dashboard-tab--active" : "button secondary dashboard-tab"} href={`/dashboard?tab=${tab.id}`} key={tab.id}>
            {tab.label}
          </Link>
        ))}
      </nav>
      {activeTab === "log" ? (
        <section className="grid">
          <div className="card"><PartForm /></div>
          <div className="card">
            <ComboForm
              blades={blades.map((p) => ({ id: p.id, name: p.name }))}
              ratchets={ratchets.map((p) => ({ id: p.id, name: p.name }))}
              bits={bits.map((p) => ({ id: p.id, name: p.name }))}
            />
          </div>
          <div className="card"><DeckForm combos={combos.map((combo) => ({ id: combo.id, name: combo.name }))} /></div>
          <div className="card"><BattleForm combos={options} decks={deckOptions} /></div>
          <div className="card"><PhotoForm parts={partOptions} combos={options} /></div>
        </section>
      ) : null}
      {activeTab === "parts" ? (
        <section>
          <h2>Your parts</h2>
          <div className="list">
            {parts.map((part) => (
              <div className="card part-row" key={part.id}>
                <div>
                  <strong>{part.name}</strong>
                  <p className="meta">
                    {formatPartType(part.type)} - {formatManufacturer(part.manufacturer)} - {Number(part.weightGrams).toFixed(2)} g - {Number(part.conditionRating)}/10 - {formatVisibility(part.visibility)}
                  </p>
                </div>
                <span className="pill">{part.photos.length} photo</span>
                <DeleteButton endpoint="parts" id={part.id} label="Delete part" />
              </div>
            ))}
          </div>
        </section>
      ) : null}
      {activeTab === "combos" ? (
        <div className="list">
          <section>
            <h2>Your combos</h2>
            <div className="grid">
              {combos.map((combo) => {
                const wins = combo.wins.length;
                const total = combo.battlesA.length + combo.battlesB.length;
                return (
                  <CollapsibleComboCard comboId={combo.id} battles={battlesForCombo(combo.id, battles)} key={combo.id}>
                    {combo.photos[0] ? <img className="photo" src={combo.photos[0].url} alt="" /> : null}
                    <h3>{combo.name}</h3>
                    <p className="meta">
                      {comboWeight(combo).toFixed(2)} g - Condition {comboCondition(combo)}/10 - {wins}-{total - wins} ({pct(wins, total)}) - {formatVisibility(combo.visibility)}
                    </p>
                    <ComboVisibilityForm comboId={combo.id} initialVisibility={combo.visibility} />
                    <DeleteButton endpoint="combos" id={combo.id} label="Delete" />
                  </CollapsibleComboCard>
                );
              })}
            </div>
          </section>
          <section>
            <h2>Your decks</h2>
            <div className="grid">
              {decks.filter((deck) => deck.ownerId === userId).map((deck) => (
                <div className="card" key={deck.id}>
                  <h3>{deck.name}</h3>
                  <p className="meta">{formatVisibility(deck.visibility)}</p>
                  <p className="meta">{deck.slots.map((slot) => slot.combo.name).join(" / ")}</p>
                </div>
              ))}
            </div>
          </section>
        </div>
      ) : null}
      {activeTab === "history" ? (
        <section>
          <h2>Recent battles</h2>
          <div className="list">
            {battles.slice(0, 30).map((battle) => (
              <div className="card" key={battle.id}>
                <strong>
                  {battle.format === "THREE_V_THREE"
                    ? `${battle.deckA?.name || "Deck A"} vs ${battle.deckB?.name || "Deck B"}`
                    : `${battle.comboA?.name || "Combo A"} vs ${battle.comboB?.name || "Combo B"}`}
                </strong>
                <p className="meta">
                  Winner: {battle.format === "THREE_V_THREE" ? battle.deckWinner?.name : battle.winner?.name} - {formatVisibility(battle.visibility)}
                </p>
              </div>
            ))}
          </div>
        </section>
      ) : null}
      {activeTab === "profile" ? (
        <section className="list">
          <div className="card">
            <h2>Profile</h2>
            <p className="meta">{session.user.name || session.user.email || "Signed in user"}</p>
            <p>{combos.length} posted combo{combos.length === 1 ? "" : "s"} - {followedCombos.length} followed combo{followedCombos.length === 1 ? "" : "s"}</p>
          </div>
          <section>
            <h2>Followed combos</h2>
            {followedCombos.length ? (
              <div className="grid">
                {followedCombos.map((combo) => {
                  const wins = combo.wins.length;
                  const total = combo.battlesA.length + combo.battlesB.length;
                  return (
                    <CollapsibleComboCard comboId={combo.id} battles={battlesForCombo(combo.id, battles)} key={combo.id}>
                      {combo.photos[0] ? <img className="photo" src={combo.photos[0].url} alt="" /> : null}
                      <h3>{combo.name}</h3>
                      <p className="meta">
                        {comboWeight(combo).toFixed(2)} g - Condition {comboCondition(combo)}/10 - {wins}-{total - wins} ({pct(wins, total)})
                      </p>
                      <span className="pill">Tracked combo</span>
                    </CollapsibleComboCard>
                  );
                })}
              </div>
            ) : (
              <p className="meta">Follow public combos to track them here.</p>
            )}
          </section>
        </section>
      ) : null}
    </div>
  );
}
