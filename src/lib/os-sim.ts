export type OsKind = "windows" | "linux";

export type OsScenario = {
  id: string;
  os: OsKind;
  title: string;
  ticket: string;
  /** Parole che il report dovrebbe contenere (almeno 2 su queste). */
  reportKeywords: string[];
  hints: string[];
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
  },
  {
    id: "win-proxy",
    os: "windows",
    title: "Windows · browser bloccato, ping ok",
    ticket:
      "Il browser non carica nulla («proxy server»), ma dal prompt il ping a 1.1.1.1 risponde. Qualcuno ha lasciato un proxy di prova.",
    reportKeywords: ["proxy", "browser", "impostazioni", "disattiv"],
    hints: ["Ping funziona: la rete c’è", "Controlla Impostazioni → Proxy", "Il proxy 192.168.99.99 non esiste"],
  },
  {
    id: "linux-resolv",
    os: "linux",
    title: "Linux · curl non risolve i nomi",
    ticket:
      "Sul server aula `ping 10.20.0.2` va, `curl intranet` no. Il file dei DNS è stato sovrascritto. Sistema da terminale/editor, niente hardware.",
    reportKeywords: ["resolv", "nameserver", "dns", "curl", "10.20.0.2"],
    hints: ["cat /etc/resolv.conf", "Il nameserver corretto è 10.20.0.2", "Salva il file e riprova curl"],
  },
];

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
