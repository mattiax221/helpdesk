import type { Difficulty, TicketCategory, TicketPriority } from "@prisma/client";
import { CATEGORY_LABELS, DIFFICULTY_LABELS } from "@/lib/labels";
import { TICKET_SCENARIOS } from "@/lib/ticket-scenarios";
import type { GeneratedTicket } from "@/lib/ai-types";

export type { GeneratedTicket };

function pickMock(category?: TicketCategory, difficulty?: Difficulty): GeneratedTicket {
  let pool = TICKET_SCENARIOS;
  if (category) {
    const byCat = pool.filter((t) => t.category === category);
    if (byCat.length) pool = byCat;
  }
  if (difficulty) {
    const byDiff = pool.filter((t) => t.difficulty === difficulty);
    if (byDiff.length) pool = byDiff;
  }
  const base = pool[Math.floor(Math.random() * pool.length)];
  return {
    ...base,
    category: category ?? base.category,
    difficulty: difficulty ?? base.difficulty,
    fakeLogs: base.fakeLogs.map((l) => ({ ...l })),
    clientHints: [...base.clientHints],
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
      temperature: 0.9,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "Sei un generatore di ticket help desk scolastici ultra-realistici in italiano. Linguaggio cliente vago, log tecnici credibili, soluzione nascosta per il docente. Solo JSON.",
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
  const model = process.env.AI_MODEL || "gemini-2.5-flash";
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
title, description (linguaggio vago del cliente), category (${category ?? "HARDWARE|RETI_DNS|SISTEMI_OPERATIVI|SOFTWARE_OFFICE|SICUREZZA"}),
priority (BASSA|MEDIA|ALTA|CRITICA), difficulty (${difficulty ?? "BASE|INTERMEDIO|AVANZATO"}),
slaMinutes, fakeLogs (array {name, content} con log credibili), secretNotes (causa + soluzione docente),
clientHints (3-5 indizi progressivi).
Tema: ${theme || "guasto quotidiano in laboratorio/segreteria scolastica"}.
Categoria: ${category ? CATEGORY_LABELS[category] : "libera"}.
Difficoltà: ${difficulty ? DIFFICULTY_LABELS[difficulty] : "libera"}.
Rendi lo scenario unico, non generico.`;
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
}): Promise<{ ticket: GeneratedTicket; source: "ai" | "mock"; bankSize: number }> {
  const provider = (process.env.AI_PROVIDER || "mock").toLowerCase();
  const prompt = buildPrompt(input.category, input.difficulty, input.theme);

  try {
    if (provider === "openai" && process.env.OPENAI_API_KEY) {
      const raw = await callOpenAI(prompt);
      return {
        ticket: parseGenerated(raw, input.category, input.difficulty),
        source: "ai",
        bankSize: TICKET_SCENARIOS.length,
      };
    }
    if (provider === "gemini" && process.env.GEMINI_API_KEY) {
      const raw = await callGemini(prompt);
      return {
        ticket: parseGenerated(raw, input.category, input.difficulty),
        source: "ai",
        bankSize: TICKET_SCENARIOS.length,
      };
    }
  } catch (error) {
    console.warn("AI generation fallback to mock:", error);
  }

  return {
    ticket: pickMock(input.category, input.difficulty),
    source: "mock",
    bankSize: TICKET_SCENARIOS.length,
  };
}

const KEYWORD_REPLIES: { keys: string[]; reply: string }[] = [
  {
    keys: ["quando", "da quanto", "ieri", "stamattina"],
    reply: "Mah… è iniziato ieri o stamattina, non so. Prima andava, adesso no.",
  },
  {
    keys: ["cavo", "ethernet", "spina"],
    reply: "Il cavo è quello arancione, l'abbiamo anche riprovato. Boh, a me sembra ok.",
  },
  {
    keys: ["wifi", "wireless", "ssid"],
    reply: "Il wifi del telefono prende, quello del PC no… o forse sì ma non naviga, non capisco la differenza.",
  },
  {
    keys: ["password", "login", "account"],
    reply: "La password è quella di sempre! O forse l'ho cambiata la scorsa settimana… non ricordo.",
  },
  {
    keys: ["aggiornament", "update", "windows"],
    reply: "Sì c'era una cosa di aggiornamenti. Ho cliccato ok e ho spento. Poi è iniziato il caos.",
  },
  {
    keys: ["stampant", "print"],
    reply: "La stampante ha delle lucine. Una è arancione. Cosa significa? Non c'è il manuale.",
  },
  {
    keys: ["ip", "indirizzo", "rete", "ping"],
    reply: "IP? Io so solo che internet a casa funziona. Qui no. Controllate voi i numeri strani.",
  },
  {
    keys: ["mail", "email", "phishing", "link"],
    reply: "La mail sembrava del preside… c'era urgenza. Il link era lungo e strano, sì.",
  },
  {
    keys: ["lento", "ventol", "rumor", "caldo"],
    reply: "È caldissimo e fa un rumore da aereo. Se alzo il pc con un libro sembra meglio.",
  },
  {
    keys: ["errore", "messaggio", "codice"],
    reply: "C'era un codice con delle x e dei numeri. L'ho chiuso perché mi spaventava.",
  },
];

export function clientReplyForHint(hints: string[], hintIndex: number, question: string): string {
  const q = question.toLowerCase();

  // Progressive scripted hints first
  if (hintIndex < hints.length) {
    const hint = hints[hintIndex];
    if (hintIndex === 0) {
      return `Allora… ${hint} Vi serve altro? Sono di fretta.`;
    }
    if (hintIndex === hints.length - 1) {
      return `Ok vi dico l'ultima cosa che ricordo: ${hint}`;
    }
    return hint;
  }

  for (const row of KEYWORD_REPLIES) {
    if (row.keys.some((k) => q.includes(k))) return row.reply;
  }

  if (q.includes("?")) {
    return "Non saprei proprio. Fate una prova voi che siete i tecnici, io aspetto qui.";
  }

  return "Uhm… non mi viene in mente altro. Se vi serve riavvio tutto di nuovo, di solito lo faccio tre volte.";
}

type ChatTurn = { role: "student" | "client"; body: string };

async function callClientChatLLM(prompt: string): Promise<string> {
  const provider = (process.env.AI_PROVIDER || "mock").toLowerCase();
  if (provider === "openai" && process.env.OPENAI_API_KEY) {
    const model = process.env.AI_MODEL || "gpt-4o-mini";
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        temperature: 0.85,
        max_tokens: 180,
        messages: [
          {
            role: "system",
            content:
              "Sei un utente scolastico non tecnico che risponde a un help desk. Italiano colloquiale, vago, a volte impreciso. Mai rivelare la causa tecnica esatta. Massimo 2 frasi.",
          },
          { role: "user", content: prompt },
        ],
      }),
    });
    if (!res.ok) throw new Error(`OpenAI chat ${res.status}`);
    const data = await res.json();
    return String(data.choices?.[0]?.message?.content || "").trim();
  }

  if (provider === "gemini" && process.env.GEMINI_API_KEY) {
    const model = process.env.AI_MODEL || "gemini-2.5-flash";
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${process.env.GEMINI_API_KEY}`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.85, maxOutputTokens: 180 },
      }),
    });
    if (!res.ok) throw new Error(`Gemini chat ${res.status}`);
    const data = await res.json();
    return String(data.candidates?.[0]?.content?.parts?.[0]?.text || "").trim();
  }

  throw new Error("AI non configurata");
}

/** Cliente simulato: AI se disponibile, altrimenti script/hint. Non espone secretNotes. */
export async function generateClientReply(input: {
  question: string;
  ticketTitle: string;
  ticketDescription: string;
  hints: string[];
  hintIndex: number;
  recentChat: ChatTurn[];
}): Promise<{ reply: string; source: "ai" | "scripted" }> {
  const scripted = clientReplyForHint(input.hints, input.hintIndex, input.question);
  const provider = (process.env.AI_PROVIDER || "mock").toLowerCase();
  const aiReady =
    (provider === "openai" && Boolean(process.env.OPENAI_API_KEY)) ||
    (provider === "gemini" && Boolean(process.env.GEMINI_API_KEY));

  if (!aiReady) {
    return { reply: scripted, source: "scripted" };
  }

  const revealed = input.hints.slice(0, Math.min(input.hintIndex + 1, input.hints.length));
  const history = input.recentChat
    .slice(-6)
    .map((t) => `${t.role === "student" ? "Tecnico" : "Cliente"}: ${t.body}`)
    .join("\n");

  const prompt = `Ticket: ${input.ticketTitle}
Descrizione che hai aperto tu (vaga): ${input.ticketDescription}
Indizi che puoi usare (non inventare soluzioni tecniche): ${JSON.stringify(revealed)}
Cronologia recente:
${history || "(vuota)"}
Nuova domanda del tecnico: ${input.question}

Rispondi SOLO come cliente. Se non sai, sii confuso. Se c'è un indizio non ancora detto tra quelli elencati, puoi rivelarne uno in modo naturale. Non usare termini da sistemista.`;

  try {
    const reply = await callClientChatLLM(prompt);
    if (!reply) return { reply: scripted, source: "scripted" };
    return { reply, source: "ai" };
  } catch (error) {
    console.warn("Client chat AI fallback:", error);
    return { reply: scripted, source: "scripted" };
  }
}

export function listScenarioCatalog() {
  return TICKET_SCENARIOS.map((t, i) => ({
    id: i,
    title: t.title,
    category: t.category,
    difficulty: t.difficulty,
    priority: t.priority,
  }));
}
