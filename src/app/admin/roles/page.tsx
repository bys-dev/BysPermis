"use client";

import { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faUserShield,
  faUserGraduate,
  faBuilding,
  faShieldHalved,
  faHeadset,
  faCalculator,
  faBriefcase,
  faCrown,
  faUsers,
  faMagnifyingGlass,
  faSpinner,
  faCheck,
  faTriangleExclamation,
  faChevronDown,
  faChevronUp,
} from "@fortawesome/free-solid-svg-icons";

type Role =
  | "ELEVE"
  | "CENTRE_OWNER"
  | "CENTRE_ADMIN"
  | "CENTRE_FORMATEUR"
  | "CENTRE_SECRETAIRE"
  | "SUPPORT"
  | "COMPTABLE"
  | "COMMERCIAL"
  | "ADMIN"
  | "OWNER";

interface RoleInfo {
  role: Role;
  label: string;
  description: string;
  icon: typeof faUsers;
  color: string;
  bg: string;
  border: string;
  permissions: string[];
}

interface UserData {
  id: string;
  prenom: string;
  nom: string;
  email: string;
  role: Role;
  isBlocked: boolean;
}

const ROLES: RoleInfo[] = [
  {
    role: "ELEVE",
    label: "Eleve",
    description: "Apprenant / stagiaire inscrit sur la plateforme",
    icon: faUserGraduate,
    color: "text-blue-400",
    bg: "bg-blue-400/10",
    border: "border-blue-500/20",
    permissions: ["Rechercher des formations", "Reserver un stage", "Consulter ses reservations", "Gerer son profil", "Ouvrir des tickets support"],
  },
  {
    role: "CENTRE_OWNER",
    label: "Proprietaire centre",
    description: "Proprietaire du centre de formation, acces total au centre",
    icon: faBuilding,
    color: "text-purple-400",
    bg: "bg-purple-400/10",
    border: "border-purple-500/20",
    permissions: ["Gerer les formations et sessions", "Configurer Stripe Connect", "Voir les finances et commissions", "Gerer le personnel du centre", "Modifier les parametres du centre"],
  },
  {
    role: "CENTRE_ADMIN",
    label: "Admin centre",
    description: "Gestionnaire du centre, formations et sessions",
    icon: faBuilding,
    color: "text-purple-400",
    bg: "bg-purple-400/10",
    border: "border-purple-500/20",
    permissions: ["Gerer les formations et sessions", "Voir les statistiques", "Gerer les inscriptions"],
  },
  {
    role: "CENTRE_FORMATEUR",
    label: "Formateur",
    description: "Moniteur ou professeur du centre",
    icon: faBuilding,
    color: "text-purple-400",
    bg: "bg-purple-400/10",
    border: "border-purple-500/20",
    permissions: ["Voir ses sessions", "Emargement des stagiaires", "Consulter les listes"],
  },
  {
    role: "CENTRE_SECRETAIRE",
    label: "Secretaire",
    description: "Secretariat du centre, inscriptions et planning",
    icon: faBuilding,
    color: "text-purple-400",
    bg: "bg-purple-400/10",
    border: "border-purple-500/20",
    permissions: ["Gerer les inscriptions", "Consulter le planning", "Envoyer des notifications"],
  },
  {
    role: "SUPPORT",
    label: "Support",
    description: "Agent support plateforme, gestion des tickets",
    icon: faHeadset,
    color: "text-orange-400",
    bg: "bg-orange-400/10",
    border: "border-orange-500/20",
    permissions: ["Gerer les tickets support", "Moderer les contenus", "Contacter les utilisateurs"],
  },
  {
    role: "COMPTABLE",
    label: "Comptable",
    description: "Finance plateforme, revenus et commissions",
    icon: faCalculator,
    color: "text-orange-400",
    bg: "bg-orange-400/10",
    border: "border-orange-500/20",
    permissions: ["Voir les revenus et commissions", "Exporter les donnees financieres", "Consulter les factures"],
  },
  {
    role: "COMMERCIAL",
    label: "Commercial",
    description: "Business dev, demarchage centres partenaires",
    icon: faBriefcase,
    color: "text-orange-400",
    bg: "bg-orange-400/10",
    border: "border-orange-500/20",
    permissions: ["Voir les centres prospects", "Envoyer des propositions", "Suivre les conversions"],
  },
  {
    role: "ADMIN",
    label: "Admin",
    description: "Administrateur operationnel de la plateforme",
    icon: faShieldHalved,
    color: "text-red-400",
    bg: "bg-red-400/10",
    border: "border-red-500/20",
    permissions: ["Gerer les centres", "Gerer les utilisateurs", "Voir les statistiques", "Gerer le support", "Modifier les parametres"],
  },
  {
    role: "OWNER",
    label: "Owner",
    description: "Super-administrateur, acces total a la plateforme",
    icon: faCrown,
    color: "text-yellow-400",
    bg: "bg-yellow-400/10",
    border: "border-yellow-500/20",
    permissions: ["Tout les acces Admin", "Changer les roles", "Modifier les commissions", "Mode maintenance", "Configuration avancee"],
  },
];

export default function AdminRolesPage() {
  const [users, setUsers] = useState<UserData[]>([]);
  const [roleCounts, setRoleCounts] = useState<Record<Role, number>>({} as Record<Role, number>);
  const [loading, setLoading] = useState(true);
  const [expandedRole, setExpandedRole] = useState<Role | null>(null);

  // Role change form
  const [searchEmail, setSearchEmail] = useState("");
  const [foundUser, setFoundUser] = useState<UserData | null>(null);
  const [searching, setSearching] = useState(false);
  const [selectedRole, setSelectedRole] = useState<Role | "">("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    fetch("/api/admin/users")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setUsers(data);
          const counts: Record<string, number> = {};
          for (const role of ROLES) counts[role.role] = 0;
          for (const u of data) {
            if (counts[u.role] !== undefined) counts[u.role]++;
          }
          setRoleCounts(counts as Record<Role, number>);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function searchUser() {
    if (!searchEmail.trim()) return;
    setSearching(true);
    setFoundUser(null);
    setMessage(null);
    setSelectedRole("");

    const res = await fetch(`/api/admin/users?search=${encodeURIComponent(searchEmail.trim())}`).catch(() => null);
    if (res?.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        const exact = data.find((u: UserData) => u.email.toLowerCase() === searchEmail.trim().toLowerCase());
        setFoundUser(exact ?? data[0]);
        setSelectedRole((exact ?? data[0]).role);
      } else {
        setMessage({ type: "error", text: "Aucun utilisateur trouve avec cet email." });
      }
    } else {
      setMessage({ type: "error", text: "Erreur lors de la recherche." });
    }
    setSearching(false);
  }

  async function changeRole() {
    if (!foundUser || !selectedRole || selectedRole === foundUser.role) return;
    setSaving(true);
    setMessage(null);

    const res = await fetch("/api/admin/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: foundUser.id, role: selectedRole }),
    }).catch(() => null);

    if (res?.ok) {
      setMessage({ type: "success", text: `Role de ${foundUser.prenom} ${foundUser.nom} change en ${selectedRole}.` });
      // Update local state
      const oldRole = foundUser.role;
      setFoundUser({ ...foundUser, role: selectedRole as Role });
      setRoleCounts((prev) => ({
        ...prev,
        [oldRole]: Math.max(0, (prev[oldRole] ?? 0) - 1),
        [selectedRole]: (prev[selectedRole as Role] ?? 0) + 1,
      }));
      setUsers((prev) => prev.map((u) => (u.id === foundUser.id ? { ...u, role: selectedRole as Role } : u)));
    } else {
      setMessage({ type: "error", text: "Erreur lors du changement de role. Verifiez vos permissions (OWNER requis)." });
    }
    setSaving(false);
    setShowConfirm(false);
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-1">
          <FontAwesomeIcon icon={faUserShield} className="text-yellow-400 text-xl" />
          <h1 className="text-2xl font-bold text-white">Roles & Permissions</h1>
        </div>
        <p className="text-gray-400 text-sm">
          Gerez les 10 roles de la plateforme et modifiez les roles des utilisateurs. Acces reserve au Owner.
        </p>
      </div>

      {/* Role change form */}
      <div className="bg-[#0A1628] rounded-xl border border-yellow-500/20 p-6">
        <h2 className="text-white font-semibold text-sm mb-4 flex items-center gap-2">
          <FontAwesomeIcon icon={faCrown} className="text-yellow-400 text-xs" />
          Changer le role d&apos;un utilisateur
        </h2>

        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <div className="relative flex-1">
            <FontAwesomeIcon icon={faMagnifyingGlass} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm" />
            <input
              type="email"
              placeholder="Rechercher par email..."
              value={searchEmail}
              onChange={(e) => setSearchEmail(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && searchUser()}
              className="w-full pl-9 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 text-sm focus:outline-none focus:border-yellow-500/50"
            />
          </div>
          <button
            onClick={searchUser}
            disabled={searching || !searchEmail.trim()}
            className="px-5 py-2.5 rounded-lg bg-yellow-600 hover:bg-yellow-700 disabled:opacity-40 text-white font-semibold text-sm transition-colors"
          >
            {searching ? (
              <FontAwesomeIcon icon={faSpinner} className="animate-spin" />
            ) : (
              "Rechercher"
            )}
          </button>
        </div>

        {/* Found user */}
        {foundUser && (
          <div className="p-4 rounded-lg bg-white/3 border border-white/8 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center shrink-0">
                <span className="text-white text-sm font-bold">
                  {foundUser.prenom[0]}{foundUser.nom[0]}
                </span>
              </div>
              <div>
                <p className="text-white font-medium">{foundUser.prenom} {foundUser.nom}</p>
                <p className="text-gray-500 text-xs">{foundUser.email}</p>
              </div>
              <span className={`ml-auto inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${ROLES.find((r) => r.role === foundUser.role)?.bg} ${ROLES.find((r) => r.role === foundUser.role)?.color} ${ROLES.find((r) => r.role === foundUser.role)?.border}`}>
                Role actuel : {ROLES.find((r) => r.role === foundUser.role)?.label}
              </span>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 items-end">
              <div className="flex-1">
                <label className="text-gray-400 text-xs font-medium mb-1.5 block">Nouveau role</label>
                <select
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value as Role)}
                  className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-yellow-500/50 appearance-none"
                >
                  {ROLES.map((r) => (
                    <option key={r.role} value={r.role} className="bg-[#0A1628]">
                      {r.label} — {r.description}
                    </option>
                  ))}
                </select>
              </div>
              <button
                onClick={() => setShowConfirm(true)}
                disabled={!selectedRole || selectedRole === foundUser.role || saving}
                className="px-5 py-2.5 rounded-lg bg-red-600 hover:bg-red-700 disabled:opacity-40 text-white font-semibold text-sm transition-colors shrink-0"
              >
                Changer le role
              </button>
            </div>

            {/* Confirmation dialog */}
            {showConfirm && (
              <div className="p-4 rounded-lg bg-red-400/5 border border-red-500/20">
                <div className="flex items-start gap-3">
                  <FontAwesomeIcon icon={faTriangleExclamation} className="text-red-400 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-white text-sm font-medium">Confirmer le changement de role</p>
                    <p className="text-gray-400 text-xs mt-1">
                      Vous allez changer le role de <span className="text-white">{foundUser.prenom} {foundUser.nom}</span> de{" "}
                      <span className="text-red-400">{ROLES.find((r) => r.role === foundUser.role)?.label}</span> vers{" "}
                      <span className="text-green-400">{ROLES.find((r) => r.role === selectedRole)?.label}</span>.
                      Cette action est immediate.
                    </p>
                    <div className="flex gap-2 mt-3">
                      <button
                        onClick={changeRole}
                        disabled={saving}
                        className="px-4 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 disabled:opacity-40 text-white text-xs font-semibold transition-colors"
                      >
                        {saving ? <FontAwesomeIcon icon={faSpinner} className="animate-spin" /> : "Confirmer"}
                      </button>
                      <button
                        onClick={() => setShowConfirm(false)}
                        className="px-4 py-1.5 rounded-lg bg-white/5 border border-white/10 text-gray-400 hover:text-white text-xs font-medium transition-colors"
                      >
                        Annuler
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Message */}
        {message && (
          <div className={`mt-3 p-3 rounded-lg text-sm flex items-center gap-2 ${message.type === "success" ? "bg-green-400/10 border border-green-500/20 text-green-400" : "bg-red-400/10 border border-red-500/20 text-red-400"}`}>
            <FontAwesomeIcon icon={message.type === "success" ? faCheck : faTriangleExclamation} className="text-xs" />
            {message.text}
          </div>
        )}
      </div>

      {/* Roles list */}
      <div>
        <h2 className="text-white font-semibold text-sm mb-4">Les 10 roles de la plateforme</h2>

        {loading ? (
          <div className="flex items-center justify-center py-16 gap-3 text-gray-500">
            <FontAwesomeIcon icon={faSpinner} className="animate-spin" />
            <span className="text-sm">Chargement...</span>
          </div>
        ) : (
          <div className="space-y-3">
            {ROLES.map((r) => (
              <div key={r.role} className={`bg-[#0A1628] rounded-xl border ${r.border} overflow-hidden`}>
                <button
                  onClick={() => setExpandedRole(expandedRole === r.role ? null : r.role)}
                  className="w-full flex items-center gap-4 p-4 text-left hover:bg-white/3 transition-colors"
                >
                  <div className={`w-10 h-10 rounded-lg ${r.bg} border ${r.border} flex items-center justify-center shrink-0`}>
                    <FontAwesomeIcon icon={r.icon} className={`${r.color} text-sm`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-white font-semibold text-sm">{r.label}</p>
                      <span className={`inline-flex px-1.5 py-0.5 rounded text-[10px] font-mono ${r.bg} ${r.color} border ${r.border}`}>
                        {r.role}
                      </span>
                    </div>
                    <p className="text-gray-500 text-xs mt-0.5">{r.description}</p>
                  </div>
                  <div className="flex items-center gap-4 shrink-0">
                    <div className="text-right">
                      <p className="text-white font-semibold text-sm">{roleCounts[r.role] ?? 0}</p>
                      <p className="text-gray-600 text-[10px]">utilisateur(s)</p>
                    </div>
                    <FontAwesomeIcon
                      icon={expandedRole === r.role ? faChevronUp : faChevronDown}
                      className="text-gray-500 text-xs"
                    />
                  </div>
                </button>

                {expandedRole === r.role && (
                  <div className="px-4 pb-4 border-t border-white/5">
                    <p className="text-gray-400 text-xs font-medium mt-3 mb-2">Permissions :</p>
                    <div className="grid sm:grid-cols-2 gap-1.5">
                      {r.permissions.map((perm) => (
                        <div key={perm} className="flex items-center gap-2 text-xs text-gray-300">
                          <FontAwesomeIcon icon={faCheck} className={`text-[9px] ${r.color}`} />
                          {perm}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
