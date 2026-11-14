import type { Role } from "@prisma/client";

export function adminEmails(): Set<string> {
  const raw = process.env.ADMIN_EMAILS || "docente@helpdesklab.it";
  return new Set(
    raw
      .split(",")
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean),
  );
}

export function isAdminEmail(email: string | null | undefined) {
  if (!email) return false;
  return adminEmails().has(email.trim().toLowerCase());
}

/** ADMIN può fare tutto ciò che fa il docente, più la pagina admin. */
export function hasRole(actual: Role | undefined, required: Role | Role[]) {
  if (!actual) return false;
  const list = Array.isArray(required) ? required : [required];
  if (list.includes(actual)) return true;
  if (actual === "ADMIN" && list.includes("TEACHER")) return true;
  return false;
}

export function homeForRole(role: Role | undefined) {
  if (role === "ADMIN") return "/admin";
  if (role === "TEACHER") return "/teacher";
  return "/student";
}
