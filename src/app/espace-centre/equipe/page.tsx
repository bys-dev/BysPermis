"use client";

import { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import LoadingOverlay, { PageHeaderSkeleton } from "@/components/ui/LoadingOverlay";
import {
  faUsers,
  faPlus,
  faSpinner,
  faTrash,
  faEnvelope,
  faShieldHalved,
  faCircleCheck,
  faTriangleExclamation,
  faStamp,
  faPen,
  faXmark,
} from "@fortawesome/free-solid-svg-icons";

type CentreRole = "CENTRE_ADMIN" | "CENTRE_FORMATEUR" | "CENTRE_SECRETAIRE";

type FonctionAnimateur = "EXPERT_SR" | "PSYCHOLOGUE";

interface Membre {
  id: string;
  userId: string;
  role: string;
  fonctionAnimateur: FonctionAnimateur | null;
  numeroAutorisation: string | null;
  createdAt: string;
  user: {
    id: string;
    prenom: string;
    nom: string;
    email: string;
  };
}

const fonctionLabels: Record<FonctionAnimateur, string> = {
  EXPERT_SR: "Expert sécurité routière",
  PSYCHOLOGUE: "Animateur psychologue",
};

const fonctionOptions: { value: "" | FonctionAnimateur; label: string }[] = [
  { value: "", label: "— Aucune (pas animateur) —" },
  { value: "EXPERT_SR", label: "Expert en sécurité routière" },
  { value: "PSYCHOLOGUE", label: "Animateur psychologue" },
];

const roleLabels: Record<string, { label: string; color: string; bg: string }> = {
  CENTRE_OWNER:      { label: "Propriétaire",   color: "text-yellow-400", bg: "bg-yellow-400/10" },
  CENTRE_ADMIN:      { label: "Administrateur",  color: "text-blue-400",   bg: "bg-blue-400/10"   },
  CENTRE_FORMATEUR:  { label: "Formateur",       color: "text-purple-400", bg: "bg-purple-400/10" },
  CENTRE_SECRETAIRE: { label: "Secrétariat",     color: "text-green-400",  bg: "bg-green-400/10"  },
};

const inviteRoles: { value: CentreRole; label: string }[] = [
  { value: "CENTRE_ADMIN",      label: "Administrateur" },
  { value: "CENTRE_FORMATEUR",  label: "Formateur" },
  { value: "CENTRE_SECRETAIRE", label: "Secrétariat" },
];

export default function EquipePage() {
  const [membres, setMembres] = useState<Membre[]>([]);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<string | null>(null);

  // Invite form
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<CentreRole>("CENTRE_FORMATEUR");
  const [fonction, setFonction] = useState<"" | FonctionAnimateur>("");
  const [numero, setNumero] = useState("");
  const [inviting, setInviting] = useState(false);
  const [inviteMsg, setInviteMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Delete confirm
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Inline edit fonction animateur
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editFonction, setEditFonction] = useState<"" | FonctionAnimateur>("");
  const [editNumero, setEditNumero] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch("/api/users/me").then((r) => r.json()),
      fetch("/api/centre/membres").then((r) => r.json()),
    ])
      .then(([me, data]) => {
        if (me?.role) setUserRole(me.role);
        if (Array.isArray(data)) setMembres(data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const isOwner = userRole === "CENTRE_OWNER" || userRole === "ADMIN" || userRole === "OWNER";

  async function inviteMember() {
    if (!email.trim() || !role) return;
    setInviting(true);
    setInviteMsg(null);
    try {
      const res = await fetch("/api/centre/membres", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          role,
          fonctionAnimateur: fonction || null,
          numeroAutorisation: numero.trim() || null,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setMembres((prev) => [...prev, data]);
        setEmail("");
        setFonction("");
        setNumero("");
        setInviteMsg({ type: "success", text: "Membre ajouté avec succès." });
      } else {
        setInviteMsg({ type: "error", text: data.error || "Erreur lors de l'ajout." });
      }
    } catch {
      setInviteMsg({ type: "error", text: "Erreur réseau." });
    } finally {
      setInviting(false);
    }
  }

  function startEdit(m: Membre) {
    setEditingId(m.userId);
    setEditFonction(m.fonctionAnimateur ?? "");
    setEditNumero(m.numeroAutorisation ?? "");
  }

  function cancelEdit() {
    setEditingId(null);
    setEditFonction("");
    setEditNumero("");
  }

  async function saveEdit(userId: string) {
    setSavingEdit(true);
    try {
      const res = await fetch("/api/centre/membres", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          fonctionAnimateur: editFonction || null,
          numeroAutorisation: editNumero.trim() || null,
        }),
      });
      const data = await res.json();
      if (res.ok && data?.userId) {
        setMembres((prev) => prev.map((m) => (m.userId === userId ? { ...m, ...data } : m)));
        cancelEdit();
      }
    } catch {
      // silently fail
    } finally {
      setSavingEdit(false);
    }
  }

  async function removeMember(userId: string) {
    setDeletingId(userId);
    try {
      const res = await fetch("/api/centre/membres", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      if (res.ok) {
        setMembres((prev) => prev.filter((m) => m.userId !== userId));
      }
    } catch {
      // silently fail
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="relative min-h-[50vh]">
      <div className={loading ? "opacity-40 pointer-events-none select-none" : ""}>
      {loading ? (
        <PageHeaderSkeleton />
      ) : (
      <div className="mb-8">
        <h1 className="font-display font-bold text-2xl text-white mb-1">Équipe</h1>
        <p className="text-gray-500 text-sm">
          Gérez les membres de votre centre de formation
        </p>
      </div>
      )}

      {/* Invite form — only for CENTRE_OWNER */}
      {isOwner && (
        <div
          className="rounded-xl p-6 mb-6"
          style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}
        >
          <h2 className="text-white font-semibold text-sm mb-4 flex items-center gap-2">
            <FontAwesomeIcon icon={faPlus} className="text-blue-400 text-xs" />
            Ajouter un membre
          </h2>

          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <input
                type="email"
                placeholder="Adresse e-mail du membre"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-blue-500/50"
              />
            </div>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as CentreRole)}
              className="bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500/50"
            >
              {inviteRoles.map((r) => (
                <option key={r.value} value={r.value} className="bg-[#0A1628]">
                  {r.label}
                </option>
              ))}
            </select>
            <button
              onClick={inviteMember}
              disabled={!email.trim() || inviting}
              className="inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold px-5 py-2.5 rounded-lg text-sm transition-colors whitespace-nowrap"
            >
              {inviting ? (
                <FontAwesomeIcon icon={faSpinner} className="animate-spin text-xs" />
              ) : (
                <FontAwesomeIcon icon={faPlus} className="text-xs" />
              )}
              Ajouter
            </button>
          </div>

          {/* Fonction animateur (optionnel) — alimente l'attestation Annexe I */}
          <div className="flex flex-col sm:flex-row gap-3 mt-3">
            <select
              value={fonction}
              onChange={(e) => setFonction(e.target.value as "" | FonctionAnimateur)}
              className="flex-1 bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500/50"
            >
              {fonctionOptions.map((f) => (
                <option key={f.value} value={f.value} className="bg-[#0A1628]">
                  {f.label}
                </option>
              ))}
            </select>
            {fonction && (
              <input
                type="text"
                placeholder="N° d'autorisation d'animer (préfecture)"
                value={numero}
                onChange={(e) => setNumero(e.target.value)}
                className="flex-1 bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-blue-500/50"
              />
            )}
          </div>
          <p className="text-gray-500 text-xs mt-2">
            La fonction animateur (expert sécurité routière / psychologue) et son n° d&apos;autorisation
            apparaissent sur l&apos;attestation de suivi de stage.
          </p>

          {inviteMsg && (
            <div className={`mt-3 flex items-center gap-2 text-sm ${inviteMsg.type === "success" ? "text-green-400" : "text-red-400"}`}>
              <FontAwesomeIcon
                icon={inviteMsg.type === "success" ? faCircleCheck : faTriangleExclamation}
                className="text-xs"
              />
              {inviteMsg.text}
            </div>
          )}
        </div>
      )}

      {/* Members table */}
      <div
        className="rounded-xl overflow-hidden"
        style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}
      >
        <div className="px-6 py-4 border-b flex items-center justify-between" style={{ borderColor: "rgba(255,255,255,0.07)" }}>
          <h2 className="font-semibold text-white text-sm flex items-center gap-2">
            <FontAwesomeIcon icon={faUsers} className="text-blue-400 text-xs" />
            Membres du centre
          </h2>
          <span className="text-gray-500 text-xs">
            {loading ? "…" : `${membres.length} membre(s)`}
          </span>
        </div>

        {!loading && membres.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <FontAwesomeIcon icon={faUsers} className="text-2xl mb-3" />
            <p className="font-medium text-white mb-1">Aucun membre</p>
            <p className="text-sm">Ajoutez des collaborateurs à votre centre.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-xs text-gray-500 uppercase tracking-wider">
                  <th className="px-6 py-3 font-medium">Membre</th>
                  <th className="px-6 py-3 font-medium">E-mail</th>
                  <th className="px-6 py-3 font-medium">Rôle</th>
                  <th className="px-6 py-3 font-medium">Fonction animateur</th>
                  <th className="px-6 py-3 font-medium">Ajouté le</th>
                  {isOwner && <th className="px-6 py-3 font-medium text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y" style={{ borderColor: "rgba(255,255,255,0.05)" }}>
                {membres.map((m) => {
                  const rl = roleLabels[m.role] ?? { label: m.role, color: "text-gray-400", bg: "bg-gray-400/10" };
                  return (
                    <tr key={m.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center">
                            <span className="text-xs font-bold text-gray-400">
                              {m.user.prenom?.[0] ?? ""}{m.user.nom?.[0] ?? ""}
                            </span>
                          </div>
                          <span className="text-sm font-medium text-white">
                            {m.user.prenom} {m.user.nom}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-400 flex items-center gap-1.5">
                          <FontAwesomeIcon icon={faEnvelope} className="w-3 h-3 text-gray-600" />
                          {m.user.email}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${rl.color} ${rl.bg}`}>
                          <FontAwesomeIcon icon={faShieldHalved} className="w-3 h-3" />
                          {rl.label}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {editingId === m.userId ? (
                          <div className="flex flex-col gap-2 min-w-[220px]">
                            <select
                              value={editFonction}
                              onChange={(e) => setEditFonction(e.target.value as "" | FonctionAnimateur)}
                              className="bg-white/5 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500/50"
                            >
                              {fonctionOptions.map((f) => (
                                <option key={f.value} value={f.value} className="bg-[#0A1628]">
                                  {f.label}
                                </option>
                              ))}
                            </select>
                            {editFonction && (
                              <input
                                type="text"
                                placeholder="N° d'autorisation"
                                value={editNumero}
                                onChange={(e) => setEditNumero(e.target.value)}
                                className="bg-white/5 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-blue-500/50"
                              />
                            )}
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => saveEdit(m.userId)}
                                disabled={savingEdit}
                                className="inline-flex items-center gap-1.5 text-xs font-medium text-green-400 hover:text-green-300 disabled:opacity-50"
                              >
                                <FontAwesomeIcon icon={savingEdit ? faSpinner : faCircleCheck} className={savingEdit ? "animate-spin" : ""} />
                                Enregistrer
                              </button>
                              <button
                                onClick={cancelEdit}
                                className="inline-flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-300"
                              >
                                <FontAwesomeIcon icon={faXmark} />
                                Annuler
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            {m.fonctionAnimateur ? (
                              <span className="inline-flex flex-col">
                                <span className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-400">
                                  <FontAwesomeIcon icon={faStamp} className="w-3 h-3" />
                                  {fonctionLabels[m.fonctionAnimateur]}
                                </span>
                                {m.numeroAutorisation && (
                                  <span className="text-[11px] text-gray-500 mt-0.5 ml-4">
                                    N° {m.numeroAutorisation}
                                  </span>
                                )}
                              </span>
                            ) : (
                              <span className="text-xs text-gray-600">—</span>
                            )}
                            {isOwner && (
                              <button
                                onClick={() => startEdit(m)}
                                className="text-gray-600 hover:text-blue-400 transition-colors"
                                title="Modifier la fonction animateur"
                              >
                                <FontAwesomeIcon icon={faPen} className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-500">
                          {new Date(m.createdAt).toLocaleDateString("fr-FR")}
                        </span>
                      </td>
                      {isOwner && (
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => removeMember(m.userId)}
                            disabled={deletingId === m.userId}
                            className="inline-flex items-center gap-1.5 text-xs text-gray-500 hover:text-red-400 transition-colors disabled:opacity-50"
                            title="Retirer du centre"
                          >
                            {deletingId === m.userId ? (
                              <FontAwesomeIcon icon={faSpinner} className="animate-spin" />
                            ) : (
                              <FontAwesomeIcon icon={faTrash} className="w-3 h-3" />
                            )}
                            Retirer
                          </button>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
      </div>
      <LoadingOverlay show={loading} label="Chargement de l'équipe..." />
    </div>
  );
}
