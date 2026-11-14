import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const TITLE = "Prova desktop — Marco Rossi";

async function main() {
  const students = await prisma.user.findMany({
    where: { role: "STUDENT" },
    include: { memberships: true },
  });
  const marcos = students.filter((u) => {
    const full = `${u.firstName || ""} ${u.lastName || ""}`.trim().toLocaleLowerCase("it");
    return full === "marco rossi" || (u.name || "").toLocaleLowerCase("it") === "marco rossi";
  });
  console.log("marcos", marcos.map((m) => m.name));
  for (const marco of marcos) {
    for (const membership of marco.memberships) {
      const existing = await prisma.labTask.findFirst({
        where: { classroomId: membership.classroomId, gameKey: "ossim", title: TITLE },
      });
      if (existing) {
        console.log("already", existing.id);
        continue;
      }
      const classroom = await prisma.classroom.findUnique({
        where: { id: membership.classroomId },
      });
      if (!classroom) continue;
      const task = await prisma.labTask.create({
        data: {
          classroomId: classroom.id,
          createdById: classroom.ownerId,
          gameKey: "ossim",
          title: TITLE,
          instructions:
            "Apri il desktop simulato, risolvi un caso solo software (DNS, proxy o Linux) e scrivi cosa hai fatto. Punteggio minimo 60.",
          minScore: 60,
          dueAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          submissions: { create: [{ userId: marco.id, status: "ASSIGNED" }] },
        },
      });
      console.log("created", task.id);
    }
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
