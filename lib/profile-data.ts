import { prisma } from "@/lib/prisma";

export type ProfileTab = "overview" | "posts" | "starred" | "lineup" | "career";

/** Convert Prisma Decimal values and Date objects to plain JSON-safe values. */
function serializeForClient(data: unknown): any {
  return JSON.parse(JSON.stringify(data, (_key, value) => {
    if (value instanceof Date) return value.toISOString();
    if (typeof value === "object" && value !== null && "toNumber" in value && typeof value.toNumber === "function") {
      return value.toNumber();
    }
    if (typeof value === "bigint") return Number(value);
    return value;
  }));
}

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

function getTabData(userId: string, tab: ProfileTab) {
  if (tab === "posts") {
    return prisma.combo.findMany({
      where: { ownerId: userId },
      include: profileComboInclude(userId),
      orderBy: { createdAt: "desc" },
      take: 10
    });
  }

  if (tab === "starred") {
    return prisma.combo.findMany({
      where: { stars: { some: { userId } }, visibility: "PUBLIC" },
      include: profileComboInclude(userId, true),
      orderBy: { createdAt: "desc" },
      take: 10
    });
  }

  if (tab === "lineup") {
    return prisma.combo.findMany({
      where: {
        puts: { some: { userId } },
        OR: [{ visibility: "PUBLIC" }, { ownerId: userId }]
      },
      include: profileComboInclude(userId, true),
      orderBy: { createdAt: "desc" },
      take: 10
    });
  }

  if (tab === "career") {
    return prisma.careerEntry.findMany({
      where: { userId },
      orderBy: { playedAt: "desc" },
      take: 10
    });
  }

  return Promise.resolve([]);
}

export async function getProfileTabPayload(userId: string, tab: ProfileTab) {
  const tabData = await getTabData(userId, tab);

  return serializeForClient({
    myCombos: tab === "posts" ? tabData : undefined,
    starredCombos: tab === "starred" ? tabData : undefined,
    putCombos: tab === "lineup" ? tabData : undefined,
    careerEntries: tab === "career" ? tabData : undefined
  });
}

export async function getProfilePayload(userId: string, tab: ProfileTab, fallbackRole?: string) {
  const [user, stats, tabData] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, username: true, email: true, role: true, image: true, bio: true }
    }),
    getProfileStats(userId),
    getTabData(userId, tab)
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
    myCombos: tab === "posts" ? tabData : undefined,
    starredCombos: tab === "starred" ? tabData : undefined,
    putCombos: tab === "lineup" ? tabData : undefined,
    careerEntries: tab === "career" ? tabData : undefined
  };

  return serializeForClient(payload);
}


