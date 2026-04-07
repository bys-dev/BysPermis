import { getCurrentUser } from "@/lib/auth0"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"

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

  // Email verification check (skip for ADMIN/OWNER — social login auto-verifies)
  if (!user.emailVerified && user.role !== "ADMIN" && user.role !== "OWNER") {
    redirect("/dashboard/verify-email")
  }

  // Student onboarding check — only for ELEVE role
  if (user.role === "ELEVE" && !user.isProfileComplete) {
    redirect("/dashboard/onboarding")
  }

  // Maintenance mode check — non-admin users get redirected
  if (user.role !== "ADMIN" && user.role !== "OWNER") {
    let isMaintenanceMode = false
    try {
      const settings = await prisma.platformSettings.findUnique({ where: { id: "default" } })
      isMaintenanceMode = settings?.maintenanceMode ?? false
    } catch {
      // If settings fetch fails, don't block — continue normally
    }
    if (isMaintenanceMode) {
      redirect("/maintenance")
    }
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
