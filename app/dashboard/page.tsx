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
    <div className="dashboard">
      <section className="dashboard-head">
        <div>
          <span className="tag tag--filled">Dashboard</span>
          <h1>Garage</h1>
          {session.user.role === "ADMIN" ? <p className="meta">Signed in as admin.</p> : null}
        </div>
        <div className="dashboard-stats">
          <div><strong>{parts.length}</strong><span>Parts</span></div>
          <div><strong>{combos.length}</strong><span>Combos</span></div>
          <div><strong>{battles.length}</strong><span>Battles</span></div>
        </div>
      </section>
      <section className="dashboard-tools">
          <div className="card dashboard-card"><PartForm /></div>
          <div className="card dashboard-card">
            <ComboForm
              blades={blades.map((p) => ({ id: p.id, name: p.name }))}
              ratchets={ratchets.map((p) => ({ id: p.id, name: p.name }))}
              bits={bits.map((p) => ({ id: p.id, name: p.name }))}
            />
          </div>
          <div className="card dashboard-card"><BattleForm combos={options} /></div>
          <div className="card dashboard-card"><PhotoForm parts={partOptions} combos={options} /></div>
      </section>
      <section className="dashboard-content">
          <section className="dashboard-panel">
            <h2>Your parts</h2>
            <div className="compact-list">
              {parts.map((part) => (
                <div className="compact-row" key={part.id}>
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
          <section className="dashboard-panel">
            <h2>Your combos</h2>
            <div className="compact-grid">
              {combos.map((combo) => {
                const wins = combo.wins.length;
                const total = combo.battlesA.length + combo.battlesB.length;
                return (
                  <div className="compact-card" key={combo.id}>
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
          <section className="dashboard-panel">
            <h2>Recent battles</h2>
            <div className="compact-list">
              {battles.slice(0, 30).map((battle) => (
                <div className="compact-row" key={battle.id}>
                  <strong>{battle.comboA.name} vs {battle.comboB.name}</strong>
                  <p className="meta">Winner: {battle.winner.name} - {formatVisibility(battle.visibility)}</p>
                </div>
              ))}
            </div>
          </section>
      </section>
    </div>
  );
}
