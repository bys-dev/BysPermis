import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireCommercial, mapAuthError } from "@/lib/auth0";
import { rateLimit } from "@/lib/rate-limit";
import { sendCampaignTest } from "@/lib/prospects/campaign";

const TestSchema = z.object({
  to: z.string().email("Adresse de test invalide"),
  prospectId: z.string().nullable().optional(),
});

/**
 * POST /api/admin/campagnes/[id]/test
 *
 * Envoie un exemplaire à une adresse interne, préfixé « [TEST] ».
 * N'incrémente aucun compteur et ne crée aucun destinataire : c'est une
 * vérification de rendu (client mail, images, liens), pas un envoi de campagne.
 */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const limited = rateLimit(req, { max: 10, windowMs: 60 * 1000, keyPrefix: "campagne-test" });
    if (limited) return limited;

    await requireCommercial();
    const { id } = await params;

    const parsed = TestSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Données invalides", details: parsed.error.flatten() }, { status: 400 });
    }

    await sendCampaignTest({ campaignId: id, to: parsed.data.to, prospectId: parsed.data.prospectId ?? null });

    return NextResponse.json({ success: true, message: `Email de test envoyé à ${parsed.data.to}.` });
  } catch (err) {
    const authError = mapAuthError(err);
    if (authError) return authError;
    const message = err instanceof Error ? err.message : "Erreur serveur.";
    if (message === "Campagne introuvable.") {
      return NextResponse.json({ error: message }, { status: 404 });
    }
    console.error("[POST /api/admin/campagnes/[id]/test]", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
