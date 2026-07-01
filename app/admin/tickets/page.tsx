import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function AdminTicketsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/auth/signin");
  if (session.user.role !== "ADMIN") redirect("/dashboard");

  const reports = await prisma.report.findMany({
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    take: 100,
    include: { reporter: { select: { name: true, username: true, email: true } } }
  });

  return (
    <div className="list">
      <section className="band">
        <span className="tag tag--filled">Admin</span>
        <h1>Tickets</h1>
        <p>Review bug reports and feature requests from users.</p>
        <div className="navlinks">
          <Link className="button secondary" href="/admin">Admin overview</Link>
        </div>
      </section>
      <section className="list">
        {reports.length ? reports.map((report) => (
          <div className="card" key={report.id}>
            <span className="tag">{report.kind} - {report.status}</span>
            <h3>{report.title}</h3>
            <p>{report.details}</p>
            <p className="meta">
              By {report.reporter?.name || report.reporter?.username || report.reporter?.email || "Guest"} - {report.path || "No path"} - {report.createdAt.toLocaleString()}
            </p>
          </div>
        )) : <p className="meta">No tickets yet.</p>}
      </section>
    </div>
  );
}
