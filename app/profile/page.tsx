import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { CareerDeleteButton, CareerEntryForm, ProfileEditForm } from "@/components/profile-forms";
import { PutComboButton } from "@/components/put-combo-button";
import { StarButton } from "@/components/star-button";
import { authOptions } from "@/lib/auth";
import { formatManufacturer, formatVisibility, pct } from "@/lib/format";
import { prisma } from "@/lib/prisma";
import { comboCondition, comboWeight } from "@/lib/stats";

export const dynamic = "force-dynamic";

type ProfileCombo = Awaited<ReturnType<typeof getProfileCombos>>[number];
type ProfileTab = "overview" | "posts" | "starred" | "lineup" | "career";

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
        const comboWeightValue = comboWeight(combo);
        return (
          <div className="card" key={combo.id}>
            {combo.photos[0] ? <img className="photo" src={combo.photos[0].url} alt="" /> : null}
            <Link href={`/combos/${combo.id}`}><h3>{combo.name}</h3></Link>
            <p className="meta">Creator: {combo.owner.name || combo.owner.username || "Unknown"}</p>
            <p className="meta">
              {comboWeightValue !== null ? `${comboWeightValue.toFixed(2)} g` : "Weight unavailable"} - Condition {comboCondition(combo)}/10 - {wins}-{total - wins} ({pct(wins, total)}) - {formatVisibility(combo.visibility)}
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

export default async function ProfilePage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/auth/signin");

  const userId = session.user.id;
  const params = await searchParams;
  const requestedTab = params.tab;
  const activeTab: ProfileTab =
    requestedTab === "posts" || requestedTab === "starred" || requestedTab === "lineup" || requestedTab === "career"
      ? requestedTab
      : "overview";
  const [user, myCombos, starredCombos, putCombos, careerEntries] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId }, select: { name: true, email: true, image: true, bio: true } }),
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
    }),
    prisma.careerEntry.findMany({ where: { userId }, orderBy: { playedAt: "desc" }, take: 100 })
  ]);
  const starsAcrossMyCombos = myCombos.reduce((total, combo) => total + combo.stars.length, 0);
  const careerWins = careerEntries.reduce((total, entry) => total + entry.wins, 0);
  const careerLosses = careerEntries.reduce((total, entry) => total + entry.losses, 0);
  const careerDraws = careerEntries.reduce((total, entry) => total + entry.draws, 0);
  const tabLinks: Array<{ id: ProfileTab; label: string }> = [
    { id: "overview", label: "Overview" },
    { id: "posts", label: "Posts" },
    { id: "starred", label: "Starred" },
    { id: "lineup", label: "Lineup" },
    { id: "career", label: "Career" }
  ];

  return (
    <div className="list">
      <section className="band">
        <span className="tag tag--filled">Profile</span>
        <div className="profile-head">
          {user?.image ? <img className="profile-avatar" src={user.image} alt="" /> : <div className="profile-avatar" aria-hidden="true" />}
          <div>
            <h1>{user?.name || session.user.name || session.user.email || "My profile"}</h1>
            {user?.bio ? <p>{user.bio}</p> : <p className="meta">Add a short description to introduce your Beyblade career.</p>}
          </div>
        </div>
        <div className="grid stats-grid">
          <div className="stat"><strong>{myCombos.length}</strong><span>My combos</span></div>
          <div className="stat"><strong>{starsAcrossMyCombos}</strong><span>Stars across my combos</span></div>
          <div className="stat"><strong>{starredCombos.length}</strong><span>Starred combos</span></div>
          <div className="stat"><strong>{careerWins}-{careerLosses}{careerDraws ? `-${careerDraws}` : ""}</strong><span>Career record</span></div>
        </div>
      </section>
      <nav className="dashboard-tabs" aria-label="Profile sections">
        {tabLinks.map((tab) => (
          <Link className={activeTab === tab.id ? "button dashboard-tab dashboard-tab--active" : "button secondary dashboard-tab"} href={`/profile?tab=${tab.id}`} key={tab.id}>
            {tab.label}
          </Link>
        ))}
      </nav>
      {activeTab === "overview" ? (
        <section className="tabs">
          <div className="card"><ProfileEditForm name={user?.name} image={user?.image} bio={user?.bio} /></div>
          <div className="list">
            <div className="card">
              <h2>Snapshot</h2>
              <p>{myCombos.length} posted combo{myCombos.length === 1 ? "" : "s"} - {putCombos.length} lineup put{putCombos.length === 1 ? "" : "s"}</p>
              <p>{careerEntries.length} tournament record{careerEntries.length === 1 ? "" : "s"} logged.</p>
            </div>
            <div className="card">
              <h2>Account data</h2>
              <p className="danger">Inactive accounts may be deleted after 90 days. Export your data if you want a backup.</p>
              <a className="button secondary" href="/api/profile/export" download>
                Export my data
              </a>
            </div>
          </div>
        </section>
      ) : null}
      {activeTab === "posts" ? <section className="list">
        <h2>My posts / combos</h2>
        <ComboList combos={myCombos} userId={userId} empty="You have not created any combos yet." />
      </section> : null}
      {activeTab === "starred" ? <section className="list">
        <h2>Combos I starred</h2>
        <ComboList combos={starredCombos} userId={userId} empty="You have not starred any combos yet." />
      </section> : null}
      {activeTab === "lineup" ? <section className="list">
        <h2>Combos in my lineup</h2>
        <ComboList combos={putCombos} userId={userId} empty="Use Put combo on a public combo to add it here." />
      </section> : null}
      {activeTab === "career" ? (
        <section className="tabs">
          <div className="card"><CareerEntryForm /></div>
          <div className="list">
            <h2>Career</h2>
            {careerEntries.length ? careerEntries.map((entry) => (
              <div className="card career-row" key={entry.id}>
                <div>
                  <span className="tag">{entry.playedAt.toLocaleDateString()}</span>
                  <h3>{entry.tournamentName}</h3>
                  <p className="meta">{entry.wins}-{entry.losses}{entry.draws ? `-${entry.draws}` : ""}{entry.placement ? ` - ${entry.placement}` : ""}</p>
                  {entry.notes ? <p>{entry.notes}</p> : null}
                </div>
                <CareerDeleteButton id={entry.id} />
              </div>
            )) : <p className="meta">No tournament records yet.</p>}
          </div>
        </section>
      ) : null}
    </div>
  );
}
