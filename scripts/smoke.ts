/**
 * Smoke test: login flows + board data + ticket closure fields.
 * Run with: npx tsx scripts/smoke.ts
 * Expects the app at SMOKE_BASE_URL (default http://127.0.0.1:3456) and a seeded DB.
 */
import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const BASE = process.env.SMOKE_BASE_URL || "http://127.0.0.1:3456";
const prisma = new PrismaClient();

type Check = { name: string; ok: boolean; detail?: string };

const checks: Check[] = [];

function pass(name: string, detail?: string) {
  checks.push({ name, ok: true, detail });
  console.log(`✓ ${name}${detail ? ` — ${detail}` : ""}`);
}

function fail(name: string, detail?: string) {
  checks.push({ name, ok: false, detail });
  console.error(`✗ ${name}${detail ? ` — ${detail}` : ""}`);
}

async function httpOk(path: string, expectStatus = 200) {
  const res = await fetch(`${BASE}${path}`, { redirect: "manual" });
  if (res.status === expectStatus || (expectStatus === 200 && res.status >= 200 && res.status < 400)) {
    pass(`HTTP ${path}`, `status ${res.status}`);
    return res;
  }
  fail(`HTTP ${path}`, `status ${res.status}`);
  return res;
}

async function loginWithCredentials(email: string, password: string) {
  const csrfRes = await fetch(`${BASE}/api/auth/csrf`);
  const csrfJson = (await csrfRes.json()) as { csrfToken?: string };
  if (!csrfJson.csrfToken) {
    fail("csrf token", "missing");
    return null;
  }
  const csrfCookies = (csrfRes.headers.getSetCookie?.() || []).map((c) => c.split(";")[0]);
  if (!csrfCookies.length) {
    const single = csrfRes.headers.get("set-cookie");
    if (single) csrfCookies.push(single.split(";")[0]);
  }
  const body = new URLSearchParams({
    csrfToken: csrfJson.csrfToken,
    mode: "email",
    email,
    password,
    callbackUrl: `${BASE}/teacher`,
    json: "true",
  });
  const res = await fetch(`${BASE}/api/auth/callback/credentials`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Cookie: csrfCookies.join("; "),
    },
    body,
    redirect: "manual",
  });
  const setCookie = [
    ...csrfCookies,
    ...(res.headers.getSetCookie?.() || []).map((c) => c.split(";")[0]),
  ];
  if (res.headers.getSetCookie?.().length === 0) {
    const single = res.headers.get("set-cookie");
    if (single) setCookie.push(single.split(";")[0]);
  }
  const sessionCookie = setCookie.find(
    (c) => c.includes("authjs.session-token") || c.includes("__Secure-authjs.session-token"),
  );
  if (sessionCookie) {
    pass("teacher credentials login", `status ${res.status}`);
    return setCookie.join("; ");
  }
  fail("teacher credentials login", `status ${res.status}, no session cookie`);
  return null;
}

function cookieHeader(res: Response): string {
  const raw = res.headers.get("set-cookie");
  return raw ? raw.split(",")[0].split(";")[0] : "";
}

async function main() {
  console.log(`Smoke against ${BASE}\n`);

  await httpOk("/login");
  await httpOk("/api/auth/providers");

  // DB seed / model checks
  const teacher = await prisma.user.findFirst({ where: { email: "docente@helpdesklab.it" } });
  const student = await prisma.user.findFirst({
    where: { firstName: "Marco", lastName: "Rossi", role: "STUDENT" },
  });
  const classroom = await prisma.classroom.findFirst({ where: { code: "IT-9482" } });
  if (teacher) pass("seed teacher", teacher.email || undefined);
  else fail("seed teacher");
  if (student) pass("seed student", student.name || undefined);
  else fail("seed student");
  if (classroom) pass("seed classroom", classroom.code);
  else fail("seed classroom");

  const scenarios = await import("../src/lib/ticket-scenarios");
  if (scenarios.TICKET_SCENARIOS.length >= 35) {
    pass("scenario catalog size", `${scenarios.TICKET_SCENARIOS.length}`);
  } else {
    fail("scenario catalog size", `${scenarios.TICKET_SCENARIOS.length}`);
  }

  const cookie = teacher
    ? await loginWithCredentials("docente@helpdesklab.it", "demo1234")
    : null;

  if (cookie) {
    const sessionRes = await fetch(`${BASE}/api/auth/session`, {
      headers: { Cookie: cookie },
    });
    const session = await sessionRes.json();
    if (session?.user?.email === "docente@helpdesklab.it") {
      pass("session after login", session.user.role || "");
    } else {
      fail("session after login", JSON.stringify(session));
    }
  }

  // Board data for student
  if (student) {
    const assignments = await prisma.ticketAssignment.findMany({
      where: { assigneeId: student.id },
      include: { ticket: true },
    });
    if (assignments.length > 0) {
      pass("student board items", `${assignments.length} assignments`);
      const a = assignments[0];
      // Simulate closure fields update
      const updated = await prisma.ticketAssignment.update({
        where: { id: a.id },
        data: {
          rootCause: a.rootCause || "Smoke test root cause",
          resolutionSteps: a.resolutionSteps || "1) diagnose 2) fix",
          finalTest: a.finalTest || "Ping OK",
        },
      });
      if (updated.rootCause && updated.resolutionSteps && updated.finalTest) {
        pass("ticket closure fields write");
      } else {
        fail("ticket closure fields write");
      }
    } else {
      fail("student board items", "none");
    }
  }

  // Stats helper
  const { computeClassroomStats } = await import("../src/lib/classroom-stats");
  if (classroom) {
    const full = await prisma.classroom.findUnique({
      where: { id: classroom.id },
      include: {
        memberships: { include: { user: true } },
        tickets: { include: { assignments: { include: { evaluation: true } } } },
      },
    });
    if (full) {
      const stats = computeClassroomStats(
        full.memberships,
        full.tickets.flatMap((t) =>
          t.assignments.map((a) => ({
            assigneeId: a.assigneeId,
            status: a.status,
            evaluation: a.evaluation,
          })),
        ),
      );
      pass("classroom stats", `avgXp=${stats.avgXp} students=${stats.studentCount}`);
    }
  }

  // SLA helper
  const { getSlaState } = await import("../src/lib/sla");
  const overdue = getSlaState("IN_PROGRESS", 10, new Date(Date.now() - 20 * 60_000));
  if (overdue.state === "overdue") pass("sla overdue detection");
  else fail("sla overdue detection", overdue.state);

  const labTasks = await prisma.labTask.count();
  if (labTasks >= 1) pass("lab tasks seeded", `${labTasks}`);
  else fail("lab tasks seeded", "0");

  const { LAB_GAMES } = await import("../src/lib/lab-catalog");
  if (LAB_GAMES.length >= 7) pass("lab catalog size", `${LAB_GAMES.length}`);
  else fail("lab catalog size", `${LAB_GAMES.length}`);

  const failed = checks.filter((c) => !c.ok);
  console.log(`\n${checks.length - failed.length}/${checks.length} passed`);
  await prisma.$disconnect();
  if (failed.length) process.exit(1);
}

main().catch(async (err) => {
  console.error(err);
  await prisma.$disconnect();
  process.exit(1);
});
