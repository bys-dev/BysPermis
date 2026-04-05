import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth0";

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

    switch (type) {
      case "centres": {
        const centres = await prisma.centre.findMany({
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
        const users = await prisma.user.findMany({
          orderBy: { createdAt: "desc" },
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
        const reservations = await prisma.reservation.findMany({
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
    console.error("[GET /api/admin/exports]", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
