import { requireRole } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { AppShell } from "@/components/app-shell";
import { TicketForm } from "@/components/teacher/ticket-form";

export default async function NewTicketPage({
  searchParams,
}: {
  searchParams: Promise<{ classroomId?: string }>;
}) {
  const session = await requireRole("TEACHER");
  const sp = await searchParams;
  const classrooms = await prisma.classroom.findMany({
    where: { ownerId: session.user.id },
    include: {
      memberships: {
        include: {
          user: { select: { id: true, name: true, role: true } },
        },
      },
      groups: {
        include: { members: true },
        orderBy: { name: "asc" },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const options = classrooms.map((c) => ({
    id: c.id,
    name: c.name,
    code: c.code,
    students: c.memberships
      .filter((m) => m.user.role === "STUDENT")
      .map((m) => ({ id: m.user.id, name: m.user.name })),
    groups: c.groups.map((g) => ({
      id: g.id,
      name: g.name,
      memberIds: g.members.map((m) => m.userId),
    })),
  }));

  return (
    <AppShell role="TEACHER" userName={session.user.name || "Docente"}>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold">Nuovo ticket</h1>
        <p className="text-sm text-muted-foreground">
          Crea manualmente o genera con AI uno scenario help desk realistico.
        </p>
      </div>
      {options.length === 0 ? (
        <p className="text-sm text-muted-foreground">Crea prima una classe dalla dashboard.</p>
      ) : (
        <TicketForm classrooms={options} defaultClassroomId={sp.classroomId} />
      )}
    </AppShell>
  );
}
