import { prisma } from "@/lib/prisma";

/**
 * Resolve the centreId for a given user (owner or staff member).
 * Uses the user's activeCentreId if set, otherwise falls back to the first
 * owned centre or first membership.
 */
export async function getUserCentreId(
  userId: string,
  userRole: string
): Promise<string | null> {
  // 1. Check user's activeCentreId first
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { activeCentreId: true },
  });

  if (user?.activeCentreId) {
    // Verify user actually has access to this centre
    if (userRole === "CENTRE_OWNER") {
      const centre = await prisma.centre.findFirst({
        where: { id: user.activeCentreId, userId },
      });
      if (centre) return centre.id;
    } else {
      const membre = await prisma.centreMembre.findFirst({
        where: { userId, centreId: user.activeCentreId },
      });
      if (membre) return user.activeCentreId;
    }
  }

  // 2. Fallback to first owned centre or first membership
  if (userRole === "CENTRE_OWNER") {
    const centre = await prisma.centre.findFirst({ where: { userId } });
    return centre?.id ?? null;
  }

  const membre = await prisma.centreMembre.findFirst({ where: { userId } });
  return membre?.centreId ?? null;
}

/**
 * Returns all centres the user has access to (owned + member).
 */
export async function getUserCentres(
  userId: string,
  userRole: string
): Promise<Array<{ id: string; nom: string; ville: string; role: string; statut: string; profilCompletionPct: number }>> {
  const results: Array<{ id: string; nom: string; ville: string; role: string; statut: string; profilCompletionPct: number }> = [];

  // Centres owned by the user
  if (userRole === "CENTRE_OWNER") {
    const ownedCentres = await prisma.centre.findMany({
      where: { userId },
      select: { id: true, nom: true, ville: true, statut: true, profilCompletionPct: true },
      orderBy: { createdAt: "asc" },
    });
    for (const c of ownedCentres) {
      results.push({
        id: c.id,
        nom: c.nom,
        ville: c.ville,
        role: "CENTRE_OWNER",
        statut: c.statut,
        profilCompletionPct: c.profilCompletionPct,
      });
    }
  }

  // Centres where the user is a member (staff)
  const memberships = await prisma.centreMembre.findMany({
    where: { userId },
    include: {
      centre: {
        select: { id: true, nom: true, ville: true, statut: true, profilCompletionPct: true },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  for (const m of memberships) {
    // Avoid duplicates (if user is both owner and member)
    if (!results.some((r) => r.id === m.centre.id)) {
      results.push({
        id: m.centre.id,
        nom: m.centre.nom,
        ville: m.centre.ville,
        role: m.role,
        statut: m.centre.statut,
        profilCompletionPct: m.centre.profilCompletionPct,
      });
    }
  }

  return results;
}
