/**
 * Persistance de la bibliothèque de modèles de prospection.
 *
 * Le catalogue de `modeles.ts` n'est qu'une amorce : dès qu'il est installé, la
 * table `prospect_email_templates` fait autorité et le staff y travaille
 * librement. La réinstallation s'appuie sur le `slug` — réimporter le catalogue
 * n'écrase donc jamais un modèle retouché, il ne fait que combler les manques.
 */

import { prisma } from "@/lib/prisma";
import { MODELES_EMAIL } from "./modeles";

/** Espacement des rangs : laisse la place d'intercaler un modèle sans tout renuméroter. */
const PAS_ORDRE = 10;

/**
 * Insère les modèles de base absents de la bibliothèque.
 * Idempotent : les slugs déjà présents sont ignorés, quel que soit leur contenu.
 * Renvoie le nombre de modèles réellement ajoutés.
 */
export async function installerModelesDeBase(createdById?: string | null): Promise<number> {
  const { count } = await prisma.prospectEmailTemplate.createMany({
    data: MODELES_EMAIL.map((m, index) => ({
      slug: m.id,
      nom: m.nom,
      moment: m.moment,
      objectif: m.objectif,
      sujet: m.sujet,
      contenu: m.contenu,
      filtreSuggere: m.filtreSuggere as unknown as object,
      delaiJours: m.delaiJours ?? null,
      ordre: index * PAS_ORDRE,
      createdById: createdById ?? null,
    })),
    skipDuplicates: true,
  });
  return count;
}

/**
 * Charge la bibliothèque, en l'amorçant au premier accès.
 *
 * L'installation paresseuse évite une étape d'administration manuelle en
 * production : le premier commercial qui ouvre l'écran trouve les modèles.
 * Elle ne se déclenche que sur une table vide — vider volontairement la
 * bibliothèque la réamorce, archiver ses modèles ne la réamorce pas.
 */
export async function listerModeles(opts: { avecArchives?: boolean } = {}) {
  const total = await prisma.prospectEmailTemplate.count();
  if (total === 0) await installerModelesDeBase();

  return prisma.prospectEmailTemplate.findMany({
    where: opts.avecArchives ? undefined : { isArchive: false },
    orderBy: [{ isArchive: "asc" }, { ordre: "asc" }, { nom: "asc" }],
    select: {
      id: true,
      slug: true,
      nom: true,
      moment: true,
      objectif: true,
      sujet: true,
      contenu: true,
      fromName: true,
      replyTo: true,
      filtreSuggere: true,
      delaiJours: true,
      ordre: true,
      isArchive: true,
      createdAt: true,
      updatedAt: true,
      createdBy: { select: { prenom: true, nom: true } },
    },
  });
}

/** Rang à donner à un nouveau modèle : à la suite des existants. */
export async function prochainOrdre(): Promise<number> {
  const dernier = await prisma.prospectEmailTemplate.findFirst({
    orderBy: { ordre: "desc" },
    select: { ordre: true },
  });
  return (dernier?.ordre ?? 0) + PAS_ORDRE;
}
