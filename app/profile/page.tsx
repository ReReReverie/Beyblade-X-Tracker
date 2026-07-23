import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getProfilePayload, parseProfileTab } from "@/lib/profile-data";
import ProfileClient from "./profile-client";

export const dynamic = "force-dynamic";

export default async function ProfilePage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/");

  const { tab } = await searchParams;
  const activeTab = parseProfileTab(tab || null);
  const initialData = await getProfilePayload(session.user.id, activeTab, session.user.role);

  return (
    <ProfileClient
      initialData={initialData}
      initialTab={activeTab}
      sessionName={session.user.name}
    />
  );
}
