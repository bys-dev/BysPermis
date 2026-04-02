import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth0";

// GET /api/admin/me — Return current admin user info
export async function GET() {
  try {
    const user = await requireAdmin();
    return NextResponse.json({
      id: user.id,
      prenom: user.prenom,
      nom: user.nom,
      email: user.email,
      role: user.role,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erreur serveur";
    if (message === "Non authentifié" || message === "Non autorisé") {
      return NextResponse.json({ error: message }, { status: 401 });
    }
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
