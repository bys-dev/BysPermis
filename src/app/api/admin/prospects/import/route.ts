import { NextRequest, NextResponse } from "next/server";
import { requireCommercial, mapAuthError } from "@/lib/auth0";
import { rateLimit } from "@/lib/rate-limit";
import { parseProspectFile, normalizeRows, MAX_FILE_BYTES } from "@/lib/prospects/parse";
import { importProspects } from "@/lib/prospects/import";
import { FIELD_LABELS, PROSPECT_FIELDS, type ColumnMapping, type ProspectField } from "@/lib/prospects/fields";

/**
 * POST /api/admin/prospects/import
 *
 * Importe un fichier de prospects (.xlsx, .csv, .json).
 *
 * Corps : multipart/form-data
 *   - file      : le fichier (obligatoire)
 *   - dryRun    : "true" → analyse seule, aucune écriture (défaut : true)
 *   - source    : étiquette de provenance appliquée aux lignes sans source
 *   - overwrite : "true" → les valeurs du fichier remplacent celles en base
 *   - mapping   : JSON { "En-tête fichier": "champProspect" | null } pour
 *                 corriger à la main le mappage deviné
 *
 * Le parcours attendu est en deux temps : un premier appel en `dryRun` affiche
 * le mappage détecté, les compteurs et les lignes rejetées ; l'utilisateur
 * corrige le mappage si besoin, puis relance avec `dryRun=false`.
 */
export async function POST(req: NextRequest) {
  try {
    const limited = rateLimit(req, { max: 10, windowMs: 60 * 1000, keyPrefix: "prospects-import" });
    if (limited) return limited;

    const user = await requireCommercial();

    const contentType = req.headers.get("content-type") ?? "";
    if (!contentType.includes("multipart/form-data")) {
      return NextResponse.json(
        { error: "Envoyez le fichier en multipart/form-data (champ « file »)." },
        { status: 400 },
      );
    }

    const formData = await req.formData();
    const file = formData.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Fichier manquant." }, { status: 400 });
    }
    if (file.size === 0) {
      return NextResponse.json({ error: "Le fichier est vide." }, { status: 400 });
    }
    if (file.size > MAX_FILE_BYTES) {
      return NextResponse.json(
        { error: `Fichier trop volumineux (max ${Math.round(MAX_FILE_BYTES / 1024 / 1024)} Mo).` },
        { status: 413 },
      );
    }

    const dryRun = (formData.get("dryRun") ?? "true").toString() !== "false";
    const overwrite = (formData.get("overwrite") ?? "false").toString() === "true";
    const sourceRaw = formData.get("source");
    const source = typeof sourceRaw === "string" && sourceRaw.trim() ? sourceRaw.trim().slice(0, 100) : null;

    // ── Parsing ──
    const buffer = Buffer.from(await file.arrayBuffer());
    let parsed;
    try {
      parsed = await parseProspectFile({ buffer, filename: file.name, mimeType: file.type });
    } catch (err) {
      // Erreur de format : c'est la faute du fichier, pas du serveur.
      return NextResponse.json(
        { error: err instanceof Error ? err.message : "Fichier illisible." },
        { status: 400 },
      );
    }

    // ── Mappage : celui de l'utilisateur prime sur la détection auto ──
    let mapping: ColumnMapping = parsed.mapping;
    const mappingRaw = formData.get("mapping");
    if (typeof mappingRaw === "string" && mappingRaw.trim()) {
      try {
        const override = JSON.parse(mappingRaw) as Record<string, string | null>;
        const valid: ColumnMapping = { ...parsed.mapping };
        for (const [column, field] of Object.entries(override)) {
          if (!(column in valid)) continue; // colonne inconnue du fichier
          if (field === null || field === "") {
            valid[column] = null;
          } else if ((PROSPECT_FIELDS as readonly string[]).includes(field)) {
            valid[column] = field as ProspectField;
          }
        }
        mapping = valid;
      } catch {
        return NextResponse.json({ error: "Le paramètre « mapping » n'est pas un JSON valide." }, { status: 400 });
      }
    }

    if (!Object.values(mapping).includes("nom") && !Object.values(mapping).includes("raisonSociale")) {
      return NextResponse.json(
        {
          error:
            "Aucune colonne ne correspond au nom du centre. Associez une colonne au champ « Nom du centre » avant d'importer.",
          headers: parsed.headers,
          mapping,
          champsDisponibles: PROSPECT_FIELDS.map((f) => ({ key: f, label: FIELD_LABELS[f] })),
        },
        { status: 422 },
      );
    }

    // ── Normalisation + import (ou simulation) ──
    const rows = normalizeRows({ rows: parsed.rows, mapping, defaultSource: source });

    const report = await importProspects(rows, {
      filename: file.name,
      format: parsed.format,
      source,
      mapping,
      importedById: user.id,
      overwrite,
      commit: !dryRun,
    });

    return NextResponse.json({
      dryRun,
      format: parsed.format,
      filename: file.name,
      headers: parsed.headers,
      mapping,
      champsDisponibles: PROSPECT_FIELDS.map((f) => ({ key: f, label: FIELD_LABELS[f] })),
      // Extrait pour que l'utilisateur vérifie visuellement le mappage.
      apercu: rows
        .filter((r) => r.input)
        .slice(0, 5)
        .map((r) => r.input),
      rapport: report,
    });
  } catch (err) {
    const authError = mapAuthError(err);
    if (authError) return authError;
    console.error("[POST /api/admin/prospects/import]", err);
    return NextResponse.json({ error: "Erreur lors de l'import." }, { status: 500 });
  }
}
