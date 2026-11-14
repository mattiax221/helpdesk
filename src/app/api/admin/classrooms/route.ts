import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApiUser } from "@/lib/api";

export async function GET() {
  const { error } = await requireApiUser("ADMIN");
  if (error) return error;

  const classrooms = await prisma.classroom.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      owner: { select: { id: true, name: true, email: true } },
      _count: { select: { memberships: true, tickets: true, labTasks: true } },
    },
  });
  return NextResponse.json({ classrooms });
}
