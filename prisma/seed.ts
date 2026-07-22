import { hash } from "bcryptjs";
import { prisma } from "../lib/prisma";
import { seedCatalog } from "./seed-catalog";

async function main() {
  const username = process.env.DEFAULT_ADMIN_USERNAME || "admin";
  const password = process.env.DEFAULT_ADMIN_PASSWORD || "";
  const email = process.env.DEFAULT_ADMIN_EMAIL || "admin@local.test";
  if (!password) {
    throw new Error("DEFAULT_ADMIN_PASSWORD must be configured before seeding.");
  }
  if ((process.env.NODE_ENV === "production" || process.env.VERCEL === "1") && (password === "123456789" || password.length < 12)) {
    throw new Error("Use a unique admin password with at least 12 characters in production.");
  }
  const passwordHash = await hash(password, 12);
  const name = "ReReReverie-admin";

  const [userByUsername, userByEmail] = await Promise.all([
    prisma.user.findUnique({ where: { username } }),
    prisma.user.findUnique({ where: { email } })
  ]);

  if (userByUsername) {
    await prisma.user.update({
      where: { id: userByUsername.id },
      data: {
        name,
        role: "ADMIN",
        passwordHash,
        email: userByUsername.email === email || !userByEmail || userByEmail.id === userByUsername.id ? email : userByUsername.email
      }
    });
  } else if (userByEmail) {
    await prisma.user.update({
      where: { id: userByEmail.id },
      data: {
        username,
        name,
        role: "ADMIN",
        passwordHash
      }
    });
  } else {
    await prisma.user.create({
      data: {
        username,
        name,
        email,
        role: "ADMIN",
        passwordHash
      }
    });
  }

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
