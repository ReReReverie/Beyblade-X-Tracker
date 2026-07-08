import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { ProfileClient } from "./profile-client";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type ProfileTab = "overview" | "posts" | "starred" | "lineup" | "career";

function profileComboInclude(userId: string, publicOnly = false) {
  const publicWhere = publicOnly ? { visibility: "PUBLIC" as const } : undefined;
  return {
    owner: { select: { name: true, username: true } },
    parts: { include: { part: true }, orderBy: { role: "asc" as const } },
    photos: { where: publicWhere, take: 1, orderBy: { createdAt: "desc" as const } },
    stars: { where: { userId }, select: { userId: true } },
    puts: { where: { userId }, select: { userId: true } },
    _count: {
      select: {
        stars: true,
        puts: true,
        wins: publicOnly ? { where: { visibility: "PUBLIC" as const } } : true,
        battlesA: publicOnly ? { where: { visibility: "PUBLIC" as const } } : true,
        battlesB: publicOnly ? { where: { visibility: "PUBLIC" as const } } : true
      }
    }
  };
}

async function getProfilePayload(userId: string) {
  const [user, myCombos, starredCombos, putCombos, careerEntries] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId }, select: { id: true, name: true, username: true, email: true, image: true, bio: true } }),
    prisma.combo.findMany({ where: { ownerId: userId }, include: profileComboInclude(userId), orderBy: { createdAt: "desc" }, take: 60 }),
    prisma.combo.findMany({ where: { stars: { some: { userId } }, visibility: "PUBLIC" }, include: profileComboInclude(userId, true), orderBy: { createdAt: "desc" }, take: 60 }),
    prisma.combo.findMany({ where: { puts: { some: { userId } }, visibility: "PUBLIC" }, include: profileComboInclude(userId, true), orderBy: { createdAt: "desc" }, take: 60 }),
    prisma.careerEntry.findMany({ where: { userId }, orderBy: { playedAt: "desc" }, take: 100 })
  ]);

  return {
    user: {
      id: userId,
      name: user?.name,
      username: user?.username,
      email: user?.email,
      image: user?.image,
      bio: user?.bio
    },
    stats: {
      comboCount: myCombos.length,
      putCount: putCombos.length,
      careerCount: careerEntries.length
    },
    myCombos,
    starredCombos,
    putCombos,
    careerEntries
  };
}

export default async function ProfilePage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/auth/signin");

  const params = await searchParams;
  const requestedTab = params.tab;
  const activeTab: ProfileTab =
    requestedTab === "posts" || requestedTab === "starred" || requestedTab === "lineup" || requestedTab === "career"
      ? requestedTab
      : "overview";

  const initialData = await getProfilePayload(session.user.id);

  return <ProfileClient initialData={initialData} initialTab={activeTab} sessionName={session.user.name || session.user.username || session.user.email} />;
}
