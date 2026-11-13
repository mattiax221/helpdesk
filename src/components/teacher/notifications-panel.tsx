"use client";

import { useEffect, useState, useTransition } from "react";
import { toast } from "sonner";
import { Bell, RefreshCw, CheckCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type Notice = {
  id: string;
  type: string;
  title: string;
  body: string;
  readAt: string | null;
  createdAt: string;
};

export function NotificationsPanel() {
  const [notices, setNotices] = useState<Notice[]>([]);
  const [unread, setUnread] = useState(0);
  const [pending, startTransition] = useTransition();

  async function load() {
    const res = await fetch("/api/notifications");
    if (!res.ok) return;
    const data = await res.json();
    setNotices(data.notifications || []);
    setUnread(data.unread || 0);
  }

  useEffect(() => {
    void load();
  }, []);

  function scanNow() {
    startTransition(async () => {
      const res = await fetch("/api/notifications/scan", { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data.error || "Controllo fallito");
        return;
      }
      toast.success(
        data.created
          ? `${data.created} nuovi avvisi`
          : "Nessuna nuova scadenza da segnalare",
      );
      await load();
    });
  }

  function markAllRead() {
    startTransition(async () => {
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ all: true }),
      });
      await load();
    });
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0">
        <div>
          <CardTitle className="flex items-center gap-2 text-base">
            <Bell className="size-4" />
            Avvisi scadenze
            {unread > 0 && <Badge variant="secondary">{unread} nuovi</Badge>}
          </CardTitle>
          <CardDescription>
            Compiti Lab non completati e ticket oltre SLA. Per ora solo in-app (niente email).
          </CardDescription>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" disabled={pending} onClick={scanNow}>
            <RefreshCw className="mr-1 size-3.5" />
            Controlla ora
          </Button>
          <Button variant="ghost" size="sm" disabled={pending || unread === 0} onClick={markAllRead}>
            <CheckCheck className="mr-1 size-3.5" />
            Letti
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {notices.length === 0 ? (
          <p className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">
            Nessun avviso. Assegna un compito Lab con scadenza, oppure premi «Controlla ora».
          </p>
        ) : (
          notices.map((n) => (
            <div
              key={n.id}
              className={`rounded-md border px-3 py-2 text-sm ${
                n.readAt ? "opacity-70" : "border-teal-700/20 bg-teal-50/50 dark:bg-teal-950/20"
              }`}
            >
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-medium">{n.title}</span>
                <Badge variant="outline" className="text-[10px]">
                  {n.type === "LAB_OVERDUE" ? "Lab" : "SLA"}
                </Badge>
              </div>
              <p className="mt-1 text-muted-foreground">{n.body}</p>
              <p className="mt-1 text-[11px] text-muted-foreground">
                {new Date(n.createdAt).toLocaleString("it-IT")}
              </p>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
