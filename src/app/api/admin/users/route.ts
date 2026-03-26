import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth0";

// GET /api/admin/users
export async function GET(req: NextRequest) {
  try {
    await requireAdmin();
    const { searchParams } = req.nextUrl;
    const role = searchParams.get("role");
    const search = searchParams.get("search");

    const users = await prisma.user.findMany({
      where: {
        ...(role && role !== "tous" ? { role: role as "ELEVE" | "CENTRE" | "ADMIN" } : {}),
        ...(search ? {
          OR: [
            { prenom: { contains: search, mode: "insensitive" } },
            { nom:    { contains: search, mode: "insensitive" } },
            { email:  { contains: search, mode: "insensitive" } },
          ],
        } : {}),
      },
      select: {
        id: true, prenom: true, nom: true, email: true, role: true,
        isBlocked: true, createdAt: true,
        _count: { select: { reservations: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    return NextResponse.json(users);
  } catch {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// PATCH /api/admin/users — ban/unban ou changer le rôle
const patchSchema = z.object({
  id: z.string(),
  isBlocked: z.boolean().optional(),
  role: z.enum(["ELEVE", "CENTRE", "ADMIN"]).optional(),
});

export async function PATCH(req: NextRequest) {
  try {
    await requireAdmin();
    const body = await req.json();
    const { id, ...data } = patchSchema.parse(body);

    const updated = await prisma.user.update({
      where: { id },
      data,
      select: { id: true, prenom: true, nom: true, email: true, role: true, isBlocked: true },
    });
    return NextResponse.json(updated);
  } catch (err) {
    if (err instanceof z.ZodError) return NextResponse.json({ error: err.issues }, { status: 400 });
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
