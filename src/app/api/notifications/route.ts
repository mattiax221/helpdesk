import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireApiUser, jsonError } from "@/lib/api";

export async function GET() {
  const { user, error } = await requireApiUser("TEACHER");
  if (error || !user) return error!;

  const notifications = await prisma.notification.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
  const unread = notifications.filter((n) => !n.readAt).length;
  return NextResponse.json({ notifications, unread });
}

const patchSchema = z.object({
  ids: z.array(z.string()).optional(),
  all: z.boolean().optional(),
});

export async function PATCH(req: Request) {
  const { user, error } = await requireApiUser("TEACHER");
  if (error || !user) return error!;

  const body = await req.json().catch(() => null);
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) return jsonError("Dati non validi");

  const now = new Date();
  if (parsed.data.all) {
    await prisma.notification.updateMany({
      where: { userId: user.id, readAt: null },
      data: { readAt: now },
    });
  } else if (parsed.data.ids?.length) {
    await prisma.notification.updateMany({
      where: { userId: user.id, id: { in: parsed.data.ids } },
      data: { readAt: now },
    });
  } else {
    return jsonError("Specifica ids o all");
  }

  return NextResponse.json({ ok: true });
}
