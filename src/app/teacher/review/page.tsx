import Link from "next/link";
import { requireRole } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { AppShell } from "@/components/app-shell";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { STATUS_LABELS, CATEGORY_LABELS, PRIORITY_LABELS } from "@/lib/labels";
import { cn } from "@/lib/utils";

export default async function ReviewPage() {
  const session = await requireRole("TEACHER");
  const assignments = await prisma.ticketAssignment.findMany({
    where: {
      ticket: {
        OR: [{ createdById: session.user.id }, { classroom: { ownerId: session.user.id } }],
      },
      status: { in: ["WAITING_REVIEW", "RESOLVED", "IN_PROGRESS"] },
    },
    include: {
      ticket: {
        select: {
          title: true,
          category: true,
          priority: true,
          classroom: { select: { name: true, code: true } },
        },
      },
      assignee: { select: { name: true, xp: true } },
      evaluation: true,
    },
    orderBy: [{ status: "asc" }, { submittedAt: "desc" }],
  });

  const pending = assignments.filter((a) => a.status === "WAITING_REVIEW");
  const inProgress = assignments.filter((a) => a.status === "IN_PROGRESS");
  const done = assignments.filter((a) => a.status === "RESOLVED");

  function Section({
    title,
    items,
    empty,
  }: {
    title: string;
    items: typeof assignments;
    empty: string;
  }) {
    return (
      <section className="space-y-3">
        <h2 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
          {title} ({items.length})
        </h2>
        {items.length === 0 && (
          <Card>
            <CardContent className="py-8 text-center text-sm text-muted-foreground">{empty}</CardContent>
          </Card>
        )}
        {items.map((a) => (
          <Card key={a.id}>
            <CardHeader className="flex flex-row items-center justify-between gap-3 space-y-0">
              <div className="space-y-1">
                <CardTitle className="text-base">{a.ticket.title}</CardTitle>
                <p className="text-sm text-muted-foreground">
                  {a.assignee.name} · {a.ticket.classroom.name} ({a.ticket.classroom.code})
                </p>
                <div className="flex flex-wrap gap-1">
                  <Badge variant="outline">{CATEGORY_LABELS[a.ticket.category]}</Badge>
                  <Badge variant="outline">{PRIORITY_LABELS[a.ticket.priority]}</Badge>
                  <Badge variant="secondary">{STATUS_LABELS[a.status]}</Badge>
                  {a.evaluation && <Badge>Voto {a.evaluation.grade}</Badge>}
                </div>
              </div>
              <Link
                href={`/teacher/assignments/${a.id}`}
                className={cn(buttonVariants({ size: "sm" }))}
              >
                {a.status === "WAITING_REVIEW" ? "Valuta" : "Apri"}
              </Link>
            </CardHeader>
          </Card>
        ))}
      </section>
    );
  }

  return (
    <AppShell role="TEACHER" userName={session.user.name || "Docente"}>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold">Revisioni e valutazioni</h1>
        <p className="text-sm text-muted-foreground">
          Priorità alle consegne in verifica, poi lavori in corso e ticket già valutati.
        </p>
      </div>
      <div className="space-y-8">
        <Section
          title="In attesa di verifica"
          items={pending}
          empty="Nessun ticket in verifica. Gli studenti devono inviare la diagnosi."
        />
        <Section title="In lavorazione" items={inProgress} empty="Nessuno sta lavorando ora." />
        <Section title="Risolti / valutati" items={done} empty="Ancora nessuna valutazione." />
      </div>
    </AppShell>
  );
}
