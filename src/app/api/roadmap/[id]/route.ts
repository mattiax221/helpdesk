import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireApiUser, jsonError } from "@/lib/api";

const patchSchema = z.object({
  title: z.string().min(3).max(120).optional(),
  description: z.string().max(500).optional(),
  category: z.string().min(2).max(40).optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH"]).optional(),
  status: z.enum(["IDEA", "PLANNED", "IN_PROGRESS", "DONE"]).optional(),
});

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { user, error } = await requireApiUser("TEACHER");
  if (error || !user) return error!;
  const { id } = await params;

  const body = await req.json().catch(() => null);
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) return jsonError("Dati non validi");

  const existing = await prisma.roadmapItem.findUnique({ where: { id } });
  if (!existing) return jsonError("Voce non trovata", 404);

  const item = await prisma.roadmapItem.update({
    where: { id },
    data: parsed.data,
  });
  return NextResponse.json({ item });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { user, error } = await requireApiUser("TEACHER");
  if (error || !user) return error!;
  const { id } = await params;

  await prisma.roadmapItem.delete({ where: { id } }).catch(() => null);
  return NextResponse.json({ ok: true });
}
