import type { TicketCategory, TicketPriority, Difficulty } from "@prisma/client";

export type ChainTicketTemplate = {
  title: string;
  description: string;
  category: TicketCategory;
  priority: TicketPriority;
  difficulty: Difficulty;
  slaMinutes: number;
  fakeLogs: { name: string; content: string }[];
  secretNotes: string;
  clientHints: string[];
  /** Breve etichetta nodo nella timeline catena */
  nodeLabel: string;
};

export type IncidentChainDef = {
  key: string;
  name: string;
  blurb: string;
  /** Se il voto è <= questa soglia, nasce il ticket successivo */
  spawnOnMaxGrade: number;
  steps: ChainTicketTemplate[];
};

/**
 * Catene didattiche: un fix debole sull'incidente A fa emergere il sintomo B.
 * Il docente valuta; sotto soglia viene spawnato il passo successivo allo stesso studente.
 */
export const INCIDENT_CHAINS: IncidentChainDef[] = [
  {
    key: "dns-to-ad",
    name: "DNS → Domain Join",
    blurb:
      "Se il DNS interno resta rotto, i PC nuovi non entrano nel dominio Active Directory.",
    spawnOnMaxGrade: 5,
    steps: [
      {
        nodeLabel: "DNS aula",
        title: "DNS interno non risolve i nomi",
        description:
          "I PC dell'aula non aprono i siti per nome (DNS_PROBE_FINISHED_NXDOMAIN). Con l'IP a volte sì. Tra 10 minuti c'è lezione.",
        category: "RETI_DNS",
        priority: "ALTA",
        difficulty: "INTERMEDIO",
        slaMinutes: 40,
        fakeLogs: [
          {
            name: "nslookup.txt",
            content:
              "> nslookup www.google.com\nServer: UnKnown\nAddress: 192.168.1.1\n*** Server failed\n\n> nslookup dc01.istituto.local\n*** Non-existent domain",
          },
        ],
        secretNotes:
          "Causa: DNS interno/AD irraggiungibile o forwarder assente. Fix: puntare DNS al DC/forwarder, flushdns, test porta 53, NON limitarsi a 8.8.8.8 sui client dominio.",
        clientHints: [
          "Ieri hanno cambiato il router del laboratorio.",
          "Con IP numerico alcuni servizi rispondono.",
          "Il telefono in 4G naviga ok.",
        ],
      },
      {
        nodeLabel: "Join AD",
        title: "PC nuovi: impossibile entrare nel dominio",
        description:
          "Abbiamo imagingato 6 portatili. Il join al dominio fallisce: «The specified domain cannot be contacted». I tecnici dicono che ieri «avevano sistemato internet».",
        category: "SISTEMI_OPERATIVI",
        priority: "CRITICA",
        difficulty: "AVANZATO",
        slaMinutes: 45,
        fakeLogs: [
          {
            name: "netsetup.log",
            content:
              "NetpDsGetDcName: failed to find DC for istituto.local\nERROR_NO_SUCH_DOMAIN\nDNS query for _ldap._tcp.dc._msdcs.istituto.local → timeout\nClient DNS: 8.8.8.8, 1.1.1.1",
          },
        ],
        secretNotes:
          "Causa a valle del DNS: i client usano solo DNS pubblici, non risolvono SRV del DC. Fix: DNS interno (DC) come primario, poi join; verificare orario e connettività 389/53 verso DC.",
        clientHints: [
          "Internet 'sembra' funzionare (YouTube apre).",
          "Il nome del dominio è istituto.local.",
          "Ieri qualcuno ha messo 8.8.8.8 'per far navigare'.",
        ],
      },
    ],
  },
  {
    key: "dhcp-to-printer",
    name: "DHCP → Stampante",
    blurb: "Un lease/scope sbagliato lascia la stampante di rete irraggiungibile.",
    spawnOnMaxGrade: 5,
    steps: [
      {
        nodeLabel: "DHCP scope",
        title: "PC con IP strani dopo il riavvio del server",
        description:
          "Dopo il reboot del server, metà aula ha IP 169.254.x.x. Gli altri navigano ma «lenti». Serve stampare le comunicazioni.",
        category: "RETI_DNS",
        priority: "ALTA",
        difficulty: "INTERMEDIO",
        slaMinutes: 35,
        fakeLogs: [
          {
            name: "ipconfig.txt",
            content:
              "Autoconfiguration IPv4: 169.254.22.10\nSubnet: 255.255.0.0\nDefault Gateway: (blank)\nDHCP Server: (blank)",
          },
        ],
        secretNotes:
          "Causa: servizio DHCP fermo o scope esausto/errato. Fix: avviare DHCP, verificare scope/pool/esclusioni, renew. Non assegnare IP statici a caso su tutti i banchi.",
        clientHints: [
          "Il server DHCP è sulla stessa VLAN dell'aula.",
          "Prima del reboot andava tutto.",
          "Qualcuno ha messo IP fissi su due PC 'per farli andare'.",
        ],
      },
      {
        nodeLabel: "Stampante",
        title: "Stampante di rete non raggiungibile",
        description:
          "La stampante di segreteria non risponde più a 10.20.30.50. I PC con IP statici 'di emergenza' stampano, il resto no. Caos code.",
        category: "HARDWARE",
        priority: "ALTA",
        difficulty: "INTERMEDIO",
        slaMinutes: 30,
        fakeLogs: [
          {
            name: "ping-printer.txt",
            content:
              "Pinging 10.20.30.50\nRequest timed out.\nARP: incomplete\nPrinter web UI: unreachable\nDHCP reservation for printer: MISSING after scope recreate",
          },
        ],
        secretNotes:
          "Causa: ricreando lo scope DHCP è saltata la reservation della stampante / VLAN. Fix: reservation corretta, stesso subnet dei client, coda di stampa, test SNMP/HTTP.",
        clientHints: [
          "L'IP della stampante era riservato sul DHCP.",
          "Hanno 'rifatto lo scope' ieri sera.",
          "Il display della stampante mostra un IP diverso.",
        ],
      },
    ],
  },
  {
    key: "phishing-to-lockout",
    name: "Phishing → Lockout account",
    blurb: "Un click sospetto e password cambiate male finiscono in account bloccati.",
    spawnOnMaxGrade: 5,
    steps: [
      {
        nodeLabel: "Phishing",
        title: "Mail del 'Preside' con link password",
        description:
          "Ho quasi cliccato un link per aggiornare Office 365. Il mittente sembra il preside ma il dominio è strano. È sicuro?",
        category: "SICUREZZA",
        priority: "ALTA",
        difficulty: "INTERMEDIO",
        slaMinutes: 25,
        fakeLogs: [
          {
            name: "headers.txt",
            content:
              "From: preside@istituto-scuola-supporto.ru\nReply-To: helpdesk-reset@mail-secure-login.ru\nSPF: fail\nDKIM: fail\nURL: http://office365-reset-login.ru/...",
          },
        ],
        secretNotes:
          "Phishing: SPF/DKIM fail, dominio spoof. Fix: non cliccare, segnalare, quarantena, awareness. NON far reimpostare password dal link.",
        clientHints: [
          "Il link chiede la password di scuola.",
          "L'indirizzo ha .ru in fondo.",
          "Altri docenti hanno ricevuto la stessa mail.",
        ],
      },
      {
        nodeLabel: "Lockout",
        title: "Account bloccato dopo tentativi password",
        description:
          "Dopo la mail di ieri non entro più: «Account locked out». Qualcuno ha detto di aver 'provato la password del link' più volte.",
        category: "SISTEMI_OPERATIVI",
        priority: "CRITICA",
        difficulty: "BASE",
        slaMinutes: 20,
        fakeLogs: [
          {
            name: "security-event.txt",
            content:
              "Event 4740: Account locked out\nCaller: workstation-AULA3\nBadPwdCount: 5\nSource IP: 10.20.30.88\nNote: password spray after phishing click",
          },
        ],
        secretNotes:
          "Lockout AD da tentativi post-phishing. Fix: sbloccare account, reset password ufficiale, revocare sessioni, ticket correlato al phishing, MFA se disponibile.",
        clientHints: [
          "Ieri ha aperto il link 'per curiosità'.",
          "Ha riprovato la vecchia password tante volte.",
          "Anche Outlook sul telefono chiede login.",
        ],
      },
    ],
  },
];

export function getIncidentChain(key: string | null | undefined) {
  if (!key) return null;
  return INCIDENT_CHAINS.find((c) => c.key === key) ?? null;
}

export function getChainStep(key: string, step: number) {
  const chain = getIncidentChain(key);
  if (!chain) return null;
  return chain.steps[step] ?? null;
}

export function getNextChainStep(key: string, step: number) {
  return getChainStep(key, step + 1);
}

export function listIncidentChains() {
  return INCIDENT_CHAINS.map((c) => ({
    key: c.key,
    name: c.name,
    blurb: c.blurb,
    steps: c.steps.map((s) => s.nodeLabel),
    spawnOnMaxGrade: c.spawnOnMaxGrade,
  }));
}
