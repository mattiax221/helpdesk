import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { jsonError, requireApiUser } from "@/lib/api";

const patchSchema = z.object({
  email: z.string().email().optional(),
  password: z.string().min(6).optional().or(z.literal("")),
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  role: z.nativeEnum(Role).optional(),
  xp: z.number().int().min(0).optional(),
});

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { user, error } = await requireApiUser("ADMIN");
  if (error || !user) return error!;
  const { id } = await ctx.params;
  const parsed = patchSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return jsonError("Dati non validi");

  const current = await prisma.user.findUnique({ where: { id } });
  if (!current) return jsonError("Utente non trovato", 404);

  const data: {
    email?: string;
    passwordHash?: string;
    firstName?: string;
    lastName?: string;
    name?: string;
    role?: Role;
    xp?: number;
  } = {};

  if (parsed.data.email) {
    const email = parsed.data.email.toLowerCase();
    const taken = await prisma.user.findUnique({ where: { email } });
    if (taken && taken.id !== id) return jsonError("Email già usata", 409);
    data.email = email;
  }
  if (parsed.data.password) data.passwordHash = await bcrypt.hash(parsed.data.password, 10);
  if (parsed.data.firstName) data.firstName = parsed.data.firstName.trim();
  if (parsed.data.lastName) data.lastName = parsed.data.lastName.trim();
  if (parsed.data.role) {
    if (id === user.id && parsed.data.role !== "ADMIN") {
      return jsonError("Non puoi toglierti il ruolo admin");
    }
    data.role = parsed.data.role;
  }
  if (parsed.data.xp !== undefined) data.xp = parsed.data.xp;

  const first = data.firstName ?? current.firstName ?? "";
  const last = data.lastName ?? current.lastName ?? "";
  if (first || last) data.name = `${first} ${last}`.trim();

  const updated = await prisma.user.update({
    where: { id },
    data,
    select: { id: true, email: true, name: true, role: true, xp: true },
  });
  return NextResponse.json({ user: updated });
}

export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { user, error } = await requireApiUser("ADMIN");
  if (error || !user) return error!;
  const { id } = await ctx.params;
  if (id === user.id) return jsonError("Non puoi eliminare il tuo account");

  const current = await prisma.user.findUnique({
    where: { id },
    include: { _count: { select: { ownedClassrooms: true } } },
  });
  if (!current) return jsonError("Utente non trovato", 404);
  if (current._count.ownedClassrooms > 0) {
    return jsonError("Questo utente possiede delle classi: eliminalo solo dopo averle riassegnate o cancellate");
  }

  await prisma.user.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
