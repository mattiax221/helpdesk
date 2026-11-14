export type BenchKind = "procedure" | "fault" | "config";

export type BenchCheck = { id: string; label: string; ok: boolean };

export type BenchGrade = {
  score: number;
  actionScore: number;
  reportScore: number;
  checks: BenchCheck[];
  keywordsHit: string[];
  keywordsMiss: string[];
  notes: string[];
};

const ACTION_WEIGHT = 70;
const REPORT_WEIGHT = 30;

export type BenchOption = { id: string; label: string };

export type BenchCase = {
  id: string;
  kind: BenchKind;
  title: string;
  ticket: string;
  brief: string;
  keywords: string[];
};

export const BENCH_KIND_LABEL: Record<BenchKind, string> = {
  procedure: "Procedura",
  fault: "Ricerca guasto",
  config: "Configurazione",
};

export const BENCH_CASES: BenchCase[] = [
  {
    id: "provision-pc",
    kind: "procedure",
    title: "Messa in servizio di un PC d’aula",
    ticket:
      "Prepara PC-AULA-04 per la 3ª. IP statico 10.20.30.44/24, gateway 10.20.30.1, DNS 10.20.0.2. Nessun proxy. Poi verifica ping e intranet.",
    brief:
      "Un PC nuovo non va «in DHCP e via». Qui il laboratorio usa un indirizzo fisso: se gateway o DNS sono sbagliati, la verifica deve fallire.",
    keywords: ["statico", "gateway", "dns", "proxy", "10.20.30.44"],
  },
  {
    id: "dns-cutover",
    kind: "procedure",
    title: "Cambio del DNS di istituto",
    ticket:
      "Il DNS interno è passato da 10.20.0.2 a 10.20.0.5. Sul PC della segreteria i nomi .local non si aprono. Aggiorna il server, svuota la cache e controlla che intranet.scuola.local risponda 10.20.0.10.",
    brief:
      "8.8.8.8 risolve Internet, non i nomi interni della scuola. Dopo il cambio va svuotata la cache, altrimenti il PC continua a usare la risposta vecchia.",
    keywords: ["dns", "10.20.0.5", "cache", "intranet", "nslookup"],
  },
  {
    id: "fault-dhcp",
    kind: "fault",
    title: "Un PC prende 169.254 e gli altri no",
    ticket:
      "Un solo PC della segreteria non naviga. Il collega dice «è il cavo». Leggi le prove e indica la causa vera e il controllo successivo.",
    brief:
      "169.254.x.x è un indirizzo APIPA: il PC non ha ricevuto un DHCP e si è assegnato un IP da solo. Non è un DNS e, se il link è up, non è il primo cavo da cambiare.",
    keywords: ["dhcp", "169.254", "apipa", "vlan"],
  },
  {
    id: "fault-hosts",
    kind: "fault",
    title: "Il nome non coincide con il DNS",
    ticket:
      "intranet.scuola.local si apre sul PC stesso. nslookup però restituisce l’IP giusto del server. Trova perché ping e browser non usano quella risposta.",
    brief:
      "Se nslookup è corretto e il ping del nome no, il PC sta risolvendo il nome prima del DNS. Su Windows il file hosts viene letto prima.",
    keywords: ["hosts", "127.0.0.1", "nslookup", "dns"],
  },
  {
    id: "plan-vlsm",
    kind: "config",
    title: "Piano di indirizzamento della sede",
    ticket:
      "Dal blocco 10.20.0.0/24 servi tre reti senza sovrapposizioni: laboratorio almeno 60 host, segreteria almeno 30, ospiti almeno 10. Scrivi ogni rete in CIDR (es. 10.20.0.0/25).",
    brief:
      "Si parte dalla rete più grande. La maschera deve contenere gli host richiesti, l’indirizzo di rete deve essere allineato e le tre reti devono stare dentro il /24 senza coprirsi.",
    keywords: ["vlsm", "subnet", "host", "10.20.0"],
  },
];

export type ProvisionInput = {
  hostname: string;
  ip: string;
  mask: string;
  gateway: string;
  dns: string;
  proxyOn: boolean;
  pingChecked: boolean;
  webChecked: boolean;
};

export type DnsCutoverInput = {
  dns: string;
  flushed: boolean;
  lookupChecked: boolean;
};

export type FaultInput = { causeId: string; nextId: string };

export type PlanInput = { lab: string; segreteria: string; ospiti: string };

export const FAULT_DHCP_CAUSES: BenchOption[] = [
  { id: "cable", label: "Cavo o scheda di rete guasti: il link è down" },
  { id: "dhcp", label: "DHCP assente: relay spento, scope esaurito o VLAN senza server" },
  { id: "dns", label: "DNS impostato su 8.8.8.8" },
  { id: "duplicate", label: "Indirizzo statico duplicato di un altro PC" },
];

export const FAULT_DHCP_NEXT: BenchOption[] = [
  { id: "gpu", label: "Sostituire la scheda video" },
  { id: "dhcp-check", label: "Controllare servizio DHCP, scope e VLAN della porta" },
  { id: "chrome", label: "Reinstallare il browser" },
  { id: "mask8", label: "Mettere la maschera 255.0.0.0 su tutti i PC" },
];

export const FAULT_HOSTS_CAUSES: BenchOption[] = [
  { id: "public-dns", label: "Il DNS pubblico non conosce i nomi .local" },
  { id: "hosts", label: "Il file hosts dirotta il nome su 127.0.0.1, il DNS è corretto" },
  { id: "cable", label: "Cavo staccato: per questo il ping all’IP fallisce" },
  { id: "cert", label: "Certificato HTTPS scaduto sul server" },
];

export const FAULT_HOSTS_NEXT: BenchOption[] = [
  { id: "hosts-fix", label: "Togliere la riga dal file hosts, svuotare la cache e riprovare ping e browser" },
  { id: "format", label: "Formattare il PC" },
  { id: "dns-8", label: "Impostare 8.8.8.8 come unico DNS" },
  { id: "proxy", label: "Attivare un proxy 192.168.99.99" },
];

export const FAULT_DHCP_EVIDENCE = [
  "Scheda: Intel Ethernet, media connected, link up 1 Gbps",
  "IPv4: 169.254.22.17 / 255.255.0.0",
  "Gateway: nessuno",
  "DHCP abilitato: sì — Server DHCP: non trovato",
  "ping 10.20.30.1: host di destinazione non raggiungibile",
  "PC sulla porta accanto: 10.20.30.21/24, naviga",
];

export const FAULT_HOSTS_EVIDENCE = [
  "ping 10.20.0.10 → risposta da 10.20.0.10, TTL 64",
  "nslookup intranet.scuola.local",
  "  Server: 10.20.0.2",
  "  Address: 10.20.0.10",
  "ping intranet.scuola.local → risposta da 127.0.0.1",
  "Browser: pagina vuota servita da questo PC, non dal server",
];

function ipToInt(ip: string): number | null {
  const parts = ip.trim().split(".");
  if (parts.length !== 4) return null;
  let n = 0;
  for (const part of parts) {
    if (!/^\d{1,3}$/.test(part)) return null;
    const octet = Number(part);
    if (octet > 255) return null;
    n = (n << 8) + octet;
  }
  return n >>> 0;
}

function sameSubnet(ip: string, gateway: string, cidr: number) {
  const a = ipToInt(ip);
  const b = ipToInt(gateway);
  if (a === null || b === null || cidr < 0 || cidr > 32) return false;
  const mask = cidr === 0 ? 0 : (~0 << (32 - cidr)) >>> 0;
  return (a & mask) === (b & mask);
}

function maskOk(mask: string) {
  const value = mask.trim().toLowerCase();
  return value === "255.255.255.0" || value === "/24" || value === "24";
}

function finishGrade(checks: BenchCheck[], report: string, keywords: string[], notes: string[]): BenchGrade {
  const okCount = checks.filter((c) => c.ok).length;
  const actionScore = checks.length === 0 ? 0 : Math.round((okCount / checks.length) * ACTION_WEIGHT);
  const text = report.toLocaleLowerCase("it");
  const keywordsHit = keywords.filter((k) => text.includes(k.toLocaleLowerCase("it")));
  const keywordsMiss = keywords.filter((k) => !keywordsHit.includes(k));
  const longEnough = report.trim().length >= 40;
  const ratio = keywords.length === 0 ? 0 : keywordsHit.length / keywords.length;
  const reportScore = !longEnough ? 0 : Math.round(ratio * REPORT_WEIGHT);
  const extra = [...notes];
  if (!longEnough) extra.push("Report troppo corto: almeno un paio di frasi su cosa hai controllato e cosa hai cambiato.");
  else if (keywordsHit.length < 2) extra.push("Nel report nomina la causa e gli strumenti, non solo «sistemato».");
  else extra.push("Report sufficiente.");
  const missing = checks.filter((c) => !c.ok);
  if (missing.length) extra.push(`Controlli non superati: ${missing.map((m) => m.label).join("; ")}.`);
  else extra.push("Tutti i controlli tecnici sono superati.");
  return {
    score: Math.min(100, actionScore + reportScore),
    actionScore,
    reportScore,
    checks,
    keywordsHit,
    keywordsMiss,
    notes: extra,
  };
}

export function gradeProvision(input: ProvisionInput, report: string): BenchGrade {
  const onLan = sameSubnet(input.ip, "10.20.30.1", 24) && input.gateway.trim() === "10.20.30.1" && maskOk(input.mask);
  const dnsOk = input.dns.trim() === "10.20.0.2";
  const checks: BenchCheck[] = [
    { id: "host", label: "Nome PC-AULA-04", ok: input.hostname.trim().toUpperCase() === "PC-AULA-04" },
    { id: "ip", label: "IP 10.20.30.44", ok: input.ip.trim() === "10.20.30.44" },
    { id: "mask", label: "Maschera /24", ok: maskOk(input.mask) },
    { id: "gw", label: "Gateway 10.20.30.1", ok: input.gateway.trim() === "10.20.30.1" },
    { id: "dns", label: "DNS 10.20.0.2", ok: dnsOk },
    { id: "proxy", label: "Proxy disattivato", ok: !input.proxyOn },
    { id: "ping", label: "Ping al gateway riuscito", ok: input.pingChecked && onLan && input.ip.trim() === "10.20.30.44" },
    { id: "web", label: "Intranet raggiungibile", ok: input.webChecked && dnsOk && !input.proxyOn && onLan },
  ];
  return finishGrade(checks, report, BENCH_CASES[0].keywords, []);
}

export function gradeDnsCutover(input: DnsCutoverInput, report: string): BenchGrade {
  const dnsOk = input.dns.trim() === "10.20.0.5";
  const checks: BenchCheck[] = [
    { id: "dns", label: "Nuovo DNS 10.20.0.5", ok: dnsOk },
    { id: "flush", label: "Cache DNS svuotata", ok: input.flushed },
    {
      id: "lookup",
      label: "nslookup di intranet.scuola.local → 10.20.0.10",
      ok: input.lookupChecked && dnsOk && input.flushed,
    },
  ];
  const notes: string[] = [];
  if (input.dns.trim() === "8.8.8.8" || input.dns.trim() === "1.1.1.1") {
    notes.push("Un DNS pubblico non conosce intranet.scuola.local.");
  }
  if (input.dns.trim() === "10.20.0.2") {
    notes.push("10.20.0.2 è il server vecchio: il ticket dice che è stato sostituito.");
  }
  return finishGrade(checks, report, BENCH_CASES[1].keywords, notes);
}

export function gradeFault(caseId: "fault-dhcp" | "fault-hosts", input: FaultInput, report: string): BenchGrade {
  const dhcp = caseId === "fault-dhcp";
  const checks: BenchCheck[] = [
    {
      id: "cause",
      label: "Causa coerente con le prove",
      ok: input.causeId === (dhcp ? "dhcp" : "hosts"),
    },
    {
      id: "next",
      label: "Prossimo controllo utile",
      ok: input.nextId === (dhcp ? "dhcp-check" : "hosts-fix"),
    },
  ];
  const keywords = dhcp ? BENCH_CASES[2].keywords : BENCH_CASES[3].keywords;
  const notes: string[] = [];
  if (!checks[0].ok) {
    notes.push(
      dhcp
        ? "169.254 e «server DHCP non trovato» escludono cavo spento, DNS e IP duplicato."
        : "nslookup è già giusto: il ping del nome verso 127.0.0.1 indica il file hosts, non il DNS.",
    );
  }
  return finishGrade(checks, report, keywords, notes);
}

type Block = { start: number; end: number; cidr: number; raw: string };

function parseBlock(raw: string): Block | null {
  const match = raw.trim().match(/^(\d{1,3}(?:\.\d{1,3}){3})\s*\/\s*(\d{1,2})$/);
  if (!match) return null;
  const ip = ipToInt(match[1]);
  const cidr = Number(match[2]);
  if (ip === null || cidr < 0 || cidr > 30) return null;
  const mask = cidr === 0 ? 0 : (~0 << (32 - cidr)) >>> 0;
  const start = (ip & mask) >>> 0;
  if (start !== ip) return null;
  const size = 2 ** (32 - cidr);
  return { start, end: (start + size - 1) >>> 0, cidr, raw: `${match[1]}/${cidr}` };
}

function usable(cidr: number) {
  return Math.max(0, 2 ** (32 - cidr) - 2);
}

function overlaps(a: Block, b: Block) {
  return a.start <= b.end && b.start <= a.end;
}

export function gradeAddressPlan(input: PlanInput, report: string): BenchGrade {
  const parent = parseBlock("10.20.0.0/24");
  const rows: { id: keyof PlanInput; label: string; need: number; raw: string }[] = [
    { id: "lab", label: "Laboratorio ≥ 60 host", need: 60, raw: input.lab },
    { id: "segreteria", label: "Segreteria ≥ 30 host", need: 30, raw: input.segreteria },
    { id: "ospiti", label: "Ospiti ≥ 10 host", need: 10, raw: input.ospiti },
  ];
  const blocks = new Map<string, Block>();
  const checks: BenchCheck[] = rows.map((row) => {
    const block = parseBlock(row.raw);
    if (!block || !parent) return { id: row.id, label: `${row.label}: CIDR non valido o non allineato`, ok: false };
    blocks.set(row.id, block);
    const inside = block.start >= parent.start && block.end <= parent.end;
    const fits = usable(block.cidr) >= row.need;
    return {
      id: row.id,
      label: `${row.label} dentro 10.20.0.0/24`,
      ok: inside && fits,
    };
  });
  const present = [...blocks.values()];
  let clash = false;
  for (let i = 0; i < present.length; i++) {
    for (let j = i + 1; j < present.length; j++) {
      if (overlaps(present[i], present[j])) clash = true;
    }
  }
  checks.push({
    id: "overlap",
    label: "Le tre reti non si sovrappongono",
    ok: present.length === 3 && !clash,
  });
  const notes: string[] = [];
  if (clash) notes.push("Due reti occupano gli stessi indirizzi: si parte dal blocco più grande e si accosta il successivo.");
  return finishGrade(checks, report, BENCH_CASES[4].keywords, notes);
}

export function lookupPreview(input: DnsCutoverInput) {
  if (input.dns.trim() !== "10.20.0.5") {
    return "nslookup intranet.scuola.local\n*** dns.scuola non può trovare intranet.scuola.local: Non-existent domain";
  }
  if (!input.flushed) {
    return "nslookup intranet.scuola.local\nRisposta non autorevole dalla cache:\nAddress: 10.20.0.2 (server vecchio, nome non più pubblicato)";
  }
  return "nslookup intranet.scuola.local\nServer: 10.20.0.5\nAddress: 10.20.0.10";
}

export function pingPreview(input: ProvisionInput) {
  const onLan = sameSubnet(input.ip, input.gateway, 24) && maskOk(input.mask);
  if (!onLan || input.gateway.trim() !== "10.20.30.1" || input.ip.trim() !== "10.20.30.44") {
    return "Richiesta scaduta. Il gateway non è sulla stessa rete della scheda.";
  }
  return "Risposta da 10.20.30.1: byte=32 TTL=64";
}

export function webPreview(input: ProvisionInput) {
  if (input.proxyOn) return "ERR_PROXY_CONNECTION_FAILED";
  if (input.dns.trim() !== "10.20.0.2") return "DNS_PROBE_FINISHED_NXDOMAIN";
  if (!(sameSubnet(input.ip, "10.20.30.1", 24) && maskOk(input.mask) && input.ip.trim() === "10.20.30.44")) {
    return "Impossibile raggiungere l’host.";
  }
  return "HTTP 200 — Intranet scuola, PC-AULA-04.";
}
