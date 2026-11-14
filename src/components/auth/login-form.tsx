"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function LoginForm({ googleEnabled }: { googleEnabled: boolean }) {
  const [loading, setLoading] = useState(false);

  async function onClassLogin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const fd = new FormData(e.currentTarget);
    const classCode = String(fd.get("classCode") || "").trim();
    const firstName = String(fd.get("firstName") || "").trim();
    const lastName = String(fd.get("lastName") || "").trim();
    const email = String(fd.get("studentEmail") || "").trim().toLowerCase();
    if (!classCode || !firstName || !lastName || !email) {
      setLoading(false);
      toast.error("Compila codice, nome, cognome e email");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setLoading(false);
      toast.error("Inserisci una email valida. Non viene inviato nessun codice.");
      return;
    }
    const res = await signIn("credentials", {
      redirect: false,
      mode: "class",
      classCode,
      firstName,
      lastName,
      email,
    });
    setLoading(false);
    if (res?.error) {
      toast.error(
        "Accesso negato: controlla codice, nome nel roster e che l’email sia quella già salvata (o una nuova non usata da altri)",
      );
      return;
    }
    // Hard navigation so the session cookie is included on the next request (Vercel/HTTPS).
    window.location.assign("/student");
  }

  async function onEmailLogin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const fd = new FormData(e.currentTarget);
    const res = await signIn("credentials", {
      redirect: false,
      mode: "email",
      email: String(fd.get("email") || ""),
      password: String(fd.get("password") || ""),
    });
    setLoading(false);
    if (res?.error) {
      toast.error("Credenziali non valide");
      return;
    }
    window.location.assign("/");
  }

  return (
    <Card className="border-teal-900/10 shadow-xl shadow-slate-900/5">
      <CardHeader>
        <CardTitle>Accedi al laboratorio</CardTitle>
        <CardDescription>
          Studenti: codice, nome e una email valida (nessun codice di verifica). Docenti: email.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="class">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="class">Codice Classe</TabsTrigger>
            <TabsTrigger value="email">Email docente/demo</TabsTrigger>
          </TabsList>
          <TabsContent value="class" className="space-y-4 pt-4">
            <form className="space-y-3" onSubmit={onClassLogin}>
              <div className="space-y-2">
                <Label htmlFor="classCode">Codice Classe</Label>
                <Input
                  id="classCode"
                  name="classCode"
                  placeholder="es. IT-9482"
                  autoComplete="off"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="firstName">Nome</Label>
                  <Input
                    id="firstName"
                    name="firstName"
                    placeholder="Il tuo nome"
                    autoComplete="given-name"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Cognome</Label>
                  <Input
                    id="lastName"
                    name="lastName"
                    placeholder="Il tuo cognome"
                    autoComplete="family-name"
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="studentEmail">Email</Label>
                <Input
                  id="studentEmail"
                  name="studentEmail"
                  type="email"
                  placeholder="nome.cognome@studenti.it"
                  autoComplete="email"
                  required
                />
              </div>
              <Button type="submit" className="w-full bg-teal-700 hover:bg-teal-800" disabled={loading}>
                Entra come tecnico L1/L2
              </Button>
            </form>
            <p className="text-xs text-muted-foreground">
              Devi essere nel roster. La email viene solo registrata, senza OTP. Se ne hai già una,
              va usata quella. Demo: codice <strong>IT-9482</strong> · <strong>Marco Rossi</strong> ·{" "}
              <strong>marco.rossi@studenti.it</strong>.
            </p>
          </TabsContent>
          <TabsContent value="email" className="space-y-4 pt-4">
            <form className="space-y-3" onSubmit={onEmailLogin}>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="email@istituto.it"
                  autoComplete="username"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="La tua password"
                  autoComplete="current-password"
                  required
                />
              </div>
              <Button type="submit" className="w-full bg-teal-700 hover:bg-teal-800" disabled={loading}>
                Accedi
              </Button>
            </form>
            <p className="text-xs text-muted-foreground">
              Demo docente: <strong>docente@helpdesklab.it</strong> / <strong>demo1234</strong>
            </p>
            {googleEnabled ? (
              <Button
                variant="outline"
                className="w-full"
                disabled={loading}
                onClick={() => signIn("google", { callbackUrl: "/teacher" })}
              >
                Continua con Google (Classroom)
              </Button>
            ) : (
              <p className="rounded-md border border-dashed p-3 text-xs text-muted-foreground">
                Google OAuth predisposto: imposta <code>GOOGLE_CLIENT_ID</code> e{" "}
                <code>GOOGLE_CLIENT_SECRET</code> per abilitare login Google + scope Classroom.
              </p>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
