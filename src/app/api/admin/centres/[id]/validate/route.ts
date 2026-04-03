import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth0";
import { sendCentreActivationEmail, sendCentreRejectionEmail } from "@/lib/email";

// ─── POST /api/admin/centres/[id]/validate — Activer un centre ───

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;

    // Fetch centre with owner info
    const centre = await prisma.centre.findUnique({
      where: { id },
      include: { user: { select: { id: true, email: true, prenom: true, nom: true } } },
    });

    if (!centre) {
      return NextResponse.json({ error: "Centre introuvable." }, { status: 404 });
    }

    if (centre.statut === "ACTIF" && centre.isActive) {
      return NextResponse.json(
        { error: "Ce centre est deja actif." },
        { status: 400 }
      );
    }

    // Activate centre
    const updated = await prisma.centre.update({
      where: { id },
      data: {
        statut: "ACTIF",
        isActive: true,
      },
    });

    // Create notification for centre owner
    await prisma.notification.create({
      data: {
        titre: "Votre centre est actif !",
        contenu:
          "Felicitations ! Votre centre est maintenant visible sur la marketplace BYS Formation. Les stagiaires peuvent desormais decouvrir et reserver vos formations.",
        userId: centre.user.id,
      },
    });

    // Send activation email
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    try {
      await sendCentreActivationEmail({
        to: centre.user.email,
        centreName: centre.nom,
        dashboardUrl: `${appUrl}/espace-centre/dashboard`,
      });
    } catch (emailErr) {
      console.error("[validate] Erreur envoi email d'activation:", emailErr);
    }

    return NextResponse.json({
      success: true,
      message: "Centre active avec succes.",
      centre: {
        id: updated.id,
        nom: updated.nom,
        statut: updated.statut,
        isActive: updated.isActive,
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erreur serveur";
    if (message === "Non authentifie" || message === "Non autorise") {
      return NextResponse.json({ error: message }, { status: 401 });
    }
    console.error("[POST /api/admin/centres/[id]/validate]", err);
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}

// ─── DELETE /api/admin/centres/[id]/validate — Rejeter un centre ─

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;

    const body = await req.json().catch(() => ({}));
    const { reason } = body as { reason?: string };

    // Fetch centre with owner info
    const centre = await prisma.centre.findUnique({
      where: { id },
      include: { user: { select: { id: true, email: true, prenom: true, nom: true } } },
    });

    if (!centre) {
      return NextResponse.json({ error: "Centre introuvable." }, { status: 404 });
    }

    // Keep status as EN_ATTENTE but mark rejection via notification
    const rejectReason = reason?.trim() || "Aucune raison specifiee.";

    // Create notification for centre owner
    await prisma.notification.create({
      data: {
        titre: "Validation refusee",
        contenu: `Votre demande d'activation a ete refusee. Raison : ${rejectReason}. Veuillez corriger les elements mentionnes et soumettre a nouveau votre centre.`,
        userId: centre.user.id,
      },
    });

    // Send rejection email
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    try {
      await sendCentreRejectionEmail({
        to: centre.user.email,
        centreName: centre.nom,
        reason: rejectReason,
        onboardingUrl: `${appUrl}/espace-centre/onboarding`,
      });
    } catch (emailErr) {
      console.error("[validate] Erreur envoi email de rejet:", emailErr);
    }

    return NextResponse.json({
      success: true,
      message: "Centre rejete. Le proprietaire a ete notifie.",
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erreur serveur";
    if (message === "Non authentifie" || message === "Non autorise") {
      return NextResponse.json({ error: message }, { status: 401 });
    }
    console.error("[DELETE /api/admin/centres/[id]/validate]", err);
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}
