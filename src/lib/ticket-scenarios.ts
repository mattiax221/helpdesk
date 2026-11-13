import type { GeneratedTicket } from "@/lib/ai-types";

export const TICKET_SCENARIOS: GeneratedTicket[] = [
  {
    title: "DNS interno non risolve i nomi",
    description:
      "I PC dell'aula non aprono i siti per nome, ma a volte con l'IP sì. Chrome: DNS_PROBE_FINISHED_NXDOMAIN. Lezione tra 10 minuti!",
    category: "RETI_DNS",
    priority: "ALTA",
    difficulty: "INTERMEDIO",
    slaMinutes: 40,
    fakeLogs: [
      {
        name: "nslookup.txt",
        content:
          "> nslookup www.google.com\nServer: UnKnown\nAddress: 192.168.1.1\n*** Server failed",
      },
    ],
    secretNotes:
      "Causa: DNS router/AD irraggiungibile o cache corrotta. Fix: forwarder, flushdns, test 1.1.1.1, porta 53.",
    clientHints: [
      "Ieri hanno cambiato il router del laboratorio.",
      "Con IP numerico alcuni servizi rispondono.",
      "Il telefono in 4G naviga ok.",
    ],
  },
  {
    title: "Gateway sbagliato dopo imaging PC",
    description:
      "Il portatile nuovo non va in internet. Dice connesso ma pagine bianche. L'hanno clonato ieri dal master.",
    category: "RETI_DNS",
    priority: "ALTA",
    difficulty: "BASE",
    slaMinutes: 30,
    fakeLogs: [
      {
        name: "ipconfig.txt",
        content:
          "IPv4: 10.20.30.55\nMask: 255.255.255.0\nGateway: 192.168.0.1\nDNS: 10.20.30.1",
      },
    ],
    secretNotes:
      "Causa: gateway residuo dell'immagine (subnet diversa). Fix: gateway 10.20.30.1 o DHCP corretto, sysprep/imaging checklist.",
    clientHints: [
      "Il master era di un'altra sede.",
      "Ping al gateway attuale fallisce.",
      "Gli altri PC nuovi della stessa aula funzionano.",
    ],
  },
  {
    title: "Wi‑Fi scuola: connesso senza navigare",
    description:
      "Il tablet si aggancia alla SSID 'ITIS-DOC', ma Instagram non carica. Dice comunque 'connesso'.",
    category: "RETI_DNS",
    priority: "MEDIA",
    difficulty: "INTERMEDIO",
    slaMinutes: 45,
    fakeLogs: [
      {
        name: "wifi-status.txt",
        content:
          "SSID: ITIS-DOC\nSignal: 78%\nIPv4: 172.16.5.88\nGateway: 172.16.5.1\nCaptive portal: DETECTED (pending)",
      },
    ],
    secretNotes:
      "Causa: captive portal non completato / ACL guest. Fix: aprire portale, autenticazione 802.1X, VLAN corretta.",
    clientHints: [
      "A volte compare una pagina di login che chiudo subito.",
      "Con i dati mobili funziona.",
      "I PC cablati navigano.",
    ],
  },
  {
    title: "Switch aula: metà banchi offline",
    description:
      "Dal banco 1 al 12 internet morto, gli altri ok. Abbiamo spostato uno switch ieri.",
    category: "RETI_DNS",
    priority: "CRITICA",
    difficulty: "AVANZATO",
    slaMinutes: 25,
    fakeLogs: [
      {
        name: "switch-log.txt",
        content:
          "Gi1/0/1-12: err-disabled (loopback)\nSTP: topology change\nUplink Gi1/0/24: up",
      },
    ],
    secretNotes:
      "Causa: loop / err-disable su porte. Fix: rimuovere cavo loop, shutdown/no shut, verificare STP e uplink.",
    clientHints: [
      "C'è un cavo che va da switch a switch 'per sicurezza'.",
      "I LED arancioni lampeggiano strani.",
      "Prima dello spostamento andava tutto.",
    ],
  },
  {
    title: "VPN docenti non connette da casa",
    description:
      "Dal portatile di casa la VPN della scuola resta su 'Connecting…' e poi timeout. Serve per i registri.",
    category: "RETI_DNS",
    priority: "ALTA",
    difficulty: "AVANZATO",
    slaMinutes: 50,
    fakeLogs: [
      {
        name: "vpn-client.log",
        content:
          "IKEv2: SA_INIT timeout\nUDP 500/4500 blocked?\nServer: vpn.istituto.edu\nError 809",
      },
    ],
    secretNotes:
      "Causa: ISP/firewall casa blocca UDP 500/4500 o certificato scaduto. Fix: prova rete diversa, aprire porte, rinnovare cert, fallback SSTP.",
    clientHints: [
      "In hotel funzionava la settimana scorsa.",
      "Il modem casa ha 'SPI firewall' attivo.",
      "Altri docenti TIM hanno lo stesso problema.",
    ],
  },
  {
    title: "Stampante di rete offline a intermittenza",
    description:
      "La HP del corridoio a volte stampa, a volte offline. Serve per le circolari del preside!",
    category: "RETI_DNS",
    priority: "MEDIA",
    difficulty: "INTERMEDIO",
    slaMinutes: 55,
    fakeLogs: [
      {
        name: "ping-printer.txt",
        content:
          "Ping 192.168.1.210: 0% loss, poi 100% loss a raffiche\nTTL inconsistente",
      },
    ],
    secretNotes:
      "Causa: IP DHCP che cambia / conflitto o cavo flaky. Fix: reservation DHCP, cavo Cat6, porta fissa, coda spooler.",
    clientHints: [
      "Il display mostra IP diversi in momenti diversi.",
      "Muovendo il cavo a volte riparte.",
      "Due PC hanno la stampante con IP vecchio.",
    ],
  },
  {
    title: "Proxy scolastico blocca GitHub Classroom",
    description:
      "Gli studenti non clonanorepo da GitHub. Dice proxy error. Serve per il progetto di Sistemi.",
    category: "RETI_DNS",
    priority: "ALTA",
    difficulty: "AVANZATO",
    slaMinutes: 40,
    fakeLogs: [
      {
        name: "git-clone.txt",
        content:
          "fatal: unable to access 'https://github.com/...'\nReceived HTTP code 403 from proxy after CONNECT",
      },
    ],
    secretNotes:
      "Causa: categoria developer bloccata sul proxy/firewall. Fix: allowlist github.com/githubusercontent, bypass lab VLAN, git config proxy.",
    clientHints: [
      "YouTube a volte passa, GitHub no.",
      "Con hotspot del telefono clona subito.",
      "Il filtro contenuti è stato aggiornato ieri.",
    ],
  },
  {
    title: "PC in bootloop dopo Windows Update",
    description:
      "Si riavvia in loop, schermo nero, Recovery 0xc000021a. Riunione tra un'ora!",
    category: "SISTEMI_OPERATIVI",
    priority: "CRITICA",
    difficulty: "AVANZATO",
    slaMinutes: 30,
    fakeLogs: [
      {
        name: "boot-error.txt",
        content: "0xc000021a\nUltimo update KB5034441\nWinRE disponibile",
      },
    ],
    secretNotes:
      "Causa: update corrotto. Fix: WinRE → disinstalla aggiornamenti / restore point; SFC/DISM.",
    clientHints: [
      "Ieri 'Aggiorna e spegni'.",
      "Shift+Riavvia mostra opzioni ripristino.",
      "Niente backup profilo recente.",
    ],
  },
  {
    title: "Profilo utente temporaneo al login",
    description:
      "Entro e non trovo Desktop/Documenti. Dice 'profilo temporaneo'. Tutti i miei file?!",
    category: "SISTEMI_OPERATIVI",
    priority: "ALTA",
    difficulty: "INTERMEDIO",
    slaMinutes: 45,
    fakeLogs: [
      {
        name: "profile-event.txt",
        content:
          "Event 1511: Windows cannot find the local profile\nUser: STUDENTI\\gverdi\nTemp profile loaded",
      },
    ],
    secretNotes:
      "Causa: profilo locale corrotto / .bak registry ProfileList. Fix: backup NTUSER, rimuovere .bak, ricreare profilo, verificare quota.",
    clientHints: [
      "Ieri il PC si è spento di colpo.",
      "Lo spazio su C: era quasi pieno.",
      "Un altro account sullo stesso PC funziona.",
    ],
  },
  {
    title: "BitLocker chiede recovery key a sorpresa",
    description:
      "All'accensione chiede una chiave lunghissima. Non l'abbiamo mai vista. Lab bloccato.",
    category: "SISTEMI_OPERATIVI",
    priority: "CRITICA",
    difficulty: "AVANZATO",
    slaMinutes: 35,
    fakeLogs: [
      {
        name: "bitlocker.txt",
        content:
          "BitLocker recovery console\nDevice encryption: On\nTPM PCR change detected after BIOS update",
      },
    ],
    secretNotes:
      "Causa: update BIOS/TPM PCR. Fix: recovery key da Azure AD/AD MBAM, sospendere BitLocker prima di update firmware.",
    clientHints: [
      "Ieri il tecnico ha aggiornato il BIOS.",
      "Le chiavi dovrebbero essere su account scuola.",
      "Il PC è Azure AD joined.",
    ],
  },
  {
    title: "Servizio Spooler stampanti crasha",
    description:
      "Non esce nulla da nessuna stampante del lab. Il servizio 'si spegne da solo'.",
    category: "SISTEMI_OPERATIVI",
    priority: "ALTA",
    difficulty: "INTERMEDIO",
    slaMinutes: 40,
    fakeLogs: [
      {
        name: "spooler-crash.txt",
        content:
          "Service Spooler terminated unexpectedly\nFaulting module: oemprint.dll\nQueue: C:\\Windows\\System32\\spool\\PRINTERS full",
      },
    ],
    secretNotes:
      "Causa: driver/coda corrotta. Fix: stop spooler, svuotare PRINTERS, rimuovere driver OEM, riavviare servizio.",
    clientHints: [
      "Hanno installato una stampante 'universale' ieri.",
      "Ci sono decine di lavori bloccati.",
      "Riavviare il servizio dura 10 secondi poi ricade.",
    ],
  },
  {
    title: "Task Manager disabilitato da policy",
    description:
      "CTRL+ALT+CANC non apre Task Manager. Dice 'disabilitato dall'amministratore'. Un processo mangia CPU.",
    category: "SISTEMI_OPERATIVI",
    priority: "MEDIA",
    difficulty: "BASE",
    slaMinutes: 35,
    fakeLogs: [
      {
        name: "gpo.txt",
        content:
          "User Configuration\\Admin Templates\\System\\Ctrl+Alt+Del Options\\Remove Task Manager = Enabled",
      },
    ],
    secretNotes:
      "Causa: GPO/registry DisableTaskMgr. Fix: policy corretta OU studenti, gpupdate, registry HKCU.",
    clientHints: [
      "È iniziato dopo il login di oggi.",
      "In aula magna funziona.",
      "Il PC è nel dominio scuola.",
    ],
  },
  {
    title: "Licenza Office scaduta in aula docente",
    description:
      "Word ha la barra rossa e non salva. Serve per la verifica di domani!",
    category: "SOFTWARE_OFFICE",
    priority: "MEDIA",
    difficulty: "BASE",
    slaMinutes: 50,
    fakeLogs: [
      {
        name: "office-activation.txt",
        content: "0x80070005\nSubscription expired\nAccount: scuola@istituto.it",
      },
    ],
    secretNotes:
      "Causa: M365 scaduto/profilo corrotto. Fix: rinnovo tenant, rimuovere account, Quick Repair.",
    clientHints: [
      "Dopo le vacanze.",
      "Outlook chiede password in loop.",
      "Altri account docenti ok.",
    ],
  },
  {
    title: "Excel file corrotto non si apre",
    description:
      "Il registro voti.xlsx non si apre: 'formato non valido'. Panico totale.",
    category: "SOFTWARE_OFFICE",
    priority: "CRITICA",
    difficulty: "INTERMEDIO",
    slaMinutes: 25,
    fakeLogs: [
      {
        name: "excel-error.txt",
        content:
          "Excel cannot open the file because the file format or extension is not valid\nSize: 0 KB? No, 2.1 MB\nOneDrive sync: conflict",
      },
    ],
    secretNotes:
      "Causa: sync conflict/corruzione. Fix: version history OneDrive, Open and Repair, recovery TMP, backup .xlsb.",
    clientHints: [
      "Lavorava da due PC diversi.",
      "OneDrive aveva icona di conflitto.",
      "Esiste una copia 'registro voti (1).xlsx'.",
    ],
  },
  {
    title: "Teams non sente il microfono in Dad",
    description:
      "In riunione non mi sentono. Il microfono nelle Impostazioni sembra ok. Lezione online tra 5 minuti.",
    category: "SOFTWARE_OFFICE",
    priority: "ALTA",
    difficulty: "BASE",
    slaMinutes: 20,
    fakeLogs: [
      {
        name: "teams-devices.txt",
        content:
          "Teams mic: Headset (Logi)\nWindows default: Realtek Digital Output\nPrivacy Mic: Allowed for desktop apps = Off",
      },
    ],
    secretNotes:
      "Causa: privacy mic / device mismatch. Fix: privacy Windows, default input, permesso Teams, disabilitare exclusive mode.",
    clientHints: [
      "Zoom invece funziona.",
      "Dopo un update Windows.",
      "Il LED del microfono cuffie è acceso.",
    ],
  },
  {
    title: "Add-in Outlook blocca l'avvio",
    description:
      "Outlook resta su schermata splash 10 minuti. A volte parte in modalità provvisoria.",
    category: "SOFTWARE_OFFICE",
    priority: "MEDIA",
    difficulty: "INTERMEDIO",
    slaMinutes: 40,
    fakeLogs: [
      {
        name: "outlook-safe.txt",
        content:
          "Safe mode: OK\nAdd-in: iCloud Outlook Add-in (crashed)\nEvent: outlook.exe hang",
      },
    ],
    secretNotes:
      "Causa: add-in difettoso. Fix: COM add-ins disable, avvio /safe, riparazione Office, profilo nuovo se serve.",
    clientHints: [
      "Hanno installato iCloud per Windows ieri.",
      "In safe mode apre subito.",
      "La posta web funziona.",
    ],
  },
  {
    title: "Phishing 'URGENTE password Office'",
    description:
      "Mail del 'Preside' chiede di cliccare un link entro oggi o chiudono l'account. Ho quasi cliccato.",
    category: "SICUREZZA",
    priority: "ALTA",
    difficulty: "INTERMEDIO",
    slaMinutes: 40,
    fakeLogs: [
      {
        name: "email-headers.txt",
        content:
          "From: preside@istituto-supporto.ru\nSPF: fail\nDKIM: fail\nURL: login-office365-reset.ru",
      },
    ],
    secretNotes:
      "Phishing spoofing. Fix: non cliccare, segnalare, reset se credenziali inserite, bloccare mittente, formazione SPF/DKIM.",
    clientHints: [
      "Dominio diverso dalla scuola.",
      "Tono minaccioso/urgente.",
      "URL diverso dal testo del link.",
    ],
  },
  {
    title: "USB con autorun sospetto",
    description:
      "Ho trovato una chiavetta in aula. Aprendo c'è 'apri_voti.exe'. L'antivirus non ha detto nulla… ancora.",
    category: "SICUREZZA",
    priority: "CRITICA",
    difficulty: "AVANZATO",
    slaMinutes: 30,
    fakeLogs: [
      {
        name: "defender.txt",
        content:
          "Threat: Trojan:Win32/Wacatac.B!ml\nPath: E:\\apri_voti.exe\nAction: Quarantine pending\nPersistence: Run key HKCU",
      },
    ],
    secretNotes:
      "Malware USB. Fix: isolare host, full scan, rimuovere Run key, reset password, educare a non usare USB sconosciute.",
    clientHints: [
      "Il PC era lento dopo l'inserimento.",
      "Compare una cartella 'System32' sulla chiavetta.",
      "Un'icona strana in system tray.",
    ],
  },
  {
    title: "Account AD bloccato (BadPwdCount)",
    description:
      "Non entro in lab: account bloccato. Lezione tra 10 minuti!",
    category: "SICUREZZA",
    priority: "CRITICA",
    difficulty: "INTERMEDIO",
    slaMinutes: 20,
    fakeLogs: [
      {
        name: "security-event.txt",
        content: "Event 4740 lockout\nCaller: LAB-PC-12\nBadPwdCount: 5",
      },
    ],
    secretNotes:
      "Lockout policy. Fix: unlock AD, layout tastiera, escludere credential stuffing, password manager.",
    clientHints: [
      "Tastiera su EN.",
      "Qualcuno ha provato prima sul PC.",
      "Blocco temporaneo.",
    ],
  },
  {
    title: "Ransomware note su Desktop condiviso",
    description:
      "Su \\\\server\\condivisa compare README_UNLOCK.txt e file .locked. Aiuto!!!!",
    category: "SICUREZZA",
    priority: "CRITICA",
    difficulty: "AVANZATO",
    slaMinutes: 20,
    fakeLogs: [
      {
        name: "share-listing.txt",
        content:
          "verbale.docx.locked\nREADME_UNLOCK.txt\nProcess: suspicious.exe from student PC-07",
      },
    ],
    secretNotes:
      "Incidente ransomware. Fix: isolare PC-07 e share, snapshot/backup restore, non pagare, IR playbook, audit permessi.",
    clientHints: [
      "È partito da un PC studenti.",
      "Ieri sera c'erano backup notturni.",
      "Il file README chiede Bitcoin.",
    ],
  },
  {
    title: "PC lento e surriscaldamento",
    description:
      "Ventole urlano, si spegne da solo. Serve per la verifica di matematica.",
    category: "HARDWARE",
    priority: "MEDIA",
    difficulty: "BASE",
    slaMinutes: 90,
    fakeLogs: [
      {
        name: "hwmonitor.txt",
        content: "CPU 97°C\nThrottling YES\nTop: chrome, Teams, SearchIndexer",
      },
    ],
    secretNotes:
      "Polvere/pasta termica. Fix: pulizia, ripasta, base cooling, startup cleanup.",
    clientHints: [
      "Caldo a sinistra sulla tastiera.",
      "Mai pulito in 2 anni.",
      "Si spegne con Excel pesanti.",
    ],
  },
  {
    title: "Monitor dual: secondo schermo nero",
    description:
      "L'HDMI del proiettore non dà segnale. Cavo nuovo, PC acceso. Interrogazioni in aula magna.",
    category: "HARDWARE",
    priority: "ALTA",
    difficulty: "BASE",
    slaMinutes: 25,
    fakeLogs: [
      {
        name: "display.txt",
        content:
          "Displays: 1 active (eDP)\nHDMI: connected but inactive\nGPU driver: Microsoft Basic Display",
      },
    ],
    secretNotes:
      "Driver GPU / proiezione. Fix: Win+P, reinstall driver vendor, cavo/ingresso, risoluzione nativa.",
    clientHints: [
      "Dopo un restore Windows.",
      "Il monitor dice 'no signal'.",
      "Con un altro portatile funziona.",
    ],
  },
  {
    title: "SSD al 100% e PC inutilizzabile",
    description:
      "Tutto freeza. Task Manager mostra Disco 100% fisso. Nemmeno Chrome apre.",
    category: "HARDWARE",
    priority: "ALTA",
    difficulty: "INTERMEDIO",
    slaMinutes: 45,
    fakeLogs: [
      {
        name: "disk.txt",
        content:
          "Disk 0 SSD SMART: Reallocated sectors rising\nSysMain/Superfetch high\nFree space: 3 GB",
      },
    ],
    secretNotes:
      "SSD degradato/spazio. Fix: liberare spazio, disabilitare indexing temporaneo, backup, sostituire SSD, controllare SMART.",
    clientHints: [
      "Rumori strani? No, è SSD.",
      "C: quasi pieno di video.",
      "A volte compaiono BSOD UNEXPECTED_STORE_EXCEPTION.",
    ],
  },
  {
    title: "Tastiera scrive numeri a caso (NumLock)",
    description:
      "Scrivendo escono numeri al posto delle lettere. La studentessa dice che la tastiera è stregata.",
    category: "HARDWARE",
    priority: "BASSA",
    difficulty: "BASE",
    slaMinutes: 15,
    fakeLogs: [
      {
        name: "keyboard.txt",
        content: "NumLock: ON\nLayout: IT\nDevice: Standard PS/2 / Laptop overlay",
      },
    ],
    secretNotes:
      "NumLock su tastierino embedded. Fix: Fn+NumLock, disabilitare mouse keys, layout IT.",
    clientHints: [
      "Succede soprattutto con Fn.",
      "Il LED NumLock è acceso.",
      "Mouse keys forse attivati.",
    ],
  },
  {
    title: "Alimentatore portatile: carica solo spento",
    description:
      "Se lo uso acceso la batteria scende comunque. Spento invece carica. Consegna tesina a rischio.",
    category: "HARDWARE",
    priority: "MEDIA",
    difficulty: "INTERMEDIO",
    slaMinutes: 50,
    fakeLogs: [
      {
        name: "powercfg.txt",
        content:
          "Wattage adapter: 45W\nSystem load: 65W peak\nBattery wear: 78% capacity",
      },
    ],
    secretNotes:
      "Causa: alimentatore sottodimensionato/usura batteria. Fix: PSU originale watt corretti, batteria, power plan.",
    clientHints: [
      "Usano un caricatore generico da 45W.",
      "Il modello richiede 90W.",
      "La spina scende se si muove il cavo.",
    ],
  },
  {
    title: "Conflitto IP in segreteria",
    description:
      "PC segreteria 'connessione limitata'. Telefono wifi ok. Iscrizioni urgenti!",
    category: "RETI_DNS",
    priority: "ALTA",
    difficulty: "INTERMEDIO",
    slaMinutes: 45,
    fakeLogs: [
      {
        name: "ipconfig.txt",
        content:
          "IPv4 192.168.1.50\nAvviso conflitto IP\nTCPIP 4199 MAC 00-1A-2B-3C-4D-5E",
      },
    ],
    secretNotes:
      "Doppio host 192.168.1.50. Fix: IP libero/DHCP reservation, ARP check.",
    clientHints: [
      "Nuova stampante ieri.",
      "Messaggio IP già in uso.",
      "Wifi telefono ok.",
    ],
  },
  {
    title: "DHCP esaurito in laboratorio",
    description:
      "I portatile BYOD non prendono IP: APIPA 169.254.x.x. Solo alcuni PC fissi navigano.",
    category: "RETI_DNS",
    priority: "ALTA",
    difficulty: "AVANZATO",
    slaMinutes: 35,
    fakeLogs: [
      {
        name: "ipconfig-all.txt",
        content:
          "Autoconfiguration IPv4: 169.254.23.11\nDHCP Server: not available\nLease pool: 0 free (scope /24)",
      },
    ],
    secretNotes:
      "Scope DHCP pieno / server down. Fix: ampliare scope/VLAN, rilasciare lease zombie, verificare DHCP service.",
    clientHints: [
      "Oggi ci sono tanti ospiti al open day.",
      "I PC con IP statico funzionano.",
      "Il server DHCP è su una VM spenta?",
    ],
  },
  {
    title: "Clock Windows avanti di 3 ore: certificati KO",
    description:
      "Siti HTTPS in errore, Teams non entra. L'orologio del PC segna 2029.",
    category: "SISTEMI_OPERATIVI",
    priority: "ALTA",
    difficulty: "BASE",
    slaMinutes: 25,
    fakeLogs: [
      {
        name: "time.txt",
        content:
          "Local time: 2029-04-01\nw32tm: NTP source unreachable\nTLS errors everywhere",
      },
    ],
    secretNotes:
      "Orologio/CMOS/NTP. Fix: impostare ora, batteria CMOS, w32tm /resync, GPO time sync.",
    clientHints: [
      "Dopo essere rimasto scarico una settimana.",
      "Anche la data del BIOS è sbagliata.",
      "I certificati 'non sono ancora validi'.",
    ],
  },
  {
    title: "OneDrive mangia tutto lo spazio C:",
    description:
      "C: pieno di file 'Online only' che però occupano spazio. Non capisco.",
    category: "SOFTWARE_OFFICE",
    priority: "MEDIA",
    difficulty: "INTERMEDIO",
    slaMinutes: 40,
    fakeLogs: [
      {
        name: "onedrive.txt",
        content:
          "Files On-Demand: partially disabled\nKnown Folder Move: Desktop/Documents\nCache: 48 GB",
      },
    ],
    secretNotes:
      "Files On-Demand off / cache. Fix: abilitare on-demand, Free up space, spostare grandi file, storage sense.",
    clientHints: [
      "Hanno cliccato 'Disponibile sempre offline' su tutto.",
      "Desktop pieno di video 4K.",
      "OneDrive icona rossa.",
    ],
  },
  {
    title: "Firewall Windows blocca SQL Server lab",
    description:
      "L'app gestionale non raggiunge il database in aula. 'Network path not found'.",
    category: "SICUREZZA",
    priority: "ALTA",
    difficulty: "AVANZATO",
    slaMinutes: 45,
    fakeLogs: [
      {
        name: "sql-conn.txt",
        content:
          "Server=LAB-SQL\\SQLEXPRESS,1433\nError 10060 timeout\nFirewall profile: Public on NIC",
      },
    ],
    secretNotes:
      "Firewall / profilo rete Public. Fix: regola 1433/1434, profilo Private, SQL Browser, connection string.",
    clientHints: [
      "Ping al server funziona.",
      "Da localhost sul server l'app va.",
      "La NIC è stata ripristinata ieri.",
    ],
  },
];
