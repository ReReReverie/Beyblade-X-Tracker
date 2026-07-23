import { prisma } from "@/lib/prisma";

export type ProfileTab = "overview" | "posts" | "starred" | "lineup" | "career";

type JsonPrimitive = string | number | boolean | null;
type JsonValue = JsonPrimitive | JsonValue[] | { [key: string]: JsonValue };

export class ProfileNotFoundError extends Error {
  constructor() {
    super("Profile not found.");
    this.name = "ProfileNotFoundError";
  }
}

/** Convert Prisma values into a plain, JSON-safe object before it crosses the API boundary. */
export function serializeForClient<T>(data: T): T {
  return serializeJsonValue(data, new Set<object>()) as T;
}

function serializeJsonValue(value: unknown, stack: Set<object>): JsonValue | undefined {
  if (value === undefined || typeof value === "function" || typeof value === "symbol") return undefined;
  if (value === null || typeof value === "string" || typeof value === "boolean") return value;
  if (typeof value === "bigint") return value.toString();
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (value instanceof Date) {
    try {
      return value.toISOString();
    } catch {
      return null;
    }
  }

  if (isDecimalLike(value)) {
    try {
      const numberValue = value.toNumber();
      return Number.isFinite(numberValue) ? numberValue : String(value);
    } catch {
      return String(value);
    }
  }

  if (stack.has(value)) return null;
  stack.add(value);
  try {
    if (Array.isArray(value)) {
      return value.map((item) => serializeJsonValue(item, stack) ?? null);
    }

    // React Server Components require ordinary objects with Object.prototype.
    // Object.create(null) values are rejected at the server-to-client boundary.
    const result: Record<string, JsonValue> = {};
    for (const [key, child] of Object.entries(value)) {
      const serialized = serializeJsonValue(child, stack);
      if (serialized !== undefined) result[key] = serialized;
    }
    return result;
  } finally {
    stack.delete(value);
  }
}

function isDecimalLike(value: object): value is { toNumber: () => number } {
  return typeof (value as { toNumber?: unknown }).toNumber === "function";
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
      take: 10,
      select: {
        id: true,
        tournamentName: true,
        placement: true,
        wins: true,
        losses: true,
        draws: true,
        playedAt: true,
        notes: true,
        challongeUrl: true,
        trackedParticipantName: true,
        challongeSnapshot: true,
        challongeSyncError: true
      }
    });
  }

  return Promise.resolve([]);
}

export async function getProfileTabPayload(userId: string, tab: ProfileTab) {
  const [user, tabData] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId }, select: { id: true } }),
    getTabData(userId, tab)
  ]);
  if (!user) throw new ProfileNotFoundError();

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
  if (!user) throw new ProfileNotFoundError();

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


