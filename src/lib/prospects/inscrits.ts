/**
 * Rapprochement prospects ↔ comptes du site.
 *
 * Un centre démarché qui finit par créer son compte — inscription publique,
 * demande partenaire, invitation par le staff — n'est plus un prospect : il ne
 * doit plus recevoir de relance commerciale. Ce module détecte ces cas, passe
 * la fiche en INSCRIT, la rattache au compte et neutralise ses envois encore
 * en attente dans les campagnes en cours.
 *
 * Deux voies, complémentaires :
 *   - `marquerProspectsInscrits` — à l'instant où un compte ou une demande est
 *     créé (appelé par les routes concernées) ;
 *   - `rapprocherProspectsInscrits` — balayage périodique (cron des campagnes,
 *     préparation d'une campagne) qui rattrape les comptes créés par un chemin
 *     non instrumenté, les fiches importées après la création du compte, ou
 *     un centre qui renseigne son SIRET / son email après coup.
 *
 * Le rapprochement se fait sur l'email (casse ignorée) et sur le SIRET.
 * Une fiche n'est rapprochée automatiquement qu'une fois (`inscritAt`) : si le
 * staff la rouvre ensuite à la main, sa décision n'est pas écrasée au passage
 * suivant du cron. Une fiche DESABONNE n'est jamais touchée : l'opposition au
 * démarchage prime sur tout.
 */

import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/generated/prisma/client";

/** Motif posé sur les destinataires écartés d'une campagne en cours. */
export const MOTIF_COMPTE_CREE = "Compte créé sur le site";

export interface CompteDetecte {
  /** Emails connus du compte (connexion, centre, contact). La casse est ignorée. */
  emails?: (string | null | undefined)[];
  /** SIRET, avec ou sans espaces. */
  sirets?: (string | null | undefined)[];
  centreId?: string | null;
  partnerLeadId?: string | null;
}

/** Ce à quoi une fiche est rattachée une fois rapprochée. */
interface Liens {
  centreId: string | null;
  partnerLeadId: string | null;
}

const SELECT_CANDIDAT = {
  id: true,
  email: true,
  siret: true,
  statut: true,
  inscritAt: true,
  centreId: true,
  partnerLeadId: true,
} as const;

type Candidat = Prisma.ProspectGetPayload<{ select: typeof SELECT_CANDIDAT }>;

// ─── Normalisation ───────────────────────────────────────

export function normaliserEmail(value: string | null | undefined): string | null {
  const email = (value ?? "").trim().toLowerCase();
  return email.includes("@") ? email : null;
}

/**
 * Chiffres seuls, comme `cleanSiret` côté import. En dessous de 9 chiffres
 * (un SIREN), la valeur est trop courte pour identifier quoi que ce soit.
 */
export function normaliserSiret(value: string | null | undefined): string | null {
  const digits = (value ?? "").replace(/\D/g, "");
  return digits.length >= 9 ? digits : null;
}

function identifiants(compte: CompteDetecte): { emails: string[]; sirets: string[] } {
  const emails = new Set<string>();
  const sirets = new Set<string>();
  for (const e of compte.emails ?? []) {
    const n = normaliserEmail(e);
    if (n) emails.add(n);
  }
  for (const s of compte.sirets ?? []) {
    const n = normaliserSiret(s);
    if (n) sirets.add(n);
  }
  return { emails: [...emails], sirets: [...sirets] };
}

function whereCorrespondance(ids: { emails: string[]; sirets: string[] }): Prisma.ProspectWhereInput[] {
  const or: Prisma.ProspectWhereInput[] = [];
  if (ids.emails.length) or.push({ email: { in: ids.emails, mode: "insensitive" } });
  if (ids.sirets.length) or.push({ siret: { in: ids.sirets } });
  return or;
}

// ─── Application ─────────────────────────────────────────

/**
 * Passe les fiches en INSCRIT, les rattache et écarte leurs envois en attente.
 *
 * `partnerLeadId` est unique côté prospect : quand plusieurs fiches
 * correspondent à la même demande (l'une par email, l'autre par SIRET), seule
 * la première est rattachée — les autres passent tout de même en INSCRIT.
 */
async function appliquer(items: { prospect: Candidat; liens: Liens }[]): Promise<number> {
  if (items.length === 0) return 0;
  const now = new Date();

  const leadIds = [...new Set(items.map((i) => i.liens.partnerLeadId).filter((v): v is string => Boolean(v)))];
  const dejaLies = leadIds.length
    ? await prisma.prospect.findMany({
        where: { partnerLeadId: { in: leadIds } },
        select: { partnerLeadId: true },
      })
    : [];
  const leadsPris = new Set(dejaLies.map((d) => d.partnerLeadId));

  for (const { prospect, liens } of items) {
    const data: Prisma.ProspectUncheckedUpdateInput = {
      statut: "INSCRIT",
      // On garde la date de la première détection.
      inscritAt: prospect.inscritAt ?? now,
    };
    if (liens.centreId && !prospect.centreId) data.centreId = liens.centreId;
    if (liens.partnerLeadId && !prospect.partnerLeadId && !leadsPris.has(liens.partnerLeadId)) {
      data.partnerLeadId = liens.partnerLeadId;
      leadsPris.add(liens.partnerLeadId);
    }
    await prisma.prospect.update({ where: { id: prospect.id }, data });
  }

  // Listes figées des campagnes en cours : l'envoi n'a pas encore eu lieu, on
  // l'annule. Ce qui est déjà parti reste dans l'historique.
  await prisma.campaignRecipient.updateMany({
    where: { prospectId: { in: items.map((i) => i.prospect.id) }, status: "EN_ATTENTE" },
    data: { status: "IGNORE", error: MOTIF_COMPTE_CREE },
  });

  return items.length;
}

// ─── Voie immédiate ──────────────────────────────────────

/**
 * À appeler dès qu'un compte centre ou une demande partenaire est créé.
 *
 * Rapproche toutes les fiches correspondantes, y compris une fiche que le staff
 * aurait rouverte : la création d'un compte est un événement nouveau, qui
 * justifie de la sortir à nouveau des relances.
 */
export async function marquerProspectsInscrits(compte: CompteDetecte): Promise<{ marques: number }> {
  const or = whereCorrespondance(identifiants(compte));
  if (or.length === 0) return { marques: 0 };

  const candidats = await prisma.prospect.findMany({
    where: { OR: or, statut: { not: "DESABONNE" } },
    select: SELECT_CANDIDAT,
  });

  const liens: Liens = { centreId: compte.centreId ?? null, partnerLeadId: compte.partnerLeadId ?? null };
  const marques = await appliquer(candidats.map((prospect) => ({ prospect, liens })));
  return { marques };
}

// ─── Voie périodique ─────────────────────────────────────

/**
 * Balaye le fichier : toute fiche jamais évaluée dont l'email ou le SIRET
 * correspond à un centre (ou, à défaut, à une demande partenaire) est rapprochée.
 *
 * Les centres priment sur les demandes : un compte réel est un rattachement
 * plus fort qu'un formulaire. Peu coûteux — trois lectures et rien d'autre
 * quand il n'y a rien à faire — donc appelable à chaque passage du cron.
 */
export async function rapprocherProspectsInscrits(): Promise<{ marques: number }> {
  const [centres, leads] = await Promise.all([
    prisma.centre.findMany({
      select: { id: true, email: true, siret: true, user: { select: { email: true } } },
    }),
    prisma.partnerLead.findMany({
      select: { id: true, email: true, contactEmail: true, siret: true },
    }),
  ]);

  const parEmail = new Map<string, Liens>();
  const parSiret = new Map<string, Liens>();
  const retenir = (map: Map<string, Liens>, cle: string | null, liens: Liens) => {
    if (cle && !map.has(cle)) map.set(cle, liens);
  };

  for (const c of centres) {
    const liens: Liens = { centreId: c.id, partnerLeadId: null };
    retenir(parEmail, normaliserEmail(c.email), liens);
    retenir(parEmail, normaliserEmail(c.user?.email), liens);
    retenir(parSiret, normaliserSiret(c.siret), liens);
  }
  for (const l of leads) {
    const liens: Liens = { centreId: null, partnerLeadId: l.id };
    retenir(parEmail, normaliserEmail(l.email), liens);
    retenir(parEmail, normaliserEmail(l.contactEmail), liens);
    retenir(parSiret, normaliserSiret(l.siret), liens);
  }

  const or = whereCorrespondance({ emails: [...parEmail.keys()], sirets: [...parSiret.keys()] });
  if (or.length === 0) return { marques: 0 };

  const candidats = await prisma.prospect.findMany({
    where: { OR: or, inscritAt: null, statut: { not: "DESABONNE" } },
    select: SELECT_CANDIDAT,
  });

  const items = candidats.flatMap((prospect) => {
    const liens =
      parEmail.get(normaliserEmail(prospect.email) ?? "") ?? parSiret.get(normaliserSiret(prospect.siret) ?? "");
    return liens ? [{ prospect, liens }] : [];
  });

  const marques = await appliquer(items);
  return { marques };
}
