import { prisma } from "@/lib/prisma";

export type ProfileTab = "overview" | "posts" | "starred" | "lineup" | "career";

export function parseProfileTab(tab: string | null | undefined): ProfileTab {
  return tab === "posts" || tab === "starred" || tab === "lineup" || tab === "career" ? tab : "overview";
}

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

async function getProfileStats(userId: string) {
  const [comboCount, putCount, careerCount] = await Promise.all([
    prisma.combo.count({ where: { ownerId: userId } }),
    prisma.comboPut.count({ where: { userId, combo: { visibility: "PUBLIC" } } }),
    prisma.careerEntry.count({ where: { userId } })
  ]);

  return { comboCount, putCount, careerCount };
}

export async function getProfilePayload(userId: string, tab: ProfileTab, fallbackRole?: string) {
  const [user, stats] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, username: true, email: true, role: true, image: true, bio: true }
    }),
    getProfileStats(userId)
  ]);

  const payload = {
    user: {
      id: userId,
      name: user?.name,
      username: user?.username,
      email: user?.email,
      role: user?.role || fallbackRole,
      image: user?.image,
      bio: user?.bio
    },
    stats,
    myCombos: undefined as unknown[] | undefined,
    starredCombos: undefined as unknown[] | undefined,
    putCombos: undefined as unknown[] | undefined,
    careerEntries: undefined as unknown[] | undefined
  };

  if (tab === "posts") {
    payload.myCombos = await prisma.combo.findMany({
      where: { ownerId: userId },
      include: profileComboInclude(userId),
      orderBy: { createdAt: "desc" },
      take: 60
    });
  } else if (tab === "starred") {
    payload.starredCombos = await prisma.combo.findMany({
      where: { stars: { some: { userId } }, visibility: "PUBLIC" },
      include: profileComboInclude(userId, true),
      orderBy: { createdAt: "desc" },
      take: 60
    });
  } else if (tab === "lineup") {
    payload.putCombos = await prisma.combo.findMany({
      where: { puts: { some: { userId } }, visibility: "PUBLIC" },
      include: profileComboInclude(userId, true),
      orderBy: { createdAt: "desc" },
      take: 60
    });
  } else if (tab === "career") {
    payload.careerEntries = await prisma.careerEntry.findMany({
      where: { userId },
      orderBy: { playedAt: "desc" },
      take: 100
    });
  }

  return payload;
}
