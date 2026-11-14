export type LabGameKey =
  | "rj45"
  | "terminal"
  | "ports"
  | "subnet"
  | "osi"
  | "cli"
  | "wifi"
  | "ossim"
  | "bench";

export type LabGameDef = {
  key: LabGameKey;
  title: string;
  titleEn: string;
  description: string;
  descriptionEn: string;
  skill: string;
  estimatedMinutes: number;
  defaultMinScore: number;
};

export const LAB_GAMES: LabGameDef[] = [
  {
    key: "rj45",
    title: "Crimpatura RJ45",
    titleEn: "RJ45 Crimping",
    description: "Ordina gli 8 fili T568A/T568B/Crossover prima del timeout.",
    descriptionEn: "Order the 8 wires for T568A/T568B/Crossover before time runs out.",
    skill: "Cablaggio",
    estimatedMinutes: 5,
    defaultMinScore: 60,
  },
  {
    key: "terminal",
    title: "Ping & IP Challenge",
    titleEn: "Ping & IP Challenge",
    description: "Quiz rapidi su IP, gateway, DNS e comandi di troubleshooting.",
    descriptionEn: "Quick quiz on IP, gateway, DNS and troubleshooting commands.",
    skill: "Reti",
    estimatedMinutes: 8,
    defaultMinScore: 50,
  },
  {
    key: "ports",
    title: "Port Strike",
    titleEn: "Port Strike",
    description: "Abbina porte TCP/UDP ai servizi come in un check firewall.",
    descriptionEn: "Match TCP/UDP ports to services like a firewall review.",
    skill: "Sicurezza / Reti",
    estimatedMinutes: 6,
    defaultMinScore: 55,
  },
  {
    key: "subnet",
    title: "Subnet / CIDR Builder",
    titleEn: "Subnet / CIDR Builder",
    description: "Calcola host, rete, broadcast e maschera da un CIDR.",
    descriptionEn: "Compute hosts, network, broadcast and mask from a CIDR.",
    skill: "Reti avanzate",
    estimatedMinutes: 10,
    defaultMinScore: 60,
  },
  {
    key: "osi",
    title: "OSI Layer Match",
    titleEn: "OSI Layer Match",
    description: "Collega protocolli e dispositivi al livello OSI corretto.",
    descriptionEn: "Match protocols and devices to the correct OSI layer.",
    skill: "Teoria reti",
    estimatedMinutes: 7,
    defaultMinScore: 55,
  },
  {
    key: "cli",
    title: "CLI Command Strike",
    titleEn: "CLI Command Strike",
    description: "Abbina il comando giusto al problema (Windows/Linux).",
    descriptionEn: "Match the right command to the problem (Windows/Linux).",
    skill: "Sistemi",
    estimatedMinutes: 7,
    defaultMinScore: 55,
  },
  {
    key: "wifi",
    title: "Wi‑Fi Security Ladder",
    titleEn: "Wi‑Fi Security Ladder",
    description: "Ordina standard e scegli le pratiche Wi‑Fi sicure per la scuola.",
    descriptionEn: "Rank Wi‑Fi standards and pick secure school Wi‑Fi practices.",
    skill: "Sicurezza",
    estimatedMinutes: 6,
    defaultMinScore: 50,
  },
  {
    key: "ossim",
    title: "Desktop Windows / Linux",
    titleEn: "Windows / Linux desktop",
    description:
      "Sistema un problema solo software dentro un PC simulato, poi scrivi cosa hai fatto.",
    descriptionEn:
      "Fix a software-only issue inside a simulated PC, then write what you did.",
    skill: "Sistemi / troubleshooting",
    estimatedMinutes: 15,
    defaultMinScore: 60,
  },
  {
    key: "bench",
    title: "Banco di lavoro",
    titleEn: "Workshop bench",
    description:
      "Interventi seri: messa in servizio, cambio DNS, ricerca guasto su prove reali e piano di indirizzamento. Report obbligatorio.",
    descriptionEn:
      "Serious jobs: PC provisioning, DNS cutover, fault-finding from evidence, and an address plan. A written report is required.",
    skill: "Troubleshooting",
    estimatedMinutes: 20,
    defaultMinScore: 70,
  },
];

export function getLabGame(key: string): LabGameDef | undefined {
  return LAB_GAMES.find((g) => g.key === key);
}

export const LAB_GAME_KEYS = LAB_GAMES.map((g) => g.key) as [LabGameKey, ...LabGameKey[]];
