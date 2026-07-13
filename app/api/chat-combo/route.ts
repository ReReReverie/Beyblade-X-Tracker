import { NextResponse } from "next/server";
import { Part, PartType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/session";

const dailyLimit = 10;
const geminiModel = process.env.GEMINI_MODEL || "gemini-1.5-flash";

// ─── Intent Types ───────────────────────────────────────────────────────────

type Intent =
  | { type: "CREATE_COMBO"; raw: string }
  | { type: "LOG_BATTLE"; raw: string }
  | { type: "LIST_PARTS"; filter?: PartType }
  | { type: "MY_STATS" }
  | { type: "MY_COMBOS"; limit?: number }
  | { type: "MY_BATTLES"; limit?: number }
  | { type: "MY_DECKS" }
  | { type: "CREATE_DECK"; raw: string }
  | { type: "HELP" }
  | { type: "UNKNOWN"; raw: string };

type ChatResponse = {
  message: string;
  remaining?: number;
  combo?: { id: string };
  battle?: unknown;
  data?: unknown;
  suggestions?: string[];
};


// ─── Intent Classification (local, no LLM) ─────────────────────────────────

function classifyIntent(input: string): Intent {
  const lower = input.toLowerCase().trim();

  // Help intent
  if (/^(help|commands|what can you do|menu|\?)$/i.test(lower)) {
    return { type: "HELP" };
  }

  // Stats intent
  if (/\b(my stats|my record|win rate|winrate|my win|my loss|battle record)\b/i.test(lower)) {
    return { type: "MY_STATS" };
  }

  // List parts intent
  if (/\b(my parts|list parts|show parts|parts list|inventory)\b/i.test(lower)) {
    const filter = /\bblades?\b/i.test(lower) ? "BLADE" as PartType
      : /\bratchets?\b/i.test(lower) ? "RATCHET" as PartType
      : /\bbits?\b/i.test(lower) ? "BIT" as PartType
      : undefined;
    return { type: "LIST_PARTS", filter };
  }

  // My combos intent
  if (/\b(my combos|list combos|show combos)\b/i.test(lower)) {
    return { type: "MY_COMBOS", limit: 10 };
  }

  // My decks intent
  if (/\b(my decks|list decks|show decks)\b/i.test(lower)) {
    return { type: "MY_DECKS" };
  }

  // My battles intent
  if (/\b(my battles|list battles|show battles|recent battles|battle history)\b/i.test(lower)) {
    return { type: "MY_BATTLES", limit: 10 };
  }


  // Create deck intent
  if (/\b(create deck|make deck|new deck|build deck)\b/i.test(lower)) {
    return { type: "CREATE_DECK", raw: input };
  }

  // Battle intent (contains "vs" or "versus")
  if (/\s+(?:vs\.?|versus)\s+/i.test(input)) {
    return { type: "LOG_BATTLE", raw: input };
  }

  // Default: combo creation (the original behavior)
  return { type: "CREATE_COMBO", raw: input };
}


// ─── Utility Helpers ────────────────────────────────────────────────────────

function startOfUtcDay(date = new Date()) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

function normalize(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "");
}

function scorePart(input: string, part: Part) {
  const normalizedInput = normalize(input);
  const normalizedName = normalize(part.name);
  if (!normalizedName) return 0;
  if (normalizedInput.includes(normalizedName)) return 1000 + normalizedName.length;
  const words = part.name.toLowerCase().split(/[^a-z0-9]+/).filter(Boolean);
  return words.reduce((score, word) => score + (input.toLowerCase().includes(word) ? word.length : 0), 0);
}

function pickPart(input: string, parts: Part[], type: PartType) {
  return parts
    .filter((part) => part.type === type)
    .map((part) => ({ part, score: scorePart(input, part) }))
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score)[0]?.part;
}

function labeledValue(input: string, label: string) {
  const match = input.match(new RegExp(`${label}\\s*[:\\-]\\s*([^,;\\n]+)`, "i"));
  return match?.[1]?.trim();
}

function stripNameClause(input: string) {
  return input.replace(/(?:name|called)\s*[:\-]\s*[^.\n]+/i, "").trim();
}


// ─── Combo Guessing ─────────────────────────────────────────────────────────

type ComboGuess = {
  blade?: string;
  ratchet?: string;
  bit?: string;
  name?: string;
  visibility?: "PUBLIC" | "PRIVATE";
};

function guessedPartNames(input: string): ComboGuess {
  const blade = labeledValue(input, "blade");
  const ratchet = labeledValue(input, "ratchet");
  const bit = labeledValue(input, "bit");
  const visibility = input.toLowerCase().includes("private") ? "PRIVATE" : "PUBLIC";
  if (blade || ratchet || bit) return { blade, ratchet, bit, visibility };

  const clean = stripNameClause(input);
  const ratchetMatch = clean.match(/\b\d+-\d+\b/);
  if (!ratchetMatch) return { visibility };

  const before = clean.slice(0, ratchetMatch.index).replace(/[,\-;]+$/g, "").trim();
  const after = clean.slice((ratchetMatch.index || 0) + ratchetMatch[0].length).replace(/^[,\-;]+/g, "").trim();
  const bitName = after.split(/[,.;]/)[0]?.trim();
  return {
    blade: before || undefined,
    ratchet: ratchetMatch[0],
    bit: bitName || undefined,
    visibility
  };
}

function cleanGuess(value: unknown) {
  return typeof value === "string" ? value.trim().slice(0, 80) || undefined : undefined;
}


function parseGeminiJson(text: string): ComboGuess {
  const jsonText = text.replace(/```json|```/g, "").trim();
  const parsed = JSON.parse(jsonText) as Record<string, unknown>;
  const visibility = parsed.visibility === "PRIVATE" ? "PRIVATE" : parsed.visibility === "PUBLIC" ? "PUBLIC" : undefined;
  return {
    blade: cleanGuess(parsed.blade),
    ratchet: cleanGuess(parsed.ratchet),
    bit: cleanGuess(parsed.bit),
    name: cleanGuess(parsed.name),
    visibility
  };
}

function mergeGuesses(local: ComboGuess, gemini: ComboGuess | null): ComboGuess {
  if (!gemini) return local;
  return {
    blade: gemini.blade || local.blade,
    ratchet: gemini.ratchet || local.ratchet,
    bit: gemini.bit || local.bit,
    name: gemini.name || local.name,
    visibility: gemini.visibility || local.visibility
  };
}

async function guessWithGemini(input: string): Promise<ComboGuess | null> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: `Extract Beyblade X combo fields. Return only minified JSON with keys blade,ratchet,bit,name,visibility. visibility is PUBLIC or PRIVATE. Unknown values are empty strings. Input: ${input.slice(0, 500)}` }] }],
          generationConfig: { temperature: 0, maxOutputTokens: 120, responseMimeType: "application/json" }
        })
      }
    );
    if (!response.ok) return null;
    const data = await response.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    return typeof text === "string" ? parseGeminiJson(text) : null;
  } catch (error) {
    console.error("Gemini combo extraction failed", error);
    return null;
  }
}


// ─── Combo & Battle Creation Helpers ────────────────────────────────────────

async function createPartFromChat(userId: string, name: string, type: PartType) {
  return prisma.part.create({
    data: {
      ownerId: userId,
      name: name.slice(0, 80),
      type,
      manufacturer: "UNKNOWN",
      weightGrams: null,
      conditionRating: 10,
      visibility: "PRIVATE",
      notes: "Created from chat. Update weight, manufacturer, condition, visibility, and photos manually."
    }
  });
}

function comboNameFromParts(blade: Part, ratchet: Part, bit: Part) {
  return `${blade.name} / ${ratchet.name} / ${bit.name}`;
}

type ResolvedCombo = {
  id: string;
  name: string;
  created: boolean;
  createdParts: string[];
};

async function findOrCreateCombo(userId: string, input: string, parts: Part[], geminiGuess: ComboGuess | null): Promise<ResolvedCombo> {
  const localGuesses = guessedPartNames(input);
  const guesses = mergeGuesses(localGuesses, geminiGuess);
  const createdParts: string[] = [];
  let blade = pickPart(guesses.blade || input, parts, "BLADE");
  let ratchet = pickPart(guesses.ratchet || input, parts, "RATCHET");
  let bit = pickPart(guesses.bit || input, parts, "BIT");

  const missing = [
    blade ? null : "blade",
    ratchet ? null : "ratchet",
    bit ? null : "bit"
  ].filter(Boolean);


  if (!blade || !ratchet || !bit) {
    if (!blade && guesses.blade) {
      blade = await createPartFromChat(userId, guesses.blade, "BLADE");
      parts.push(blade);
      createdParts.push(blade.name);
    }
    if (!ratchet && guesses.ratchet) {
      ratchet = await createPartFromChat(userId, guesses.ratchet, "RATCHET");
      parts.push(ratchet);
      createdParts.push(ratchet.name);
    }
    if (!bit && guesses.bit) {
      bit = await createPartFromChat(userId, guesses.bit, "BIT");
      parts.push(bit);
      createdParts.push(bit.name);
    }
    if (!blade || !ratchet || !bit) {
      throw new Error(`I could not identify your ${missing.join(", ")}. Try: blade: Phoenix Wing, ratchet: 9-60, bit: Point.`);
    }
  }

  const duplicateCandidates = await prisma.combo.findMany({
    where: {
      OR: [{ visibility: "PUBLIC" }, { ownerId: userId }],
      parts: { some: { partId: { in: [blade.id, ratchet.id, bit.id] } } }
    },
    include: { parts: true },
    take: 20
  });
  const duplicate = duplicateCandidates.find((combo) => {
    const partIds = new Set(combo.parts.map((part) => part.partId));
    return partIds.size === 3 && partIds.has(blade!.id) && partIds.has(ratchet!.id) && partIds.has(bit!.id);
  });
  if (duplicate) return { id: duplicate.id, name: duplicate.name, created: false, createdParts };


  const combo = await prisma.combo.create({
    data: {
      ownerId: userId,
      name: comboNameFromParts(blade, ratchet, bit),
      visibility: guesses.visibility || "PUBLIC",
      notes: `Created from chat: ${input}`.slice(0, 1000),
      bladePartId: blade.id,
      ratchetPartId: ratchet.id,
      bitPartId: bit.id,
      parts: {
        create: [
          { partId: blade.id, role: "BLADE" },
          { partId: ratchet.id, role: "RATCHET" },
          { partId: bit.id, role: "BIT" }
        ]
      }
    }
  });

  return { id: combo.id, name: combo.name, created: true, createdParts };
}


function splitBattleInput(input: string) {
  const match = input.match(/\s+(?:vs\.?|versus)\s+/i);
  if (!match || match.index === undefined) return null;

  const left = input.slice(0, match.index).trim();
  const rightAndMeta = input.slice(match.index + match[0].length).trim();
  const scoreMatch = rightAndMeta.match(/\b(\d+)\s*[-:]\s*(\d+)\b/);
  const right = scoreMatch
    ? rightAndMeta.slice(0, scoreMatch.index).trim()
    : rightAndMeta.trim();
  const scoreA = scoreMatch ? Number(scoreMatch[1]) : undefined;
  const scoreB = scoreMatch ? Number(scoreMatch[2]) : undefined;
  const notes = scoreMatch
    ? `Created from chat. Score: ${scoreA}-${scoreB}. Input: ${input}`.slice(0, 1000)
    : `Created from chat: ${input}`.slice(0, 1000);

  if (!left || !right) return null;
  return { left, right, scoreA, scoreB, notes };
}

function rpmForSide(input: string, side: "a" | "b") {
  const label = side === "a" ? "a" : "b";
  const match = input.match(new RegExp(`(?:combo\\s*)?${label}\\s*rpm\\s*[:\\-]?\\s*(\\d+)`, "i"));
  return match ? Number(match[1]) : undefined;
}


// ─── Rate Limiting ──────────────────────────────────────────────────────────

async function consumeChat(userId: string) {
  const day = startOfUtcDay();
  const existing = await prisma.chatUsage.findUnique({
    where: { userId_day: { userId, day } }
  });

  if (existing && existing.count >= dailyLimit) {
    return { allowed: false, remaining: 0 };
  }

  const usage = await prisma.chatUsage.upsert({
    where: { userId_day: { userId, day } },
    create: { userId, day, count: 1 },
    update: { count: { increment: 1 } }
  });

  if (usage.count > dailyLimit) {
    await prisma.chatUsage.update({
      where: { userId_day: { userId, day } },
      data: { count: dailyLimit }
    });
    return { allowed: false, remaining: 0 };
  }

  return { allowed: true, remaining: Math.max(dailyLimit - usage.count, 0) };
}


// ─── Task Handlers ──────────────────────────────────────────────────────────

async function handleHelp(remaining: number): Promise<ChatResponse> {
  return {
    message: [
      "Here's what I can do:",
      "",
      "**Create a combo** — Type part names like: Phoenix Wing 9-60 Point",
      "**Log a battle** — Use 'vs': Wizard Rod 1-60 Hexa vs Phoenix Wing 3-60 Rush 1-0",
      "**My parts** — See your parts inventory (try: my parts, my blades, my bits)",
      "**My combos** — List your recent combos",
      "**My battles** — View your recent battle history",
      "**My decks** — List your 3v3 decks",
      "**My stats** — See your win rate and battle record",
      "**Create deck** — Make a deck: create deck [name] with [combo1], [combo2], [combo3]",
      "",
      "Tips: Say 'private' anywhere to make things private. Add 'blade:', 'ratchet:', 'bit:' labels for precision."
    ].join("\n"),
    remaining,
    suggestions: ["my stats", "my parts", "my combos", "my battles"]
  };
}


async function handleListParts(userId: string, filter: PartType | undefined, remaining: number): Promise<ChatResponse> {
  const where = filter
    ? { ownerId: userId, type: filter }
    : { ownerId: userId };

  const parts = await prisma.part.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 20,
    select: { id: true, name: true, type: true, conditionRating: true }
  });

  if (parts.length === 0) {
    const typeLabel = filter ? filter.toLowerCase() + "s" : "parts";
    return {
      message: `You don't have any ${typeLabel} yet. Add parts from the Parts page, or I can create them when you type a combo.`,
      remaining,
      suggestions: ["help", "my combos"]
    };
  }

  const grouped: Record<string, string[]> = {};
  for (const p of parts) {
    const key = p.type;
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(p.name);
  }

  const lines: string[] = [];
  for (const [type, names] of Object.entries(grouped)) {
    lines.push(`**${type}** (${names.length}): ${names.join(", ")}`);
  }

  const total = await prisma.part.count({ where: { ownerId: userId } });
  lines.push(`\n${total} total parts in your inventory.`);

  return {
    message: lines.join("\n"),
    remaining,
    data: { parts, total },
    suggestions: ["my combos", "my stats"]
  };
}


async function handleMyStats(userId: string, remaining: number): Promise<ChatResponse> {
  const [totalBattles, totalCombos, totalParts, totalDecks] = await Promise.all([
    prisma.battle.count({ where: { ownerId: userId } }),
    prisma.combo.count({ where: { ownerId: userId } }),
    prisma.part.count({ where: { ownerId: userId } }),
    prisma.deck.count({ where: { ownerId: userId } })
  ]);

  // Count 1v1 and 3v3 battles
  const [oneVOneCount, threeVThreeCount] = await Promise.all([
    prisma.battle.count({ where: { ownerId: userId, format: "ONE_V_ONE" } }),
    prisma.battle.count({ where: { ownerId: userId, format: "THREE_V_THREE" } })
  ]);

  const lines = [
    `**Your Tracker Stats:**`,
    `Parts: ${totalParts} | Combos: ${totalCombos} | Decks: ${totalDecks}`,
    `Battles logged: ${totalBattles} (${oneVOneCount} 1v1, ${threeVThreeCount} 3v3)`,
  ];

  // Top combo by wins
  if (totalBattles > 0) {
    const topCombo = await prisma.combo.findFirst({
      where: { ownerId: userId },
      orderBy: { wins: { _count: "desc" } },
      select: { id: true, name: true, _count: { select: { wins: true } } }
    });
    if (topCombo && topCombo._count.wins > 0) {
      lines.push(`Top combo: ${topCombo.name} (${topCombo._count.wins} wins)`);
    }
  }

  return {
    message: lines.join("\n"),
    remaining,
    data: { totalBattles, totalCombos, totalParts, totalDecks, oneVOneCount, threeVThreeCount },
    suggestions: ["my combos", "my battles", "my parts"]
  };
}


async function handleMyCombos(userId: string, limit: number, remaining: number): Promise<ChatResponse> {
  const combos = await prisma.combo.findMany({
    where: { ownerId: userId },
    orderBy: { createdAt: "desc" },
    take: limit,
    select: {
      id: true,
      name: true,
      visibility: true,
      createdAt: true,
      _count: { select: { wins: true, battlesA: true, battlesB: true } }
    }
  });

  if (combos.length === 0) {
    return {
      message: "You don't have any combos yet. Type a combo like 'Phoenix Wing 9-60 Point' and I'll create it for you!",
      remaining,
      suggestions: ["help"]
    };
  }

  const total = await prisma.combo.count({ where: { ownerId: userId } });
  const lines = combos.map((c, i) => {
    const battles = c._count.battlesA + c._count.battlesB;
    const badge = c.visibility === "PRIVATE" ? " [private]" : "";
    return `${i + 1}. ${c.name}${badge} — ${c._count.wins}W / ${battles} battles`;
  });

  lines.unshift(`**Your Combos** (showing ${combos.length} of ${total}):`);

  return {
    message: lines.join("\n"),
    remaining,
    data: { combos: combos.map(c => ({ id: c.id, name: c.name })) },
    suggestions: ["my stats", "my battles"]
  };
}


async function handleMyBattles(userId: string, limit: number, remaining: number): Promise<ChatResponse> {
  const battles = await prisma.battle.findMany({
    where: { ownerId: userId },
    orderBy: { createdAt: "desc" },
    take: limit,
    include: {
      comboA: { select: { name: true } },
      comboB: { select: { name: true } },
      winner: { select: { name: true } },
      deckA: { select: { name: true } },
      deckB: { select: { name: true } },
      deckWinner: { select: { name: true } }
    }
  });

  if (battles.length === 0) {
    return {
      message: "No battles logged yet. Log one with: Phoenix Wing 9-60 Point vs Wizard Rod 1-60 Hexa 1-0",
      remaining,
      suggestions: ["help", "my combos"]
    };
  }

  const total = await prisma.battle.count({ where: { ownerId: userId } });
  const lines = battles.map((b, i) => {
    if (b.format === "THREE_V_THREE") {
      return `${i + 1}. [3v3] ${b.deckA?.name || "?"} vs ${b.deckB?.name || "?"} — Winner: ${b.deckWinner?.name || "?"}`;
    }
    return `${i + 1}. ${b.comboA?.name || "?"} vs ${b.comboB?.name || "?"} — Winner: ${b.winner?.name || "?"}`;
  });

  lines.unshift(`**Recent Battles** (showing ${battles.length} of ${total}):`);

  return {
    message: lines.join("\n"),
    remaining,
    suggestions: ["my stats", "my combos"]
  };
}


async function handleMyDecks(userId: string, remaining: number): Promise<ChatResponse> {
  const decks = await prisma.deck.findMany({
    where: { ownerId: userId },
    orderBy: { createdAt: "desc" },
    take: 10,
    include: {
      slots: { include: { combo: { select: { name: true } } }, orderBy: { slot: "asc" } },
      _count: { select: { wins: true, battlesA: true, battlesB: true } }
    }
  });

  if (decks.length === 0) {
    return {
      message: "You don't have any decks yet. Create one with: create deck [name] with [combo1], [combo2], [combo3]",
      remaining,
      suggestions: ["my combos", "help"]
    };
  }

  const lines = decks.map((d, i) => {
    const comboNames = d.slots.map(s => s.combo.name).join(" | ");
    const battles = d._count.battlesA + d._count.battlesB;
    return `${i + 1}. **${d.name}** — ${comboNames} (${d._count.wins}W / ${battles} battles)`;
  });

  lines.unshift(`**Your Decks** (${decks.length}):`);

  return {
    message: lines.join("\n"),
    remaining,
    suggestions: ["my stats", "my battles"]
  };
}


async function handleCreateDeck(userId: string, input: string, remaining: number): Promise<ChatResponse> {
  // Parse: create deck [name] with [combo1], [combo2], [combo3]
  const deckMatch = input.match(/(?:create|make|build|new)\s+deck\s+(.+?)\s+(?:with|using|from)\s+(.+)/i);
  if (!deckMatch) {
    return {
      message: "To create a deck, use: create deck [name] with [combo1], [combo2], [combo3]. Use your exact combo names separated by commas.",
      remaining,
      suggestions: ["my combos"]
    };
  }

  const deckName = deckMatch[1].trim().slice(0, 80);
  const comboInputs = deckMatch[2].split(/,\s*/).map(s => s.trim()).filter(Boolean);

  if (comboInputs.length !== 3) {
    return {
      message: "A deck needs exactly 3 combos. Separate them with commas: create deck My Deck with Combo A, Combo B, Combo C",
      remaining,
      suggestions: ["my combos"]
    };
  }

  // Find combos by name match
  const userCombos = await prisma.combo.findMany({
    where: { ownerId: userId },
    select: { id: true, name: true }
  });

  const matchedCombos: { id: string; name: string }[] = [];
  const notFound: string[] = [];

  for (const comboInput of comboInputs) {
    const normalizedInput = normalize(comboInput);
    const match = userCombos.find(c => normalize(c.name) === normalizedInput)
      || userCombos.find(c => normalize(c.name).includes(normalizedInput))
      || userCombos.find(c => normalizedInput.includes(normalize(c.name)));

    if (match) {
      matchedCombos.push(match);
    } else {
      notFound.push(comboInput);
    }
  }


  if (notFound.length > 0) {
    return {
      message: `Could not find combo(s): ${notFound.join(", ")}. Make sure you use the exact name from 'my combos'.`,
      remaining,
      suggestions: ["my combos"]
    };
  }

  const uniqueIds = new Set(matchedCombos.map(c => c.id));
  if (uniqueIds.size !== 3) {
    return {
      message: "A deck needs 3 different combos. Two or more of your choices matched the same combo.",
      remaining
    };
  }

  const visibility = input.toLowerCase().includes("private") ? "PRIVATE" : "PUBLIC";

  const deck = await prisma.deck.create({
    data: {
      ownerId: userId,
      name: deckName,
      visibility: visibility as "PUBLIC" | "PRIVATE",
      notes: `Created from chat: ${input}`.slice(0, 1000),
      slots: {
        create: matchedCombos.map((c, i) => ({ comboId: c.id, slot: i + 1 }))
      }
    },
    include: { slots: { include: { combo: { select: { name: true } } }, orderBy: { slot: "asc" } } }
  });

  const comboList = deck.slots.map(s => s.combo.name).join(" | ");
  return {
    message: `Created deck "${deck.name}": ${comboList}. Ready for 3v3 battles!`,
    remaining,
    suggestions: ["my decks", "my battles"]
  };
}


async function handleLogBattle(userId: string, input: string, remaining: number): Promise<ChatResponse> {
  const battleInput = splitBattleInput(input);
  if (!battleInput) {
    return {
      message: "I couldn't parse that battle. Use: [combo A] vs [combo B] [score]. Example: Phoenix Wing 9-60 Point vs Wizard Rod 1-60 Hexa 1-0",
      remaining
    };
  }

  const parts = await prisma.part.findMany({ where: { ownerId: userId } });

  const [comboA, comboB] = await Promise.all([
    findOrCreateCombo(userId, battleInput.left, parts, null),
    findOrCreateCombo(userId, battleInput.right, parts, null)
  ]);

  if (comboA.id === comboB.id) {
    return {
      message: "I matched both sides to the same combo. Add more detail for each side.",
      remaining
    };
  }

  if (battleInput.scoreA === undefined || battleInput.scoreB === undefined || battleInput.scoreA === battleInput.scoreB) {
    return {
      message: "Add a non-tied score like 1-0 or 3-2 so I know the winner.",
      remaining
    };
  }

  const winnerId = battleInput.scoreA > battleInput.scoreB ? comboA.id : comboB.id;

  const battle = await prisma.battle.create({
    data: {
      ownerId: userId,
      format: "ONE_V_ONE",
      comboAId: comboA.id,
      comboBId: comboB.id,
      winnerId,
      comboARpm: rpmForSide(input, "a"),
      comboBRpm: rpmForSide(input, "b"),
      visibility: input.toLowerCase().includes("private") ? "PRIVATE" : "PUBLIC",
      notes: battleInput.notes
    }
  });

  const createdParts = [...comboA.createdParts, ...comboB.createdParts];
  return {
    combo: { id: winnerId },
    battle,
    remaining,
    message: `Logged battle: ${comboA.name} vs ${comboB.name}. Winner: ${winnerId === comboA.id ? comboA.name : comboB.name}.${createdParts.length ? " Created missing parts as private placeholders." : ""}`,
    suggestions: ["my stats", "my battles"]
  };
}


async function handleCreateCombo(userId: string, input: string, remaining: number): Promise<ChatResponse> {
  const [parts, geminiGuesses] = await Promise.all([
    prisma.part.findMany({ where: { ownerId: userId } }),
    guessWithGemini(input)
  ]);

  const combo = await findOrCreateCombo(userId, input, parts, geminiGuesses);

  return {
    combo,
    remaining,
    message: combo.created
      ? `Created ${combo.name}.${combo.createdParts.length ? ` Also created missing parts: ${combo.createdParts.join(", ")}.` : ""} Add images manually from Create > Log > Add photo.`
      : `That combo already exists: ${combo.name}. You can log battles by typing: ${combo.name} vs another combo 1-0.`,
    suggestions: combo.created ? ["my combos", "my stats"] : ["my battles", "my combos"]
  };
}


// ─── Main Route Handler ─────────────────────────────────────────────────────

export async function POST(request: Request) {
  try {
    const userId = await requireUserId();
    const body = await request.json().catch(() => null);
    const message = typeof body?.message === "string" ? body.message.trim() : "";
    if (!message) {
      return NextResponse.json({
        error: "Type a message. Say 'help' to see what I can do.",
        suggestions: ["help"]
      }, { status: 400 });
    }

    const usage = await consumeChat(userId);
    if (!usage.allowed) {
      return NextResponse.json({
        error: "Daily chat limit reached. Try again tomorrow.",
        remaining: 0
      }, { status: 429 });
    }

    const intent = classifyIntent(message);
    let response: ChatResponse;

    switch (intent.type) {
      case "HELP":
        response = await handleHelp(usage.remaining);
        break;
      case "LIST_PARTS":
        response = await handleListParts(userId, intent.filter, usage.remaining);
        break;
      case "MY_STATS":
        response = await handleMyStats(userId, usage.remaining);
        break;
      case "MY_COMBOS":
        response = await handleMyCombos(userId, intent.limit || 10, usage.remaining);
        break;
      case "MY_BATTLES":
        response = await handleMyBattles(userId, intent.limit || 10, usage.remaining);
        break;
      case "MY_DECKS":
        response = await handleMyDecks(userId, usage.remaining);
        break;
      case "CREATE_DECK":
        response = await handleCreateDeck(userId, intent.raw, usage.remaining);
        break;
      case "LOG_BATTLE":
        response = await handleLogBattle(userId, intent.raw, usage.remaining);
        break;
      case "CREATE_COMBO":
        response = await handleCreateCombo(userId, intent.raw, usage.remaining);
        break;
      default:
        response = await handleCreateCombo(userId, message, usage.remaining);
        break;
    }

    return NextResponse.json(response);
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Sign in to use the chat assistant." }, { status: 401 });
    }
    console.error("Chat failed", error);
    const errorMessage = process.env.NODE_ENV === "development" && error instanceof Error
      ? error.message
      : "Something went wrong. Try again or say 'help' for commands.";
    return NextResponse.json({ error: errorMessage, suggestions: ["help"] }, { status: 500 });
  }
}
