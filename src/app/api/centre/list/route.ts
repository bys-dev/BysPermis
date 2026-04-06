import { NextResponse } from "next/server";
import { requireCentreStaff } from "@/lib/auth0";
import { getUserCentres, getUserCentreId } from "@/lib/centre-utils";

// GET /api/centre/list — Returns all centres the current user has access to
export async function GET() {
  try {
    const user = await requireCentreStaff();
    const centres = await getUserCentres(user.id, user.role);
    const activeCentreId = await getUserCentreId(user.id, user.role);

    return NextResponse.json({
      centres: centres.map((c) => ({
        ...c,
        isActive: c.id === activeCentreId,
      })),
      activeCentreId,
    });
  } catch {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }
}
