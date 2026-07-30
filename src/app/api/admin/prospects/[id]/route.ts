import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireCommercial, requireAdmin, mapAuthError } from "@/lib/auth0";
import { cleanEmail, cleanPhone, cleanSiret, cleanWebsite, departementFromCodePostal } from "@/lib/prospects/parse";

const UpdateSchema = z.object({
  nom: z.string().min(2).max(200).optional(),
  raisonSociale: z.string().max(200).nullable().optional(),
  siret: z.string().max(30).nullable().optional(),
  agrementNumber: z.string().max(60).nullable().optional(),
  agrementDepartement: z.string().max(10).nullable().optional(),
  email: z.string().max(200).nullable().optional(),
  telephone: z.string().max(40).nullable().optional(),
  siteWeb: z.string().max(300).nullable().optional(),
  adresse: z.string().max(300).nullable().optional(),
  codePostal: z.string().max(10).nullable().optional(),
  ville: z.string().max(120).nullable().optional(),
  contactNom: z.string().max(120).nullable().optional(),
  contactPrenom: z.string().max(120).nullable().optional(),
  contactFonction: z.string().max(120).nullable().optional(),
  notesInternes: z.string().max(5000).nullable().optional(),
  score: z.number().int().min(0).max(100).nullable().optional(),
  ownerId: z.string().nullable().optional(),
  statut: z
    .enum(["NOUVEAU", "A_CONTACTER", "CONTACTE", "RELANCE", "INTERESSE", "INSCRIT", "REFUSE", "INJOIGNABLE", "DESABONNE"])
    .optional(),
});

/** GET /api/admin/prospects/[id] — fiche complète + historique des campagnes. */
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireCommercial();
    const { id } = await params;

    const prospect = await prisma.prospect.findUnique({
      where: { id },
      include: {
        owner: { select: { id: true, prenom: true, nom: true, email: true } },
        import: { select: { id: true, filename: true, createdAt: true, source: true } },
        recipients: {
          orderBy: { createdAt: "desc" },
          take: 50,
          select: {
            id: true,
            status: true,
            sentAt: true,
            openedAt: true,
            clickedAt: true,
            error: true,
            campaign: { select: { id: true, nom: true, sujet: true } },
          },
        },
      },
    });

    if (!prospect) return NextResponse.json({ error: "Prospect introuvable." }, { status: 404 });
    return NextResponse.json({ prospect });
  } catch (err) {
    const authError = mapAuthError(err);
    if (authError) return authError;
    console.error("[GET /api/admin/prospects/[id]]", err);
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}

/** PATCH /api/admin/prospects/[id] — mise à jour d'une fiche. */
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireCommercial();
    const { id } = await params;

    const parsed = UpdateSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Données invalides", details: parsed.error.flatten() }, { status: 400 });
    }
    const input = parsed.data;

    const current = await prisma.prospect.findUnique({
      where: { id },
      select: { id: true, unsubscribedAt: true },
    });
    if (!current) return NextResponse.json({ error: "Prospect introuvable." }, { status: 404 });

    const data: Record<string, unknown> = {};

    // Champs texte simples.
    for (const key of [
      "nom",
      "raisonSociale",
      "agrementNumber",
      "agrementDepartement",
      "adresse",
      "ville",
      "contactNom",
      "contactPrenom",
      "contactFonction",
      "notesInternes",
    ] as const) {
      if (input[key] !== undefined) data[key] = input[key]?.toString().trim() || null;
    }

    if (input.score !== undefined) data.score = input.score;
    if (input.ownerId !== undefined) data.ownerId = input.ownerId || null;
    if (input.siret !== undefined) data.siret = cleanSiret(input.siret);
    if (input.telephone !== undefined) data.telephone = cleanPhone(input.telephone);
    if (input.siteWeb !== undefined) data.siteWeb = cleanWebsite(input.siteWeb);

    if (input.codePostal !== undefined) {
      const cp = (input.codePostal ?? "").replace(/\D/g, "") || null;
      data.codePostal = cp;
      data.departement = departementFromCodePostal(cp);
    }

    let warning: string | null = null;
    if (input.email !== undefined) {
      const { email, warning: emailWarning } = cleanEmail(input.email);
      data.email = email;
      warning = emailWarning ?? null;
      // Une adresse corrigée à la main redevient éligible aux campagnes.
      if (email) data.emailValide = true;
    }

    if (input.statut !== undefined) {
      data.statut = input.statut;
      // Passer un prospect en DESABONNE doit réellement le sortir des envois :
      // le moteur de campagne s'appuie sur `unsubscribedAt`, pas sur le statut.
      if (input.statut === "DESABONNE" && !current.unsubscribedAt) {
        data.unsubscribedAt = new Date();
      }
      if (input.statut === "INJOIGNABLE") data.emailValide = false;
    }

    const prospect = await prisma.prospect.update({ where: { id }, data });
    return NextResponse.json({ prospect, warning });
  } catch (err) {
    const authError = mapAuthError(err);
    if (authError) return authError;
    console.error("[PATCH /api/admin/prospects/[id]]", err);
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}

/**
 * DELETE /api/admin/prospects/[id]
 *
 * Réservé aux ADMIN/OWNER : la suppression efface aussi la trace des envois
 * (cascade sur `CampaignRecipient`). Pour retirer un prospect du démarchage,
 * préférer le statut DESABONNE, qui conserve l'historique.
 */
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
    const { id } = await params;

    const existing = await prisma.prospect.findUnique({ where: { id }, select: { id: true } });
    if (!existing) return NextResponse.json({ error: "Prospect introuvable." }, { status: 404 });

    await prisma.prospect.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (err) {
    const authError = mapAuthError(err);
    if (authError) return authError;
    console.error("[DELETE /api/admin/prospects/[id]]", err);
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}
