/**
 * Génère le classeur Excel de prospection à partir des listes préfectorales
 * transcrites (cf. `centres*.ts`).
 *
 * Deux contraintes dictent le format de sortie :
 *
 *  1. Les en-têtes reprennent exactement les libellés de `FIELD_LABELS`
 *     (src/lib/prospects/fields.ts) pour que l'import admin reconnaisse seul
 *     toutes les colonnes, sans mappage manuel.
 *  2. L'import déduplique sur l'email : un réseau national présent dans dix
 *     départements ne doit donc PAS produire dix lignes, sinon neuf sont
 *     silencieusement ignorées à l'import et l'information de couverture est
 *     perdue. On agrège donc ici une ligne par centre, en consolidant les
 *     départements et les lieux de stage dans les notes.
 *
 * Usage : npx tsx scripts/cssr/build-xlsx.ts
 */

import path from "path";
import { CSSR_ROWS, SOURCES } from "./centres";
import { REGIONS_ROWS } from "./centres-regions";
import { IDF_ROWS } from "./centres-idf";
import type { CssrRow } from "./types";

const ALL_ROWS: CssrRow[] = [...CSSR_ROWS, ...REGIONS_ROWS, ...IDF_ROWS];

/** Même logique que `computeDedupeKey` côté import, pour agréger à l'identique. */
function dedupeKey(row: CssrRow): string {
  if (row.email) return `email:${row.email.trim().toLowerCase()}`;
  const slug = row.nom
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "")
    .slice(0, 60);
  return `nom:${slug}|cp:${row.codePostal ?? ""}`;
}

interface Merged extends CssrRow {
  depts: string[];
  lieuxParDept: string[];
  sources: string[];
  notes: string[];
}

function merge(rows: CssrRow[]): Merged[] {
  const byKey = new Map<string, Merged>();

  for (const row of rows) {
    const key = dedupeKey(row);
    const current = byKey.get(key);

    if (!current) {
      byKey.set(key, {
        ...row,
        depts: [row.dept],
        lieuxParDept: row.lieux ? [`${row.dept} : ${row.lieux}`] : [],
        sources: [row.sourcePdf],
        notes: row.note ? [row.note] : [],
      });
      continue;
    }

    // Fiche déjà vue : on complète les champs vides, on n'écrase jamais.
    const fillable = [
      "agrement", "email", "telephone", "siteWeb", "adresse",
      "codePostal", "ville", "contactNom", "contactPrenom", "contactFonction",
    ] as const;
    for (const field of fillable) {
      if (!current[field] && row[field]) current[field] = row[field];
    }

    if (!current.depts.includes(row.dept)) current.depts.push(row.dept);
    if (row.lieux) current.lieuxParDept.push(`${row.dept} : ${row.lieux}`);
    if (!current.sources.includes(row.sourcePdf)) current.sources.push(row.sourcePdf);
    if (row.note && !current.notes.includes(row.note)) current.notes.push(row.note);
  }

  return [...byKey.values()].sort((a, b) => a.nom.localeCompare(b.nom, "fr"));
}

/** Notes internes : tout ce qui n'entre pas dans une colonne structurée. */
function buildNotes(m: Merged): string {
  const parts: string[] = [];
  if (m.depts.length > 1) {
    parts.push(`Agréé dans ${m.depts.length} départements : ${m.depts.join(", ")}`);
  }
  if (m.lieuxParDept.length > 0) {
    parts.push(`Lieux de stage — ${m.lieuxParDept.join(" | ")}`);
  }
  if (m.notes.length > 0) parts.push(...m.notes);
  parts.push(`Sources : ${m.sources.join(" ; ")}`);
  if (m.maj) parts.push(`MAJ liste : ${m.maj}`);
  return parts.join("\n");
}

const HEADERS = [
  "Nom du centre",
  "Raison sociale",
  "SIRET",
  "N° d'agrément",
  "Département d'agrément",
  "Email",
  "Téléphone",
  "Site web",
  "Adresse",
  "Code postal",
  "Ville",
  "Département",
  "Nom du contact",
  "Prénom du contact",
  "Fonction du contact",
  "Notes internes",
  "Source",
] as const;

async function main() {
  const merged = merge(ALL_ROWS);

  // Sous tsx (CJS), exceljs n'expose ses classes que via `default`.
  const mod = await import("exceljs");
  const ExcelJS = (mod as unknown as { default?: typeof mod }).default ?? mod;
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "BYS Permis";
  workbook.created = new Date(2026, 6, 30);

  const sheet = workbook.addWorksheet("Centres CSSR");
  sheet.addRow([...HEADERS]);

  for (const m of merged) {
    sheet.addRow([
      m.nom,
      "",
      "",
      m.agrement ?? "",
      m.depts.join(", "),
      m.email ?? "",
      m.telephone ?? "",
      m.siteWeb ?? "",
      m.adresse ?? "",
      m.codePostal ?? "",
      m.ville ?? "",
      m.depts[0],
      m.contactNom ?? "",
      m.contactPrenom ?? "",
      m.contactFonction ?? "",
      buildNotes(m),
      "Liste préfectorale CSSR",
    ]);
  }

  // Mise en forme : en-tête figée et lisible, colonnes dimensionnées.
  const header = sheet.getRow(1);
  header.font = { bold: true, color: { argb: "FFFFFFFF" } };
  header.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1D4ED8" } };
  header.alignment = { vertical: "middle" };
  header.height = 22;
  sheet.views = [{ state: "frozen", ySplit: 1 }];
  sheet.autoFilter = { from: "A1", to: "Q1" };

  const widths = [38, 18, 16, 22, 20, 34, 18, 30, 40, 12, 22, 14, 20, 18, 18, 70, 24];
  widths.forEach((w, i) => {
    sheet.getColumn(i + 1).width = w;
  });
  sheet.getColumn(16).alignment = { wrapText: true, vertical: "top" };

  // Feuille de traçabilité : quelle liste, quel département, quelle date.
  const meta = workbook.addWorksheet("Sources");
  meta.addRow(["Département", "Autorité", "Fichier PDF", "Mise à jour"]);
  meta.getRow(1).font = { bold: true };
  for (const s of SOURCES) meta.addRow([s.dept, s.label, s.pdf, s.maj]);
  [14, 38, 70, 16].forEach((w, i) => {
    meta.getColumn(i + 1).width = w;
  });

  const out = path.join(process.cwd(), "Centres CSSR - fichier de prospection.xlsx");
  await workbook.xlsx.writeFile(out);

  const avecEmail = merged.filter((m) => m.email).length;
  const avecTel = merged.filter((m) => m.telephone).length;
  const multiDept = merged.filter((m) => m.depts.length > 1).length;

  console.log(`Fichier écrit : ${out}`);
  console.log(`Lignes source (centre × département) : ${ALL_ROWS.length}`);
  console.log(`Centres uniques après agrégation     : ${merged.length}`);
  console.log(`  dont avec email                    : ${avecEmail}`);
  console.log(`  dont avec téléphone                : ${avecTel}`);
  console.log(`  dont présents sur plusieurs dépts  : ${multiDept}`);
  console.log(`Départements couverts                : ${SOURCES.length}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
