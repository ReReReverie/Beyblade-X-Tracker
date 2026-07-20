import { redirect } from "next/navigation";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { CollapsibleComboCard } from "@/components/collapsible-combo-card";
import { ComboPartEditForm } from "@/components/combo-part-edit-form";
import { ComboVisibilityForm } from "@/components/combo-visibility-form";
import { BattleForm, ComboForm, DeckForm, PhotoForm } from "@/components/dashboard-forms";
import { PartCard } from "@/components/part-card";
import { DeleteButton } from "@/components/delete-button";
import { authOptions } from "@/lib/auth";
import { battlesForCombo } from "@/lib/battle-history";
import { formatPartType, formatVisibility, pct } from "@/lib/format";
import { prisma } from "@/lib/prisma";
import { comboCondition, comboWeight } from "@/lib/stats";

export const dynamic = "force-dynamic";

type DashboardTab = "log" | "parts" | "combos" | "history" | "profile";

const dashboardComboInclude = {
  parts: { include: { part: { include: { catalogPart: true } } }, orderBy: { role: "asc" as const } },
  photos: { take: 1, orderBy: { createdAt: "desc" as const } },
  _count: { select: { wins: true, battlesA: true, battlesB: true } }
};

function serializePartForClient(part: any) {
  return {
    id: part.id,
    name: part.name,
    type: part.type,
    manufacturer: part.manufacturer,
    weightGrams: part.weightGrams == null ? null : Number(part.weightGrams),
    conditionRating: Number(part.conditionRating),
    visibility: part.visibility,
    notes: part.notes,
    photos: (part.photos || []).map((photo: any) => ({ id: photo.id, url: photo.url }))
  };
}

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
  const [partsCount, combosCount, battlesCount] = await Promise.all([
    prisma.part.count({ where: { ownerId: userId } }),
    prisma.combo.count({ where: { ownerId: userId } }),
    prisma.battle.count({ where: { ownerId: userId } })
  ]);

  let parts: any[] = [];
  let combos: any[] = [];
  let followedCombos: any[] = [];
  let decks: any[] = [];
  let battles: any[] = [];
  let catalogParts: any[] = [];
  let followedCount = 0;

  if (activeTab === "log") {
    [parts, combos, decks, catalogParts] = await Promise.all([
      prisma.part.findMany({
        where: { ownerId: userId },
        include: { photos: { take: 1, orderBy: { createdAt: "desc" } } },
        orderBy: { createdAt: "desc" },
        take: 60
      }),
      prisma.combo.findMany({
        where: { ownerId: userId },
        select: {
          id: true,
          name: true,
          parts: { include: { part: true }, orderBy: { role: "asc" as const } }
        },
        orderBy: { createdAt: "desc" },
        take: 40
      }),
      prisma.deck.findMany({
        where: { ownerId: userId },
        include: { slots: { include: { combo: true }, orderBy: { slot: "asc" } } },
        orderBy: { createdAt: "desc" },
        take: 60
      }),
      prisma.partCatalog.findMany({
        orderBy: [{ metaTier: "asc" }, { type: "asc" }, { name: "asc" }]
      })
    ]);
  } else if (activeTab === "parts") {
    parts = await prisma.part.findMany({
      where: { ownerId: userId },
      include: { photos: { take: 1, orderBy: { createdAt: "desc" } } },
      orderBy: { createdAt: "desc" },
      take: 60
    });
  } else if (activeTab === "combos") {
    [combos, decks, battles] = await Promise.all([
      prisma.combo.findMany({
        where: { ownerId: userId },
        include: dashboardComboInclude,
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
        select: { id: true, comboAId: true, comboBId: true, winnerId: true, playedAt: true },
        orderBy: { playedAt: "desc" },
        take: 240
      })
    ]);
  } else if (activeTab === "history") {
    battles = await prisma.battle.findMany({
      where: { ownerId: userId },
      include: { comboA: true, comboB: true, winner: true, deckA: true, deckB: true, deckWinner: true },
      orderBy: { playedAt: "desc" },
      take: 30
    });
  } else if (activeTab === "profile") {
    [followedCombos, combos, followedCount] = await Promise.all([
      prisma.combo.findMany({
        where: {
          visibility: "PUBLIC",
          stars: { some: { userId } },
          NOT: { ownerId: userId }
        },
        include: dashboardComboInclude,
        orderBy: { createdAt: "desc" },
        take: 40
      }),
      prisma.combo.findMany({
        where: { ownerId: userId },
        select: {
          id: true,
          name: true,
          parts: { include: { part: true }, orderBy: { role: "asc" as const } }
        },
        orderBy: { createdAt: "desc" },
        take: 40
      }),
      prisma.comboStar.count({ where: { userId, combo: { visibility: "PUBLIC", NOT: { ownerId: userId } } } })
    ]);
  }

  const blades = catalogParts.filter((part) => part.type === "BLADE").map((part) => ({
    id: part.id,
    name: part.name,
    series: part.series,
    ratchetIntegration: part.ratchetIntegration,
    role: part.role,
    manufacturer: part.manufacturer
  }));
  const ratchets = catalogParts.filter((part) => part.type === "RATCHET").map((part) => ({
    id: part.id,
    name: part.name,
    series: part.series,
    ratchetIntegration: part.ratchetIntegration,
    role: part.role,
    manufacturer: part.manufacturer
  }));
  const bits = catalogParts.filter((part) => part.type === "BIT").map((part) => ({
    id: part.id,
    name: part.name,
    series: part.series,
    ratchetIntegration: part.ratchetIntegration,
    role: part.role,
    manufacturer: part.manufacturer
  }));
  const options = [...combos, ...followedCombos].map((combo) => ({ id: combo.id, name: combo.name }));
  const ownedDecks = decks.filter((deck) => deck.ownerId === userId);
  const deckOptions = ownedDecks.map((deck) => ({ id: deck.id, name: deck.name }));
  const photoPartMap = new Map<string, { id: string; name: string }>();
  for (const part of parts) {
    photoPartMap.set(part.id, { id: part.id, name: `${part.name} (${formatPartType(part.type)})` });
  }
  for (const combo of combos) {
    for (const entry of combo.parts || []) {
      const part = entry.part;
      if (part) photoPartMap.set(part.id, { id: part.id, name: `${part.name} (${formatPartType(part.type)})` });
    }
  }
  const partOptions = Array.from(photoPartMap.values());
  const tabLinks: Array<{ id: DashboardTab; label: string }> = [
    { id: "log", label: "Log" },
    { id: "parts", label: "Parts" },
    { id: "combos", label: "Combos" },
    { id: "history", label: "History" }
  ];

  return (
    <div className="dashboard">
      <section className="dashboard-head">
        <div>
          <span className="tag tag--filled">Create</span>
          <h1>Garage</h1>
          {session.user.role === "ADMIN" ? <p className="meta">Signed in as admin.</p> : null}
        </div>
        <div className="dashboard-stats">
          <div><strong>{partsCount}</strong><span>Parts</span></div>
          <div><strong>{combosCount}</strong><span>Combos</span></div>
          <div><strong>{battlesCount}</strong><span>Battles</span></div>
        </div>
      </section>
      <nav className="dashboard-tabs" aria-label="Create sections">
        {tabLinks.map((tab) => (
          <Link className={activeTab === tab.id ? "button dashboard-tab dashboard-tab--active" : "button secondary dashboard-tab"} href={`/dashboard?tab=${tab.id}`} prefetch={false} key={tab.id}>
            {tab.label}
          </Link>
        ))}
      </nav>
      {activeTab === "log" ? (
        <section className="grid">
          <div className="card">
            <ComboForm
              blades={blades}
              ratchets={ratchets}
              bits={bits}
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
              <PartCard key={part.id} part={serializePartForClient(part)} />
            ))}
          </div>
        </section>
      ) : null}
      {activeTab === "combos" ? (
        <div className="list">
          <section>
            <h2>Your combos</h2>
            <div className="compact-grid">
              {combos.map((combo) => {
                const wins = combo._count.wins;
                const total = combo._count.battlesA + combo._count.battlesB;
                const comboWeightValue = comboWeight(combo);
                return (
                  <CollapsibleComboCard comboId={combo.id} battles={battlesForCombo(combo.id, battles)} key={combo.id}>
                    {combo.photos[0] ? <img className="photo" src={combo.photos[0].url} alt="" /> : null}
                    <h3>{combo.name}</h3>
                    <p className="meta">
                      {comboWeightValue !== null ? `${comboWeightValue.toFixed(2)} g` : "Weight unavailable"} - Condition {comboCondition(combo)}/10 - {wins}-{total - wins} ({pct(wins, total)}) - {formatVisibility(combo.visibility)}
                    </p>
                    <ComboVisibilityForm comboId={combo.id} initialVisibility={combo.visibility} />
                    <ComboPartEditForm
                      comboId={combo.id}
                      parts={combo.parts.map((entry: any) => ({
                        id: entry.part.id,
                        name: entry.part.name,
                        type: entry.part.type,
                        role: entry.role,
                        weightGrams: entry.part.weightGrams == null ? null : Number(entry.part.weightGrams),
                        manufacturer: entry.part.manufacturer,
                        catalogWeightGrams: entry.part.catalogPart?.weightGrams == null ? null : Number(entry.part.catalogPart.weightGrams),
                        catalogManufacturer: entry.part.catalogPart?.manufacturer ?? null,
                      }))}
                    />
                    <DeleteButton endpoint="combos" id={combo.id} label="Delete" />
                  </CollapsibleComboCard>
                );
              })}
            </div>
          </section>
          <section>
            <h2>Your decks</h2>
            <div className="grid">
              {ownedDecks.map((deck) => (
                <div className="card" key={deck.id}>
                  <h3>{deck.name}</h3>
                  <p className="meta">{formatVisibility(deck.visibility)}</p>
                  <p className="meta">{deck.slots.map((slot: any) => slot.combo?.name || "Missing combo").join(" / ")}</p>
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
            {battles.map((battle) => (
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
            <p className="meta">{session.user.name || session.user.username || session.user.email || "Signed in user"}</p>
            <p>{combosCount} posted combo{combosCount === 1 ? "" : "s"} - {followedCount} followed combo{followedCount === 1 ? "" : "s"}</p>
          </div>
          <section>
            <h2>Followed combos</h2>
            {followedCombos.length ? (
              <div className="grid">
                {followedCombos.map((combo) => {
                  const wins = combo._count.wins;
                  const total = combo._count.battlesA + combo._count.battlesB;
                  const comboWeightValue = comboWeight(combo);
                  return (
                    <CollapsibleComboCard comboId={combo.id} battles={[]} key={combo.id}>
                      {combo.photos[0] ? <img className="photo" src={combo.photos[0].url} alt="" /> : null}
                      <h3>{combo.name}</h3>
                      <p className="meta">
                        {comboWeightValue !== null ? `${comboWeightValue.toFixed(2)} g` : "Weight unavailable"} - Condition {comboCondition(combo)}/10 - {wins}-{total - wins} ({pct(wins, total)})
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



