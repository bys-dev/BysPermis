/**
 * Adresses ajoutées à la main dans une campagne.
 *
 * Tout le pipeline d'envoi (liste figée, suivi, désinscription, rebonds)
 * s'appuie sur des fiches `Prospect`. Plutôt que de lui faire porter un second
 * type de destinataire, chaque adresse saisie est rattachée à une fiche :
 *
 *  - une fiche existante avec cette adresse est réutilisée ;
 *  - sinon une fiche minimale est créée, source « manuel », nom = l'adresse
 *    (le rendu des variables la traite comme un centre sans nom, cf.
 *    `buildProspectVariables`).
 *
 * La liste d'opposition prime : si **une** fiche portant l'adresse est
 * désinscrite, l'adresse est refusée — même si une autre fiche avec la même
 * adresse ne l'est pas — et aucune fiche n'est créée.
 */

import { prisma } from "@/lib/prisma";
import type { ProspectStatus } from "@/generated/prisma/client";
import { computeDedupeKey } from "./import";
import { buildAudienceWhere, type AudienceFilter } from "./campaign";
import { estAdresseValide, normaliserAdresse } from "./adresses";

/** Étiquette de provenance des fiches créées depuis l'éditeur de campagne. */
export const SOURCE_AJOUT_MANUEL = "manuel";

export interface AdresseManuelle {
  /** Fiche rattachée — `null` si l'adresse est refusée sans fiche existante. */
  id: string | null;
  email: string;
  nom: string;
  statut: ProspectStatus | null;
  /** Fiche créée par cet appel. */
  creee: boolean;
  /** Raison pour laquelle l'adresse ne recevra pas l'email, sinon `null`. */
  bloque: string | null;
  /** La fiche fait déjà partie du ciblage (critères ou sélection). */
  dejaCiblee: boolean;
}

type FicheLue = {
  id: string;
  nom: string;
  email: string | null;
  statut: ProspectStatus;
  emailValide: boolean;
  unsubscribedAt: Date | null;
  dedupeKey: string;
};

const SELECT_FICHE = {
  id: true,
  nom: true,
  email: true,
  statut: true,
  emailValide: true,
  unsubscribedAt: true,
  dedupeKey: true,
} as const;

function motifBlocage(fiche: FicheLue): string | null {
  if (fiche.unsubscribedAt || fiche.statut === "DESABONNE") {
    return "Désinscrit : ne recevra pas l'email";
  }
  if (!fiche.emailValide || fiche.statut === "INJOIGNABLE") {
    return "Adresse en erreur (rebond) : envoi impossible";
  }
  if (fiche.statut === "INSCRIT") return "Centre déjà inscrit sur le site : exclu des campagnes";
  return null;
}

/** Parmi les fiches du ciblage hors ajouts, lesquelles sont dans `ids` ? */
async function idsDejaCibles(ids: string[], filtre?: AudienceFilter): Promise<Set<string>> {
  if (!filtre || ids.length === 0) return new Set();
  const trouves = await prisma.prospect.findMany({
    where: { AND: [buildAudienceWhere({ ...filtre, ajoutsManuels: undefined }), { id: { in: ids } }] },
    select: { id: true },
  });
  return new Set(trouves.map((p) => p.id));
}

/**
 * Rattache des adresses saisies à des fiches prospect.
 *
 * `creer: false` n'écrit rien : les adresses inconnues reviennent avec
 * `id: null` (utile pour un contrôle préalable).
 */
export async function rattacherAdresses(params: {
  emails: string[];
  creer: boolean;
  userId?: string | null;
  filtre?: AudienceFilter;
}): Promise<{ adresses: AdresseManuelle[]; invalides: string[] }> {
  const invalides: string[] = [];
  const emails: string[] = [];
  for (const brute of params.emails) {
    const email = normaliserAdresse(brute);
    if (!estAdresseValide(email)) invalides.push(brute);
    else if (!emails.includes(email)) emails.push(email);
  }
  if (emails.length === 0) return { adresses: [], invalides };

  const fiches = await prisma.prospect.findMany({
    where: { email: { in: emails, mode: "insensitive" } },
    select: SELECT_FICHE,
  });
  const parAdresse = new Map<string, FicheLue[]>();
  for (const fiche of fiches) {
    const cle = (fiche.email ?? "").trim().toLowerCase();
    parAdresse.set(cle, [...(parAdresse.get(cle) ?? []), fiche]);
  }

  const resultats: AdresseManuelle[] = [];
  for (const email of emails) {
    const existantes = parAdresse.get(email) ?? [];
    // L'opposition exprimée sur n'importe quelle fiche vaut pour l'adresse.
    const desinscrite = existantes.find((f) => f.unsubscribedAt || f.statut === "DESABONNE");
    const choisie =
      desinscrite ??
      existantes.find((f) => f.dedupeKey === computeDedupeKey({ email, siret: null, nom: "", codePostal: null })) ??
      existantes.find((f) => !motifBlocage(f)) ??
      existantes[0];

    if (choisie) {
      resultats.push({
        id: choisie.id,
        email,
        nom: choisie.nom,
        statut: choisie.statut,
        creee: false,
        bloque: motifBlocage(choisie),
        dejaCiblee: false,
      });
      continue;
    }

    if (!params.creer) {
      resultats.push({ id: null, email, nom: email, statut: null, creee: false, bloque: null, dejaCiblee: false });
      continue;
    }

    // `upsert` sur la clé de déduplication : deux ajouts simultanés de la même
    // adresse ne créent qu'une fiche.
    const dedupeKey = computeDedupeKey({ email, siret: null, nom: email, codePostal: null });
    const fiche = await prisma.prospect.upsert({
      where: { dedupeKey },
      create: {
        nom: email,
        email,
        source: SOURCE_AJOUT_MANUEL,
        dedupeKey,
        raw: { ajoutManuel: true, ajoutePar: params.userId ?? null, ajouteLe: new Date().toISOString() },
      },
      update: {},
      select: SELECT_FICHE,
    });
    resultats.push({
      id: fiche.id,
      email,
      nom: fiche.nom,
      statut: fiche.statut,
      creee: true,
      bloque: motifBlocage(fiche),
      dejaCiblee: false,
    });
  }

  const dejaCibles = await idsDejaCibles(
    resultats.flatMap((r) => (r.id && !r.bloque ? [r.id] : [])),
    params.filtre,
  );
  for (const r of resultats) r.dejaCiblee = !!r.id && dejaCibles.has(r.id);

  return { adresses: resultats, invalides };
}

/** Détail des fiches déjà ajoutées (réouverture d'une campagne enregistrée). */
export async function detaillerAjouts(ids: string[], filtre?: AudienceFilter): Promise<AdresseManuelle[]> {
  if (ids.length === 0) return [];
  const fiches = await prisma.prospect.findMany({ where: { id: { in: ids } }, select: SELECT_FICHE });
  const parId = new Map(fiches.map((f) => [f.id, f]));

  // Une désinscription peut concerner une autre fiche portant la même adresse.
  const adresses = fiches.flatMap((f) => (f.email ? [f.email.trim().toLowerCase()] : []));
  const desinscrites = new Set(
    (
      await prisma.prospect.findMany({
        where: {
          email: { in: adresses, mode: "insensitive" },
          OR: [{ unsubscribedAt: { not: null } }, { statut: "DESABONNE" }],
        },
        select: { email: true },
      })
    ).map((p) => (p.email ?? "").trim().toLowerCase()),
  );

  const dejaCibles = await idsDejaCibles(ids, filtre);
  return ids.flatMap((id) => {
    const f = parId.get(id);
    if (!f) return [];
    const email = (f.email ?? "").trim().toLowerCase();
    return [
      {
        id: f.id,
        email,
        nom: f.nom,
        statut: f.statut,
        creee: false,
        bloque: desinscrites.has(email) ? "Désinscrit : ne recevra pas l'email" : motifBlocage(f),
        dejaCiblee: dejaCibles.has(f.id),
      },
    ];
  });
}
