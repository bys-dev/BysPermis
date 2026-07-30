import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireCommercial, mapAuthError } from "@/lib/auth0";
import { countAudience, sampleAudience, type AudienceFilter } from "@/lib/prospects/campaign";

const FilterSchema = z.object({
  statuts: z
    .array(z.enum(["NOUVEAU", "A_CONTACTER", "CONTACTE", "RELANCE", "INTERESSE", "INSCRIT", "REFUSE", "INJOIGNABLE", "DESABONNE"]))
    .optional(),
  departements: z.array(z.string().max(5)).optional(),
  villes: z.array(z.string().max(120)).optional(),
  sources: z.array(z.string().max(100)).optional(),
  importIds: z.array(z.string()).optional(),
  scoreMin: z.number().int().min(0).max(100).optional(),
  exclureDejaContactes: z.boolean().optional(),
  exclureCampagneIds: z.array(z.string()).optional(),
  recherche: z.string().max(200).optional(),
});

/**
 * POST /api/admin/campagnes/audience
 *
 * Chiffre un ciblage avant d'enregistrer la campagne : combien de prospects
 * seront réellement contactés, et un échantillon pour vérifier de visu.
 *
 * Le compte renvoyé applique déjà les exclusions non négociables (désinscrits,
 * emails invalides) — c'est donc le nombre d'emails qui partiront, pas une
 * estimation optimiste.
 */
export async function POST(req: NextRequest) {
  try {
    await requireCommercial();

    const body = await req.json().catch(() => ({}));
    const parsed = FilterSchema.safeParse(body?.filtre ?? body ?? {});
    if (!parsed.success) {
      return NextResponse.json({ error: "Filtre invalide", details: parsed.error.flatten() }, { status: 400 });
    }

    const filtre = parsed.data as AudienceFilter;
    const [total, echantillon] = await Promise.all([countAudience(filtre), sampleAudience(filtre, 10)]);

    return NextResponse.json({ total, echantillon });
  } catch (err) {
    const authError = mapAuthError(err);
    if (authError) return authError;
    console.error("[POST /api/admin/campagnes/audience]", err);
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}
