"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function LoginForm({ googleEnabled }: { googleEnabled: boolean }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function onClassLogin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const fd = new FormData(e.currentTarget);
    const res = await signIn("credentials", {
      redirect: false,
      mode: "class",
      classCode: String(fd.get("classCode") || ""),
      firstName: String(fd.get("firstName") || ""),
      lastName: String(fd.get("lastName") || ""),
    });
    setLoading(false);
    if (res?.error) {
      toast.error("Codice classe non valido o dati incompleti");
      return;
    }
    router.push("/student");
    router.refresh();
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
    router.push("/");
    router.refresh();
  }

  return (
    <Card className="border-teal-900/10 shadow-xl shadow-slate-900/5">
      <CardHeader>
        <CardTitle>Accedi al laboratorio</CardTitle>
        <CardDescription>
          Studenti: Codice Classe + nome. Docenti: email demo o Google OAuth.
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
                <Input id="classCode" name="classCode" placeholder="IT-9482" required />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="firstName">Nome</Label>
                  <Input id="firstName" name="firstName" placeholder="Marco" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Cognome</Label>
                  <Input id="lastName" name="lastName" placeholder="Rossi" required />
                </div>
              </div>
              <Button type="submit" className="w-full bg-teal-700 hover:bg-teal-800" disabled={loading}>
                Entra come tecnico L1/L2
              </Button>
            </form>
            <p className="text-xs text-muted-foreground">
              Demo seed: codice <strong>IT-9482</strong>, studente es. Marco Rossi.
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
                  placeholder="docente@helpdesklab.it"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input id="password" name="password" type="password" placeholder="demo1234" required />
              </div>
              <Button type="submit" className="w-full bg-teal-700 hover:bg-teal-800" disabled={loading}>
                Accedi
              </Button>
            </form>
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
