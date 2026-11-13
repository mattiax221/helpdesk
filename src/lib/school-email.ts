/**
 * La scuola (dominio Google Workspace tipo casadicarita.it) blocca la ricezione
 * di email da mittenti esterni. Quindi non usiamo Resend/SendGrid: inviamo solo
 * tramite Gmail API con l'account Workspace del docente (FROM interno al dominio).
 */

export function schoolEmailDomains(): string[] {
  const raw =
    process.env.SCHOOL_EMAIL_DOMAIN ||
    process.env.NEXT_PUBLIC_SCHOOL_EMAIL_DOMAIN ||
    "casadicarita.it";
  return raw
    .split(",")
    .map((d) => d.trim().toLowerCase().replace(/^@/, ""))
    .filter(Boolean);
}

export function isSchoolEmail(email: string | null | undefined): boolean {
  if (!email || !email.includes("@")) return false;
  const domain = email.split("@").pop()?.toLowerCase() || "";
  return schoolEmailDomains().some((d) => domain === d || domain.endsWith(`.${d}`));
}

export function schoolDomainLabel(): string {
  return schoolEmailDomains().join(" / ");
}
