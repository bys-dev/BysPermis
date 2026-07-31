import type { CssrRow } from "./types";

const LOT_GARONNE = "Liste_des_CSSR.pdf";
const MORBIHAN = "Tableau_CSSR_IDE_aout_2025.pdf";
const PYR_ATL = "TAB+liste+deptle+des+CSSR+agréés.pdf";
const RHONE = "Liste des centres de sensibilisation à la sécurité routière 08.08.23.pdf";

// ─── 47 — LOT-ET-GARONNE ─────────────────────────────────
// Liste organisée par arrondissement (Agen, Marmande, Nérac, Villeneuve-sur-Lot),
// sans n° d'agrément. Les centres présents dans plusieurs arrondissements sont
// regroupés ici en une ligne, avec tous les lieux.
const LOT_GARONNE_ROWS: CssrRow[] = [
  { nom: "ABC PERMIS A POINTS", email: "abcpermis@gmail.com", telephone: "04 94 99 29 54", dept: "47", lieux: "Agen (Stim'otel, Brasserie l'Indé)", sourcePdf: LOT_GARONNE },
  { nom: "ACTI ROUTE", email: "service.stages@actiroute.com", telephone: "0800 861 866", siteWeb: "www.actiroute.com", dept: "47", lieux: "Agen (Agora Centre congrès, La Fontaine Coworking), Marmande (Hôtel Campanile), Pujols (Hôtel Campanile), Villeneuve-sur-Lot (Ibis Style)", sourcePdf: LOT_GARONNE },
  { nom: "ASSUR ASSOCIATION", email: "contact@assur-association.com", telephone: "06 15 98 28 77", siteWeb: "www.assur-association.com", adresse: "95 bld de la Liberté", codePostal: "47000", ville: "Agen", dept: "47", lieux: "Agen, Samazan (Pépinière Euréka), Villeneuve-sur-Lot (Maison de la vie associative)", note: "Second numéro : 05 53 48 26 15", sourcePdf: LOT_GARONNE },
  { nom: "AUTO ECOLE MARTINEZ", email: "autoecole.martinez@wanadoo.fr", telephone: "05 53 47 11 86", siteWeb: "www.autoecolemartinez.fr", adresse: "Auto-École Drive, 1508 avenue des Pyrénées", codePostal: "47520", ville: "Le Passage", dept: "47", lieux: "Le Passage, Samazan, Marmande", sourcePdf: LOT_GARONNE },
  { nom: "SARL DRIVE", email: "drive.lautoecole47@gmail.com", telephone: "05 53 68 00 44", adresse: "Auto-École Drive, 1508 avenue des Pyrénées", codePostal: "47520", ville: "Le Passage", dept: "47", sourcePdf: LOT_GARONNE },
  { nom: "KELPOINTS", email: "kelpoints@yahoo.com", telephone: "06 71 74 02 73", adresse: "Résidence des Jeunes de la CMAI47, 2 impasse Morère", codePostal: "47000", ville: "Agen", dept: "47", lieux: "Agen (Stim'otel)", sourcePdf: LOT_GARONNE },
  { nom: "LA PRÉVENTION ROUTIÈRE FORMATION", email: "comite47@preventionroutiere.com", telephone: "05 53 47 00 02", siteWeb: "www.recuperation-points-permis.org", adresse: "194 boulevard de la Liberté", codePostal: "47000", ville: "Agen", dept: "47", lieux: "Agen (Stim'otel)", sourcePdf: LOT_GARONNE },
  { nom: "SÉCURITÉ ET CONDUITE", email: "contact@securiteetconduite.fr", telephone: "05 53 64 57 91", siteWeb: "www.securiteconduite.fr", adresse: "Établissement L'Indé, 14 avenue du Général de Gaulle", codePostal: "47000", ville: "Agen", dept: "47", lieux: "Agen, Marmande (Salle Damouran)", sourcePdf: LOT_GARONNE },
  { nom: "AAA.COM", email: "aquitains65@outlook.fr", telephone: "07 79 46 59 61", dept: "47", lieux: "Marmande (Hôtel le Capricorne), Samazan (The Originals City)", sourcePdf: LOT_GARONNE },
  { nom: "PÉRIGORD FORMATION", email: "perigord.formation@gmail.com", telephone: "06 26 56 57 64", adresse: "Pépinière Euréka, ZA de Venes rue Tarride", codePostal: "47400", ville: "Tonneins", dept: "47", sourcePdf: LOT_GARONNE },
];

// ─── 56 — MORBIHAN (DDTM Vannes, MAJ 07/08/2025) ─────────
const MORBIHAN_ROWS: CssrRow[] = [
  { nom: "ACTI ROUTE", email: "info@actiroute.com", telephone: "02 51 50 07 72", dept: "56", lieux: "Vannes (CER AB Conduite, Association Montcalm), Lorient (SARL Douguet Formation, Hôtel Mercure), Pontivy (Hôtel Robic)", note: "Coordonnées éducation routière : service.stages@actiroute.com, 02 51 50 17 30", sourcePdf: MORBIHAN, maj: "07/08/2025" },
  { nom: "ACTION SENSI PERMIS", email: "contact@actionsensipermis.fr", telephone: "06 73 46 87 69", dept: "56", lieux: "Vannes (Hôtel Kiriad, Escale Océania, Espace Montcalm, CER AB Conduite)", sourcePdf: MORBIHAN, maj: "07/08/2025" },
  { nom: "SECURITEAM OPTIONS FORMATIONS", email: "options-formation@securiteam.fr", telephone: "02 97 85 92 91", dept: "56", lieux: "Lorient (avenue Charles de Gaulle, rue Simone Signoret)", sourcePdf: MORBIHAN, maj: "07/08/2025" },
  { nom: "PREVENTION ROUTIERE FORMATION", email: "comite56@preventionroutiere.com", telephone: "02 97 46 07 18", dept: "56", lieux: "Vannes (rue Eugène Delacroix, rue Monseigneur Tréhiou), Caudan (salle des fêtes Jo Le Ravallec)", sourcePdf: MORBIHAN, maj: "07/08/2025" },
  { nom: "CER MOBI FORMATION", email: "contact@mobi-formation.com", telephone: "02 51 95 00 78", siteWeb: "www.mobi-formation.com", dept: "56", lieux: "Caudan (ADAPEI), Vannes (Hôtel Ibis), Lorient (Hôtel Ibis, Brit Hôtel)", sourcePdf: MORBIHAN, maj: "07/08/2025" },
  { nom: "ABAC", email: "contact.abac@gmail.com", telephone: "06 17 17 06 23", dept: "56", lieux: "Ploërmel (Hôtel de l'Hippodrome)", sourcePdf: MORBIHAN, maj: "07/08/2025" },
  { nom: "AABAC", email: "aabac@orange.fr", telephone: "02 51 82 58 04", dept: "56", lieux: "Vannes (Hôtel Ibis, Espace Montcalm), Plescop (Apart'hôtel Adagio)", sourcePdf: MORBIHAN, maj: "07/08/2025" },
  { nom: "CHAMBRE DE METIERS ET DE L'ARTISANAT DE REGION BRETAGNE", telephone: "02 97 63 69 65", dept: "56", lieux: "Vannes, Pontivy, Lorient (antennes CMA)", sourcePdf: MORBIHAN, maj: "07/08/2025" },
];

// ─── 64 — PYRÉNÉES-ATLANTIQUES (MAJ 09/07/2026) ──────────
// Liste organisée par commune de stage : un centre y revient autant de fois
// qu'il a de lieux. Regroupé ici par centre, avec tous les lieux.
const PYR_ATL_ROWS: CssrRow[] = [
  { nom: "AUTO-ÉCOLE AGUILERA", agrement: "R 21 064 0002 0", email: "direction@ae-aguilera.fr", telephone: "05 59 85 07 32", siteWeb: "https://auto-ecole-aguilera.fr", adresse: "95 avenue de Biarritz", codePostal: "64600", ville: "Anglet", dept: "64", lieux: "Anglet", sourcePdf: PYR_ATL, maj: "09/07/2026" },
  { nom: "SUD OUEST SÉCURITÉ ROUTIÈRE", agrement: "R 16 064 0001 0", email: "stephanie@sos-point.com", telephone: "07 82 97 72 97", dept: "64", lieux: "Anglet (Hôtel les Terrasses d'Atlanthal), Bayonne (Hôtel Le Bayonne, CCI Pays basque), Orthez (Salle Pierre Saillant, Maison Gascoin)", sourcePdf: PYR_ATL, maj: "09/07/2026" },
  { nom: "AUTO-ÉCOLE BAB", agrement: "R 26 064 0002 0", email: "auto.ecole.du.bab@gmail.com", telephone: "06 11 32 75 24", adresse: "43 avenue Léon Laporte", codePostal: "64600", ville: "Anglet", dept: "64", lieux: "Anglet, Pau (All Suites Appart Hôtel)", sourcePdf: PYR_ATL, maj: "09/07/2026" },
  { nom: "SARL VERSAVAUD", agrement: "R 25 064 0001 0", email: "autoecoleversavaud@gmail.com", telephone: "05 59 05 78 72", siteWeb: "www.auto-ecole-versavaud.jimdosite.com", adresse: "Pôle d'activités Laprade, 2 rue du Parc National", codePostal: "64260", ville: "Arudy", dept: "64", lieux: "Arudy", sourcePdf: PYR_ATL, maj: "09/07/2026" },
  { nom: "AGIR SECURITE ROUTIERE", agrement: "R 17 064 0001 0", email: "agirsecuriteroutiere@gmail.com", telephone: "06 85 95 45 99", siteWeb: "https://agirsecuriteroutiere.fr", dept: "64", lieux: "Bayonne (CCI Pays basque, Maison Diocésaine)", sourcePdf: PYR_ATL, maj: "09/07/2026" },
  { nom: "MENDIBOURE FORMATION", agrement: "R 21 064 0003 0", email: "contact@mendiboure-formation.fr", telephone: "05 59 55 50 55", siteWeb: "https://www.auto-ecole-mendiboure.fr", dept: "64", lieux: "Bayonne (ZI Saint-Étienne)", sourcePdf: PYR_ATL, maj: "09/07/2026" },
  { nom: "ACTIROUTE", agrement: "R 13 064 0010 0", email: "info@actiroute.com", telephone: "02 51 50 07 72", siteWeb: "https://www.actiroute.com", dept: "64", lieux: "Bayonne, Lons (Aftral), Mouguerre (Aftral), Pau (Auto-école du Parc), Saint-Jean-de-Luz (Hôtel Donibane)", sourcePdf: PYR_ATL, maj: "09/07/2026" },
  { nom: "ABC PERMIS A POINTS", agrement: "R 18 064 0001 0", email: "abcpermis@gmail.com", telephone: "04 94 99 29 54", siteWeb: "https://www.abc-permis.com", dept: "64", lieux: "Bayonne (Hôtel Ibis, SCI Jafet), Biarritz (Grand Tonic Hôtel), Lescar (Novotel Pau Pyrénées), Salies-de-Béarn (Casino Hôtel du Parc)", note: "Autre email relevé sur la liste (Lescar) : aader1@laposte.fr", sourcePdf: PYR_ATL, maj: "09/07/2026" },
  { nom: "MOBILITE CLUB FRANCE", agrement: "R 24 064 0002 0", email: "gestion-stages@automobileclub.org", telephone: "09 70 40 11 11", siteWeb: "https://www.automobile-club.org", dept: "64", lieux: "Bayonne (Hôtel Ibis Centre)", sourcePdf: PYR_ATL, maj: "09/07/2026" },
  { nom: "FRANCE STAGE PERMIS", agrement: "R 19 064 0001 0", email: "contact@francestagepermis.fr", telephone: "09 72 10 27 72", siteWeb: "https://francestagepermis.fr", dept: "64", lieux: "Biarritz (Hôtel Akena), Lons (Brit Hôtel)", sourcePdf: PYR_ATL, maj: "09/07/2026" },
  { nom: "EXKO FORMATION", agrement: "R 22 064 0001 0", email: "contact@exko.fr", telephone: "06 19 25 39 34", siteWeb: "www.exko.fr", dept: "64", lieux: "Itxassou (Mairie), Saint-Jean-le-Vieux (Lutxiborda), Saint-Palais (Maison Touza)", sourcePdf: PYR_ATL, maj: "09/07/2026" },
  { nom: "NEW ROAD – ATOUT POINT", agrement: "R 25 064 0002 0", email: "contact.atoutpoint@gmail.com", telephone: "01 40 86 57 44", dept: "64", lieux: "Lons (Brit Hôtel)", sourcePdf: PYR_ATL, maj: "09/07/2026" },
  { nom: "SENSIROUTE", agrement: "R 15 064 0005 0", email: "sensiroutebearn@gmail.com", telephone: "06 52 71 21 32", siteWeb: "https://sensiroute.com", dept: "64", lieux: "Moumour (circuit de conduite), Mourenx, Nay, Oloron-Sainte-Marie, Pau (Damalis, Ansaberre, Maison Ovale)", note: "Contact relevé pour le lieu SEE Les Graves à Oloron : info@cer-les-gaves.fr, 05 59 39 33 31", sourcePdf: PYR_ATL, maj: "09/07/2026" },
  { nom: "KLEVER – AQUITAINE DIALOGUE ROUTIER", agrement: "R 25 064 0003 0", email: "aquitainedial33@gmail.com", telephone: "06 87 47 38 49", dept: "64", lieux: "Oloron-Sainte-Marie (Hôtel Alysson)", sourcePdf: PYR_ATL, maj: "09/07/2026" },
  { nom: "ACBB — Automobile Club Basco Béarnais", agrement: "R 13 064 0008 0", email: "acbb2@wanadoo.fr", telephone: "05 59 11 08 00", dept: "64", lieux: "Pau (Centre Activa, 7 allées Catherine de Bourbon)", sourcePdf: PYR_ATL, maj: "09/07/2026" },
  { nom: "ZE PERMIS FORMATIONS", agrement: "R 26 064 0001 0", email: "formations@zepermis.com", telephone: "06 52 58 71 37", siteWeb: "https://www.zepermis.com", adresse: "35 rue du Valentin", codePostal: "64121", ville: "Serres-Castet", dept: "64", lieux: "Serres-Castet", sourcePdf: PYR_ATL, maj: "09/07/2026" },
];

// ─── 69 — RHÔNE ──────────────────────────────────────────
const RHONE_ROWS: CssrRow[] = [
  { nom: "5C PREVENTION", agrement: "R 16 069 0002 0", email: "direction.5cprevention@gmail.com", telephone: "06 52 74 38 07", dept: "69", lieux: "Décines-Charpieu (54 avenue Jean Jaurès)", note: "Second numéro : 06 85 79 73 17", sourcePdf: RHONE },
  { nom: "ACTIPOINTS L.", agrement: "R 21 069 0002 0", email: "aouadek2000@yahoo.fr", telephone: "07 61 44 26 82", dept: "69", lieux: "Saint-Fons (14 rue Louis Blanc)", sourcePdf: RHONE },
  { nom: "ACTI-ROUTE", agrement: "R 13 069 0004 0", telephone: "0800 861 866", dept: "69", lieux: "Lyon 7e (Auto-école Les Gones), Bron (Hôtel Kyriad), Tassin-la-Demi-Lune (Residhôtel), Villefranche-sur-Saône (La Cantalade)", sourcePdf: RHONE },
  { nom: "AUTOMOBILE CLUB ASSOCIATION", agrement: "R 13 069 0110", email: "gestion-stages@automobileclub.org", telephone: "06 32 38 02 82", dept: "69", lieux: "Lyon 2e (21 quai Jean Moulin), Villefranche-sur-Saône (114 bd Gambetta)", sourcePdf: RHONE },
  { nom: "AE2L FORMATIONS", agrement: "R 22 069 0001 0", dept: "69", lieux: "Lyon 7e (251 avenue Jean Jaurès)", sourcePdf: RHONE },
  { nom: "BARABAN AUTO-ECOLE", agrement: "R 20 069 0002 0", email: "grandclement@orange.fr", telephone: "04 78 33 18 33", dept: "69", lieux: "Saint-Priest (25 rue du Lyonnais)", sourcePdf: RHONE },
  { nom: "CARAVELLE AUTO-ECOLE", agrement: "R 23 069 0001 0", telephone: "04 72 02 10 10", dept: "69", lieux: "Genas (8 place Jean Jaurès)", sourcePdf: RHONE },
  { nom: "CENTRE DE CONDUITE DE SAINT-PRIEST", agrement: "R 13 069 0015 0", email: "c.c.s.p@wanadoo.fr", telephone: "04 78 20 90 89", dept: "69", lieux: "Corbas (Centre d'affaires Le Toro), Belleville-sur-Saône (Hôtel Charme Beaujolais)", sourcePdf: RHONE },
  { nom: "CER-V", agrement: "R 18 069 0001 0", email: "contact@cer-v.fr", telephone: "07 82 75 81 62", dept: "69", lieux: "Vénissieux (L'Orée du Parc, 20 rue Gambetta)", sourcePdf: RHONE },
  { nom: "E.C.F – C.E.S.R 69", agrement: "R 13 069 0001 0", telephone: "04 72 14 98 95", dept: "69", lieux: "Vaulx-en-Velin (55 bd des Droits de l'Homme)", sourcePdf: RHONE },
  { nom: "FRANCE STAGE PERMIS", agrement: "R 20 069 0001 0", telephone: "09 72 10 27 72", dept: "69", lieux: "Jonage (Hôtel Kyriad Lyon-Est), Limas (Hôtel Ambiance), Lyon 5e (Espace Ouest Lyonnais)", sourcePdf: RHONE },
  { nom: "GIRDEL", agrement: "R 15 069 0004 0", telephone: "04 78 61 61 76", dept: "69", lieux: "Lyon 7e (63 rue André Bollier)", sourcePdf: RHONE },
  { nom: "MARIETTON", agrement: "R 13 069 0009 0", telephone: "04 78 57 83 60", dept: "69", lieux: "Villeurbanne (26 cours Émile Zola), Vaugneray", sourcePdf: RHONE },
  { nom: "N.C.F", agrement: "R 13 069 0020 0", telephone: "04 78 00 68 10", dept: "69", lieux: "Lyon 7e (24 rue des Girondins)", note: "Second numéro : 0811 020 008", sourcePdf: RHONE },
  { nom: "NORMESSE FORMATION", agrement: "R 13 069 0021 0", telephone: "0811 02 00 08", dept: "69", lieux: "Lyon 7e (24 rue des Girondins), Villefranche-sur-Saône (Hôtel Le Newport)", sourcePdf: RHONE },
  { nom: "POINT PERMIS 69", agrement: "R 21 069 0003 0", telephone: "06 01 28 06 99", dept: "69", lieux: "Vaulx-en-Velin (F5 Foot Five, 33 rue Ernest Renan)", sourcePdf: RHONE },
  { nom: "POINT PLUS", agrement: "R 19 069 0001 0", dept: "69", lieux: "Limonest, Rillieux-la-Pape, Vaulx-en-Velin, Villeurbanne", sourcePdf: RHONE },
  { nom: "RECUP 4 POINTS PERMIS", agrement: "R 21 069 0001 0", telephone: "07 79 11 04 65", dept: "69", lieux: "Lyon 7e (Novotel Gerland), Lyon 3e (Campanile Berges du Rhône)", sourcePdf: RHONE },
  { nom: "UNYK'OM", agrement: "R 20 069 0003 0", telephone: "04 37 37 89 72", dept: "69", lieux: "Ternay (Site du Moulin, salle Jules Verne)", sourcePdf: RHONE },
];

export const REGIONS_ROWS: CssrRow[] = [
  ...LOT_GARONNE_ROWS,
  ...MORBIHAN_ROWS,
  ...PYR_ATL_ROWS,
  ...RHONE_ROWS,
];
