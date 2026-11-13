import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireApiUser, jsonError } from "@/lib/api";
import { LAB_GAME_KEYS } from "@/lib/lab-catalog";

const schema = z.object({
  gameKey: z.enum(LAB_GAME_KEYS),
  score: z.number().int().min(0).max(1000),
  taskId: z.string().optional(),
  meta: z.record(z.string(), z.unknown()).optional(),
});

const XP_BY_GAME: Record<(typeof LAB_GAME_KEYS)[number], number> = {
  rj45: 15,
  terminal: 15,
  ports: 15,
  subnet: 15,
  osi: 15,
  cli: 15,
  wifi: 15,
};

const DAILY_XP_CAP = 90;

export async function POST(req: Request) {
  const { user, error } = await requireApiUser();
  if (error || !user) return error!;

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return jsonError("Punteggio non valido");

  const { gameKey, score, taskId, meta } = parsed.data;

  let submissionId: string | undefined;
  let completed = false;
  let bestScore = score;

  if (taskId) {
    const task = await prisma.labTask.findUnique({
      where: { id: taskId },
      include: {
        classroom: {
          include: { memberships: { where: { userId: user.id } } },
        },
        submissions: { where: { userId: user.id } },
      },
    });
    if (!task) return jsonError("Compito non trovato", 404);
    if (task.gameKey !== gameKey) return jsonError("Gioco non corrispondente al compito");
    if (task.classroom.memberships.length === 0 && user.role !== "TEACHER") {
      return jsonError("Non sei iscritto a questa classe", 403);
    }

    let submission = task.submissions[0];
    if (!submission) {
      submission = await prisma.labTaskSubmission.create({
        data: {
          taskId: task.id,
          userId: user.id,
          status: "IN_PROGRESS",
        },
      });
    }

    const nextBest = Math.max(submission.bestScore, score);
    const reached = nextBest >= task.minScore;
    submission = await prisma.labTaskSubmission.update({
      where: { id: submission.id },
      data: {
        attempts: { increment: 1 },
        bestScore: nextBest,
        status: reached ? "COMPLETED" : submission.status === "ASSIGNED" ? "IN_PROGRESS" : submission.status,
        completedAt: reached ? submission.completedAt || new Date() : submission.completedAt,
      },
    });
    submissionId = submission.id;
    completed = submission.status === "COMPLETED";
    bestScore = submission.bestScore;
  }

  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const earnedToday = await prisma.gameScore.aggregate({
    where: { userId: user.id, createdAt: { gte: startOfDay } },
    _sum: { xpEarned: true },
  });
  const already = earnedToday._sum.xpEarned ?? 0;
  const xpEarned = Math.max(0, Math.min(XP_BY_GAME[gameKey], DAILY_XP_CAP - already));

  const gameScore = await prisma.gameScore.create({
    data: {
      userId: user.id,
      gameKey,
      score: Math.min(score, 1000),
      xpEarned,
      meta: JSON.stringify(meta ?? {}),
      submissionId,
    },
  });

  if (xpEarned > 0) {
    await prisma.user.update({
      where: { id: user.id },
      data: { xp: { increment: xpEarned } },
    });
  }

  if (submissionId && xpEarned > 0) {
    await prisma.labTaskSubmission.update({
      where: { id: submissionId },
      data: { xpEarned: { increment: xpEarned } },
    });
  }

  return NextResponse.json({ gameScore, xpEarned, completed, bestScore });
}
