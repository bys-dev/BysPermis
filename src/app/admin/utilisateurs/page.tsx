"use client";

import { useState, useEffect, useCallback } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faMagnifyingGlass, faUsers, faUserGraduate, faBuilding,
  faShieldHalved, faEllipsisVertical, faFilter, faEnvelope,
  faClock, faCircleCheck, faCircleXmark, faSpinner,
} from "@fortawesome/free-solid-svg-icons";
import { formatDate } from "@/lib/utils";

type Role = "ELEVE" | "CENTRE" | "ADMIN";

interface User {
  id: string;
  nom: string;
  prenom: string;
  email: string;
  role: Role;
  isBlocked: boolean;
  createdAt: string;
  _count: { reservations: number };
}

const roleMap: Record<Role, { label: string; cls: string; icon: typeof faUsers }> = {
  ELEVE:  { label: "Élève",  cls: "bg-blue-400/10 text-blue-400 border-blue-500/20",     icon: faUserGraduate },
  CENTRE: { label: "Centre", cls: "bg-purple-400/10 text-purple-400 border-purple-500/20", icon: faBuilding    },
  ADMIN:  { label: "Admin",  cls: "bg-red-400/10 text-red-400 border-red-500/20",           icon: faShieldHalved },
};

const MOCK: User[] = [
  { id: "U001", nom: "Dupont", prenom: "Jean", email: "jean.dupont@gmail.com", role: "ELEVE", isBlocked: false, createdAt: "2026-03-10T00:00:00", _count: { reservations: 3 } },
  { id: "U002", nom: "Martin", prenom: "Marie", email: "marie.martin@gmail.com", role: "ELEVE", isBlocked: false, createdAt: "2026-03-12T00:00:00", _count: { reservations: 1 } },
  { id: "U003", nom: "Petit", prenom: "Sophie", email: "sophie.petit@outlook.fr", role: "ELEVE", isBlocked: true, createdAt: "2026-03-11T00:00:00", _count: { reservations: 2 } },
  { id: "U005", nom: "BYS", prenom: "Sébastien", email: "bysforma95@gmail.com", role: "ADMIN", isBlocked: false, createdAt: "2026-03-09T00:00:00", _count: { reservations: 0 } },
];

export default function AdminUtilisateursPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterRole, setFilterRole] = useState<"tous" | Role>("tous");
  const [openMenu, setOpenMenu] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    const params = new URLSearchParams();
    if (filterRole !== "tous") params.set("role", filterRole);
    if (search) params.set("search", search);

    const res = await fetch(`/api/admin/users?${params}`).catch(() => null);
    if (!res?.ok) { setUsers(MOCK); return; }
    const data = await res.json();
    if (Array.isArray(data) && data.length > 0) setUsers(data);
    else setUsers(MOCK);
  }, [filterRole, search]);

  useEffect(() => {
    setLoading(true);
    const t = setTimeout(() => {
      fetchUsers().finally(() => setLoading(false));
    }, 200);
    return () => clearTimeout(t);
  }, [fetchUsers]);

  async function toggleBlock(id: string, current: boolean) {
    const res = await fetch("/api/admin/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, isBlocked: !current }),
    }).catch(() => null);
    if (res?.ok) {
      setUsers((prev) => prev.map((u) => u.id === id ? { ...u, isBlocked: !current } : u));
      setOpenMenu(null);
    }
  }

  const counts = {
    tous: users.length,
    ELEVE:  users.filter((u) => u.role === "ELEVE").length,
    CENTRE: users.filter((u) => u.role === "CENTRE").length,
    ADMIN:  users.filter((u) => u.role === "ADMIN").length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Utilisateurs</h1>
        <p className="text-gray-400 text-sm mt-0.5">
          {counts.tous} comptes · {counts.ELEVE} élèves · {counts.CENTRE} centres · {counts.ADMIN} admins
        </p>
      </div>

      {/* Tabs rôle */}
      <div className="flex flex-wrap gap-2">
        {(["tous", "ELEVE", "CENTRE", "ADMIN"] as const).map((r) => (
          <button
            key={r}
            onClick={() => setFilterRole(r)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors border
              ${filterRole === r
                ? "bg-white/10 text-white border-white/20"
                : "text-gray-400 border-white/8 hover:text-white hover:border-white/20"
              }`}
          >
            {r === "tous" ? "Tous" : roleMap[r].label}
            <span className="ml-2 text-xs opacity-60">{counts[r]}</span>
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <FontAwesomeIcon icon={faMagnifyingGlass} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm" />
          <input
            type="text"
            placeholder="Rechercher un utilisateur, un email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 bg-[#0A1628] border border-white/10 rounded-lg text-white placeholder-gray-500 text-sm focus:outline-none focus:border-blue-500/50"
          />
        </div>
        <button className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-white/10 text-gray-400 hover:text-white hover:border-white/20 text-sm transition-colors">
          <FontAwesomeIcon icon={faFilter} className="text-xs" />
          Filtres
        </button>
      </div>

      {/* Table */}
      <div className="bg-[#0A1628] rounded-xl border border-white/8 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16 gap-3 text-gray-500">
            <FontAwesomeIcon icon={faSpinner} className="animate-spin" />
            <span className="text-sm">Chargement…</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/8">
                  <th className="text-left text-gray-500 font-medium text-xs py-3 px-5">Utilisateur</th>
                  <th className="text-left text-gray-500 font-medium text-xs py-3 px-4">Rôle</th>
                  <th className="text-left text-gray-500 font-medium text-xs py-3 px-4">Statut</th>
                  <th className="text-left text-gray-500 font-medium text-xs py-3 px-4">Réservations</th>
                  <th className="text-left text-gray-500 font-medium text-xs py-3 px-4">Inscrit</th>
                  <th className="py-3 px-4"><span className="sr-only">Actions</span></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {users.map((u) => {
                  const rm = roleMap[u.role];
                  const fullName = `${u.prenom} ${u.nom}`;
                  const initials = `${u.prenom[0]}${u.nom[0]}`.toUpperCase();
                  return (
                    <tr key={u.id} className="hover:bg-white/3 transition-colors">
                      <td className="py-3.5 px-5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center shrink-0">
                            <span className="text-white text-xs font-bold">{initials}</span>
                          </div>
                          <div>
                            <p className="text-white font-medium">{fullName}</p>
                            <p className="text-gray-500 text-xs flex items-center gap-1">
                              <FontAwesomeIcon icon={faEnvelope} className="text-[9px]" />
                              {u.email}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold border ${rm.cls}`}>
                          <FontAwesomeIcon icon={rm.icon} className="text-[9px]" />
                          {rm.label}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        {u.isBlocked ? (
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold border bg-red-400/10 text-red-400 border-red-500/20">
                            <FontAwesomeIcon icon={faCircleXmark} className="text-[9px]" />
                            Bloqué
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold border bg-green-400/10 text-green-400 border-green-500/20">
                            <FontAwesomeIcon icon={faCircleCheck} className="text-[9px]" />
                            Actif
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-white">
                        {u._count.reservations > 0 ? u._count.reservations : <span className="text-gray-600">—</span>}
                      </td>
                      <td className="py-3.5 px-4 text-gray-500 text-xs">
                        <span className="flex items-center gap-1">
                          <FontAwesomeIcon icon={faClock} className="text-[9px]" />
                          {formatDate(new Date(u.createdAt))}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center justify-end">
                          <div className="relative">
                            <button
                              onClick={() => setOpenMenu(openMenu === u.id ? null : u.id)}
                              className="p-1.5 rounded-lg bg-white/5 border border-white/8 text-gray-400 hover:text-white transition-colors"
                            >
                              <FontAwesomeIcon icon={faEllipsisVertical} className="text-xs" />
                            </button>
                            {openMenu === u.id && (
                              <div className="absolute right-0 top-full mt-1 w-36 bg-[#0D1D3A] border border-white/10 rounded-lg shadow-xl z-10 py-1">
                                <button className="w-full text-left px-3 py-2 text-xs text-gray-300 hover:bg-white/5 hover:text-white transition-colors">
                                  Voir le profil
                                </button>
                                {u.isBlocked ? (
                                  <button onClick={() => toggleBlock(u.id, u.isBlocked)} className="w-full text-left px-3 py-2 text-xs text-green-400 hover:bg-white/5 transition-colors">
                                    Débloquer
                                  </button>
                                ) : (
                                  <button onClick={() => toggleBlock(u.id, u.isBlocked)} className="w-full text-left px-3 py-2 text-xs text-red-400 hover:bg-white/5 transition-colors">
                                    Bloquer
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        {!loading && users.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <FontAwesomeIcon icon={faUsers} className="text-2xl mb-2" />
            <p className="text-sm">Aucun utilisateur trouvé</p>
          </div>
        )}
      </div>
    </div>
  );
}
