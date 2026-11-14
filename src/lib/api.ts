import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import type { Role } from "@prisma/client";
import { hasRole } from "@/lib/roles";

export function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export async function getAuthedUser() {
  const session = await auth();
  if (!session?.user?.id) return null;
  return session.user;
}

export async function requireApiUser(roles?: Role | Role[]) {
  const user = await getAuthedUser();
  if (!user) return { error: jsonError("Non autenticato", 401) as NextResponse };
  if (roles) {
    const list = Array.isArray(roles) ? roles : [roles];
    if (!hasRole(user.role, list)) {
      return { error: jsonError("Permesso negato", 403) as NextResponse };
    }
  }
  return { user };
}
