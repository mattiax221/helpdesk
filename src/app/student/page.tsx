import { requireRole } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { ensureMarcoDesktopTask } from "@/lib/ensure-marco-desktop";
import { AppShell } from "@/components/app-shell";
import { KanbanBoard } from "@/components/kanban/board";
import { LocalizedHeading } from "@/components/localized-heading";
import { Card, CardContent } from "@/components/ui/card";

export default async function StudentBoardPage() {
  const session = await requireRole("STUDENT");
  await ensureMarcoDesktopTask();
  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  const assignments = await prisma.ticketAssignment.findMany({
    where: { assigneeId: session.user.id },
    include: {
      ticket: true,
      evaluation: true,
    },
    orderBy: { updatedAt: "desc" },
  });

  const items = assignments.map((a) => ({
    id: a.id,
    status: a.status,
    title: a.ticket.title,
    category: a.ticket.category,
    priority: a.ticket.priority,
    slaMinutes: a.ticket.slaMinutes,
    startedAt: a.startedAt,
    createdAt: a.createdAt,
    grade: a.evaluation?.grade ?? null,
    chainKey: a.ticket.chainKey,
    chainStep: a.ticket.chainStep,
  }));

  return (
    <AppShell role="STUDENT" userName={session.user.name || "Studente"} xp={user?.xp ?? 0}>
      <LocalizedHeading titleKey="board_title" subtitleKey="board_subtitle" />
      {items.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-sm text-muted-foreground">
            Nessun ticket assegnato. Chiedi al docente il Codice Classe o attendi nuove assegnazioni.
          </CardContent>
        </Card>
      ) : (
        <KanbanBoard initialItems={items} />
      )}
    </AppShell>
  );
}
