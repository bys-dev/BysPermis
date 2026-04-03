import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth0";

// GET /api/admin/centres — Liste complete des centres (admin)
export async function GET(req: NextRequest) {
  try {
    await requireAdmin();
    const { searchParams } = req.nextUrl;
    const statut = searchParams.get("statut");
    const search = searchParams.get("search");

    const validStatuts = ["ACTIF", "EN_ATTENTE", "SUSPENDU"];
    const statutFilter =
      statut && validStatuts.includes(statut)
        ? { statut: statut as "ACTIF" | "EN_ATTENTE" | "SUSPENDU" }
        : {};

    const centres = await prisma.centre.findMany({
      where: {
        ...statutFilter,
        ...(search
          ? {
              OR: [
                { nom: { contains: search, mode: "insensitive" } },
                { ville: { contains: search, mode: "insensitive" } },
                { email: { contains: search, mode: "insensitive" } },
              ],
            }
          : {}),
      },
      include: {
        user: { select: { email: true, prenom: true, nom: true } },
        subscriptionPlan: {
          select: { nom: true, prix: true },
        },
        formations: {
          where: { isActive: true },
          select: {
            id: true,
            titre: true,
            prix: true,
            isQualiopi: true,
            isCPF: true,
            modalite: true,
            sessions: {
              select: { id: true },
            },
          },
        },
        _count: {
          select: {
            formations: true,
            membres: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Calculate revenue for each centre
    const centresWithRevenue = await Promise.all(
      centres.map(async (centre) => {
        const reservations = await prisma.reservation.findMany({
          where: {
            status: { in: ["CONFIRMEE", "TERMINEE"] },
            session: {
              formation: { centreId: centre.id },
            },
          },
          select: { montant: true, commissionMontant: true },
        });

        const totalRevenue = reservations.reduce((sum, r) => sum + r.montant, 0);
        const sessionCount = centre.formations.reduce(
          (sum, f) => sum + f.sessions.length,
          0
        );

        return {
          id: centre.id,
          nom: centre.nom,
          slug: centre.slug,
          ville: centre.ville,
          adresse: centre.adresse,
          codePostal: centre.codePostal,
          telephone: centre.telephone,
          email: centre.email,
          siteWeb: centre.siteWeb,
          statut: centre.statut,
          isActive: centre.isActive,
          subscriptionStatus: centre.subscriptionStatus,
          createdAt: centre.createdAt,
          updatedAt: centre.updatedAt,
          certifications: centre.certifications,
          ownerEmail: centre.user.email,
          ownerNom: `${centre.user.prenom} ${centre.user.nom}`,
          subscriptionPlan: centre.subscriptionPlan
            ? { nom: centre.subscriptionPlan.nom, prix: centre.subscriptionPlan.prix }
            : null,
          formationCount: centre._count.formations,
          sessionCount,
          membreCount: centre._count.membres,
          revenue: Math.round(totalRevenue),
          formations: centre.formations.map((f) => ({
            id: f.id,
            titre: f.titre,
            prix: f.prix,
            isQualiopi: f.isQualiopi,
            isCPF: f.isCPF,
            modalite: f.modalite,
            sessionCount: f.sessions.length,
          })),
        };
      })
    );

    return NextResponse.json(centresWithRevenue);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erreur serveur";
    if (message === "Non authentifié" || message === "Non autorisé") {
      return NextResponse.json({ error: message }, { status: 401 });
    }
    console.error("[GET /api/admin/centres]", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// PATCH /api/admin/centres — Changer le statut d'un centre
export async function PATCH(req: NextRequest) {
  try {
    await requireAdmin();
    const body = await req.json();
    const { id, statut } = body;

    if (!id || !statut) {
      return NextResponse.json({ error: "id et statut requis" }, { status: 400 });
    }
    if (!["ACTIF", "SUSPENDU", "EN_ATTENTE"].includes(statut)) {
      return NextResponse.json({ error: "Statut invalide" }, { status: 400 });
    }

    const centre = await prisma.centre.update({
      where: { id },
      data: { statut, isActive: statut === "ACTIF" },
    });

    return NextResponse.json(centre);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erreur serveur";
    if (message === "Non authentifié" || message === "Non autorisé") {
      return NextResponse.json({ error: message }, { status: 401 });
    }
    console.error("[PATCH /api/admin/centres]", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
