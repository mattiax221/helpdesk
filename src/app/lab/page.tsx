import { requireSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { AppShell } from "@/components/app-shell";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Rj45Game } from "@/components/labs/rj45-game";
import { TerminalGame } from "@/components/labs/terminal-game";
import { PortsGame } from "@/components/labs/ports-game";

export default async function LabPage() {
  const session = await requireSession();
  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  const role = session.user.role === "TEACHER" ? "TEACHER" : "STUDENT";

  return (
    <AppShell role={role} userName={session.user.name || "Utente"} xp={user?.xp ?? 0}>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold">Lab & Mini-Games</h1>
        <p className="text-sm text-muted-foreground">
          Crimpatura RJ45, troubleshooting da terminale e Port Strike sulle porte di rete.
        </p>
      </div>

      <Tabs defaultValue="rj45">
        <TabsList className="flex h-auto flex-wrap gap-1">
          <TabsTrigger value="rj45">Crimpatura RJ45</TabsTrigger>
          <TabsTrigger value="terminal">Ping & IP</TabsTrigger>
          <TabsTrigger value="ports">Port Strike</TabsTrigger>
        </TabsList>
        <TabsContent value="rj45" className="pt-4">
          <Card>
            <CardHeader>
              <CardTitle>Crimpatura cavi RJ45</CardTitle>
              <CardDescription>
                Ordina gli 8 fili secondo T568A o T568B prima che scada il tempo.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Rj45Game />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="terminal" className="pt-4">
          <Card>
            <CardHeader>
              <CardTitle>Troubleshoot terminale</CardTitle>
              <CardDescription>
                IP/subnet/gateway, DNS, comandi Windows/Linux e scenari misti a tempo di ragionamento.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <TerminalGame />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="ports" className="pt-4">
          <Card>
            <CardHeader>
              <CardTitle>Port Strike</CardTitle>
              <CardDescription>
                Abbina porte e servizi (22→SSH, 443→HTTPS, 3389→RDP…) come in un check firewall.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <PortsGame />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </AppShell>
  );
}
