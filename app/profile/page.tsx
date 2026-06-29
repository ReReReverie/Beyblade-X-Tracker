import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { PutComboButton } from "@/components/put-combo-button";
import { StarButton } from "@/components/star-button";
import { authOptions } from "@/lib/auth";
import { formatManufacturer, formatVisibility, pct } from "@/lib/format";
import { prisma } from "@/lib/prisma";
import { comboCondition, comboWeight } from "@/lib/stats";

export const dynamic = "force-dynamic";

type ProfileCombo = Awaited<ReturnType<typeof getProfileCombos>>[number];

async function getProfileCombos(userId: string) {
  return prisma.combo.findMany({
    where: { ownerId: userId },
    include: {
      owner: { select: { name: true, username: true } },
      parts: { include: { part: true }, orderBy: { role: "asc" } },
      photos: { take: 1, orderBy: { createdAt: "desc" } },
      stars: { select: { userId: true } },
      puts: { select: { userId: true } },
      wins: { select: { id: true } },
      battlesA: { select: { id: true } },
      battlesB: { select: { id: true } }
    },
    orderBy: { createdAt: "desc" },
    take: 60
  });
}

function ComboList({ combos, userId, empty }: { combos: ProfileCombo[]; userId: string; empty: string }) {
  if (!combos.length) return <p className="meta">{empty}</p>;

  return (
    <div className="grid">
      {combos.map((combo) => {
        const wins = combo.wins.length;
        const total = combo.battlesA.length + combo.battlesB.length;
        return (
          <div className="card" key={combo.id}>
            {combo.photos[0] ? <img className="photo" src={combo.photos[0].url} alt="" /> : null}
            <Link href={`/combos/${combo.id}`}><h3>{combo.name}</h3></Link>
            <p className="meta">Creator: {combo.owner.name || combo.owner.username || "Unknown"}</p>
            <p className="meta">
              {comboWeight(combo).toFixed(2)} g - Condition {comboCondition(combo)}/10 - {wins}-{total - wins} ({pct(wins, total)}) - {formatVisibility(combo.visibility)}
            </p>
            <p className="meta">
              {combo.parts.map((entry) => `${entry.part.name} (${formatManufacturer(entry.part.manufacturer)})`).join(" / ")}
            </p>
            <StarButton
              comboId={combo.id}
              initialCount={combo.stars.length}
              initiallyStarred={combo.stars.some((star) => star.userId === userId)}
            />
            <PutComboButton
              comboId={combo.id}
              initialCount={combo.puts.length}
              initiallyPut={combo.puts.some((put) => put.userId === userId)}
            />
          </div>
        );
      })}
    </div>
  );
}

export default async function ProfilePage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/auth/signin");

  const userId = session.user.id;
  const [myCombos, starredCombos, putCombos] = await Promise.all([
    getProfileCombos(userId),
    prisma.combo.findMany({
      where: { stars: { some: { userId } }, visibility: "PUBLIC" },
      include: {
        owner: { select: { name: true, username: true } },
        parts: { include: { part: true }, orderBy: { role: "asc" } },
        photos: { where: { visibility: "PUBLIC" }, take: 1 },
        stars: { select: { userId: true } },
        puts: { select: { userId: true } },
        wins: { where: { visibility: "PUBLIC" }, select: { id: true } },
        battlesA: { where: { visibility: "PUBLIC" }, select: { id: true } },
        battlesB: { where: { visibility: "PUBLIC" }, select: { id: true } }
      },
      orderBy: { createdAt: "desc" },
      take: 60
    }),
    prisma.combo.findMany({
      where: { puts: { some: { userId } }, visibility: "PUBLIC" },
      include: {
        owner: { select: { name: true, username: true } },
        parts: { include: { part: true }, orderBy: { role: "asc" } },
        photos: { where: { visibility: "PUBLIC" }, take: 1 },
        stars: { select: { userId: true } },
        puts: { select: { userId: true } },
        wins: { where: { visibility: "PUBLIC" }, select: { id: true } },
        battlesA: { where: { visibility: "PUBLIC" }, select: { id: true } },
        battlesB: { where: { visibility: "PUBLIC" }, select: { id: true } }
      },
      orderBy: { createdAt: "desc" },
      take: 60
    })
  ]);
  const starsAcrossMyCombos = myCombos.reduce((total, combo) => total + combo.stars.length, 0);

  return (
    <div className="list">
      <section className="band">
        <span className="tag tag--filled">Profile</span>
        <h1>{session.user.name || session.user.email || "My profile"}</h1>
        <div className="grid stats-grid">
          <div className="stat"><strong>{myCombos.length}</strong><span>My combos</span></div>
          <div className="stat"><strong>{starsAcrossMyCombos}</strong><span>Stars across my combos</span></div>
          <div className="stat"><strong>{starredCombos.length}</strong><span>Starred combos</span></div>
          <div className="stat"><strong>{putCombos.length}</strong><span>Lineup puts</span></div>
        </div>
      </section>
      <section className="list">
        <h2>My posts / combos</h2>
        <ComboList combos={myCombos} userId={userId} empty="You have not created any combos yet." />
      </section>
      <section className="list">
        <h2>Combos I starred</h2>
        <ComboList combos={starredCombos} userId={userId} empty="You have not starred any combos yet." />
      </section>
      <section className="list">
        <h2>Combos in my lineup</h2>
        <ComboList combos={putCombos} userId={userId} empty="Use Put combo on a public combo to add it here." />
      </section>
    </div>
  );
}
