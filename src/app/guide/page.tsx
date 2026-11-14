import Link from "next/link";
import { requireSession } from "@/lib/session";
import { AppShell } from "@/components/app-shell";
import { hasRole } from "@/lib/roles";
import { prisma } from "@/lib/prisma";
import { OS_SCENARIOS } from "@/lib/os-sim";

export default async function GuidePage() {
  const session = await requireSession();
  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  const teacher = hasRole(session.user.role, "TEACHER");

  return (
    <AppShell
      role={teacher ? "TEACHER" : "STUDENT"}
      userName={session.user.name || "Utente"}
      xp={user?.xp ?? 0}
    >
      <div className="mb-6 max-w-3xl">
        <h1 className="text-2xl font-semibold tracking-tight">Guida del tecnico</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Si apre da ogni studente, anche mentre lavora. Sul desktop del cliente c’è lo stesso tasto, sul caso che hai davanti. La guida non toglie punti.
        </p>
      </div>
      <div className="grid max-w-3xl gap-4">
        {OS_SCENARIOS.map((scenario) => (
          <article key={scenario.id} className="rounded-lg border bg-background p-4">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              {scenario.os === "windows" ? "Windows" : "Linux"}
            </p>
            <h2 className="mt-1 font-medium">{scenario.title}</h2>
            {scenario.docs.map((doc) => (
              <div key={doc.title} className="mt-3 text-sm leading-relaxed">
                <p className="font-medium">{doc.title}</p>
                <p className="text-muted-foreground">{doc.body}</p>
              </div>
            ))}
          </article>
        ))}
      </div>
      <p className="mt-6 text-sm">
        <Link href={teacher ? "/teacher" : "/student"} className="text-teal-800 underline-offset-2 hover:underline dark:text-teal-200">
          Torna al lavoro
        </Link>
      </p>
    </AppShell>
  );
}
