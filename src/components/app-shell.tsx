"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  Headphones,
  LayoutDashboard,
  Ticket,
  Users,
  Gamepad2,
  LogOut,
  ClipboardCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

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
  const teacherNav: NavItem[] = [
    { href: "/teacher", label: "Dashboard", icon: LayoutDashboard },
    { href: "/teacher/tickets/new", label: "Nuovo ticket", icon: Ticket },
    { href: "/teacher/review", label: "Revisioni", icon: ClipboardCheck },
  ];
  const studentNav: NavItem[] = [
    { href: "/student", label: "Board", icon: LayoutDashboard },
    { href: "/lab", label: "Lab & Mini-Games", icon: Gamepad2 },
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
            <span className="hidden sm:inline">HelpDesk Lab</span>
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
                {xp} XP
              </span>
            )}
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
