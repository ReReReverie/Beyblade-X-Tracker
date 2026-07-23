/**
 * Client-safe formatting helpers.
 * These mirror the functions in lib/format.ts but avoid importing from @prisma/client
 * so they can be safely bundled in "use client" components.
 */

export function formatPartType(value: string): string {
  return value.charAt(0) + value.slice(1).toLowerCase();
}

export function formatManufacturer(value: string): string {
  const labels: Record<string, string> = {
    HASBRO: "Hasbro",
    TAKARA_TOMY: "Takara Tomy",
    FAKE: "Fake",
    UNKNOWN: "Unknown"
  };
  return labels[value] || value;
}

export function formatVisibility(value: string): string {
  return value === "PUBLIC" ? "Public" : "Private";
}

export function pct(wins: number, total: number): string {
  return total === 0 ? "0%" : `${Math.round((wins / total) * 100)}%`;
}

export function formatStableDate(value: string | Date): string {
  const date = new Date(value);
  return new Intl.DateTimeFormat("en-US", {
    month: "numeric",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC"
  }).format(date);
}

export function normalizeImageUrl(value: string | null | undefined): string | null {
  const url = value?.trim();
  if (!url) return null;
  if (url.startsWith("//")) {
    try {
      const parsed = new URL("https:" + url);
      return parsed.hostname ? parsed.toString() : null;
    } catch {
      return null;
    }
  }
  if (url.startsWith("/")) {
    return url.includes("\\") || /[\u0000-\u001f]/.test(url) ? null : url;
  }

  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return null;
    if (parsed.protocol === "http:" && !["localhost", "127.0.0.1", "[::1]"].includes(parsed.hostname)) {
      parsed.protocol = "https:";
    }
    return parsed.toString();
  } catch {
    return null;
  }
}
