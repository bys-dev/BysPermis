import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireCentreOwner } from "@/lib/auth0";
import { getUserCentreId } from "@/lib/centre-utils";

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

    if (centre.profilCompletionPct < 100) {
      return NextResponse.json(
        { error: "Votre profil doit etre complet a 100% pour demander la validation." },
        { status: 400 }
      );
    }

    if (centre.statut === "ACTIF" && centre.isActive) {
      return NextResponse.json(
        { error: "Votre centre est deja actif." },
        { status: 400 }
      );
    }

    // Find all admin users to notify them
    const admins = await prisma.user.findMany({
      where: { role: { in: ["ADMIN", "OWNER"] } },
      select: { id: true },
    });

    // Create notifications for all admins
    if (admins.length > 0) {
      await prisma.notification.createMany({
        data: admins.map((admin) => ({
          titre: "Demande de validation centre",
          contenu: `Le centre "${centre.nom}" (${centre.ville || "ville non renseignee"}) a termine son profil (100%) et demande a etre active sur la marketplace.`,
          userId: admin.id,
        })),
      });
    }

    // Create notification for centre owner as confirmation
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
