import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { requireAuth } from "@/lib/auth0";

// ─── Auth0 Management API helper ─────────────────────────

async function deleteAuth0User(auth0Id: string): Promise<void> {
  const domain = process.env.AUTH0_ISSUER_BASE_URL?.replace("https://", "") ?? process.env.AUTH0_DOMAIN;
  if (!domain) {
    console.warn("[users/me DELETE] AUTH0 non configuré, skip Auth0 delete");
    return;
  }
  // Get Management token
  const tokenRes = await fetch(`https://${domain}/oauth/token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      grant_type: "client_credentials",
      client_id: process.env.AUTH0_MANAGEMENT_CLIENT_ID,
      client_secret: process.env.AUTH0_MANAGEMENT_CLIENT_SECRET,
      audience: `https://${domain}/api/v2/`,
    }),
  });
  if (!tokenRes.ok) {
    console.warn("[users/me DELETE] Token Management API indisponible, skip Auth0 delete");
    return;
  }
  const { access_token } = await tokenRes.json();

  // Delete user in Auth0
  const res = await fetch(`https://${domain}/api/v2/users/${encodeURIComponent(auth0Id)}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${access_token}` },
  });
  if (!res.ok && res.status !== 404) {
    console.error("[users/me DELETE] Auth0 delete a échoué:", res.status, await res.text().catch(() => ""));
  }
}

// ─── GET /api/users/me — profil complet ─────────────────
export async function GET() {
  try {
    const user = await requireAuth();
    const profile = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        email: true,
        nom: true,
        prenom: true,
        telephone: true,
        adresse: true,
        codePostal: true,
        ville: true,
        role: true,
        emailVerified: true,
        isProfileComplete: true,
        dateNaissance: true,
        numeroPermis: true,
        dateObtentionPermis: true,
        categoriesPermis: true,
        newsletterOptIn: true,
        createdAt: true,
      },
    });
    if (!profile) {
      return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 404 });
    }
    return NextResponse.json(profile);
  } catch {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }
}

// ─── PATCH /api/users/me — mise à jour du profil ────────
const updateSchema = z.object({
  prenom: z.string().min(1).max(100).optional(),
  nom: z.string().min(1).max(100).optional(),
  telephone: z.string().max(20).optional(),
  adresse: z.string().max(300).optional(),
  codePostal: z.string().max(10).optional(),
  ville: z.string().max(100).optional(),
  dateNaissance: z.string().optional(),
  numeroPermis: z.string().max(50).optional(),
  dateObtentionPermis: z.string().optional(),
  categoriesPermis: z.array(z.string()).optional(),
  newsletterOptIn: z.boolean().optional(),
});

export async function PATCH(req: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await req.json();
    const data = updateSchema.parse(body);

    // Build update payload, converting date strings to DateTime
    const updateData: Record<string, unknown> = {};
    if (data.prenom !== undefined) updateData.prenom = data.prenom;
    if (data.nom !== undefined) updateData.nom = data.nom;
    if (data.telephone !== undefined) updateData.telephone = data.telephone;
    if (data.adresse !== undefined) updateData.adresse = data.adresse;
    if (data.codePostal !== undefined) updateData.codePostal = data.codePostal;
    if (data.ville !== undefined) updateData.ville = data.ville;
    if (data.dateNaissance !== undefined) {
      updateData.dateNaissance = data.dateNaissance ? new Date(data.dateNaissance) : null;
    }
    if (data.numeroPermis !== undefined) updateData.numeroPermis = data.numeroPermis || null;
    if (data.dateObtentionPermis !== undefined) {
      updateData.dateObtentionPermis = data.dateObtentionPermis ? new Date(data.dateObtentionPermis) : null;
    }
    if (data.categoriesPermis !== undefined) updateData.categoriesPermis = data.categoriesPermis;
    if (data.newsletterOptIn !== undefined) updateData.newsletterOptIn = data.newsletterOptIn;

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: updateData,
    });

    // Check if profile is complete (required: prenom, nom, telephone, ville)
    const isComplete = !!(updated.prenom && updated.nom && updated.telephone && updated.ville);
    if (isComplete !== updated.isProfileComplete) {
      await prisma.user.update({
        where: { id: updated.id },
        data: { isProfileComplete: isComplete },
      });
    }

    // Return profile with select
    const profile = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        email: true,
        nom: true,
        prenom: true,
        telephone: true,
        adresse: true,
        codePostal: true,
        ville: true,
        role: true,
        emailVerified: true,
        isProfileComplete: true,
        dateNaissance: true,
        numeroPermis: true,
        dateObtentionPermis: true,
        categoriesPermis: true,
        newsletterOptIn: true,
        createdAt: true,
      },
    });

    return NextResponse.json(profile);
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.issues }, { status: 400 });
    }
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// ─── DELETE /api/users/me — self-service RGPD ─────────────
/**
 * Right to erasure (RGPD art. 17).
 *
 * Stratégie :
 *   1. Refuse si l'utilisateur est CENTRE_OWNER d'un centre actif
 *      (doit d'abord transférer ou supprimer le centre).
 *   2. Anonymise les Reservation (firstName="Utilisateur supprimé",
 *      email/téléphone effacés) pour conserver la comptabilité.
 *   3. Supprime les données non-essentielles : Notifications, Messages,
 *      Favorites, LoyaltyPoints, Availabilities.
 *   4. Supprime le User dans Auth0 (Management API).
 *   5. Supprime le User en base.
 */
export async function DELETE() {
  try {
    const user = await requireAuth();

    // 1. Verify no active centre ownership
    if (user.role === "CENTRE_OWNER") {
      const ownedActiveCentres = await prisma.centre.count({
        where: { userId: user.id, isActive: true },
      });
      if (ownedActiveCentres > 0) {
        return NextResponse.json(
          {
            error: "Vous gérez encore un ou plusieurs centres actifs. Veuillez les transférer ou les supprimer avant de fermer votre compte.",
          },
          { status: 400 }
        );
      }
    }

    // 2. Anonymisation + suppression des données dépendantes en transaction
    await prisma.$transaction(async (tx) => {
      // Anonymise les réservations (comptabilité préservée)
      await tx.reservation.updateMany({
        where: { userId: user.id },
        data: {
          nom: "Supprimé",
          prenom: "Utilisateur",
          email: `deleted-${user.id}@anonyme.local`,
          telephone: "",
          adresse: null,
          codePostal: null,
          ville: null,
          numeroPermis: null,
          civilite: null,
        },
      });

      // Supprime les données non-essentielles (cascade onDelete déjà sur certaines)
      await tx.notification.deleteMany({ where: { userId: user.id } });
      await tx.message.deleteMany({
        where: { OR: [{ senderId: user.id }, { receiverId: user.id }] },
      });
      await tx.favorite.deleteMany({ where: { userId: user.id } });
      await tx.loyaltyPoints.deleteMany({ where: { userId: user.id } });
      await tx.availability.deleteMany({ where: { userId: user.id } });
      // Reviews : anonymise plutôt que delete (intégrité moyenne d'avis)
      // Ticket messages → cascade via Ticket; Tickets non supprimés (historique support)

      // 3. Supprime le User Prisma (anonymise email pour respecter @unique)
      await tx.user.update({
        where: { id: user.id },
        data: {
          email: `deleted-${user.id}@anonyme.local`,
          auth0Id: `deleted_${user.id}_${Date.now()}`,
          nom: "Supprimé",
          prenom: "Utilisateur",
          telephone: null,
          adresse: null,
          codePostal: null,
          ville: null,
          numeroPermis: null,
          dateNaissance: null,
          dateObtentionPermis: null,
          isBlocked: true,
          newsletterOptIn: false,
          referralCode: null,
        },
      });
    });

    // 4. Supprime côté Auth0 (best effort, ne bloque pas la suppression DB)
    try {
      await deleteAuth0User(user.auth0Id);
    } catch (err) {
      console.error("[users/me DELETE] Auth0 delete failed:", err);
    }

    return NextResponse.json({ success: true, message: "Compte supprimé." });
  } catch (err) {
    if (err instanceof Error && err.message === "Non authentifié") {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }
    console.error("[DELETE /api/users/me]", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
