import type { CssrRow } from "./types";

/** Liste des PDF transcrits, avec le département et la date de MAJ de chacun. */
export const SOURCES = [
  { dept: "01", pdf: "2. Liste internet centres de sensibilisation sécurité routière V12072024.pdf", label: "DDT Ain", maj: "07/04/2026" },
  { dept: "2B", pdf: "Centres de récupération de point Permis Août 2023.pdf", label: "DDT Haute-Corse", maj: "05/2025" },
  { dept: "12", pdf: "liste_organismesrecuppointscssr_aveyron_2023.pdf", label: "Préfecture Aveyron", maj: "16/02/2023" },
  { dept: "14", pdf: "La liste des centres de stages de récupération de points.pdf", label: "DDTM Calvados", maj: "06/06/2018" },
  { dept: "26", pdf: "Liste_CSSR (MAJ 12 01 2026).pdf", label: "Sous-préfecture de Die (Drôme)", maj: "12/01/2026" },
  { dept: "33", pdf: "liste_CSSR_2024.pdf", label: "Préfecture Gironde", maj: "2024" },
  { dept: "47", pdf: "Liste_des_CSSR.pdf", label: "Préfecture Lot-et-Garonne", maj: "n/c" },
  { dept: "56", pdf: "Tableau_CSSR_IDE_aout_2025.pdf", label: "DDTM Morbihan", maj: "07/08/2025" },
  { dept: "64", pdf: "TAB+liste+deptle+des+CSSR+agréés.pdf", label: "Préfecture Pyrénées-Atlantiques", maj: "09/07/2026" },
  { dept: "69", pdf: "Liste des centres de sensibilisation à la sécurité routière 08.08.23.pdf", label: "Préfecture Rhône", maj: "08/08/2023" },
  { dept: "75", pdf: "paris-liste-des-cssr.pdf", label: "Préfecture de Police de Paris", maj: "03/09/2018" },
  { dept: "91", pdf: "liste pref CSSR - 24-03-21.pdf", label: "Préfecture Essonne", maj: "24/03/2021" },
  { dept: "92", pdf: "Liste CSSR 050625.pdf", label: "Préfecture Hauts-de-Seine", maj: "05/06/2025" },
  { dept: "95", pdf: "Centres+de+sensibilisation+agréés+par+communes+Avril+2016.pdf", label: "Préfecture Val-d'Oise", maj: "08/2016" },
] as const;

const AIN = "2. Liste internet centres de sensibilisation sécurité routière V12072024.pdf";
const CORSE = "Centres de récupération de point Permis Août 2023.pdf";
const AVEYRON = "liste_organismesrecuppointscssr_aveyron_2023.pdf";
const CALVADOS = "La liste des centres de stages de récupération de points.pdf";
const DROME = "Liste_CSSR (MAJ 12 01 2026).pdf";
const GIRONDE = "liste_CSSR_2024.pdf";

// ─── 01 — AIN (DDT de l'Ain, MAJ 07/04/2026) ─────────────
// La liste de l'Ain ne publie pas les n° d'agrément.
const AIN_ROWS: CssrRow[] = [
  { nom: "ACTI-ROUTE", telephone: "02 51 50 07 72", siteWeb: "www.actiroute.com", adresse: "4 rue Georges-Charpak", codePostal: "85201", ville: "Fontenay-le-Comte", dept: "01", lieux: "Bourg-en-Bresse (Hôtel Mercure, Hôtel Terminus, Technopôle Alimentec, Ibis Styles)", sourcePdf: AIN, maj: "07/04/2026" },
  { nom: "MOBILITE CLUB FRANCE", telephone: "03 88 36 04 34", siteWeb: "www.automobile-club.org", adresse: "38 avenue du Rhin", codePostal: "67000", ville: "Strasbourg", dept: "01", lieux: "Bourg-en-Bresse (Technopôle Alimentec, Hôtel Mercure, Qualys Hôtel Terminus)", sourcePdf: AIN, maj: "07/04/2026" },
  { nom: "FRANCE STAGE PERMIS", telephone: "09 72 10 27 72", siteWeb: "www.francestagepermis.fr", adresse: "Z.A. de Fontvieille, emplacement D123", codePostal: "13190", ville: "Allauch", dept: "01", lieux: "Bourg-en-Bresse, Châtillon-en-Michaille, Ambronay, Gorrevod", sourcePdf: AIN, maj: "07/04/2026" },
  { nom: "POINT PLUS", telephone: "09 83 09 11 76", siteWeb: "pointplus-69.fr", adresse: "5 place du Château", codePostal: "69140", ville: "Rillieux-la-Pape", dept: "01", lieux: "Montluel (238 Grande Rue)", sourcePdf: AIN, maj: "07/04/2026" },
  { nom: "5C PREVENTION", telephone: "07 69 69 54 08", siteWeb: "5cprevention.fr", adresse: "54 avenue Jean-Jaurès", codePostal: "69150", ville: "Décines-Charpieu", dept: "01", lieux: "Ambérieu-en-Bugey, Bourg-en-Bresse", sourcePdf: AIN, maj: "07/04/2026" },
  { nom: "D'UN POINT A L'AUTRE", email: "presidence@d-un-point-a-l-autre.fr", telephone: "09 69 37 95 95", adresse: "Maison des associations, 22 cours Aristide Briand", codePostal: "13580", ville: "La Fare-les-Oliviers", dept: "01", lieux: "Ambérieu-en-Bugey (Maison des Sociétés)", sourcePdf: AIN, maj: "07/04/2026" },
  { nom: "ACTION SENSI PERMIS", email: "contact@actionsensipermis.com", telephone: "07 59 70 10 88", adresse: "950 route des Colles", codePostal: "06410", ville: "Biot", dept: "01", lieux: "Bourg-en-Bresse (Ibis Styles, Technopôle Alimentec)", sourcePdf: AIN, maj: "07/04/2026" },
  { nom: "SI FORMATION", telephone: "04 50 48 06 14", siteWeb: "auto-motoecoleikram.fr", adresse: "26 bis Maréchal Leclerc", codePostal: "01200", ville: "Valserhône", dept: "01", lieux: "Valserhône", sourcePdf: AIN, maj: "07/04/2026" },
];

// ─── 2B — HAUTE-CORSE (DDT 2B, MAJ mai 2025) ─────────────
const CORSE_ROWS: CssrRow[] = [
  { nom: "ATOUT PERMIS 2B", agrement: "R1202B00020", email: "iva.joaquim@sfr.fr", contactPrenom: "Iva Maria", contactNom: "GASPAR JOAQUIM", dept: "2B", lieux: "Aléria, Ghisonaccia", sourcePdf: CORSE, maj: "05/2025" },
  { nom: "AUTO-ECOLE MILLELIRI", agrement: "R1202B00040", email: "autoecole.milleliri@orange.fr", contactPrenom: "Dominique", contactNom: "MILLELIRI", dept: "2B", lieux: "Bastia", sourcePdf: CORSE, maj: "05/2025" },
  { nom: "CENTRE KALLISTE FORMATION", agrement: "R1202B00030", email: "aurelieguezou@orange.fr", contactPrenom: "Aurélie", contactNom: "GUEZOU", dept: "2B", lieux: "L'Île-Rousse, Corte", sourcePdf: CORSE, maj: "05/2025" },
  { nom: "CESR 20", agrement: "R1202B00010", email: "cesr20@wanadoo.fr", contactPrenom: "Jean-Marc", contactNom: "ANGELOTTI", dept: "2B", lieux: "Biguglia", sourcePdf: CORSE, maj: "05/2025" },
  { nom: "CHRONO 2B", agrement: "R1402B00010", email: "chrono2b@hotmail.fr", contactPrenom: "Martine", contactNom: "CHARLES ép. GUADAGNINI", dept: "2B", lieux: "Borgo", sourcePdf: CORSE, maj: "05/2025" },
  { nom: "SAS F.S.T", agrement: "R2202B00010", email: "fst20290@gmail.com", contactPrenom: "Christian", contactNom: "CAILLAUD", dept: "2B", lieux: "Lucciana", sourcePdf: CORSE, maj: "05/2025" },
  { nom: "PRÉVENTION ROUTIÈRE FORMATION", agrement: "R2402B00010", email: "comite2b@preventionroutiere.com", contactPrenom: "Aurélie", contactNom: "VIGNE", dept: "2B", lieux: "Bastia, Furiani", sourcePdf: CORSE, maj: "05/2025" },
  { nom: "DEIANA", agrement: "R2402B00020", email: "sabrinadeiana@orange.fr", contactPrenom: "Anglina", contactNom: "DEIANA", dept: "2B", lieux: "Ghisonaccia", sourcePdf: CORSE, maj: "05/2025" },
];

// ─── 12 — AVEYRON (MAJ 16/02/2023) ───────────────────────
const AVEYRON_ROWS: CssrRow[] = [
  { nom: "ADEPEC 12", telephone: "07 86 26 71 96", siteWeb: "www.adepec12.fr", adresse: "CFCNA, Parc d'activité d'Arsac", ville: "Sainte-Radegonde", dept: "12", lieux: "Sainte-Radegonde", sourcePdf: AVEYRON, maj: "16/02/2023" },
  { nom: "ANPER", telephone: "0800 800 108", siteWeb: "www.anper.info", dept: "12", lieux: "La Primaube", note: "Second numéro : 02 51 36 32 02", sourcePdf: AVEYRON, maj: "16/02/2023" },
  { nom: "ACTI ROUTE", email: "service.stages@actiroute.com", telephone: "0800 861 866", dept: "12", lieux: "Rodez, Millau, Villefranche-de-Rouergue", note: "Second numéro : 02 51 50 07 72", sourcePdf: AVEYRON, maj: "16/02/2023" },
  { nom: "CER Joël FOSSEMALE", email: "joel.fossemale@cer-reseau.com", telephone: "05 65 59 09 79", contactPrenom: "Joël", contactNom: "FOSSEMALE", dept: "12", lieux: "Millau", sourcePdf: AVEYRON, maj: "16/02/2023" },
  { nom: "CASR FORMATION Pascal NOGUES", email: "paea13@gmail.com", telephone: "06 23 59 64 23", contactPrenom: "Pascal", contactNom: "NOGUES", dept: "12", lieux: "Millau, Villefranche-de-Rouergue", sourcePdf: AVEYRON, maj: "16/02/2023" },
  { nom: "FRANCE STAGE PERMIS", email: "contact@francestagepermis.fr", telephone: "09 72 10 27 72", dept: "12", lieux: "Rodez", sourcePdf: AVEYRON, maj: "16/02/2023" },
  { nom: "PROVENCE FORMATION ROUTIERE – Alain HARNOIS", email: "alainharnois@live.fr", telephone: "04 86 34 71 22", contactPrenom: "Alain", contactNom: "HARNOIS", dept: "12", lieux: "Castelnau-Pégayrols", note: "Second numéro : 06 60 52 83 03", sourcePdf: AVEYRON, maj: "16/02/2023" },
];

// ─── 14 — CALVADOS (DDTM, MAJ 06/06/2018) ────────────────
// Les cellules « adresses » de ce PDF sont décalées d'une ligne sur la première
// moitié du tableau : on ne retient que les lieux de stage, non ambigus.
const CALVADOS_ROWS: CssrRow[] = [
  { nom: "CAMPUS FORMATION", agrement: "R1201400010", email: "campus.formation@wanadoo.fr", telephone: "02 31 70 90 00", siteWeb: "www.campusformation.com", dept: "14", lieux: "Mondeville, Caen", sourcePdf: CALVADOS, maj: "06/06/2018" },
  { nom: "AUTO ECOLE DU ROND POINT", agrement: "R1201400020", email: "auto-ecole.derrien@orange.fr", telephone: "02 31 31 75 96", dept: "14", lieux: "Lisieux", sourcePdf: CALVADOS, maj: "06/06/2018" },
  { nom: "ACTI ROUTE", agrement: "R1201400040", telephone: "0800 861 866", siteWeb: "www.actiroute.com", dept: "14", lieux: "Caen (AFT IFTIM), Lisieux (Hôtel Mercure), Vire-Normandie (AFTRAL)", note: "Second numéro : 02 51 50 07 72", sourcePdf: CALVADOS, maj: "06/06/2018" },
  { nom: "ESPACE INTERNATIONAL AUTOMOBILE", agrement: "R1201400050", email: "circuit-eia@wanadoo.fr", telephone: "02 31 64 39 01", siteWeb: "www.eia.fr", dept: "14", lieux: "Pont-l'Évêque (Domaine de Betteville)", sourcePdf: CALVADOS, maj: "06/06/2018" },
  { nom: "CESR", agrement: "R1201400060", email: "cesr@cesr-formation.fr", telephone: "02 31 35 16 16", siteWeb: "www.cesr-cityzen.fr", dept: "14", lieux: "Ifs, Lisieux, Bayeux, Vire-Normandie, Cormelles-le-Royal", sourcePdf: CALVADOS, maj: "06/06/2018" },
  { nom: "CJS FORMATION", agrement: "R1201400080", telephone: "02 31 78 20 94", siteWeb: "www.cjsformation.com", dept: "14", lieux: "Ifs (ZA Objectifs Sud)", sourcePdf: CALVADOS, maj: "06/06/2018" },
  { nom: "AUTOMOBILE CLUB ASSOCIATION", agrement: "R1301400020", email: "formation@automobile-club.org", telephone: "08 20 00 25 15", siteWeb: "www.automobile-club.org", dept: "14", lieux: "Caen (CCI), Hérouville-Saint-Clair (Hôtel Ibis)", sourcePdf: CALVADOS, maj: "06/06/2018" },
  { nom: "CABOURG / DIVES CONDUITE / C3M", agrement: "R1601400010", email: "sarl.c3m14@gmail.com", telephone: "02 31 23 08 30", adresse: "43 avenue de l'Hippodrome", codePostal: "14390", ville: "Cabourg", dept: "14", sourcePdf: CALVADOS, maj: "06/06/2018" },
  { nom: "CENTRE DE FORMATION BIGOT LIBOR", agrement: "R1301400070", email: "cf.bl@wanadoo.fr", telephone: "02 31 69 95 55", adresse: "ZA Charles Tellier, rue Guillaume le Conquérant", codePostal: "14110", ville: "Condé-en-Normandie", dept: "14", sourcePdf: CALVADOS, maj: "06/06/2018" },
  { nom: "MP CONDUITE FORMATION", agrement: "R1301400080", email: "mllebastard@orange.fr", telephone: "02 31 67 85 50", adresse: "19D route de Granville", codePostal: "14500", ville: "Vire-Normandie", dept: "14", sourcePdf: CALVADOS, maj: "06/06/2018" },
  { nom: "SARL RPPC", agrement: "R1301400100", email: "brittexservice@gmail.com", telephone: "04 91 79 51 09", adresse: "ZAC du Citis, 1 impasse Iniatalis", codePostal: "14000", ville: "Caen", dept: "14", sourcePdf: CALVADOS, maj: "06/06/2018" },
  { nom: "POINT PERMIS PREVENTION", agrement: "R1401400010", email: "beugny2000@yahoo.fr", telephone: "06 32 50 87 31", dept: "14", lieux: "Saint-Arnoult (salle communale), Lisieux (Foyer Louise Michel)", sourcePdf: CALVADOS, maj: "06/06/2018" },
  { nom: "DENIS Émilie", agrement: "R1501400030", email: "emilydenis@hotmail.fr", telephone: "06 16 22 36 72", adresse: "178 rue du Poirier", codePostal: "14650", ville: "Carpiquet", dept: "14", contactPrenom: "Émilie", contactNom: "DENIS", sourcePdf: CALVADOS, maj: "06/06/2018" },
  { nom: "BEN ALI Hichem (ID Stages)", agrement: "R1601400020", email: "contact@idstages.fr", telephone: "04 65 26 00 71", dept: "14", contactPrenom: "Hichem", contactNom: "BEN ALI", lieux: "Caen (Studio 50), Ifs (Hôtel Kyriad), La Rivière-Saint-Sauveur (Hôtel Campanile)", sourcePdf: CALVADOS, maj: "06/06/2018" },
  { nom: "JAMARD Alexandre", agrement: "R1701400020", email: "alexandre@alexandre.jamard.com", telephone: "06 83 59 56 87", adresse: "26 rue du Docteur Lainé", codePostal: "14800", ville: "Touques", dept: "14", contactPrenom: "Alexandre", contactNom: "JAMARD", sourcePdf: CALVADOS, maj: "06/06/2018" },
  { nom: "ASR2P", agrement: "R1801400010", email: "contact.asr2p@gmail.com", telephone: "06 72 27 71 74", adresse: "ESSAT L'Essor, boulevard Jean Mantelet", codePostal: "14700", ville: "Falaise", dept: "14", sourcePdf: CALVADOS, maj: "06/06/2018" },
  { nom: "FRANCE AUTO ECOLE SARL J.W", agrement: "R1801400020", email: "vospoints@franceautoecole.fr", telephone: "06 59 92 05 18", adresse: "9 rue du Général de Gaulle", codePostal: "14810", ville: "Blonville-sur-Mer", dept: "14", sourcePdf: CALVADOS, maj: "06/06/2018" },
];

// ─── 26 — DRÔME (sous-préfecture de Die, MAJ 12/01/2026) ──
const DROME_ROWS: CssrRow[] = [
  { nom: "ACTIROUTE", agrement: "R 13 026 00030", telephone: "0800 86 18 66", adresse: "9 rue du Dr Chevallereau", codePostal: "85100", ville: "Fontenay-le-Comte", dept: "26", lieux: "Montélimar, Valence, Romans-sur-Isère", sourcePdf: DROME, maj: "12/01/2026" },
  { nom: "ATOUT POINT / NEW ROAD", agrement: "R 25 026 00010", telephone: "01 40 86 57 44", adresse: "229 rue Saint-Honoré", codePostal: "75001", ville: "Paris", dept: "26", lieux: "Les Tourrettes (Hôtel Campanile), Valence (2 Epi Formation)", sourcePdf: DROME, maj: "12/01/2026" },
  { nom: "AUTOMOBILE CLUB ASSOCIATION", agrement: "R 25 026 00020", telephone: "09 70 40 11 11", adresse: "5 rue des Narcisses", codePostal: "67150", ville: "Gerstheim", dept: "26", lieux: "Valence (Hôtel de Lyon)", sourcePdf: DROME, maj: "12/01/2026" },
  { nom: "ECF ALIX FORMATION", agrement: "R 13 026 00070", telephone: "04 75 47 61 62", adresse: "90 rue Nouvelle", ville: "Alixan", dept: "26", lieux: "Alixan", sourcePdf: DROME, maj: "12/01/2026" },
  { nom: "FRANCE STAGE PERMIS", agrement: "R 18 026 00010", telephone: "09 72 10 27 72", adresse: "ZA de Fontvieille, emplacement D123", codePostal: "13190", ville: "Allauch", dept: "26", lieux: "Valence, Romans-sur-Isère, Les Tourrettes, Bourg-lès-Valence", sourcePdf: DROME, maj: "12/01/2026" },
];

// ─── 33 — GIRONDE (liste CSSR 2024) ──────────────────────
const GIRONDE_ROWS: CssrRow[] = [
  { nom: "AUTOMOBILE CLUB FORMATION DU SUD OUEST", agrement: "R 20 033 0003 0", email: "direction@automobileclub-sudouest.com", telephone: "05 56 44 22 92", adresse: "8 place des Quinconces", codePostal: "33000", ville: "Bordeaux", dept: "33", contactPrenom: "Laurence", contactNom: "MONTEIRO", sourcePdf: GIRONDE, maj: "2024" },
  { nom: "AUTOMOBILE CLUB ASSOCIATION", agrement: "R 23 033 0005 0", email: "gestion-stages@automobile-club.org", telephone: "09 70 40 11 11", adresse: "38 avenue du Rhin, CS 80049", codePostal: "67027", ville: "Strasbourg", dept: "33", contactPrenom: "Vincent", contactNom: "CLEVENOT", sourcePdf: GIRONDE, maj: "2024" },
  { nom: "ACTI-ROUTE", agrement: "R 13 033 0006 0", email: "info@actiroute.com", telephone: "02 51 50 07 72", adresse: "4 rue Georges Charpak", codePostal: "85200", ville: "Fontenay-le-Comte", dept: "33", contactPrenom: "Joël", contactNom: "POLTEAU", sourcePdf: GIRONDE, maj: "2024" },
  { nom: "AQUITAINE DIALOGUE ROUTIER (KLEVER)", agrement: "R 21 033 0002 0", email: "aquitainedial33@gmail.com", telephone: "05 57 32 49 12", adresse: "37 les jardins de Fargues", codePostal: "33370", ville: "Fargues-Saint-Hilaire", dept: "33", contactPrenom: "Eric", contactNom: "LEFEBVRE", note: "Second numéro : 06 87 47 38 49", sourcePdf: GIRONDE, maj: "2024" },
  { nom: "ASSOCIATION EDUCATION ROUTIERE EN GIRONDE", agrement: "R 16 033 0004 0", email: "aerg33@free.fr", telephone: "05 57 24 15 43", adresse: "Mairie, 8 rue le Bourg", codePostal: "33420", ville: "Daignac", dept: "33", contactPrenom: "Georges", contactNom: "AUBERT", note: "Second numéro : 06 86 47 40 66", sourcePdf: GIRONDE, maj: "2024" },
  { nom: "FRANCE STAGE PERMIS", agrement: "R 18 033 0005 0", email: "contact@francestagepermis.fr", telephone: "09 72 60 37 77", adresse: "ZA de Fontvieille, emplacement D123", codePostal: "13190", ville: "Allauch", dept: "33", contactPrenom: "Hugo", contactNom: "SPORTICH", sourcePdf: GIRONDE, maj: "2024" },
  { nom: "CAPITAL POINTS", agrement: "R 13 033 0011 0", email: "fredbaque@aol.com", telephone: "09 81 74 01 22", adresse: "7 place du Arail", codePostal: "33140", ville: "Cadaujac", dept: "33", contactPrenom: "Christelle", contactNom: "GARANS", note: "Second numéro : 06 62 54 56 40", sourcePdf: GIRONDE, maj: "2024" },
  { nom: "D'UN POINT A L'AUTRE", agrement: "R 19 033 0001 0", email: "secretaire@d-un-point-a-l-autre.fr", telephone: "06 60 92 07 06", adresse: "22 rue Aristide Briand", codePostal: "13580", ville: "La Fare-les-Oliviers", dept: "33", contactPrenom: "Virginie", contactNom: "CLUZAN", sourcePdf: GIRONDE, maj: "2024" },
  { nom: "ECF CESR 33", agrement: "R 24 033 0003 0", email: "laurence.lacoste-lacroix@ecf-formapro.com", telephone: "05 56 57 46 46", adresse: "Domaine du Pinsan, rue du Pinsan", codePostal: "33320", ville: "Eysines", dept: "33", contactPrenom: "Cyrille", contactNom: "DESAIZE", note: "Autres coordonnées : 06 10 83 84 35, nicolas.thimothee@ecf-formapro.com", sourcePdf: GIRONDE, maj: "2024" },
  { nom: "FEU VERT POUR LA SECURITE ROUTIERE", agrement: "R 24 033 0002 0", email: "feu-vert-formation@orange.fr", telephone: "05 57 26 92 10", adresse: "218 avenue du Haut Lévèque", codePostal: "33600", ville: "Pessac", dept: "33", contactPrenom: "Cyrille", contactNom: "DESAIZE", note: "Second numéro : 06 86 66 68 51", sourcePdf: GIRONDE, maj: "2024" },
  { nom: "GIRONDE PREVENTION", agrement: "R 20 033 0004 0", email: "gironde.prevention@gmail.com", adresse: "104 chemin des Mésanges", codePostal: "33290", ville: "Le Pian-Médoc", dept: "33", contactPrenom: "Elodie", contactNom: "MARCHOUX", sourcePdf: GIRONDE, maj: "2024" },
  { nom: "PRATILI Ludovic", agrement: "R 13 033 0012 0", email: "ludovic.pratili@wanadoo.fr", telephone: "06 80 72 95 58", adresse: "20 route de Marville", codePostal: "24130", ville: "Prigonrieux", dept: "33", contactPrenom: "Ludovic", contactNom: "PRATILI", sourcePdf: GIRONDE, maj: "2024" },
  { nom: "ASSOCIATION PREVENTION ROUTIERE FORMATION 33", agrement: "R 24 033 0004 0", email: "j.fefevre@preventionroutiere.aaso.fr", telephone: "01 44 15 27 00", adresse: "33 rue de Mogador", codePostal: "75009", ville: "Paris", dept: "33", contactPrenom: "Aurélie", contactNom: "VIGNE", sourcePdf: GIRONDE, maj: "2024" },
  { nom: "SECURITE ET CONDUITE — Prévention du risque routier", agrement: "R 17 033 0003 0", email: "cathybarypro@gmail.com", telephone: "05 53 64 57 91", adresse: "39 bld Fourcade", codePostal: "47200", ville: "Marmande", dept: "33", contactPrenom: "Christian", contactNom: "ZANELLO", sourcePdf: GIRONDE, maj: "2024" },
  { nom: "POUR UNE ROUTE SURE", agrement: "R 13 033 0022 0", email: "asso-purs@wanadoo.fr", telephone: "05 56 32 15 25", adresse: "50 avenue Jean Jaurès", codePostal: "33270", ville: "Floirac", dept: "33", contactPrenom: "Julien", contactNom: "COUTURIER", sourcePdf: GIRONDE, maj: "2024" },
  { nom: "ABC PERMIS A POINTS", agrement: "R 20 033 0001 0", email: "abcpermis@gmail.com", telephone: "04 83 11 42 11", adresse: "330 rue Maréchal Gallieni", codePostal: "83600", ville: "Fréjus", dept: "33", contactPrenom: "Marie-Christine", contactNom: "MORENO CANICIO", note: "Second numéro : 06 66 55 84 57", sourcePdf: GIRONDE, maj: "2024" },
  { nom: "PSSR PREVENTION ET SENSIBILISATION A LA SECURITE ROUTIERE", agrement: "R 23 033 0004 0", email: "pssr31@outlook.fr", telephone: "07 79 46 59 61", adresse: "13 bld de Lattre de Tassigny", codePostal: "65000", ville: "Tarbes", dept: "33", contactPrenom: "Jérôme", contactNom: "CHABAL", sourcePdf: GIRONDE, maj: "2024" },
  { nom: "2B AWARE", agrement: "R 22 033 0002 0", email: "2b.aware.bordeaux@gmail.com", telephone: "06 68 78 15 30", adresse: "477 cours de la Libération", codePostal: "33400", ville: "Talence", dept: "33", contactPrenom: "Florence", contactNom: "MONNIER", sourcePdf: GIRONDE, maj: "2024" },
  { nom: "J.F.J RECUP'", agrement: "R 23 033 0003 0", email: "jfjrecup@gmail.com", telephone: "07 86 86 70 47", adresse: "19 rue Auguste Chabrières", codePostal: "75015", ville: "Paris", dept: "33", contactPrenom: "John", contactNom: "MENGUE", sourcePdf: GIRONDE, maj: "2024" },
  { nom: "ABCDAIRE-STRIATUM FORMATION", agrement: "R 24 033 0001 0", email: "laurent@striatum.fr", telephone: "06 58 77 23 85", adresse: "12 avenue Jean Moulin", codePostal: "83000", ville: "Toulon", dept: "33", contactPrenom: "Laurent", contactNom: "LEFEBVRE", sourcePdf: GIRONDE, maj: "2024" },
  { nom: "JET BOAT SCHOOL", agrement: "R 17 033 0001 0", email: "contact@jetboatschool.fr", telephone: "05 47 33 50 91", adresse: "19 avenue du Médoc", codePostal: "33320", ville: "Eysines", dept: "33", contactPrenom: "Malik", contactNom: "AMROUCHE", note: "Second numéro : 06 85 47 23 13", sourcePdf: GIRONDE, maj: "2024" },
  { nom: "CER MOBI", agrement: "R 22 033 0001 0", email: "sebastien.preault@mobi-formation.com", telephone: "06 83 15 35 58", adresse: "6 impasse le Titien, Château-d'Olonne", codePostal: "85100", ville: "Les Sables-d'Olonne", dept: "33", contactPrenom: "Sébastien", contactNom: "PREAULT", sourcePdf: GIRONDE, maj: "2024" },
  { nom: "8-CS.R", agrement: "R 24 033 0005 0", email: "8-c.sr@groupe8-c.fr", telephone: "04 97 23 35 65", adresse: "5 rue du Golf", codePostal: "33700", ville: "Mérignac", dept: "33", contactPrenom: "Jean-Rémi", contactNom: "GOURDON", sourcePdf: GIRONDE, maj: "2024" },
];

export const CSSR_ROWS: CssrRow[] = [
  ...AIN_ROWS,
  ...CORSE_ROWS,
  ...AVEYRON_ROWS,
  ...CALVADOS_ROWS,
  ...DROME_ROWS,
  ...GIRONDE_ROWS,
];
