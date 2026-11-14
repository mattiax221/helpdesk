import { prisma } from "@/lib/prisma";

const TITLE = "Prova desktop — Marco Rossi";

function isMarco(u: { name: string | null; firstName: string | null; lastName: string | null }) {
  const full = `${u.firstName || ""} ${u.lastName || ""}`.trim().toLocaleLowerCase("it");
  const name = (u.name || "").trim().toLocaleLowerCase("it");
  return full === "marco rossi" || name === "marco rossi";
}

/** Compito Lab desktop solo per Marco Rossi (demo). Idempotente. */
export async function ensureMarcoDesktopTask() {
  const students = await prisma.user.findMany({
    where: { role: "STUDENT" },
    include: { memberships: true },
  });
  const marcos = students.filter(isMarco);
  if (!marcos.length) return;

  for (const marco of marcos) {
    for (const membership of marco.memberships) {
      const existing = await prisma.labTask.findFirst({
        where: {
          classroomId: membership.classroomId,
          gameKey: "ossim",
          title: TITLE,
          submissions: { some: { userId: marco.id } },
        },
      });
      if (existing) continue;

      const classroom = await prisma.classroom.findUnique({
        where: { id: membership.classroomId },
        select: { ownerId: true },
      });
      if (!classroom) continue;

      await prisma.labTask.create({
        data: {
          classroomId: membership.classroomId,
          createdById: classroom.ownerId,
          gameKey: "ossim",
          title: TITLE,
          instructions:
            "Apri il desktop simulato, risolvi un caso solo software (DNS, proxy o Linux) e scrivi cosa hai fatto. Punteggio minimo 60.",
          minScore: 60,
          dueAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          submissions: {
            create: [{ userId: marco.id, status: "ASSIGNED" }],
          },
        },
      });
    }
  }
}
