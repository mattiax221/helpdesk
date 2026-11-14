"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { BookOpen, Globe, Settings, TerminalSquare, FileText, ScrollText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  OS_SCENARIOS,
  browserOk,
  gradeOsReport,
  initialOsWorld,
  osActions,
  withSurprise,
  type OsGrade,
  type OsScenario,
  type OsWorld,
} from "@/lib/os-sim";
import { cn } from "@/lib/utils";

type Props = { onComplete: (score: number, meta?: Record<string, unknown>) => void };

export function OsDesktop({ onComplete }: Props) {
  const [scenario, setScenario] = useState<OsScenario | null>(null);
  const [world, setWorld] = useState<OsWorld | null>(null);
  const [app, setApp] = useState<string | null>(null);
  const [log, setLog] = useState<string[]>(["HelpDesk Lab — sessione desktop. Digita help."]);
  const [cmd, setCmd] = useState("");
  const [url, setUrl] = useState("https://intranet.scuola.local");
  const [page, setPage] = useState<string | null>(null);
  const [dnsDraft, setDnsDraft] = useState("8.8.8.8");
  const [proxyDraft, setProxyDraft] = useState(true);
  const [resolvDraft, setResolvDraft] = useState("");
  const [hostsDraft, setHostsDraft] = useState("");
  const [showDocs, setShowDocs] = useState(false);
  const surpriseSeen = useRef(false);
  const [report, setReport] = useState("");
  const [grade, setGrade] = useState<OsGrade | null>(null);
  const [hintIdx, setHintIdx] = useState(0);

  function boot(s: OsScenario) {
    const w = initialOsWorld(s);
    surpriseSeen.current = false;
    setScenario(s);
    setWorld(w);
    setShowDocs(false);
    setApp(null);
    setLog(
      s.os === "linux"
        ? ["lab@aula:~$  — terminale pronto. Comandi: help, ip a, cat /etc/resolv.conf, ping, curl"]
        : ["Microsoft Windows [simulato]", "C:\\>  comandi: help, ipconfig, ping, nslookup, ipconfig /flushdns"],
    );
    setCmd("");
    setPage(null);
    setDnsDraft(w.dns);
    setProxyDraft(w.proxyOn);
    setResolvDraft(w.resolv);
    setHostsDraft(w.hosts);
    setReport("");
    setGrade(null);
    setHintIdx(0);
  }

  function patch(fn: (w: OsWorld) => OsWorld) {
    setWorld((prev) => (prev && scenario ? withSurprise(scenario, fn(prev)) : prev));
  }

  useEffect(() => {
    if (!world?.surpriseFired || surpriseSeen.current) return;
    surpriseSeen.current = true;
    setHostsDraft(world.hosts);
    setResolvDraft(world.resolv);
  }, [world]);

  function mark(id: string) {
    patch((w) => ({ ...w, checks: { ...w.checks, [id]: true } }));
  }

  function push(line: string) {
    setLog((prev) => [...prev.slice(-40), line]);
  }

  function run(raw: string) {
    if (!scenario || !world) return;
    const line = raw.trim();
    if (!line) return;
    const prompt = scenario.os === "linux" ? "lab@aula:~$" : "C:\\>";
    push(`${prompt} ${line}`);
    const c = line.toLowerCase();

    if (c === "help" || c === "?") {
      push(
        scenario.os === "linux"
          ? "help · ip a · cat /etc/resolv.conf · ping -c 1 10.20.0.2 · curl -I https://intranet.scuola.local"
          : "help · ipconfig · ipconfig /flushdns · ping 1.1.1.1 · ping intranet.scuola.local · nslookup intranet.scuola.local",
      );
      return;
    }

    if (scenario.os === "windows" && (c === "ipconfig" || c === "ipconfig /all")) {
      mark("ipconfig");
      push(`IPv4 . . . . . . . . . : 10.20.30.44`);
      push(`Gateway . . . . . . . : 10.20.30.1`);
      push(`DNS . . . . . . . . . : ${world.dns}`);
      return;
    }
    if (scenario.os === "windows" && c.replace(/\s+/g, "") === "ipconfig/flushdns") {
      mark("flush");
      const good = world.dns.trim() === "10.20.0.2";
      patch((w) => ({ ...w, flushed: good, checks: { ...w.checks, flush: true } }));
      push("Configurazione IP svuotata (flush DNS).");
      push(good ? "Cache allineata al DNS 10.20.0.2." : "Attenzione: il server DNS configurato è ancora sbagliato.");
      return;
    }
    if (c.startsWith("ping")) {
      mark("ping");
      const name = /intranet|google|scuola/.test(c);
      if (scenario.id === "win-proxy" || !name) {
        push("Risposta da 1.1.1.1: tempo<1ms  — rete ok");
        return;
      }
      if (scenario.id === "linux-resolv") {
        if (c.includes("10.20.0.2")) {
          push("64 bytes from 10.20.0.2: icmp_seq=1 ttl=64");
          return;
        }
        push(browserOk(scenario, world) ? "PING ok" : "ping: intranet: Temporary failure in name resolution");
        return;
      }
      push(
        world.dns.trim() === "10.20.0.2"
          ? "Risposta da 142.250.180.14"
          : "Ping: impossibile trovare l'host. DNS non risolve.",
      );
      return;
    }
    if (scenario.os === "windows" && c.startsWith("nslookup")) {
      mark("ipconfig");
      push(`Server:  ${world.dns}`);
      push(
        world.dns.trim() === "10.20.0.2"
          ? "Nome: intranet.scuola.local\nAddress: 10.20.0.10"
          : "DNS request timed out.\n*** Non-existent / server failed",
      );
      return;
    }
    if (scenario.os === "linux" && (c.startsWith("ip a") || c === "ip addr")) {
      push("eth0 10.20.30.44/24  gateway via 10.20.30.1");
      return;
    }
    if (scenario.os === "linux" && c.includes("resolv")) {
      mark("cat");
      push(world.resolv.trimEnd());
      return;
    }
    if (scenario.os === "linux" && c.startsWith("curl")) {
      mark("curl");
      if (browserOk(scenario, world)) {
        push("HTTP/1.1 200 OK\ncontent-type: text/html\nIntranet scuola — home");
      } else if (scenario.id === "linux-nginx") {
        push(world.portBlocked ? "curl: (7) Failed to connect to port 80" : "curl: (7) Connection refused");
      } else {
        push("curl: (6) Could not resolve host: intranet.scuola.local");
      }
      return;
    }
    if (scenario.id === "win-hosts" && (c.includes("hosts") || c.startsWith("type "))) {
      mark("hostsRead");
      push(world.hosts.trimEnd());
      return;
    }
    if (scenario.id === "linux-nginx" && c.includes("status")) {
      mark("status");
      if (world.portBlocked) {
        push("nginx.service - inactive (dead)");
        push("nginx[9999]: bind() to 0.0.0.0:80 failed (98: Address already in use)");
      } else if (world.serviceUp) {
        push("nginx.service - active (running)");
      } else {
        push("nginx.service - inactive (dead)");
      }
      return;
    }
    if (scenario.id === "linux-nginx" && (c.includes("start nginx") || c === "systemctl start nginx")) {
      mark("started");
      if (world.portBlocked) {
        push("Job for nginx.service failed. Address already in use (pid 9999).");
        patch((w) => ({ ...w, serviceUp: false, checks: { ...w.checks, started: true } }));
      } else if (!world.surpriseFired) {
        push("nginx parte… e ricade subito.");
        push("nginx[9999]: bind() to 0.0.0.0:80 failed (98: Address already in use)");
        patch((w) => ({ ...w, serviceUp: false, checks: { ...w.checks, started: true } }));
      } else {
        push("nginx.service is now active (running).");
        patch((w) => ({
          ...w,
          serviceUp: true,
          checks: { ...w.checks, started: true, startedAfter: true },
        }));
      }
      return;
    }
    if (scenario.id === "linux-nginx" && (c.includes("kill") || c.includes("9999"))) {
      mark("killed");
      push("Processo 9999 terminato. La porta 80 è libera.");
      patch((w) => ({ ...w, portBlocked: false, checks: { ...w.checks, killed: true } }));
      return;
    }
    push("Comando non riconosciuto. Scrivi help.");
  }

  function openSite() {
    if (!scenario || !world) return;
    mark("browser");
    if (browserOk(scenario, world)) {
      setPage("ok");
    } else if (scenario.id === "win-proxy") {
      setPage("proxy");
    } else if (scenario.id === "win-hosts") {
      setPage("hosts");
    } else if (scenario.id === "linux-nginx") {
      setPage("down");
    } else {
      setPage("dns");
    }
  }

  const actions = useMemo(
    () => (scenario && world ? osActions(scenario, world) : []),
    [scenario, world],
  );

  function submitReport() {
    if (!scenario || !world) return;
    const g = gradeOsReport({ scenario, actions: osActions(scenario, world), report });
    const penalty = hintIdx * 5;
    const score = Math.max(0, g.score - penalty);
    const graded = penalty
      ? { ...g, score, notes: [...g.notes, `Penalità indizi: -${penalty}.`] }
      : g;
    setGrade(graded);
    onComplete(score, {
      scenarioId: scenario.id,
      scenarioTitle: scenario.title,
      os: scenario.os,
      report,
      actions: g.done,
      keywordsHit: g.keywordsHit,
      keywordsMiss: g.keywordsMiss,
      notes: graded.notes,
      actionScore: g.actionScore,
      reportScore: graded.score - g.actionScore,
    });
  }

  if (!scenario || !world) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-muted-foreground">
          Scegli un caso. Lavori dentro un PC simulato (niente hardware): sistemi il problema, poi scrivi cosa hai fatto.
        </p>
        <div className="grid gap-2 md:grid-cols-3">
          {OS_SCENARIOS.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => boot(s)}
              className="rounded-lg border bg-background p-3 text-left hover:border-teal-600"
            >
              <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                {s.os === "windows" ? "Windows" : "Linux"}
              </p>
              <p className="mt-1 text-sm font-medium">{s.title}</p>
            </button>
          ))}
        </div>
      </div>
    );
  }

  const linux = scenario.os === "linux";
  const apps = linux
    ? [
        { id: "browser", label: "Browser", icon: Globe },
        { id: "terminal", label: "Terminale", icon: TerminalSquare },
        { id: "editor", label: "Editor", icon: FileText },
      ]
    : [
        { id: "browser", label: "Browser", icon: Globe },
        { id: "settings", label: scenario.id === "win-print" ? "Stampanti" : "Impostazioni", icon: Settings },
        { id: "terminal", label: "Terminale", icon: TerminalSquare },
        ...(scenario.id === "win-hosts" ? [{ id: "editor", label: "Editor", icon: FileText }] : []),
        { id: "events", label: "Eventi", icon: ScrollText },
      ];

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-sm font-medium">{scenario.title}</p>
          <p className="max-w-2xl text-xs text-muted-foreground">{scenario.ticket}</p>
        </div>
        <div className="flex gap-2">
          <Button type="button" size="sm" variant="outline" onClick={() => setShowDocs((v) => !v)}>
            <BookOpen className="size-3.5" />
            Documentazione
          </Button>
          <Button type="button" size="sm" variant="outline" onClick={() => setScenario(null)}>
            Cambia caso
          </Button>
        </div>
      </div>

      {showDocs && (
        <div className="space-y-2 rounded-lg border border-teal-700/30 bg-teal-50/70 p-3 text-sm dark:bg-teal-950/30">
          {scenario.docs.map((doc) => (
            <div key={doc.title}>
              <p className="font-medium">{doc.title}</p>
              <p className="text-muted-foreground">{doc.body}</p>
            </div>
          ))}
          <p className="text-xs text-muted-foreground">
            La guida non toglie punti. Gli indizi sotto il report sì.
          </p>
        </div>
      )}

      {world.surpriseFired && scenario.surprise && (
        <div className="rounded-lg border border-amber-400/70 bg-amber-50 px-3 py-2 text-sm text-amber-950 dark:bg-amber-950/40 dark:text-amber-100">
          Imprevisto — {scenario.surprise}
        </div>
      )}

      <div
        className={cn(
          "overflow-hidden rounded-xl border shadow-sm",
          linux ? "bg-[#1e1b2e]" : "bg-[#0b3a66]",
        )}
      >
        {linux && (
          <div className="flex items-center gap-3 bg-[#241f33] px-3 py-1.5 text-[11px] text-zinc-200">
            <span className="font-medium">Attività</span>
            <span className="opacity-70">aula · simulazione</span>
            <span className="ml-auto opacity-70">10:42</span>
          </div>
        )}
        <div className="relative min-h-[420px] p-4">
          <div className="grid w-28 gap-3">
            {apps.map((a) => (
              <button
                key={a.id}
                type="button"
                onClick={() => setApp(a.id)}
                className="flex flex-col items-center gap-1 rounded-md p-2 text-center text-[11px] text-white hover:bg-white/10"
              >
                <a.icon className="size-6" />
                {a.label}
              </button>
            ))}
          </div>

          {app && (
            <div className="absolute inset-x-8 top-4 bottom-14 overflow-hidden rounded-lg border border-black/20 bg-[#f4f4f5] text-zinc-900 shadow-2xl dark:bg-zinc-900 dark:text-zinc-100">
              <div className={cn("flex items-center gap-2 px-3 py-1.5 text-xs text-white", linux ? "bg-[#3b3354]" : "bg-[#1f1f1f]")}>
                <span className="font-medium">{apps.find((a) => a.id === app)?.label}</span>
                <button type="button" className="ml-auto rounded px-2 hover:bg-white/10" onClick={() => setApp(null)}>
                  chiudi
                </button>
              </div>
              <div className="h-[calc(100%-28px)] overflow-auto p-3 text-sm">
                {app === "terminal" && (
                  <div className="flex h-full flex-col rounded-md bg-zinc-950 font-mono text-xs text-emerald-100">
                    <div className="flex-1 space-y-1 overflow-auto p-3">
                      {log.map((l, i) => (
                        <pre key={i} className="whitespace-pre-wrap">{l}</pre>
                      ))}
                    </div>
                    <form
                      className="flex border-t border-white/10"
                      onSubmit={(e) => {
                        e.preventDefault();
                        run(cmd);
                        setCmd("");
                      }}
                    >
                      <input
                        value={cmd}
                        onChange={(e) => setCmd(e.target.value)}
                        className="w-full bg-transparent px-3 py-2 outline-none"
                        placeholder={linux ? "comando…" : "C:\\>"}
                        autoComplete="off"
                      />
                    </form>
                  </div>
                )}
                {app === "browser" && (
                  <div className="space-y-3">
                    <form
                      className="flex gap-2"
                      onSubmit={(e) => {
                        e.preventDefault();
                        openSite();
                      }}
                    >
                      <Input value={url} onChange={(e) => setUrl(e.target.value)} className="bg-white text-zinc-900" />
                      <Button type="submit" size="sm">Vai</Button>
                    </form>
                    {!page && <p className="text-muted-foreground">Barra indirizzi pronta. Premi Vai.</p>}
                    {page === "ok" && (
                      <div className="rounded-md border bg-white p-4 text-zinc-900">
                        <p className="text-lg font-semibold">Intranet scuola</p>
                        <p className="text-sm text-zinc-600">Pagina caricata. Il nome viene risolto e non c’è un proxy in mezzo.</p>
                      </div>
                    )}
                    {page === "dns" && (
                      <div className="rounded-md border border-rose-300 bg-rose-50 p-4 text-rose-900">
                        <p className="font-semibold">DNS_PROBE_FINISHED_NXDOMAIN</p>
                        <p className="text-sm">Impossibile trovare l’indirizzo IP del server.</p>
                      </div>
                    )}
                    {page === "proxy" && (
                      <div className="rounded-md border border-amber-300 bg-amber-50 p-4 text-amber-950">
                        <p className="font-semibold">ERR_PROXY_CONNECTION_FAILED</p>
                        <p className="text-sm">Proxy 192.168.99.99:8080 non raggiungibile.</p>
                      </div>
                    )}
                    {page === "hosts" && (
                      <div className="rounded-md border border-rose-300 bg-rose-50 p-4 text-rose-900">
                        <p className="font-semibold">Questo sito è stato dirottato</p>
                        <p className="text-sm">La pagina è finita su 127.0.0.1, cioè su questo PC. Controlla il file hosts.</p>
                      </div>
                    )}
                    {page === "down" && (
                      <div className="rounded-md border border-rose-300 bg-rose-50 p-4 text-rose-900">
                        <p className="font-semibold">Impossibile raggiungere il sito</p>
                        <p className="text-sm">Il server non accetta connessioni sulla porta 80.</p>
                      </div>
                    )}
                  </div>
                )}
                {app === "settings" && scenario.id === "win-print" && (
                  <div className="space-y-3">
                    <p className="font-medium">Stampante segreteria</p>
                    <p className="text-xs text-muted-foreground">
                      Stato: {world.printerPaused ? "in pausa" : "pronta"} · coda: {world.queueCleared ? "vuota" : "1 lavoro in errore (Documento-segreteria.pdf)"}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => {
                          mark("printerSeen");
                          patch((w) => ({ ...w, queueCleared: true, checks: { ...w.checks, printerSeen: true } }));
                        }}
                      >
                        Annulla coda
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          mark("printerSeen");
                          patch((w) => ({
                            ...w,
                            printerPaused: false,
                            checks: { ...w.checks, printerSeen: true, resumed: true },
                          }));
                        }}
                      >
                        Riprendi
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          mark("printerSeen");
                          if (world.queueCleared && !world.printerPaused) {
                            patch((w) => ({ ...w, checks: { ...w.checks, printerSeen: true, testPage: true } }));
                          } else {
                            patch((w) => ({ ...w, checks: { ...w.checks, printerSeen: true } }));
                          }
                        }}
                      >
                        Pagina di prova
                      </Button>
                    </div>
                    {world.checks.testPage && world.queueCleared && !world.printerPaused ? (
                      <p className="text-sm text-teal-700 dark:text-teal-300">Pagina di prova uscita.</p>
                    ) : world.checks.testPage ? (
                      <p className="text-sm text-amber-800">La prova non esce: coda o pausa ancora attive.</p>
                    ) : null}
                  </div>
                )}
                {app === "settings" && scenario.id === "win-update" && (
                  <div className="space-y-3">
                    <p className="font-medium">Windows Update</p>
                    <p className="text-xs text-muted-foreground">
                      Servizio wuauserv: {world.updateService ? "in esecuzione" : "arrestato"} ·{" "}
                      {world.updateDone ? "installato" : world.updateNeedsReboot ? "in sospeso, serve un riavvio" : "fisso allo 0%"}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => {
                          mark("updateSeen");
                          patch((w) => ({
                            ...w,
                            updateService: true,
                            checks: { ...w.checks, updateSeen: true, serviceStarted: true },
                          }));
                        }}
                      >
                        Avvia servizio
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          mark("updateSeen");
                          patch((w) => ({
                            ...w,
                            updateDone: w.surpriseFired && w.updateService,
                            checks: { ...w.checks, updateSeen: true },
                          }));
                        }}
                      >
                        Riavvia e riprendi
                      </Button>
                    </div>
                  </div>
                )}
                {app === "settings" && scenario.id !== "win-print" && scenario.id !== "win-update" && (
                  <div className="space-y-4">
                    <div>
                      <p className="mb-1 font-medium">Scheda Ethernet · DNS</p>
                      <p className="mb-2 text-xs text-muted-foreground">Attuale: {world.dns}</p>
                      <div className="flex gap-2">
                        <Input value={dnsDraft} onChange={(e) => setDnsDraft(e.target.value)} className="max-w-xs bg-white text-zinc-900" />
                        <Button
                          type="button"
                          size="sm"
                          onClick={() => {
                            patch((w) => ({
                              ...w,
                              dns: dnsDraft.trim(),
                              flushed: false,
                              checks: { ...w.checks, dnsSaved: true },
                            }));
                          }}
                        >
                          Salva DNS
                        </Button>
                      </div>
                    </div>
                    <div>
                      <p className="mb-1 font-medium">Proxy</p>
                      <label className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={proxyDraft}
                          onChange={(e) => {
                            setProxyDraft(e.target.checked);
                            mark("proxySeen");
                          }}
                        />
                        Usa un server proxy (192.168.99.99:8080)
                      </label>
                      <Button
                        type="button"
                        size="sm"
                        className="mt-2"
                        onClick={() => {
                          mark("proxySeen");
                          patch((w) => ({
                            ...w,
                            proxyOn: proxyDraft,
                            checks: { ...w.checks, proxySeen: true, proxySaved: true },
                          }));
                        }}
                      >
                        Applica proxy
                      </Button>
                    </div>
                  </div>
                )}
                {app === "editor" && scenario.id === "win-hosts" && (
                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground">C:\Windows\System32\drivers\etc\hosts</p>
                    <Textarea
                      rows={8}
                      value={hostsDraft}
                      onChange={(e) => setHostsDraft(e.target.value)}
                      className="font-mono text-xs"
                    />
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => {
                        patch((w) => ({
                          ...w,
                          hosts: hostsDraft,
                          checks: { ...w.checks, hostsRead: true, hostsSaved: true },
                        }));
                      }}
                    >
                      Salva file
                    </Button>
                  </div>
                )}
                {app === "editor" && scenario.id !== "win-hosts" && (
                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground">/etc/resolv.conf</p>
                    <Textarea
                      rows={8}
                      value={resolvDraft}
                      onChange={(e) => setResolvDraft(e.target.value)}
                      className="font-mono text-xs"
                    />
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => {
                        patch((w) => ({
                          ...w,
                          resolv: resolvDraft,
                          checks: { ...w.checks, saved: true },
                        }));
                      }}
                    >
                      Salva file
                    </Button>
                  </div>
                )}
                {app === "events" && (
                  <pre className="whitespace-pre-wrap rounded-md bg-white p-3 font-mono text-xs text-zinc-800">
                    {scenario.id === "win-proxy"
                      ? "WinHTTP: proxy enabled 192.168.99.99:8080\nBrowser: connection refused\nICMP ping 1.1.1.1: success"
                      : scenario.id === "win-hosts"
                        ? `Hosts:\n${world.hosts.trim()}`
                        : scenario.id === "win-print"
                          ? `Spooler: ${world.queueCleared ? "coda vuota" : "job in errore"}\nPrinter: ${world.printerPaused ? "paused" : "ready"}`
                          : scenario.id === "win-update"
                            ? `wuauserv: ${world.updateService ? "running" : "stopped"}\nUpdate: ${world.updateDone ? "installed" : "0%"}`
                            : `DNS Client: query intranet.scuola.local via ${world.dns}\n${world.dns === "10.20.0.2" ? "NOERROR" : "SERVFAIL / timeout"}\nNota: 8.8.8.8 non conosce i nomi interni .local`}
                  </pre>
                )}
              </div>
            </div>
          )}
        </div>
        {!linux && (
          <div className="flex items-center gap-2 bg-[#0a4d8c] px-2 py-1.5">
            <span className="rounded bg-white/10 px-2 py-1 text-[11px] text-white">Start</span>
            {apps.map((a) => (
              <button
                key={a.id}
                type="button"
                onClick={() => setApp(a.id)}
                className={cn(
                  "rounded px-2 py-1 text-[11px] text-white",
                  app === a.id ? "bg-white/20" : "hover:bg-white/10",
                )}
              >
                {a.label}
              </button>
            ))}
            <span className="ml-auto text-[11px] text-white/80">10:42</span>
          </div>
        )}
      </div>

      <div className="grid gap-3 lg:grid-cols-[1fr_0.8fr]">
        <div className="space-y-2 rounded-lg border p-3">
          <p className="text-sm font-medium">Cosa hai fatto</p>
          <Textarea
            rows={5}
            value={report}
            onChange={(e) => setReport(e.target.value)}
            placeholder="Scrivi i passi: cosa hai controllato, cosa era rotto, come l’hai sistemato e come hai verificato."
          />
          <div className="flex flex-wrap gap-2">
            <Button type="button" className="bg-teal-700 hover:bg-teal-800" onClick={submitReport}>
              Correggi intervento
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setHintIdx((i) => Math.min(scenario.hints.length, i + 1))}
            >
              Indizio ({hintIdx}/{scenario.hints.length})
            </Button>
          </div>
          {hintIdx > 0 && (
            <ul className="list-disc pl-4 text-xs text-muted-foreground">
              {scenario.hints.slice(0, hintIdx).map((h) => (
                <li key={h}>{h}</li>
              ))}
            </ul>
          )}
        </div>
        <div className="space-y-2 rounded-lg border p-3 text-sm">
          <p className="font-medium">Checklist (aggiornata live)</p>
          <ul className="space-y-1">
            {actions.map((a) => (
              <li key={a.id} className={a.ok ? "text-teal-700 dark:text-teal-300" : "text-muted-foreground"}>
                {a.ok ? "✓" : "○"} {a.label}
              </li>
            ))}
          </ul>
          {grade && (
            <div className="mt-2 space-y-1 border-t pt-2 text-xs">
              <p className="text-base font-semibold">Voto automatico: {grade.score}/100</p>
              <p>Azioni {grade.actionScore}/70 · Report {grade.reportScore}/30</p>
              {grade.notes.map((n) => (
                <p key={n}>{n}</p>
              ))}
              {grade.keywordsMiss.length > 0 && (
                <p className="text-muted-foreground">
                  Parole utili non citate: {grade.keywordsMiss.join(", ")}
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
