import Link from "next/link";
import { requireSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { AppShell } from "@/components/app-shell";
import { LocalizedHeading } from "@/components/localized-heading";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getLabGame } from "@/lib/lab-catalog";
import { cn } from "@/lib/utils";
import { ClipboardList, Clock3 } from "lucide-react";

const STATUS_LABEL: Record<string, string> = {
  ASSIGNED: "Da fare",
  IN_PROGRESS: "In corso",
  COMPLETED: "Consegnato",
};

export default async function LabPage() {
  const session = await requireSession();
  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  const role = session.user.role === "TEACHER" ? "TEACHER" : "STUDENT";

  let tasks: Array<{
    id: string;
    title: string;
    instructions: string;
    gameKey: string;
    minScore: number;
    dueAt: Date | null;
    classroomName: string;
    status: string;
    bestScore: number;
    attempts: number;
  }> = [];

  if (role === "TEACHER") {
    const rows = await prisma.labTask.findMany({
      where: { createdById: session.user.id },
      include: {
        classroom: { select: { name: true } },
        submissions: true,
      },
      orderBy: { createdAt: "desc" },
    });
    tasks = rows.map((t) => {
      const completed = t.submissions.filter((s) => s.status === "COMPLETED").length;
      return {
        id: t.id,
        title: t.title,
        instructions: t.instructions,
        gameKey: t.gameKey,
        minScore: t.minScore,
        dueAt: t.dueAt,
        classroomName: t.classroom.name,
        status: `${completed}/${t.submissions.length} consegnati`,
        bestScore: 0,
        attempts: t.submissions.reduce((a, s) => a + s.attempts, 0),
      };
    });
  } else {
    const memberships = await prisma.classroomMembership.findMany({
      where: { userId: session.user.id },
      select: { classroomId: true },
    });
    const rows = await prisma.labTask.findMany({
      where: { classroomId: { in: memberships.map((m) => m.classroomId) } },
      include: {
        classroom: { select: { name: true } },
        submissions: { where: { userId: session.user.id } },
      },
      orderBy: { createdAt: "desc" },
    });
    tasks = rows.map((t) => {
      const sub = t.submissions[0];
      return {
        id: t.id,
        title: t.title,
        instructions: t.instructions,
        gameKey: t.gameKey,
        minScore: t.minScore,
        dueAt: t.dueAt,
        classroomName: t.classroom.name,
        status: sub?.status || "ASSIGNED",
        bestScore: sub?.bestScore || 0,
        attempts: sub?.attempts || 0,
      };
    });
  }

  const todo = tasks.filter((t) => role === "STUDENT" && t.status !== "COMPLETED");
  const done = tasks.filter((t) => role === "STUDENT" && t.status === "COMPLETED");

  return (
    <AppShell role={role} userName={session.user.name || "Utente"} xp={user?.xp ?? 0}>
      <LocalizedHeading titleKey="lab_title" subtitleKey="lab_subtitle" />

      {role === "TEACHER" && (
        <p className="mb-4 text-sm text-muted-foreground">
          I compiti Lab si assegnano dal dettaglio classe. Qui vedi lo stato delle consegne.
        </p>
      )}

      {tasks.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-sm text-muted-foreground">
            {role === "TEACHER"
              ? "Nessun compito Lab ancora. Apri una classe e usa “Assegna compito Lab”."
              : "Nessun compito Lab assegnato. Il docente pubblicherà esercizi da qui."}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {role === "STUDENT" && todo.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
                Da svolgere ({todo.length})
              </h2>
              <div className="grid gap-3 md:grid-cols-2">
                {todo.map((t) => (
                  <TaskCard key={t.id} task={t} />
                ))}
              </div>
            </section>
          )}

          {role === "STUDENT" && done.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
                Consegnati ({done.length})
              </h2>
              <div className="grid gap-3 md:grid-cols-2">
                {done.map((t) => (
                  <TaskCard key={t.id} task={t} />
                ))}
              </div>
            </section>
          )}

          {role === "TEACHER" && (
            <div className="grid gap-3 md:grid-cols-2">
              {tasks.map((t) => (
                <TaskCard key={t.id} task={t} teacher />
              ))}
            </div>
          )}
        </div>
      )}
    </AppShell>
  );
}

function TaskCard({
  task,
  teacher,
}: {
  task: {
    id: string;
    title: string;
    instructions: string;
    gameKey: string;
    minScore: number;
    dueAt: Date | null;
    classroomName: string;
    status: string;
    bestScore: number;
    attempts: number;
  };
  teacher?: boolean;
}) {
  const game = getLabGame(task.gameKey);
  return (
    <Card className="overflow-hidden">
      <CardHeader className="space-y-2 pb-2">
        <div className="flex flex-wrap items-center gap-2">
          <ClipboardList className="size-4 text-teal-700" />
          <CardTitle className="text-base">{task.title}</CardTitle>
          {!teacher && (
            <Badge
              variant={task.status === "COMPLETED" ? "default" : "secondary"}
              className={task.status === "COMPLETED" ? "bg-teal-700" : ""}
            >
              {STATUS_LABEL[task.status] || task.status}
            </Badge>
          )}
          {teacher && <Badge variant="outline">{task.status}</Badge>}
        </div>
        <CardDescription>
          {game?.skill || task.gameKey} · {task.classroomName}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <p className="line-clamp-2 text-muted-foreground">{task.instructions}</p>
        <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
          <Badge variant="outline">Min {task.minScore} pts</Badge>
          {!teacher && <Badge variant="outline">Best {task.bestScore}</Badge>}
          <Badge variant="outline">{task.attempts} tentativi</Badge>
          {task.dueAt && (
            <span className="inline-flex items-center gap-1">
              <Clock3 className="size-3.5" />
              Scad. {task.dueAt.toLocaleDateString("it-IT")}
            </span>
          )}
        </div>
        <Link
          href={`/lab/${task.id}`}
          className={cn(buttonVariants({ size: "sm" }), "bg-teal-700 hover:bg-teal-800")}
        >
          {teacher ? "Apri compito" : task.status === "COMPLETED" ? "Rivedi / migliora" : "Svolgi compito"}
        </Link>
      </CardContent>
    </Card>
  );
}
