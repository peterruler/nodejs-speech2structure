export const legalVersion = "2026-10-14.3";
export const legalSections = [
  {
    title: "Demo-Zweck und Medizinprodukte",
    text: "Diese experimentelle Software ist ausschließlich für Demonstration, Lernen und Entwicklung mit fiktiven Daten bestimmt. Sie ist nicht als Medizinprodukt zur Anwendung am Menschen bestimmt, nicht klinisch validiert und nicht für Diagnose-, Therapie-, Triage- oder andere medizinische Entscheidungen freigegeben. Eine Zertifizierung oder Konformität nach EU-MDR, deutschem Medizinprodukterecht oder Schweizer Heilmittel- und Medizinprodukterecht wird nicht zugesichert. Die rechtliche Einstufung hängt von Zweckbestimmung, Funktionen und tatsächlicher Bereitstellung ab; ein Disclaimer allein verhindert die Einstufung als Medizinprodukt nicht.",
  },
  {
    title: "Grenzen der Diagnosehinweise",
    text: "Diktierte Diagnosen werden lediglich aus Text extrahiert. Eine zweite OpenAI-Abfrage erstellt aus strukturierten Vitalwerten, Symptomen und weiteren Befunden unbestätigte Verdachts- und Differenzialdiagnosen. Diese KI-Vermutungen und Dringlichkeitshinweise sind keine validierten Diagnose- oder Triageverfahren und keine vollständige Erkennung von Notfällen. Auch ein fehlender Treffer schließt keine Erkrankung aus. KI-Ausgaben können falsche, unvollständige oder irreführende Ergebnisse liefern. Es entsteht kein Behandlungsverhältnis; keine Selbstdiagnose, Änderung von Medikamenten oder Verzögerung einer Behandlung auf Grundlage dieser Anwendung.",
  },
  {
    title: "Notfälle",
    text: "Bei tatsächlichen akuten oder lebensbedrohlichen Beschwerden sofort professionelle Hilfe kontaktieren: Deutschland 112, Schweiz Sanitätsnotruf 144. Die Anwendung ist kein Notfalldienst, wird nicht medizinisch überwacht und ersetzt keine ärztliche Untersuchung.",
  },
  {
    title: "Datenschutz und Übermittlung an OpenAI",
    text: "Keine realen Namen, Patientenakten, Gesundheitsdaten oder Aufnahmen anderer Personen eingeben. Bei Audio- oder Textauswertung werden die übermittelten Inhalte über den Node.js-Server an die OpenAI API gesendet. Für Verdachtsdiagnosen werden anschließend die strukturierten klinischen Angaben in einer zweiten Anfrage an OpenAI übermittelt, ohne Vor- und Nachnamen. Dabei entstehen zusätzliche API-Kosten. Die Oberfläche zeigt auch die zugehörigen Originalzitate. Der Anwendungscode speichert Audio nicht auf Festplatte und protokolliert keine Transkripte; Ergebnisse verbleiben bis zum Neuladen im Arbeitsspeicher des Browsers. JSON-Exporte werden als lokale Datei gespeichert. Infrastruktur und API-Anbieter können eigene Protokollierung und Aufbewahrung haben. store:false garantiert weder Zero Data Retention noch Verarbeitung ausschließlich in Deutschland, der EU oder der Schweiz. Verarbeitung in Drittländern, einschließlich der USA, ist je nach Anbieter-Konfiguration möglich. Es werden keine EU-/Schweizer Datenresidenz und keine DSGVO-/DSG-Konformität zugesichert.",
  },
  {
    title: "Pflichten eines Betreibers in Deutschland und der Schweiz",
    text: "Vor einer öffentlichen Bereitstellung oder Verarbeitung realer Daten sind Zweckbestimmung und regulatorische Pflichten sowie Datenschutz gesondert zu prüfen. Dazu gehören je nach Einsatz Rechtsgrundlagen und besondere Anforderungen für Gesundheitsdaten, berufliche Schweigepflichten, Auftragsverarbeitung, internationale Datentransfers, Informationspflichten, Zugriffsschutz, Löschfristen und gegebenenfalls eine Datenschutz-Folgenabschätzung. Betreiber müssen eigene zutreffende Anbieter-/Kontaktangaben, ein gegebenenfalls erforderliches Impressum und eine auf den tatsächlichen Betrieb abgestimmte Datenschutzerklärung bereitstellen. Diese Demo-Seite ersetzt diese Angaben und Prüfungen nicht. Das Kenntnisnehmen dieses Hinweises ist keine Einwilligung zur Verarbeitung realer Gesundheitsdaten.",
  },
  {
    title: "MIT-Lizenz, Gewährleistung und Haftung",
    text: "Der Quellcode wird unter der MIT-Lizenz bereitgestellt; der vollständige Lizenztext ist unten verlinkt. Die Software wird im gesetzlich zulässigen Umfang ohne zugesicherte Eigenschaften oder Gewährleistung bereitgestellt. Zwingende gesetzliche Ansprüche und Haftung bleiben unberührt, insbesondere für Vorsatz, grobe Fahrlässigkeit und schuldhafte Verletzungen von Leben, Körper oder Gesundheit sowie nach zwingendem Produkthaftungsrecht. Ein pauschaler Haftungsverzicht wird nicht verlangt. Die Softwarelizenz stellt weder eine medizinische Freigabe noch eine datenschutzrechtliche oder regulatorische Genehmigung dar. Diese Hinweise sind keine individuelle Rechtsberatung und garantieren keine vollständige rechtliche Absicherung.",
  },
] as const;
export const legalSources = [
  [
    "BfArM · Rechtlicher Status und Klassifizierung",
    "https://www.bfarm.de/DE/Medizinprodukte/Aufgaben/Feststellung-rechtlicher-Status-und-Klassifizierung/_node.html",
  ],
  [
    "Swissmedic · Medizinische Zweckbestimmung",
    "https://www.swissmedic.ch/swissmedic/de/home/services/delimitation/humanbereich.html",
  ],
  [
    "DSGVO · insbesondere Artikel 9, 13, 28, 35 und 44 ff.",
    "https://eur-lex.europa.eu/eli/reg/2016/679/oj?locale=de",
  ],
  [
    "EDÖB · Bekanntgabe von Personendaten ins Ausland",
    "https://www.edoeb.admin.ch/de/bekanntgabe-von-personendaten-ins-ausland",
  ],
  [
    "Deutschland · § 309 BGB",
    "https://www.gesetze-im-internet.de/bgb/__309.html",
  ],
  [
    "Schweiz · Obligationenrecht, Artikel 100",
    "https://www.fedlex.admin.ch/eli/cc/27/317_321_377/de",
  ],
  [
    "BBK · Notfallvorsorge und Notruf 112",
    "https://www.bbk.bund.de/SharedDocs/Downloads/DE/Mediathek/Publikationen/Buergerinformationen/Ratgeber/ratgeber-notfallvorsorge.pdf?__blob=publicationFile",
  ],
  [
    "BABS · Notfallplan und Sanitätsnotruf 144",
    "https://www.babs.admin.ch/dam/de/sd-web/oJLzuJoq2T-3/Emergency%20plan_A4_DE.pdf",
  ],
] as const;
