import { requireSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { AppShell } from "@/components/app-shell";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Rj45Game } from "@/components/labs/rj45-game";
import { TerminalGame } from "@/components/labs/terminal-game";
import { PortsGame } from "@/components/labs/ports-game";
import { SubnetGame } from "@/components/labs/subnet-game";
import { LocalizedHeading } from "@/components/localized-heading";

export default async function LabPage() {
  const session = await requireSession();
  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  const role = session.user.role === "TEACHER" ? "TEACHER" : "STUDENT";

  return (
    <AppShell role={role} userName={session.user.name || "Utente"} xp={user?.xp ?? 0}>
      <LocalizedHeading titleKey="lab_title" subtitleKey="lab_subtitle" />

      <Tabs defaultValue="rj45">
        <TabsList className="flex h-auto flex-wrap gap-1">
          <TabsTrigger value="rj45">Crimpatura RJ45</TabsTrigger>
          <TabsTrigger value="terminal">Ping & IP</TabsTrigger>
          <TabsTrigger value="ports">Port Strike</TabsTrigger>
          <TabsTrigger value="subnet">Subnet / CIDR</TabsTrigger>
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
        <TabsContent value="subnet" className="pt-4">
          <Card>
            <CardHeader>
              <CardTitle>Subnet Builder</CardTitle>
              <CardDescription>
                Calcola host utilizzabili, indirizzo di rete, broadcast e maschera da un CIDR.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <SubnetGame />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </AppShell>
  );
}
