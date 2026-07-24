import { hash } from "bcryptjs";
import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const signupSchema = z.object({
  name: z.string().trim().max(80).optional(),
  username: z.string().trim().min(3).max(40),
  email: z.string().trim().email().optional().or(z.literal("")),
  password: z.string().min(8).max(120)
});

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = signupSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid signup details." }, { status: 400 });
  }

  const username = parsed.data.username.toLowerCase();
  const email = parsed.data.email ? parsed.data.email.toLowerCase() : null;

  try {
    const usernameExists = await prisma.user.findUnique({ where: { username } });
    if (usernameExists) {
      return NextResponse.json({ error: "That username is already registered." }, { status: 409 });
    }

    const emailExists = email ? await prisma.user.findUnique({ where: { email } }) : null;
    if (emailExists) {
      return NextResponse.json({ error: "That email is already registered." }, { status: 409 });
    }

    await prisma.user.create({
      data: {
        email,
        name: parsed.data.name,
        username,
        passwordHash: await hash(parsed.data.password, 12)
      }
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    // The pre-checks above improve the common case, but unique constraints can
    // still race when two signup requests arrive at the same time.
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      const target = Array.isArray(error.meta?.target) ? error.meta.target.join(",") : String(error.meta?.target ?? "");
      const message = target.includes("email")
        ? "That email is already registered."
        : "That username is already registered.";
      return NextResponse.json({ error: message }, { status: 409 });
    }

    console.error("Signup failed:", error);
    return NextResponse.json(
      { error: "Unable to create your account right now. Please try again shortly." },
      { status: 503 }
    );
  }
}
