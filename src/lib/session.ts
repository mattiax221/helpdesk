import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import type { Role } from "@prisma/client";

export async function requireSession() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }
  return session;
}

export async function requireRole(role: Role | Role[]) {
  const session = await requireSession();
  const roles = Array.isArray(role) ? role : [role];
  if (!roles.includes(session.user.role)) {
    redirect(session.user.role === "TEACHER" ? "/teacher" : "/student");
  }
  return session;
}
