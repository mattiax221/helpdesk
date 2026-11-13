import Link from "next/link";
import { Plus, Users, Ticket, Link2 } from "lucide-react";
import { requireRole } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { AppShell } from "@/components/app-shell";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CreateClassroomForm } from "@/components/teacher/create-classroom-form";
import { GoogleClassroomButton } from "@/components/teacher/google-classroom-button";
import { cn } from "@/lib/utils";

export default async function TeacherDashboardPage() {
  const session = await requireRole("TEACHER");
  const classrooms = await prisma.classroom.findMany({
    where: { ownerId: session.user.id },
    include: {
      _count: { select: { memberships: true, tickets: true } },
      tickets: {
        include: {
          assignments: {
            where: { status: "WAITING_REVIEW" },
            select: { id: true },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const pendingReviews = classrooms.reduce(
    (acc, c) => acc + c.tickets.reduce((a, t) => a + t.assignments.length, 0),
    0,
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
