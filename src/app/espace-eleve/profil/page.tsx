"use client";

import { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUser, faEnvelope, faPhone, faLocationDot, faPen, faCheck, faSpinner } from "@fortawesome/free-solid-svg-icons";

interface Profile {
  prenom: string;
  nom: string;
  email: string;
  telephone: string;
  adresse: string;
  role: string;
}

const MOCK: Profile = {
  prenom: "Jean", nom: "Dupont", email: "jean.dupont@exemple.fr",
  telephone: "06 12 34 56 78", adresse: "12 rue de la Paix, 95000 Cergy", role: "ELEVE",
};

export default function ProfilPage() {
  const [profile, setProfile] = useState<Profile>(MOCK);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<Profile>(MOCK);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch("/api/users/me")
      .then((r) => r.json())
      .then((data) => {
        if (data && data.prenom) {
          setProfile(data);
          setForm(data);
        }
      })
      .catch(() => null)
      .finally(() => setLoading(false));
  }, []);

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch("/api/users/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prenom: form.prenom,
          nom: form.nom,
          telephone: form.telephone,
          adresse: form.adresse,
        }),
      });
      if (res.ok) {
        const updated = await res.json();
        setProfile(updated);
        setForm(updated);
        setSaved(true);
        setEditing(false);
        setTimeout(() => setSaved(false), 2000);
      }
    } catch {
      // silently fail — keep editing mode
    }
    setSaving(false);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 gap-3 text-gray-500">
        <FontAwesomeIcon icon={faSpinner} className="animate-spin text-xl" />
        <span className="text-sm">Chargement…</span>
      </div>
    );
  }

  return (
    <div className="max-w-2xl">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="font-display font-bold text-2xl text-white mb-1">Mon profil</h1>
          <p className="text-gray-500 text-sm">Gérez vos informations personnelles</p>
        </div>
        <button
          onClick={() => (editing ? handleSave() : setEditing(true))}
          disabled={saving}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all disabled:opacity-50"
          style={{
            background: editing ? "rgba(34,197,94,0.15)" : "rgba(255,255,255,0.07)",
            color: editing ? "#4ade80" : "#9ca3af",
            border: "1px solid rgba(255,255,255,0.08)",
          }}
        >
          <FontAwesomeIcon icon={saving ? faSpinner : editing ? faCheck : faPen} className={`w-3.5 h-3.5 ${saving ? "animate-spin" : ""}`} />
          {saving ? "Sauvegarde…" : saved ? "Sauvegardé !" : editing ? "Sauvegarder" : "Modifier"}
        </button>
      </div>

      {/* Avatar */}
      <div className="flex items-center gap-4 mb-8 p-5 rounded-xl" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
        <div className="w-16 h-16 rounded-full bg-blue-600/20 flex items-center justify-center text-2xl font-bold text-blue-400">
          {profile.prenom?.[0]}{profile.nom?.[0]}
        </div>
        <div>
          <p className="font-semibold text-white">{profile.prenom} {profile.nom}</p>
          <p className="text-sm text-gray-500">{profile.email}</p>
          <span className="text-xs text-blue-400 bg-blue-400/10 px-2 py-0.5 rounded-full mt-1 inline-block">Élève</span>
        </div>
      </div>

      {/* Form */}
      <div className="rounded-xl p-6 space-y-5" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
        <h2 className="font-semibold text-white text-sm uppercase tracking-wider mb-2">Informations personnelles</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[
            { key: "prenom", label: "Prénom", icon: faUser },
            { key: "nom",    label: "Nom",    icon: faUser },
          ].map(({ key, label, icon }) => (
            <div key={key}>
              <label className="block text-xs font-medium text-gray-500 mb-2">{label}</label>
              <div className="relative">
                <FontAwesomeIcon icon={icon} className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-600" />
                <input
                  type="text"
                  value={form[key as keyof Profile]}
                  disabled={!editing}
                  onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                  className="w-full pl-9 pr-4 py-2.5 rounded-lg text-sm text-white disabled:text-gray-400 transition-all focus:outline-none focus:ring-1 focus:ring-blue-600"
                  style={{ background: editing ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}
                />
              </div>
            </div>
          ))}
        </div>

        {[
          { key: "email",     label: "Email",     icon: faEnvelope,    type: "email", disabled: true  },
          { key: "telephone", label: "Téléphone", icon: faPhone,       type: "tel",   disabled: false },
          { key: "adresse",   label: "Adresse",   icon: faLocationDot, type: "text",  disabled: false },
        ].map(({ key, label, icon, type, disabled }) => (
          <div key={key}>
            <label className="block text-xs font-medium text-gray-500 mb-2">{label}</label>
            <div className="relative">
              <FontAwesomeIcon icon={icon} className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-600" />
              <input
                type={type}
                value={form[key as keyof Profile]}
                disabled={disabled || !editing}
                onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                className="w-full pl-9 pr-4 py-2.5 rounded-lg text-sm text-white disabled:text-gray-400 transition-all focus:outline-none focus:ring-1 focus:ring-blue-600"
                style={{ background: editing && !disabled ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}
              />
            </div>
            {key === "email" && <p className="text-xs text-gray-700 mt-1">L&apos;email ne peut pas être modifié ici.</p>}
          </div>
        ))}
      </div>

      {/* Danger zone */}
      <div className="mt-6 rounded-xl p-5" style={{ background: "rgba(220,38,38,0.05)", border: "1px solid rgba(220,38,38,0.15)" }}>
        <h3 className="text-sm font-semibold text-red-400 mb-1">Zone danger</h3>
        <p className="text-xs text-gray-500 mb-3">La suppression de votre compte est irréversible.</p>
        <button className="text-xs text-red-500 hover:text-red-400 transition-colors font-medium">
          Supprimer mon compte
        </button>
      </div>
    </div>
  );
}
