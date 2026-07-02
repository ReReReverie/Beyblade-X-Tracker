import { hash } from "bcryptjs";
import { prisma } from "../lib/prisma";
import { seedCatalog } from "./seed-catalog";

async function main() {
  const username = process.env.DEFAULT_ADMIN_USERNAME || "admin";
  const password = process.env.DEFAULT_ADMIN_PASSWORD || "123456789";
  const email = process.env.DEFAULT_ADMIN_EMAIL || "admin@local.test";

  await prisma.user.upsert({
    where: { username },
    update: {
      name: "Admin",
      email,
      role: "ADMIN",
      passwordHash: await hash(password, 12)
    },
    create: {
      username,
      name: "Admin",
      email,
      role: "ADMIN",
      passwordHash: await hash(password, 12)
    }
  });

  const catalog = await seedCatalog();

  const demoUser = await prisma.user.findUnique({ where: { email: "demo@local.test" } });
  if (demoUser) {
    await prisma.battle.deleteMany({ where: { ownerId: demoUser.id } });
    await prisma.combo.deleteMany({ where: { ownerId: demoUser.id } });
    await prisma.part.deleteMany({ where: { ownerId: demoUser.id } });
    await prisma.user.delete({ where: { id: demoUser.id } });
    console.log("Removed legacy demo user data.");
  }

  console.log(`Default admin ready: ${username}`);
  console.log(`Meta parts catalog: ${catalog.total} entries (${catalog.created} new, ${catalog.updated} updated)`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
