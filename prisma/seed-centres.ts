/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * seed-centres.ts
 * Crée les comptes centres depuis les listes officielles :
 *   - Paris (75) — Préfecture de Police
 *   - Hauts-de-Seine (92)
 *
 * Usage : npm run seed:centres
 *
 * Ce script est idempotent : il vérifie l'email avant de créer.
 * Les comptes Auth0 sont créés si AUTH0_MANAGEMENT_CLIENT_ID est disponible.
 */

import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new (PrismaClient as any)({ adapter }) as InstanceType<typeof PrismaClient>;

// ─── MOT DE PASSE UNIQUE ─────────────────────────────────────────────────────
const DEFAULT_PASSWORD = process.env.SEED_PASSWORD ?? "BYS2026!";

// ─── UTILS ───────────────────────────────────────────────────────────────────

function slugify(str: string): string {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function parseNomPrenom(fullName: string): { prenom: string; nom: string } {
  const cleaned = fullName
    .trim()
    .replace(/^(Mme\.?\s+|M\.?\s+|Mr\.?\s+)/i, "")
    .trim();
  const parts = cleaned.split(/\s+/);
  if (parts.length === 0) return { prenom: "", nom: "" };
  if (parts.length === 1) return { prenom: parts[0], nom: "" };
  return { prenom: parts[0], nom: parts.slice(1).join(" ") };
}

// ─── AUTH0 ───────────────────────────────────────────────────────────────────

async function getManagementToken(): Promise<string | null> {
  const domain =
    process.env.AUTH0_ISSUER_BASE_URL?.replace("https://", "") ??
    process.env.AUTH0_DOMAIN;
  if (!domain || !process.env.AUTH0_MANAGEMENT_CLIENT_ID) return null;
  try {
    const res = await fetch(`https://${domain}/oauth/token`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        grant_type: "client_credentials",
        client_id: process.env.AUTH0_MANAGEMENT_CLIENT_ID,
        client_secret: process.env.AUTH0_MANAGEMENT_CLIENT_SECRET,
        audience: `https://${domain}/api/v2/`,
      }),
    });
    if (!res.ok) return null;
    const data: any = await res.json();
    return data.access_token ?? null;
  } catch {
    return null;
  }
}

async function createOrGetAuth0Id(
  email: string,
  name: string,
  token: string | null
): Promise<string | null> {
  if (!token) return null;
  const domain =
    process.env.AUTH0_ISSUER_BASE_URL?.replace("https://", "") ??
    process.env.AUTH0_DOMAIN;
  try {
    // Try to create
    const res = await fetch(`https://${domain}/api/v2/users`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        email,
        password: DEFAULT_PASSWORD,
        name,
        connection: "Username-Password-Authentication",
        email_verified: false,
        app_metadata: { role: "CENTRE_OWNER" },
      }),
    });

    if (res.status === 409) {
      // Already exists — fetch their id
      const search = await fetch(
        `https://${domain}/api/v2/users-by-email?email=${encodeURIComponent(email)}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (search.ok) {
        const users: any[] = await search.json();
        return users[0]?.user_id ?? null;
      }
      return null;
    }

    if (!res.ok) {
      const err: any = await res.json().catch(() => ({}));
      console.warn(`  [Auth0] Erreur création ${email}:`, err.message ?? res.status);
      return null;
    }

    const user: any = await res.json();
    return user.user_id ?? null;
  } catch (e) {
    console.warn(`  [Auth0] Exception pour ${email}:`, e);
    return null;
  }
}

// ─── DONNÉES ─────────────────────────────────────────────────────────────────

interface CentreEntry {
  nom: string;
  agrement: string;
  responsable: string;
  email: string;
  telephone?: string;
  adresse?: string;
  codePostal?: string;
  ville: string;
  siteWeb?: string;
  departement: string;
  /** Adresses des salles supplémentaires — mémorisées en description */
  lieux?: string[];
}

const CENTRES: CentreEntry[] = [
  // ══════════════════════════════════════════════════════════════════════════════
  // PARIS (75) — Préfecture de Police — mise à jour 3 septembre 2018
  // ══════════════════════════════════════════════════════════════════════════════

  {
    nom: "SAS IDStages",
    agrement: "R1607500020",
    responsable: "Hichem BEN ALI",
    email: "idstages@gmail.com",
    telephone: "04 65 26 00 71",
    adresse: "7 montée du Commandant de Robien Centre d'Affaire Valentine",
    codePostal: "13011",
    ville: "MARSEILLE",
    departement: "75",
    lieux: [
      "21 rue de Tolbiac - 75013 PARIS",
      "6 boulevard Vincent Auriol - 75013 PARIS",
      "6 avenue Maurice Ravel - 75012 PARIS",
      "17 boulevard Kellermann - 75013 PARIS",
      "14 rue du Théâtre - 75015 PARIS",
    ],
  },
  {
    nom: "ACTI ROUTE",
    agrement: "R1307500090",
    responsable: "Joël POLTEAU",
    email: "info@actiroute.com",
    telephone: "0800 861 866",
    adresse: "9 rue du docteur Chevallereau",
    codePostal: "85200",
    ville: "FONTENAY-LE-COMTE",
    siteWeb: "www.actiroute.com",
    departement: "75",
    lieux: [
      "127 avenue Ledru Rollin - 75011 PARIS",
      "11 rue Notre-Dame de Lorette - 75009 PARIS",
      "47 rue Falguière - 75015 PARIS",
      "10 Cité Joly - 75011 PARIS",
      "6 rue Lambert - 75015 PARIS",
    ],
  },
  {
    // Même responsable/email qu'ACTI ROUTE — sera créé sous le même User
    nom: "LARCCA",
    agrement: "R1807500010",
    responsable: "Joël POLTEAU",
    email: "info@actiroute.com",
    adresse: "9 rue du docteur Chevallereau",
    codePostal: "85200",
    ville: "FONTENAY-LE-COMTE",
    departement: "75",
    lieux: [
      "2 avenue du Professeur André Lemiere - 75020 PARIS",
    ],
  },
  {
    nom: "AUTOMOBILE CLUB ASSOCIATION",
    agrement: "R1307500160",
    responsable: "Didier BOLLECKER",
    email: "formation@automobileclub.org",
    telephone: "03 88 36 04 34",
    adresse: "38 avenue du Rhin",
    codePostal: "67100",
    ville: "STRASBOURG",
    siteWeb: "www.stage-points.fr",
    departement: "75",
    lieux: [
      "9 rue d'Artois - 75008 PARIS",
      "70 rue Jouffroy d'Abbans - 75017 PARIS",
    ],
  },
  {
    nom: "FS2R",
    agrement: "R1307500280",
    responsable: "Jérôme FLOBERT",
    email: "fornas2r@yahoo.fr",
    adresse: "2 allée Henri Langlois",
    codePostal: "78340",
    ville: "LES CLAYES-SOUS-BOIS",
    siteWeb: "www.fs2r.fr",
    departement: "75",
    lieux: ["316/322 rue de Belleville - 75020 PARIS"],
  },
  {
    nom: "ALERTE AUX POINTS",
    agrement: "R1307500100",
    responsable: "David COHEN",
    email: "contact@alerteauxpoints.fr",
    telephone: "01 45 67 83 85",
    adresse: "6 rue Mayet",
    codePostal: "75006",
    ville: "PARIS",
    siteWeb: "www.alerteauxpoints.fr",
    departement: "75",
  },
  {
    nom: "A.S.C.U.R",
    agrement: "R1307500130",
    responsable: "Makram HECHAIME",
    email: "ascur@ascur.fr",
    telephone: "01 47 45 26 49",
    adresse: "101 rue de Sèvres",
    codePostal: "75006",
    ville: "PARIS",
    siteWeb: "www.ascur.fr",
    departement: "75",
    lieux: ["10/18 rue des Terres au Curé - 75013 PARIS"],
  },
  {
    nom: "ICARE FORMATIONS",
    agrement: "R1307500060",
    responsable: "Xavier SAVIGNAC",
    email: "sarlicareformations@gmail.com",
    telephone: "01 45 58 25 31",
    adresse: "57-59 rue Lacordaire",
    codePostal: "75015",
    ville: "PARIS",
    siteWeb: "www.cer-icare.fr",
    departement: "75",
  },
  {
    nom: "C.E.R. BOBILLOT",
    agrement: "R1507500020",
    responsable: "Pascal AUGE",
    email: "cerbobillot@wanadoo.fr",
    telephone: "01 45 80 51 37",
    adresse: "41 rue Bobillot",
    codePostal: "75013",
    ville: "PARIS",
    siteWeb: "www.cerbobillot.fr",
    departement: "75",
    lieux: ["26 Avenue du Général Sarrail - Stade Jean Bouin - 75016 PARIS"],
  },
  {
    nom: "MONNIER",
    agrement: "R1307500010",
    responsable: "Béatrice MONNIER",
    email: "bea.monnier15@orange.fr",
    telephone: "06 60 54 13 65",
    adresse: "99 bis avenue du Général Leclerc",
    codePostal: "75014",
    ville: "PARIS",
    siteWeb: "www.stage-permis-paris.fr",
    departement: "75",
    lieux: ["9 passage Rimbaut - 75014 PARIS"],
  },
  {
    nom: "JAP MONTPARNASSE",
    agrement: "R1307500250",
    responsable: "Anne LIDESTRI",
    email: "contact@passersonpermis.fr",
    telephone: "01 56 54 03 24",
    adresse: "17 rue de l'arrivée",
    codePostal: "75015",
    ville: "PARIS",
    siteWeb: "www.passersonpermis.fr",
    departement: "75",
  },
  {
    nom: "TILLIER - FORMATIONS",
    agrement: "R1607500030",
    responsable: "Aïcha ZAROUALI",
    email: "tillier.formations@bbox.fr",
    telephone: "09 86 37 49 85",
    adresse: "30 rue Claude Tillier",
    codePostal: "75012",
    ville: "PARIS",
    departement: "75",
  },
  {
    nom: "E.C.F. DUPLEIX",
    agrement: "R1607500010",
    responsable: "Julien DHORDAIN",
    email: "recupoints@ecfparis15.fr",
    telephone: "01 45 79 13 24",
    adresse: "61 boulevard de Grenelle",
    codePostal: "75015",
    ville: "PARIS",
    departement: "75",
    lieux: [
      "47 rue Falguière - 75015 PARIS",
      "6-8 place de la Concorde - 75008 PARIS",
    ],
  },
  {
    nom: "ECOPSYCOM",
    agrement: "R1307500190",
    responsable: "Tahar KHLIFI",
    email: "contact@stagepermis.com",
    telephone: "01 46 64 10 10",
    adresse: "5 passage Marie Michel Bioret",
    codePostal: "92220",
    ville: "BAGNEUX",
    siteWeb: "www.stagepermis.com",
    departement: "75",
    lieux: ["17 boulevard Kellermann - 75013 PARIS"],
  },

  // ══════════════════════════════════════════════════════════════════════════════
  // HAUTS-DE-SEINE (92) — mise à jour 12/07/2024
  // ══════════════════════════════════════════════════════════════════════════════

  {
    nom: "+ 4 POINTS",
    agrement: "R2109200010",
    responsable: "Sami ATWAN",
    email: "plus4points@outlook.fr",
    telephone: "07 67 28 68 47",
    ville: "CLICHY",
    codePostal: "92110",
    departement: "92",
  },
  {
    nom: "4 POINTS EN PLUS",
    agrement: "R2309200050",
    responsable: "Bilel EL AYEB",
    email: "Cssrparis9@gmail.com",
    telephone: "06 27 01 55 32",
    ville: "GENNEVILLIERS",
    codePostal: "92230",
    departement: "92",
  },
  {
    nom: "ASSOCIATION ADHERE A LA SECURITE ROUTIERE",
    agrement: "R2409200020",
    responsable: "Véronique BENAZECH",
    email: "aasr1@laposte.net",
    telephone: "06 85 36 85 74",
    ville: "COLOMBES",
    codePostal: "92700",
    departement: "92",
  },
  {
    nom: "ABC POINTS",
    agrement: "R2109200050",
    responsable: "Patricia NOEL",
    email: "pnabcpoints@gmail.com",
    telephone: "06 25 37 48 59",
    ville: "ANTONY",
    codePostal: "92160",
    departement: "92",
    lieux: ["Issy-les-Moulineaux - 92130", "Nanterre - 92000"],
  },
  {
    nom: "ACTION RECUPERATION POINTS",
    agrement: "R1609200030",
    responsable: "Aïcha BANNA",
    email: "aicha-banna@hotmail.fr",
    telephone: "06 83 84 27 55",
    ville: "GENNEVILLIERS",
    codePostal: "92230",
    departement: "92",
  },
  {
    // Même email qu'ACTI ROUTE (75) — Centre 92 sous le même User
    nom: "ACTI ROUTE (92)",
    agrement: "R1209200010",
    responsable: "Joël POLTEAU",
    email: "info@actiroute.com",
    telephone: "02 51 50 07 72",
    ville: "NANTERRE",
    codePostal: "92000",
    siteWeb: "www.actiroute.com",
    departement: "92",
    lieux: [
      "Boulogne-Billancourt - 92100",
      "Rueil-Malmaison - 92500",
      "Antony - 92160",
      "Gennevilliers - 92230",
    ],
  },
  {
    // Même email qu'ALERTE AUX POINTS (75) — Centre 92 sous le même User
    nom: "ALERTE AUX POINTS (92)",
    agrement: "R1309200090",
    responsable: "David COHEN",
    email: "contact@alerteauxpoints.fr",
    telephone: "01 45 67 83 85",
    ville: "COLOMBES",
    codePostal: "92700",
    departement: "92",
  },
  {
    nom: "A POINTS PLUS",
    agrement: "R1309200150",
    responsable: "Guy VALLIN",
    email: "contact@a-points-plus.com",
    telephone: "06 42 01 42 69",
    ville: "LEVALLOIS-PERRET",
    codePostal: "92300",
    departement: "92",
    lieux: ["Nanterre-Paris la Défense - 92000"],
  },
  {
    nom: "AUTOMOBILE CLUB (92)",
    agrement: "R1409200060",
    responsable: "Vincent CLEVENOT",
    email: "stage@automobileclub.org",
    telephone: "03 88 36 04 34",
    ville: "CLAMART",
    codePostal: "92140",
    departement: "92",
  },
  {
    nom: "AUTO MOTO FORMATION CLICHY",
    agrement: "R1409200050",
    responsable: "Stéphane KANCEL",
    email: "gambettaformation@gmail.com",
    telephone: "01 47 30 42 80",
    ville: "CLICHY",
    codePostal: "92110",
    departement: "92",
  },
  {
    nom: "AVOSPOINTS",
    agrement: "R2309200010",
    responsable: "Kamel MAZARI",
    email: "avospoints.paris@gmail.com",
    telephone: "07 72 77 49 31",
    ville: "NANTERRE",
    codePostal: "92000",
    departement: "92",
  },
  {
    nom: "CER BOBILLOT (92)",
    agrement: "R1309200220",
    responsable: "Pascal AUGE",
    email: "mail@cerbobillot.fr",
    telephone: "01 45 80 51 37",
    ville: "ISSY-LES-MOULINEAUX",
    codePostal: "92130",
    departement: "92",
    lieux: ["Nanterre - 92000", "Clichy - 92110"],
  },
  {
    nom: "CFCT 92 IDF",
    agrement: "R2109200070",
    responsable: "Elie HADDAD",
    email: "cfct92idf@gmail.com",
    telephone: "06 66 09 32 93",
    ville: "SURESNES",
    codePostal: "92150",
    departement: "92",
  },
  {
    nom: "DRIVER CLEAN",
    agrement: "R2009200010",
    responsable: "Céline OIKNINE",
    email: "driverclean26@gmail.com",
    telephone: "06 18 97 31 41",
    ville: "NANTERRE",
    codePostal: "92000",
    departement: "92",
    lieux: ["Gennevilliers - 92230"],
  },
  {
    nom: "DROP ACADEMY",
    agrement: "R2309200060",
    responsable: "Karim KATI",
    email: "montrouge@dropacademy.fr",
    telephone: "01 88 75 05 55",
    ville: "MONTROUGE",
    codePostal: "92120",
    departement: "92",
  },
  {
    nom: "ECOPSYCOM (92)",
    agrement: "R1309200060",
    responsable: "Tahar KHLIFI",
    email: "tahar.khlifi@ecopsycom.com",
    telephone: "06 82 59 12 53",
    ville: "LEVALLOIS-PERRET",
    codePostal: "92300",
    departement: "92",
    lieux: ["Nanterre - 92000"],
  },
  {
    nom: "E-PERMIS",
    agrement: "R2309200030",
    responsable: "Abdel-Aziz HAMIDAOUI",
    email: "contact@epermis.net",
    telephone: "07 68 84 24 05",
    ville: "SAINT-CLOUD",
    codePostal: "92210",
    departement: "92",
    lieux: ["Colombes - 92700"],
  },
  {
    nom: "FORMAT-CONSEILS ATN",
    agrement: "R2309200070",
    responsable: "Aymen SOLTANI",
    email: "formatconseilatn@gmail.com",
    ville: "CLICHY",
    codePostal: "92110",
    departement: "92",
  },
  {
    nom: "FRANCE STAGE PERMIS",
    agrement: "R2109200040",
    responsable: "Hugo SPORTICH",
    email: "contact@francestagepermis.fr",
    telephone: "09 72 60 37 77",
    siteWeb: "www.francestagepermis.fr",
    ville: "RUEIL-MALMAISON",
    codePostal: "92500",
    departement: "92",
    lieux: ["Issy-les-Moulineaux - 92130", "Gennevilliers - 92230"],
  },
  {
    nom: "LA DEFENSE PERMIS",
    agrement: "R1309200210",
    responsable: "Chafick ZAOUI",
    email: "ladefensepermis92@hotmail.fr",
    telephone: "01 43 33 47 80",
    ville: "COURBEVOIE",
    codePostal: "92400",
    departement: "92",
  },
  {
    nom: "LA PREVENTION ROUTIERE",
    agrement: "R2309200020",
    responsable: "Annick BILLARD",
    email: "preventionroutiere92@wanadoo.fr",
    telephone: "01 44 15 27 00",
    ville: "GENNEVILLIERS",
    codePostal: "92230",
    departement: "92",
  },
  {
    nom: "MASTER CLASS 92",
    agrement: "R2309200040",
    responsable: "Johan JOSEPH",
    email: "mcl92600@gmail.com",
    telephone: "06 11 48 43 92",
    ville: "ASNIÈRES-SUR-SEINE",
    codePostal: "92600",
    departement: "92",
  },
  {
    nom: "PERMIS A À Z",
    agrement: "R1309200230",
    responsable: "Abderraman ZAOUI",
    email: "cergbc@gmail.com",
    telephone: "01 80 88 95 75",
    ville: "BOIS-COLOMBES",
    codePostal: "92270",
    departement: "92",
  },
  {
    nom: "RECUP D POINTS",
    agrement: "R2409200030",
    responsable: "Najate AIT OUNADAM",
    email: "recupdpoints@gmail.com",
    telephone: "06 12 37 87 77",
    ville: "CHAVILLE",
    codePostal: "92370",
    departement: "92",
    lieux: [
      "Antony - 92160",
      "Nanterre - 92000",
      "Boulogne-Billancourt - 92100",
      "Gennevilliers - 92230",
    ],
  },
  {
    nom: "SOS PERMIS",
    agrement: "R1409200030",
    responsable: "Cyrille CASELLAS",
    email: "contact@sos-permis.com",
    telephone: "06 61 98 65 42",
    siteWeb: "www.sos-permis.com",
    ville: "SURESNES",
    codePostal: "92150",
    departement: "92",
  },
  {
    nom: "SYBARITE FORMATION",
    agrement: "R2109200080",
    responsable: "Ludovic AUBERT",
    email: "Sybarite.formation@gmail.com",
    telephone: "07 69 28 98 58",
    ville: "MEUDON",
    codePostal: "92190",
    departement: "92",
  },
];

// ─── MAIN ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log("═══════════════════════════════════════════════════");
  console.log("  SEED CENTRES — BYS Permis");
  console.log(`  Mot de passe unique : ${DEFAULT_PASSWORD}`);
  console.log(`  Total entrées       : ${CENTRES.length}`);
  console.log("═══════════════════════════════════════════════════\n");

  // Try to get Auth0 token once
  const token = await getManagementToken();
  if (token) {
    console.log("Auth0 Management API connecté.\n");
  } else {
    console.log("Auth0 non disponible — comptes créés en DB uniquement (mode dev).\n");
  }

  // Cache: email → userId (évite de recréer le même User si email partagé)
  const userCache = new Map<string, string>();

  let created = 0;
  let skipped = 0;
  let errors = 0;

  for (const entry of CENTRES) {
    const emailLower = entry.email.toLowerCase().trim();
    const { prenom, nom } = parseNomPrenom(entry.responsable);
    const displayName = `${prenom} ${nom}`.trim();

    try {
      // ── 1. Skip centre if agrément already exists ──────────────────────────
      const existingCentre = await prisma.centre.findFirst({
        where: { agrementNumber: entry.agrement },
      });
      if (existingCentre) {
        console.log(`  [SKIP] ${entry.nom} (${entry.agrement}) — déjà en base`);
        skipped++;
        continue;
      }

      // ── 2. Find or create User ─────────────────────────────────────────────
      let userId: string;

      if (userCache.has(emailLower)) {
        userId = userCache.get(emailLower)!;
        console.log(`  [USER] ${emailLower} → réutilisation du compte existant`);
      } else {
        const existingUser = await prisma.user.findUnique({
          where: { email: emailLower },
        });

        if (existingUser) {
          userId = existingUser.id;
          userCache.set(emailLower, userId);
          console.log(`  [USER] ${emailLower} → compte DB existant`);
        } else {
          // Create Auth0 account
          const auth0Id = await createOrGetAuth0Id(emailLower, displayName, token);

          const newUser = await prisma.user.create({
            data: {
              auth0Id: auth0Id ?? `seed_${slugify(emailLower)}_${Date.now()}`,
              email: emailLower,
              prenom,
              nom,
              telephone: entry.telephone ?? null,
              role: "CENTRE_OWNER",
              emailVerified: false,
            },
          });
          userId = newUser.id;
          userCache.set(emailLower, userId);
          console.log(`  [USER] ${emailLower} → créé ${auth0Id ? "(Auth0 + DB)" : "(DB seulement)"}`);
        }
      }

      // ── 3. Build description with lieux ───────────────────────────────────
      let description: string | undefined;
      if (entry.lieux && entry.lieux.length > 0) {
        description = `Salles : ${entry.lieux.join(" | ")}`;
      }

      // ── 4. Generate unique slug ────────────────────────────────────────────
      const baseSlug = slugify(entry.nom);
      let slug = baseSlug;
      let attempt = 0;
      while (await prisma.centre.findUnique({ where: { slug } })) {
        attempt++;
        slug = `${baseSlug}-${attempt}`;
      }

      // ── 5. Create Centre ───────────────────────────────────────────────────
      const centre = await prisma.centre.create({
        data: {
          nom: entry.nom,
          slug,
          adresse: entry.adresse ?? "",
          codePostal: entry.codePostal ?? "",
          ville: entry.ville,
          telephone: entry.telephone ?? null,
          email: emailLower,
          siteWeb: entry.siteWeb ?? null,
          description,
          statut: "EN_ATTENTE",
          isActive: false,
          agrementNumber: entry.agrement,
          agrementDepartement: entry.departement,
          userId,
        },
      });

      // ── 6. Set activeCentreId if first centre for this user ────────────────
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user?.activeCentreId) {
        await prisma.user.update({
          where: { id: userId },
          data: { activeCentreId: centre.id },
        });
      }

      // ── 7. Welcome notification ────────────────────────────────────────────
      await prisma.notification.create({
        data: {
          titre: "Bienvenue sur BYS Permis",
          contenu: `Votre centre "${entry.nom}" a été créé. Complétez votre profil pour apparaître sur la marketplace.`,
          userId,
        },
      });

      console.log(`  [OK]   ${entry.nom} — ${entry.ville} (${entry.agrement})`);
      created++;
    } catch (err) {
      console.error(`  [ERR]  ${entry.nom}:`, err instanceof Error ? err.message : err);
      errors++;
    }
  }

  console.log("\n═══════════════════════════════════════════════════");
  console.log(`  Créés  : ${created}`);
  console.log(`  Ignorés: ${skipped} (déjà en base)`);
  console.log(`  Erreurs: ${errors}`);
  console.log("═══════════════════════════════════════════════════");
  console.log(`\nMot de passe de tous les comptes : ${DEFAULT_PASSWORD}`);
  console.log("Les centres peuvent changer leur mot de passe depuis /espace-centre/parametres");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
