import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth0";

/**
 * POST /api/auth/resend-verification
 * Triggers Auth0 Management API to resend verification email.
 */
export async function POST() {
  try {
    const user = await requireAuth();

    // Get Auth0 Management API token
    const domain = process.env.AUTH0_ISSUER_BASE_URL?.replace("https://", "").replace("http://", "");
    const clientId = process.env.AUTH0_MANAGEMENT_CLIENT_ID;
    const clientSecret = process.env.AUTH0_MANAGEMENT_CLIENT_SECRET;

    if (!domain || !clientId || !clientSecret) {
      console.error("Missing AUTH0_MANAGEMENT env vars");
      return NextResponse.json(
        { error: "Configuration manquante pour le service email." },
        { status: 500 }
      );
    }

    // Get management token
    const tokenRes = await fetch(`https://${domain}/oauth/token`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        grant_type: "client_credentials",
        client_id: clientId,
        client_secret: clientSecret,
        audience: `https://${domain}/api/v2/`,
      }),
    });

    if (!tokenRes.ok) {
      console.error("Failed to get management token:", await tokenRes.text());
      return NextResponse.json(
        { error: "Impossible d'obtenir le jeton d'acces." },
        { status: 500 }
      );
    }

    const { access_token } = await tokenRes.json();

    // Send verification email
    const verifyRes = await fetch(`https://${domain}/api/v2/jobs/verification-email`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${access_token}`,
      },
      body: JSON.stringify({
        user_id: user.auth0Id,
        client_id: process.env.AUTH0_CLIENT_ID,
      }),
    });

    if (!verifyRes.ok) {
      const errBody = await verifyRes.text();
      console.error("Failed to send verification email:", errBody);
      return NextResponse.json(
        { error: "Impossible d'envoyer l'email de verification." },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, message: "Email de verification envoye." });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erreur serveur";
    if (message === "Non authentifie" || message === "Non autorise") {
      return NextResponse.json({ error: message }, { status: 401 });
    }
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
