import { PrismaClient, Role, TicketCategory, TicketPriority, Difficulty } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  await prisma.gameScore.deleteMany();
  await prisma.evaluation.deleteMany();
  await prisma.ticketComment.deleteMany();
  await prisma.ticketAssignment.deleteMany();
  await prisma.ticket.deleteMany();
  await prisma.classroomMembership.deleteMany();
  await prisma.classroom.deleteMany();
  await prisma.session.deleteMany();
  await prisma.account.deleteMany();
  await prisma.user.deleteMany();

  const passwordHash = await bcrypt.hash("demo1234", 10);

  const teacher = await prisma.user.create({
    data: {
      email: "docente@helpdesklab.it",
      name: "Prof. Laura Bianchi",
      firstName: "Laura",
      lastName: "Bianchi",
      role: Role.TEACHER,
      passwordHash,
      xp: 0,
    },
  });

  const students = await Promise.all(
    [
      { firstName: "Marco", lastName: "Rossi", email: "marco.rossi@studenti.it" },
      { firstName: "Giulia", lastName: "Verdi", email: "giulia.verdi@studenti.it" },
      { firstName: "Luca", lastName: "Neri", email: "luca.neri@studenti.it" },
    ].map((s) =>
      prisma.user.create({
        data: {
          ...s,
          name: `${s.firstName} ${s.lastName}`,
          role: Role.STUDENT,
          passwordHash,
          xp: 50,
        },
      }),
    ),
  );

  const classroom = await prisma.classroom.create({
    data: {
      name: "3ª Operatore Informatico - Lab Reti",
      code: "IT-9482",
      description: "Laboratorio di reti e help desk per la terza superiore.",
      ownerId: teacher.id,
      memberships: {
        create: [
          { userId: teacher.id },
          ...students.map((s) => ({ userId: s.id })),
        ],
      },
    },
  });

  const ticketsData = [
    {
      title: "Conflitto IP in segreteria",
      description:
        "Buongiorno, il PC della segreteria non va più in internet da stamattina. La wifi del telefono funziona, ma sul cavo dice 'connessione limitata'. A volte compare un messaggio strano sull'indirizzo IP. Potete sistemare? Abbiamo urgenza con le iscrizioni!",
      category: TicketCategory.RETI_DNS,
      priority: TicketPriority.ALTA,
      difficulty: Difficulty.INTERMEDIO,
      slaMinutes: 45,
      fakeLogs: JSON.stringify([
        {
          name: "ipconfig.txt",
          content:
            "Scheda Ethernet Ethernet:\n   Indirizzo IPv4. . . . . . . . . . . : 192.168.1.50\n   Subnet mask . . . . . . . . . . . . : 255.255.255.0\n   Gateway predefinito . . . . . . . . : 192.168.1.1\n\nAvviso: Rilevato possibile conflitto indirizzo IP.",
        },
        {
          name: "eventvwr.log",
          content:
            "TCPIP 4199: Il sistema ha rilevato un conflitto di indirizzo IP con il dispositivo 00-1A-2B-3C-4D-5E.",
        },
      ]),
      secretNotes:
        "Causa: due host con IP statico 192.168.1.50 (PC segreteria e stampante multifunzione). Soluzione: assegnare IP libero o DHCP reservation; verificare ARP e lease DHCP.",
      clientHints: JSON.stringify([
        "Ieri il tecnico ha messo in rete una stampante nuova in segreteria.",
        "Sul monitor a volte compare 'Indirizzo IP già in uso'.",
        "Il telefono in wifi naviga senza problemi.",
      ]),
    },
    {
      title: "PC in bootloop dopo aggiornamento",
      description:
        "Il computer dell'aula magna si riavvia da solo in loop. Dice qualcosa di Windows Update e poi schermo nero. Non riesco ad accedere al desktop. Aiuto, c'è una riunione tra un'ora!",
      category: TicketCategory.SISTEMI_OPERATIVI,
      priority: TicketPriority.CRITICA,
      difficulty: Difficulty.AVANZATO,
      slaMinutes: 30,
      fakeLogs: JSON.stringify([
        {
          name: "boot-error.txt",
          content:
            "Recovery\nIl PC non si è avviato correttamente\nCodice: 0xc000021a\nUltimo aggiornamento KB5034441 installato ieri sera.",
        },
      ]),
      secretNotes:
        "Causa: aggiornamento Windows corrotto / driver critico. Soluzione: Avvio avanzato → Risoluzione problemi → Disinstalla aggiornamenti o Ripristino configurazione di sistema; in alternativa SFC/DISM da WinRE.",
      clientHints: JSON.stringify([
        "Ieri sera ha fatto 'Aggiorna e spegni'.",
        "Se premo F8 / Shift+Riavvia riesco a vedere le opzioni di ripristino.",
        "Non abbiamo fatto backup recenti del profilo.",
      ]),
    },
    {
      title: "Stampante di rete non raggiungibile",
      description:
        "La stampante HP del corridoio non stampa più. Dal PC dice offline. Io l'ho anche spenta e riaccesa. Prima funzionava. Serve stampare le circolari!",
      category: TicketCategory.RETI_DNS,
      priority: TicketPriority.MEDIA,
      difficulty: Difficulty.BASE,
      slaMinutes: 60,
      fakeLogs: JSON.stringify([
        {
          name: "ping-printer.txt",
          content:
            "Esecuzione di Ping 192.168.1.210 con 32 byte di dati:\nRichiesta scaduta.\nRichiesta scaduta.\nStatistiche Ping: Pacchetti: inviati = 4, ricevuti = 0, persi = 4 (100% perdita)",
        },
      ]),
      secretNotes:
        "Causa: stampante su VLAN/guest errata oppure IP cambiato via DHCP. Soluzione: verificare cavo/link, IP attuale sul pannello, coda di stampa, driver e porta TCP 9100/IPP.",
      clientHints: JSON.stringify([
        "Il display della stampante mostra un IP diverso da quello di prima.",
        "Altri PC nello stesso ufficio hanno lo stesso problema.",
        "Il cavo arancione del muro è stato spostato ieri.",
      ]),
    },
    {
      title: "Phishing sospetto su mail aziendale",
      description:
        "Ho ricevuto una mail dal 'Preside' che chiede di cliccare un link per aggiornare la password Office 365 entro oggi, altrimenti chiudono l'account. Il link sembra strano. Ho quasi cliccato... è sicuro?",
      category: TicketCategory.SICUREZZA,
      priority: TicketPriority.ALTA,
      difficulty: Difficulty.INTERMEDIO,
      slaMinutes: 40,
      fakeLogs: JSON.stringify([
        {
          name: "email-headers.txt",
          content:
            "From: preside@istituto-scuola-supporto.ru\nReply-To: helpdesk-reset@mail-secure-login.ru\nSubject: URGENTE: Conferma password Office 365\nSPF: fail\nDKIM: fail",
        },
      ]),
      secretNotes:
        "Causa: campagna phishing (spoofing dominio). Soluzione: non cliccare, segnalare come phishing, resettare se credenziali inserite, bloccare mittente, sensibilizzare la classe su SPF/DKIM e URL.",
      clientHints: JSON.stringify([
        "Il dominio non è quello della scuola.",
        "C'è un senso di urgenza e minaccia di blocco account.",
        "Passando il mouse sul link l'URL è diverso dal testo visualizzato.",
      ]),
    },
    {
      title: "PC lento e surriscaldamento",
      description:
        "Il portatile dell'insegnante di matematica è lentissimo, le ventole urlano e a volte si spegne da solo. Dice che è pieno di polvere forse? Non so. Serve per la verifica di domani.",
      category: TicketCategory.HARDWARE,
      priority: TicketPriority.MEDIA,
      difficulty: Difficulty.BASE,
      slaMinutes: 90,
      fakeLogs: JSON.stringify([
        {
          name: "hwmonitor.txt",
          content:
            "CPU Package: 97°C\nGPU: 89°C\nClock throttling: YES\nProcessi top: chrome.exe, Teams.exe, SearchIndexer",
        },
      ]),
      secretNotes:
        "Causa: dissipatore ostruito + paste termica esausta + troppi processi. Soluzione: pulizia ventole, ripasta, controllo alimentazione, disinstallare startup inutili, base di raffreddamento temporanea.",
      clientHints: JSON.stringify([
        "Il PC è caldo sulla tastiera sinistra.",
        "Non viene pulito da almeno due anni.",
        "Si spegne soprattutto quando apre Excel con file grandi.",
      ]),
    },
  ];

  for (const t of ticketsData) {
    const ticket = await prisma.ticket.create({
      data: {
        ...t,
        classroomId: classroom.id,
        createdById: teacher.id,
        attachmentsMeta: JSON.stringify([{ name: "screenshot-cliente.png", type: "image/png" }]),
      },
    });

    await prisma.ticketAssignment.createMany({
      data: students.map((s) => ({
        ticketId: ticket.id,
        assigneeId: s.id,
      })),
    });
  }

  console.log("Seed completato.");
  console.log("Docente: docente@helpdesklab.it / demo1234");
  console.log("Studenti: Codice Classe IT-9482 + Nome/Cognome (es. Marco Rossi)");
  console.log("Oppure login email studente / demo1234");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
