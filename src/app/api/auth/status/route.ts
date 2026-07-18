import { NextResponse } from "next/server"
import { auth0 } from "@/lib/auth0-client"

/**
 * GET /api/auth/status — signal léger "session Auth0 valide ?".
 *
 * Ne touche NI la base NI l'API Management Auth0 : lit uniquement le cookie
 * de session (déchiffrement local). C'est le seul signal fiable pour savoir
 * si l'utilisateur est connecté — contrairement à /api/users/me qui dépend de
 * la DB + Management API et peut renvoyer 401 sur un simple hoquet transitoire.
 *
 * Répond toujours 200 avec { authenticated: boolean } pour que le header
 * distingue "non connecté" (authenticated:false) d'une erreur réseau (fetch qui throw).
 */
export async function GET() {
  try {
    const session = await auth0.getSession()
    return NextResponse.json({ authenticated: !!session?.user })
  } catch {
    return NextResponse.json({ authenticated: false })
  }
}
