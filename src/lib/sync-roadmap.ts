import { prisma } from "@/lib/prisma";
import { ROADMAP_CATALOG } from "@/lib/roadmap-catalog";

/** Inserisce le card mancanti e riallinea titolo noto (stato, testo, colonna). */
export async function syncRoadmapCatalog() {
  const existing = await prisma.roadmapItem.findMany();
  const byTitle = new Map(existing.map((item) => [item.title, item]));

  for (const item of ROADMAP_CATALOG) {
    const found = byTitle.get(item.title);
    if (!found) {
      await prisma.roadmapItem.create({ data: item });
      continue;
    }
    await prisma.roadmapItem.update({
      where: { id: found.id },
      data: {
        description: item.description,
        category: item.category,
        priority: item.priority,
        status: item.status,
        sortOrder: item.sortOrder,
      },
    });
  }
}
