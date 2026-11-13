import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireApiUser, jsonError } from "@/lib/api";

const createSchema = z.object({
  title: z.string().min(3).max(120),
  description: z.string().max(500).optional(),
  category: z.string().min(2).max(40).optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH"]).optional(),
  status: z.enum(["IDEA", "PLANNED", "IN_PROGRESS", "DONE"]).optional(),
});

export async function GET() {
  const items = await prisma.roadmapItem.findMany({
    orderBy: [{ status: "asc" }, { priority: "desc" }, { sortOrder: "asc" }, { createdAt: "desc" }],
  });
  return NextResponse.json({ items });
}

export async function POST(req: Request) {
  const { user, error } = await requireApiUser("TEACHER");
  if (error || !user) return error!;

  const body = await req.json().catch(() => null);
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return jsonError("Dati non validi");

  const item = await prisma.roadmapItem.create({
    data: {
      title: parsed.data.title,
      description: parsed.data.description || "",
      category: parsed.data.category || "Generale",
      priority: parsed.data.priority || "MEDIUM",
      status: parsed.data.status || "IDEA",
    },
  });
  return NextResponse.json({ item });
}
