import {
  fetchGoogleProfileEmail,
  getFreshGoogleAccessToken,
  hasGmailSendScope,
} from "@/lib/google-tokens";
import { isSchoolEmail, schoolDomainLabel } from "@/lib/school-email";

function toBase64Url(input: string): string {
  return Buffer.from(input, "utf8")
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

export type GmailSendResult =
  | { ok: true; messageId: string; from: string; to: string }
  | { ok: false; reason: string; code: "NO_GOOGLE" | "NO_SCOPE" | "BAD_DOMAIN" | "API_ERROR" };

/**
 * Invia email come il docente (Gmail Workspace scuola).
 * Il mittente è l'account Google collegato → resta dentro il dominio e aggiriamo
 * il filtro che blocca provider esterni.
 */
export async function sendTeacherGmail(opts: {
  teacherId: string;
  to: string;
  subject: string;
  body: string;
}): Promise<GmailSendResult> {
  const tokens = await getFreshGoogleAccessToken(opts.teacherId);
  if (!tokens) {
    return {
      ok: false,
      code: "NO_GOOGLE",
      reason:
        "Collega Google Workspace della scuola (login Google) per inviare avvisi email.",
    };
  }

  if (!hasGmailSendScope(tokens.account.scope)) {
    return {
      ok: false,
      code: "NO_SCOPE",
      reason:
        "Manca il permesso gmail.send. Ricollega Google accettando l’invio email.",
    };
  }

  const fromEmail = await fetchGoogleProfileEmail(tokens.accessToken);
  if (!fromEmail || !isSchoolEmail(fromEmail)) {
    return {
      ok: false,
      code: "BAD_DOMAIN",
      reason: `L’account Google collegato non è nel dominio scuola (${schoolDomainLabel()}). Solo account Workspace interni possono inviare/ricevere.`,
    };
  }

  const to = opts.to.trim().toLowerCase();
  if (!isSchoolEmail(to)) {
    return {
      ok: false,
      code: "BAD_DOMAIN",
      reason: `Destinatario fuori dominio scuola (${schoolDomainLabel()}). Imposta un’email @${schoolDomainLabel()}.`,
    };
  }

  const raw = [
    `From: ${fromEmail}`,
    `To: ${to}`,
    `Subject: =?UTF-8?B?${Buffer.from(opts.subject, "utf8").toString("base64")}?=`,
    "MIME-Version: 1.0",
    'Content-Type: text/plain; charset="UTF-8"',
    "",
    opts.body,
  ].join("\r\n");

  const res = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/messages/send", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${tokens.accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ raw: toBase64Url(raw) }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    return {
      ok: false,
      code: "API_ERROR",
      reason: `Gmail API ${res.status}: ${text.slice(0, 180)}`,
    };
  }

  const data = (await res.json()) as { id?: string };
  return {
    ok: true,
    messageId: data.id || "ok",
    from: fromEmail,
    to,
  };
}
