import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireCommercial, mapAuthError } from "@/lib/auth0";
import { countAudience, type AudienceFilter } from "@/lib/prospects/campaign";
import { PROSPECT_TEMPLATE_VARIABLES, validateCampaignTemplate } from "@/lib/prospects/template";
import { AudienceFilterSchema } from "@/lib/prospects/audience-schema";

const CreateCampaignSchema = z.object({
  nom: z.string().min(2, "Nom de campagne requis").max(150),
  sujet: z.string().min(2, "Objet requis").max(200),
  contenu: z.string().min(10, "Contenu requis").max(100_000),
  fromName: z.string().max(100).nullable().optional(),
  replyTo: z.string().email("Adresse de réponse invalide").nullable().optional(),
  filtre: AudienceFilterSchema.optional(),
});

/** GET /api/admin/campagnes — liste des campagnes + variables disponibles. */
export async function GET() {
  try {
    await requireCommercial();

    const campagnes = await prisma.emailCampaign.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        nom: true,
        sujet: true,
        statut: true,
        totalCibles: true,
        nbEnvoyes: true,
        nbEchecs: true,
        nbOuvertures: true,
        nbClics: true,
        scheduledAt: true,
        startedAt: true,
        finishedAt: true,
        createdAt: true,
        createdBy: { select: { prenom: true, nom: true } },
      },
    });

    return NextResponse.json({ campagnes, variables: PROSPECT_TEMPLATE_VARIABLES });
  } catch (err) {
    const authError = mapAuthError(err);
    if (authError) return authError;
    console.error("[GET /api/admin/campagnes]", err);
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}

/**
 * POST /api/admin/campagnes — crée une campagne en BROUILLON.
 *
 * Le ciblage n'est pas figé ici : `totalCibles` est une estimation à l'instant
 * de la création, recalculée à la préparation de l'envoi.
 */
export async function POST(req: NextRequest) {
  try {
    const user = await requireCommercial();

    const parsed = CreateCampaignSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Données invalides", details: parsed.error.flatten() }, { status: 400 });
    }
    const input = parsed.data;

    // Un placeholder inconnu produirait un trou dans l'email envoyé : on refuse
    // d'enregistrer plutôt que de laisser passer.
    const check = validateCampaignTemplate({ sujet: input.sujet, contenu: input.contenu });
    if (check.errors.length > 0) {
      return NextResponse.json({ error: check.errors.join(" "), details: check }, { status: 422 });
    }

    const filtre = (input.filtre ?? {}) as AudienceFilter;
    const totalCibles = await countAudience(filtre);

    const campagne = await prisma.emailCampaign.create({
      data: {
        nom: input.nom.trim(),
        sujet: input.sujet.trim(),
        contenu: input.contenu,
        fromName: input.fromName?.trim() || null,
        replyTo: input.replyTo?.trim() || null,
        filtre: filtre as unknown as object,
        totalCibles,
        createdById: user.id,
      },
    });

    return NextResponse.json({ campagne, warnings: check.warnings }, { status: 201 });
  } catch (err) {
    const authError = mapAuthError(err);
    if (authError) return authError;
    console.error("[POST /api/admin/campagnes]", err);
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}
