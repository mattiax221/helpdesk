import { prisma } from "@/lib/prisma";
import { getSlaState } from "@/lib/sla";
import { sendTeacherGmail } from "@/lib/gmail";
import { isSchoolEmail, schoolDomainLabel } from "@/lib/school-email";
import {
  fetchGoogleProfileEmail,
  getFreshGoogleAccessToken,
  hasGmailSendScope,
} from "@/lib/google-tokens";

export type OverdueScanResult = {
  created: number;
  emailed: number;
  skippedEmail: number;
  failedEmail: number;
};

type TeacherRef = {
  id: string;
  email: string | null;
  notifyEmail: string | null;
};

function studentLabel(u: {
  name: string | null;
  firstName: string | null;
  lastName: string | null;
}): string {
  if (u.name?.trim()) return u.name.trim();
  const full = `${u.firstName || ""} ${u.lastName || ""}`.trim();
  return full || "Studente";
}

/** Crea notifiche in-app per Lab e ticket SLA scaduti; invia digest Gmail ai docenti. */
export async function scanAndNotifyOverdue(now = new Date()): Promise<OverdueScanResult> {
  const result: OverdueScanResult = {
    created: 0,
    emailed: 0,
    skippedEmail: 0,
    failedEmail: 0,
  };

  const overdueLabs = await prisma.labTask.findMany({
    where: {
      dueAt: { lt: now },
      submissions: { some: { status: { not: "COMPLETED" } } },
    },
    include: {
      classroom: { select: { id: true, name: true, code: true } },
      createdBy: {
        select: {
          id: true,
          email: true,
          notifyEmail: true,
          notifyOverdueEmail: true,
        },
      },
      submissions: {
        where: { status: { not: "COMPLETED" } },
        include: {
          user: { select: { id: true, name: true, firstName: true, lastName: true } },
        },
      },
    },
  });

  const newByTeacher = new Map<
    string,
    { teacher: TeacherRef; lines: string[]; noticeIds: string[] }
  >();

  for (const task of overdueLabs) {
    const dueLabel = task.dueAt
      ? task.dueAt.toLocaleString("it-IT", { dateStyle: "short", timeStyle: "short" })
      : "";
    for (const sub of task.submissions) {
      const dedupeKey = `lab-overdue:${task.id}:${sub.userId}`;
      const existing = await prisma.notification.findUnique({ where: { dedupeKey } });
      if (existing) continue;

      const who = studentLabel(sub.user);
      const title = `Compito Lab scaduto: ${task.title}`;
      const body = `${who} non ha completato «${task.title}» (classe ${task.classroom.name}) entro ${dueLabel}. Punteggio attuale: ${sub.bestScore}/${task.minScore}.`;

      const notice = await prisma.notification.create({
        data: {
          userId: task.createdById,
          type: "LAB_OVERDUE",
          title,
          body,
          dedupeKey,
          meta: JSON.stringify({
            taskId: task.id,
            studentId: sub.userId,
            classroomId: task.classroomId,
            bestScore: sub.bestScore,
            minScore: task.minScore,
          }),
          emailStatus: task.createdBy.notifyOverdueEmail ? "PENDING" : "SKIPPED",
          emailError: task.createdBy.notifyOverdueEmail
            ? null
            : "Email disattivata nelle preferenze",
        },
      });
      result.created += 1;

      if (!task.createdBy.notifyOverdueEmail) {
        result.skippedEmail += 1;
        continue;
      }

      const bucket = newByTeacher.get(task.createdById) || {
        teacher: task.createdBy,
        lines: [] as string[],
        noticeIds: [] as string[],
      };
      bucket.lines.push(`• ${who} — ${task.title} (${task.classroom.name}, scad. ${dueLabel})`);
      bucket.noticeIds.push(notice.id);
      newByTeacher.set(task.createdById, bucket);
    }
  }

  // Ticket oltre SLA (non risolti / non in revisione)
  const openAssignments = await prisma.ticketAssignment.findMany({
    where: { status: { in: ["TODO", "IN_PROGRESS"] } },
    include: {
      assignee: { select: { id: true, name: true, firstName: true, lastName: true } },
      ticket: {
        include: {
          classroom: { select: { id: true, name: true, ownerId: true } },
          createdBy: {
            select: {
              id: true,
              email: true,
              notifyEmail: true,
              notifyTicketSlaEmail: true,
            },
          },
        },
      },
    },
  });

  for (const a of openAssignments) {
    const teacher = a.ticket.createdBy;
    if (!teacher.notifyTicketSlaEmail) continue;
    // Solo ticket delle classi del docente creatore; owner classe come fallback destinatario
    const teacherId = a.ticket.classroom.ownerId || teacher.id;
    const teacherPrefs =
      teacherId === teacher.id
        ? teacher
        : await prisma.user.findUnique({
            where: { id: teacherId },
            select: {
              id: true,
              email: true,
              notifyEmail: true,
              notifyTicketSlaEmail: true,
            },
          });
    if (!teacherPrefs?.notifyTicketSlaEmail) continue;

    const sla = getSlaState(
      a.status,
      a.ticket.slaMinutes,
      a.startedAt,
      a.createdAt,
      now.getTime(),
    );
    if (sla.state !== "overdue") continue;

    const dedupeKey = `ticket-sla:${a.id}`;
    const existing = await prisma.notification.findUnique({ where: { dedupeKey } });
    if (existing) continue;

    const who = studentLabel(a.assignee);
    const title = `SLA superato: ${a.ticket.title}`;
    const body = `${who} ha superato lo SLA su «${a.ticket.title}» (classe ${a.ticket.classroom.name}).`;

    const notice = await prisma.notification.create({
      data: {
        userId: teacherPrefs.id,
        type: "TICKET_SLA",
        title,
        body,
        dedupeKey,
        meta: JSON.stringify({
          assignmentId: a.id,
          ticketId: a.ticketId,
          studentId: a.assigneeId,
          classroomId: a.ticket.classroomId,
        }),
        emailStatus: "PENDING",
      },
    });
    result.created += 1;

    const bucket = newByTeacher.get(teacherPrefs.id) || {
      teacher: teacherPrefs,
      lines: [] as string[],
      noticeIds: [] as string[],
    };
    bucket.lines.push(`• ${who} — ticket «${a.ticket.title}» (${a.ticket.classroom.name}) oltre SLA`);
    bucket.noticeIds.push(notice.id);
    newByTeacher.set(teacherPrefs.id, bucket);
  }

  for (const [teacherId, bucket] of newByTeacher) {
    if (!bucket.lines.length) continue;

    const to =
      bucket.teacher.notifyEmail?.trim().toLowerCase() ||
      bucket.teacher.email?.trim().toLowerCase() ||
      null;

    // Prefer Google Workspace address if profile is school domain
    const tokens = await getFreshGoogleAccessToken(teacherId);
    const googleEmail = tokens
      ? await fetchGoogleProfileEmail(tokens.accessToken)
      : null;
    const destination =
      (to && isSchoolEmail(to) ? to : null) ||
      (googleEmail && isSchoolEmail(googleEmail) ? googleEmail : null);

    if (!destination) {
      await prisma.notification.updateMany({
        where: { id: { in: bucket.noticeIds }, emailStatus: "PENDING" },
        data: {
          emailStatus: "SKIPPED",
          emailError: `Nessuna email nel dominio scuola (${schoolDomainLabel()}). Imposta notifyEmail o collega Google Workspace.`,
        },
      });
      result.skippedEmail += bucket.noticeIds.length;
      continue;
    }

    if (!tokens || !hasGmailSendScope(tokens.account.scope)) {
      await prisma.notification.updateMany({
        where: { id: { in: bucket.noticeIds }, emailStatus: "PENDING" },
        data: {
          emailStatus: "SKIPPED",
          emailError:
            "Collega Google Workspace con permesso Gmail (gmail.send) per ricevere email nel dominio scuola.",
        },
      });
      result.skippedEmail += bucket.noticeIds.length;
      continue;
    }

    const subject = `[HelpDesk Lab] ${bucket.lines.length} avviso/i scadenze`;
    const body = [
      "Ciao,",
      "",
      "Alcuni alunni non hanno rispettato le scadenze:",
      "",
      ...bucket.lines,
      "",
      "Apri HelpDesk Lab → Notifiche per i dettagli.",
      "",
      `(Inviata dal tuo account Google Workspace ${schoolDomainLabel()} — non da un servizio email esterno.)`,
    ].join("\n");

    const sent = await sendTeacherGmail({
      teacherId,
      to: destination,
      subject,
      body,
    });

    if (sent.ok) {
      await prisma.notification.updateMany({
        where: { id: { in: bucket.noticeIds } },
        data: { emailStatus: "SENT", emailError: null },
      });
      result.emailed += bucket.noticeIds.length;
    } else {
      await prisma.notification.updateMany({
        where: { id: { in: bucket.noticeIds } },
        data: { emailStatus: "FAILED", emailError: sent.reason },
      });
      result.failedEmail += bucket.noticeIds.length;
    }
  }

  return result;
}
