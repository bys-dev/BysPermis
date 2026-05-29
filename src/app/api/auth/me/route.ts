import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth0";
import { resolveAuth0Role } from "@/lib/auth0-management";
import { auth0 } from "@/lib/auth0";

// GET /api/auth/me — Utilisateur connecté (rôle synchronisé depuis Auth0)
export async function GET() {
  try {
    const session = await auth0.getSession();
    const user = await getCurrentUser();

    if (!user || !session?.user) {
      return NextResponse.json({ error: "Non authentifie" }, { status: 401 });
    }

    const auth0Id = session.user.sub as string;
    const auth0Role = await resolveAuth0Role(
      auth0Id,
      session.user as Record<string, unknown>,
      session.user.email as string | undefined,
    );

    return NextResponse.json({
      id: user.id,
      email: user.email,
      nom: user.nom,
      prenom: user.prenom,
      role: user.role,
      auth0Role: auth0Role ?? null,
      roleSource: "auth0",
    });
  } catch {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
