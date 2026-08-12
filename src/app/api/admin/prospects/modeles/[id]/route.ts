import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireCommercial, mapAuthError } from "@/lib/auth0";
import { validateCampaignTemplate } from "@/lib/prospects/template";
import { AudienceFilterSchema } from "@/lib/prospects/audience-schema";

const UpdateSchema = z.object({
  nom: z.string().min(2).max(150).optional(),
  moment: z.string().max(150).nullable().optional(),
  objectif: z.string().max(300).nullable().optional(),
  sujet: z.string().min(2).max(200).optional(),
  contenu: z.string().min(10).max(100_000).optional(),
  fromName: z.string().max(100).nullable().optional(),
  replyTo: z.string().email("Adresse de réponse invalide").nullable().optional(),
  filtreSuggere: AudienceFilterSchema.nullable().optional(),
  delaiJours: z.number().int().min(0).max(365).nullable().optional(),
  ordre: z.number().int().min(0).max(10_000).optional(),
  isArchive: z.boolean().optional(),
});

/**
 * PATCH /api/admin/prospects/modeles/[id]
 *
 * Tous les modèles sont modifiables, y compris ceux livrés avec la plateforme :
 * les campagnes ayant déjà copié le modèle ne sont pas affectées.
 */
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireCommercial();
    const { id } = await params;

    const existing = await prisma.prospectEmailTemplate.findUnique({
      where: { id },
      select: { id: true, sujet: true, contenu: true },
    });
    if (!existing) return NextResponse.json({ error: "Modèle introuvable." }, { status: 404 });

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
    if (input.moment !== undefined) data.moment = input.moment?.trim() || null;
    if (input.objectif !== undefined) data.objectif = input.objectif?.trim() || null;
    if (input.sujet !== undefined) data.sujet = input.sujet.trim();
    if (input.contenu !== undefined) data.contenu = input.contenu;
    if (input.fromName !== undefined) data.fromName = input.fromName?.trim() || null;
    if (input.replyTo !== undefined) data.replyTo = input.replyTo?.trim() || null;
    if (input.filtreSuggere !== undefined) data.filtreSuggere = input.filtreSuggere ?? undefined;
    if (input.delaiJours !== undefined) data.delaiJours = input.delaiJours;
    if (input.ordre !== undefined) data.ordre = input.ordre;
    if (input.isArchive !== undefined) data.isArchive = input.isArchive;

    const modele = await prisma.prospectEmailTemplate.update({ where: { id }, data });
    return NextResponse.json({ modele });
  } catch (err) {
    const authError = mapAuthError(err);
    if (authError) return authError;
    console.error("[PATCH /api/admin/prospects/modeles/[id]]", err);
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}

/**
 * DELETE /api/admin/prospects/modeles/[id]
 *
 * Suppression définitive. Les modèles livrés (`slug` renseigné) se restaurent
 * ensuite via `PUT /api/admin/prospects/modeles`.
 */
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireCommercial();
    const { id } = await params;

    const existing = await prisma.prospectEmailTemplate.findUnique({ where: { id }, select: { id: true } });
    if (!existing) return NextResponse.json({ error: "Modèle introuvable." }, { status: 404 });

    await prisma.prospectEmailTemplate.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (err) {
    const authError = mapAuthError(err);
    if (authError) return authError;
    console.error("[DELETE /api/admin/prospects/modeles/[id]]", err);
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}
