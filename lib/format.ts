import type { Manufacturer, PartType, Visibility } from "@prisma/client";

export function formatPartType(value: PartType) {
  return value.charAt(0) + value.slice(1).toLowerCase();
}

export function formatManufacturer(value: Manufacturer) {
  const labels: Record<Manufacturer, string> = {
    HASBRO: "Hasbro",
    TAKARA_TOMY: "Takara Tomy",
    FAKE: "Fake",
    UNKNOWN: "Unknown"
  };
  return labels[value];
}

export function formatVisibility(value: Visibility) {
  return value === "PUBLIC" ? "Public" : "Private";
}

export function pct(wins: number, total: number) {
  return total === 0 ? "0%" : `${Math.round((wins / total) * 100)}%`;
}
