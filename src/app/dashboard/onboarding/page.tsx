"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faUser,
  faMapMarkerAlt,
  faIdCard,
  faBell,
  faSpinner,
  faCheck,
  faChevronLeft,
  faChevronRight,
  faTriangleExclamation,
  faArrowRightFromBracket,
} from "@fortawesome/free-solid-svg-icons";

const STEPS = [
  { label: "Informations", icon: faUser },
  { label: "Adresse", icon: faMapMarkerAlt },
  { label: "Permis", icon: faIdCard },
  { label: "Preferences", icon: faBell },
];

interface FormData {
  prenom: string;
  nom: string;
  telephone: string;
  dateNaissance: string;
  adresse: string;
  codePostal: string;
  ville: string;
  numeroPermis: string;
  dateObtentionPermis: string;
  categoriesPermis: string[];
  newsletterOptIn: boolean;
  notificationsEmail: boolean;
}

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<FormData>({
    prenom: "",
    nom: "",
    telephone: "",
    dateNaissance: "",
    adresse: "",
    codePostal: "",
    ville: "",
    numeroPermis: "",
    dateObtentionPermis: "",
    categoriesPermis: [],
    newsletterOptIn: true,
    notificationsEmail: true,
  });

  // Load existing profile data
  useEffect(() => {
    fetch("/api/users/me")
      .then((r) => r.json())
      .then((data) => {
        if (data && !data.error) {
          setForm((prev) => ({
            ...prev,
            prenom: data.prenom ?? "",
            nom: data.nom ?? "",
            telephone: data.telephone ?? "",
            dateNaissance: data.dateNaissance ? (() => { const d = data.dateNaissance.slice(0, 10); const [y, m, dd] = d.split("-"); return dd && m && y ? `${dd}/${m}/${y}` : ""; })() : "",
            adresse: data.adresse ?? "",
            codePostal: data.codePostal ?? "",
            ville: data.ville ?? "",
            numeroPermis: data.numeroPermis ?? "",
            dateObtentionPermis: data.dateObtentionPermis ? (() => { const d = data.dateObtentionPermis.slice(0, 10); const [y, m, dd] = d.split("-"); return dd && m && y ? `${dd}/${m}/${y}` : ""; })() : "",
            categoriesPermis: data.categoriesPermis ?? [],
            newsletterOptIn: data.newsletterOptIn ?? true,
          }));
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  function updateField(field: keyof FormData, value: string | boolean | string[]) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function toggleCategory(cat: string) {
    setForm((prev) => {
      const cats = prev.categoriesPermis.includes(cat)
        ? prev.categoriesPermis.filter((c) => c !== cat)
        : [...prev.categoriesPermis, cat];
      return { ...prev, categoriesPermis: cats };
    });
  }

  // Convert jj/mm/aaaa → yyyy-mm-dd ISO for API
  function frDateToISO(fr: string): string | undefined {
    if (!fr || fr.length !== 10) return undefined;
    const [d, m, y] = fr.split("/");
    if (!d || !m || !y || y.length !== 4) return undefined;
    return `${y}-${m}-${d}`;
  }

  // Convert yyyy-mm-dd ISO → jj/mm/aaaa for display
  function isoToFrDate(iso: string): string {
    if (!iso) return "";
    const d = iso.slice(0, 10); // "2026-04-09"
    const [y, m, dd] = d.split("-");
    if (!y || !m || !dd) return "";
    return `${dd}/${m}/${y}`;
  }

  async function saveStep() {
    setSaving(true);
    setError(null);

    // Build payload depending on current step
    let payload: Record<string, unknown> = {};
    if (step === 0) {
      payload = {
        prenom: form.prenom,
        nom: form.nom,
        telephone: form.telephone,
        dateNaissance: frDateToISO(form.dateNaissance),
      };
    } else if (step === 1) {
      payload = {
        adresse: form.adresse,
        codePostal: form.codePostal,
        ville: form.ville,
      };
    } else if (step === 2) {
      payload = {
        numeroPermis: form.numeroPermis || undefined,
        dateObtentionPermis: frDateToISO(form.dateObtentionPermis),
        categoriesPermis: form.categoriesPermis,
      };
    } else if (step === 3) {
      payload = {
        newsletterOptIn: form.newsletterOptIn,
      };
    }

    try {
      const res = await fetch("/api/users/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setError(data?.error ? JSON.stringify(data.error) : "Erreur lors de la sauvegarde.");
        setSaving(false);
        return false;
      }

      setSaving(false);
      return true;
    } catch {
      setError("Erreur de connexion.");
      setSaving(false);
      return false;
    }
  }

  async function handleNext() {
    const ok = await saveStep();
    if (!ok) return;

    if (step < STEPS.length - 1) {
      setStep(step + 1);
    } else {
      // Final step — redirect to dashboard (profile completeness is checked server-side)
      router.push("/dashboard");
    }
  }

  function handlePrev() {
    if (step > 0) setStep(step - 1);
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#0A1628" }}>
        <div className="flex items-center gap-3 text-gray-500">
          <FontAwesomeIcon icon={faSpinner} className="animate-spin" />
          <span className="text-sm">Chargement...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12" style={{ background: "#0A1628" }}>
      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center mx-auto mb-4">
            <span className="font-bold text-lg text-white">BYS</span>
          </div>
          <h1 className="text-2xl font-bold text-white">Completez votre profil</h1>
          <p className="text-gray-400 text-sm mt-1">
            Etape {step + 1} sur {STEPS.length} — {STEPS[step].label}
          </p>
        </div>

        {/* Progress bar */}
        <div className="flex items-center gap-2 mb-8">
          {STEPS.map((s, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-1.5">
              <div
                className={`w-full h-1.5 rounded-full transition-colors ${
                  i <= step ? "bg-blue-600" : "bg-white/10"
                }`}
              />
              <div className="flex items-center gap-1">
                <FontAwesomeIcon
                  icon={i < step ? faCheck : s.icon}
                  className={`text-[10px] ${
                    i <= step ? "text-blue-400" : "text-gray-600"
                  }`}
                />
                <span
                  className={`text-[10px] font-medium ${
                    i <= step ? "text-blue-400" : "text-gray-600"
                  }`}
                >
                  {s.label}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Error */}
        {error && (
          <div className="p-3 rounded-lg text-sm flex items-center gap-2 mb-4 bg-red-400/10 border border-red-500/20 text-red-400">
            <FontAwesomeIcon icon={faTriangleExclamation} className="text-xs" />
            {error}
          </div>
        )}

        {/* Form card */}
        <div className="rounded-xl border p-6" style={{ background: "#0D1D3A", borderColor: "rgba(255,255,255,0.07)" }}>
          {/* Step 1 — Informations personnelles */}
          {step === 0 && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-gray-400 text-xs font-medium mb-1.5 block">Prenom *</label>
                  <input
                    type="text"
                    value={form.prenom}
                    onChange={(e) => updateField("prenom", e.target.value)}
                    className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500/50"
                    placeholder="Jean"
                  />
                </div>
                <div>
                  <label className="text-gray-400 text-xs font-medium mb-1.5 block">Nom *</label>
                  <input
                    type="text"
                    value={form.nom}
                    onChange={(e) => updateField("nom", e.target.value)}
                    className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500/50"
                    placeholder="Dupont"
                  />
                </div>
              </div>
              <div>
                <label className="text-gray-400 text-xs font-medium mb-1.5 block">Telephone *</label>
                <input
                  type="tel"
                  value={form.telephone}
                  onChange={(e) => updateField("telephone", e.target.value)}
                  className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500/50"
                  placeholder="06 12 34 56 78"
                />
              </div>
              <div>
                <label className="text-gray-400 text-xs font-medium mb-1.5 block">Date de naissance</label>
                <input
                  type="text"
                  value={form.dateNaissance}
                  onChange={(e) => {
                    let v = e.target.value.replace(/[^\d]/g, "");
                    if (v.length > 8) v = v.slice(0, 8);
                    if (v.length >= 5) v = v.slice(0, 2) + "/" + v.slice(2, 4) + "/" + v.slice(4);
                    else if (v.length >= 3) v = v.slice(0, 2) + "/" + v.slice(2);
                    updateField("dateNaissance", v);
                  }}
                  placeholder="jj/mm/aaaa"
                  maxLength={10}
                  className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500/50"
                />
              </div>
            </div>
          )}

          {/* Step 2 — Adresse */}
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <label className="text-gray-400 text-xs font-medium mb-1.5 block">Adresse</label>
                <input
                  type="text"
                  value={form.adresse}
                  onChange={(e) => updateField("adresse", e.target.value)}
                  className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500/50"
                  placeholder="12 rue de la Paix"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-gray-400 text-xs font-medium mb-1.5 block">Code postal</label>
                  <input
                    type="text"
                    value={form.codePostal}
                    onChange={(e) => updateField("codePostal", e.target.value)}
                    className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500/50"
                    placeholder="75001"
                  />
                </div>
                <div>
                  <label className="text-gray-400 text-xs font-medium mb-1.5 block">Ville *</label>
                  <input
                    type="text"
                    value={form.ville}
                    onChange={(e) => updateField("ville", e.target.value)}
                    className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500/50"
                    placeholder="Paris"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 3 — Permis de conduire (optionnel) */}
          {step === 2 && (
            <div className="space-y-4">
              <p className="text-gray-500 text-xs mb-2">
                Ces informations sont optionnelles et peuvent etre ajoutees plus tard.
              </p>
              <div>
                <label className="text-gray-400 text-xs font-medium mb-1.5 block">Numero de permis</label>
                <input
                  type="text"
                  value={form.numeroPermis}
                  onChange={(e) => updateField("numeroPermis", e.target.value)}
                  className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500/50"
                  placeholder="12AB34567"
                />
              </div>
              <div>
                <label className="text-gray-400 text-xs font-medium mb-1.5 block">Date d&apos;obtention</label>
                <input
                  type="text"
                  value={form.dateObtentionPermis}
                  onChange={(e) => {
                    let v = e.target.value.replace(/[^\d]/g, "");
                    if (v.length > 8) v = v.slice(0, 8);
                    if (v.length >= 5) v = v.slice(0, 2) + "/" + v.slice(2, 4) + "/" + v.slice(4);
                    else if (v.length >= 3) v = v.slice(0, 2) + "/" + v.slice(2);
                    updateField("dateObtentionPermis", v);
                  }}
                  placeholder="jj/mm/aaaa"
                  maxLength={10}
                  className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500/50"
                />
              </div>
              <div>
                <label className="text-gray-400 text-xs font-medium mb-1.5 block">Categories</label>
                <div className="flex flex-wrap gap-2">
                  {["A", "A1", "A2", "B", "B1", "C", "C1", "D", "D1", "BE", "CE"].map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => toggleCategory(cat)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                        form.categoriesPermis.includes(cat)
                          ? "bg-blue-600/20 border-blue-500/30 text-blue-400"
                          : "bg-white/5 border-white/10 text-gray-400 hover:text-white hover:border-white/20"
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 4 — Preferences */}
          {step === 3 && (
            <div className="space-y-5">
              <div className="flex items-center justify-between p-4 rounded-lg bg-white/5 border border-white/10">
                <div>
                  <p className="text-white text-sm font-medium">Notifications email</p>
                  <p className="text-gray-500 text-xs mt-0.5">
                    Recevoir des emails pour vos reservations et rappels
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => updateField("notificationsEmail", !form.notificationsEmail)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    form.notificationsEmail ? "bg-blue-600" : "bg-white/10"
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      form.notificationsEmail ? "translate-x-6" : "translate-x-1"
                    }`}
                  />
                </button>
              </div>

              <div className="flex items-center justify-between p-4 rounded-lg bg-white/5 border border-white/10">
                <div>
                  <p className="text-white text-sm font-medium">Newsletter</p>
                  <p className="text-gray-500 text-xs mt-0.5">
                    Recevoir nos offres et actualites par email
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => updateField("newsletterOptIn", !form.newsletterOptIn)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    form.newsletterOptIn ? "bg-blue-600" : "bg-white/10"
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      form.newsletterOptIn ? "translate-x-6" : "translate-x-1"
                    }`}
                  />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Navigation buttons */}
        <div className="flex items-center justify-between mt-6">
          <div>
            {step > 0 && (
              <button
                onClick={handlePrev}
                className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium text-gray-400 hover:text-white transition-colors"
              >
                <FontAwesomeIcon icon={faChevronLeft} className="text-xs" />
                Precedent
              </button>
            )}
          </div>
          <button
            onClick={handleNext}
            disabled={saving}
            className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white font-semibold text-sm transition-colors"
          >
            {saving ? (
              <FontAwesomeIcon icon={faSpinner} className="animate-spin text-xs" />
            ) : step === STEPS.length - 1 ? (
              <>
                <FontAwesomeIcon icon={faCheck} className="text-xs" />
                Terminer
              </>
            ) : (
              <>
                Suivant
                <FontAwesomeIcon icon={faChevronRight} className="text-xs" />
              </>
            )}
          </button>
        </div>

        {/* Logout link */}
        <div className="text-center mt-8 pt-6 border-t" style={{ borderColor: "rgba(255,255,255,0.07)" }}>
          <a
            href="/auth/logout"
            className="inline-flex items-center gap-2 text-gray-500 hover:text-red-400 text-sm transition-colors"
          >
            <FontAwesomeIcon icon={faArrowRightFromBracket} className="text-xs" />
            Se deconnecter
          </a>
        </div>
      </div>
    </div>
  );
}
