"use client";

import { useEffect, useState, useTransition } from "react";
import { signIn } from "next-auth/react";
import { toast } from "sonner";
import { Bell, Mail, RefreshCw, CheckCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type Notice = {
  id: string;
  type: string;
  title: string;
  body: string;
  emailStatus: string;
  emailError: string | null;
  readAt: string | null;
  createdAt: string;
};

type SettingsPayload = {
  settings: {
    email: string | null;
    notifyEmail: string | null;
    notifyOverdueEmail: boolean;
    notifyTicketSlaEmail: boolean;
  };
  google: {
    enabled: boolean;
    connected: boolean;
    email: string | null;
    gmailSend: boolean;
    schoolDomainOk: boolean;
    ready: boolean;
  };
  schoolDomainLabel: string;
};

export function NotificationsPanel() {
  const [notices, setNotices] = useState<Notice[]>([]);
  const [unread, setUnread] = useState(0);
  const [settings, setSettings] = useState<SettingsPayload | null>(null);
  const [notifyEmail, setNotifyEmail] = useState("");
  const [pending, startTransition] = useTransition();

  async function load() {
    const [nRes, sRes] = await Promise.all([
      fetch("/api/notifications"),
      fetch("/api/notifications/settings"),
    ]);
    if (nRes.ok) {
      const data = await nRes.json();
      setNotices(data.notifications || []);
      setUnread(data.unread || 0);
    }
    if (sRes.ok) {
      const data = (await sRes.json()) as SettingsPayload;
      setSettings(data);
      setNotifyEmail(data.settings.notifyEmail || data.settings.email || "");
    }
  }

  useEffect(() => {
    void load();
  }, []);

  function scanNow() {
    startTransition(async () => {
      const res = await fetch("/api/notifications/scan", { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data.error || "Scan fallito");
        return;
      }
      toast.success(
        `Controllo fatto: ${data.created || 0} nuovi avvisi, ${data.emailed || 0} email inviate`,
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

  function saveSettings(patch: Record<string, unknown>) {
    startTransition(async () => {
      const res = await fetch("/api/notifications/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data.error || "Salvataggio fallito");
        return;
      }
      toast.success("Preferenze salvate");
      await load();
    });
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
      <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0">
          <div>
            <CardTitle className="flex items-center gap-2 text-base">
              <Bell className="size-4" />
              Avvisi scadenze
              {unread > 0 && <Badge variant="secondary">{unread} nuovi</Badge>}
            </CardTitle>
            <CardDescription>
              Compiti Lab non completati e ticket oltre SLA.
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
                  <Badge
                    variant="outline"
                    className="text-[10px]"
                    title={n.emailError || undefined}
                  >
                    mail: {n.emailStatus.toLowerCase()}
                  </Badge>
                </div>
                <p className="mt-1 text-muted-foreground">{n.body}</p>
                <p className="mt-1 text-[11px] text-muted-foreground">
                  {new Date(n.createdAt).toLocaleString("it-IT")}
                  {n.emailError ? ` · ${n.emailError}` : ""}
                </p>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Mail className="size-4" />
              Email nel dominio scuola
            </CardTitle>
            <CardDescription>
              La posta istituzionale blocca mittenti esterni. Gli avvisi partono dal{" "}
              <strong>tuo Gmail Workspace</strong> (
              {settings?.schoolDomainLabel || "casadicarita.it"}), così restano dentro il dominio.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {!settings?.google.enabled ? (
              <p className="rounded-md border border-dashed p-3 text-xs text-muted-foreground">
                Imposta <code>GOOGLE_CLIENT_ID</code> e <code>GOOGLE_CLIENT_SECRET</code> su Vercel,
                abilitando lo scope <code>gmail.send</code> nella Google Cloud Console.
              </p>
            ) : settings.google.ready ? (
              <p className="rounded-md border border-teal-700/30 bg-teal-50/60 p-3 text-xs dark:bg-teal-950/30">
                Gmail Workspace pronto: {settings.google.email}
              </p>
            ) : (
              <div className="space-y-2 rounded-md border p-3 text-xs">
                <p>
                  {!settings.google.connected
                    ? "Collega l’account Google della scuola per inviare gli avvisi."
                    : !settings.google.gmailSend
                      ? "Ricollega Google accettando il permesso di invio email (gmail.send)."
                      : !settings.google.schoolDomainOk
                        ? `L’account ${settings.google.email} non è nel dominio ${settings.schoolDomainLabel}.`
                        : "Completa il collegamento Google Workspace."}
                </p>
                <Button
                  size="sm"
                  className="bg-teal-700 hover:bg-teal-800"
                  onClick={() =>
                    signIn("google", { callbackUrl: "/teacher/notifications" })
                  }
                >
                  Collega Google Workspace
                </Button>
              </div>
            )}

            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium">Email compiti Lab scaduti</p>
                <p className="text-xs text-muted-foreground">Quando uno studente non consegna in tempo</p>
              </div>
              <Switch
                checked={settings?.settings.notifyOverdueEmail ?? true}
                disabled={pending || !settings}
                onCheckedChange={(v) => saveSettings({ notifyOverdueEmail: v })}
              />
            </div>
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium">Email ticket oltre SLA</p>
                <p className="text-xs text-muted-foreground">Ticket aperti oltre il tempo previsto</p>
              </div>
              <Switch
                checked={settings?.settings.notifyTicketSlaEmail ?? true}
                disabled={pending || !settings}
                onCheckedChange={(v) => saveSettings({ notifyTicketSlaEmail: v })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="notify-email">Email destinatario (dominio scuola)</Label>
              <Input
                id="notify-email"
                type="email"
                placeholder={`es. nome@${settings?.schoolDomainLabel || "casadicarita.it"}`}
                value={notifyEmail}
                onChange={(e) => setNotifyEmail(e.target.value)}
              />
              <Button
                size="sm"
                variant="outline"
                disabled={pending}
                onClick={() => saveSettings({ notifyEmail: notifyEmail.trim() || null })}
              >
                Salva email
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
