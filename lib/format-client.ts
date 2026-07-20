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
