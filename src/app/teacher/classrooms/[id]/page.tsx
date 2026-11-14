import Link from "next/link";
import { notFound } from "next/navigation";
import { requireRole } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { AppShell } from "@/components/app-shell";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CATEGORY_LABELS, PRIORITY_LABELS, STATUS_LABELS } from "@/lib/labels";
import { cn } from "@/lib/utils";
import { AddStudentForm } from "@/components/teacher/add-student-form";
import { GroupsPanel } from "@/components/teacher/groups-panel";
import { ClassroomStatsPanel } from "@/components/teacher/classroom-stats";
import { LabLeaderboard } from "@/components/teacher/lab-leaderboard";
import { AssignLabTaskForm } from "@/components/teacher/assign-lab-task-form";
import { computeClassroomStats } from "@/lib/classroom-stats";
import { getLabGame } from "@/lib/lab-catalog";
import { levelForXp } from "@/lib/levels";

export default async function ClassroomDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await requireRole("TEACHER");
  const { id } = await params;
  const classroom = await prisma.classroom.findUnique({
    where: { id },
    include: {
      memberships: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              role: true,
              xp: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      },
      groups: {
        include: {
          members: {
            include: {
              user: { select: { id: true, name: true, firstName: true, lastName: true } },
            },
          },
        },
        orderBy: { name: "asc" },
      },
      labTasks: {
        include: {
          submissions: true,
        },
        orderBy: { createdAt: "desc" },
      },
      tickets: {
        include: {
          assignments: {
            include: {
              assignee: { select: { id: true, name: true } },
              evaluation: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!classroom || classroom.ownerId !== session.user.id) notFound();

  const students = classroom.memberships.filter((m) => m.user.role === "STUDENT");
  const studentIds = students.map((m) => m.user.id);
  const allAssignments = classroom.tickets.flatMap((t) => t.assignments);

  const gameScores = studentIds.length
    ? await prisma.gameScore.findMany({
        where: { userId: { in: studentIds } },
        select: { userId: true, gameKey: true, score: true, xpEarned: true },
      })
    : [];

  const stats = computeClassroomStats(
    classroom.memberships,
    allAssignments.map((a) => ({
      assigneeId: a.assigneeId,
      status: a.status,
      evaluation: a.evaluation,
    })),
    gameScores,
  );

  const labRows = stats.students
    .map((s) => {
      const scores = gameScores.filter((g) => g.userId === s.userId);
      return {
        userId: s.userId,
        name: s.name,
        labXp: scores.reduce((sum, g) => sum + g.xpEarned, 0),
        bestScore: scores.reduce((max, g) => Math.max(max, g.score), 0),
        plays: scores.length,
      };
    })
    .filter((r) => r.plays > 0)
    .sort((a, b) => b.labXp - a.labXp || b.bestScore - a.bestScore);

  const gameKeys = ["rj45", "terminal", "ports", "subnet", "osi", "cli", "wifi", "ossim"] as const;
  const byGame = gameKeys.map((gameKey) => {
    const bestByUser = new Map<string, number>();
    for (const g of gameScores.filter((x) => x.gameKey === gameKey)) {
      bestByUser.set(g.userId, Math.max(bestByUser.get(g.userId) || 0, g.score));
    }
    const top = [...bestByUser.entries()]
      .map(([userId, score]) => ({
        name: students.find((s) => s.user.id === userId)?.user.name || "Studente",
        score,
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 3);
    return { gameKey, top };
  });

  return (
    <AppShell role="TEACHER" userName={session.user.name || "Docente"}>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Classe</p>
          <h1 className="text-2xl font-semibold">{classroom.name}</h1>
          <p className="font-mono text-sm">Codice {classroom.code}</p>
        </div>
        <Link
          href={`/teacher/tickets/new?classroomId=${classroom.id}`}
          className={cn(buttonVariants(), "bg-teal-700 hover:bg-teal-800")}
        >
          Assegna ticket
        </Link>
      </div>

      <div className="mb-8">
        <ClassroomStatsPanel stats={stats} title="XP, voti e ticket per studente" />
      </div>

      <div className="mb-8">
        <LabLeaderboard rows={labRows} byGame={byGame} />
      </div>

      <div className="mb-8 grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
        <AssignLabTaskForm
          classroomId={classroom.id}
          students={students.map((m) => ({ id: m.user.id, name: m.user.name }))}
          groups={classroom.groups.map((g) => ({ id: g.id, name: g.name }))}
        />
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Compiti Lab ({classroom.labTasks.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {classroom.labTasks.length === 0 && (
              <p className="text-sm text-muted-foreground">
                Nessun compito ancora. Assegnane uno dal pannello a sinistra.
              </p>
            )}
            {classroom.labTasks.map((t) => {
              const done = t.submissions.filter((s) => s.status === "COMPLETED").length;
              const pending = t.submissions.length - done;
              const game = getLabGame(t.gameKey);
              const overdue =
                Boolean(t.dueAt) && t.dueAt!.getTime() < Date.now() && pending > 0;
              return (
                <div
                  key={t.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-md border px-3 py-2 text-sm"
                >
                  <div>
                    <p className="font-medium">{t.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {game?.title || t.gameKey} · min {t.minScore}
                      {t.dueAt
                        ? ` · scad. ${t.dueAt.toLocaleString("it-IT", {
                            dateStyle: "short",
                            timeStyle: "short",
                          })}`
                        : ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {overdue && <Badge variant="destructive">Scaduto · {pending} in ritardo</Badge>}
                    <Badge variant="secondary">
                      {done}/{t.submissions.length} consegnati
                    </Badge>
                    <Link
                      href={`/lab/${t.id}`}
                      className={cn(buttonVariants({ size: "sm", variant: "ghost" }))}
                    >
                      {t.gameKey === "ossim" ? "Report" : "Apri"}
                    </Link>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Studenti ({students.length})</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <AddStudentForm classroomId={classroom.id} />
              <p className="text-xs text-muted-foreground">
                Aggiungi gli studenti al roster, poi condividono il codice {classroom.code} per entrare.
              </p>
              {students.length === 0 && (
                <p className="text-sm text-muted-foreground">Nessuno studente nel roster.</p>
              )}
              {[...students]
                .sort((a, b) => b.user.xp - a.user.xp)
                .map((m) => {
                  const level = levelForXp(m.user.xp);
                  return (
                    <div
                      key={m.id}
                      className="flex items-center justify-between gap-2 rounded-md border px-3 py-2 text-sm"
                    >
                      <span>{m.user.name}</span>
                      <Badge variant="secondary">
                        Lv {level.level} · {level.title} · {m.user.xp} XP
                      </Badge>
                    </div>
                  );
                })}
            </CardContent>
          </Card>

          <GroupsPanel
            classroomId={classroom.id}
            students={students.map((m) => ({ id: m.user.id, name: m.user.name }))}
            initialGroups={classroom.groups}
          />
        </div>

        <div className="space-y-3">
          <h2 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
            Ticket assegnati
          </h2>
          {classroom.tickets.length === 0 && (
            <Card>
              <CardContent className="py-8 text-sm text-muted-foreground">
                Nessun ticket. Creane uno manuale o con AI.
              </CardContent>
            </Card>
          )}
          {classroom.tickets.map((ticket) => (
            <Card key={ticket.id}>
              <CardHeader className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <CardTitle className="text-base">{ticket.title}</CardTitle>
                  <Badge variant="outline">{CATEGORY_LABELS[ticket.category]}</Badge>
                  <Badge variant="outline">{PRIORITY_LABELS[ticket.priority]}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                {ticket.assignments.map((a) => (
                  <div
                    key={a.id}
                    className="flex flex-wrap items-center justify-between gap-2 border-t py-2"
                  >
                    <span>{a.assignee.name}</span>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">{STATUS_LABELS[a.status]}</Badge>
                      {a.evaluation && <Badge>Voto {a.evaluation.grade}</Badge>}
                      <Link
                        href={`/teacher/assignments/${a.id}`}
                        className={cn(buttonVariants({ size: "sm", variant: "ghost" }))}
                      >
                        Apri
                      </Link>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
