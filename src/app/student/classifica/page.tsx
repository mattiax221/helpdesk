import Link from "next/link";
import { requireRole } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { AppShell } from "@/components/app-shell";
import { levelForXp } from "@/lib/levels";
import { Badge } from "@/components/ui/badge";

export default async function ClassificaPage() {
  const session = await requireRole("STUDENT");
  const me = await prisma.user.findUnique({ where: { id: session.user.id } });
  const memberships = await prisma.classroomMembership.findMany({
    where: { userId: session.user.id },
    include: {
      classroom: {
        include: {
          memberships: {
            include: { user: { select: { id: true, name: true, xp: true, role: true } } },
          },
        },
      },
    },
  });

  return (
    <AppShell role="STUDENT" userName={session.user.name || "Studente"} xp={me?.xp ?? 0}>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Classifica</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Livello e posizione in base agli XP della classe. I voti dei ticket restano quelli del docente.
        </p>
      </div>
      {memberships.length === 0 ? (
        <p className="text-sm text-muted-foreground">Non sei ancora in una classe.</p>
      ) : (
        <div className="space-y-6">
          {memberships.map((membership) => {
            const rows = membership.classroom.memberships
              .filter((m) => m.user.role === "STUDENT")
              .slice()
              .sort((a, b) => b.user.xp - a.user.xp || (a.user.name || "").localeCompare(b.user.name || "", "it"));
            return (
              <section key={membership.classroomId} className="rounded-lg border bg-background">
                <div className="border-b px-4 py-3">
                  <h2 className="font-medium">{membership.classroom.name}</h2>
                  <p className="text-xs text-muted-foreground">Codice {membership.classroom.code}</p>
                </div>
                <ol className="divide-y">
                  {rows.map((row, index) => {
                    const level = levelForXp(row.user.xp);
                    const mine = row.user.id === session.user.id;
                    return (
                      <li
                        key={row.user.id}
                        className={mine ? "flex items-center gap-3 bg-teal-50 px-4 py-3 dark:bg-teal-950/40" : "flex items-center gap-3 px-4 py-3"}
                      >
                        <span className="w-6 text-sm font-medium text-muted-foreground">{index + 1}</span>
                        <span className="flex-1 text-sm font-medium">{row.user.name}</span>
                        <Badge variant="outline">Lv {level.level} · {level.title}</Badge>
                        <span className="w-16 text-right text-sm">{row.user.xp} XP</span>
                      </li>
                    );
                  })}
                </ol>
              </section>
            );
          })}
        </div>
      )}
      <p className="mt-6 text-sm">
        <Link href="/student" className="text-teal-800 underline-offset-2 hover:underline dark:text-teal-200">
          Torna alla board
        </Link>
      </p>
    </AppShell>
  );
}
