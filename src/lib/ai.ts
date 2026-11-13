import type { Difficulty, TicketCategory, TicketPriority } from "@prisma/client";
import { CATEGORY_LABELS, DIFFICULTY_LABELS } from "@/lib/labels";

export type GeneratedTicket = {
  title: string;
  description: string;
  category: TicketCategory;
  priority: TicketPriority;
  difficulty: Difficulty;
  slaMinutes: number;
  fakeLogs: { name: string; content: string }[];
  secretNotes: string;
  clientHints: string[];
};

const MOCK_BANK: GeneratedTicket[] = [
  {
    title: "DNS interno non risolve i nomi",
    description:
      "Da questa mattina i PC dell'aula non aprono i siti scrivendo il nome, ma se metto l'IP a volte funziona. Chrome dice DNS_PROBE_FINISHED_NXDOMAIN. Possiamo sistemare prima della lezione?",
    category: "RETI_DNS",
    priority: "ALTA",
    difficulty: "INTERMEDIO",
    slaMinutes: 40,
    fakeLogs: [
      {
        name: "nslookup.txt",
        content:
          "> nslookup www.google.com\nServer:  UnKnown\nAddress:  192.168.1.1\n\n*** UnKnown non riesce a trovare www.google.com: Server failed",
      },
    ],
    secretNotes:
      "Causa: DNS del router/AD non raggiungibile o cache corrotta. Soluzione: verificare forwarder DNS, ipconfig /flushdns, test con 1.1.1.1 temporaneo, controllare firewall porta 53.",
    clientHints: [
      "Ieri hanno cambiato il router del laboratorio.",
      "Con l'IP numerico alcuni servizi interni rispondono.",
      "Il telefono in 4G naviga normalmente.",
    ],
  },
  {
    title: "Licenza Office scaduta in aula docente",
    description:
      "Word si apre ma dice che la licenza non è valida e mette una barra rossa. Non riesco a salvare. Serve per preparare la verifica!",
    category: "SOFTWARE_OFFICE",
    priority: "MEDIA",
    difficulty: "BASE",
    slaMinutes: 50,
    fakeLogs: [
      {
        name: "office-activation.txt",
        content: "Error Code: 0x80070005\nAccount: scuola@istituto.it\nStato: Subscription expired",
      },
    ],
    secretNotes:
      "Causa: abbonamento Microsoft 365 scaduto o profilo account corrotto. Soluzione: riattivare tenant, rimuovere account stale, riparazione Office Quick Repair.",
    clientHints: [
      "Il messaggio è comparso dopo le vacanze di Natale.",
      "Outlook chiede continuamente la password.",
      "Altri docenti con account diversi non hanno il problema.",
    ],
  },
  {
    title: "Permessi cartella condivisa negati",
    description:
      "Non riesco più ad aprire la cartella\\\\file-server\\progetti. Dice accesso negato. Ieri funzionava. Devo consegnare i file del progetto!",
    category: "SISTEMI_OPERATIVI",
    priority: "ALTA",
    difficulty: "AVANZATO",
    slaMinutes: 35,
    fakeLogs: [
      {
        name: "access-denied.txt",
        content:
          "Impossibile accedere a \\\\file-server\\progetti\nErrore: 0x80070005 Accesso negato\nUtente: STUDENTI\\mrossi",
      },
    ],
    secretNotes:
      "Causa: ACL NTFS/share modificate o utente fuori dal gruppo corretto. Soluzione: verificare membership AD, permessi share+NTFS, ownership e policy.",
    clientHints: [
      "Hanno fatto manutenzione sugli account ieri sera.",
      "Il collega nello stesso gruppo riesce ad entrare.",
      "Posso fare ping al file-server.",
    ],
  },
  {
    title: "Chiavetta USB non riconosciuta",
    description:
      "Ho inserito la chiavetta ma non compare nessuna lettera di unità. Serve per portare la presentazione in aula magna.",
    category: "HARDWARE",
    priority: "BASSA",
    difficulty: "BASE",
    slaMinutes: 25,
    fakeLogs: [
      {
        name: "device-manager.txt",
        content: "USB Mass Storage Device — Code 43\nDisk Management: disco sconosciuto, non inizializzato",
      },
    ],
    secretNotes:
      "Causa: driver USB, porta guasta o filesystem danneggiato. Soluzione: altra porta, Disk Management, chkdisk, escludere malware autorun.",
    clientHints: [
      "Su un altro PC la chiavetta funziona.",
      "La porta davanti del PC a volte non carica nemmeno il telefono.",
      "Windows emette il suono di periferica collegata.",
    ],
  },
  {
    title: "Account bloccato dopo troppi tentativi",
    description:
      "Non entro più in laboratorio: dice account bloccato. Non ho sbagliato la password... o forse sì. Lezione tra 10 minuti!",
    category: "SICUREZZA",
    priority: "CRITICA",
    difficulty: "INTERMEDIO",
    slaMinutes: 20,
    fakeLogs: [
      {
        name: "security-event.txt",
        content:
          "Event ID 4740: A user account was locked out.\nCaller Computer: LAB-PC-12\nBadPwdCount: 5",
      },
    ],
    secretNotes:
      "Causa: lockout policy AD dopo N tentativi. Soluzione: sbloccare account, verificare tastiera layout, escludere credential stuffing, educare alla password manager.",
    clientHints: [
      "La tastiera era impostata su EN.",
      "Qualcuno ha provato ad entrare prima di me sul PC.",
      "Il messaggio parla di blocco temporaneo.",
    ],
  },
];

function pickMock(category?: TicketCategory, difficulty?: Difficulty): GeneratedTicket {
  let pool = MOCK_BANK;
  if (category) pool = pool.filter((t) => t.category === category);
  if (difficulty) {
    const byDiff = pool.filter((t) => t.difficulty === difficulty);
    if (byDiff.length) pool = byDiff;
  }
  if (!pool.length) pool = MOCK_BANK;
  const base = pool[Math.floor(Math.random() * pool.length)];
  return {
    ...base,
    category: category ?? base.category,
    difficulty: difficulty ?? base.difficulty,
  };
}

async function callOpenAI(prompt: string): Promise<string> {
  const key = process.env.OPENAI_API_KEY;
  if (!key) throw new Error("OPENAI_API_KEY mancante");
  const model = process.env.AI_MODEL || "gpt-4o-mini";
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      temperature: 0.8,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "Sei un generatore di ticket help desk realistici per scuole superiori IT. Rispondi solo con JSON valido.",
        },
        { role: "user", content: prompt },
      ],
    }),
  });
  if (!res.ok) throw new Error(`OpenAI error ${res.status}`);
  const data = await res.json();
  return data.choices?.[0]?.message?.content ?? "";
}

async function callGemini(prompt: string): Promise<string> {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error("GEMINI_API_KEY mancante");
  const model = process.env.AI_MODEL || "gemini-1.5-flash";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { responseMimeType: "application/json" },
    }),
  });
  if (!res.ok) throw new Error(`Gemini error ${res.status}`);
  const data = await res.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
}

function buildPrompt(category?: TicketCategory, difficulty?: Difficulty, theme?: string) {
  return `Genera un ticket help desk scolastico realistico in italiano come JSON con chiavi:
title, description (linguaggio vago del cliente), category (${category ?? "una tra HARDWARE|RETI_DNS|SISTEMI_OPERATIVI|SOFTWARE_OFFICE|SICUREZZA"}),
priority (BASSA|MEDIA|ALTA|CRITICA), difficulty (${difficulty ?? "BASE|INTERMEDIO|AVANZATO"}),
slaMinutes (numero), fakeLogs (array di {name, content}), secretNotes (causa tecnica + soluzione per il docente),
clientHints (array di 3 indizi progressivi).
Tema richiesto: ${theme || "scenario quotidiano in laboratorio informatico"}.
Categoria preferita: ${category ? CATEGORY_LABELS[category] : "libera"}.
Difficoltà: ${difficulty ? DIFFICULTY_LABELS[difficulty] : "libera"}.`;
}

function parseGenerated(raw: string, category?: TicketCategory, difficulty?: Difficulty): GeneratedTicket {
  const json = JSON.parse(raw) as GeneratedTicket;
  return {
    title: String(json.title),
    description: String(json.description),
    category: (category || json.category || "HARDWARE") as TicketCategory,
    priority: (json.priority || "MEDIA") as TicketPriority,
    difficulty: (difficulty || json.difficulty || "INTERMEDIO") as Difficulty,
    slaMinutes: Number(json.slaMinutes) || 60,
    fakeLogs: Array.isArray(json.fakeLogs) ? json.fakeLogs : [],
    secretNotes: String(json.secretNotes || ""),
    clientHints: Array.isArray(json.clientHints) ? json.clientHints : [],
  };
}

export async function generateTicketContent(input: {
  category?: TicketCategory;
  difficulty?: Difficulty;
  theme?: string;
}): Promise<{ ticket: GeneratedTicket; source: "ai" | "mock" }> {
  const provider = (process.env.AI_PROVIDER || "mock").toLowerCase();
  const prompt = buildPrompt(input.category, input.difficulty, input.theme);

  try {
    if (provider === "openai" && process.env.OPENAI_API_KEY) {
      const raw = await callOpenAI(prompt);
      return { ticket: parseGenerated(raw, input.category, input.difficulty), source: "ai" };
    }
    if (provider === "gemini" && process.env.GEMINI_API_KEY) {
      const raw = await callGemini(prompt);
      return { ticket: parseGenerated(raw, input.category, input.difficulty), source: "ai" };
    }
  } catch (error) {
    console.warn("AI generation fallback to mock:", error);
  }

  return {
    ticket: pickMock(input.category, input.difficulty),
    source: "mock",
  };
}

export function clientReplyForHint(hints: string[], hintIndex: number, question: string): string {
  const q = question.toLowerCase();
  if (hintIndex < hints.length) {
    return hints[hintIndex];
  }
  if (q.includes("ip") || q.includes("rete") || q.includes("ping")) {
    return "Uhm non sono tecnico... so solo che internet a casa mia funziona, qui no. Avete già controllato i cavi?";
  }
  if (q.includes("quando") || q.includes("ieri")) {
    return "È iniziato ieri o stamattina, non ricordo bene. Prima andava tutto ok.";
  }
  return "Non saprei dirvi altro, scusate. Fate voi che siete i tecnici!";
}
