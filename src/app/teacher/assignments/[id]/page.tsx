import { notFound } from "next/navigation";
import { requireRole } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { AppShell } from "@/components/app-shell";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EvaluationForm } from "@/components/teacher/evaluation-form";
import { CATEGORY_LABELS, PRIORITY_LABELS, STATUS_LABELS } from "@/lib/labels";

export default async function TeacherAssignmentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await requireRole("TEACHER");
  const { id } = await params;
  const assignment = await prisma.ticketAssignment.findUnique({
    where: { id },
    include: {
      ticket: true,
      assignee: true,
      evaluation: true,
      comments: { orderBy: { createdAt: "asc" } },
    },
  });
  if (!assignment || assignment.ticket.createdById !== session.user.id) notFound();

  return (
    <AppShell role="TEACHER" userName={session.user.name || "Docente"}>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <h1 className="text-2xl font-semibold">{assignment.ticket.title}</h1>
        <Badge>{STATUS_LABELS[assignment.status]}</Badge>
        <Badge variant="outline">{CATEGORY_LABELS[assignment.ticket.category]}</Badge>
        <Badge variant="outline">{PRIORITY_LABELS[assignment.ticket.priority]}</Badge>
      </div>
      <p className="mb-6 text-sm text-muted-foreground">
        Studente: {assignment.assignee.name}
      </p>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Descrizione cliente</CardTitle>
          </CardHeader>
          <CardContent className="whitespace-pre-wrap text-sm">
            {assignment.ticket.description}
          </CardContent>
        </Card>
        <Card className="border-amber-500/40 bg-amber-50/50 dark:bg-amber-950/20">
          <CardHeader>
            <CardTitle className="text-base">Note segrete docente</CardTitle>
          </CardHeader>
          <CardContent className="whitespace-pre-wrap text-sm">
            {assignment.ticket.secretNotes}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Diagnosi studente</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div>
              <p className="font-medium">Causa root</p>
              <p className="text-muted-foreground">{assignment.rootCause || "—"}</p>
            </div>
            <div>
              <p className="font-medium">Procedura</p>
              <p className="whitespace-pre-wrap text-muted-foreground">
                {assignment.resolutionSteps || "—"}
              </p>
            </div>
            <div>
              <p className="font-medium">Esito test finale</p>
              <p className="text-muted-foreground">{assignment.finalTest || "—"}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Valutazione</CardTitle>
          </CardHeader>
          <CardContent>
            <EvaluationForm
              assignmentId={assignment.id}
              initial={
                assignment.evaluation
                  ? {
                      grade: assignment.evaluation.grade,
                      xpAwarded: assignment.evaluation.xpAwarded,
                      feedback: assignment.evaluation.feedback,
                    }
                  : null
              }
            />
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
