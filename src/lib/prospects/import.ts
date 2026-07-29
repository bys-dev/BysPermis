/**
 * Import de prospects en base, avec déduplication.
 *
 * Un même centre revient d'une source à l'autre (liste préfectorale, annuaire,
 * saisie manuelle). On calcule donc une clé de déduplication stable et on
 * *enrichit* les fiches existantes au lieu de les dupliquer : un réimport de la
 * liste officielle mise à jour complète les fiches sans écraser le travail
 * commercial (statut, notes, opposition au démarchage).
 */

import { prisma } from "@/lib/prisma";
import type { ProspectImportFormat } from "@/generated/prisma/client";
import type { ColumnMapping } from "./fields";
import type { ProspectInput, RowResult } from "./parse";

/** Champs que l'import peut renseigner sur une fiche existante. */
const ENRICHABLE_FIELDS = [
  "raisonSociale",
  "siret",
  "agrementNumber",
  "agrementDepartement",
  "email",
  "telephone",
  "siteWeb",
  "adresse",
  "codePostal",
  "ville",
  "departement",
  "contactNom",
  "contactPrenom",
  "contactFonction",
] as const;

function slugForKey(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "")
    .slice(0, 60);
}

/**
 * Clé de déduplication, par ordre de fiabilité décroissante :
 *   1. email      — identifiant de contact, le plus discriminant
 *   2. SIRET      — identifie l'entité juridique
 *   3. nom + code postal — repli quand le fichier n'a ni email ni SIRET
 *
 * Le préfixe évite toute collision entre deux natures de clé.
 */
export function computeDedupeKey(input: Pick<ProspectInput, "email" | "siret" | "nom" | "codePostal">): string {
  if (input.email) return `email:${input.email.trim().toLowerCase()}`;
  if (input.siret) return `siret:${input.siret.replace(/\D/g, "")}`;
  const cp = (input.codePostal ?? "").replace(/\D/g, "");
  return `nom:${slugForKey(input.nom)}|cp:${cp}`;
}

export interface ImportOptions {
  filename: string;
  format: ProspectImportFormat;
  source?: string | null;
  mapping: ColumnMapping;
  importedById?: string | null;
  /**
   * true  → les valeurs du fichier remplacent celles en base.
   * false → on ne remplit que les champs vides (défaut : on n'écrase pas
   *         une donnée vérifiée par une donnée de fichier).
   */
  overwrite?: boolean;
  /** Si false, on ne fait que compter (aucune écriture). */
  commit?: boolean;
}

export interface ImportReport {
  importId: string | null;
  totalRows: number;
  nbCrees: number;
  nbMisAJour: number;
  nbIgnores: number;
  nbErreurs: number;
  erreurs: { ligne: number; motif: string }[];
  warnings: { ligne: number; motif: string }[];
  /** Doublons internes au fichier (même clé sur plusieurs lignes). */
  nbDoublonsFichier: number;
}

const CHUNK = 500;

function chunked<T>(items: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
  return out;
}

/**
 * Applique un lot de lignes normalisées.
 *
 * `commit: false` produit exactement le même rapport sans écrire — c'est ce que
 * consomme l'écran de prévisualisation avant validation.
 */
export async function importProspects(rows: RowResult[], options: ImportOptions): Promise<ImportReport> {
  const {
    filename,
    format,
    source = null,
    mapping,
    importedById = null,
    overwrite = false,
    commit = true,
  } = options;

  const erreurs = rows
    .filter((r) => r.motif)
    .map((r) => ({ ligne: r.ligne, motif: r.motif as string }));
  const warnings = rows.flatMap((r) => r.warnings.map((motif) => ({ ligne: r.ligne, motif })));

  // ── Déduplication interne au fichier : la première ligne gagne ──
  const byKey = new Map<string, ProspectInput>();
  let nbDoublonsFichier = 0;
  for (const row of rows) {
    if (!row.input) continue;
    const key = computeDedupeKey(row.input);
    if (byKey.has(key)) {
      nbDoublonsFichier++;
      continue;
    }
    byKey.set(key, row.input);
  }

  const report: ImportReport = {
    importId: null,
    totalRows: rows.length,
    nbCrees: 0,
    nbMisAJour: 0,
    nbIgnores: nbDoublonsFichier,
    nbErreurs: erreurs.length,
    erreurs: erreurs.slice(0, 200),
    warnings: warnings.slice(0, 200),
    nbDoublonsFichier,
  };

  const keys = [...byKey.keys()];

  // ── Quels prospects existent déjà ? ──
  const existing = new Map<string, ExistingProspect>();
  for (const part of chunked(keys, CHUNK)) {
    const found = await prisma.prospect.findMany({
      where: { dedupeKey: { in: part } },
      select: {
        id: true,
        dedupeKey: true,
        raisonSociale: true,
        siret: true,
        agrementNumber: true,
        agrementDepartement: true,
        email: true,
        telephone: true,
        siteWeb: true,
        adresse: true,
        codePostal: true,
        ville: true,
        departement: true,
        contactNom: true,
        contactPrenom: true,
        contactFonction: true,
      },
    });
    for (const p of found) existing.set(p.dedupeKey, p);
  }

  const toCreate: { key: string; input: ProspectInput }[] = [];
  const toUpdate: { id: string; data: Record<string, string> }[] = [];

  for (const [key, input] of byKey) {
    const current = existing.get(key);
    if (!current) {
      toCreate.push({ key, input });
      continue;
    }
    const data = diffEnrichment(current, input, overwrite);
    if (Object.keys(data).length > 0) {
      toUpdate.push({ id: current.id, data });
    } else {
      // Fiche déjà à jour : ni création ni modification.
      report.nbIgnores++;
    }
  }

  report.nbCrees = toCreate.length;
  report.nbMisAJour = toUpdate.length;

  if (!commit) return report;

  // ── Écriture ──
  const importRecord = await prisma.prospectImport.create({
    data: {
      filename,
      format,
      source,
      totalRows: rows.length,
      nbCrees: toCreate.length,
      nbMisAJour: toUpdate.length,
      nbIgnores: report.nbIgnores,
      nbErreurs: erreurs.length,
      erreurs: erreurs.slice(0, 500),
      mappage: mapping as unknown as object,
      importedById,
    },
    select: { id: true },
  });
  report.importId = importRecord.id;

  for (const part of chunked(toCreate, CHUNK)) {
    await prisma.prospect.createMany({
      data: part.map(({ key, input }) => ({
        dedupeKey: key,
        nom: input.nom,
        raisonSociale: input.raisonSociale,
        siret: input.siret,
        agrementNumber: input.agrementNumber,
        agrementDepartement: input.agrementDepartement,
        email: input.email,
        telephone: input.telephone,
        siteWeb: input.siteWeb,
        adresse: input.adresse,
        codePostal: input.codePostal,
        ville: input.ville,
        departement: input.departement,
        contactNom: input.contactNom,
        contactPrenom: input.contactPrenom,
        contactFonction: input.contactFonction,
        notesInternes: input.notesInternes,
        source: input.source ?? source,
        importId: importRecord.id,
        raw: input.raw,
      })),
      // Course possible entre deux imports simultanés sur la même clé.
      skipDuplicates: true,
    });
  }

  for (const part of chunked(toUpdate, 100)) {
    await Promise.all(
      part.map(({ id, data }) =>
        prisma.prospect.update({
          where: { id },
          // On ne touche jamais statut / notes / opposition : seules les
          // coordonnées sont enrichies.
          data: { ...data, importId: importRecord.id },
        }),
      ),
    );
  }

  return report;
}

type ExistingProspect = { id: string; dedupeKey: string } & Record<string, unknown>;

/**
 * Champs à écrire sur une fiche existante.
 * Mode enrichissement (défaut) : uniquement les champs vides en base.
 * Mode écrasement : toute valeur non vide du fichier.
 */
function diffEnrichment(
  current: ExistingProspect,
  input: ProspectInput,
  overwrite: boolean,
): Record<string, string> {
  const data: Record<string, string> = {};
  for (const field of ENRICHABLE_FIELDS) {
    const incoming = input[field];
    if (!incoming) continue;
    const existingValue = current[field];
    const isEmpty = existingValue === null || existingValue === undefined || existingValue === "";
    if (isEmpty || (overwrite && existingValue !== incoming)) {
      data[field] = incoming;
    }
  }
  return data;
}
