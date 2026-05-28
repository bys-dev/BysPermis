import { requireAdmin } from "@/lib/auth0";
import { getAdminStatsForDashboard } from "@/lib/dashboard/admin-stats";
import AdminDashboardClient from "./AdminDashboardClient";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const user = await requireAdmin();
  const stats = await getAdminStatsForDashboard();

  return (
    <AdminDashboardClient
      initialStats={stats}
      user={{ prenom: user.prenom, nom: user.nom, role: user.role as "ADMIN" | "OWNER" }}
    />
  );
}

