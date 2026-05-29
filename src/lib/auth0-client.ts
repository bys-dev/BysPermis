import { Auth0Client } from "@auth0/nextjs-auth0/server"
import { enrichSessionWithRole } from "@/lib/auth0-session"

/**
 * Client Auth0 unique — utilisé par proxy.ts (routes /auth/*) et lib/auth0.ts.
 * Le hook beforeSessionSaved DOIT être ici : sans lui, le rôle n'est jamais lu au callback.
 */
export const auth0 = new Auth0Client({
  async beforeSessionSaved(session, idToken) {
    return enrichSessionWithRole(session, idToken)
  },
})
