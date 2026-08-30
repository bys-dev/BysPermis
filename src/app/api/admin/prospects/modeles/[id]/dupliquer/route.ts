import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireCommercial, mapAuthError } from "@/lib/auth0";
import { prochainOrdre } from "@/lib/prospects/modeles-store";

/**
 * POST /api/admin/prospects/modeles/[id]/dupliquer
 *
 * Copie un modèle pour le retoucher sans perdre l'original — le geste courant
 * quand on veut tester une variante d'objet ou d'accroche. La copie perd le
 * `slug` : ce n'est plus un modèle livré, seulement un modèle du staff.
 */
export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireCommercial();
    const { id } = await params;

    const source = await prisma.prospectEmailTemplate.findUnique({ where: { id } });
    if (!source) return NextResponse.json({ error: "Modèle introuvable." }, { status: 404 });

    const modele = await prisma.prospectEmailTemplate.create({
      data: {
        nom: `${source.nom} (copie)`.slice(0, 150),
        moment: source.moment,
        objectif: source.objectif,
        sujet: source.sujet,
        contenu: source.contenu,
        fromName: source.fromName,
        replyTo: source.replyTo,
        filtreSuggere: source.filtreSuggere ?? undefined,
        delaiJours: source.delaiJours,
        ordre: await prochainOrdre(),
        createdById: user.id,
      },
    });

    return NextResponse.json({ modele }, { status: 201 });
  } catch (err) {
    const authError = mapAuthError(err);
    if (authError) return authError;
    console.error("[POST /api/admin/prospects/modeles/[id]/dupliquer]", err);
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}
