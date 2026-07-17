import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { ReportForm } from "@/components/report-form";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function ReportsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/auth/signin");

  const reports = await prisma.report.findMany({
    where: { reporterId: session.user.id },
    orderBy: { createdAt: "desc" },
    take: 50
  });

  return (
    <div className="list">
      <section className="band">
        <span className="tag tag--filled">Support</span>
        <h1>Reports</h1>
        <p>Send bug reports or feature requests, then follow their status here.</p>
      </section>
      <section className="tabs">
        <div className="card">
          <ReportForm />
        </div>
        <div className="list">
          <h2>Your tickets</h2>
          {reports.length ? reports.map((report) => (
            <div className="card" key={report.id}>
              <span className="tag">{report.kind} - {report.status}</span>
              <h3>{report.title}</h3>
              <p>{report.details}</p>
              <p className="meta">{report.path || "No path"} - {report.createdAt.toLocaleString()}</p>
            </div>
          )) : <p className="meta">No tickets yet.</p>}
        </div>
      </section>
    </div>
  );
}
