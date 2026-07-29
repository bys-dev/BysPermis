import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireCommercial, mapAuthError } from "@/lib/auth0";
import { renderCampaignEmail, validateCampaignTemplate } from "@/lib/prospects/template";

const ApercuSchema = z.object({
  sujet: z.string().max(300).default(""),
  contenu: z.string().max(100_000).default(""),
  fromName: z.string().max(100).nullable().optional(),
  /** Prospect à utiliser pour la personnalisation ; sinon un prospect réel au hasard. */
  prospectId: z.string().nullable().optional(),
});

/**
 * POST /api/admin/campagnes/apercu
 *
 * Rend l'email tel qu'un prospect le recevra, à partir d'une fiche réelle.
 * Sert de garde-fou avant l'envoi : on voit immédiatement les variables non
 * résolues (fiche incomplète) plutôt que de les découvrir dans la boîte du
 * destinataire.
 */
export async function POST(req: NextRequest) {
  try {
    await requireCommercial();

    const parsed = ApercuSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Données invalides", details: parsed.error.flatten() }, { status: 400 });
    }
    const { sujet, contenu, fromName, prospectId } = parsed.data;

    const prospect = prospectId
      ? await prisma.prospect.findUnique({ where: { id: prospectId } })
      : await prisma.prospect.findFirst({
          where: { email: { not: null }, unsubscribedAt: null },
          orderBy: { createdAt: "desc" },
        });

    // Jeu d'exemple quand le fichier de prospects est encore vide.
    const sample = prospect ?? {
      nom: "Centre de démonstration",
      raisonSociale: "CENTRE DEMO SARL",
      ville: "Cergy",
      codePostal: "95000",
      departement: "95",
      email: "contact@exemple.fr",
      telephone: "01 23 45 67 89",
      siteWeb: null,
      agrementNumber: "R 21 095 0001 0",
      contactNom: "Dupont",
      contactPrenom: "Marc",
      contactFonction: "Gérant",
      unsubscribeToken: "apercu",
    };

    const rendu = renderCampaignEmail({ sujet, contenu, fromName, prospect: sample });
    const validation = validateCampaignTemplate({ sujet, contenu });

    return NextResponse.json({
      sujet: rendu.subject,
      html: rendu.html,
      variablesInconnues: rendu.unknown,
      variablesVides: rendu.empty,
      validation,
      prospectUtilise: prospect ? { id: prospect.id, nom: prospect.nom, ville: prospect.ville } : null,
      exemple: !prospect,
    });
  } catch (err) {
    const authError = mapAuthError(err);
    if (authError) return authError;
    console.error("[POST /api/admin/campagnes/apercu]", err);
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}
