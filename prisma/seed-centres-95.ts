/**
 * seed-centres-95.ts
 * Centres agréés Val d'Oise (95) — Préfecture — Août 2016
 *
 * Usage : npm run seed:centres95
 *
 * Idempotent : vérifie agrementNumber avant création.
 * Email partagé entre plusieurs villes → même User, plusieurs Centres.
 */

import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const prisma = new (PrismaClient as any)({ adapter }) as InstanceType<typeof PrismaClient>;

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
  const cleaned = fullName.trim().replace(/^(Mme\.?\s+|M\.?\s+|Mr\.?\s+)/i, "").trim();
  const parts = cleaned.split(/\s+/);
  if (parts.length === 0) return { prenom: "", nom: "" };
  if (parts.length === 1) return { prenom: parts[0], nom: "" };
  return { prenom: parts[0], nom: parts.slice(1).join(" ") };
}

// ─── AUTH0 ───────────────────────────────────────────────────────────────────

async function getManagementToken(): Promise<string | null> {
  const domain = process.env.AUTH0_ISSUER_BASE_URL?.replace("https://", "") ?? process.env.AUTH0_DOMAIN;
  if (!domain || !process.env.AUTH0_MANAGEMENT_CLIENT_ID) return null;
  try {
    const res = await fetch(`https://${domain}/oauth/token`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        client_id: process.env.AUTH0_MANAGEMENT_CLIENT_ID,
        client_secret: process.env.AUTH0_MANAGEMENT_CLIENT_SECRET,
        audience: `https://${domain}/api/v2/`,
        grant_type: "client_credentials",
      }),
    });
    const data: { access_token?: string } = await res.json();
    return data.access_token ?? null;
  } catch {
    return null;
  }
}

async function createAuth0User(token: string, email: string, nom: string, prenom: string): Promise<string | null> {
  const domain = process.env.AUTH0_ISSUER_BASE_URL?.replace("https://", "") ?? process.env.AUTH0_DOMAIN;
  if (!domain) return null;
  try {
    const res = await fetch(`https://${domain}/api/v2/users`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        connection: "Username-Password-Authentication",
        email,
        password: DEFAULT_PASSWORD,
        name: `${prenom} ${nom}`.trim(),
        given_name: prenom,
        family_name: nom,
        email_verified: false,
        app_metadata: { role: "CENTRE_OWNER" },
      }),
    });

    if (res.status === 409) {
      const search = await fetch(
        `https://${domain}/api/v2/users-by-email?email=${encodeURIComponent(email)}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (search.ok) {
        const users: Array<{ user_id?: string }> = await search.json();
        return users[0]?.user_id ?? null;
      }
      return null;
    }
    if (!res.ok) {
      const err: { message?: string } = await res.json().catch(() => ({}));
      console.warn(`  [Auth0] Erreur ${email}:`, err.message ?? res.status);
      return null;
    }
    const user: { user_id?: string } = await res.json();
    return user.user_id ?? null;
  } catch (e) {
    console.warn(`  [Auth0] Exception ${email}:`, e);
    return null;
  }
}

// ─── DONNÉES 95 ──────────────────────────────────────────────────────────────

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
  lieuStage?: string;
}

const CENTRES_95: CentreEntry[] = [
  // ═══════════════════════════════════════════════════════════════════
  // ARGENTEUIL
  // ═══════════════════════════════════════════════════════════════════
  {
    nom: "SOS PERMIS",
    agrement: "R1309500020",
    responsable: "M. Cyrille Casellas",
    email: "accueil@sospermis.com",
    telephone: "01 60 34 46 53",
    adresse: "Hôtel KYRIAD, 35 boulevard du Général Leclerc",
    codePostal: "95100",
    ville: "ARGENTEUIL",
    siteWeb: "www.sos-permis.com",
    departement: "95",
    lieuStage: "Hôtel KYRIAD, 35 boulevard du Général Leclerc, 95100 ARGENTEUIL",
  },
  {
    nom: "ASCUR (95)",
    agrement: "R1309500100",
    responsable: "M. Responsable Ascur",
    email: "ascur@ascur.fr",
    telephone: "01 47 45 26 49",
    adresse: "Hôtel KYRIAD, 35 boulevard du Général Leclerc",
    codePostal: "95100",
    ville: "ARGENTEUIL",
    siteWeb: "www.ascur.fr",
    departement: "95",
    lieuStage: "Hôtel KYRIAD, 35 boulevard du Général Leclerc, 95100 ARGENTEUIL",
  },
  {
    nom: "ACTI ROUTE (Argenteuil)",
    agrement: "R1309500140",
    responsable: "Joël POLTEAU",
    email: "info@actiroute.com",
    telephone: "0800 861 866",
    adresse: "Hôtel KYRIAD, 35 boulevard du Général Leclerc",
    codePostal: "95100",
    ville: "ARGENTEUIL",
    siteWeb: "www.actiroute.com",
    departement: "95",
    lieuStage: "Hôtel KYRIAD, 35 boulevard du Général Leclerc, 95100 ARGENTEUIL",
  },
  {
    nom: "A POINTS PLUS (95)",
    agrement: "R1309500180",
    responsable: "Guy VALLIN",
    email: "contact@a-points-plus.com",
    telephone: "01 39 69 33 12",
    adresse: "Hôtel KYRIAD, 35 boulevard du Général Leclerc",
    codePostal: "95100",
    ville: "ARGENTEUIL",
    siteWeb: "www.a-points-plus.com",
    departement: "95",
    lieuStage: "Hôtel KYRIAD, 35 boulevard du Général Leclerc, 95100 ARGENTEUIL",
  },
  {
    nom: "ABC POINTS (Argenteuil)",
    agrement: "R1309500210",
    responsable: "Patricia NOEL",
    email: "pnoel@abcpoints.fr",
    telephone: "09 50 92 22 22",
    adresse: "Hôtel KYRIAD, 35 boulevard du Général Leclerc",
    codePostal: "95100",
    ville: "ARGENTEUIL",
    siteWeb: "www.abcpoints.fr",
    departement: "95",
    lieuStage: "Hôtel KYRIAD, 35 boulevard du Général Leclerc, 95100 ARGENTEUIL",
  },
  {
    nom: "ID STAGES (Argenteuil)",
    agrement: "R1609500010",
    responsable: "M. Directeur ID Stages",
    email: "contact@idstages.fr",
    telephone: "04 65 26 00 71",
    adresse: "Hôtel KYRIAD, 35 boulevard du Général Leclerc",
    codePostal: "95100",
    ville: "ARGENTEUIL",
    departement: "95",
    lieuStage: "Hôtel KYRIAD, 35 boulevard du Général Leclerc, 95100 ARGENTEUIL",
  },
  {
    nom: "SARL MERIT Formation",
    agrement: "R1309500230",
    responsable: "M. Directeur Merit",
    email: "meritformation@gmail.com",
    telephone: "06 51 88 11 47",
    adresse: "16-18 rue Ambroise Croizat",
    codePostal: "95100",
    ville: "ARGENTEUIL",
    departement: "95",
    lieuStage: "16-18 rue Ambroise Croizat, 95100 ARGENTEUIL",
  },

  // ═══════════════════════════════════════════════════════════════════
  // BEZONS
  // ═══════════════════════════════════════════════════════════════════
  {
    nom: "SOS PERMIS (Bezons)",
    agrement: "R1309500020B",
    responsable: "M. Cyrille Casellas",
    email: "accueil@sospermis.com",
    telephone: "01 60 34 46 53",
    adresse: "Confort Hôtel, 80 avenue Gabriel Péri",
    codePostal: "95870",
    ville: "BEZONS",
    siteWeb: "www.sos-permis.com",
    departement: "95",
    lieuStage: "Confort Hôtel, 80 avenue Gabriel Péri, 95870 BEZONS",
  },
  {
    nom: "ALERTE AUX POINTS (Bezons)",
    agrement: "R1309500050B",
    responsable: "David COHEN",
    email: "contact@alerteauxpoints.fr",
    telephone: "01 45 67 83 85",
    adresse: "Hôtel KYRIAD BEZONS LA DEFENSE, 80 avenue Auguste Perret",
    codePostal: "95870",
    ville: "BEZONS",
    siteWeb: "www.alerteauxpoints.fr",
    departement: "95",
    lieuStage: "Hôtel KYRIAD BEZONS LA DEFENSE, 80 avenue Auguste Perret, 95870 BEZONS",
  },

  // ═══════════════════════════════════════════════════════════════════
  // CERGY
  // ═══════════════════════════════════════════════════════════════════
  {
    nom: "SOS PERMIS (Cergy)",
    agrement: "R1309500020C",
    responsable: "M. Cyrille Casellas",
    email: "accueil@sospermis.com",
    telephone: "01 60 34 46 53",
    adresse: "Hôtel OLIVARIUS, 34 boulevard du Port",
    codePostal: "95000",
    ville: "CERGY",
    siteWeb: "www.sos-permis.com",
    departement: "95",
    lieuStage: "Hôtel OLIVARIUS, 34 boulevard du Port, 95000 CERGY",
  },
  {
    nom: "ALERTE AUX POINTS (Cergy)",
    agrement: "R1309500050C",
    responsable: "David COHEN",
    email: "contact@alerteauxpoints.fr",
    telephone: "01 45 67 83 85",
    adresse: "Hôtel LES BALLADINS, 6 les Linandes Pourpres",
    codePostal: "95000",
    ville: "CERGY",
    siteWeb: "www.alerteauxpoints.fr",
    departement: "95",
    lieuStage: "Hôtel LES BALLADINS, 6 les Linandes Pourpres, 95000 CERGY",
  },
  {
    nom: "ASCUR (Cergy)",
    agrement: "R1309500100C",
    responsable: "M. Responsable Ascur",
    email: "ascur@ascur.fr",
    telephone: "01 47 45 26 49",
    adresse: "Hôtel PREMIÈRE CLASSE, 3 avenue des Trois Fontaines",
    codePostal: "95000",
    ville: "CERGY",
    siteWeb: "www.ascur.fr",
    departement: "95",
    lieuStage: "Hôtel PREMIÈRE CLASSE, 3 avenue des Trois Fontaines, 95000 CERGY",
  },
  {
    nom: "SOLIDARITÉ ET JALONS POUR LE TRAVAIL",
    agrement: "R1309500120",
    responsable: "M. Directeur SJT",
    email: "sjt-cergy@sjt.com",
    telephone: "01 30 31 30 36",
    adresse: "Parvis de la Préfecture, Immeuble les Oréades",
    codePostal: "95000",
    ville: "CERGY",
    departement: "95",
    lieuStage: "Parvis de la Préfecture, Immeuble les Oréades, 95000 CERGY",
  },
  {
    nom: "AUTOMOBILE CLUB ASSOCIATION (Cergy)",
    agrement: "R1309500130",
    responsable: "Vincent CLEVENOT",
    email: "formation@automobileclub.org",
    telephone: "01 40 55 43 04",
    adresse: "Hôtel LES BALLADINS, 6 les Linandes Pourpres",
    codePostal: "95000",
    ville: "CERGY",
    siteWeb: "www.automobileclub.org",
    departement: "95",
    lieuStage: "Hôtel LES BALLADINS, 6 les Linandes Pourpres, 95000 CERGY",
  },
  {
    nom: "ACTI ROUTE (Cergy)",
    agrement: "R1309500140C",
    responsable: "Joël POLTEAU",
    email: "info@actiroute.com",
    telephone: "0800 861 866",
    adresse: "Hôtel CAMPANILE, Rue du Petit Albi",
    codePostal: "95800",
    ville: "CERGY-SAINT-CHRISTOPHE",
    siteWeb: "www.actiroute.com",
    departement: "95",
    lieuStage: "Hôtel CAMPANILE, Rue du Petit Albi, 95800 CERGY-SAINT-CHRISTOPHE",
  },
  {
    nom: "FLOBERT FORMATIONS (FS2R Cergy)",
    agrement: "R1309500170",
    responsable: "Jérôme FLOBERT",
    email: "jeromeflobert@yahoo.fr",
    telephone: "06 58 45 89 94",
    adresse: "Hôtel PREMIÈRE CLASSE, 3 avenue des Trois Fontaines",
    codePostal: "95000",
    ville: "CERGY",
    departement: "95",
    lieuStage: "Hôtel PREMIÈRE CLASSE, 3 avenue des Trois Fontaines, 95000 CERGY",
  },
  {
    nom: "ABC POINTS (Cergy)",
    agrement: "R1309500210C",
    responsable: "Patricia NOEL",
    email: "pnoel@abcpoints.fr",
    telephone: "09 50 92 22 22",
    adresse: "Hôtel PREMIÈRE CLASSE, 3 avenue des Trois Fontaines",
    codePostal: "95000",
    ville: "CERGY",
    siteWeb: "www.abcpoints.fr",
    departement: "95",
    lieuStage: "Hôtel PREMIÈRE CLASSE, 3 avenue des Trois Fontaines, 95000 CERGY",
  },
  {
    nom: "GROUPE FRANCEFORMA",
    agrement: "R1409500070",
    responsable: "M. Directeur Franceforma",
    email: "groupefranceforma@gmail.com",
    telephone: "06 25 55 56 46",
    adresse: "France WEEK END, 13 rue de Neuville",
    codePostal: "95000",
    ville: "CERGY",
    departement: "95",
    lieuStage: "France WEEK END, 13 rue de Neuville, 95000 CERGY",
  },
  {
    nom: "BOBILLOT AUTO ÉCOLE (Cergy)",
    agrement: "R1509500020",
    responsable: "Pascal AUGE",
    email: "cerbobillot@wanadoo.fr",
    telephone: "01 45 80 51 37",
    adresse: "Hôtel PREMIÈRE CLASSE, 3 avenue des Trois Fontaines",
    codePostal: "95000",
    ville: "CERGY",
    siteWeb: "www.cerbobillot.fr",
    departement: "95",
    lieuStage: "Hôtel PREMIÈRE CLASSE, 3 avenue des Trois Fontaines, 95000 CERGY",
  },
  {
    nom: "ID STAGES (Cergy)",
    agrement: "R1609500010C",
    responsable: "M. Directeur ID Stages",
    email: "contact@idstages.fr",
    telephone: "04 65 26 00 71",
    adresse: "Hôtel MERCURE, 3 allée des Chênes Emeraudes",
    codePostal: "95000",
    ville: "CERGY",
    departement: "95",
    lieuStage: "Hôtel MERCURE, 3 allée des Chênes Emeraudes, 95000 CERGY",
  },
  {
    nom: "ACTION RECUPERATION POINTS (Cergy)",
    agrement: "R1309500020AR",
    responsable: "Aïcha BANNA",
    email: "contact@actionrecuperationpoints.fr",
    telephone: "01 39 83 19 75",
    adresse: "Hôtel et Résidence LES BALLADINS, 3 rue des Chênes Emeraudes",
    codePostal: "95000",
    ville: "CERGY",
    departement: "95",
    lieuStage: "Hôtel et Résidence LES BALLADINS, 3 rue des Chênes Emeraudes, 95000 CERGY",
  },

  // ═══════════════════════════════════════════════════════════════════
  // DEUIL LA BARRE
  // ═══════════════════════════════════════════════════════════════════
  {
    nom: "INRI'S RECUP'POINTS",
    agrement: "R1509500040",
    responsable: "M. Directeur INRIS",
    email: "recup-points@autoecole-inris.com",
    telephone: "01 49 51 19 19",
    adresse: "E C 3 B, 3 bis rue Charles de Gaulle",
    codePostal: "95170",
    ville: "DEUIL LA BARRE",
    departement: "95",
    lieuStage: "E C 3 B, 3 bis rue Charles de Gaulle, 95170 DEUIL LA BARRE",
  },

  // ═══════════════════════════════════════════════════════════════════
  // ECOUEN
  // ═══════════════════════════════════════════════════════════════════
  {
    nom: "ACTI ROUTE (Ecouen)",
    agrement: "R1309500140E",
    responsable: "Joël POLTEAU",
    email: "info@actiroute.com",
    telephone: "0800 861 866",
    adresse: "Hôtel CAMPANILE, Laroute du Moulin, Route nationale 16",
    codePostal: "95440",
    ville: "ECOUEN",
    siteWeb: "www.actiroute.com",
    departement: "95",
    lieuStage: "Hôtel CAMPANILE, Route nationale 16, 95440 ECOUEN",
  },
  {
    nom: "YES PERMIS P P S R (Ecouen)",
    agrement: "R1409500040",
    responsable: "Guillaume DELAFOY",
    email: "guillaume.delafoy@gmail.com",
    telephone: "06 95 95 06 78",
    adresse: "Hôtel CAMPANILE PARIS NORD, La Croix Verte – RN 16",
    codePostal: "95440",
    ville: "ECOUEN",
    departement: "95",
    lieuStage: "Hôtel CAMPANILE PARIS NORD, La Croix Verte, 95440 ECOUEN",
  },

  // ═══════════════════════════════════════════════════════════════════
  // ENNERY
  // ═══════════════════════════════════════════════════════════════════
  {
    nom: "A M C COLLOT FORMATION",
    agrement: "R1309500040",
    responsable: "M. Directeur AMC Collot",
    email: "amc.formation@wanadoo.fr",
    telephone: "01 30 73 54 68",
    adresse: "21 Z.A. de la Chapelle Saint Antoine",
    codePostal: "95300",
    ville: "ENNERY",
    siteWeb: "www.collot-formation.com",
    departement: "95",
    lieuStage: "21 Z.A. de la Chapelle Saint Antoine, 95300 ENNERY",
  },

  // ═══════════════════════════════════════════════════════════════════
  // FRANCONVILLE
  // ═══════════════════════════════════════════════════════════════════
  {
    nom: "PRÉVENTION ROUTIÈRE FORMATION (Franconville)",
    agrement: "R1609500020",
    responsable: "Mme Responsable",
    email: "contact@actionrecuperationpoints.fr",
    telephone: "01 39 83 19 75",
    adresse: "CERMAT, 122 rue de la Station",
    codePostal: "95130",
    ville: "FRANCONVILLE",
    departement: "95",
    lieuStage: "CERMAT, 122 rue de la Station, 95130 FRANCONVILLE",
  },

  // ═══════════════════════════════════════════════════════════════════
  // GARGES LES GONESSE
  // ═══════════════════════════════════════════════════════════════════
  {
    nom: "BOBILLOT AUTO ÉCOLE (Garges)",
    agrement: "R1509500020G",
    responsable: "Pascal AUGE",
    email: "cerbobillot@wanadoo.fr",
    telephone: "01 45 80 51 37",
    adresse: "C E R Luther King, 187 avenue de Stalingrad",
    codePostal: "95140",
    ville: "GARGES LES GONESSE",
    siteWeb: "www.cerbobillot.fr",
    departement: "95",
    lieuStage: "C E R Luther King, 187 avenue de Stalingrad, 95140 GARGES LES GONESSE",
  },

  // ═══════════════════════════════════════════════════════════════════
  // GONESSE
  // ═══════════════════════════════════════════════════════════════════
  {
    nom: "ABC POINTS (Gonesse)",
    agrement: "R1309500210G",
    responsable: "Patricia NOEL",
    email: "pnoel@abcpoints.fr",
    telephone: "09 50 92 22 22",
    adresse: "Hôtel CAMPANILE, Gonesse Le Bourget, 14 rue Ampère",
    codePostal: "95500",
    ville: "GONESSE",
    siteWeb: "www.abcpoints.fr",
    departement: "95",
    lieuStage: "Hôtel CAMPANILE Gonesse Le Bourget, 14 rue Ampère, 95500 GONESSE",
  },
  {
    nom: "YES PERMIS P P S R (Gonesse)",
    agrement: "R1409500040G",
    responsable: "Guillaume DELAFOY",
    email: "guillaume.delafoy@gmail.com",
    telephone: "06 95 95 06 78",
    adresse: "Hôtel CAMPANILE LE BOURGET, 14 rue Ampère",
    codePostal: "95500",
    ville: "GONESSE",
    departement: "95",
    lieuStage: "Hôtel CAMPANILE LE BOURGET, 14 rue Ampère, 95500 GONESSE",
  },

  // ═══════════════════════════════════════════════════════════════════
  // GOUSSAINVILLE
  // ═══════════════════════════════════════════════════════════════════
  {
    nom: "SOS PERMIS (Goussainville)",
    agrement: "R1309500020GS",
    responsable: "M. Cyrille Casellas",
    email: "accueil@sospermis.com",
    telephone: "01 60 34 46 53",
    adresse: "Hôtel BAGATELLE, 2 rue Jean Monnet",
    codePostal: "95190",
    ville: "GOUSSAINVILLE",
    siteWeb: "www.sos-permis.com",
    departement: "95",
    lieuStage: "Hôtel BAGATELLE, 2 rue Jean Monnet, 95190 GOUSSAINVILLE",
  },

  // ═══════════════════════════════════════════════════════════════════
  // MONTMAGNY
  // ═══════════════════════════════════════════════════════════════════
  {
    nom: "ACTION RECUPERATION POINTS (Montmagny)",
    agrement: "R1609500020M",
    responsable: "Aïcha BANNA",
    email: "contact@actionrecuperationpoints.fr",
    telephone: "01 39 83 19 75",
    adresse: "Salle des Fêtes",
    codePostal: "95360",
    ville: "MONTMAGNY",
    departement: "95",
    lieuStage: "Salle des Fêtes, 95360 MONTMAGNY",
  },

  // ═══════════════════════════════════════════════════════════════════
  // PONTOISE
  // ═══════════════════════════════════════════════════════════════════
  {
    nom: "PRÉVENTION ROUTIÈRE FORMATION 95",
    agrement: "R1309500060",
    responsable: "Mme Annick BILLARD",
    email: "preventionroutiere95@wanadoo.fr",
    telephone: "01 30 32 75 23",
    adresse: "18 rue Thiers",
    codePostal: "95300",
    ville: "PONTOISE",
    departement: "95",
    lieuStage: "18 rue Thiers, 95300 PONTOISE",
  },

  // ═══════════════════════════════════════════════════════════════════
  // ROISSY EN FRANCE
  // ═══════════════════════════════════════════════════════════════════
  {
    nom: "ID STAGES (Roissy)",
    agrement: "R1609500010R",
    responsable: "M. Directeur ID Stages",
    email: "contact@idstages.fr",
    telephone: "04 65 26 00 71",
    adresse: "Hôtel CAMPANILE, Allée du Verger",
    codePostal: "95700",
    ville: "ROISSY EN FRANCE",
    departement: "95",
    lieuStage: "Hôtel CAMPANILE, Allée du Verger, 95700 ROISSY EN FRANCE",
  },

  // ═══════════════════════════════════════════════════════════════════
  // SAINT-GRATIEN
  // ═══════════════════════════════════════════════════════════════════
  {
    nom: "SOS PERMIS (Saint-Gratien)",
    agrement: "R1309500020SG",
    responsable: "M. Cyrille Casellas",
    email: "accueil@sospermis.com",
    telephone: "01 60 34 46 53",
    adresse: "Hôtel IBIS, 54 boulevard de la Gare",
    codePostal: "95210",
    ville: "SAINT-GRATIEN",
    siteWeb: "www.sos-permis.com",
    departement: "95",
    lieuStage: "Hôtel IBIS, 54 boulevard de la Gare, 95210 SAINT-GRATIEN",
  },
  {
    nom: "ID STAGES (Saint-Gratien)",
    agrement: "R1609500010SG",
    responsable: "M. Directeur ID Stages",
    email: "contact@idstages.fr",
    telephone: "04 65 26 00 71",
    adresse: "Hôtel IBIS, 54-56 boulevard de la GARE",
    codePostal: "95310",
    ville: "SAINT GRATIEN",
    departement: "95",
    lieuStage: "Hôtel IBIS, 54-56 boulevard de la GARE, 95310 SAINT GRATIEN",
  },

  // ═══════════════════════════════════════════════════════════════════
  // SAINT-OUEN-L'AUMONE
  // ═══════════════════════════════════════════════════════════════════
  {
    nom: "SOS PERMIS (Saint-Ouen-l'Aumone)",
    agrement: "R1309500020SO",
    responsable: "M. Cyrille Casellas",
    email: "accueil@sospermis.com",
    telephone: "01 60 34 46 53",
    adresse: "Hôtel LES BALLADINS, 4 allée des 3 Caravelles",
    codePostal: "95310",
    ville: "SAINT-OUEN-L'AUMONE",
    siteWeb: "www.sos-permis.com",
    departement: "95",
    lieuStage: "Hôtel LES BALLADINS, 4 allée des 3 Caravelles, 95310 SAINT-OUEN-L'AUMONE",
  },
  {
    nom: "ASSOCIATION AFTRAL",
    agrement: "R1309500240",
    responsable: "Delphine HERVE",
    email: "delphineherve@aft-iftim.com",
    telephone: "01 34 21 51 23",
    adresse: "Rue de la Patelle, Parc des Bellevues, BP 80295",
    codePostal: "95617",
    ville: "SAINT OUEN L'AUMONE",
    siteWeb: "www.aft-iftim.com",
    departement: "95",
    lieuStage: "Parc des Bellevues, 95617 SAINT OUEN L'AUMONE",
  },
  {
    nom: "CAM'S CORP",
    agrement: "R1409500050",
    responsable: "Mme MONORAL",
    email: "cmonoral@gmail.com",
    telephone: "06 71 17 97 43",
    adresse: "Hôtel LES BALLADINS, 4 allée des 3 Caravelles",
    codePostal: "95310",
    ville: "SAINT-OUEN-L'AUMONE",
    departement: "95",
    lieuStage: "Hôtel LES BALLADINS, 4 allée des 3 Caravelles, 95310 SAINT-OUEN-L'AUMONE",
  },

  // ═══════════════════════════════════════════════════════════════════
  // SAINT WITZ
  // ═══════════════════════════════════════════════════════════════════
  {
    nom: "ID STAGES (Saint Witz)",
    agrement: "R1609500010SW",
    responsable: "M. Directeur ID Stages",
    email: "contact@idstages.fr",
    telephone: "04 65 26 00 71",
    adresse: "Hôtel KYRIAD DESIGN ENZO, 1 rue du Petit Marais",
    codePostal: "95470",
    ville: "SAINT WITZ",
    departement: "95",
    lieuStage: "Hôtel KYRIAD DESIGN ENZO, 1 rue du Petit Marais, 95470 SAINT WITZ",
  },

  // ═══════════════════════════════════════════════════════════════════
  // SARCELLES
  // ═══════════════════════════════════════════════════════════════════
  {
    nom: "AUTO ' SCOOL",
    agrement: "R1309500010",
    responsable: "M. Directeur Auto Scool",
    email: "autoscool@free.fr",
    telephone: "01 34 12 03 30",
    adresse: "Hôtel LES BALLADINS, 1 rue du Père Heude",
    codePostal: "95200",
    ville: "SARCELLES",
    departement: "95",
    lieuStage: "Hôtel LES BALLADINS, 1 rue du Père Heude, 95200 SARCELLES",
  },
  {
    nom: "SOS PERMIS (Sarcelles)",
    agrement: "R1309500020SA",
    responsable: "M. Cyrille Casellas",
    email: "accueil@sospermis.com",
    telephone: "01 60 34 46 53",
    adresse: "Hôtel Résidence, 1 rue du Père Eude",
    codePostal: "95200",
    ville: "SARCELLES",
    siteWeb: "www.sos-permis.com",
    departement: "95",
    lieuStage: "Hôtel Résidence, 1 rue du Père Eude, 95200 SARCELLES",
  },
  {
    nom: "ABC POINTS (Sarcelles)",
    agrement: "R1309500210SA",
    responsable: "Patricia NOEL",
    email: "pnoel@abcpoints.fr",
    telephone: "09 50 92 22 22",
    adresse: "Hôtel IBIS, 12 avenue Auguste Perret",
    codePostal: "95200",
    ville: "SARCELLES",
    siteWeb: "www.abcpoints.fr",
    departement: "95",
    lieuStage: "Hôtel IBIS, 12 avenue Auguste Perret, 95200 SARCELLES",
  },

  // ═══════════════════════════════════════════════════════════════════
  // SOISY-SOUS-MONTMORENCY
  // ═══════════════════════════════════════════════════════════════════
  {
    nom: "AUTO ' SCOOL (Soisy)",
    agrement: "R1309500010SS",
    responsable: "M. Directeur Auto Scool",
    email: "autoscool@free.fr",
    telephone: "01 34 12 03 30",
    adresse: "18 avenue du Général de Gaulle",
    codePostal: "95230",
    ville: "SOISY-SOUS-MONTMORENCY",
    departement: "95",
    lieuStage: "18 avenue du Général de Gaulle, 95230 SOISY-SOUS-MONTMORENCY",
  },

  // ═══════════════════════════════════════════════════════════════════
  // SURVILLIERS
  // ═══════════════════════════════════════════════════════════════════
  {
    nom: "ID STAGES (Survilliers)",
    agrement: "R1609500010SV",
    responsable: "M. Directeur ID Stages",
    email: "contact@idstages.fr",
    telephone: "04 65 26 00 71",
    adresse: "NOVOTEL Survilliers St Witz, Autoroute A1 D 16",
    codePostal: "95470",
    ville: "SURVILLIERS",
    departement: "95",
    lieuStage: "NOVOTEL Survilliers St Witz, Autoroute A1 D 16, 95470 SURVILLIERS",
  },
];

// ─── MAIN ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log("\n🚀 Seed centres Val d'Oise (95)\n");

  const token = await getManagementToken();
  if (!token) console.warn("  [Auth0] Token non disponible — comptes DB uniquement");

  // Cache email → userId (évite doublons)
  const userCache = new Map<string, string>();

  let created = 0;
  let skipped = 0;
  let errors = 0;

  for (const c of CENTRES_95) {
    try {
      // Idempotence : skip si agrément déjà en base
      const existing = await prisma.centre.findFirst({ where: { agrementNumber: c.agrement } });
      if (existing) {
        console.log(`  [SKIP] ${c.nom} (${c.agrement}) — déjà en base`);
        skipped++;
        continue;
      }

      const { prenom, nom } = parseNomPrenom(c.responsable);

      // Trouver ou créer le User
      let userId = userCache.get(c.email);

      if (!userId) {
        // Chercher en DB
        const existingUser = await prisma.user.findUnique({ where: { email: c.email } });
        if (existingUser) {
          userId = existingUser.id;
          userCache.set(c.email, userId);
          console.log(`  [USER-EXIST] ${c.email} → réutilisé (${existingUser.nom})`);
        } else {
          // Créer Auth0 user
          let auth0Id: string | null = null;
          if (token) auth0Id = await createAuth0User(token, c.email, nom, prenom);

          // Créer User en DB (auth0Id obligatoire — fallback si Auth0 échoue)
          const newUser = await prisma.user.create({
            data: {
              email: c.email,
              nom: nom || prenom,
              prenom: prenom || nom,
              role: "CENTRE_OWNER",
              auth0Id: auth0Id ?? `placeholder-${Date.now()}-${Math.random().toString(36).slice(2)}`,
            },
          });
          userId = newUser.id;
          userCache.set(c.email, userId);
        }
      }

      // Générer slug unique
      let slug = slugify(c.nom);
      const slugExists = await prisma.centre.findFirst({ where: { slug } });
      if (slugExists) slug = `${slug}-${c.ville.toLowerCase().replace(/\s+/g, "-")}`;

      // Créer le Centre
      await prisma.centre.create({
        data: {
          userId,
          nom: c.nom,
          slug,
          ville: c.ville,
          adresse: c.adresse ?? "",
          codePostal: c.codePostal ?? "",
          telephone: c.telephone,
          email: c.email,
          siteWeb: c.siteWeb,
          agrementNumber: c.agrement,
          statut: "ACTIF",
          isActive: true,
          description: c.lieuStage ? `Lieu de stage : ${c.lieuStage}` : undefined,
        },
      });

      // Créer formation par défaut
      await prisma.formation.create({
        data: {
          centreId: (await prisma.centre.findFirst({ where: { agrementNumber: c.agrement } }))!.id,
          titre: "Stage de récupération de points",
          slug: `${slug}-recup-points`,
          description:
            "Stage agréé Ministère de l'Intérieur — récupération de 4 points sur le permis de conduire. 2 jours en présentiel.",
          duree: "2 jours",
          prix: 24900,
          modalite: "PRESENTIEL",
          isActive: true,
          isQualiopi: false,
          stageType: "VOLONTAIRE",
          pointsRecovered: 4,
        },
      });

      console.log(`✅ [${c.departement}] ${c.nom} — ${c.ville}`);
      created++;
    } catch (e) {
      console.error(`  ❌ ERREUR ${c.nom}:`, e);
      errors++;
    }
  }

  console.log(`
═══════════════════════════════════════════════════
  Créés  : ${created}
  Ignorés: ${skipped} (déjà en base)
  Erreurs: ${errors}
═══════════════════════════════════════════════════

Mot de passe de tous les comptes : ${DEFAULT_PASSWORD}
`);

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
