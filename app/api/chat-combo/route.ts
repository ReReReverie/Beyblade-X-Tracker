import { NextResponse } from "next/server";
import { Part, PartType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/session";

const dailyLimit = 10;
const geminiModel = process.env.GEMINI_MODEL || "gemini-1.5-flash";

type ComboGuess = {
  blade?: string;
  ratchet?: string;
  bit?: string;
  name?: string;
  visibility?: "PUBLIC" | "PRIVATE";
};

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
          contents: [
            {
              role: "user",
              parts: [
                {
                  text: `Extract Beyblade X combo fields. Return only minified JSON with keys blade,ratchet,bit,name,visibility. visibility is PUBLIC or PRIVATE. Unknown values are empty strings. Input: ${input.slice(0, 500)}`
                }
              ]
            }
          ],
          generationConfig: {
            temperature: 0,
            maxOutputTokens: 120,
            responseMimeType: "application/json"
          }
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

async function createPartFromChat(userId: string, name: string, type: PartType) {
  return prisma.part.create({
    data: {
      ownerId: userId,
      name: name.slice(0, 80),
      type,
      manufacturer: "UNKNOWN",
      weightGrams: 0.01,
      conditionRating: 10,
      visibility: "PRIVATE",
      notes: "Created from chat. Update weight, manufacturer, condition, visibility, and photos manually."
    }
  });
}

function comboNameFromText(input: string, blade: Part, ratchet: Part, bit: Part, guessedName?: string) {
  if (guessedName) return guessedName;
  const nameMatch = input.match(/(?:name|called)\s*[:\-]\s*([^.\n]+)/i);
  return nameMatch?.[1]?.trim().slice(0, 80) || `${blade.name} / ${ratchet.name} / ${bit.name}`;
}

async function consumeChat(userId: string) {
  const day = startOfUtcDay();
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

export async function POST(request: Request) {
  try {
    const userId = await requireUserId();
    const body = await request.json().catch(() => null);
    const message = typeof body?.message === "string" ? body.message.trim() : "";
    if (!message) return NextResponse.json({ error: "Type the combo you want to create." }, { status: 400 });

    const usage = await consumeChat(userId);
    if (!usage.allowed) {
      return NextResponse.json({ error: "Daily chat limit reached. Try again tomorrow.", remaining: 0 }, { status: 429 });
    }

    const [parts, geminiGuesses] = await Promise.all([
      prisma.part.findMany({ where: { ownerId: userId } }),
      guessWithGemini(message)
    ]);
    const localGuesses = guessedPartNames(message);
    const guesses = mergeGuesses(localGuesses, geminiGuesses);
    const createdParts: string[] = [];
    let blade = pickPart(guesses.blade || message, parts, "BLADE");
    let ratchet = pickPart(guesses.ratchet || message, parts, "RATCHET");
    let bit = pickPart(guesses.bit || message, parts, "BIT");

    const missing = [
      blade ? null : "blade",
      ratchet ? null : "ratchet",
      bit ? null : "bit"
    ].filter(Boolean);
    if (!blade || !ratchet || !bit) {
      if (!blade && guesses.blade) {
        blade = await createPartFromChat(userId, guesses.blade, "BLADE");
        createdParts.push(blade.name);
      }
      if (!ratchet && guesses.ratchet) {
        ratchet = await createPartFromChat(userId, guesses.ratchet, "RATCHET");
        createdParts.push(ratchet.name);
      }
      if (!bit && guesses.bit) {
        bit = await createPartFromChat(userId, guesses.bit, "BIT");
        createdParts.push(bit.name);
      }
      if (!blade || !ratchet || !bit) {
        return NextResponse.json({
          error: `I could not identify your ${missing.join(", ")}. Try: blade: Phoenix Wing, ratchet: 9-60, bit: Point.`,
          remaining: usage.remaining
        }, { status: 400 });
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
      return partIds.size === 3 && partIds.has(blade.id) && partIds.has(ratchet.id) && partIds.has(bit.id);
    });
    if (duplicate) {
      return NextResponse.json({
        error: "That combo already exists. Follow the existing combo and add battle results there.",
        remaining: usage.remaining
      }, { status: 409 });
    }

    const combo = await prisma.combo.create({
      data: {
        ownerId: userId,
        name: comboNameFromText(message, blade, ratchet, bit, guesses.name),
        visibility: guesses.visibility || "PUBLIC",
        notes: `Created from chat: ${message}`.slice(0, 1000),
        parts: {
          create: [
            { partId: blade.id, role: "BLADE" },
            { partId: ratchet.id, role: "RATCHET" },
            { partId: bit.id, role: "BIT" }
          ]
        }
      },
      include: { parts: { include: { part: true }, orderBy: { role: "asc" } } }
    });

    return NextResponse.json({
      combo,
      remaining: usage.remaining,
      message: `Created ${combo.name}.${createdParts.length ? ` Also created missing parts: ${createdParts.join(", ")}.` : ""} Add images manually from Dashboard > Log > Add photo.`
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Sign in to create combos from chat." }, { status: 401 });
    }
    console.error("Chat combo failed", error);
    return NextResponse.json({
      error: process.env.NODE_ENV === "development" && error instanceof Error
        ? `Could not create combo from chat: ${error.message}`
        : "Could not create combo from chat."
    }, { status: 500 });
  }
}
