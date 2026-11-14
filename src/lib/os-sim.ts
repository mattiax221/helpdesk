export type OsKind = "windows" | "linux";

export type OsDoc = { title: string; body: string };

export type OsScenario = {
  id: string;
  os: OsKind;
  title: string;
  ticket: string;
  /** Parole che il report dovrebbe contenere (almeno 2 su queste). */
  reportKeywords: string[];
  hints: string[];
  /** Guida libera, senza penalità. */
  docs: OsDoc[];
  /** Testo dell'imprevisto, se il caso ne ha uno. */
  surprise?: string;
};

export type OsWorld = {
  dns: string;
  proxyOn: boolean;
  flushed: boolean;
  resolv: string;
  hosts: string;
  queueCleared: boolean;
  printerPaused: boolean;
  serviceUp: boolean;
  portBlocked: boolean;
  updateService: boolean;
  updateNeedsReboot: boolean;
  updateDone: boolean;
  surpriseFired: boolean;
  checks: Record<string, boolean>;
};

export const OS_SCENARIOS: OsScenario[] = [
  {
    id: "win-dns",
    os: "windows",
    title: "Windows · siti per nome non aprono",
    ticket:
      "Il PC della segreteria apre le pagine solo se scrivi l’IP. I nomi (intranet, Google) danno errore DNS. Non toccare cavi: è tutto software.",
    reportKeywords: ["dns", "8.8.8.8", "flush", "ipconfig", "10.20.0.2"],
    hints: ["Apri Terminale e lancia ipconfig", "Il DNS giusto del laboratorio è 10.20.0.2", "Dopo il cambio: ipconfig /flushdns e riprova il browser"],
    docs: [
      {
        title: "DNS in breve",
        body: "Il DNS traduce un nome (intranet.scuola.local) in un indirizzo IP. Se il server DNS del PC è sbagliato, i nomi non si aprono ma l’IP diretto sì. Il DNS del laboratorio è 10.20.0.2. Dopo averlo cambiato va svuotata la cache.",
      },
    ],
  },
  {
    id: "win-proxy",
    os: "windows",
    title: "Windows · browser bloccato, ping ok",
    ticket:
      "Il browser non carica nulla («proxy server»), ma dal prompt il ping a 1.1.1.1 risponde. Qualcuno ha lasciato un proxy di prova.",
    reportKeywords: ["proxy", "browser", "impostazioni", "disattiv"],
    hints: ["Ping funziona: la rete c’è", "Controlla Impostazioni → Proxy", "Il proxy 192.168.99.99 non esiste"],
    docs: [
      {
        title: "Proxy e ping",
        body: "Il ping prova la rete, non il browser. Se il ping risponde e il browser parla di proxy, il PC sta inviando il traffico web a un server intermedio. Un proxy di prova inesistente blocca solo le pagine, non il ping.",
      },
    ],
  },
  {
    id: "linux-resolv",
    os: "linux",
    title: "Linux · curl non risolve i nomi",
    ticket:
      "Sul server aula `ping 10.20.0.2` va, `curl intranet` no. Il file dei DNS è stato sovrascritto. Sistema da terminale/editor, niente hardware.",
    reportKeywords: ["resolv", "nameserver", "dns", "curl", "10.20.0.2"],
    hints: ["cat /etc/resolv.conf", "Il nameserver corretto è 10.20.0.2", "Salva il file e riprova curl"],
    docs: [
      {
        title: "resolv.conf",
        body: "Su Linux i nomi li risolve il file /etc/resolv.conf. La riga che conta è nameserver, seguito dall’IP del DNS. 8.8.8.8 non conosce i nomi interni della scuola. Il nameserver del laboratorio è 10.20.0.2.",
      },
    ],
  },
  {
    id: "win-hosts",
    os: "windows",
    title: "Windows · un sito finisce su questo PC",
    ticket:
      "La intranet si apre vuota o resta sul PC stesso. Il ping all’IP del server risponde. Qualcuno ha scritto un nome nel file hosts.",
    reportKeywords: ["hosts", "127.0.0.1", "intranet", "editor"],
    hints: [
      "Apri l’Editor: è il file hosts di Windows",
      "Una riga 127.0.0.1 nome dirotta quel sito su questo PC",
      "Togli le righe sbagliate, salva e riprova il browser",
    ],
    surprise: "Il cliente richiama: ora non si apre nemmeno Google. Qualcuno ha aggiunto un’altra riga nel file hosts.",
    docs: [
      {
        title: "File hosts",
        body: "Prima del DNS, Windows legge C:\\Windows\\System32\\drivers\\etc\\hosts. Se una riga dice 127.0.0.1 e poi un nome, quel nome punta a questo PC e non al server vero. 127.0.0.1 significa «qui».",
      },
    ],
  },
  {
    id: "win-print",
    os: "windows",
    title: "Windows · la stampante non stampa",
    ticket:
      "La segreteria manda in stampa e non esce nulla. Il lavoro resta in coda con errore. Non è un guasto di cavo: la coda è bloccata.",
    reportKeywords: ["coda", "stampante", "pausa", "spooler", "annull"],
    hints: [
      "Apri Impostazioni e guarda la coda",
      "Annulla i lavori in errore",
      "Se la stampante è in pausa, va ripresa, poi fai una pagina di prova",
    ],
    surprise: "Squilla il telefono: «l’abbiamo messa in pausa noi, sennò stampava fogli a metà». La stampante è in pausa.",
    docs: [
      {
        title: "Coda di stampa",
        body: "Windows non manda il foglio diretto alla stampante: lo mette in una coda (spooler). Un lavoro in errore blocca i successivi. La stampante in pausa accetta lavori ma non li stampa. Si annulla la coda e si toglie la pausa.",
      },
    ],
  },
  {
    id: "linux-nginx",
    os: "linux",
    title: "Linux · il sito dell’aula non risponde",
    ticket:
      "http://intranet non risponde. Il server è acceso e il ping passa. Il servizio web è fermo. Sistema da terminale.",
    reportKeywords: ["nginx", "systemctl", "porta", "kill", "curl"],
    hints: [
      "systemctl status nginx",
      "Se la porta 80 è occupata, il servizio non resta su",
      "Libera la porta e riavvia nginx, poi curl",
    ],
    surprise: "nginx parte e ricade subito. Nel journal: address already in use, processo di prova pid 9999 sulla porta 80.",
    docs: [
      {
        title: "Un servizio che non resta acceso",
        body: "systemctl status dice se nginx è attivo. systemctl start lo avvia. Se un altro programma tiene la porta 80, nginx si spegne di nuovo. Quel programma va chiuso (kill sul pid) e poi nginx va riavviato.",
      },
    ],
  },
  {
    id: "win-update",
    os: "windows",
    title: "Windows · aggiornamento fermo a zero",
    ticket:
      "Windows Update è fermo allo 0% da stamattina. Il PC va in rete. Il servizio degli aggiornamenti risulta arrestato.",
    reportKeywords: ["update", "servizio", "wuauserv", "riavvio", "0%"],
    hints: [
      "Apri Impostazioni → Windows Update",
      "Il servizio va avviato",
      "Se chiede un riavvio, confermalo: senza, l’aggiornamento resta sospeso",
    ],
    surprise: "A metà compare l’avviso del cliente: «ho staccato la spina». L’aggiornamento è tornato in sospeso e chiede un riavvio.",
    docs: [
      {
        title: "Windows Update fermo",
        body: "Se l’aggiornamento resta allo 0%, spesso il servizio wuauserv è arrestato. Si avvia il servizio dalla scheda aggiornamenti. Un riavvio richiesto va confermato, altrimenti l’installazione non riprende.",
      },
    ],
  },
];

const EMPTY_CHECKS: Record<string, boolean> = {};

export function initialOsWorld(s: OsScenario): OsWorld {
  const base: OsWorld = {
    dns: "8.8.8.8",
    proxyOn: false,
    flushed: false,
    resolv: "nameserver 8.8.8.8\n",
    hosts: "127.0.0.1 localhost\n127.0.0.1 intranet.scuola.local\n",
    queueCleared: false,
    printerPaused: false,
    serviceUp: false,
    portBlocked: false,
    updateService: false,
    updateNeedsReboot: false,
    updateDone: false,
    surpriseFired: false,
    checks: { ...EMPTY_CHECKS },
  };
  if (s.id === "win-proxy") {
    return { ...base, dns: "10.20.0.2", proxyOn: true, flushed: true, resolv: "nameserver 10.20.0.2\n" };
  }
  if (s.id === "linux-resolv") {
    return { ...base, resolv: "# sovrascritto per errore\nnameserver 8.8.8.8\n" };
  }
  if (s.id === "win-print") {
    return { ...base, dns: "10.20.0.2", flushed: true };
  }
  if (s.id === "linux-nginx") {
    return { ...base, dns: "10.20.0.2", resolv: "nameserver 10.20.0.2\n" };
  }
  if (s.id === "win-update") {
    return { ...base, dns: "10.20.0.2", flushed: true };
  }
  return base;
}

function hostsBlocks(hosts: string, name: string) {
  return hosts
    .split("\n")
    .some((line) => {
      const clean = line.replace(/#.*/, "").trim().toLowerCase();
      if (!clean.startsWith("127.0.0.1")) return false;
      return clean.split(/\s+/).slice(1).includes(name);
    });
}

export function browserOk(s: OsScenario, w: OsWorld) {
  if (s.id === "win-proxy") return !w.proxyOn;
  if (s.id === "linux-resolv") return /nameserver\s+10\.20\.0\.2/.test(w.resolv);
  if (s.id === "win-hosts") {
    const intranet = hostsBlocks(w.hosts, "intranet.scuola.local");
    const google = hostsBlocks(w.hosts, "www.google.com");
    return !intranet && !google;
  }
  if (s.id === "win-print") return w.queueCleared && !w.printerPaused && !!w.checks.testPage;
  if (s.id === "linux-nginx") return w.serviceUp && !w.portBlocked;
  if (s.id === "win-update") return w.updateDone;
  return w.dns.trim() === "10.20.0.2" && w.flushed;
}

export function osActions(s: OsScenario, w: OsWorld) {
  if (s.id === "win-proxy") {
    return [
      { id: "ping", label: "Verificare che il ping funzioni", ok: !!w.checks.ping },
      { id: "proxy-seen", label: "Aprire le impostazioni proxy", ok: !!w.checks.proxySeen },
      { id: "proxy-off", label: "Disattivare il proxy", ok: !w.proxyOn && !!w.checks.proxySaved },
      { id: "browser", label: "Ricaricare il sito nel browser", ok: !!w.checks.browser && browserOk(s, w) },
    ];
  }
  if (s.id === "linux-resolv") {
    return [
      { id: "cat", label: "Leggere /etc/resolv.conf", ok: !!w.checks.cat },
      { id: "edit", label: "Impostare nameserver 10.20.0.2 e salvare", ok: !!w.checks.saved && browserOk(s, w) },
      { id: "curl", label: "Riprovare curl e vedere HTTP 200", ok: !!w.checks.curl && browserOk(s, w) },
    ];
  }
  if (s.id === "win-hosts") {
    return [
      { id: "read", label: "Aprire il file hosts", ok: !!w.checks.hostsRead },
      { id: "edit", label: "Togliere i dirottamenti su 127.0.0.1 e salvare", ok: !!w.checks.hostsSaved && browserOk(s, w) },
      { id: "browser", label: "Aprire intranet e Google nel browser", ok: !!w.checks.browser && browserOk(s, w) },
    ];
  }
  if (s.id === "win-print") {
    return [
      { id: "seen", label: "Aprire la coda di stampa", ok: !!w.checks.printerSeen },
      { id: "queue", label: "Annullare i lavori in errore", ok: w.queueCleared },
      { id: "resume", label: "Riprendere la stampante dopo la pausa", ok: w.surpriseFired && !w.printerPaused && !!w.checks.resumed },
      { id: "test", label: "Stampare la pagina di prova", ok: !!w.checks.testPage && w.queueCleared && !w.printerPaused },
    ];
  }
  if (s.id === "linux-nginx") {
    return [
      { id: "status", label: "Controllare systemctl status nginx", ok: !!w.checks.status },
      { id: "kill", label: "Liberare la porta 80 (kill 9999)", ok: w.surpriseFired && !w.portBlocked && !!w.checks.killed },
      { id: "start", label: "Avviare nginx con la porta libera", ok: w.serviceUp && !w.portBlocked && !!w.checks.startedAfter },
      { id: "curl", label: "Verificare con curl che risponda HTTP 200", ok: !!w.checks.curl && browserOk(s, w) },
    ];
  }
  if (s.id === "win-update") {
    return [
      { id: "open", label: "Aprire Windows Update", ok: !!w.checks.updateSeen },
      { id: "service", label: "Avviare il servizio aggiornamenti", ok: w.updateService && !!w.checks.serviceStarted },
      { id: "reboot", label: "Confermare il riavvio chiesto dal cliente", ok: w.surpriseFired && w.updateDone },
    ];
  }
  return [
    { id: "ipconfig", label: "Leggere la config con ipconfig", ok: !!w.checks.ipconfig },
    { id: "dns", label: "Impostare DNS 10.20.0.2", ok: w.dns.trim() === "10.20.0.2" && !!w.checks.dnsSaved },
    { id: "flush", label: "Eseguire ipconfig /flushdns", ok: !!w.checks.flush && w.flushed },
    { id: "browser", label: "Aprire il sito nel browser", ok: !!w.checks.browser && browserOk(s, w) },
  ];
}

/** Dopo il primo controllo utile, il caso nuovo aggiunge un imprevisto. */
export function withSurprise(s: OsScenario, w: OsWorld): OsWorld {
  if (w.surpriseFired || !s.surprise) return w;
  if (s.id === "win-hosts" && w.checks.hostsRead) {
    const extra = "127.0.0.1 www.google.com";
    const hosts = hostsBlocks(w.hosts, "www.google.com") ? w.hosts : `${w.hosts.trim()}\n${extra}\n`;
    return { ...w, hosts, surpriseFired: true };
  }
  if (s.id === "win-print" && w.checks.printerSeen) {
    return { ...w, printerPaused: true, surpriseFired: true };
  }
  if (s.id === "linux-nginx" && w.checks.started) {
    return { ...w, serviceUp: false, portBlocked: true, surpriseFired: true };
  }
  if (s.id === "win-update" && w.checks.serviceStarted) {
    return { ...w, updateNeedsReboot: true, updateDone: false, surpriseFired: true };
  }
  return w;
}

export type OsGrade = {
  score: number;
  actionScore: number;
  reportScore: number;
  done: { id: string; label: string; ok: boolean }[];
  keywordsHit: string[];
  keywordsMiss: string[];
  notes: string[];
};

const ACTION_WEIGHT = 70;
const REPORT_WEIGHT = 30;

export function gradeOsReport(opts: {
  scenario: OsScenario;
  actions: { id: string; label: string; ok: boolean }[];
  report: string;
}): OsGrade {
  const { scenario, actions, report } = opts;
  const okCount = actions.filter((a) => a.ok).length;
  const actionScore =
    actions.length === 0 ? 0 : Math.round((okCount / actions.length) * ACTION_WEIGHT);

  const text = report.toLocaleLowerCase("it");
  const keywordsHit = scenario.reportKeywords.filter((k) => text.includes(k.toLocaleLowerCase("it")));
  const keywordsMiss = scenario.reportKeywords.filter((k) => !keywordsHit.includes(k));
  const longEnough = report.trim().length >= 40;
  const keywordRatio =
    scenario.reportKeywords.length === 0 ? 0 : keywordsHit.length / scenario.reportKeywords.length;
  const reportScore = !longEnough ? 0 : Math.round(keywordRatio * REPORT_WEIGHT);

  const notes: string[] = [];
  if (!longEnough) {
    notes.push("Report troppo corto: spiega in almeno un paio di frasi cosa hai controllato e cosa hai cambiato.");
  } else if (keywordsHit.length < 2) {
    notes.push("Nel report nomina gli strumenti e la causa (es. DNS, proxy, resolv.conf), non solo «ho sistemato».");
  } else {
    notes.push("Report sufficiente: cita i passi davvero fatti.");
  }
  const missing = actions.filter((a) => !a.ok);
  if (missing.length) {
    notes.push(`Passi mancanti sul desktop: ${missing.map((m) => m.label).join(", ")}.`);
  } else {
    notes.push("Tutte le azioni richieste sul desktop sono state eseguite.");
  }

  return {
    score: Math.min(100, actionScore + reportScore),
    actionScore,
    reportScore,
    done: actions,
    keywordsHit,
    keywordsMiss,
    notes,
  };
}
