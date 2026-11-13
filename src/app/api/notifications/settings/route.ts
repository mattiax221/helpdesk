import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireApiUser, jsonError } from "@/lib/api";
import { isSchoolEmail, schoolDomainLabel, schoolEmailDomains } from "@/lib/school-email";
import {
  fetchGoogleProfileEmail,
  getFreshGoogleAccessToken,
  hasGmailSendScope,
} from "@/lib/google-tokens";
import { isGoogleAuthEnabled } from "@/lib/auth";

export async function GET() {
  const { user, error } = await requireApiUser("TEACHER");
  if (error || !user) return error!;

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: {
      email: true,
      notifyEmail: true,
      notifyOverdueEmail: true,
      notifyTicketSlaEmail: true,
    },
  });

  const tokens = await getFreshGoogleAccessToken(user.id);
  const googleEmail = tokens ? await fetchGoogleProfileEmail(tokens.accessToken) : null;
  const gmailReady = Boolean(
    tokens && hasGmailSendScope(tokens.account.scope) && googleEmail && isSchoolEmail(googleEmail),
  );

  return NextResponse.json({
    settings: dbUser,
    google: {
      enabled: isGoogleAuthEnabled,
      connected: Boolean(tokens),
      email: googleEmail,
      gmailSend: tokens ? hasGmailSendScope(tokens.account.scope) : false,
      schoolDomainOk: googleEmail ? isSchoolEmail(googleEmail) : false,
      ready: gmailReady,
    },
    schoolDomains: schoolEmailDomains(),
    schoolDomainLabel: schoolDomainLabel(),
  });
}

const putSchema = z.object({
  notifyOverdueEmail: z.boolean().optional(),
  notifyTicketSlaEmail: z.boolean().optional(),
  notifyEmail: z.string().email().nullable().optional().or(z.literal("")),
});

export async function PUT(req: Request) {
  const { user, error } = await requireApiUser("TEACHER");
  if (error || !user) return error!;

  const body = await req.json().catch(() => null);
  const parsed = putSchema.safeParse(body);
  if (!parsed.success) return jsonError("Dati non validi");

  let notifyEmail = parsed.data.notifyEmail;
  if (notifyEmail === "") notifyEmail = null;
  if (typeof notifyEmail === "string") {
    notifyEmail = notifyEmail.trim().toLowerCase();
    if (!isSchoolEmail(notifyEmail)) {
      return jsonError(
        `L’email avvisi deve essere nel dominio scuola (${schoolDomainLabel()}). Provider esterni vengono bloccati dalla posta istituzionale.`,
      );
    }
  }

  const updated = await prisma.user.update({
    where: { id: user.id },
    data: {
      ...(parsed.data.notifyOverdueEmail !== undefined
        ? { notifyOverdueEmail: parsed.data.notifyOverdueEmail }
        : {}),
      ...(parsed.data.notifyTicketSlaEmail !== undefined
        ? { notifyTicketSlaEmail: parsed.data.notifyTicketSlaEmail }
        : {}),
      ...(parsed.data.notifyEmail !== undefined ? { notifyEmail } : {}),
    },
    select: {
      email: true,
      notifyEmail: true,
      notifyOverdueEmail: true,
      notifyTicketSlaEmail: true,
    },
  });

  return NextResponse.json({ settings: updated });
}
