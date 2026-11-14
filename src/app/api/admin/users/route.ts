import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { jsonError, requireApiUser } from "@/lib/api";

const createSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  role: z.nativeEnum(Role),
  xp: z.number().int().min(0).optional(),
});

export async function GET() {
  const { error } = await requireApiUser("ADMIN");
  if (error) return error;

  const users = await prisma.user.findMany({
    orderBy: [{ role: "asc" }, { lastName: "asc" }],
    select: {
      id: true,
      email: true,
      name: true,
      firstName: true,
      lastName: true,
      role: true,
      xp: true,
      createdAt: true,
      _count: { select: { memberships: true, ownedClassrooms: true } },
      memberships: { select: { classroom: { select: { id: true, name: true, code: true } } } },
    },
  });
  return NextResponse.json({ users });
}

export async function POST(req: Request) {
  const { error } = await requireApiUser("ADMIN");
  if (error) return error;
  const parsed = createSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return jsonError("Dati non validi: email, password (min 6), nome, cognome, ruolo");

  const email = parsed.data.email.toLowerCase();
  const exists = await prisma.user.findUnique({ where: { email } });
  if (exists) return jsonError("Email già usata", 409);

  const user = await prisma.user.create({
    data: {
      email,
      passwordHash: await bcrypt.hash(parsed.data.password, 10),
      firstName: parsed.data.firstName.trim(),
      lastName: parsed.data.lastName.trim(),
      name: `${parsed.data.firstName.trim()} ${parsed.data.lastName.trim()}`,
      role: parsed.data.role,
      xp: parsed.data.xp ?? 0,
    },
    select: { id: true, email: true, name: true, role: true, xp: true },
  });
  return NextResponse.json({ user });
}
