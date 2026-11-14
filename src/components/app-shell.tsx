"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  Headphones,
  LayoutDashboard,
  Ticket,
  Users,
  LogOut,
  ClipboardCheck,
  ListTodo,
  Bell,
  BookOpen,
  Trophy,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/theme-toggle";
import { LocaleToggle } from "@/components/locale-toggle";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useLocale } from "@/lib/i18n";
import { NotificationBell } from "@/components/teacher/notification-bell";
import { levelForXp } from "@/lib/levels";

type NavItem = { href: string; label: string; icon: React.ComponentType<{ className?: string }> };

export function AppShell({
  role,
  userName,
  xp,
  children,
}: {
  role: "TEACHER" | "STUDENT";
  userName: string;
  xp?: number;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { t } = useLocale();
  const teacherNav: NavItem[] = [
    { href: "/teacher", label: t("nav_dashboard"), icon: LayoutDashboard },
    { href: "/teacher/tickets/new", label: t("nav_new_ticket"), icon: Ticket },
    { href: "/teacher/review", label: t("nav_review"), icon: ClipboardCheck },
    { href: "/teacher/notifications", label: t("nav_notifications"), icon: Bell },
    { href: "/guide", label: t("nav_guide"), icon: BookOpen },
    { href: "/roadmap", label: t("nav_roadmap"), icon: ListTodo },
  ];
  const studentNav: NavItem[] = [
    { href: "/student", label: t("nav_board"), icon: LayoutDashboard },
    { href: "/student/classifica", label: t("nav_rank"), icon: Trophy },
    { href: "/guide", label: t("nav_guide"), icon: BookOpen },
    { href: "/roadmap", label: t("nav_roadmap"), icon: ListTodo },
  ];
  const nav = role === "TEACHER" ? teacherNav : studentNav;
  const initials = userName
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-teal-50 via-background to-slate-100 dark:from-slate-950 dark:via-background dark:to-slate-950">
      <header className="sticky top-0 z-40 border-b border-border/70 bg-background/80 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-[1400px] items-center gap-4 px-4">
          <Link href={role === "TEACHER" ? "/teacher" : "/student"} className="flex items-center gap-2 font-semibold tracking-tight">
            <span className="flex size-8 items-center justify-center rounded-md bg-teal-700 text-white shadow-sm">
              <Headphones className="size-4" />
            </span>
            <span className="hidden sm:inline">{t("brand")}</span>
          </Link>
          <nav className="ml-2 hidden items-center gap-1 md:flex">
            {nav.map((item) => {
              const Icon = item.icon;
              const active = pathname === item.href || pathname.startsWith(item.href + "/");
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-sm transition-colors",
                    active
                      ? "bg-teal-700/10 text-teal-900 dark:text-teal-200"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground",
                  )}
                >
                  <Icon className="size-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <div className="ml-auto flex items-center gap-2">
            {typeof xp === "number" && (
              <span className="hidden rounded-md border px-2 py-1 text-xs font-medium text-amber-800 dark:text-amber-200 sm:inline">
                Lv {levelForXp(xp).level} · {levelForXp(xp).title} · {xp} XP
              </span>
            )}
            {role === "TEACHER" && <NotificationBell />}
            <LocaleToggle />
            <ThemeToggle />
            <div className="flex items-center gap-2 rounded-md border px-2 py-1">
              <Avatar className="size-6">
                <AvatarFallback className="text-[10px]">{initials}</AvatarFallback>
              </Avatar>
              <span className="hidden max-w-[140px] truncate text-sm sm:inline">{userName}</span>
            </div>
            <Button variant="ghost" size="icon" onClick={() => signOut({ callbackUrl: "/login" })} aria-label="Esci">
              <LogOut className="size-4" />
            </Button>
          </div>
        </div>
        <div className="flex gap-1 overflow-x-auto border-t px-2 py-1 md:hidden">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "whitespace-nowrap rounded-md px-3 py-1 text-xs",
                pathname.startsWith(item.href) ? "bg-muted font-medium" : "text-muted-foreground",
              )}
            >
              {item.label}
            </Link>
          ))}
          {role === "TEACHER" && (
            <Link href="/teacher" className="whitespace-nowrap rounded-md px-3 py-1 text-xs text-muted-foreground">
              <Users className="mr-1 inline size-3" />
              Classi
            </Link>
          )}
        </div>
      </header>
      <main className="mx-auto max-w-[1400px] px-4 py-6">{children}</main>
    </div>
  );
}
