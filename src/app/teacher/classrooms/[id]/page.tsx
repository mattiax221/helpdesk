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
      tickets: {
        include: {
          assignments: {
            include: {
              assignee: { select: { name: true } },
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
              {students.map((m) => (
                <div
                  key={m.id}
                  className="flex items-center justify-between rounded-md border px-3 py-2 text-sm"
                >
                  <span>{m.user.name}</span>
                  <Badge variant="secondary">{m.user.xp} XP</Badge>
                </div>
              ))}
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
                  <div key={a.id} className="flex flex-wrap items-center justify-between gap-2 border-t py-2">
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

