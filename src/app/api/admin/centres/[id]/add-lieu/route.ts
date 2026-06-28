import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth0";
import { slugify } from "@/lib/utils";
import { sendCentreInvitationEmail } from "@/lib/email";
import { rateLimit } from "@/lib/rate-limit";
import { z } from "zod";

const schema = z.object({
  nom: z.string().min(2, "Nom requis").max(120),
  adresse: z.string().optional(),
  codePostal: z.string().optional(),
  ville: z.string().optional(),
  telephone: z.string().optional(),
  siret: z.string().optional(),
});

// POST /api/admin/centres/[id]/add-lieu
// [id] = centreId existant — on récupère son userId pour rattacher le nouveau lieu au même chef de centre
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const limited = rateLimit(req, { max: 20, windowMs: 60_000, keyPrefix: "admin-add-lieu" });
    if (limited) return limited;

    await requireAdmin();

    const { id: centreId } = await params;

    // Find existing centre to get the owner
    const existingCentre = await prisma.centre.findUnique({
      where: { id: centreId },
      select: { userId: true, user: { select: { email: true, prenom: true, nom: true } } },
    });

    if (!existingCentre) {
      return NextResponse.json({ error: "Centre introuvable." }, { status: 404 });
    }

    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
    }

    const { nom, adresse, codePostal, ville, telephone } = parsed.data;

    const slug = slugify(nom.trim()) + "-" + Date.now().toString(36);

    const nouveau = await prisma.$transaction(async (tx) => {
      const centre = await tx.centre.create({
        data: {
          nom: nom.trim(),
          slug,
          adresse: adresse?.trim() ?? "",
          codePostal: codePostal?.trim() ?? "",
          ville: ville?.trim() ?? "",
          telephone: telephone?.trim() || null,
          statut: "EN_ATTENTE",
          isActive: false,
          userId: existingCentre.userId,
        },
      });

      await tx.notification.create({
        data: {
          titre: "Nouveau lieu ajouté",
          contenu: `Un nouveau lieu "${nom.trim()}" a été créé sur votre compte.`,
          userId: existingCentre.userId,
        },
      });

      return centre;
    });

    // Email: notify the chef de centre of the new location
    try {
      const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
      await sendCentreInvitationEmail({
        to: existingCentre.user.email,
        centreName: nom.trim(),
        loginUrl: `${appUrl}/connexion`,
      });
    } catch (emailErr) {
      console.error("[add-lieu] Erreur envoi email:", emailErr);
    }

    return NextResponse.json(
      {
        success: true,
        message: "Nouveau lieu créé.",
        centre: { id: nouveau.id, nom: nouveau.nom, slug: nouveau.slug },
      },
      { status: 201 }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erreur serveur";
    if (message === "Non authentifie" || message === "Non autorise") {
      return NextResponse.json({ error: message }, { status: 401 });
    }
    console.error("[POST /api/admin/centres/[id]/add-lieu]", err);
    return NextResponse.json({ error: "Erreur serveur. Veuillez reessayer." }, { status: 500 });
  }
}
