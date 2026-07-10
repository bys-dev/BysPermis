import { Auth0Client } from "@auth0/nextjs-auth0/server"
import { enrichSessionWithRole } from "@/lib/auth0-session"

/**
 * Client Auth0 unique — utilisé par proxy.ts (routes /auth/*) et lib/auth0.ts.
 * Le hook beforeSessionSaved DOIT être ici : sans lui, le rôle n'est jamais lu au callback.
 */
export const auth0 = new Auth0Client({
  session: {
    rolling: true,
    // Défauts SDK trop courts (1 j d'inactivité / 3 j max) → déconnexions intempestives.
    inactivityDuration: 60 * 60 * 24 * 7, // 7 jours sans activité
    absoluteDuration: 60 * 60 * 24 * 30, // 30 jours maximum
  },
  async beforeSessionSaved(session, idToken) {
    return enrichSessionWithRole(session, idToken)
  },
})
