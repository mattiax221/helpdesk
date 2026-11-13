import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApiUser, jsonError } from "@/lib/api";
import { isGoogleAuthEnabled } from "@/lib/auth";

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

  // Tokens stay server-side in the Account table — never returned to the browser.
  const googleAccount = await prisma.account.findFirst({
    where: { userId: user.id, provider: "google" },
    select: { access_token: true },
  });

  if (!googleAccount?.access_token) {
    return NextResponse.json({
      status: "needs_reauth",
      message:
        "Accedi con Google (permessi Classroom) per collegare i corsi. Il token OAuth resta solo lato server.",
    });
  }

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
