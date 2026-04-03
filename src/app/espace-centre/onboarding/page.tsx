"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBuilding,
  faPhone,
  faEnvelope,
  faGlobe,
  faFileLines,
  faClock,
  faToolbox,
  faAward,
  faGraduationCap,
  faCreditCard,
  faCheck,
  faChevronRight,
  faChevronLeft,
  faSpinner,
  faCircleCheck,
  faCircleExclamation,
  faPlus,
  faXmark,
  faLocationDot,
  faRocket,
  faArrowUpRightFromSquare,
} from "@fortawesome/free-solid-svg-icons";

// ─── TYPES ────────────────────────────────────────────────

interface CentreData {
  nom: string;
  description: string | null;
  adresse: string;
  codePostal: string;
  ville: string;
  telephone: string | null;
  email: string | null;
  siteWeb: string | null;
  presentationHtml: string | null;
  horaires: string | null;
  equipements: string[];
  certifications: string[];
  stripeOnboardingDone: boolean;
  subscriptionStatus: string | null;
}

interface Step {
  id: string;
  label: string;
  weight: number;
  score: number;
  completed: boolean;
  missingItems: string[];
}

interface CompletionData {
  percentage: number;
  missing: string[];
  steps: Step[];
  hasFormations: boolean;
  hasFormationsWithSessions: boolean;
}

type StepId = "informations" | "contact" | "presentation" | "formations" | "paiement";

const STEP_CONFIG: { id: StepId; label: string; icon: typeof faBuilding }[] = [
  { id: "informations", label: "Informations de base", icon: faBuilding },
  { id: "contact", label: "Contact", icon: faPhone },
  { id: "presentation", label: "Presentation", icon: faFileLines },
  { id: "formations", label: "Premiere formation", icon: faGraduationCap },
  { id: "paiement", label: "Paiement", icon: faCreditCard },
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

// ─── INPUT STYLES ─────────────────────────────────────────

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

export default function OnboardingPage() {
  const router = useRouter();
  const [centre, setCentre] = useState<CentreData | null>(null);
  const [completion, setCompletion] = useState<CompletionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState<StepId>("informations");
  const [connectingStripe, setConnectingStripe] = useState(false);

  // Chip inputs
  const [newEquipement, setNewEquipement] = useState("");
  const [newCertification, setNewCertification] = useState("");

  // ─── Data fetching ──────────────────────────────────────

  const fetchData = useCallback(async () => {
    try {
      const [centreRes, completionRes] = await Promise.all([
        fetch("/api/centre/me"),
        fetch("/api/centre/completion"),
      ]);

      if (centreRes.ok) {
        const data = await centreRes.json();
        if (data && data.nom) {
          setCentre({
            nom: data.nom ?? "",
            description: data.description ?? null,
            adresse: data.adresse ?? "",
            codePostal: data.codePostal ?? "",
            ville: data.ville ?? "",
            telephone: data.telephone ?? null,
            email: data.email ?? null,
            siteWeb: data.siteWeb ?? null,
            presentationHtml: data.presentationHtml ?? null,
            horaires: data.horaires ?? null,
            equipements: data.equipements ?? [],
            certifications: data.certifications ?? [],
            stripeOnboardingDone: data.stripeOnboardingDone ?? false,
            subscriptionStatus: data.subscriptionStatus ?? null,
          });
        }
      }

      if (completionRes.ok) {
        const data = await completionRes.json();
        setCompletion(data);
      }
    } catch {
      setError("Impossible de charger les donnees.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ─── Helpers ────────────────────────────────────────────

  function updateField<K extends keyof CentreData>(key: K, value: CentreData[K]) {
    if (!centre) return;
    setCentre({ ...centre, [key]: value });
  }

  function addChip(
    field: "equipements" | "certifications",
    value: string,
    setter: (v: string) => void
  ) {
    if (!centre || !value.trim()) return;
    const current = centre[field] || [];
    if (current.includes(value.trim())) return;
    setCentre({ ...centre, [field]: [...current, value.trim()] });
    setter("");
  }

  function removeChip(field: "equipements" | "certifications", index: number) {
    if (!centre) return;
    const current = [...(centre[field] || [])];
    current.splice(index, 1);
    setCentre({ ...centre, [field]: current });
  }

  const currentStepIndex = STEP_CONFIG.findIndex((s) => s.id === currentStep);

  function goNext() {
    if (currentStepIndex < STEP_CONFIG.length - 1) {
      setCurrentStep(STEP_CONFIG[currentStepIndex + 1].id);
    }
  }

  function goPrev() {
    if (currentStepIndex > 0) {
      setCurrentStep(STEP_CONFIG[currentStepIndex - 1].id);
    }
  }

  function getStepCompletion(stepId: string): Step | undefined {
    return completion?.steps.find((s) => s.id === stepId);
  }

  // ─── Save current step ─────────────────────────────────

  async function handleSave() {
    if (!centre) return;
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      const res = await fetch("/api/centre/me", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nom: centre.nom,
          description: centre.description || null,
          adresse: centre.adresse,
          codePostal: centre.codePostal,
          ville: centre.ville,
          telephone: centre.telephone || null,
          email: centre.email || null,
          siteWeb: centre.siteWeb || null,
          presentationHtml: centre.presentationHtml || null,
          horaires: centre.horaires || null,
          equipements: centre.equipements || [],
          certifications: centre.certifications || [],
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Erreur serveur");
      }

      // Refresh completion data
      const completionRes = await fetch("/api/centre/completion");
      if (completionRes.ok) {
        setCompletion(await completionRes.json());
      }

      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erreur lors de la sauvegarde");
    }
    setSaving(false);
  }

  async function handleSaveAndNext() {
    await handleSave();
    goNext();
  }

  // ─── Stripe connect ─────────────────────────────────────

  async function handleStripeConnect() {
    setConnectingStripe(true);
    try {
      const res = await fetch("/api/stripe/connect", { method: "POST" });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
    } catch {
      setError("Erreur lors de la connexion Stripe.");
    }
    setConnectingStripe(false);
  }

  // ─── Loading ────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 gap-3 text-gray-500">
        <FontAwesomeIcon icon={faSpinner} className="animate-spin text-xl" />
        <span className="text-sm">Chargement...</span>
      </div>
    );
  }

  if (!centre) {
    return (
      <div className="text-center py-24 text-gray-500">
        <p>Impossible de charger les informations du centre.</p>
      </div>
    );
  }

  const percentage = completion?.percentage ?? 0;
  const descriptionLength = centre.description?.trim().length ?? 0;
  const presentationLength = centre.presentationHtml
    ? centre.presentationHtml.replace(/<[^>]*>/g, "").trim().length
    : 0;

  // ─── RENDER ─────────────────────────────────────────────

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-600/15 border border-blue-500/20 text-blue-400 text-xs font-semibold mb-4">
          <FontAwesomeIcon icon={faRocket} className="w-3 h-3" />
          Configuration de votre centre
        </div>
        <h1 className="font-display font-bold text-3xl text-white mb-2">
          Completez votre profil
        </h1>
        <p className="text-gray-400 text-sm max-w-lg mx-auto">
          Remplissez toutes les informations pour que votre centre soit visible
          sur la marketplace BYS Formation.
        </p>
      </div>

      {/* Progress bar */}
      <div className="rounded-xl p-6" style={cardStyle}>
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-medium text-gray-400">
            Progression du profil
          </span>
          <span
            className={`text-2xl font-bold ${
              percentage >= 100
                ? "text-green-400"
                : percentage >= 50
                ? "text-blue-400"
                : "text-orange-400"
            }`}
          >
            {percentage}%
          </span>
        </div>
        <div className="w-full h-3 rounded-full bg-white/5 overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-1000 ease-out"
            style={{
              width: `${percentage}%`,
              background:
                percentage >= 100
                  ? "linear-gradient(90deg, #22c55e, #4ade80)"
                  : percentage >= 50
                  ? "linear-gradient(90deg, #3b82f6, #60a5fa)"
                  : "linear-gradient(90deg, #f97316, #fb923c)",
            }}
          />
        </div>
        {percentage >= 100 ? (
          <p className="text-green-400 text-xs mt-3 flex items-center gap-2">
            <FontAwesomeIcon icon={faCircleCheck} className="w-3.5 h-3.5" />
            Votre centre est visible sur la marketplace !
          </p>
        ) : (
          <p className="text-gray-500 text-xs mt-3">
            Votre centre sera visible sur la marketplace quand votre profil
            atteindra 100%
          </p>
        )}
      </div>

      {/* Steps + Content layout */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Steps sidebar */}
        <div className="lg:col-span-1">
          <nav className="space-y-1">
            {STEP_CONFIG.map((step, index) => {
              const stepData = getStepCompletion(step.id);
              const isActive = currentStep === step.id;
              const isCompleted = stepData?.completed ?? false;

              return (
                <button
                  key={step.id}
                  onClick={() => setCurrentStep(step.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left text-sm font-medium transition-all ${
                    isActive
                      ? "bg-blue-600/15 text-white border border-blue-500/30"
                      : "text-gray-400 hover:text-white hover:bg-white/5 border border-transparent"
                  }`}
                >
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-xs font-bold transition-all ${
                      isCompleted
                        ? "bg-green-500 text-white"
                        : isActive
                        ? "bg-blue-600 text-white"
                        : "bg-white/8 text-gray-500"
                    }`}
                  >
                    {isCompleted ? (
                      <FontAwesomeIcon icon={faCheck} className="w-3 h-3" />
                    ) : (
                      index + 1
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="block truncate">{step.label}</span>
                    {stepData && !isCompleted && (
                      <span className="text-[10px] text-orange-400 block mt-0.5">
                        {stepData.missingItems.length} element(s) manquant(s)
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Step content */}
        <div className="lg:col-span-3">
          {/* ─── STEP: INFORMATIONS ──────────────────────── */}
          {currentStep === "informations" && (
            <div className="rounded-xl p-6 space-y-5" style={cardStyle}>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-blue-600/15 flex items-center justify-center">
                  <FontAwesomeIcon icon={faBuilding} className="text-blue-400" />
                </div>
                <div>
                  <h2 className="text-white font-semibold text-lg">
                    Informations de base
                  </h2>
                  <p className="text-gray-500 text-xs">
                    Les informations essentielles de votre centre
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-500 mb-2">
                  Nom du centre *
                </label>
                <input
                  type="text"
                  value={centre.nom}
                  onChange={(e) => updateField("nom", e.target.value)}
                  className={inputClass}
                  style={inputStyle}
                  placeholder="Ex: BYS Formation"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-500 mb-2">
                  Description courte * <span className="text-gray-600">(min. 50 caracteres)</span>
                </label>
                <textarea
                  value={centre.description || ""}
                  onChange={(e) => updateField("description", e.target.value)}
                  rows={3}
                  className={inputClass}
                  style={inputStyle}
                  placeholder="Presentez votre centre en quelques lignes..."
                />
                <div className="flex items-center justify-between mt-1.5">
                  <span
                    className={`text-[11px] ${
                      descriptionLength >= 50 ? "text-green-400" : "text-gray-600"
                    }`}
                  >
                    {descriptionLength >= 50 ? (
                      <FontAwesomeIcon icon={faCircleCheck} className="mr-1 w-3 h-3" />
                    ) : null}
                    {descriptionLength >= 50
                      ? "Minimum atteint"
                      : `${50 - descriptionLength} caracteres restants`}
                  </span>
                  <span className="text-[11px] text-gray-600">
                    {descriptionLength} / 50 min.
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-500 mb-2">
                  Adresse *
                </label>
                <div className="relative">
                  <FontAwesomeIcon
                    icon={faLocationDot}
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-600"
                  />
                  <input
                    type="text"
                    value={centre.adresse}
                    onChange={(e) => updateField("adresse", e.target.value)}
                    className={`${inputClass} pl-9`}
                    style={inputStyle}
                    placeholder="Bat. 7, 9 Chaussee Jules Cesar"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-2">
                    Code postal *
                  </label>
                  <input
                    type="text"
                    value={centre.codePostal}
                    onChange={(e) => updateField("codePostal", e.target.value)}
                    className={inputClass}
                    style={inputStyle}
                    placeholder="95520"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-2">
                    Ville *
                  </label>
                  <input
                    type="text"
                    value={centre.ville}
                    onChange={(e) => updateField("ville", e.target.value)}
                    className={inputClass}
                    style={inputStyle}
                    placeholder="Osny"
                  />
                </div>
              </div>
            </div>
          )}

          {/* ─── STEP: CONTACT ───────────────────────────── */}
          {currentStep === "contact" && (
            <div className="rounded-xl p-6 space-y-5" style={cardStyle}>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-blue-600/15 flex items-center justify-center">
                  <FontAwesomeIcon icon={faPhone} className="text-blue-400" />
                </div>
                <div>
                  <h2 className="text-white font-semibold text-lg">Contact</h2>
                  <p className="text-gray-500 text-xs">
                    Comment vos clients peuvent vous joindre
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-500 mb-2">
                  Telephone *
                </label>
                <div className="relative">
                  <FontAwesomeIcon
                    icon={faPhone}
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-600"
                  />
                  <input
                    type="tel"
                    value={centre.telephone || ""}
                    onChange={(e) => updateField("telephone", e.target.value)}
                    className={`${inputClass} pl-9`}
                    style={inputStyle}
                    placeholder="01 30 30 30 30"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-500 mb-2">
                  Email *
                </label>
                <div className="relative">
                  <FontAwesomeIcon
                    icon={faEnvelope}
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-600"
                  />
                  <input
                    type="email"
                    value={centre.email || ""}
                    onChange={(e) => updateField("email", e.target.value)}
                    className={`${inputClass} pl-9`}
                    style={inputStyle}
                    placeholder="contact@votre-centre.fr"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-500 mb-2">
                  Site web <span className="text-gray-600">(optionnel)</span>
                </label>
                <div className="relative">
                  <FontAwesomeIcon
                    icon={faGlobe}
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-600"
                  />
                  <input
                    type="url"
                    value={centre.siteWeb || ""}
                    onChange={(e) => updateField("siteWeb", e.target.value)}
                    className={`${inputClass} pl-9`}
                    style={inputStyle}
                    placeholder="https://www.votre-centre.fr"
                  />
                </div>
              </div>
            </div>
          )}

          {/* ─── STEP: PRESENTATION ──────────────────────── */}
          {currentStep === "presentation" && (
            <div className="space-y-6">
              {/* Presentation text */}
              <div className="rounded-xl p-6 space-y-4" style={cardStyle}>
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-xl bg-blue-600/15 flex items-center justify-center">
                    <FontAwesomeIcon icon={faFileLines} className="text-blue-400" />
                  </div>
                  <div>
                    <h2 className="text-white font-semibold text-lg">
                      Presentation
                    </h2>
                    <p className="text-gray-500 text-xs">
                      Decrivez votre centre en detail pour attirer les stagiaires
                    </p>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-2">
                    Texte de presentation *{" "}
                    <span className="text-gray-600">(min. 100 caracteres)</span>
                  </label>
                  <textarea
                    value={centre.presentationHtml || ""}
                    onChange={(e) =>
                      updateField("presentationHtml", e.target.value)
                    }
                    rows={6}
                    className={inputClass}
                    style={inputStyle}
                    placeholder="Notre centre de formation vous accueille dans un cadre moderne et agreeable. Nous proposons des stages de recuperation de points..."
                  />
                  <div className="flex items-center justify-between mt-1.5">
                    <span
                      className={`text-[11px] ${
                        presentationLength >= 100
                          ? "text-green-400"
                          : "text-gray-600"
                      }`}
                    >
                      {presentationLength >= 100 ? (
                        <FontAwesomeIcon
                          icon={faCircleCheck}
                          className="mr-1 w-3 h-3"
                        />
                      ) : null}
                      {presentationLength >= 100
                        ? "Minimum atteint"
                        : `${100 - presentationLength} caracteres restants`}
                    </span>
                    <span className="text-[11px] text-gray-600">
                      {presentationLength} / 100 min.
                    </span>
                  </div>
                </div>
              </div>

              {/* Horaires */}
              <div className="rounded-xl p-6" style={cardStyle}>
                <h3 className="text-white text-sm font-semibold mb-3 flex items-center gap-2">
                  <FontAwesomeIcon icon={faClock} className="text-blue-400 w-4 h-4" />
                  Horaires d&apos;ouverture <span className="text-gray-600 font-normal">(optionnel)</span>
                </h3>
                <textarea
                  value={centre.horaires || ""}
                  onChange={(e) => updateField("horaires", e.target.value)}
                  rows={4}
                  className={inputClass}
                  style={inputStyle}
                  placeholder={"Lundi - Vendredi : 9h00 - 18h00\nSamedi : 9h00 - 12h00\nDimanche : Ferme"}
                />
              </div>

              {/* Equipements */}
              <div className="rounded-xl p-6" style={cardStyle}>
                <h3 className="text-white text-sm font-semibold mb-3 flex items-center gap-2">
                  <FontAwesomeIcon icon={faToolbox} className="text-blue-400 w-4 h-4" />
                  Equipements <span className="text-gray-600 font-normal">(optionnel)</span>
                </h3>
                <div className="flex flex-wrap gap-2 mb-3">
                  {(centre.equipements || []).map((eq, i) => (
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
                    (s) => !(centre.equipements || []).includes(s)
                  ).map((s) => (
                    <button
                      key={s}
                      onClick={() =>
                        addChip("equipements", s, setNewEquipement)
                      }
                      className="px-2.5 py-1 rounded-full text-[11px] text-gray-500 border border-dashed border-gray-700 hover:border-blue-500 hover:text-blue-400 transition-all"
                    >
                      + {s}
                    </button>
                  ))}
                </div>
              </div>

              {/* Certifications */}
              <div className="rounded-xl p-6" style={cardStyle}>
                <h3 className="text-white text-sm font-semibold mb-3 flex items-center gap-2">
                  <FontAwesomeIcon icon={faAward} className="text-blue-400 w-4 h-4" />
                  Certifications <span className="text-gray-600 font-normal">(optionnel)</span>
                </h3>
                <div className="flex flex-wrap gap-2 mb-3">
                  {(centre.certifications || []).map((cert, i) => (
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
                    (s) => !(centre.certifications || []).includes(s)
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

          {/* ─── STEP: FORMATIONS ────────────────────────── */}
          {currentStep === "formations" && (
            <div className="rounded-xl p-6 space-y-5" style={cardStyle}>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-blue-600/15 flex items-center justify-center">
                  <FontAwesomeIcon
                    icon={faGraduationCap}
                    className="text-blue-400"
                  />
                </div>
                <div>
                  <h2 className="text-white font-semibold text-lg">
                    Premiere formation
                  </h2>
                  <p className="text-gray-500 text-xs">
                    Creez au moins une formation avec une session pour etre visible
                  </p>
                </div>
              </div>

              {completion?.hasFormationsWithSessions ? (
                <div className="flex items-center gap-3 p-4 rounded-lg bg-green-400/10 border border-green-400/20">
                  <FontAwesomeIcon
                    icon={faCircleCheck}
                    className="text-green-400 w-5 h-5"
                  />
                  <div>
                    <p className="text-sm font-semibold text-green-400">
                      Vous avez au moins une formation active avec des sessions
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      Cette etape est completee.
                    </p>
                  </div>
                </div>
              ) : completion?.hasFormations ? (
                <div
                  className="flex items-start gap-3 p-4 rounded-lg"
                  style={{
                    background: "rgba(251,146,60,0.1)",
                    border: "1px solid rgba(251,146,60,0.2)",
                  }}
                >
                  <FontAwesomeIcon
                    icon={faCircleExclamation}
                    className="text-orange-400 w-5 h-5 mt-0.5"
                  />
                  <div>
                    <p className="text-sm font-semibold text-orange-400">
                      Vous avez des formations, mais aucune session active
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      Ajoutez au moins une session a une formation existante.
                    </p>
                  </div>
                </div>
              ) : (
                <div
                  className="flex items-start gap-3 p-4 rounded-lg"
                  style={{
                    background: "rgba(255,255,255,0.03)",
                    border: "1px solid rgba(255,255,255,0.07)",
                  }}
                >
                  <FontAwesomeIcon
                    icon={faCircleExclamation}
                    className="text-gray-500 w-5 h-5 mt-0.5"
                  />
                  <div>
                    <p className="text-sm font-semibold text-gray-300">
                      Aucune formation creee
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Creez votre premiere formation pour commencer a recevoir des
                      inscriptions.
                    </p>
                  </div>
                </div>
              )}

              <Link
                href="/espace-centre/formations"
                className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg text-sm font-semibold transition-all"
              >
                <FontAwesomeIcon icon={faGraduationCap} className="w-4 h-4" />
                {completion?.hasFormations
                  ? "Gerer mes formations"
                  : "Creer ma premiere formation"}
                <FontAwesomeIcon
                  icon={faArrowUpRightFromSquare}
                  className="w-3 h-3 ml-1"
                />
              </Link>
            </div>
          )}

          {/* ─── STEP: PAIEMENT ──────────────────────────── */}
          {currentStep === "paiement" && (
            <div className="rounded-xl p-6 space-y-5" style={cardStyle}>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-blue-600/15 flex items-center justify-center">
                  <FontAwesomeIcon icon={faCreditCard} className="text-blue-400" />
                </div>
                <div>
                  <h2 className="text-white font-semibold text-lg">Paiement</h2>
                  <p className="text-gray-500 text-xs">
                    Configurez votre mode de paiement pour recevoir les
                    versements
                  </p>
                </div>
              </div>

              {/* Stripe Connect */}
              <div>
                <h3 className="text-white text-sm font-semibold mb-3">
                  Stripe Connect
                </h3>
                {centre.stripeOnboardingDone ? (
                  <div className="flex items-center gap-3 p-4 rounded-lg bg-green-400/10 border border-green-400/20">
                    <FontAwesomeIcon
                      icon={faCircleCheck}
                      className="text-green-400 w-5 h-5"
                    />
                    <div>
                      <p className="text-sm font-semibold text-green-400">
                        Compte Stripe connecte
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        Vous recevez automatiquement les paiements.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div>
                    <div
                      className="flex items-start gap-3 p-4 rounded-lg mb-4"
                      style={{
                        background: "rgba(251,146,60,0.1)",
                        border: "1px solid rgba(251,146,60,0.2)",
                      }}
                    >
                      <FontAwesomeIcon
                        icon={faCircleExclamation}
                        className="text-orange-400 w-5 h-5 mt-0.5"
                      />
                      <div>
                        <p className="text-sm font-semibold text-orange-400">
                          Compte Stripe non connecte
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          Connectez votre compte Stripe pour recevoir les
                          paiements de chaque reservation.
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={handleStripeConnect}
                      disabled={connectingStripe}
                      className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-5 py-2.5 rounded-lg text-sm font-semibold transition-all flex items-center gap-2"
                    >
                      {connectingStripe && (
                        <FontAwesomeIcon
                          icon={faSpinner}
                          className="animate-spin w-3.5 h-3.5"
                        />
                      )}
                      {connectingStripe
                        ? "Redirection..."
                        : "Connecter Stripe"}
                    </button>
                  </div>
                )}
              </div>

              {/* Subscription */}
              <div
                className="pt-5 border-t"
                style={{ borderColor: "rgba(255,255,255,0.07)" }}
              >
                <h3 className="text-white text-sm font-semibold mb-3">
                  Abonnement
                </h3>
                {centre.subscriptionStatus === "ACTIVE" ? (
                  <div className="flex items-center gap-3 p-4 rounded-lg bg-green-400/10 border border-green-400/20">
                    <FontAwesomeIcon
                      icon={faCircleCheck}
                      className="text-green-400 w-5 h-5"
                    />
                    <div>
                      <p className="text-sm font-semibold text-green-400">
                        Abonnement actif
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        Votre abonnement est en cours. Vous pouvez le gerer dans
                        les parametres.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div>
                    <p className="text-xs text-gray-500 mb-3">
                      Souscrivez un abonnement pour beneficier de commissions
                      reduites.
                    </p>
                    <Link
                      href="/tarifs-partenaires"
                      className="inline-flex items-center gap-2 bg-transparent border text-gray-300 hover:text-white hover:border-gray-500 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all"
                      style={{ borderColor: "rgba(255,255,255,0.15)" }}
                    >
                      Voir les plans d&apos;abonnement
                      <FontAwesomeIcon
                        icon={faArrowUpRightFromSquare}
                        className="w-3 h-3"
                      />
                    </Link>
                  </div>
                )}
              </div>

              {!centre.stripeOnboardingDone &&
                centre.subscriptionStatus !== "ACTIVE" && (
                  <p className="text-xs text-gray-600 italic">
                    Vous devez connecter Stripe Connect OU avoir un abonnement
                    actif pour completer cette etape.
                  </p>
                )}
            </div>
          )}

          {/* ─── Error display ─────────────────────────────── */}
          {error && (
            <div
              className="flex items-center gap-3 p-4 rounded-lg text-sm mt-4"
              style={{
                background: "rgba(239,68,68,0.1)",
                border: "1px solid rgba(239,68,68,0.2)",
              }}
            >
              <FontAwesomeIcon
                icon={faCircleExclamation}
                className="text-red-400 w-4 h-4"
              />
              <span className="text-red-400">{error}</span>
            </div>
          )}

          {/* ─── Navigation buttons ────────────────────────── */}
          <div className="flex items-center justify-between mt-6">
            <button
              onClick={goPrev}
              disabled={currentStepIndex === 0}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium text-gray-400 hover:text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <FontAwesomeIcon icon={faChevronLeft} className="w-3 h-3" />
              Precedent
            </button>

            <div className="flex items-center gap-3">
              {/* Save button (for steps 1-3 which have form data) */}
              {["informations", "contact", "presentation"].includes(
                currentStep
              ) && (
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="px-5 py-2.5 rounded-lg text-sm font-semibold transition-all border text-gray-300 hover:text-white hover:border-gray-500 disabled:opacity-50"
                  style={{ borderColor: "rgba(255,255,255,0.15)" }}
                >
                  {saving ? (
                    <>
                      <FontAwesomeIcon
                        icon={faSpinner}
                        className="animate-spin w-3.5 h-3.5 mr-1.5"
                      />
                      Sauvegarde...
                    </>
                  ) : saved ? (
                    <>
                      <FontAwesomeIcon
                        icon={faCheck}
                        className="w-3.5 h-3.5 mr-1.5"
                      />
                      Sauvegarde !
                    </>
                  ) : (
                    "Sauvegarder"
                  )}
                </button>
              )}

              {currentStepIndex < STEP_CONFIG.length - 1 ? (
                <button
                  onClick={
                    ["informations", "contact", "presentation"].includes(
                      currentStep
                    )
                      ? handleSaveAndNext
                      : goNext
                  }
                  disabled={saving}
                  className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-5 py-2.5 rounded-lg text-sm font-semibold transition-all"
                >
                  Suivant
                  <FontAwesomeIcon icon={faChevronRight} className="w-3 h-3" />
                </button>
              ) : (
                <button
                  onClick={() => router.push("/espace-centre/dashboard")}
                  className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-5 py-2.5 rounded-lg text-sm font-semibold transition-all"
                >
                  <FontAwesomeIcon icon={faCheck} className="w-3.5 h-3.5" />
                  Terminer
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom message */}
      <div className="text-center pb-4">
        <p className="text-gray-600 text-xs">
          Votre centre sera visible sur la marketplace quand votre profil
          atteindra 100%.
        </p>
        <Link
          href="/espace-centre/dashboard"
          className="text-xs text-gray-500 hover:text-blue-400 transition-colors mt-1 inline-block"
        >
          Passer pour le moment et completer plus tard
        </Link>
      </div>
    </div>
  );
}
