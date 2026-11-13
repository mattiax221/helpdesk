import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireApiUser, jsonError } from "@/lib/api";

const schema = z.object({
  gameKey: z.enum(["rj45", "terminal", "ports", "subnet"]),
  score: z.number().int().min(0).max(1000),
  meta: z.record(z.string(), z.unknown()).optional(),
});

const XP_BY_GAME = {
  rj45: 15,
  terminal: 15,
  ports: 15,
  subnet: 15,
} as const;

const DAILY_XP_CAP = 60;

export async function POST(req: Request) {
  const { user, error } = await requireApiUser();
  if (error || !user) return error!;

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return jsonError("Punteggio non valido");

  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const earnedToday = await prisma.gameScore.aggregate({
    where: { userId: user.id, createdAt: { gte: startOfDay } },
    _sum: { xpEarned: true },
  });
  const already = earnedToday._sum.xpEarned ?? 0;
  const xpEarned = Math.max(0, Math.min(XP_BY_GAME[parsed.data.gameKey], DAILY_XP_CAP - already));

  const gameScore = await prisma.gameScore.create({
    data: {
      userId: user.id,
      gameKey: parsed.data.gameKey,
      score: Math.min(parsed.data.score, 1000),
      xpEarned,
      meta: JSON.stringify(parsed.data.meta ?? {}),
    },
  });

  if (xpEarned > 0) {
    await prisma.user.update({
      where: { id: user.id },
      data: { xp: { increment: xpEarned } },
    });
  }

  return NextResponse.json({ gameScore, xpEarned });
}
