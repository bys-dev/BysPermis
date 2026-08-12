import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireCommercial, requireAdmin, mapAuthError } from "@/lib/auth0";
import { countAudience, type AudienceFilter } from "@/lib/prospects/campaign";
import { validateCampaignTemplate } from "@/lib/prospects/template";
import { AudienceFilterSchema } from "@/lib/prospects/audience-schema";

const UpdateSchema = z.object({
  nom: z.string().min(2).max(150).optional(),
  sujet: z.string().min(2).max(200).optional(),
  contenu: z.string().min(10).max(100_000).optional(),
  fromName: z.string().max(100).nullable().optional(),
  replyTo: z.string().email("Adresse de réponse invalide").nullable().optional(),
  filtre: AudienceFilterSchema.optional(),
  scheduledAt: z.string().datetime().nullable().optional(),
});

/** GET /api/admin/campagnes/[id] — détail + répartition des destinataires. */
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireCommercial();
    const { id } = await params;

    const campagne = await prisma.emailCampaign.findUnique({
      where: { id },
      include: { createdBy: { select: { prenom: true, nom: true } } },
    });
    if (!campagne) return NextResponse.json({ error: "Campagne introuvable." }, { status: 404 });

    const [parStatut, echantillon] = await Promise.all([
      prisma.campaignRecipient.groupBy({
        by: ["status"],
        where: { campaignId: id },
        _count: { _all: true },
      }),
      prisma.campaignRecipient.findMany({
        where: { campaignId: id },
        orderBy: { createdAt: "asc" },
        take: 100,
        select: {
          id: true,
          email: true,
          status: true,
          sentAt: true,
          openedAt: true,
          clickedAt: true,
          error: true,
          prospect: { select: { id: true, nom: true, ville: true, departement: true } },
        },
      }),
    ]);

    return NextResponse.json({
      campagne,
      destinataires: {
        parStatut: Object.fromEntries(parStatut.map((r) => [r.status, r._count._all])),
        echantillon,
      },
    });
  } catch (err) {
    const authError = mapAuthError(err);
    if (authError) return authError;
    console.error("[GET /api/admin/campagnes/[id]]", err);
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}

/**
 * PATCH /api/admin/campagnes/[id] — modification du contenu ou du ciblage.
 *
 * Interdit dès que l'envoi a commencé : modifier l'objet ou le corps d'une
 * campagne en cours ferait partir deux messages différents sous le même nom,
 * et rendrait les statistiques inexploitables.
 */
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireCommercial();
    const { id } = await params;

    const existing = await prisma.emailCampaign.findUnique({
      where: { id },
      select: { id: true, statut: true, sujet: true, contenu: true },
    });
    if (!existing) return NextResponse.json({ error: "Campagne introuvable." }, { status: 404 });

    if (!["BROUILLON", "PROGRAMMEE", "PAUSEE"].includes(existing.statut)) {
      return NextResponse.json(
        { error: `Campagne ${existing.statut.toLowerCase()} : elle n'est plus modifiable.` },
        { status: 409 },
      );
    }

    const parsed = UpdateSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Données invalides", details: parsed.error.flatten() }, { status: 400 });
    }
    const input = parsed.data;

    const check = validateCampaignTemplate({
      sujet: input.sujet ?? existing.sujet,
      contenu: input.contenu ?? existing.contenu,
    });
    if (check.errors.length > 0) {
      return NextResponse.json({ error: check.errors.join(" "), details: check }, { status: 422 });
    }

    const data: Record<string, unknown> = {};
    if (input.nom !== undefined) data.nom = input.nom.trim();
    if (input.sujet !== undefined) data.sujet = input.sujet.trim();
    if (input.contenu !== undefined) data.contenu = input.contenu;
    if (input.fromName !== undefined) data.fromName = input.fromName?.trim() || null;
    if (input.replyTo !== undefined) data.replyTo = input.replyTo?.trim() || null;
    if (input.scheduledAt !== undefined) {
      data.scheduledAt = input.scheduledAt ? new Date(input.scheduledAt) : null;
      data.statut = input.scheduledAt ? "PROGRAMMEE" : "BROUILLON";
    }
    if (input.filtre !== undefined) {
      const filtre = input.filtre as AudienceFilter;
      data.filtre = filtre as unknown as object;
      // Le ciblage a changé : l'estimation affichée doit suivre.
      data.totalCibles = await countAudience(filtre);
    }

    const campagne = await prisma.emailCampaign.update({ where: { id }, data });
    return NextResponse.json({ campagne, warnings: check.warnings });
  } catch (err) {
    const authError = mapAuthError(err);
    if (authError) return authError;
    console.error("[PATCH /api/admin/campagnes/[id]]", err);
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}

/** DELETE /api/admin/campagnes/[id] — suppression (brouillons et campagnes terminées). */
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
    const { id } = await params;

    const existing = await prisma.emailCampaign.findUnique({ where: { id }, select: { statut: true } });
    if (!existing) return NextResponse.json({ error: "Campagne introuvable." }, { status: 404 });

    if (existing.statut === "EN_COURS") {
      return NextResponse.json(
        { error: "Envoi en cours : mettez la campagne en pause avant de la supprimer." },
        { status: 409 },
      );
    }

    await prisma.emailCampaign.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (err) {
    const authError = mapAuthError(err);
    if (authError) return authError;
    console.error("[DELETE /api/admin/campagnes/[id]]", err);
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}
