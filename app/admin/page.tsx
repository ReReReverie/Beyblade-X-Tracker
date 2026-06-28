import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { ReportForm } from "@/components/report-form";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/auth/signin");
  if (session.user.role !== "ADMIN") redirect("/dashboard");

  const activeSince = new Date(Date.now() - 2 * 60 * 1000);
  const [activeUsers, totalUsers, openBugs, openRequests, reports, activity] = await Promise.all([
    prisma.visitorActivity.count({ where: { lastSeen: { gte: activeSince } } }),
    prisma.user.count(),
    prisma.report.count({ where: { kind: "BUG", status: "OPEN" } }),
    prisma.report.count({ where: { kind: "REQUEST", status: "OPEN" } }),
    prisma.report.findMany({ orderBy: { createdAt: "desc" }, take: 20, include: { reporter: { select: { name: true, username: true, email: true } } } }),
    prisma.visitorActivity.findMany({ orderBy: { lastSeen: "desc" }, take: 20 })
  ]);

  return (
    <div className="list">
      <section className="band">
        <span className="tag tag--filled">Admin</span>
        <h1>Site control</h1>
        <p>Track active visitors, pending requests, bug reports, and recent paths.</p>
      </section>
      <section className="grid">
        <div className="stat"><strong>{activeUsers}</strong><span>active now</span></div>
        <div className="stat"><strong>{totalUsers}</strong><span>registered users</span></div>
        <div className="stat"><strong>{openRequests}</strong><span>open requests</span></div>
        <div className="stat"><strong>{openBugs}</strong><span>open bugs</span></div>
      </section>
      <section className="tabs admin-layout">
        <div className="card"><ReportForm /></div>
        <div className="admin-feed">
          <section>
            <h2>Pending reports</h2>
            <div className="list">
              {reports.map((report) => (
                <div className="card" key={report.id}>
                  <span className="tag">{report.kind} - {report.status}</span>
                  <h3>{report.title}</h3>
                  <p>{report.details}</p>
                  <p className="meta">
                    By {report.reporter?.name || report.reporter?.username || report.reporter?.email || "Guest"} - {report.path || "No path"}
                  </p>
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
        </div>
      </section>
    </div>
  );
}
