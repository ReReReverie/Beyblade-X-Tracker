import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { ProfileClient } from "./profile-client";
import { authOptions } from "@/lib/auth";
import { parseProfileTab } from "@/lib/profile-data";

export const dynamic = "force-dynamic";

export default async function ProfilePage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/auth/signin");

  const params = await searchParams;
  const activeTab = parseProfileTab(params.tab);
  const initialData = {
    user: {
      id: session.user.id,
      name: session.user.name,
      username: session.user.username,
      email: session.user.email,
      image: session.user.image
    },
    stats: { comboCount: 0, putCount: 0, careerCount: 0 }
  };

  return <ProfileClient initialData={initialData} initialTab={activeTab} sessionName={session.user.name || session.user.username || session.user.email} initialReady={false} />;
}
