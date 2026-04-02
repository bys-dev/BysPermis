import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth0";

// GET /api/auth/me — Retourne les infos de l'utilisateur connecte
export async function GET() {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: "Non authentifie" }, { status: 401 });
    }

    return NextResponse.json({
      id: user.id,
      email: user.email,
      nom: user.nom,
      prenom: user.prenom,
      role: user.role,
    });
  } catch {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
