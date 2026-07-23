import { prisma } from "../lib/prisma";
import {
  getProfilePayload,
  getProfileTabPayload,
  type ProfileTab
} from "../lib/profile-data";

const tabs: ProfileTab[] = ["overview", "posts", "starred", "lineup", "career"];

function assertPlainPayload(value: unknown, path = "payload") {
  if (value === null || typeof value !== "object") return;

  const prototype = Object.getPrototypeOf(value);
  if (Array.isArray(value)) {
    value.forEach((entry, index) => assertPlainPayload(entry, `${path}[${index}]`));
    return;
  }

  if (prototype !== Object.prototype) {
    throw new Error(`${path} has a non-plain prototype.`);
  }

  for (const [key, child] of Object.entries(value)) {
    assertPlainPayload(child, `${path}.${key}`);
  }
}

async function main() {
  const user = await prisma.user.findFirst({ select: { id: true, role: true } });
  if (!user) throw new Error("No user exists for the profile serialization check.");

  for (const tab of tabs) {
    const initialPayload = await getProfilePayload(user.id, tab, user.role);
    const partialPayload = await getProfileTabPayload(user.id, tab);
    assertPlainPayload(initialPayload, `${tab}.initial`);
    assertPlainPayload(partialPayload, `${tab}.partial`);
    JSON.stringify(initialPayload);
    JSON.stringify(partialPayload);
    console.log(`${tab}: serializable`);
  }

  console.log("Profile serialization check: passed");
}

main()
  .catch((error) => {
    console.error("Profile serialization check failed:", error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
