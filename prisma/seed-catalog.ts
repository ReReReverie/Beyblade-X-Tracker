import { prisma } from "../lib/prisma";
import { allMetaParts } from "./data/meta-parts";

const CUSTOM_LINE_WIKI_RAW = "https://beyblade.fandom.com/wiki/List_of_Custom_Line_parts?action=raw";

function slugify(value: string, prefix = "") {
  const normalized = value
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/([A-Z]+)([A-Z][a-z])/g, "$1 $2")
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return `${prefix}${normalized}`;
}

async function fetchCustomLineParts() {
  try {
    const res = await fetch(CUSTOM_LINE_WIKI_RAW);
    if (!res.ok) return [];
    const text = await res.text();

    const extractSection = (sectionTitle: string) => {
      const re = new RegExp(`==+\\s*${sectionTitle}\\s*==+([\\s\\S]*?)(?:==|$)`, "i");
      const m = text.match(re);
      if (!m) return [];
      const section = m[1];
      const names: string[] = [];
      const linkRe = /\[\[(?:[^\]|]+\|)?([^\]]+)\]\]/g;
      let lm;
      while ((lm = linkRe.exec(section)) !== null) {
        const name = lm[1].trim();
        if (name && !names.includes(name)) names.push(name);
      }
      return names;
    };

    const bladeSections = ["Main Blades", "Assist Blades", "Metal Blades", "Over Blades"];
    const ratchetSections = ["Ratchets"];
    const bitSections = ["Bits", "Ratchet Integrated Bits"];

    const parts: any[] = [];

    for (const sec of bladeSections) {
      for (const name of extractSection(sec)) {
        parts.push({ slug: slugify(name), name, type: "BLADE", manufacturer: "TAKARA_TOMY" });
      }
    }
    for (const sec of ratchetSections) {
      for (const name of extractSection(sec)) {
        parts.push({ slug: slugify(name, "ratchet-"), name, type: "RATCHET", manufacturer: "TAKARA_TOMY" });
      }
    }
    for (const sec of bitSections) {
      for (const name of extractSection(sec)) {
        parts.push({ slug: slugify(name, "bit-"), name, type: "BIT", manufacturer: "TAKARA_TOMY" });
      }
    }

    return parts;
  } catch (err) {
    console.error("Failed to fetch custom line wiki:", err);
    return [];
  }
}

export async function seedCatalog() {
  let created = 0;
  let updated = 0;
  // Gather remote Custom Line parts and merge with the built-in catalog
  const remoteParts = await fetchCustomLineParts();
  const combined = [...allMetaParts, ...remoteParts];

  // de-duplicate by type + slug
  const unique: any[] = [];
  const seen = new Set<string>();
  for (const p of combined) {
    const key = `${p.type}:${p.slug}`;
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(p);
  }

  for (const part of unique) {
    const existing = await prisma.partCatalog.findUnique({ where: { slug: part.slug } });
    await prisma.partCatalog.upsert({
      where: { slug: part.slug },
      update: {
        name: part.name,
        type: part.type,
        manufacturer: part.manufacturer,
        series: part.series ?? null,
        ratchetIntegration: part.ratchetIntegration ?? "NONE",
        weightGrams: part.weightGrams ?? null,
        imageUrl: null,
        metaTier: part.metaTier ?? null,
        notes: part.notes ?? null
      },
      create: {
        slug: part.slug,
        name: part.name,
        type: part.type,
        manufacturer: part.manufacturer,
        series: part.series ?? null,
        ratchetIntegration: part.ratchetIntegration ?? "NONE",
        weightGrams: part.weightGrams ?? null,
        metaTier: part.metaTier ?? null,
        notes: part.notes ?? null
      }
    });
    if (existing) updated += 1;
    else created += 1;
  }

  return { created, updated, total: unique.length };
}

async function main() {
  const result = await seedCatalog();
  console.log(`Meta parts catalog: ${result.total} entries (${result.created} new, ${result.updated} updated)`);
}

if (require.main === module) {
  main()
    .catch((error) => {
      console.error(error);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
