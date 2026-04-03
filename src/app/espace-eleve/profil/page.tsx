"use client";

import { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faUser, faEnvelope, faPhone, faLocationDot,
  faPen, faCheck, faSpinner, faTriangleExclamation,
  faCity, faHashtag,
} from "@fortawesome/free-solid-svg-icons";

interface Profile {
  id: string;
  prenom: string;
  nom: string;
  email: string;
  telephone: string | null;
  adresse: string | null;
  codePostal: string | null;
  ville: string | null;
  role: string;
  createdAt: string;
}

interface FormData {
  prenom: string;
  nom: string;
  telephone: string;
  adresse: string;
  codePostal: string;
  ville: string;
}

export default function ProfilPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [form, setForm] = useState<FormData>({
    prenom: "", nom: "", telephone: "", adresse: "", codePostal: "", ville: "",
  });
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    fetch("/api/users/me")
      .then(async (r) => {
        if (!r.ok) {
          const body = await r.json().catch(() => ({}));
          throw new Error(body.error || "Erreur lors du chargement");
        }
        return r.json();
      })
      .then((data: Profile) => {
        setProfile(data);
        setForm({
          prenom: data.prenom || "",
          nom: data.nom || "",
          telephone: data.telephone || "",
          adresse: data.adresse || "",
          codePostal: data.codePostal || "",
          ville: data.ville || "",
        });
      })
      .catch((err) => {
        setError(err.message || "Impossible de charger votre profil.");
      })
      .finally(() => setLoading(false));
  }, []);

  async function handleSave() {
    setSaving(true);
    setSaveMsg(null);
    try {
      const res = await fetch("/api/users/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prenom: form.prenom,
          nom: form.nom,
          telephone: form.telephone || undefined,
          adresse: form.adresse || undefined,
          codePostal: form.codePostal || undefined,
          ville: form.ville || undefined,
        }),
      });
      if (res.ok) {
        const updated: Profile = await res.json();
        setProfile(updated);
        setForm({
          prenom: updated.prenom || "",
          nom: updated.nom || "",
          telephone: updated.telephone || "",
          adresse: updated.adresse || "",
          codePostal: updated.codePostal || "",
          ville: updated.ville || "",
        });
        setEditing(false);
        setSaveMsg({ type: "success", text: "Profil mis à jour avec succès." });
        setTimeout(() => setSaveMsg(null), 3000);
      } else {
        const body = await res.json().catch(() => ({}));
        setSaveMsg({ type: "error", text: body.error ? (typeof body.error === "string" ? body.error : "Données invalides.") : "Erreur lors de la sauvegarde." });
      }
    } catch {
      setSaveMsg({ type: "error", text: "Impossible de sauvegarder. Vérifiez votre connexion." });
    }
    setSaving(false);
  }

  function handleCancel() {
    if (profile) {
      setForm({
        prenom: profile.prenom || "",
        nom: profile.nom || "",
        telephone: profile.telephone || "",
        adresse: profile.adresse || "",
        codePostal: profile.codePostal || "",
        ville: profile.ville || "",
      });
    }
    setEditing(false);
    setSaveMsg(null);
  }

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 gap-3 text-gray-500">
        <FontAwesomeIcon icon={faSpinner} className="animate-spin text-xl" />
        <span className="text-sm">Chargement de votre profil...</span>
      </div>
    );
  }

  // Error state
  if (error || !profile) {
    return (
      <div className="text-center py-16 rounded-xl border" style={{ background: "rgba(220,38,38,0.05)", borderColor: "rgba(220,38,38,0.15)" }}>
        <FontAwesomeIcon icon={faTriangleExclamation} className="text-3xl text-red-400 mb-3" />
        <p className="text-white font-medium mb-1">Erreur de chargement</p>
        <p className="text-gray-500 text-sm mb-6">{error || "Profil introuvable."}</p>
        <button
          onClick={() => window.location.reload()}
          className="inline-block bg-red-600 text-white px-6 py-2.5 rounded-lg font-semibold text-sm hover:bg-red-700 transition-all"
        >
          Réessayer
        </button>
      </div>
    );
  }

  const fields: Array<{
    key: keyof FormData;
    label: string;
    icon: typeof faUser;
    type: string;
    disabled: boolean;
    placeholder: string;
    half?: boolean;
  }> = [
    { key: "prenom",     label: "Prénom",      icon: faUser,        type: "text",  disabled: false, placeholder: "Votre prénom",     half: true  },
    { key: "nom",        label: "Nom",         icon: faUser,        type: "text",  disabled: false, placeholder: "Votre nom",        half: true  },
    { key: "telephone",  label: "Téléphone",   icon: faPhone,       type: "tel",   disabled: false, placeholder: "06 12 34 56 78"              },
    { key: "adresse",    label: "Adresse",     icon: faLocationDot, type: "text",  disabled: false, placeholder: "12 rue de la Paix"           },
    { key: "codePostal", label: "Code postal", icon: faHashtag,     type: "text",  disabled: false, placeholder: "95000",            half: true },
    { key: "ville",      label: "Ville",       icon: faCity,        type: "text",  disabled: false, placeholder: "Cergy",            half: true },
  ];

  return (
    <div className="max-w-2xl">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="font-display font-bold text-2xl text-white mb-1">Mon profil</h1>
          <p className="text-gray-500 text-sm">Gérez vos informations personnelles</p>
        </div>
        <div className="flex items-center gap-2">
          {editing && (
            <button
              onClick={handleCancel}
              className="px-4 py-2 rounded-lg text-sm font-medium transition-all text-gray-400 hover:text-white"
              style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}
            >
              Annuler
            </button>
          )}
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
            {saving ? "Sauvegarde..." : editing ? "Sauvegarder" : "Modifier"}
          </button>
        </div>
      </div>

      {/* Save feedback */}
      {saveMsg && (
        <div
          className="mb-6 px-4 py-3 rounded-lg text-sm font-medium"
          style={{
            background: saveMsg.type === "success" ? "rgba(34,197,94,0.1)" : "rgba(220,38,38,0.1)",
            border: `1px solid ${saveMsg.type === "success" ? "rgba(34,197,94,0.2)" : "rgba(220,38,38,0.2)"}`,
            color: saveMsg.type === "success" ? "#4ade80" : "#f87171",
          }}
        >
          {saveMsg.text}
        </div>
      )}

      {/* Avatar */}
      <div className="flex items-center gap-4 mb-8 p-5 rounded-xl" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
        <div className="w-16 h-16 rounded-full bg-blue-600/20 flex items-center justify-center text-2xl font-bold text-blue-400">
          {profile.prenom?.[0]}{profile.nom?.[0]}
        </div>
        <div>
          <p className="font-semibold text-white">{profile.prenom} {profile.nom}</p>
          <p className="text-sm text-gray-500">{profile.email}</p>
          <span className="text-xs text-blue-400 bg-blue-400/10 px-2 py-0.5 rounded-full mt-1 inline-block">
            {profile.role === "ELEVE" ? "Élève" : profile.role}
          </span>
        </div>
      </div>

      {/* Form */}
      <div className="rounded-xl p-6 space-y-5" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
        <h2 className="font-semibold text-white text-sm uppercase tracking-wider mb-2">Informations personnelles</h2>

        {/* Email (always readonly) */}
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-2">Email</label>
          <div className="relative">
            <FontAwesomeIcon icon={faEnvelope} className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-600" />
            <input
              type="email"
              value={profile.email}
              disabled
              className="w-full pl-9 pr-4 py-2.5 rounded-lg text-sm text-gray-400 transition-all focus:outline-none"
              style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}
            />
          </div>
          <p className="text-xs text-gray-700 mt-1">L&apos;email ne peut pas être modifié ici.</p>
        </div>

        {/* Grouped fields: half-width pairs */}
        {(() => {
          const elements: React.ReactNode[] = [];
          let i = 0;
          while (i < fields.length) {
            const field = fields[i];
            if (field.half && i + 1 < fields.length && fields[i + 1].half) {
              // Render two half-width fields side by side
              const field2 = fields[i + 1];
              elements.push(
                <div key={`row-${field.key}-${field2.key}`} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[field, field2].map((f) => (
                    <div key={f.key}>
                      <label className="block text-xs font-medium text-gray-500 mb-2">{f.label}</label>
                      <div className="relative">
                        <FontAwesomeIcon icon={f.icon} className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-600" />
                        <input
                          type={f.type}
                          value={form[f.key]}
                          disabled={!editing}
                          placeholder={f.placeholder}
                          onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                          className="w-full pl-9 pr-4 py-2.5 rounded-lg text-sm text-white disabled:text-gray-400 transition-all focus:outline-none focus:ring-1 focus:ring-blue-600"
                          style={{ background: editing ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              );
              i += 2;
            } else {
              // Render full-width field
              elements.push(
                <div key={field.key}>
                  <label className="block text-xs font-medium text-gray-500 mb-2">{field.label}</label>
                  <div className="relative">
                    <FontAwesomeIcon icon={field.icon} className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-600" />
                    <input
                      type={field.type}
                      value={form[field.key]}
                      disabled={!editing}
                      placeholder={field.placeholder}
                      onChange={(e) => setForm({ ...form, [field.key]: e.target.value })}
                      className="w-full pl-9 pr-4 py-2.5 rounded-lg text-sm text-white disabled:text-gray-400 transition-all focus:outline-none focus:ring-1 focus:ring-blue-600"
                      style={{ background: editing ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}
                    />
                  </div>
                </div>
              );
              i += 1;
            }
          }
          return elements;
        })()}
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
