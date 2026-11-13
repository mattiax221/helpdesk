import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireApiUser, jsonError } from "@/lib/api";

const schema = z.object({
  gameKey: z.enum(["rj45", "terminal"]),
  score: z.number().int().min(0).max(10000),
  xpEarned: z.number().int().min(0).max(200),
  meta: z.record(z.string(), z.unknown()).optional(),
});

export async function POST(req: Request) {
  const { user, error } = await requireApiUser();
  if (error || !user) return error!;

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return jsonError("Punteggio non valido");

  const gameScore = await prisma.gameScore.create({
    data: {
      userId: user.id,
      gameKey: parsed.data.gameKey,
      score: parsed.data.score,
      xpEarned: parsed.data.xpEarned,
      meta: JSON.stringify(parsed.data.meta ?? {}),
    },
  });

  await prisma.user.update({
    where: { id: user.id },
    data: { xp: { increment: parsed.data.xpEarned } },
  });

  return NextResponse.json({ gameScore });
}
