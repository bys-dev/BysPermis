import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireCommercial, mapAuthError } from "@/lib/auth0";
import { buildAudienceWhere, countAudience, type AudienceFilter } from "@/lib/prospects/campaign";
import { AudienceFilterSchema } from "@/lib/prospects/audience-schema";

const BodySchema = z.object({
  filtre: AudienceFilterSchema.optional(),
  page: z.number().int().min(1).max(1000).optional(),
  perPage: z.number().int().min(1).max(100).optional(),
});

/**
 * POST /api/admin/campagnes/destinataires
 *
 * Liste nominative — et paginée — des centres qui recevront la campagne, avec
 * leur interlocuteur (le propriétaire / gérant du centre).
 *
 * Complète `audience`, qui ne renvoie qu'un compte et dix lignes d'échantillon :
 * ici le staff parcourt la liste réelle, ligne par ligne, et peut prévisualiser
 * l'email personnalisé de n'importe quel destinataire avant l'envoi.
 *
 * `unsubscribeToken` n'est volontairement pas exposé : l'aperçu côté client
 * utilise un jeton factice, le vrai lien n'est calculé qu'au moment de l'envoi.
 */
export async function POST(req: NextRequest) {
  try {
    await requireCommercial();

    const body = await req.json().catch(() => ({}));
    const parsed = BodySchema.safeParse(body ?? {});
    if (!parsed.success) {
      return NextResponse.json({ error: "Requête invalide", details: parsed.error.flatten() }, { status: 400 });
    }

    const filtre = (parsed.data.filtre ?? {}) as AudienceFilter;
    const page = parsed.data.page ?? 1;
    const perPage = parsed.data.perPage ?? 25;
    const where = buildAudienceWhere(filtre);

    const [total, destinataires] = await Promise.all([
      countAudience(filtre),
      prisma.prospect.findMany({
        where,
        select: {
          id: true,
          nom: true,
          raisonSociale: true,
          email: true,
          telephone: true,
          siteWeb: true,
          ville: true,
          codePostal: true,
          departement: true,
          agrementNumber: true,
          contactNom: true,
          contactPrenom: true,
          contactFonction: true,
          statut: true,
          nbEmailsEnvoyes: true,
          lastContactedAt: true,
        },
        // Les fiches jamais écrites d'abord : c'est l'ordre dans lequel on veut
        // relire une liste de démarchage.
        orderBy: [{ nbEmailsEnvoyes: "asc" }, { nom: "asc" }],
        skip: (page - 1) * perPage,
        take: perPage,
      }),
    ]);

    return NextResponse.json({
      destinataires,
      pagination: {
        page,
        perPage,
        total,
        totalPages: Math.max(1, Math.ceil(total / perPage)),
      },
    });
  } catch (err) {
    const authError = mapAuthError(err);
    if (authError) return authError;
    console.error("[POST /api/admin/campagnes/destinataires]", err);
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}
