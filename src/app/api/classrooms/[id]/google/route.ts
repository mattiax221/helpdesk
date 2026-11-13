import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApiUser, jsonError } from "@/lib/api";
import { auth, isGoogleAuthEnabled } from "@/lib/auth";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { user, error } = await requireApiUser("TEACHER");
  if (error || !user) return error!;
  const { id } = await params;

  const classroom = await prisma.classroom.findUnique({ where: { id } });
  if (!classroom || classroom.ownerId !== user.id) {
    return jsonError("Classe non trovata", 404);
  }

  if (!isGoogleAuthEnabled) {
    return NextResponse.json({
      status: "predisposed",
      message:
        "Google Classroom è predisposto. Configura GOOGLE_CLIENT_ID e GOOGLE_CLIENT_SECRET nel .env, poi effettua il login Google con scope classroom.courses.readonly e classroom.rosters.readonly.",
    });
  }

  const session = await auth();
  if (!session?.googleAccessToken) {
    return NextResponse.json({
      status: "needs_reauth",
      message:
        "Accedi con Google (permessi Classroom) per collegare i corsi. OAuth predisposto: lo sync roster verrà abilitato quando il token Classroom è disponibile.",
    });
  }

  // Predisposizione: salva un placeholder course id dimostrativo
  const updated = await prisma.classroom.update({
    where: { id },
    data: { googleCourseId: classroom.googleCourseId || `gc-pending-${id.slice(0, 6)}` },
  });

  return NextResponse.json({
    status: "linked_placeholder",
    message:
      "Struttura OAuth Classroom attiva. Import roster reale da abilitare chiamando l'API Google Classroom courses.list / courses.students.list.",
    classroom: updated,
  });
}
