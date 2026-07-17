import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function getSessionUser() {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;
  if (!userId) return null;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, role: true }
  });
  if (!user) return null;

  return { session, user };
}

export async function requireUserId() {
  const user = await getSessionUser();
  if (!user) {
    throw new Error("Unauthorized");
  }

  return user.user.id;
}
