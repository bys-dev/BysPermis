import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import * as Prisma from "@/generated/prisma/internal/prismaNamespace";
import { z } from "zod";
import { requireAuth, requireCentreManagement, PLATFORM_ADMIN_ROLES } from "@/lib/auth0";
import { calculateCentreCompletion } from "@/lib/centre-completion";
import { getUserCentreId } from "@/lib/centre-utils";

const centreSelect = {
  id: true, nom: true, slug: true, description: true,
  adresse: true, codePostal: true, ville: true,
  telephone: true, email: true, siteWeb: true,
  siret: true,
  stripeAccountId: true, stripeOnboardingDone: true,
  subscriptionStatus: true,
  profilCompletionPct: true,
  statut: true, isActive: true,
  bannerImage: true, logo: true, couleurPrimaire: true, couleurSecondaire: true,
  presentationHtml: true, horaires: true,
  equipements: true, certifications: true, reseauxSociaux: true,
  // Billing / juridique
  raisonSociale: true, tva: true, ape: true, iban: true, bic: true,
  mentionsLegales: true, cgv: true, nomResponsable: true, signatureUrl: true,
  commissionRateOverride: true,
} as const;

// GET /api/centre/me
export async function GET() {
  let user;
  try {
    user = await requireAuth();
  } catch {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  try {
    const centreId = await getUserCentreId(user.id, user.role);
    if (!centreId) return NextResponse.json({ error: "Aucun centre" }, { status: 404 });
    const centre = await prisma.centre.findUnique({
      where: { id: centreId },
      select: centreSelect,
    });
    if (!centre) return NextResponse.json({ error: "Centre introuvable" }, { status: 404 });
    return NextResponse.json(centre);
  } catch (err) {
    console.error("[GET /api/centre/me] DB error:", err);
    return NextResponse.json(null);
  }
}

// PATCH /api/centre/me
const updateSchema = z.object({
  nom: z.string().min(2).max(200).optional(),
  adresse: z.string().max(300).optional(),
  codePostal: z.string().max(10).optional(),
  ville: z.string().max(100).optional(),
  telephone: z.string().max(20).optional(),
  email: z.string().email().optional(),
  // ── Facturation / juridique ──
  raisonSociale: z.string().max(200).optional().nullable(),
  siret: z.string().regex(/^\d{14}$/, "SIRET doit comporter 14 chiffres").optional().nullable(),
  tva: z.string().regex(/^[A-Z]{2}\w{2,12}$/, "TVA invalide (ex: FR12345678901)").optional().nullable(),
  ape: z.string().max(10).optional().nullable(),
  iban: z.string().regex(/^[A-Z]{2}[0-9A-Z]{13,32}$/, "IBAN invalide").optional().nullable(),
  bic: z.string().regex(/^[A-Z]{6}[A-Z0-9]{2}([A-Z0-9]{3})?$/, "BIC invalide").optional().nullable(),
  mentionsLegales: z.string().max(20000).optional().nullable(),
  cgv: z.string().max(20000).optional().nullable(),
  nomResponsable: z.string().max(200).optional().nullable(),
  // commissionRateOverride: only platform admin/owner can set it
  commissionRateOverride: z.number().min(0).max(1).optional().nullable(),
});

export async function PATCH(req: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await req.json();
    const parsed = updateSchema.parse(body);

    // ── Security: commissionRateOverride only editable by platform staff ──
    const isPlatformAdmin = (PLATFORM_ADMIN_ROLES as readonly string[]).includes(user.role);
    const { commissionRateOverride, ...rest } = parsed;
    const data: typeof parsed = isPlatformAdmin
      ? parsed
      : (rest as typeof parsed);

    if (commissionRateOverride !== undefined && !isPlatformAdmin) {
      console.warn(`[PATCH /api/centre/me] user ${user.id} (${user.role}) tried to set commissionRateOverride — ignored`);
    }

    const centreId = await getUserCentreId(user.id, user.role);
    if (!centreId) return NextResponse.json({ error: "Aucun centre" }, { status: 404 });

    const centre = await prisma.centre.findUnique({
      where: { id: centreId },
      include: {
        formations: {
          where: { isActive: true },
          select: {
            id: true,
            sessions: { where: { status: "ACTIVE" }, select: { id: true }, take: 1 },
          },
        },
      },
    });
    if (!centre) return NextResponse.json({ error: "Centre introuvable" }, { status: 404 });

    const updated = await prisma.centre.update({
      where: { id: centre.id },
      data,
      select: centreSelect,
    });

    // Recalculate completion
    const activeFormationsWithSessions = centre.formations.filter((f) => f.sessions.length > 0).length;
    const { percentage } = calculateCentreCompletion({
      ...updated,
      _activeFormationsWithSessions: activeFormationsWithSessions,
    });
    const newIsActive = centre.statut === "ACTIF";
    await prisma.centre.update({
      where: { id: centre.id },
      data: { profilCompletionPct: percentage, isActive: newIsActive },
    });

    return NextResponse.json({ ...updated, profilCompletionPct: percentage, isActive: newIsActive });
  } catch (err) {
    if (err instanceof z.ZodError) return NextResponse.json({ error: err.issues }, { status: 400 });
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// PUT /api/centre/me — mise à jour complète du profil centre (personnalisation)
const profileSchema = z.object({
  // Informations de base
  nom: z.string().min(2).max(200).optional(),
  description: z.string().max(2000).optional().nullable(),
  adresse: z.string().max(300).optional(),
  codePostal: z.string().max(10).optional(),
  ville: z.string().max(100).optional(),
  telephone: z.string().max(20).optional().nullable(),
  email: z.string().email().optional().nullable(),
  siteWeb: z.string().max(300).optional().nullable(),
  // Personnalisation
  bannerImage: z.string().url().max(500).optional().nullable(),
  couleurPrimaire: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional().nullable(),
  couleurSecondaire: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional().nullable(),
  presentationHtml: z.string().max(10000).optional().nullable(),
  horaires: z.string().max(1000).optional().nullable(),
  equipements: z.array(z.string().max(100)).max(20).optional(),
  certifications: z.array(z.string().max(100)).max(20).optional(),
  reseauxSociaux: z.object({
    facebook: z.string().url().optional().or(z.literal("")),
    instagram: z.string().url().optional().or(z.literal("")),
    linkedin: z.string().url().optional().or(z.literal("")),
    youtube: z.string().url().optional().or(z.literal("")),
  }).optional().nullable(),
  nomResponsable: z.string().max(200).optional().nullable(),
});

export async function PUT(req: NextRequest) {
  try {
    const user = await requireCentreManagement();
    const body = await req.json();
    const data = profileSchema.parse(body);

    const centreId = await getUserCentreId(user.id, user.role);
    if (!centreId) return NextResponse.json({ error: "Aucun centre" }, { status: 404 });

    const centre = await prisma.centre.findUnique({
      where: { id: centreId },
      include: {
        formations: {
          where: { isActive: true },
          select: {
            id: true,
            sessions: { where: { status: "ACTIVE" }, select: { id: true }, take: 1 },
          },
        },
      },
    });
    if (!centre) return NextResponse.json({ error: "Centre introuvable" }, { status: 404 });

    // Handle Prisma JSON null properly
    const prismaData = {
      ...data,
      reseauxSociaux: data.reseauxSociaux === null
        ? Prisma.JsonNull
        : data.reseauxSociaux === undefined
          ? undefined
          : data.reseauxSociaux,
    };

    const updated = await prisma.centre.update({
      where: { id: centre.id },
      data: prismaData,
      select: centreSelect,
    });

    // Recalculate completion
    const activeFormationsWithSessions = centre.formations.filter((f) => f.sessions.length > 0).length;
    const { percentage } = calculateCentreCompletion({
      ...updated,
      _activeFormationsWithSessions: activeFormationsWithSessions,
    });
    const newIsActive = centre.statut === "ACTIF";
    await prisma.centre.update({
      where: { id: centre.id },
      data: { profilCompletionPct: percentage, isActive: newIsActive },
    });

    return NextResponse.json({ ...updated, profilCompletionPct: percentage, isActive: newIsActive });
  } catch (err) {
    if (err instanceof z.ZodError) return NextResponse.json({ error: err.issues }, { status: 400 });
    console.error("[PUT /api/centre/me]", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
