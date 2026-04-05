import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireCentreManagement } from "@/lib/auth0";
import { getUserCentreId } from "@/lib/centre-utils";

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
  // BOM for Excel UTF-8 compatibility
  const bom = "\uFEFF";
  return new NextResponse(bom + csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}

// GET /api/centre/exports?type=reservations|sessions|formations|revenus
export async function GET(request: NextRequest) {
  try {
    const user = await requireCentreManagement();
    const centreId = await getUserCentreId(user.id, user.role);
    if (!centreId) {
      return NextResponse.json({ error: "Centre introuvable" }, { status: 404 });
    }

    const centre = await prisma.centre.findUnique({
      where: { id: centreId },
      include: { subscriptionPlan: { select: { commissionRate: true } } },
    });
    if (!centre) {
      return NextResponse.json({ error: "Centre introuvable" }, { status: 404 });
    }

    const commissionRate = centre.subscriptionPlan?.commissionRate ?? 10;
    const type = request.nextUrl.searchParams.get("type");

    switch (type) {
      case "reservations": {
        const reservations = await prisma.reservation.findMany({
          where: { session: { formation: { centreId } } },
          include: {
            session: { include: { formation: { select: { titre: true } } } },
          },
          orderBy: { createdAt: "desc" },
        });

        const header = "Date,Eleve,Email,Telephone,Formation,Session,Montant,Statut";
        const rows = reservations.map((r) =>
          [
            csvEscape(formatDateFR(r.createdAt)),
            csvEscape(`${r.prenom} ${r.nom}`),
            csvEscape(r.email),
            csvEscape(r.telephone),
            csvEscape(r.session.formation.titre),
            csvEscape(formatDateFR(r.session.dateDebut)),
            csvEscape(formatEUR(r.montant)),
            csvEscape(r.status),
          ].join(",")
        );

        return csvResponse([header, ...rows].join("\n"), `reservations-${centre.slug}.csv`);
      }

      case "sessions": {
        const sessions = await prisma.session.findMany({
          where: { formation: { centreId } },
          include: { formation: { select: { titre: true } } },
          orderBy: { dateDebut: "desc" },
        });

        const header = "Formation,Date debut,Date fin,Places totales,Places restantes,Taux remplissage,Statut";
        const rows = sessions.map((s) => {
          const taux = s.placesTotal > 0
            ? Math.round(((s.placesTotal - s.placesRestantes) / s.placesTotal) * 100)
            : 0;
          return [
            csvEscape(s.formation.titre),
            csvEscape(formatDateFR(s.dateDebut)),
            csvEscape(formatDateFR(s.dateFin)),
            csvEscape(s.placesTotal),
            csvEscape(s.placesRestantes),
            csvEscape(`${taux}%`),
            csvEscape(s.status),
          ].join(",");
        });

        return csvResponse([header, ...rows].join("\n"), `sessions-${centre.slug}.csv`);
      }

      case "formations": {
        const formations = await prisma.formation.findMany({
          where: { centreId },
          include: {
            sessions: { select: { id: true } },
            _count: { select: { sessions: true } },
          },
        });

        // Count reservations per formation
        const formationIds = formations.map((f) => f.id);
        const reservationCounts = await prisma.reservation.groupBy({
          by: ["sessionId"],
          where: {
            session: { formationId: { in: formationIds } },
            status: { in: ["CONFIRMEE", "TERMINEE"] },
          },
          _count: true,
        });

        // Build a map sessionId -> formationId
        const sessionToFormation = new Map<string, string>();
        for (const f of formations) {
          for (const s of f.sessions) {
            sessionToFormation.set(s.id, f.id);
          }
        }

        const formationResCounts = new Map<string, number>();
        for (const rc of reservationCounts) {
          const fId = sessionToFormation.get(rc.sessionId);
          if (fId) {
            formationResCounts.set(fId, (formationResCounts.get(fId) ?? 0) + rc._count);
          }
        }

        const header = "Titre,Prix,Duree,Modalite,Qualiopi,CPF,Sessions,Reservations";
        const rows = formations.map((f) =>
          [
            csvEscape(f.titre),
            csvEscape(formatEUR(f.prix)),
            csvEscape(f.duree),
            csvEscape(f.modalite),
            csvEscape(f.isQualiopi ? "Oui" : "Non"),
            csvEscape(f.isCPF ? "Oui" : "Non"),
            csvEscape(f._count.sessions),
            csvEscape(formationResCounts.get(f.id) ?? 0),
          ].join(",")
        );

        return csvResponse([header, ...rows].join("\n"), `formations-${centre.slug}.csv`);
      }

      case "revenus": {
        const now = new Date();
        const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);

        const reservations = await prisma.reservation.findMany({
          where: {
            session: { formation: { centreId } },
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

        const header = "Mois,Reservations,Revenu brut,Commission,Revenu net";
        const rows: string[] = [];

        for (let i = 5; i >= 0; i--) {
          const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
          const monthNum = String(d.getMonth() + 1).padStart(2, "0");
          const label = `${monthLabels[monthNum]} ${d.getFullYear()}`;
          const monthRes = reservations.filter((r) => {
            const rd = new Date(r.createdAt);
            return rd.getFullYear() === d.getFullYear() && rd.getMonth() === d.getMonth();
          });
          const brut = monthRes.reduce((sum, r) => sum + r.montant, 0);
          const commission = brut * (commissionRate / 100);
          const net = brut - commission;

          rows.push(
            [
              csvEscape(label),
              csvEscape(monthRes.length),
              csvEscape(formatEUR(brut)),
              csvEscape(formatEUR(commission)),
              csvEscape(formatEUR(net)),
            ].join(",")
          );
        }

        return csvResponse([header, ...rows].join("\n"), `revenus-${centre.slug}.csv`);
      }

      default:
        return NextResponse.json(
          { error: "Type d'export invalide. Types valides: reservations, sessions, formations, revenus" },
          { status: 400 }
        );
    }
  } catch (err) {
    console.error("[GET /api/centre/exports]", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
