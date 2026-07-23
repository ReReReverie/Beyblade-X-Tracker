import { redirect } from "next/navigation";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { AdminComboDeleteButton } from "@/components/admin-combo-delete-button";
import { FeaturedComboDeleteButton } from "@/components/featured-combo-delete-button";
import { FeaturedComboForm } from "@/components/featured-combo-form";
import { authOptions } from "@/lib/auth";
import { getChallongeUsage } from "@/lib/challonge-usage";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/");
  if (session.user.role !== "ADMIN") redirect("/dashboard");

  const activeSince = new Date(Date.now() - 2 * 60 * 1000);
  const [activeUsers, totalUsers, openBugs, openRequests, challongeUsage, activity, publicCombos, adminCombos, features, users] = await Promise.all([
    prisma.visitorActivity.count({ where: { lastSeen: { gte: activeSince } } }),
    prisma.user.count(),
    prisma.report.count({ where: { kind: "BUG", status: "OPEN" } }),
    prisma.report.count({ where: { kind: "REQUEST", status: "OPEN" } }),
    getChallongeUsage(session.user.id, true),
    prisma.visitorActivity.findMany({ orderBy: { lastSeen: "desc" }, take: 20 }),
    prisma.combo.findMany({ where: { visibility: "PUBLIC" }, orderBy: { createdAt: "desc" }, take: 100, select: { id: true, name: true } }),
    prisma.combo.findMany({
      orderBy: { createdAt: "desc" },
      take: 40,
      select: {
        id: true,
        name: true,
        visibility: true,
        createdAt: true,
        owner: { select: { name: true, username: true, email: true } },
        _count: { select: { battlesA: true, battlesB: true, wins: true, deckSlots: true } }
      }
    }),
    prisma.featuredCombo.findMany({
      orderBy: [{ endsAt: "desc" }, { createdAt: "desc" }],
      take: 24,
      include: { combo: { select: { name: true } } }
    }),
    prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      take: 60,
      select: {
        id: true,
        name: true,
        username: true,
        email: true,
        role: true,
        createdAt: true,
        _count: { select: { parts: true, combos: true, decks: true, battles: true, comments: true, careerEntries: true } }
      }
    })
  ]);

  return (
    <div className="list">
      <section className="band">
        <span className="tag tag--filled">Admin</span>
        <h1>Site control</h1>
        <p>Track active visitors, pending requests, bug reports, and recent paths.</p>
        <div className="navlinks">
          <Link className="button secondary" href="/admin/tickets" prefetch={false}>Tickets</Link>
        </div>
      </section>
      <section className="tabs admin-layout">
        <div className="list">
          <div className="card">
            <h2>Stats</h2>
            <p>{activeUsers} active now - {totalUsers} total users</p>
            <p>{openBugs} open bugs - {openRequests} open requests</p>
            <p>Challonge API: {challongeUsage.global.remaining}/{challongeUsage.global.limit} global remaining this month</p>
          </div>
          <div className="card"><FeaturedComboForm combos={publicCombos} /></div>
        </div>
        <div className="admin-feed">
          <section>
            <h2>Featured placements</h2>
            <div className="list">
              {features.map((feature) => (
                <div className="card part-row" key={feature.id}>
                  <div>
                    <span className="tag">{feature.slot}</span>
                    <h3>{feature.title}</h3>
                    <p className="meta">{feature.combo.name}{feature.sponsorName ? ` - ${feature.sponsorName}` : ""}</p>
                    <p className="meta">{feature.startsAt.toLocaleString()} to {feature.endsAt.toLocaleString()}</p>
                  </div>
                  <FeaturedComboDeleteButton id={feature.id} />
                </div>
              ))}
            </div>
          </section>
          <section>
            <h2>Combo cleanup</h2>
            <div className="list">
              {adminCombos.map((combo) => (
                <div className="card part-row" key={combo.id}>
                  <div>
                    <span className="tag">{combo.visibility}</span>
                    <h3>{combo.name}</h3>
                    <p className="meta">
                      By {combo.owner.name || combo.owner.username || combo.owner.email || "Unknown"} - {combo.createdAt.toLocaleString()}
                    </p>
                    <p className="meta">
                      Battles {combo._count.battlesA + combo._count.battlesB + combo._count.wins} - Deck slots {combo._count.deckSlots}
                    </p>
                  </div>
                  <AdminComboDeleteButton id={combo.id} name={combo.name} />
                </div>
              ))}
            </div>
          </section>

          <section>
            <h2>Recent activity</h2>
            <div className="list">
              {activity.map((item) => (
                <div className="card part-row" key={item.id}>
                  <strong>{item.path}</strong>
                  <span className="meta">{item.lastSeen.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </section>

          <section>
            <h2>Recent users</h2>
            <div className="list">
              {users.map((user) => (
                <div className="card part-row" key={user.id}>
                  <div>
                    <span className="tag">{user.role}</span>
                    <h3>{user.name || user.username || user.email || "No name"}</h3>
                    <p className="meta">
                      Parts {user._count.parts} - Combos {user._count.combos} - Battles {user._count.battles} - Joined {user.createdAt.toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </section>
    </div>
  );
}

