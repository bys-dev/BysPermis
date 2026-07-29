import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit";

/**
 * POST /api/desabonnement/[token] — opposition au démarchage.
 *
 * Route PUBLIQUE et volontairement sans authentification : le lien figure dans
 * chaque email de campagne et doit fonctionner en un clic. Le jeton est un cuid
 * propre à chaque prospect, non deviné et non réutilisable pour un autre.
 *
 * Répond aussi au flux « one-click » (en-tête List-Unsubscribe-Post) que les
 * grands fournisseurs de messagerie déclenchent depuis leur interface : ils
 * envoient un POST sur cette URL, sans interaction humaine.
 *
 * Idempotent : un second appel renvoie 200, jamais une erreur.
 */
export async function POST(req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  try {
    const limited = rateLimit(req, { max: 30, windowMs: 60 * 1000, keyPrefix: "desabonnement" });
    if (limited) return limited;

    const { token } = await params;
    if (!token || token.length < 8) {
      return NextResponse.json({ error: "Lien de désinscription invalide." }, { status: 400 });
    }

    const prospect = await prisma.prospect.findUnique({
      where: { unsubscribeToken: token },
      select: { id: true, nom: true, email: true, unsubscribedAt: true },
    });

    // On ne révèle pas si le jeton existe : réponse identique dans les deux cas.
    if (!prospect) {
      return NextResponse.json({ success: true, deja: false });
    }

    if (prospect.unsubscribedAt) {
      return NextResponse.json({ success: true, deja: true, nom: prospect.nom });
    }

    await prisma.$transaction([
      prisma.prospect.update({
        where: { id: prospect.id },
        data: {
          unsubscribedAt: new Date(),
          statut: "DESABONNE",
          // Coupe aussi l'éligibilité au niveau du moteur de ciblage.
          emailValide: false,
        },
      }),
      // Les envois encore en file pour ce prospect ne partiront pas.
      prisma.campaignRecipient.updateMany({
        where: { prospectId: prospect.id, status: "EN_ATTENTE" },
        data: { status: "IGNORE", error: "Désinscription du prospect" },
      }),
    ]);

    return NextResponse.json({ success: true, deja: false, nom: prospect.nom });
  } catch (err) {
    console.error("[POST /api/desabonnement/[token]]", err);
    return NextResponse.json({ error: "Erreur lors de la désinscription." }, { status: 500 });
  }
}

/** GET — état du lien, pour afficher la page de confirmation. */
export async function GET(_req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  try {
    const { token } = await params;
    const prospect = await prisma.prospect.findUnique({
      where: { unsubscribeToken: token },
      select: { nom: true, email: true, unsubscribedAt: true },
    });
    if (!prospect) return NextResponse.json({ valide: false });
    return NextResponse.json({
      valide: true,
      nom: prospect.nom,
      email: prospect.email,
      deja: prospect.unsubscribedAt !== null,
    });
  } catch (err) {
    console.error("[GET /api/desabonnement/[token]]", err);
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}
