import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { WRGraph } from "@/components/wr-graph";
import { BattleForm, ComboForm, PartForm, PhotoForm } from "@/components/dashboard-forms";
import { authOptions } from "@/lib/auth";
import { battlesForCombo } from "@/lib/battle-history";
import { formatManufacturer, formatPartType, formatVisibility, pct } from "@/lib/format";
import { prisma } from "@/lib/prisma";
import { comboCondition, comboWeight } from "@/lib/stats";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/auth/signin");

  const userId = session.user.id;
  const [parts, combos, battles] = await Promise.all([
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
    prisma.battle.findMany({
      where: { ownerId: userId },
      include: { comboA: true, comboB: true, winner: true },
      orderBy: { playedAt: "desc" },
      take: 240
    })
  ]);

  const blades = parts.filter((part) => part.type === "BLADE");
  const ratchets = parts.filter((part) => part.type === "RATCHET");
  const bits = parts.filter((part) => part.type === "BIT");
  const options = combos.map((combo) => ({ id: combo.id, name: combo.name }));
  const partOptions = parts.map((part) => ({ id: part.id, name: `${part.name} (${formatPartType(part.type)})` }));

  return (
    <div className="list">
      <section className="band">
        <h1>Dashboard</h1>
        <p>
          Manage your measured parts, photos, combos, and match logs.
          {session.user.role === "ADMIN" ? " Signed in as admin." : ""}
        </p>
      </section>
      <section className="tabs">
        <div className="list">
          <div className="card"><PartForm /></div>
          <div className="card">
            <ComboForm
              blades={blades.map((p) => ({ id: p.id, name: p.name }))}
              ratchets={ratchets.map((p) => ({ id: p.id, name: p.name }))}
              bits={bits.map((p) => ({ id: p.id, name: p.name }))}
            />
          </div>
          <div className="card"><BattleForm combos={options} /></div>
          <div className="card"><PhotoForm parts={partOptions} combos={options} /></div>
        </div>
        <div className="list">
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
                </div>
              ))}
            </div>
          </section>
          <section>
            <h2>Your combos</h2>
            <div className="grid">
              {combos.map((combo) => {
                const wins = combo.wins.length;
                const total = combo.battlesA.length + combo.battlesB.length;
                return (
                  <div className="card" key={combo.id}>
                    {combo.photos[0] ? <img className="photo" src={combo.photos[0].url} alt="" /> : null}
                    <h3>{combo.name}</h3>
                    <p className="meta">
                      {comboWeight(combo).toFixed(2)} g - Condition {comboCondition(combo)}/10 - {wins}-{total - wins} ({pct(wins, total)}) - {formatVisibility(combo.visibility)}
                    </p>
                    <WRGraph comboId={combo.id} battles={battlesForCombo(combo.id, battles)} />
                  </div>
                );
              })}
            </div>
          </section>
          <section>
            <h2>Recent battles</h2>
            <div className="list">
              {battles.slice(0, 30).map((battle) => (
                <div className="card" key={battle.id}>
                  <strong>{battle.comboA.name} vs {battle.comboB.name}</strong>
                  <p className="meta">Winner: {battle.winner.name} - {formatVisibility(battle.visibility)}</p>
                </div>
              ))}
            </div>
          </section>
        </div>
      </section>
    </div>
  );
}
