import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireCommercial, mapAuthError } from "@/lib/auth0";
import type { AudienceFilter } from "@/lib/prospects/campaign";
import { AudienceFilterSchema, MAX_AJOUTS_MANUELS } from "@/lib/prospects/audience-schema";
import { detaillerAjouts, rattacherAdresses } from "@/lib/prospects/ajouts-manuels";

const BodySchema = z
  .object({
    /** Adresses à rattacher (fiche retrouvée ou créée). */
    emails: z.array(z.string().max(320)).max(200).optional(),
    /** Fiches déjà ajoutées, dont on veut le détail (réouverture d'une campagne). */
    ids: z.array(z.string().max(40)).max(MAX_AJOUTS_MANUELS).optional(),
    /** Ciblage courant : permet de signaler les adresses qu'il contient déjà. */
    filtre: AudienceFilterSchema.optional(),
  })
  .refine((b) => (b.emails?.length ?? 0) > 0 || (b.ids?.length ?? 0) > 0, {
    message: "Aucune adresse fournie.",
  });

/**
 * POST /api/admin/campagnes/ajouts-manuels
 *
 * Rattache à des fiches prospect des adresses saisies à la main dans l'éditeur
 * de campagne — ou, avec `ids`, renvoie le détail de celles déjà ajoutées.
 *
 * Les fiches manquantes sont créées (source « manuel ») : c'est ce qui permet à
 * ces adresses de profiter du suivi, de la désinscription et des exclusions
 * comme n'importe quel prospect. Une adresse désinscrite n'est jamais ajoutée.
 */
export async function POST(req: NextRequest) {
  try {
    const user = await requireCommercial();

    const parsed = BodySchema.safeParse(await req.json().catch(() => ({})));
    if (!parsed.success) {
      return NextResponse.json({ error: "Requête invalide", details: parsed.error.flatten() }, { status: 400 });
    }
    const filtre = parsed.data.filtre as AudienceFilter | undefined;

    if (parsed.data.emails?.length) {
      const resultat = await rattacherAdresses({
        emails: parsed.data.emails,
        creer: true,
        userId: user.id,
        filtre,
      });
      return NextResponse.json(resultat);
    }

    const adresses = await detaillerAjouts(parsed.data.ids ?? [], filtre);
    return NextResponse.json({ adresses, invalides: [] });
  } catch (err) {
    const authError = mapAuthError(err);
    if (authError) return authError;
    console.error("[POST /api/admin/campagnes/ajouts-manuels]", err);
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}
