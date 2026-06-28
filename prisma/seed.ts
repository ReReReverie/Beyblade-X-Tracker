import { hash } from "bcryptjs";
import { prisma } from "../lib/prisma";

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

  console.log(`Default admin ready: ${username}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
