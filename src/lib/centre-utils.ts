import { prisma } from "@/lib/prisma";

/**
 * Resolve the centreId for a given user (owner or staff member).
 */
export async function getUserCentreId(
  userId: string,
  userRole: string
): Promise<string | null> {
  if (userRole === "CENTRE_OWNER") {
    const centre = await prisma.centre.findUnique({
      where: { userId },
      select: { id: true },
    });
    return centre?.id ?? null;
  }

  // For admins, formateurs, secrétaires — look up CentreMembre
  const membership = await prisma.centreMembre.findFirst({
    where: { userId },
    select: { centreId: true },
  });
  return membership?.centreId ?? null;
}
