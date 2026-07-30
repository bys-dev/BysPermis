/**
 * Lecture d'un fichier de prospects (XLSX / CSV / JSON) et normalisation des
 * lignes vers des `ProspectInput` prêts à insérer.
 *
 * Le parsing est volontairement séparé de l'import (cf. `import.ts`) : l'API
 * expose une prévisualisation « à blanc » qui parse le fichier, montre le
 * mappage de colonnes deviné et les lignes rejetées, sans rien écrire en base.
 */

import type { ProspectImportFormat } from "@/generated/prisma/client";
import {
  autoMapColumns,
  normalizeHeader,
  type ColumnMapping,
  type ProspectField,
} from "./fields";

/** Une ligne brute du fichier : en-tête d'origine → valeur texte. */
export type RawRow = Record<string, string>;

export interface ParsedFile {
  format: ProspectImportFormat;
  headers: string[];
  rows: RawRow[];
  /** Mappage colonne → champ deviné automatiquement. */
  mapping: ColumnMapping;
}

export interface ProspectInput {
  nom: string;
  raisonSociale: string | null;
  siret: string | null;
  agrementNumber: string | null;
  agrementDepartement: string | null;
  email: string | null;
  telephone: string | null;
  siteWeb: string | null;
  adresse: string | null;
  codePostal: string | null;
  ville: string | null;
  departement: string | null;
  contactNom: string | null;
  contactPrenom: string | null;
  contactFonction: string | null;
  notesInternes: string | null;
  source: string | null;
  /** Ligne d'origine, conservée dans `Prospect.raw` pour audit. */
  raw: RawRow;
}

export interface RowResult {
  /** Numéro de ligne dans le fichier, en-tête comprise (1-based) — pour l'UI. */
  ligne: number;
  input?: ProspectInput;
  /** Motif de rejet : la ligne n'est pas importée. */
  motif?: string;
  /** Anomalies non bloquantes (email illisible, CP invalide…). */
  warnings: string[];
}

/** Garde-fou : au-delà, on refuse le fichier plutôt que de saturer la mémoire. */
export const MAX_ROWS = 50_000;
export const MAX_FILE_BYTES = 10 * 1024 * 1024; // 10 MB

// ─── Détection du format ─────────────────────────────────

export function detectFormat(filename: string, mimeType?: string | null): ProspectImportFormat | null {
  const ext = filename.toLowerCase().split(".").pop() ?? "";
  if (ext === "xlsx" || ext === "xlsm") return "XLSX";
  if (ext === "csv" || ext === "txt") return "CSV";
  if (ext === "json") return "JSON";

  // Repli sur le type MIME quand le nom de fichier ne dit rien.
  const mime = (mimeType ?? "").toLowerCase();
  if (mime.includes("spreadsheet") || mime.includes("excel")) return "XLSX";
  if (mime.includes("csv")) return "CSV";
  if (mime.includes("json")) return "JSON";
  // .xls binaire (BIFF) n'est pas lisible par exceljs — on l'écarte explicitement.
  return null;
}

// ─── XLSX ────────────────────────────────────────────────

/**
 * Aplati une valeur de cellule exceljs en texte.
 * Les cellules peuvent porter du texte riche, un lien hypertexte, une formule
 * (on prend son résultat), une date ou un nombre.
 */
function cellToString(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "string") return value.trim();
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (value instanceof Date) return value.toISOString().slice(0, 10);

  if (typeof value === "object") {
    const v = value as Record<string, unknown>;
    if (typeof v.text === "string") return v.text.trim();
    if (Array.isArray(v.richText)) {
      return v.richText
        .map((part) => (typeof (part as { text?: unknown }).text === "string" ? (part as { text: string }).text : ""))
        .join("")
        .trim();
    }
    if ("result" in v) return cellToString(v.result);
    if ("hyperlink" in v && typeof v.hyperlink === "string") return v.hyperlink.trim();
    if ("error" in v) return "";
  }
  return String(value).trim();
}

async function parseXlsx(buffer: Buffer): Promise<{ headers: string[]; rows: RawRow[] }> {
  // Import dynamique : exceljs est lourd et n'est utile que sur cette route.
  // exceljs est publié en CommonJS : selon le chargeur, ses classes arrivent sur
  // l'espace de noms ou uniquement sur `default`. On accepte les deux formes.
  const mod = await import("exceljs");
  const ExcelJS = (mod as unknown as { default?: typeof mod }).default ?? mod;
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer as unknown as ArrayBuffer);

  const sheet = workbook.worksheets.find((ws) => ws.rowCount > 0) ?? workbook.worksheets[0];
  if (!sheet) throw new Error("Le classeur ne contient aucune feuille exploitable.");

  // On cherche la première ligne non vide comme ligne d'en-têtes : les exports
  // administratifs commencent souvent par un titre et des lignes vides.
  let headerRowNumber = 0;
  let headers: string[] = [];
  for (let r = 1; r <= Math.min(sheet.rowCount, 20); r++) {
    const cells = sheet.getRow(r).values as unknown[];
    const values = Array.isArray(cells) ? cells.slice(1).map(cellToString) : [];
    const filled = values.filter((v) => v !== "");
    if (filled.length >= 2) {
      headerRowNumber = r;
      headers = values;
      break;
    }
  }
  if (!headerRowNumber) throw new Error("Aucune ligne d'en-têtes détectée dans le fichier.");

  headers = dedupeHeaders(headers);

  const rows: RawRow[] = [];
  for (let r = headerRowNumber + 1; r <= sheet.rowCount; r++) {
    const cells = sheet.getRow(r).values as unknown[];
    const values = Array.isArray(cells) ? cells.slice(1) : [];
    const row: RawRow = {};
    let hasValue = false;
    headers.forEach((header, i) => {
      if (!header) return;
      const text = cellToString(values[i]);
      row[header] = text;
      if (text !== "") hasValue = true;
    });
    if (hasValue) rows.push(row);
    if (rows.length > MAX_ROWS) break;
  }

  return { headers: headers.filter(Boolean), rows };
}

/** Deux colonnes homonymes casseraient l'objet ligne : on suffixe les doublons. */
function dedupeHeaders(headers: string[]): string[] {
  const seen = new Map<string, number>();
  return headers.map((h, i) => {
    const base = (h || "").trim() || `colonne_${i + 1}`;
    const count = seen.get(base) ?? 0;
    seen.set(base, count + 1);
    return count === 0 ? base : `${base} (${count + 1})`;
  });
}

// ─── CSV ─────────────────────────────────────────────────

/** Devine le séparateur sur la première ligne (Excel FR exporte en `;`). */
function sniffDelimiter(sample: string): string {
  const firstLine = sample.split(/\r?\n/, 1)[0] ?? "";
  const candidates = [";", ",", "\t", "|"];
  let best = ";";
  let bestCount = -1;
  for (const d of candidates) {
    const count = firstLine.split(d).length - 1;
    if (count > bestCount) {
      best = d;
      bestCount = count;
    }
  }
  return bestCount > 0 ? best : ";";
}

/**
 * Découpe un CSV en tableau de champs, en gérant les guillemets, les `""`
 * échappés et les retours à la ligne à l'intérieur d'un champ cité.
 */
function splitCsv(text: string, delimiter: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];

    if (inQuotes) {
      if (char === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += char;
      }
      continue;
    }

    if (char === '"') {
      inQuotes = true;
    } else if (char === delimiter) {
      row.push(field);
      field = "";
    } else if (char === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else if (char !== "\r") {
      field += char;
    }
  }
  if (field !== "" || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}

function parseCsv(buffer: Buffer): { headers: string[]; rows: RawRow[] } {
  // BOM UTF-8 retiré, sinon le premier en-tête devient « ﻿Nom ».
  const text = buffer.toString("utf8").replace(/^﻿/, "");
  if (!text.trim()) throw new Error("Le fichier CSV est vide.");

  const delimiter = sniffDelimiter(text);
  const matrix = splitCsv(text, delimiter).filter((r) => r.some((c) => c.trim() !== ""));
  if (matrix.length < 2) throw new Error("Le CSV doit contenir une ligne d'en-têtes et au moins une ligne de données.");

  const headers = dedupeHeaders(matrix[0].map((h) => h.trim()));
  const rows: RawRow[] = [];
  for (let i = 1; i < matrix.length && rows.length <= MAX_ROWS; i++) {
    const row: RawRow = {};
    headers.forEach((header, j) => {
      row[header] = (matrix[i][j] ?? "").trim();
    });
    rows.push(row);
  }
  return { headers, rows };
}

// ─── JSON ────────────────────────────────────────────────

function parseJson(buffer: Buffer): { headers: string[]; rows: RawRow[] } {
  let data: unknown;
  try {
    data = JSON.parse(buffer.toString("utf8").replace(/^﻿/, ""));
  } catch {
    throw new Error("JSON invalide : le fichier n'a pas pu être analysé.");
  }

  // On accepte un tableau nu ou un objet enveloppe { prospects | data | rows | items }.
  let list: unknown[];
  if (Array.isArray(data)) {
    list = data;
  } else if (data && typeof data === "object") {
    const obj = data as Record<string, unknown>;
    const wrapper = ["prospects", "data", "rows", "items", "results"].find((k) => Array.isArray(obj[k]));
    if (!wrapper) throw new Error("JSON inattendu : un tableau d'objets est requis (ou une clé « prospects »).");
    list = obj[wrapper] as unknown[];
  } else {
    throw new Error("JSON inattendu : un tableau d'objets est requis.");
  }

  if (list.length === 0) throw new Error("Le fichier JSON ne contient aucun enregistrement.");

  const headers: string[] = [];
  const rows: RawRow[] = [];

  for (const entry of list.slice(0, MAX_ROWS + 1)) {
    if (!entry || typeof entry !== "object" || Array.isArray(entry)) continue;
    const row: RawRow = {};
    for (const [key, value] of Object.entries(entry as Record<string, unknown>)) {
      if (value === null || value === undefined) {
        row[key] = "";
      } else if (typeof value === "object") {
        // Objets/tableaux imbriqués : non exploitables comme valeur de colonne.
        continue;
      } else {
        row[key] = String(value).trim();
      }
      if (!headers.includes(key)) headers.push(key);
    }
    if (Object.values(row).some((v) => v !== "")) rows.push(row);
  }

  if (rows.length === 0) throw new Error("Aucun objet exploitable trouvé dans le JSON.");
  return { headers, rows };
}

// ─── Entrée principale ───────────────────────────────────

export async function parseProspectFile(params: {
  buffer: Buffer;
  filename: string;
  mimeType?: string | null;
}): Promise<ParsedFile> {
  const { buffer, filename, mimeType } = params;

  if (buffer.byteLength > MAX_FILE_BYTES) {
    throw new Error(`Fichier trop volumineux (max ${Math.round(MAX_FILE_BYTES / 1024 / 1024)} Mo).`);
  }

  const format = detectFormat(filename, mimeType);
  if (!format) {
    throw new Error("Format non supporté. Utilisez un fichier .xlsx, .csv ou .json (le .xls ancien format doit être converti).");
  }

  const parsed =
    format === "XLSX" ? await parseXlsx(buffer) : format === "CSV" ? parseCsv(buffer) : parseJson(buffer);

  if (parsed.rows.length > MAX_ROWS) {
    throw new Error(`Fichier trop long (${parsed.rows.length} lignes, max ${MAX_ROWS}). Découpez-le en plusieurs imports.`);
  }

  return {
    format,
    headers: parsed.headers,
    rows: parsed.rows,
    mapping: autoMapColumns(parsed.headers),
  };
}

// ─── Normalisation des valeurs ───────────────────────────

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i;

export function cleanEmail(raw: string | null | undefined): { email: string | null; warning?: string } {
  const value = (raw ?? "").trim().toLowerCase();
  if (!value) return { email: null };
  // Certains fichiers listent plusieurs adresses dans une cellule : on garde la première.
  const first = value.split(/[;,/\s]+/).filter(Boolean)[0] ?? "";
  if (!EMAIL_RE.test(first)) return { email: null, warning: `Email illisible ignoré : « ${raw} »` };
  return { email: first };
}

export function cleanPhone(raw: string | null | undefined): string | null {
  const value = (raw ?? "").trim();
  if (!value) return null;
  // On conserve les chiffres et un éventuel indicatif international.
  const cleaned = value.replace(/[^\d+]/g, "");
  if (cleaned.replace(/\D/g, "").length < 6) return null;
  return cleaned;
}

export function cleanSiret(raw: string | null | undefined): string | null {
  const digits = (raw ?? "").replace(/\D/g, "");
  if (!digits) return null;
  return digits;
}

export function cleanWebsite(raw: string | null | undefined): string | null {
  const value = (raw ?? "").trim();
  if (!value) return null;
  if (/^https?:\/\//i.test(value)) return value;
  if (!/\./.test(value)) return null;
  return `https://${value.replace(/^\/+/, "")}`;
}

/**
 * Département à partir du code postal.
 * DOM/TOM sur 3 chiffres (971xx…978xx) ; la Corse reste « 20 » car 2A/2B ne
 * se déduisent pas du seul code postal.
 */
export function departementFromCodePostal(cp: string | null | undefined): string | null {
  const digits = (cp ?? "").replace(/\D/g, "");
  if (digits.length !== 5) return null;
  if (digits.startsWith("97") || digits.startsWith("98")) return digits.slice(0, 3);
  return digits.slice(0, 2);
}

function pick(row: RawRow, mapping: ColumnMapping, field: ProspectField): string | null {
  for (const [column, mapped] of Object.entries(mapping)) {
    if (mapped !== field) continue;
    const value = (row[column] ?? "").trim();
    if (value) return value;
  }
  return null;
}

/**
 * Transforme une ligne brute en `ProspectInput`.
 * Seule l'absence de nom rejette la ligne ; le reste produit des avertissements.
 */
export function normalizeRow(params: {
  row: RawRow;
  mapping: ColumnMapping;
  ligne: number;
  defaultSource?: string | null;
}): RowResult {
  const { row, mapping, ligne, defaultSource } = params;
  const warnings: string[] = [];

  const nom = pick(row, mapping, "nom") ?? pick(row, mapping, "raisonSociale");
  if (!nom) {
    return { ligne, motif: "Nom du centre absent", warnings };
  }

  const { email, warning: emailWarning } = cleanEmail(pick(row, mapping, "email"));
  if (emailWarning) warnings.push(emailWarning);

  const codePostal = pick(row, mapping, "codePostal");
  const cpDigits = (codePostal ?? "").replace(/\D/g, "");
  if (codePostal && cpDigits.length !== 5) {
    warnings.push(`Code postal invalide : « ${codePostal} »`);
  }

  const departement =
    pick(row, mapping, "departement")?.padStart(2, "0") ?? departementFromCodePostal(codePostal);

  return {
    ligne,
    warnings,
    input: {
      nom: nom.slice(0, 200),
      raisonSociale: pick(row, mapping, "raisonSociale"),
      siret: cleanSiret(pick(row, mapping, "siret")),
      agrementNumber: pick(row, mapping, "agrementNumber"),
      agrementDepartement: pick(row, mapping, "agrementDepartement"),
      email,
      telephone: cleanPhone(pick(row, mapping, "telephone")),
      siteWeb: cleanWebsite(pick(row, mapping, "siteWeb")),
      adresse: pick(row, mapping, "adresse"),
      codePostal: cpDigits.length === 5 ? cpDigits : codePostal,
      ville: pick(row, mapping, "ville"),
      departement,
      contactNom: pick(row, mapping, "contactNom"),
      contactPrenom: pick(row, mapping, "contactPrenom"),
      contactFonction: pick(row, mapping, "contactFonction"),
      notesInternes: pick(row, mapping, "notesInternes"),
      source: pick(row, mapping, "source") ?? defaultSource ?? null,
      raw: row,
    },
  };
}

/** Applique `normalizeRow` à tout un fichier parsé. */
export function normalizeRows(params: {
  rows: RawRow[];
  mapping: ColumnMapping;
  defaultSource?: string | null;
  /** Décalage de la ligne d'en-têtes pour que `ligne` colle au fichier réel. */
  headerOffset?: number;
}): RowResult[] {
  const offset = params.headerOffset ?? 1;
  return params.rows.map((row, i) =>
    normalizeRow({ row, mapping: params.mapping, ligne: i + 1 + offset, defaultSource: params.defaultSource }),
  );
}

export { normalizeHeader };
