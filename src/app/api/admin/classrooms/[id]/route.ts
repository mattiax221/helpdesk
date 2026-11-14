import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { jsonError, requireApiUser } from "@/lib/api";

const patchSchema = z.object({
  name: z.string().min(2).optional(),
  code: z.string().min(3).optional(),
  description: z.string().optional(),
  ownerId: z.string().min(1).optional(),
});

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { error } = await requireApiUser("ADMIN");
  if (error) return error;
  const { id } = await ctx.params;
  const parsed = patchSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return jsonError("Dati non validi");

  if (parsed.data.code) {
    const taken = await prisma.classroom.findUnique({ where: { code: parsed.data.code } });
    if (taken && taken.id !== id) return jsonError("Codice classe già usato", 409);
  }
  if (parsed.data.ownerId) {
    const owner = await prisma.user.findUnique({ where: { id: parsed.data.ownerId } });
    if (!owner || (owner.role !== "TEACHER" && owner.role !== "ADMIN")) {
      return jsonError("Il proprietario deve essere un docente o un admin");
    }
  }

  const classroom = await prisma.classroom.update({
    where: { id },
    data: parsed.data,
  });
  return NextResponse.json({ classroom });
}

export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { error } = await requireApiUser("ADMIN");
  if (error) return error;
  const { id } = await ctx.params;
  await prisma.classroom.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
