import { Headphones } from "lucide-react";
import { LoginForm } from "@/components/auth/login-form";
import { isGoogleAuthEnabled } from "@/lib/auth";

export default function LoginPage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_20%_20%,#ccfbf1_0%,transparent_40%),radial-gradient(circle_at_80%_0%,#fef3c7_0%,transparent_35%),linear-gradient(180deg,#f8fafc,#e2e8f0)] dark:bg-[radial-gradient(circle_at_20%_20%,#134e4a55_0%,transparent_40%),linear-gradient(180deg,#020617,#0f172a)]">
      <div className="mx-auto grid min-h-screen max-w-6xl items-center gap-10 px-4 py-10 lg:grid-cols-2">
        <section className="space-y-6">
          <div className="inline-flex items-center gap-3">
            <span className="flex size-12 items-center justify-center rounded-xl bg-teal-700 text-white shadow-lg shadow-teal-900/20">
              <Headphones className="size-6" />
            </span>
            <div>
              <p className="text-sm font-medium uppercase tracking-[0.2em] text-teal-800 dark:text-teal-300">
                Scuola superiore · IT
              </p>
              <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">HelpDesk Lab</h1>
            </div>
          </div>
          <p className="max-w-xl text-lg text-slate-600 dark:text-slate-300">
            Simula un help desk aziendale stile Jira Service Management: prendi in carico ticket,
            dialoga con il &quot;cliente&quot;, chiudi con diagnosi tecnica e allenati nei mini-lab di reti.
          </p>
          <ul className="grid gap-3 text-sm text-slate-600 dark:text-slate-400 sm:grid-cols-2">
            <li className="rounded-lg border border-teal-900/10 bg-white/70 p-3 dark:bg-slate-900/60">
              Board Kanban + dettaglio split view
            </li>
            <li className="rounded-lg border border-teal-900/10 bg-white/70 p-3 dark:bg-slate-900/60">
              Ticket AI e note segrete per il docente
            </li>
            <li className="rounded-lg border border-teal-900/10 bg-white/70 p-3 dark:bg-slate-900/60">
              Accesso rapido con Codice Classe
            </li>
            <li className="rounded-lg border border-teal-900/10 bg-white/70 p-3 dark:bg-slate-900/60">
              Mini-game RJ45 e troubleshooting IP
            </li>
          </ul>
        </section>
        <LoginForm googleEnabled={isGoogleAuthEnabled} />
      </div>
    </div>
  );
}
