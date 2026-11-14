import Link from "next/link";
import { notFound } from "next/navigation";
import { requireSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { AppShell } from "@/components/app-shell";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LabGamePlayer } from "@/components/labs/lab-game-player";
import { getLabGame } from "@/lib/lab-catalog";
import { cn } from "@/lib/utils";
import { hasRole } from "@/lib/roles";
import { parseDesktopAttempt } from "@/lib/desktop-report";
import { LabDesktopReviews } from "@/components/teacher/lab-desktop-reviews";

export default async function LabTaskPage({
  params,
}: {
  params: Promise<{ taskId: string }>;
}) {
  const session = await requireSession();
  const { taskId } = await params;
  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  const role = hasRole(session.user.role, "TEACHER") ? "TEACHER" : "STUDENT";

  const task = await prisma.labTask.findUnique({
    where: { id: taskId },
    include: {
      classroom: {
        include: {
          memberships: { where: { userId: session.user.id } },
        },
      },
      submissions: {
        include: {
          user: { select: { id: true, name: true } },
          scores: { orderBy: { createdAt: "desc" }, take: 1 },
        },
        orderBy: { bestScore: "desc" },
      },
    },
  });

  if (!task) notFound();

  const isOwner =
    task.createdById === session.user.id || task.classroom.ownerId === session.user.id;
  const isMember = task.classroom.memberships.length > 0;
  if (!isOwner && !isMember) notFound();

  const game = getLabGame(task.gameKey);
  const mySubmission = task.submissions.find((s) => s.userId === session.user.id);
  if (mySubmission && mySubmission.status === "ASSIGNED") {
    await prisma.labTaskSubmission.update({
      where: { id: mySubmission.id },
      data: { status: "IN_PROGRESS" },
    });
    mySubmission.status = "IN_PROGRESS";
  }

  const backHref = role === "TEACHER" ? `/teacher/classrooms/${task.classroomId}` : "/student";
  const backLabel = role === "TEACHER" ? "← Classe" : "← Board";

  return (
    <AppShell role={role} userName={session.user.name || "Utente"} xp={user?.xp ?? 0}>
      <div className="mb-4">
        <Link href={backHref} className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}>
          {backLabel}
        </Link>
      </div>

      <div className="mb-6 space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-2xl font-semibold tracking-tight">{task.title}</h1>
          {mySubmission && (
            <Badge variant={mySubmission.status === "COMPLETED" ? "default" : "secondary"}>
              {mySubmission.status === "COMPLETED"
                ? "Consegnato"
                : mySubmission.status === "IN_PROGRESS"
                  ? "In corso"
                  : "Da fare"}
            </Badge>
          )}
        </div>
        <p className="text-sm text-muted-foreground">
          {task.classroom.name} · {game?.skill || task.gameKey} · minimo {task.minScore} pts
        </p>
        {task.instructions && (
          <p className="max-w-3xl text-sm leading-relaxed">{task.instructions}</p>
        )}
        {mySubmission && (
          <div className="flex flex-wrap gap-2 text-xs">
            <Badge variant="outline">Best score {mySubmission.bestScore}</Badge>
            <Badge variant="outline">{mySubmission.attempts} tentativi</Badge>
            <Badge variant="outline">+{mySubmission.xpEarned} XP da questo compito</Badge>
          </div>
        )}
        {mySubmission?.teacherNote ? (
          <div className="max-w-3xl rounded-md border border-teal-700/30 bg-teal-50 px-3 py-2 text-sm dark:bg-teal-950/40">
            <p className="text-xs font-medium uppercase tracking-wide text-teal-800 dark:text-teal-200">
              Commento del docente
            </p>
            <p className="mt-1 whitespace-pre-wrap">{mySubmission.teacherNote}</p>
          </div>
        ) : null}
      </div>

      {role === "STUDENT" ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{game?.title || task.gameKey}</CardTitle>
            <CardDescription>
              Completa il mini-game. Se raggiungi almeno {task.minScore} punti il compito risulta
              consegnato (puoi ritentare per migliorare).
            </CardDescription>
          </CardHeader>
          <CardContent>
            <LabGamePlayer gameKey={task.gameKey} taskId={task.id} minScore={task.minScore} />
          </CardContent>
        </Card>
      ) : task.gameKey === "ossim" ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Report desktop</CardTitle>
            <CardDescription>
              Testo scritto dallo studente, azioni sul PC simulato e voto automatico. Il commento resta visibile allo studente.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <LabDesktopReviews
              rows={task.submissions.map((s) => {
                const latest = s.scores[0];
                return {
                  id: s.id,
                  name: s.user.name || "Studente",
                  status: s.status,
                  bestScore: s.bestScore,
                  attempts: s.attempts,
                  teacherNote: s.teacherNote,
                  attempt: latest
                    ? parseDesktopAttempt(latest.meta, latest.score, latest.createdAt)
                    : null,
                };
              })}
            />
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Consegne studenti</CardTitle>
            <CardDescription>
              {task.submissions.filter((s) => s.status === "COMPLETED").length}/
              {task.submissions.length} consegnati
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {task.submissions.map((s) => (
              <div
                key={s.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-md border px-3 py-2 text-sm"
              >
                <span>{s.user.name}</span>
                <div className="flex gap-2">
                  <Badge variant="secondary">{s.status}</Badge>
                  <Badge variant="outline">Best {s.bestScore}</Badge>
                  <Badge variant="outline">{s.attempts} try</Badge>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </AppShell>
  );
}
