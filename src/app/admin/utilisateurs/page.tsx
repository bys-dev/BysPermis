"use client";

import { useState, useEffect, useCallback } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faMagnifyingGlass, faUsers, faUserGraduate, faBuilding,
  faShieldHalved, faEllipsisVertical, faEnvelope,
  faClock, faCircleCheck, faCircleXmark, faSpinner,
  faUserPlus, faTrash, faTriangleExclamation, faXmark,
} from "@fortawesome/free-solid-svg-icons";
import { formatDate } from "@/lib/utils";

type Role = "ELEVE" | "CENTRE_OWNER" | "CENTRE_ADMIN" | "CENTRE_FORMATEUR" | "CENTRE_SECRETAIRE" | "SUPPORT" | "COMPTABLE" | "COMMERCIAL" | "ADMIN" | "OWNER";

const CENTRE_ROLES: Role[] = ["CENTRE_OWNER", "CENTRE_ADMIN", "CENTRE_FORMATEUR", "CENTRE_SECRETAIRE"];
const PLATFORM_ROLES: Role[] = ["SUPPORT", "COMPTABLE", "COMMERCIAL", "ADMIN", "OWNER"];

const ALL_ROLES: { value: Role; label: string }[] = [
  { value: "ELEVE", label: "Élève" },
  { value: "CENTRE_OWNER", label: "Propriétaire centre" },
  { value: "CENTRE_ADMIN", label: "Admin centre" },
  { value: "CENTRE_FORMATEUR", label: "Formateur" },
  { value: "CENTRE_SECRETAIRE", label: "Secrétaire" },
  { value: "SUPPORT", label: "Support" },
  { value: "COMPTABLE", label: "Comptable" },
  { value: "COMMERCIAL", label: "Commercial" },
  { value: "ADMIN", label: "Admin" },
  { value: "OWNER", label: "Owner" },
];

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
  ELEVE:              { label: "Élève",        cls: "bg-blue-400/10 text-blue-400 border-blue-500/20",       icon: faUserGraduate },
  CENTRE_OWNER:       { label: "Propriétaire", cls: "bg-purple-400/10 text-purple-400 border-purple-500/20", icon: faBuilding     },
  CENTRE_ADMIN:       { label: "Admin centre", cls: "bg-purple-400/10 text-purple-400 border-purple-500/20", icon: faBuilding     },
  CENTRE_FORMATEUR:   { label: "Formateur",    cls: "bg-purple-400/10 text-purple-400 border-purple-500/20", icon: faBuilding     },
  CENTRE_SECRETAIRE:  { label: "Secrétaire",   cls: "bg-purple-400/10 text-purple-400 border-purple-500/20", icon: faBuilding     },
  SUPPORT:            { label: "Support",      cls: "bg-orange-400/10 text-orange-400 border-orange-500/20", icon: faShieldHalved },
  COMPTABLE:          { label: "Comptable",    cls: "bg-orange-400/10 text-orange-400 border-orange-500/20", icon: faShieldHalved },
  COMMERCIAL:         { label: "Commercial",   cls: "bg-orange-400/10 text-orange-400 border-orange-500/20", icon: faShieldHalved },
  ADMIN:              { label: "Admin",        cls: "bg-red-400/10 text-red-400 border-red-500/20",           icon: faShieldHalved },
  OWNER:              { label: "Owner",        cls: "bg-red-400/10 text-red-400 border-red-500/20",           icon: faShieldHalved },
};

export default function AdminUtilisateursPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [search, setSearch] = useState("");
  const [filterRole, setFilterRole] = useState<"tous" | "eleves" | "centres" | "plateforme">("tous");
  const [openMenu, setOpenMenu] = useState<string | null>(null);

  // Create modal
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState({ prenom: "", nom: "", email: "", role: "ELEVE" as Role, password: "" });
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");

  // Delete modal
  const [deleteTarget, setDeleteTarget] = useState<User | null>(null);
  const [deleting, setDeleting] = useState(false);

  const filteredUsers = users.filter((u) => {
    if (filterRole === "tous") return true;
    if (filterRole === "eleves") return u.role === "ELEVE";
    if (filterRole === "centres") return CENTRE_ROLES.includes(u.role);
    if (filterRole === "plateforme") return PLATFORM_ROLES.includes(u.role);
    return true;
  });

  const fetchUsers = useCallback(async () => {
    setError(false);
    const params = new URLSearchParams();
    if (search) params.set("search", search);

    const res = await fetch(`/api/admin/users?${params}`).catch(() => null);
    if (!res?.ok) { setError(true); setUsers([]); return; }
    const data = await res.json();
    setUsers(Array.isArray(data) ? data : []);
  }, [search]);

  useEffect(() => {
    setLoading(true);
    const t = setTimeout(() => {
      fetchUsers().finally(() => setLoading(false));
    }, 250);
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

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    setCreateError("");
    const res = await fetch("/api/admin/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(createForm),
    }).catch(() => null);

    if (!res) { setCreateError("Erreur réseau"); setCreating(false); return; }
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setCreateError(data.error ?? "Erreur lors de la création");
      setCreating(false);
      return;
    }

    const newUser = await res.json();
    setUsers((prev) => [newUser, ...prev]);
    setShowCreate(false);
    setCreateForm({ prenom: "", nom: "", email: "", role: "ELEVE", password: "" });
    setCreating(false);
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    const res = await fetch("/api/admin/users", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: deleteTarget.id }),
    }).catch(() => null);

    if (res?.ok) {
      setUsers((prev) => prev.filter((u) => u.id !== deleteTarget.id));
    }
    setDeleteTarget(null);
    setDeleting(false);
  }

  const counts = {
    tous: users.length,
    eleves:     users.filter((u) => u.role === "ELEVE").length,
    centres:    users.filter((u) => CENTRE_ROLES.includes(u.role)).length,
    plateforme: users.filter((u) => PLATFORM_ROLES.includes(u.role)).length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Utilisateurs</h1>
          <p className="text-gray-400 text-sm mt-0.5">
            {counts.tous} comptes · {counts.eleves} élèves · {counts.centres} centres · {counts.plateforme} plateforme
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold transition-colors shadow-lg shadow-blue-600/20"
        >
          <FontAwesomeIcon icon={faUserPlus} className="text-xs" />
          Créer un utilisateur
        </button>
      </div>

      {/* Tabs rôle */}
      <div className="flex flex-wrap gap-2">
        {([
          { key: "tous", label: "Tous" },
          { key: "eleves", label: "Élèves" },
          { key: "centres", label: "Centres" },
          { key: "plateforme", label: "Plateforme" },
        ] as const).map((r) => (
          <button
            key={r.key}
            onClick={() => setFilterRole(r.key)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors border
              ${filterRole === r.key
                ? "bg-white/10 text-white border-white/20"
                : "text-gray-400 border-white/8 hover:text-white hover:border-white/20"
              }`}
          >
            {r.label}
            <span className="ml-2 text-xs opacity-60">{counts[r.key]}</span>
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative">
        <FontAwesomeIcon icon={faMagnifyingGlass} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm" />
        <input
          type="text"
          placeholder="Rechercher par nom, prénom ou email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 bg-[#0A1628] border border-white/10 rounded-lg text-white placeholder-gray-500 text-sm focus:outline-none focus:border-blue-500/50"
        />
      </div>

      {/* Error state */}
      {error && !loading && (
        <div className="text-center py-12">
          <FontAwesomeIcon icon={faTriangleExclamation} className="text-red-400 text-2xl mb-3" />
          <p className="text-gray-400 text-sm mb-4">Erreur lors du chargement</p>
          <button onClick={() => fetchUsers()} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm">Réessayer</button>
        </div>
      )}

      {/* Table */}
      {!error && (
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
                  {filteredUsers.map((u) => {
                    const rm = roleMap[u.role];
                    const fullName = `${u.prenom} ${u.nom}`;
                    const initials = `${u.prenom[0] ?? ""}${u.nom[0] ?? ""}`.toUpperCase();
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
                                <div className="absolute right-0 top-full mt-1 w-44 bg-[#0D1D3A] border border-white/10 rounded-lg shadow-xl z-10 py-1">
                                  {u.isBlocked ? (
                                    <button onClick={() => toggleBlock(u.id, u.isBlocked)} className="w-full text-left px-3 py-2 text-xs text-green-400 hover:bg-white/5 transition-colors">
                                      <FontAwesomeIcon icon={faCircleCheck} className="mr-2" />
                                      Débloquer
                                    </button>
                                  ) : (
                                    <button onClick={() => toggleBlock(u.id, u.isBlocked)} className="w-full text-left px-3 py-2 text-xs text-orange-400 hover:bg-white/5 transition-colors">
                                      <FontAwesomeIcon icon={faCircleXmark} className="mr-2" />
                                      Bloquer
                                    </button>
                                  )}
                                  {u.role !== "OWNER" && (
                                    <button
                                      onClick={() => { setDeleteTarget(u); setOpenMenu(null); }}
                                      className="w-full text-left px-3 py-2 text-xs text-red-400 hover:bg-white/5 transition-colors"
                                    >
                                      <FontAwesomeIcon icon={faTrash} className="mr-2" />
                                      Supprimer
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
          {!loading && filteredUsers.length === 0 && !error && (
            <div className="text-center py-12 text-gray-500">
              <FontAwesomeIcon icon={faUsers} className="text-2xl mb-2" />
              <p className="text-sm">Aucun utilisateur trouvé</p>
            </div>
          )}
        </div>
      )}

      {/* ─── Modal Créer utilisateur ─── */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowCreate(false)}>
          <div className="bg-[#0D1D3A] border border-white/10 rounded-2xl w-full max-w-lg shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-6 border-b border-white/8">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <FontAwesomeIcon icon={faUserPlus} className="text-blue-400" />
                Créer un utilisateur
              </h2>
              <button onClick={() => setShowCreate(false)} className="text-gray-400 hover:text-white">
                <FontAwesomeIcon icon={faXmark} />
              </button>
            </div>

            <form onSubmit={handleCreate} className="p-6 space-y-4">
              {createError && (
                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
                  {createError}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-1.5">Prénom</label>
                  <input
                    type="text" required value={createForm.prenom}
                    onChange={(e) => setCreateForm({ ...createForm, prenom: e.target.value })}
                    className="w-full px-3 py-2.5 bg-[#0A1628] border border-white/10 rounded-lg text-white text-sm placeholder-gray-500 focus:outline-none focus:border-blue-500/50"
                    placeholder="Jean"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-1.5">Nom</label>
                  <input
                    type="text" required value={createForm.nom}
                    onChange={(e) => setCreateForm({ ...createForm, nom: e.target.value })}
                    className="w-full px-3 py-2.5 bg-[#0A1628] border border-white/10 rounded-lg text-white text-sm placeholder-gray-500 focus:outline-none focus:border-blue-500/50"
                    placeholder="Dupont"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1.5">Email</label>
                <input
                  type="email" required value={createForm.email}
                  onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                  className="w-full px-3 py-2.5 bg-[#0A1628] border border-white/10 rounded-lg text-white text-sm placeholder-gray-500 focus:outline-none focus:border-blue-500/50"
                  placeholder="jean@exemple.fr"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1.5">Rôle</label>
                <select
                  value={createForm.role}
                  onChange={(e) => setCreateForm({ ...createForm, role: e.target.value as Role })}
                  className="w-full px-3 py-2.5 bg-[#0A1628] border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500/50"
                >
                  {ALL_ROLES.map((r) => (
                    <option key={r.value} value={r.value}>{r.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1.5">
                  Mot de passe <span className="text-gray-600">(optionnel — auto-généré si vide)</span>
                </label>
                <input
                  type="text" value={createForm.password}
                  onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                  className="w-full px-3 py-2.5 bg-[#0A1628] border border-white/10 rounded-lg text-white text-sm placeholder-gray-500 focus:outline-none focus:border-blue-500/50"
                  placeholder="Min. 8 caractères"
                  minLength={8}
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button" onClick={() => setShowCreate(false)}
                  className="flex-1 py-2.5 rounded-lg border border-white/10 text-gray-400 hover:text-white text-sm font-medium transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit" disabled={creating}
                  className="flex-1 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-semibold transition-colors flex items-center justify-center gap-2"
                >
                  {creating ? <><FontAwesomeIcon icon={faSpinner} className="animate-spin" /> Création…</> : "Créer l'utilisateur"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── Modal Supprimer utilisateur ─── */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setDeleteTarget(null)}>
          <div className="bg-[#0D1D3A] border border-white/10 rounded-2xl w-full max-w-md shadow-2xl p-6" onClick={(e) => e.stopPropagation()}>
            <div className="text-center">
              <div className="w-14 h-14 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center mx-auto mb-4">
                <FontAwesomeIcon icon={faTriangleExclamation} className="text-red-400 text-xl" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Supprimer cet utilisateur ?</h3>
              <p className="text-gray-400 text-sm mb-1">
                <strong className="text-white">{deleteTarget.prenom} {deleteTarget.nom}</strong>
              </p>
              <p className="text-gray-500 text-xs mb-6">{deleteTarget.email} · {roleMap[deleteTarget.role].label}</p>
              <p className="text-red-400/80 text-xs mb-6">
                Cette action est irréversible. Toutes les données associées (réservations, tickets, notifications) seront supprimées.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setDeleteTarget(null)}
                  className="flex-1 py-2.5 rounded-lg border border-white/10 text-gray-400 hover:text-white text-sm font-medium transition-colors"
                >
                  Annuler
                </button>
                <button
                  onClick={handleDelete} disabled={deleting}
                  className="flex-1 py-2.5 rounded-lg bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white text-sm font-semibold transition-colors flex items-center justify-center gap-2"
                >
                  {deleting ? <><FontAwesomeIcon icon={faSpinner} className="animate-spin" /> Suppression…</> : "Supprimer définitivement"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
