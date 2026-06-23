import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireCentreOwner } from "@/lib/auth0";
import { getUserCentreId } from "@/lib/centre-utils";
import { notifyAdminsCentreValidationRequest } from "@/lib/event-notifications";

// POST /api/centre/request-validation — Centre owner requests admin validation

export async function POST() {
  try {
    const user = await requireCentreOwner();

    // Find the active centre for this user
    const centreId = await getUserCentreId(user.id, user.role);
    if (!centreId) {
      return NextResponse.json(
        { error: "Centre introuvable." },
        { status: 404 }
      );
    }
    const centre = await prisma.centre.findUnique({
      where: { id: centreId },
    });

    if (!centre) {
      return NextResponse.json(
        { error: "Centre introuvable." },
        { status: 404 }
      );
    }

    if (centre.statut === "ACTIF" && centre.isActive) {
      return NextResponse.json(
        { error: "Votre centre est deja actif." },
        { status: 400 }
      );
    }

    // Notifier les admins plateforme (email + cloche)
    notifyAdminsCentreValidationRequest({
      centreName: centre.nom,
      ville: centre.ville || "ville non renseignee",
      completionPct: centre.profilCompletionPct,
    }).catch((err) => console.error("[request-validation] notify admins:", err));

    // Confirmation owner
    await prisma.notification.create({
      data: {
        titre: "Demande de validation envoyee",
        contenu:
          "Votre demande de validation a bien ete envoyee a notre equipe. Nous examinerons votre profil sous 24 a 48 heures.",
        userId: user.id,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Demande de validation envoyee avec succes.",
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erreur serveur";
    if (message === "Non authentifie" || message === "Non autorise") {
      return NextResponse.json({ error: message }, { status: 401 });
    }
    console.error("[POST /api/centre/request-validation]", err);
    return NextResponse.json(
      { error: "Erreur serveur." },
      { status: 500 }
    );
  }
}
