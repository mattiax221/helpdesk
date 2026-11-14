import Link from "next/link";
import { Plus, Users, Ticket, Link2, BarChart3 } from "lucide-react";
import { requireRole } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { AppShell } from "@/components/app-shell";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CreateClassroomForm } from "@/components/teacher/create-classroom-form";
import { GoogleClassroomButton } from "@/components/teacher/google-classroom-button";
import { cn } from "@/lib/utils";
import { computeClassroomStats } from "@/lib/classroom-stats";

export default async function TeacherDashboardPage() {
  const session = await requireRole("TEACHER");
  const classrooms = await prisma.classroom.findMany({
    where: { ownerId: session.user.id },
    include: {
      _count: { select: { memberships: true, tickets: true } },
      memberships: {
        include: {
          user: { select: { id: true, name: true, role: true, xp: true } },
        },
      },
      tickets: {
        include: {
          assignments: {
            include: { evaluation: true },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const pendingReviews = classrooms.reduce(
    (acc, c) =>
      acc +
      c.tickets.reduce(
        (a, t) => a + t.assignments.filter((x) => x.status === "WAITING_REVIEW").length,
        0,
      ),
    0,
  );

  const overview = classrooms.map((c) => {
    const stats = computeClassroomStats(
      c.memberships,
      c.tickets.flatMap((t) =>
        t.assignments.map((a) => ({
          assigneeId: a.assigneeId,
          status: a.status,
          evaluation: a.evaluation,
        })),
      ),
    );
    return { id: c.id, name: c.name, stats };
  });
  const totalStudents = overview.reduce((s, o) => s + o.stats.studentCount, 0);
  const totalClosed = overview.reduce((s, o) => s + o.stats.closedTickets, 0);
  const grades = overview
    .map((o) => o.stats.avgGrade)
    .filter((g): g is number => g !== null);
  const globalAvgGrade =
    grades.length === 0
      ? null
      : Math.round((grades.reduce((s, g) => s + g, 0) / grades.length) * 10) / 10;
  const globalAvgXp =
    totalStudents === 0
      ? 0
      : Math.round(
          overview.reduce((s, o) => s + o.stats.avgXp * o.stats.studentCount, 0) / totalStudents,
        );

  return (
    <AppShell role="TEACHER" userName={session.user.name || "Docente"}>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">IT Manager Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Gestisci classi, assegna ticket e valuta le diagnosi degli studenti.
          </p>
        </div>
        <div className="flex gap-2">
          {session.user.role === "ADMIN" ? (
            <Link href="/admin" className={cn(buttonVariants({ variant: "outline" }))}>
              Admin
            </Link>
          ) : null}
          <Link
            href="/teacher/review"
            className={cn(buttonVariants({ variant: "outline" }))}
          >
            Revisioni ({pendingReviews})
          </Link>
          <Link
            href="/teacher/tickets/new"
            className={cn(buttonVariants(), "bg-teal-700 hover:bg-teal-800")}
          >
            <Plus className="mr-1 size-4" />
            Nuovo ticket
          </Link>
        </div>
      </div>

      <div className="mb-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardContent className="pt-4">
            <p className="text-xs uppercase text-muted-foreground">Studenti</p>
            <p className="text-2xl font-semibold">{totalStudents}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-xs uppercase text-muted-foreground">XP medi</p>
            <p className="text-2xl font-semibold">{globalAvgXp}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-xs uppercase text-muted-foreground">Ticket chiusi</p>
            <p className="text-2xl font-semibold">{totalClosed}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-xs uppercase text-muted-foreground">Voto medio</p>
            <p className="text-2xl font-semibold">
              {globalAvgGrade === null ? "—" : `${globalAvgGrade}/10`}
            </p>
          </CardContent>
        </Card>
      </div>

      {overview.length > 0 && (
        <Card className="mb-6">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <BarChart3 className="size-4" />
              Riepilogo per classe
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {overview.map((o) => (
              <div
                key={o.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-md border px-3 py-2 text-sm"
              >
                <span className="font-medium">{o.name}</span>
                <div className="flex flex-wrap gap-3 text-muted-foreground">
                  <span>XP medi {o.stats.avgXp}</span>
                  <span>Chiusi {o.stats.closedTickets}</span>
                  <span>Verifica {o.stats.waitingReview}</span>
                  <span>
                    Voto {o.stats.avgGrade === null ? "—" : `${o.stats.avgGrade}/10`}
                  </span>
                  <Link
                    href={`/teacher/classrooms/${o.id}`}
                    className={cn(buttonVariants({ size: "sm", variant: "ghost" }))}
                  >
                    Dettaglio
                  </Link>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-4">
          <h2 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
            Le tue classi
          </h2>
          {classrooms.length === 0 ? (
            <Card>
              <CardHeader>
                <CardTitle>Nessuna classe</CardTitle>
                <CardDescription>Crea la prima classe per iniziare il laboratorio.</CardDescription>
              </CardHeader>
            </Card>
          ) : (
            classrooms.map((classroom) => (
              <Card key={classroom.id} className="overflow-hidden">
                <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0">
                  <div>
                    <CardTitle className="text-lg">{classroom.name}</CardTitle>
                    <CardDescription>
                      Codice: <span className="font-mono font-semibold text-foreground">{classroom.code}</span>
                    </CardDescription>
                  </div>
                  <GoogleClassroomButton classroomId={classroom.id} linked={Boolean(classroom.googleCourseId)} />
                </CardHeader>
                <CardContent className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                  <span className="inline-flex items-center gap-1">
                    <Users className="size-4" /> {classroom._count.memberships} membri
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Ticket className="size-4" /> {classroom._count.tickets} ticket
                  </span>
                  {classroom.googleCourseId && (
                    <span className="inline-flex items-center gap-1 text-teal-700 dark:text-teal-300">
                      <Link2 className="size-4" /> Classroom collegato
                    </span>
                  )}
                  <Link
                    href={`/teacher/classrooms/${classroom.id}`}
                    className={cn(buttonVariants({ size: "sm", variant: "secondary" }), "ml-auto")}
                  >
                    Apri
                  </Link>
                </CardContent>
              </Card>
            ))
          )}
        </div>
        <CreateClassroomForm />
      </div>
    </AppShell>
  );
}
