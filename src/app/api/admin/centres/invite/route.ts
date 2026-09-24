import { NextRequest, NextResponse } from "next/server";
import { mapAuthError, requireAdmin } from "@/lib/auth0";
import { sendCentreInvitationEmail } from "@/lib/email";
import { rateLimit } from "@/lib/rate-limit";
import { CentreAccountError, createCentreOwnerAccount } from "@/lib/centre-account";

// ─── POST /api/admin/centres/invite ──────────────────────
// Création manuelle d'un centre + de son compte propriétaire par le staff.

export async function POST(req: NextRequest) {
  try {
    const limited = rateLimit(req, {
      max: 20,
      windowMs: 60 * 1000,
      keyPrefix: "admin-invite",
    });
    if (limited) return limited;

    await requireAdmin();

    const body = await req.json();
    const { nom, email, ville, adresse, codePostal, telephone, siret } = body;

    // ── Validation ──────────────────────────────────────
    if (!nom?.trim()) {
      return NextResponse.json({ error: "Le nom du centre est requis." }, { status: 400 });
    }
    if (!email?.trim()) {
      return NextResponse.json({ error: "L'email du proprietaire est requis." }, { status: 400 });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "Email invalide." }, { status: 400 });
    }

    const account = await createCentreOwnerAccount({
      email,
      ownerNom: nom.trim(),
      centre: {
        nom: nom.trim(),
        adresse: adresse?.toString(),
        codePostal: codePostal?.toString(),
        ville: ville?.toString(),
        telephone: telephone?.toString(),
        siret: siret?.toString(),
      },
    });

    // ── Send invitation email ──────────────────────────
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    try {
      await sendCentreInvitationEmail({
        to: email.trim().toLowerCase(),
        centreName: nom.trim(),
        loginUrl: `${appUrl}/connexion`,
        tempPassword: account.tempPassword ?? undefined,
      });
    } catch (emailErr) {
      console.error("[invite] Erreur envoi email d'invitation:", emailErr);
      // Le centre est créé : on ne fait pas échouer la requête.
    }

    return NextResponse.json(
      {
        success: true,
        message: "Centre cree et invitation envoyee.",
        centre: { id: account.centreId, nom: nom.trim(), slug: account.centreSlug },
        user: { id: account.userId, email: email.trim().toLowerCase() },
      },
      { status: 201 },
    );
  } catch (err) {
    if (err instanceof CentreAccountError) {
      return NextResponse.json(
        { error: err.message },
        { status: err.code === "EMAIL_HAS_CENTRE" ? 409 : 502 },
      );
    }
    const authResponse = mapAuthError(err);
    if (authResponse) return authResponse;
    console.error("[POST /api/admin/centres/invite]", err);
    return NextResponse.json({ error: "Erreur serveur. Veuillez reessayer." }, { status: 500 });
  }
}
