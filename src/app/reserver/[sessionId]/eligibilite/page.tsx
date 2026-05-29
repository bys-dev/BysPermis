"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCalendarDays, faLocationDot, faShieldHalved, faArrowRight, faArrowLeft,
  faCircleInfo, faClipboardCheck, faIdCard, faTriangleExclamation, faListCheck,
} from "@fortawesome/free-solid-svg-icons";

// ─── Les 4 cas réglementaires d'un stage de récupération de points ──
const CAS_STAGE = [
  {
    n: 1,
    titre: "Stage volontaire",
    desc: "Je m'inscris de ma propre initiative pour récupérer des points (jusqu'à 4 points, un seul stage par an).",
  },
  {
    n: 2,
    titre: "Permis probatoire (lettre 48N)",
    desc: "J'ai reçu une lettre 48N m'obligeant à faire un stage après une infraction ayant retiré au moins 3 points pendant ma période probatoire.",
  },
  {
    n: 3,
    titre: "Alternative aux poursuites / composition pénale",
    desc: "Le stage m'a été imposé par le procureur de la République dans le cadre d'une procédure judiciaire.",
  },
  {
    n: 4,
    titre: "Peine complémentaire (décision de justice)",
    desc: "Le stage m'a été ordonné par le tribunal comme peine complémentaire ou dans le cadre d'un sursis avec mise à l'épreuve.",
  },
];

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

function formatJour(iso: string): string {
  return new Date(iso).toLocaleDateString("fr-FR", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });
}

export default function EligibilitePage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params.sessionId as string;
  const [session, setSession] = useState<SessionData>(MOCK_SESSION);
  const [hasData, setHasData] = useState<boolean | null>(null);

  const [casStage, setCasStage] = useState<number | null>(null);
  const [pasStage12Mois, setPasStage12Mois] = useState(false);
  const [permisValide, setPermisValide] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Garde-fou : l'étape "données" doit avoir été complétée
    const stored = sessionStorage.getItem(`reserver_${sessionId}`);
    if (!stored) {
      router.replace(`/reserver/${sessionId}/donnees`);
      return;
    }
    setHasData(true);
    // Pré-cocher si déjà attesté (retour arrière)
    try {
      const parsed = JSON.parse(stored);
      if (parsed.attestationPasStage12Mois) setPasStage12Mois(true);
      if (parsed.attestationPermisValide) setPermisValide(true);
      if (parsed.casStage) setCasStage(parsed.casStage);
    } catch { /* ignore */ }

    fetch(`/api/sessions/${sessionId}`)
      .then((r) => r.json())
      .then((data) => { if (data?.id) setSession(data); })
      .catch(() => null);
  }, [sessionId, router]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!casStage) {
      setError("Veuillez indiquer le cas qui correspond à votre situation.");
      return;
    }
    if (!pasStage12Mois || !permisValide) {
      setError("Vous devez cocher les deux attestations pour continuer.");
      return;
    }
    setError(null);
    setLoading(true);
    const stored = sessionStorage.getItem(`reserver_${sessionId}`);
    const data = stored ? JSON.parse(stored) : {};
    sessionStorage.setItem(`reserver_${sessionId}`, JSON.stringify({
      ...data,
      casStage,
      attestationPasStage12Mois: true,
      attestationPermisValide: true,
    }));
    router.push(`/reserver/${sessionId}/paiement`);
  }

  if (hasData === null) return null;

  const s = session;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
      {/* ── Attestations ── */}
      <div className="lg:col-span-2">
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-7">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
              <FontAwesomeIcon icon={faClipboardCheck} className="text-blue-600" />
            </div>
            <h1 className="font-display font-bold text-xl text-gray-900">Conditions d&apos;éligibilité</h1>
          </div>
          <p className="text-gray-500 text-sm mb-6">
            Avant de finaliser votre inscription, vous devez confirmer que vous remplissez les conditions
            légales pour suivre un stage de récupération de points.
          </p>

          {/* Rappel réglementaire */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6 flex items-start gap-3">
            <FontAwesomeIcon icon={faCircleInfo} className="text-blue-600 mt-0.5 shrink-0" />
            <div className="text-sm text-blue-900 space-y-1.5">
              <p>
                <span className="font-semibold">Un seul stage par an :</span> il doit s&apos;écouler au moins
                <span className="font-semibold"> 1 an et 1 jour</span> entre deux stages volontaires
                (art. R. 223-8 du Code de la route). Votre stage débute le
                <span className="font-semibold"> {formatJour(s.dateDebut)}</span>.
              </p>
              <p>
                <span className="font-semibold">Permis valide :</span> vous pouvez suivre un stage tant que
                votre permis n&apos;est pas invalidé, même si votre solde de points est nul ou négatif —
                tant que vous n&apos;avez pas reçu la lettre 48SI.
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Sélection du cas (4 cas réglementaires) */}
            <div>
              <p className="flex items-center gap-2 text-sm font-semibold text-gray-900 mb-1">
                <FontAwesomeIcon icon={faListCheck} className="text-blue-500 text-xs" />
                Quel cas correspond à votre situation ? <span className="text-red-500">*</span>
              </p>
              <p className="text-xs text-gray-500 mb-3">Sélectionnez le motif de votre inscription au stage.</p>
              <div className="space-y-2.5">
                {CAS_STAGE.map((c) => (
                  <label
                    key={c.n}
                    className={`flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition-all ${casStage === c.n ? "border-blue-400 bg-blue-50/50 ring-1 ring-blue-400" : "border-gray-200 hover:border-gray-300"}`}
                  >
                    <input
                      type="radio"
                      name="casStage"
                      checked={casStage === c.n}
                      onChange={() => { setCasStage(c.n); setError(null); }}
                      className="mt-0.5 w-5 h-5 accent-blue-600 shrink-0"
                    />
                    <span className="text-sm text-gray-700 leading-relaxed">
                      <span className="font-semibold text-gray-900">Cas n° {c.n} — {c.titre}</span>
                      <br />
                      {c.desc}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            <div className="h-px bg-gray-100 my-5" />

            {/* Attestation 1 — pas de stage < 12 mois */}
            <label className={`flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition-all ${pasStage12Mois ? "border-blue-400 bg-blue-50/50 ring-1 ring-blue-400" : "border-gray-200 hover:border-gray-300"}`}>
              <input
                type="checkbox"
                checked={pasStage12Mois}
                onChange={(e) => { setPasStage12Mois(e.target.checked); setError(null); }}
                className="mt-0.5 w-5 h-5 accent-blue-600 shrink-0"
              />
              <span className="text-sm text-gray-700 leading-relaxed">
                <span className="flex items-center gap-2 font-semibold text-gray-900 mb-0.5">
                  <FontAwesomeIcon icon={faCalendarDays} className="text-blue-500 text-xs" />
                  Délai d&apos;un an respecté
                </span>
                J&apos;atteste sur l&apos;honneur <span className="font-semibold">ne pas avoir suivi de stage de
                récupération de points dans les 12 mois</span> précédant la date de début du stage
                ({formatJour(s.dateDebut)}).
              </span>
            </label>

            {/* Attestation 2 — permis valide */}
            <label className={`flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition-all ${permisValide ? "border-blue-400 bg-blue-50/50 ring-1 ring-blue-400" : "border-gray-200 hover:border-gray-300"}`}>
              <input
                type="checkbox"
                checked={permisValide}
                onChange={(e) => { setPermisValide(e.target.checked); setError(null); }}
                className="mt-0.5 w-5 h-5 accent-blue-600 shrink-0"
              />
              <span className="text-sm text-gray-700 leading-relaxed">
                <span className="flex items-center gap-2 font-semibold text-gray-900 mb-0.5">
                  <FontAwesomeIcon icon={faIdCard} className="text-blue-500 text-xs" />
                  Permis en cours de validité
                </span>
                J&apos;atteste sur l&apos;honneur que <span className="font-semibold">mon permis de conduire est
                en cours de validité</span> (non invalidé, non suspendu, non annulé), même si mon solde de
                points est nul ou négatif, et que je n&apos;ai pas reçu de lettre 48SI.
              </span>
            </label>

            {error && (
              <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm flex items-center gap-2">
                <FontAwesomeIcon icon={faTriangleExclamation} className="text-xs" />
                {error}
              </div>
            )}

            <p className="text-xs text-gray-400 flex items-start gap-1.5">
              <FontAwesomeIcon icon={faCircleInfo} className="text-[10px] mt-0.5" />
              Toute fausse déclaration peut entraîner l&apos;annulation du stage et la non-récupération des
              points, sans remboursement. Cette attestation est conservée comme justificatif d&apos;inscription.
            </p>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => router.push(`/reserver/${sessionId}/donnees`)}
                className="flex items-center gap-2 px-4 py-4 rounded-xl text-sm font-medium text-gray-500 hover:text-gray-700 border border-gray-200 transition-colors"
              >
                <FontAwesomeIcon icon={faArrowLeft} className="text-xs" />
                Retour
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white font-bold py-4 rounded-xl text-base transition-all shadow-lg shadow-red-600/20"
              >
                {loading ? "Chargement…" : <>Continuer vers le paiement <FontAwesomeIcon icon={faArrowRight} /></>}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* ── Récapitulatif ── */}
      <div className="space-y-4">
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
          <h2 className="font-display font-bold text-sm text-gray-900 mb-4 uppercase tracking-wider">Votre stage</h2>
          <div className="space-y-3">
            <div>
              <p className="font-semibold text-gray-900">{s.formation.titre}</p>
              <p className="text-gray-500 text-sm">{s.centre}</p>
            </div>
            <div className="h-px bg-gray-100" />
            {/* 2 jours détaillés */}
            <div className="space-y-2 text-sm">
              <div className="flex items-start gap-2">
                <FontAwesomeIcon icon={faCalendarDays} className="w-4 text-gray-400 mt-0.5" />
                <div className="text-gray-600">
                  <p><span className="font-medium text-gray-800">Jour 1 :</span> {formatJour(s.dateDebut)}</p>
                  <p><span className="font-medium text-gray-800">Jour 2 :</span> {formatJour(s.dateFin)}</p>
                  <p className="text-xs text-gray-400 mt-0.5">2 jours consécutifs — 14h</p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                <FontAwesomeIcon icon={faLocationDot} className="w-4 text-gray-400" />
                {s.ville}
              </div>
            </div>
            <div className="h-px bg-gray-100" />
            <div className="flex flex-wrap gap-1.5">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] bg-blue-50 text-blue-700 border border-blue-200 font-medium">
                <FontAwesomeIcon icon={faShieldHalved} className="text-[9px]" /> Agréé Préfecture
              </span>
            </div>
          </div>
        </div>

        <div className="bg-[#0A1628] rounded-2xl p-5 text-white">
          <div className="flex items-center justify-between">
            <span className="font-bold text-lg">Total TTC</span>
            <span className="font-bold text-2xl">{s.prix} €</span>
          </div>
          <p className="text-gray-500 text-xs mt-2">TVA incluse — paiement à l&apos;étape suivante</p>
        </div>
      </div>
    </div>
  );
}
