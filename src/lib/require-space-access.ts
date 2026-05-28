import { redirect } from "next/navigation"
import type { User } from "@/generated/prisma/client"
import { getCurrentUser, getDashboardPathForRole } from "@/lib/auth0"
import {
  CENTRE_ROLES,
  PLATFORM_ADMIN_ROLES,
  PLATFORM_ROLES,
} from "@/lib/auth0"

/**
 * Vérifie l'auth et le rôle pour un espace protégé ; redirige sinon.
 */
export async function requireSpaceAccess(
  allowedRoles: readonly string[],
  returnToPath: string,
): Promise<User> {
  const user = await getCurrentUser()
  if (!user) {
    redirect(`/connexion?returnTo=${encodeURIComponent(returnToPath)}`)
  }
  if (!allowedRoles.includes(user.role)) {
    redirect(getDashboardPathForRole(user.role))
  }
  return user
}

export const ADMIN_SPACE_ROLES = PLATFORM_ADMIN_ROLES
export const CENTRE_SPACE_ROLES = [...CENTRE_ROLES, ...PLATFORM_ADMIN_ROLES] as const
export const PLATFORM_SPACE_ROLES = PLATFORM_ROLES
