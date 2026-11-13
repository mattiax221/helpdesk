import { requireSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { AppShell } from "@/components/app-shell";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Rj45Game } from "@/components/labs/rj45-game";
import { TerminalGame } from "@/components/labs/terminal-game";

export default async function LabPage() {
  const session = await requireSession();
  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  const role = session.user.role === "TEACHER" ? "TEACHER" : "STUDENT";

  return (
    <AppShell role={role} userName={session.user.name || "Utente"} xp={user?.xp ?? 0}>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold">Lab & Mini-Games</h1>
        <p className="text-sm text-muted-foreground">
          Allenati tra un ticket e l&apos;altro: crimpatura RJ45 e troubleshooting di rete da terminale.
        </p>
      </div>

      <Tabs defaultValue="rj45">
        <TabsList>
          <TabsTrigger value="rj45">Crimpatura RJ45</TabsTrigger>
          <TabsTrigger value="terminal">Ping & IP</TabsTrigger>
        </TabsList>
        <TabsContent value="rj45" className="pt-4">
          <Card>
            <CardHeader>
              <CardTitle>Crimpatura cavi RJ45</CardTitle>
              <CardDescription>
                Ordina gli 8 fili secondo lo standard T568A o T568B prima che scada il tempo.
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
                Individua errori di IP/subnet/gateway o scegli il comando giusto (`ipconfig`, `ping`,
                `tracert`, `nslookup`, `chmod`).
              </CardDescription>
            </CardHeader>
            <CardContent>
              <TerminalGame />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </AppShell>
  );
}
