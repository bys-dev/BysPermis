import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin, mapAuthError } from "@/lib/auth0";

const DEFAULT_LIMIT = 1000;
const MAX_LIMIT = 5000;

function parseLimit(value: string | null): number {
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0) return DEFAULT_LIMIT;
  return Math.min(Math.floor(n), MAX_LIMIT);
}

function parseDate(value: string | null): Date | null {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

function csvEscape(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return "";
  const str = String(value);
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function formatDateFR(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function formatEUR(amount: number): string {
  return `${amount.toFixed(2).replace(".", ",")} EUR`;
}

function csvResponse(csv: string, filename: string): NextResponse {
  const bom = "\uFEFF";
  return new NextResponse(bom + csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}

// GET /api/admin/exports?type=centres|users|reservations|revenus
export async function GET(request: NextRequest) {
  try {
    await requireAdmin();

    const type = request.nextUrl.searchParams.get("type");
    const limit = parseLimit(request.nextUrl.searchParams.get("limit"));
    const from = parseDate(request.nextUrl.searchParams.get("from"));
    const to = parseDate(request.nextUrl.searchParams.get("to"));

    if ((from && !to) || (!from && to)) {
      return NextResponse.json({ error: "Paramètres invalides: from et to doivent être fournis ensemble" }, { status: 400 });
    }
    if (from && to && from > to) {
      return NextResponse.json({ error: "Paramètres invalides: from doit être <= to" }, { status: 400 });
    }

    switch (type) {
      case "centres": {
        if (!from || !to) {
          return NextResponse.json({ error: "Paramètres requis: from et to (ISO date) pour l'export centres" }, { status: 400 });
        }
        const centres = await prisma.centre.findMany({
          where: { createdAt: { gte: from, lte: to } },
          include: {
            subscriptionPlan: { select: { nom: true } },
            formations: {
              select: {
                sessions: {
                  select: {
                    reservations: {
                      where: { status: { in: ["CONFIRMEE", "TERMINEE"] } },
                      select: { montant: true },
                    },
                  },
                },
              },
            },
          },
          orderBy: { createdAt: "desc" },
          take: limit,
        });

        const header = "Nom,Ville,Email,Statut,Plan,Profil completion,Revenus total,Inscrit le";
        const rows = centres.map((c) => {
          const totalRevenue = c.formations.reduce(
            (sum, f) =>
              sum +
              f.sessions.reduce(
                (sSum, s) => sSum + s.reservations.reduce((rSum, r) => rSum + r.montant, 0),
                0
              ),
            0
          );
          return [
            csvEscape(c.nom),
            csvEscape(c.ville),
            csvEscape(c.email),
            csvEscape(c.statut),
            csvEscape(c.subscriptionPlan?.nom ?? "Aucun"),
            csvEscape(`${c.profilCompletionPct}%`),
            csvEscape(formatEUR(totalRevenue)),
            csvEscape(formatDateFR(c.createdAt)),
          ].join(",");
        });

        return csvResponse([header, ...rows].join("\n"), "centres-bys.csv");
      }

      case "users": {
        if (!from || !to) {
          return NextResponse.json({ error: "Paramètres requis: from et to (ISO date) pour l'export users" }, { status: 400 });
        }
        const users = await prisma.user.findMany({
          where: { createdAt: { gte: from, lte: to } },
          orderBy: { createdAt: "desc" },
          take: limit,
        });

        const header = "Nom,Prenom,Email,Role,Bloque,Inscrit le";
        const rows = users.map((u) =>
          [
            csvEscape(u.nom),
            csvEscape(u.prenom),
            csvEscape(u.email),
            csvEscape(u.role),
            csvEscape(u.isBlocked ? "Oui" : "Non"),
            csvEscape(formatDateFR(u.createdAt)),
          ].join(",")
        );

        return csvResponse([header, ...rows].join("\n"), "utilisateurs-bys.csv");
      }

      case "reservations": {
        if (!from || !to) {
          return NextResponse.json({ error: "Paramètres requis: from et to (ISO date) pour l'export reservations" }, { status: 400 });
        }
        const reservations = await prisma.reservation.findMany({
          where: { createdAt: { gte: from, lte: to } },
          include: {
            session: {
              include: {
                formation: {
                  select: {
                    titre: true,
                    centre: { select: { nom: true } },
                  },
                },
              },
            },
          },
          orderBy: { createdAt: "desc" },
          take: limit,
        });

        const header = "Date,Numero,Eleve,Email,Centre,Formation,Session,Montant,Statut";
        const rows = reservations.map((r) =>
          [
            csvEscape(formatDateFR(r.createdAt)),
            csvEscape(r.numero),
            csvEscape(`${r.prenom} ${r.nom}`),
            csvEscape(r.email),
            csvEscape(r.session.formation.centre.nom),
            csvEscape(r.session.formation.titre),
            csvEscape(formatDateFR(r.session.dateDebut)),
            csvEscape(formatEUR(r.montant)),
            csvEscape(r.status),
          ].join(",")
        );

        return csvResponse([header, ...rows].join("\n"), "reservations-bys.csv");
      }

      case "revenus": {
        const now = new Date();
        const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);

        const reservations = await prisma.reservation.findMany({
          where: {
            createdAt: { gte: sixMonthsAgo },
            status: { in: ["CONFIRMEE", "TERMINEE"] },
          },
          select: { montant: true, createdAt: true },
        });

        const monthLabels: Record<string, string> = {
          "01": "Janvier", "02": "Fevrier", "03": "Mars", "04": "Avril",
          "05": "Mai", "06": "Juin", "07": "Juillet", "08": "Aout",
          "09": "Septembre", "10": "Octobre", "11": "Novembre", "12": "Decembre",
        };

        const header = "Mois,Reservations,Volume total,Commission plateforme (10%)";
        const rows: string[] = [];

        for (let i = 5; i >= 0; i--) {
          const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
          const monthNum = String(d.getMonth() + 1).padStart(2, "0");
          const label = `${monthLabels[monthNum]} ${d.getFullYear()}`;
          const monthRes = reservations.filter((r) => {
            const rd = new Date(r.createdAt);
            return rd.getFullYear() === d.getFullYear() && rd.getMonth() === d.getMonth();
          });
          const volume = monthRes.reduce((sum, r) => sum + r.montant, 0);
          const commission = volume * 0.1;

          rows.push(
            [
              csvEscape(label),
              csvEscape(monthRes.length),
              csvEscape(formatEUR(volume)),
              csvEscape(formatEUR(commission)),
            ].join(",")
          );
        }

        return csvResponse([header, ...rows].join("\n"), "revenus-plateforme-bys.csv");
      }

      default:
        return NextResponse.json(
          { error: "Type d'export invalide. Types valides: centres, users, reservations, revenus" },
          { status: 400 }
        );
    }
  } catch (err) {
    const authRes = mapAuthError(err);
    if (authRes) return authRes;
    console.error("[GET /api/admin/exports]", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
