import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireCentreManagement } from "@/lib/auth0";
import { getUserCentreId } from "@/lib/centre-utils";

/**
 * All template slugs with their default metadata.
 */
const TEMPLATE_SLUGS = [
  "convocation",
  "confirmation_reservation",
  "rappel_session",
  "bienvenue",
  "centre_notification",
] as const;

/**
 * GET /api/centre/email-templates
 * List templates for current centre, with defaults as fallback.
 */
export async function GET() {
  try {
    const user = await requireCentreManagement();
    const centreId = await getUserCentreId(user.id, user.role);

    if (!centreId) {
      return NextResponse.json({ error: "Aucun centre associé" }, { status: 404 });
    }

    // Fetch centre-specific templates
    const centreTemplates = await prisma.emailTemplate.findMany({
      where: { centreId },
    });

    // Fetch default templates
    const defaultTemplates = await prisma.emailTemplate.findMany({
      where: { centreId: null },
    });

    // Merge: centre-specific overrides take priority over defaults
    const centreMap = new Map(centreTemplates.map((t) => [t.slug, t]));
    const result = TEMPLATE_SLUGS.map((slug) => {
      const centreTemplate = centreMap.get(slug);
      const defaultTemplate = defaultTemplates.find((t) => t.slug === slug);

      if (centreTemplate) {
        return { ...centreTemplate, isOverride: true };
      }
      if (defaultTemplate) {
        return { ...defaultTemplate, isOverride: false };
      }
      return null;
    }).filter(Boolean);

    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }
}

/**
 * POST /api/centre/email-templates
 * Create or update a centre-specific template override.
 * Body: { slug, sujet, contenu }
 * To delete an override (reset to default), send { slug, reset: true }
 */
export async function POST(req: NextRequest) {
  try {
    const user = await requireCentreManagement();
    const centreId = await getUserCentreId(user.id, user.role);

    if (!centreId) {
      return NextResponse.json({ error: "Aucun centre associé" }, { status: 404 });
    }

    const body = await req.json();
    const { slug, sujet, contenu, reset } = body as {
      slug: string;
      sujet?: string;
      contenu?: string;
      reset?: boolean;
    };

    if (!slug || !TEMPLATE_SLUGS.includes(slug as typeof TEMPLATE_SLUGS[number])) {
      return NextResponse.json({ error: "Slug de template invalide" }, { status: 400 });
    }

    // Reset: delete the centre-specific override
    if (reset) {
      await prisma.emailTemplate.deleteMany({
        where: { slug, centreId },
      });
      return NextResponse.json({ success: true, message: "Template réinitialisé" });
    }

    if (!sujet || !contenu) {
      return NextResponse.json({ error: "sujet et contenu requis" }, { status: 400 });
    }

    // Get default template to copy variables and nom
    const defaultTemplate = await prisma.emailTemplate.findFirst({
      where: { slug, centreId: null },
    });

    const template = await prisma.emailTemplate.upsert({
      where: { slug_centreId: { slug, centreId } },
      update: {
        sujet,
        contenu,
        updatedAt: new Date(),
      },
      create: {
        slug,
        nom: defaultTemplate?.nom ?? slug,
        sujet,
        contenu,
        variables: defaultTemplate?.variables ?? [],
        centreId,
      },
    });

    return NextResponse.json(template);
  } catch {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }
}
