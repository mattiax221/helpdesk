import Link from "next/link";
import { Headphones, ListTodo } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { syncRoadmapCatalog } from "@/lib/sync-roadmap";
import { RoadmapBoard } from "@/components/roadmap/roadmap-board";
import { ThemeToggle } from "@/components/theme-toggle";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { hasRole, homeForRole } from "@/lib/roles";

export default async function RoadmapPage() {
  const session = await auth();
  await syncRoadmapCatalog();
  const items = await prisma.roadmapItem.findMany({
    orderBy: [{ sortOrder: "asc" }, { priority: "desc" }, { createdAt: "desc" }],
  });
  const canEdit = hasRole(session?.user?.role, "TEACHER");

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-teal-50 via-background to-slate-100 dark:from-slate-950 dark:via-background dark:to-slate-950">
      <header className="sticky top-0 z-40 border-b border-border/70 bg-background/80 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-[1400px] items-center gap-3 px-4">
          <Link href="/" className="flex items-center gap-2 font-semibold">
            <span className="flex size-8 items-center justify-center rounded-md bg-teal-700 text-white">
              <Headphones className="size-4" />
            </span>
            HelpDesk Lab
          </Link>
          <span className="hidden text-sm text-muted-foreground sm:inline">/ Roadmap</span>
          <div className="ml-auto flex items-center gap-2">
            <ThemeToggle />
            {session?.user ? (
              <Link
                href={homeForRole(session.user.role)}
                className={cn(buttonVariants({ size: "sm", variant: "outline" }))}
              >
                Torna all’app
              </Link>
            ) : (
              <Link href="/login" className={cn(buttonVariants({ size: "sm" }), "bg-teal-700 hover:bg-teal-800")}>
                Accedi
              </Link>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1400px] px-4 py-8">
        <section className="relative mb-8 overflow-hidden rounded-3xl border bg-gradient-to-br from-slate-900 via-teal-950 to-slate-900 px-6 py-10 text-white shadow-xl">
          <div className="pointer-events-none absolute -right-10 -top-10 size-56 rounded-full bg-teal-400/20 blur-3xl" />
          <div className="pointer-events-none absolute bottom-0 left-1/3 size-40 rounded-full bg-cyan-300/10 blur-2xl" />
          <div className="relative max-w-2xl">
            <p className="mb-2 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs uppercase tracking-wide text-teal-100">
              <ListTodo className="size-3.5" />
              Product backlog
            </p>
            <h1 className="font-[family-name:var(--font-display,ui-sans-serif)] text-3xl font-semibold tracking-tight sm:text-4xl">
              Roadmap HelpDesk Lab
            </h1>
            <p className="mt-3 text-sm leading-relaxed text-teal-50/85 sm:text-base">
              Qui teniamo le funzioni da aggiungere: idee, piano, lavoro in corso e rilasci.
              {canEdit
                ? " Come docente puoi aggiungere card e farle avanzare."
                : " Accedi come docente per proporre e gestire le card."}
            </p>
          </div>
        </section>

        <RoadmapBoard
          canEdit={canEdit}
          initialItems={items.map((i) => ({
            id: i.id,
            title: i.title,
            description: i.description,
            status: i.status,
            priority: i.priority,
            category: i.category,
          }))}
        />
      </main>
    </div>
  );
}
