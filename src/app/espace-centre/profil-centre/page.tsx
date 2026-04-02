"use client";

import { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBuilding,
  faSpinner,
  faPaintBrush,
  faShareNodes,
  faFileLines,
  faCircleInfo,
  faPlus,
  faXmark,
  faCheck,
  faEye,
  faLocationDot,
  faPhone,
  faEnvelope,
  faGlobe,
  faClock,
  faAward,
  faToolbox,
  faImage,
} from "@fortawesome/free-solid-svg-icons";
import {
  faFacebook,
  faInstagram,
  faLinkedin,
  faYoutube,
} from "@fortawesome/free-brands-svg-icons";

// ─── TYPES ────────────────────────────────────────────────

interface ReseauxSociaux {
  facebook?: string;
  instagram?: string;
  linkedin?: string;
  youtube?: string;
}

interface CentreProfile {
  id: string;
  nom: string;
  slug: string;
  description: string | null;
  adresse: string;
  codePostal: string;
  ville: string;
  telephone: string | null;
  email: string | null;
  siteWeb: string | null;
  bannerImage: string | null;
  couleurPrimaire: string | null;
  couleurSecondaire: string | null;
  presentationHtml: string | null;
  horaires: string | null;
  equipements: string[];
  certifications: string[];
  reseauxSociaux: ReseauxSociaux | null;
}

type TabId = "informations" | "presentation" | "design" | "reseaux";

const TABS: { id: TabId; label: string; icon: typeof faCircleInfo }[] = [
  { id: "informations", label: "Informations", icon: faCircleInfo },
  { id: "presentation", label: "Presentation", icon: faFileLines },
  { id: "design", label: "Design", icon: faPaintBrush },
  { id: "reseaux", label: "Reseaux sociaux", icon: faShareNodes },
];

const EQUIPEMENT_SUGGESTIONS = [
  "Salle climatisee",
  "Parking gratuit",
  "Wifi",
  "Simulateur",
  "Salle de code",
  "Piste privee",
  "Acces PMR",
  "Vehicules recents",
];

const CERTIFICATION_SUGGESTIONS = [
  "Qualiopi",
  "Datadock",
  "Agree Prefecture",
  "Label qualite",
  "ISO 9001",
  "CPF",
];

// ─── INPUT STYLE ──────────────────────────────────────────

const inputClass =
  "w-full px-4 py-2.5 rounded-lg text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-600 transition-all";
const inputStyle = {
  background: "rgba(255,255,255,0.07)",
  border: "1px solid rgba(255,255,255,0.08)",
};
const cardStyle = {
  background: "rgba(255,255,255,0.04)",
  border: "1px solid rgba(255,255,255,0.07)",
};

// ─── COMPONENT ────────────────────────────────────────────

export default function ProfilCentrePage() {
  const [form, setForm] = useState<CentreProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabId>("informations");

  // Chip inputs
  const [newEquipement, setNewEquipement] = useState("");
  const [newCertification, setNewCertification] = useState("");

  useEffect(() => {
    fetch("/api/centre/me")
      .then((r) => r.json())
      .then((data) => {
        if (data && data.nom) {
          setForm({
            ...data,
            equipements: data.equipements || [],
            certifications: data.certifications || [],
            reseauxSociaux: data.reseauxSociaux || {
              facebook: "",
              instagram: "",
              linkedin: "",
              youtube: "",
            },
          });
        }
      })
      .catch(() => setError("Impossible de charger les informations du centre."))
      .finally(() => setLoading(false));
  }, []);

  function updateField<K extends keyof CentreProfile>(
    key: K,
    value: CentreProfile[K]
  ) {
    if (!form) return;
    setForm({ ...form, [key]: value });
  }

  function updateSocial(key: keyof ReseauxSociaux, value: string) {
    if (!form) return;
    setForm({
      ...form,
      reseauxSociaux: { ...form.reseauxSociaux, [key]: value },
    });
  }

  function addChip(
    field: "equipements" | "certifications",
    value: string,
    setter: (v: string) => void
  ) {
    if (!form || !value.trim()) return;
    const current = form[field] || [];
    if (current.includes(value.trim())) return;
    setForm({ ...form, [field]: [...current, value.trim()] });
    setter("");
  }

  function removeChip(field: "equipements" | "certifications", index: number) {
    if (!form) return;
    const current = [...(form[field] || [])];
    current.splice(index, 1);
    setForm({ ...form, [field]: current });
  }

  async function handleSave() {
    if (!form) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/centre/me", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nom: form.nom,
          description: form.description || null,
          adresse: form.adresse,
          codePostal: form.codePostal,
          ville: form.ville,
          telephone: form.telephone || null,
          email: form.email || null,
          siteWeb: form.siteWeb || null,
          bannerImage: form.bannerImage || null,
          couleurPrimaire: form.couleurPrimaire || null,
          couleurSecondaire: form.couleurSecondaire || null,
          presentationHtml: form.presentationHtml || null,
          horaires: form.horaires || null,
          equipements: form.equipements || [],
          certifications: form.certifications || [],
          reseauxSociaux: form.reseauxSociaux || null,
        }),
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Erreur serveur");
      }
      const updated = await res.json();
      setForm({
        ...updated,
        equipements: updated.equipements || [],
        certifications: updated.certifications || [],
        reseauxSociaux: updated.reseauxSociaux || {
          facebook: "",
          instagram: "",
          linkedin: "",
          youtube: "",
        },
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erreur lors de la sauvegarde");
    }
    setSaving(false);
  }

  // ─── LOADING ────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 gap-3 text-gray-500">
        <FontAwesomeIcon icon={faSpinner} className="animate-spin text-xl" />
        <span className="text-sm">Chargement...</span>
      </div>
    );
  }

  if (!form) {
    return (
      <div className="text-center py-24 text-gray-500">
        <p>Impossible de charger le profil du centre.</p>
      </div>
    );
  }

  // ─── RENDER ─────────────────────────────────────────────

  return (
    <div className="max-w-3xl space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-display font-bold text-2xl text-white mb-1">
          Profil du centre
        </h1>
        <p className="text-gray-500 text-sm">
          Personnalisez l&apos;apparence et les informations de votre page publique
        </p>
      </div>

      {/* Error */}
      {error && (
        <div
          className="flex items-center gap-3 p-4 rounded-lg text-sm"
          style={{
            background: "rgba(239,68,68,0.1)",
            border: "1px solid rgba(239,68,68,0.2)",
          }}
        >
          <span className="text-red-400">{error}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-lg" style={{ background: "rgba(255,255,255,0.04)" }}>
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
              activeTab === tab.id
                ? "bg-blue-600 text-white"
                : "text-gray-400 hover:text-white hover:bg-white/5"
            }`}
          >
            <FontAwesomeIcon icon={tab.icon} className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* ─── TAB: INFORMATIONS ─────────────────────────────── */}
      {activeTab === "informations" && (
        <div className="rounded-xl p-6 space-y-4" style={cardStyle}>
          <h2 className="font-semibold text-white text-sm uppercase tracking-wider mb-4 flex items-center gap-2">
            <FontAwesomeIcon icon={faBuilding} className="text-blue-400 w-4 h-4" />
            Informations du centre
          </h2>

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-2">
              Nom du centre
            </label>
            <input
              type="text"
              value={form.nom}
              onChange={(e) => updateField("nom", e.target.value)}
              className={inputClass}
              style={inputStyle}
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-2">
              Description courte
            </label>
            <textarea
              value={form.description || ""}
              onChange={(e) => updateField("description", e.target.value)}
              rows={3}
              className={inputClass}
              style={inputStyle}
              placeholder="Presentez votre centre en quelques lignes..."
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-2">
              Adresse
            </label>
            <div className="relative">
              <FontAwesomeIcon
                icon={faLocationDot}
                className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-600"
              />
              <input
                type="text"
                value={form.adresse}
                onChange={(e) => updateField("adresse", e.target.value)}
                className={`${inputClass} pl-9`}
                style={inputStyle}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-2">
                Code postal
              </label>
              <input
                type="text"
                value={form.codePostal}
                onChange={(e) => updateField("codePostal", e.target.value)}
                className={inputClass}
                style={inputStyle}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-2">
                Ville
              </label>
              <input
                type="text"
                value={form.ville}
                onChange={(e) => updateField("ville", e.target.value)}
                className={inputClass}
                style={inputStyle}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-2">
                Telephone
              </label>
              <div className="relative">
                <FontAwesomeIcon
                  icon={faPhone}
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-600"
                />
                <input
                  type="tel"
                  value={form.telephone || ""}
                  onChange={(e) => updateField("telephone", e.target.value)}
                  className={`${inputClass} pl-9`}
                  style={inputStyle}
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-2">
                Email
              </label>
              <div className="relative">
                <FontAwesomeIcon
                  icon={faEnvelope}
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-600"
                />
                <input
                  type="email"
                  value={form.email || ""}
                  onChange={(e) => updateField("email", e.target.value)}
                  className={`${inputClass} pl-9`}
                  style={inputStyle}
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-2">
              Site web
            </label>
            <div className="relative">
              <FontAwesomeIcon
                icon={faGlobe}
                className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-600"
              />
              <input
                type="url"
                value={form.siteWeb || ""}
                onChange={(e) => updateField("siteWeb", e.target.value)}
                className={`${inputClass} pl-9`}
                style={inputStyle}
                placeholder="https://www.example.fr"
              />
            </div>
          </div>
        </div>
      )}

      {/* ─── TAB: PRESENTATION ─────────────────────────────── */}
      {activeTab === "presentation" && (
        <div className="space-y-6">
          {/* Presentation HTML */}
          <div className="rounded-xl p-6" style={cardStyle}>
            <h2 className="font-semibold text-white text-sm uppercase tracking-wider mb-4 flex items-center gap-2">
              <FontAwesomeIcon icon={faFileLines} className="text-blue-400 w-4 h-4" />
              Presentation detaillee
            </h2>
            <p className="text-xs text-gray-500 mb-3">
              Redigez une presentation riche de votre centre. Le HTML basique est supporte (gras, italique, listes, liens).
            </p>
            <textarea
              value={form.presentationHtml || ""}
              onChange={(e) => updateField("presentationHtml", e.target.value)}
              rows={8}
              className={inputClass}
              style={inputStyle}
              placeholder="<p>Notre centre de formation vous accueille...</p>"
            />
            {form.presentationHtml && (
              <div className="mt-4">
                <p className="text-xs text-gray-500 mb-2 flex items-center gap-1.5">
                  <FontAwesomeIcon icon={faEye} className="w-3 h-3" />
                  Apercu
                </p>
                <div
                  className="prose prose-sm prose-invert max-w-none p-4 rounded-lg text-sm text-gray-300 leading-relaxed"
                  style={{ background: "rgba(255,255,255,0.03)" }}
                  dangerouslySetInnerHTML={{ __html: form.presentationHtml }}
                />
              </div>
            )}
          </div>

          {/* Horaires */}
          <div className="rounded-xl p-6" style={cardStyle}>
            <h2 className="font-semibold text-white text-sm uppercase tracking-wider mb-4 flex items-center gap-2">
              <FontAwesomeIcon icon={faClock} className="text-blue-400 w-4 h-4" />
              Horaires d&apos;ouverture
            </h2>
            <textarea
              value={form.horaires || ""}
              onChange={(e) => updateField("horaires", e.target.value)}
              rows={5}
              className={inputClass}
              style={inputStyle}
              placeholder={"Lundi - Vendredi : 9h00 - 18h00\nSamedi : 9h00 - 12h00\nDimanche : Ferme"}
            />
          </div>

          {/* Equipements */}
          <div className="rounded-xl p-6" style={cardStyle}>
            <h2 className="font-semibold text-white text-sm uppercase tracking-wider mb-4 flex items-center gap-2">
              <FontAwesomeIcon icon={faToolbox} className="text-blue-400 w-4 h-4" />
              Equipements
            </h2>
            <div className="flex flex-wrap gap-2 mb-3">
              {(form.equipements || []).map((eq, i) => (
                <span
                  key={i}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-blue-600/20 text-blue-300 border border-blue-500/30"
                >
                  {eq}
                  <button
                    onClick={() => removeChip("equipements", i)}
                    className="hover:text-red-400 transition-colors"
                  >
                    <FontAwesomeIcon icon={faXmark} className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={newEquipement}
                onChange={(e) => setNewEquipement(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addChip("equipements", newEquipement, setNewEquipement);
                  }
                }}
                className={`${inputClass} flex-1`}
                style={inputStyle}
                placeholder="Ajouter un equipement..."
              />
              <button
                onClick={() =>
                  addChip("equipements", newEquipement, setNewEquipement)
                }
                className="px-3 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm transition-colors"
              >
                <FontAwesomeIcon icon={faPlus} className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="flex flex-wrap gap-1.5 mt-3">
              {EQUIPEMENT_SUGGESTIONS.filter(
                (s) => !(form.equipements || []).includes(s)
              ).map((s) => (
                <button
                  key={s}
                  onClick={() => addChip("equipements", s, setNewEquipement)}
                  className="px-2.5 py-1 rounded-full text-[11px] text-gray-500 border border-dashed border-gray-700 hover:border-blue-500 hover:text-blue-400 transition-all"
                >
                  + {s}
                </button>
              ))}
            </div>
          </div>

          {/* Certifications */}
          <div className="rounded-xl p-6" style={cardStyle}>
            <h2 className="font-semibold text-white text-sm uppercase tracking-wider mb-4 flex items-center gap-2">
              <FontAwesomeIcon icon={faAward} className="text-blue-400 w-4 h-4" />
              Certifications
            </h2>
            <div className="flex flex-wrap gap-2 mb-3">
              {(form.certifications || []).map((cert, i) => (
                <span
                  key={i}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-amber-500/20 text-amber-300 border border-amber-500/30"
                >
                  <FontAwesomeIcon icon={faAward} className="w-3 h-3" />
                  {cert}
                  <button
                    onClick={() => removeChip("certifications", i)}
                    className="hover:text-red-400 transition-colors"
                  >
                    <FontAwesomeIcon icon={faXmark} className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={newCertification}
                onChange={(e) => setNewCertification(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addChip(
                      "certifications",
                      newCertification,
                      setNewCertification
                    );
                  }
                }}
                className={`${inputClass} flex-1`}
                style={inputStyle}
                placeholder="Ajouter une certification..."
              />
              <button
                onClick={() =>
                  addChip(
                    "certifications",
                    newCertification,
                    setNewCertification
                  )
                }
                className="px-3 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm transition-colors"
              >
                <FontAwesomeIcon icon={faPlus} className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="flex flex-wrap gap-1.5 mt-3">
              {CERTIFICATION_SUGGESTIONS.filter(
                (s) => !(form.certifications || []).includes(s)
              ).map((s) => (
                <button
                  key={s}
                  onClick={() =>
                    addChip("certifications", s, setNewCertification)
                  }
                  className="px-2.5 py-1 rounded-full text-[11px] text-gray-500 border border-dashed border-gray-700 hover:border-amber-500 hover:text-amber-400 transition-all"
                >
                  + {s}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ─── TAB: DESIGN ───────────────────────────────────── */}
      {activeTab === "design" && (
        <div className="space-y-6">
          {/* Colors */}
          <div className="rounded-xl p-6" style={cardStyle}>
            <h2 className="font-semibold text-white text-sm uppercase tracking-wider mb-4 flex items-center gap-2">
              <FontAwesomeIcon icon={faPaintBrush} className="text-blue-400 w-4 h-4" />
              Couleurs
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-2">
                  Couleur primaire
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={form.couleurPrimaire || "#3B82F6"}
                    onChange={(e) =>
                      updateField("couleurPrimaire", e.target.value)
                    }
                    className="w-10 h-10 rounded-lg cursor-pointer border-0 bg-transparent"
                  />
                  <input
                    type="text"
                    value={form.couleurPrimaire || ""}
                    onChange={(e) =>
                      updateField("couleurPrimaire", e.target.value)
                    }
                    className={`${inputClass} flex-1`}
                    style={inputStyle}
                    placeholder="#3B82F6"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-2">
                  Couleur secondaire
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={form.couleurSecondaire || "#1E40AF"}
                    onChange={(e) =>
                      updateField("couleurSecondaire", e.target.value)
                    }
                    className="w-10 h-10 rounded-lg cursor-pointer border-0 bg-transparent"
                  />
                  <input
                    type="text"
                    value={form.couleurSecondaire || ""}
                    onChange={(e) =>
                      updateField("couleurSecondaire", e.target.value)
                    }
                    className={`${inputClass} flex-1`}
                    style={inputStyle}
                    placeholder="#1E40AF"
                  />
                </div>
              </div>
            </div>
            {(form.couleurPrimaire || form.couleurSecondaire) && (
              <button
                onClick={() => {
                  updateField("couleurPrimaire", null);
                  updateField("couleurSecondaire", null);
                }}
                className="mt-3 text-xs text-gray-500 hover:text-red-400 transition-colors"
              >
                Reinitialiser les couleurs par defaut
              </button>
            )}
          </div>

          {/* Banner */}
          <div className="rounded-xl p-6" style={cardStyle}>
            <h2 className="font-semibold text-white text-sm uppercase tracking-wider mb-4 flex items-center gap-2">
              <FontAwesomeIcon icon={faImage} className="text-blue-400 w-4 h-4" />
              Image de banniere
            </h2>
            <input
              type="url"
              value={form.bannerImage || ""}
              onChange={(e) => updateField("bannerImage", e.target.value)}
              className={inputClass}
              style={inputStyle}
              placeholder="https://exemple.fr/banner.jpg"
            />
            <p className="text-xs text-gray-600 mt-2">
              Entrez l&apos;URL d&apos;une image (format recommande : 1200x400px).
              L&apos;upload de fichier sera disponible prochainement.
            </p>
            {form.bannerImage && (
              <div className="mt-4">
                <p className="text-xs text-gray-500 mb-2 flex items-center gap-1.5">
                  <FontAwesomeIcon icon={faEye} className="w-3 h-3" />
                  Apercu de la banniere
                </p>
                <div className="rounded-lg overflow-hidden h-32">
                  <img
                    src={form.bannerImage}
                    alt="Banner preview"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = "none";
                    }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Live preview */}
          <div className="rounded-xl p-6" style={cardStyle}>
            <h2 className="font-semibold text-white text-sm uppercase tracking-wider mb-4 flex items-center gap-2">
              <FontAwesomeIcon icon={faEye} className="text-blue-400 w-4 h-4" />
              Apercu de la page publique
            </h2>
            <div className="rounded-lg overflow-hidden border border-white/10">
              {/* Mini hero preview */}
              <div
                className="relative p-6 text-white"
                style={{
                  background: form.bannerImage
                    ? `linear-gradient(rgba(10,22,40,0.8), rgba(10,22,40,0.9)), url(${form.bannerImage}) center/cover`
                    : "#0A1628",
                }}
              >
                <div className="flex items-center gap-4">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center"
                    style={{
                      background: form.couleurPrimaire
                        ? `${form.couleurPrimaire}30`
                        : "rgba(59,130,246,0.2)",
                    }}
                  >
                    <FontAwesomeIcon
                      icon={faBuilding}
                      className="text-xl"
                      style={{
                        color: form.couleurPrimaire || "#60A5FA",
                      }}
                    />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">{form.nom}</h3>
                    <p className="text-sm text-gray-400">
                      {form.adresse}, {form.codePostal} {form.ville}
                    </p>
                  </div>
                </div>
                {form.certifications && form.certifications.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {form.certifications.map((cert, i) => (
                      <span
                        key={i}
                        className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30"
                      >
                        <FontAwesomeIcon
                          icon={faAward}
                          className="mr-1 w-2.5 h-2.5"
                        />
                        {cert}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              {/* Mini cards preview */}
              <div className="p-4 grid grid-cols-2 gap-2 bg-gray-50">
                <div className="bg-white rounded-lg p-3 border border-gray-100">
                  <p className="text-[10px] text-gray-400 mb-0.5">Telephone</p>
                  <p
                    className="text-xs font-semibold"
                    style={{ color: form.couleurPrimaire || "#3B82F6" }}
                  >
                    {form.telephone || "Non renseigne"}
                  </p>
                </div>
                <div className="bg-white rounded-lg p-3 border border-gray-100">
                  <p className="text-[10px] text-gray-400 mb-0.5">Email</p>
                  <p
                    className="text-xs font-semibold truncate"
                    style={{ color: form.couleurPrimaire || "#3B82F6" }}
                  >
                    {form.email || "Non renseigne"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── TAB: RESEAUX SOCIAUX ──────────────────────────── */}
      {activeTab === "reseaux" && (
        <div className="rounded-xl p-6 space-y-5" style={cardStyle}>
          <h2 className="font-semibold text-white text-sm uppercase tracking-wider mb-4 flex items-center gap-2">
            <FontAwesomeIcon icon={faShareNodes} className="text-blue-400 w-4 h-4" />
            Reseaux sociaux
          </h2>

          {[
            {
              key: "facebook" as const,
              label: "Facebook",
              icon: faFacebook,
              color: "#1877F2",
              placeholder: "https://www.facebook.com/votre-centre",
            },
            {
              key: "instagram" as const,
              label: "Instagram",
              icon: faInstagram,
              color: "#E4405F",
              placeholder: "https://www.instagram.com/votre-centre",
            },
            {
              key: "linkedin" as const,
              label: "LinkedIn",
              icon: faLinkedin,
              color: "#0A66C2",
              placeholder: "https://www.linkedin.com/company/votre-centre",
            },
            {
              key: "youtube" as const,
              label: "YouTube",
              icon: faYoutube,
              color: "#FF0000",
              placeholder: "https://www.youtube.com/@votre-centre",
            },
          ].map((social) => (
            <div key={social.key}>
              <label className="block text-xs font-medium text-gray-500 mb-2 flex items-center gap-2">
                <FontAwesomeIcon
                  icon={social.icon}
                  className="w-3.5 h-3.5"
                  style={{ color: social.color }}
                />
                {social.label}
              </label>
              <input
                type="url"
                value={form.reseauxSociaux?.[social.key] || ""}
                onChange={(e) => updateSocial(social.key, e.target.value)}
                className={inputClass}
                style={inputStyle}
                placeholder={social.placeholder}
              />
            </div>
          ))}

          {/* Icons preview */}
          {form.reseauxSociaux &&
            Object.values(form.reseauxSociaux).some((v) => v) && (
              <div className="pt-4 border-t" style={{ borderColor: "rgba(255,255,255,0.07)" }}>
                <p className="text-xs text-gray-500 mb-3 flex items-center gap-1.5">
                  <FontAwesomeIcon icon={faEye} className="w-3 h-3" />
                  Apercu des icones
                </p>
                <div className="flex gap-3">
                  {form.reseauxSociaux.facebook && (
                    <div className="w-10 h-10 rounded-lg bg-[#1877F2]/20 flex items-center justify-center">
                      <FontAwesomeIcon
                        icon={faFacebook}
                        className="text-[#1877F2]"
                      />
                    </div>
                  )}
                  {form.reseauxSociaux.instagram && (
                    <div className="w-10 h-10 rounded-lg bg-[#E4405F]/20 flex items-center justify-center">
                      <FontAwesomeIcon
                        icon={faInstagram}
                        className="text-[#E4405F]"
                      />
                    </div>
                  )}
                  {form.reseauxSociaux.linkedin && (
                    <div className="w-10 h-10 rounded-lg bg-[#0A66C2]/20 flex items-center justify-center">
                      <FontAwesomeIcon
                        icon={faLinkedin}
                        className="text-[#0A66C2]"
                      />
                    </div>
                  )}
                  {form.reseauxSociaux.youtube && (
                    <div className="w-10 h-10 rounded-lg bg-[#FF0000]/20 flex items-center justify-center">
                      <FontAwesomeIcon
                        icon={faYoutube}
                        className="text-[#FF0000]"
                      />
                    </div>
                  )}
                </div>
              </div>
            )}
        </div>
      )}

      {/* ─── SAVE BUTTON ───────────────────────────────────── */}
      <div className="flex items-center gap-4 pt-2">
        <button
          onClick={handleSave}
          disabled={saving}
          className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-6 py-2.5 rounded-lg text-sm font-semibold transition-all flex items-center gap-2"
        >
          {saving ? (
            <>
              <FontAwesomeIcon icon={faSpinner} className="animate-spin w-3.5 h-3.5" />
              Sauvegarde...
            </>
          ) : saved ? (
            <>
              <FontAwesomeIcon icon={faCheck} className="w-3.5 h-3.5" />
              Sauvegarde !
            </>
          ) : (
            "Sauvegarder le profil"
          )}
        </button>

        {form.slug && (
          <a
            href={`/centres/${form.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-gray-500 hover:text-blue-400 transition-colors flex items-center gap-1.5"
          >
            <FontAwesomeIcon icon={faEye} className="w-3 h-3" />
            Voir la page publique
          </a>
        )}
      </div>
    </div>
  );
}
