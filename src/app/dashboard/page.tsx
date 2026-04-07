import { getCurrentUser } from "@/lib/auth0"
import { redirect } from "next/navigation"

/**
 * /dashboard — Server-side role-based redirect.
 *
 * After login, Auth0 callback redirects here.
 * We read the user's role from the database and redirect to the correct space:
 *   OWNER / ADMIN         → /admin/dashboard
 *   CENTRE_*              → /espace-centre/dashboard
 *   SUPPORT / COMPTABLE / COMMERCIAL → /plateforme/dashboard
 *   ELEVE (default)       → /espace-eleve
 *
 * Uses getCurrentUser() which also handles:
 * - Auto-creating the user in DB on first login
 * - Linking pre-created accounts by email
 * - Syncing role from Auth0 token to DB
 */
export default async function DashboardRedirectPage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect("/connexion")
  }

  const role = user.role

  // Redirect to the appropriate dashboard based on role
  if (role === "OWNER" || role === "ADMIN") {
    redirect("/admin/dashboard")
  }

  if (role.startsWith("CENTRE_")) {
    redirect("/espace-centre/dashboard")
  }

  if (["SUPPORT", "COMPTABLE", "COMMERCIAL"].includes(role)) {
    redirect("/plateforme/dashboard")
  }

  // Default: ELEVE
  redirect("/espace-eleve")
}
