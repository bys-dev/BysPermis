import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireCommercial, mapAuthError } from "@/lib/auth0";
import { PROSPECT_TEMPLATE_VARIABLES, validateCampaignTemplate } from "@/lib/prospects/template";
import { AudienceFilterSchema } from "@/lib/prospects/audience-schema";
import { installerModelesDeBase, listerModeles, prochainOrdre } from "@/lib/prospects/modeles-store";

const CreateSchema = z.object({
  nom: z.string().min(2, "Nom du modèle requis").max(150),
  moment: z.string().max(150).nullable().optional(),
  objectif: z.string().max(300).nullable().optional(),
  sujet: z.string().min(2, "Objet requis").max(200),
  contenu: z.string().min(10, "Contenu requis").max(100_000),
  fromName: z.string().max(100).nullable().optional(),
  replyTo: z.string().email("Adresse de réponse invalide").nullable().optional(),
  filtreSuggere: AudienceFilterSchema.nullable().optional(),
  delaiJours: z.number().int().min(0).max(365).nullable().optional(),
});

/**
 * GET /api/admin/prospects/modeles
 *
 * Bibliothèque de modèles d'email de prospection + catalogue des variables
 * disponibles. La liste est amorcée avec les modèles livrés à son premier
 * accès (cf. `listerModeles`), pour qu'un écran vide ne bloque personne.
 *
 * `?archives=1` inclut les modèles archivés (écran de gestion uniquement).
 */
export async function GET(req: NextRequest) {
  try {
    await requireCommercial();

    const avecArchives = req.nextUrl.searchParams.get("archives") === "1";
    const modeles = await listerModeles({ avecArchives });

    return NextResponse.json({ modeles, variables: PROSPECT_TEMPLATE_VARIABLES });
  } catch (err) {
    const authError = mapAuthError(err);
    if (authError) return authError;
    console.error("[GET /api/admin/prospects/modeles]", err);
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}

/** POST /api/admin/prospects/modeles — crée un modèle rédigé par le staff. */
export async function POST(req: NextRequest) {
  try {
    const user = await requireCommercial();

    const parsed = CreateSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Données invalides", details: parsed.error.flatten() }, { status: 400 });
    }
    const input = parsed.data;

    // Même contrôle qu'à l'enregistrement d'une campagne : un modèle qui
    // référence une variable inexistante produirait un trou dans l'email.
    const check = validateCampaignTemplate({ sujet: input.sujet, contenu: input.contenu });
    if (check.errors.length > 0) {
      return NextResponse.json({ error: check.errors.join(" "), details: check }, { status: 422 });
    }

    const modele = await prisma.prospectEmailTemplate.create({
      data: {
        nom: input.nom.trim(),
        moment: input.moment?.trim() || null,
        objectif: input.objectif?.trim() || null,
        sujet: input.sujet.trim(),
        contenu: input.contenu,
        fromName: input.fromName?.trim() || null,
        replyTo: input.replyTo?.trim() || null,
        filtreSuggere: (input.filtreSuggere ?? undefined) as unknown as object | undefined,
        delaiJours: input.delaiJours ?? null,
        ordre: await prochainOrdre(),
        createdById: user.id,
      },
    });

    return NextResponse.json({ modele }, { status: 201 });
  } catch (err) {
    const authError = mapAuthError(err);
    if (authError) return authError;
    console.error("[POST /api/admin/prospects/modeles]", err);
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}

/**
 * PUT /api/admin/prospects/modeles — réinstalle les modèles de base manquants.
 *
 * Filet de sécurité pour le staff : un modèle livré supprimé par erreur se
 * récupère en un clic, sans toucher à ceux qui ont été retouchés depuis.
 */
export async function PUT() {
  try {
    const user = await requireCommercial();
    const ajoutes = await installerModelesDeBase(user.id);

    return NextResponse.json({
      ajoutes,
      message: ajoutes
        ? `${ajoutes} modèle(s) de base restauré(s).`
        : "Tous les modèles de base sont déjà présents.",
    });
  } catch (err) {
    const authError = mapAuthError(err);
    if (authError) return authError;
    console.error("[PUT /api/admin/prospects/modeles]", err);
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}
