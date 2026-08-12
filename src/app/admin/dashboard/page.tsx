import { requireAdmin } from "@/lib/auth0";
import { getAdminStatsForDashboard } from "@/lib/dashboard/admin-stats";
import AdminDashboardClient from "./AdminDashboardClient";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const user = await requireAdmin();

  let stats;
  try {
    stats = await getAdminStatsForDashboard();
  } catch (err) {
    console.error("[admin/dashboard] stats load failed:", err);
    stats = {
      revenusPlateforme: 0,
      // Les statistiques n'ont pas pu être chargées : on n'affiche pas une
      // évolution nulle, qui se lirait comme un mois stable.
      revenusEvolution: null,
      centresActifs: 0,
      centresEnAttente: 0,
      reservationsCeMois: 0,
      reservationsEvolution: null,
      utilisateurs: 0,
      ticketsOuverts: 0,
      reservationsRecentes: [],
      centresEnAttenteList: [],
      monthlyData: [],
      topFormations: [],
      topCentres: [],
      growth: { revenue: 0, reservations: 0 },
      activityFeed: [],
      questionnaires: { platformAverage: null, platformCount: 0, recentPlatform: [] },
    };
  }

  return (
    <AdminDashboardClient
      initialStats={stats}
      user={{ prenom: user.prenom, nom: user.nom, role: user.role as "ADMIN" | "OWNER" }}
    />
  );
}

