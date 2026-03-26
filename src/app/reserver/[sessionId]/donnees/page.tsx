"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faUser, faEnvelope, faPhone, faLocationDot, faIdCard,
  faCalendarDays, faUsers, faEuroSign, faShieldHalved,
  faAward, faArrowRight, faCircleInfo,
} from "@fortawesome/free-solid-svg-icons";

// ─── Types ────────────────────────────────────────────────
interface SessionData {
  id: string;
  dateDebut: string;
  dateFin: string;
  placesRestantes: number;
  prix: number;
  formation: { titre: string; duree: string; isQualiopi: boolean };
  centre: string;
  ville: string;
  adresse: string;
}

const MOCK_SESSION: SessionData = {
  id: "mock", dateDebut: "2026-03-21T09:00:00", dateFin: "2026-03-22T17:30:00",
  placesRestantes: 4, prix: 199,
  formation: { titre: "Stage de récupération de points", duree: "2 jours (14h)", isQualiopi: true },
  centre: "BYS Formation — Osny", ville: "Osny (95)", adresse: "Bât. 7, 9 Chaussée Jules César, 95520 Osny",
};

const inputClass = "w-full px-4 py-3 rounded-xl text-sm text-gray-800 bg-white border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all placeholder-gray-400";

export default function DonneesPage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params.sessionId as string;
  const [session, setSession] = useState<SessionData>(MOCK_SESSION);

  useEffect(() => {
    fetch(`/api/sessions/${sessionId}`)
      .then((r) => r.json())
      .then((data) => { if (data?.id) setSession(data); })
      .catch(() => null);
  }, [sessionId]);

  const [form, setForm] = useState({
    civilite: "M.",
    prenom: "",
    nom: "",
    email: "",
    emailConfirm: "",
    telephone: "",
    dateNaissance: "",
    adresse: "",
    codePostal: "",
    ville: "",
    numeroPermis: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  function update(field: string, value: string) {
    setForm((p) => ({ ...p, [field]: value }));
    if (errors[field]) setErrors((p) => { const n = { ...p }; delete n[field]; return n; });
  }

  function validate() {
    const e: Record<string, string> = {};
    if (!form.prenom.trim()) e.prenom = "Requis";
    if (!form.nom.trim()) e.nom = "Requis";
    if (!form.email.trim()) e.email = "Requis";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = "Email invalide";
    if (form.email !== form.emailConfirm) e.emailConfirm = "Les emails ne correspondent pas";
    if (!form.telephone.trim()) e.telephone = "Requis";
    if (!form.dateNaissance) e.dateNaissance = "Requise";
    if (!form.adresse.trim()) e.adresse = "Requise";
    if (!form.codePostal.trim()) e.codePostal = "Requis";
    if (!form.ville.trim()) e.ville = "Requise";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    // Stocker les données dans sessionStorage pour les récupérer à l'étape paiement
    sessionStorage.setItem(`reserver_${sessionId}`, JSON.stringify(form));
    // Simuler un court délai
    await new Promise((r) => setTimeout(r, 600));
    router.push(`/reserver/${sessionId}/paiement`);
  }

  const s = session;

  return (
    <div className="grid lg:grid-cols-3 gap-8">
      {/* ── Formulaire ── */}
      <div className="lg:col-span-2">
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-7">
          <h1 className="font-display font-bold text-xl text-gray-900 mb-1">Vos informations</h1>
          <p className="text-gray-500 text-sm mb-7">Ces informations figureront sur votre convocation officielle.</p>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Civilité */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Civilité</label>
              <div className="flex gap-3">
                {["M.", "Mme"].map((c) => (
                  <label key={c} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="civilite"
                      value={c}
                      checked={form.civilite === c}
                      onChange={() => update("civilite", c)}
                      className="accent-blue-600"
                    />
                    <span className="text-sm text-gray-700">{c}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Prénom / Nom */}
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Prénom <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <FontAwesomeIcon icon={faUser} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
                  <input type="text" value={form.prenom} onChange={(e) => update("prenom", e.target.value)} placeholder="Jean" className={`${inputClass} pl-10 ${errors.prenom ? "border-red-400 ring-1 ring-red-400" : ""}`} autoComplete="given-name" />
                </div>
                {errors.prenom && <p className="text-red-500 text-xs mt-1">{errors.prenom}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Nom <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <FontAwesomeIcon icon={faUser} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
                  <input type="text" value={form.nom} onChange={(e) => update("nom", e.target.value)} placeholder="Dupont" className={`${inputClass} pl-10 ${errors.nom ? "border-red-400 ring-1 ring-red-400" : ""}`} autoComplete="family-name" />
                </div>
                {errors.nom && <p className="text-red-500 text-xs mt-1">{errors.nom}</p>}
              </div>
            </div>

            {/* Date de naissance */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Date de naissance <span className="text-red-500">*</span>
              </label>
              <input type="date" value={form.dateNaissance} onChange={(e) => update("dateNaissance", e.target.value)} className={`${inputClass} ${errors.dateNaissance ? "border-red-400 ring-1 ring-red-400" : ""}`} autoComplete="bday" />
              {errors.dateNaissance && <p className="text-red-500 text-xs mt-1">{errors.dateNaissance}</p>}
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Adresse email <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <FontAwesomeIcon icon={faEnvelope} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
                <input type="email" value={form.email} onChange={(e) => update("email", e.target.value)} placeholder="vous@exemple.fr" className={`${inputClass} pl-10 ${errors.email ? "border-red-400 ring-1 ring-red-400" : ""}`} autoComplete="email" />
              </div>
              {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
            </div>

            {/* Confirmation email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Confirmer l&apos;email <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <FontAwesomeIcon icon={faEnvelope} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
                <input type="email" value={form.emailConfirm} onChange={(e) => update("emailConfirm", e.target.value)} placeholder="vous@exemple.fr" className={`${inputClass} pl-10 ${errors.emailConfirm ? "border-red-400 ring-1 ring-red-400" : ""}`} autoComplete="off" />
              </div>
              {errors.emailConfirm && <p className="text-red-500 text-xs mt-1">{errors.emailConfirm}</p>}
            </div>

            {/* Téléphone */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Téléphone <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <FontAwesomeIcon icon={faPhone} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
                <input type="tel" value={form.telephone} onChange={(e) => update("telephone", e.target.value)} placeholder="06 12 34 56 78" className={`${inputClass} pl-10 ${errors.telephone ? "border-red-400 ring-1 ring-red-400" : ""}`} autoComplete="tel" />
              </div>
              {errors.telephone && <p className="text-red-500 text-xs mt-1">{errors.telephone}</p>}
            </div>

            {/* Adresse */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Adresse <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <FontAwesomeIcon icon={faLocationDot} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
                <input type="text" value={form.adresse} onChange={(e) => update("adresse", e.target.value)} placeholder="12 rue de la Formation" className={`${inputClass} pl-10 ${errors.adresse ? "border-red-400 ring-1 ring-red-400" : ""}`} autoComplete="street-address" />
              </div>
              {errors.adresse && <p className="text-red-500 text-xs mt-1">{errors.adresse}</p>}
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Code postal <span className="text-red-500">*</span>
                </label>
                <input type="text" value={form.codePostal} onChange={(e) => update("codePostal", e.target.value)} placeholder="95000" inputMode="numeric" maxLength={5} className={`${inputClass} ${errors.codePostal ? "border-red-400 ring-1 ring-red-400" : ""}`} autoComplete="postal-code" />
                {errors.codePostal && <p className="text-red-500 text-xs mt-1">{errors.codePostal}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Ville <span className="text-red-500">*</span>
                </label>
                <input type="text" value={form.ville} onChange={(e) => update("ville", e.target.value)} placeholder="Cergy" className={`${inputClass} ${errors.ville ? "border-red-400 ring-1 ring-red-400" : ""}`} autoComplete="address-level2" />
                {errors.ville && <p className="text-red-500 text-xs mt-1">{errors.ville}</p>}
              </div>
            </div>

            {/* N° de permis (optionnel) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Numéro de permis <span className="text-gray-400 font-normal">(optionnel)</span>
              </label>
              <div className="relative">
                <FontAwesomeIcon icon={faIdCard} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
                <input type="text" value={form.numeroPermis} onChange={(e) => update("numeroPermis", e.target.value)} placeholder="12AB34567" className={`${inputClass} pl-10`} />
              </div>
              <p className="text-gray-400 text-xs mt-1 flex items-center gap-1">
                <FontAwesomeIcon icon={faCircleInfo} className="text-[10px]" />
                Visible sur votre permis de conduire — facilite l&apos;inscription au stage
              </p>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white font-bold py-4 rounded-xl text-base transition-all shadow-lg shadow-red-600/20"
              >
                {loading ? "Enregistrement…" : <>Continuer vers le paiement <FontAwesomeIcon icon={faArrowRight} /></>}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* ── Récapitulatif ── */}
      <div className="space-y-4">
        {/* Résumé session */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
          <h2 className="font-display font-bold text-sm text-gray-900 mb-4 uppercase tracking-wider">Votre stage</h2>
          <div className="space-y-3">
            <div>
              <p className="font-semibold text-gray-900">{s.formation.titre}</p>
              <p className="text-gray-500 text-sm">{s.centre}</p>
            </div>
            <div className="h-px bg-gray-100" />
            <div className="space-y-2 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <FontAwesomeIcon icon={faCalendarDays} className="w-4 text-gray-400" />
                {new Date(s.dateDebut).toLocaleDateString("fr-FR")} — {new Date(s.dateFin).toLocaleDateString("fr-FR")}
              </div>
              <div className="flex items-center gap-2">
                <FontAwesomeIcon icon={faLocationDot} className="w-4 text-gray-400" />
                {s.ville}
              </div>
              <div className="flex items-center gap-2">
                <FontAwesomeIcon icon={faUsers} className="w-4 text-gray-400" />
                <span className={s.placesRestantes <= 3 ? "text-red-600 font-semibold" : ""}>
                  {s.placesRestantes} place{s.placesRestantes > 1 ? "s" : ""} restante{s.placesRestantes > 1 ? "s" : ""}
                </span>
              </div>
            </div>
            <div className="h-px bg-gray-100" />
            {/* Badges */}
            <div className="flex flex-wrap gap-1.5">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] bg-blue-50 text-blue-700 border border-blue-200 font-medium">
                <FontAwesomeIcon icon={faShieldHalved} className="text-[9px]" /> Agréé Préfecture
              </span>
              {s.formation.isQualiopi && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] bg-purple-50 text-purple-700 border border-purple-200 font-medium">
                  <FontAwesomeIcon icon={faAward} className="text-[9px]" /> Qualiopi
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Total */}
        <div className="bg-[#0A1628] rounded-2xl p-5 text-white">
          <div className="flex items-center justify-between mb-3">
            <span className="text-gray-400 text-sm">Montant du stage</span>
            <span className="font-semibold">{s.prix} €</span>
          </div>
          <div className="flex items-center justify-between mb-4 pb-4 border-b border-white/10">
            <span className="text-gray-400 text-sm">Frais de dossier</span>
            <span className="text-green-400 text-sm font-medium">Inclus</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="font-bold text-lg">Total TTC</span>
            <span className="font-bold text-2xl">{s.prix} €</span>
          </div>
          <p className="text-gray-500 text-xs mt-2 flex items-center gap-1">
            <FontAwesomeIcon icon={faEuroSign} className="text-[10px]" />
            TVA incluse — Facturation possible
          </p>
        </div>

        {/* Garanties */}
        <div className="bg-gray-50 rounded-2xl border border-gray-200 p-4 text-sm text-gray-600 space-y-2">
          <p className="font-semibold text-gray-700 text-xs uppercase tracking-wider mb-3">Garanties</p>
          {[
            "Convocation reçue par email immédiatement",
            "Remboursement intégral si annulation 48h avant",
            "Centre 100% agréé par la Préfecture",
          ].map((g) => (
            <div key={g} className="flex items-start gap-2">
              <div className="w-4 h-4 rounded-full bg-green-100 flex items-center justify-center shrink-0 mt-0.5">
                <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
              </div>
              <span className="text-xs">{g}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
