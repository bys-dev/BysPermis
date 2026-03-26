"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCircleCheck, faEnvelope, faCalendarDays, faLocationDot,
  faDownload, faArrowRight, faPhone, faShieldHalved,
} from "@fortawesome/free-solid-svg-icons";

interface SessionData {
  id: string;
  dateDebut: string;
  dateFin: string;
  prix: number;
  formation: { titre: string; isQualiopi: boolean; isCPF: boolean; duree: string };
  centre: string;
  ville: string;
  adresse: string;
}

export default function ConfirmationPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const sessionId = params.sessionId as string;
  const reservationNum = searchParams.get("num") ?? `BYS-${new Date().getFullYear()}-????`;

  const [session, setSession] = useState<SessionData | null>(null);

  useEffect(() => {
    fetch(`/api/sessions/${sessionId}`)
      .then((r) => r.json())
      .then((data) => { if (data.id) setSession(data); })
      .catch(() => {});
  }, [sessionId]);

  const titre = session?.formation.titre ?? "Stage de récupération de points";
  const centre = session?.centre ?? "BYS Formation";
  const adresse = session?.adresse ?? "";
  const dateStr = session
    ? `${new Date(session.dateDebut).toLocaleDateString("fr-FR")} — ${new Date(session.dateFin).toLocaleDateString("fr-FR")}`
    : "—";
  const prix = session?.prix ?? 0;

  return (
    <div className="max-w-2xl mx-auto">
      {/* Succès */}
      <div className="text-center mb-8">
        <div className="w-24 h-24 rounded-full bg-green-100 border-4 border-green-200 flex items-center justify-center mx-auto mb-6">
          <FontAwesomeIcon icon={faCircleCheck} className="text-green-500 text-5xl" />
        </div>
        <h1 className="font-display font-bold text-3xl text-gray-900 mb-3">Réservation confirmée !</h1>
        <p className="text-gray-500 leading-relaxed">
          Félicitations, votre place est réservée. Un email de confirmation avec votre convocation vous a été envoyé.
        </p>
        <div className="inline-flex items-center gap-2 mt-4 px-4 py-2 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-sm font-semibold">
          Référence : <span className="font-mono">{reservationNum}</span>
        </div>
      </div>

      {/* Détails réservation */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-7 mb-5">
        <h2 className="font-display font-bold text-lg text-gray-900 mb-5">Détails de votre stage</h2>
        <div className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="flex items-start gap-3 p-4 rounded-xl bg-gray-50">
              <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center shrink-0">
                <FontAwesomeIcon icon={faCalendarDays} className="text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500 font-medium uppercase tracking-wider mb-0.5">Dates</p>
                <p className="font-semibold text-gray-900 text-sm">{dateStr}</p>
                <p className="text-gray-500 text-xs">9h – 17h</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-4 rounded-xl bg-gray-50">
              <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center shrink-0">
                <FontAwesomeIcon icon={faLocationDot} className="text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500 font-medium uppercase tracking-wider mb-0.5">Lieu</p>
                <p className="font-semibold text-gray-900 text-sm">{centre}</p>
                {adresse && <p className="text-gray-500 text-xs">{adresse}</p>}
              </div>
            </div>
          </div>

          <div className="flex items-start gap-3 p-4 rounded-xl bg-blue-50 border border-blue-100">
            <div className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center shrink-0">
              <FontAwesomeIcon icon={faShieldHalved} className="text-white" />
            </div>
            <div>
              <p className="font-semibold text-gray-900 text-sm">{titre}</p>
              <p className="text-gray-600 text-xs mt-0.5">
                Centre agréé Préfecture{session?.formation.isQualiopi ? " · Qualiopi" : ""}
              </p>
            </div>
            {prix > 0 && (
              <div className="ml-auto text-right shrink-0">
                <p className="font-bold text-gray-900">{prix} €</p>
                <p className="text-gray-500 text-xs">Payé</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Email confirmation */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-7 mb-5">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center shrink-0">
            <FontAwesomeIcon icon={faEnvelope} className="text-green-600 text-lg" />
          </div>
          <div className="flex-1">
            <h3 className="font-display font-semibold text-gray-900 mb-1">Vérifiez votre boîte email</h3>
            <p className="text-gray-500 text-sm leading-relaxed">
              Nous venons de vous envoyer votre <strong>convocation officielle</strong> ainsi qu&apos;un récapitulatif de votre réservation.
              Pensez à vérifier vos spams si vous ne le trouvez pas.
            </p>
            <Link
              href={`/api/convocation/${reservationNum}`}
              className="mt-3 inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 text-sm text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all font-medium"
            >
              <FontAwesomeIcon icon={faDownload} className="text-xs" />
              Télécharger la convocation (PDF)
            </Link>
          </div>
        </div>
      </div>

      {/* Informations pratiques */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-7 mb-6">
        <h3 className="font-display font-semibold text-gray-900 mb-4">À savoir avant le stage</h3>
        <div className="space-y-3 text-sm text-gray-600">
          {[
            { bullet: "📄", text: "Apportez votre permis de conduire original et une pièce d'identité" },
            { bullet: "🕗", text: "Présentez-vous 15 minutes avant le début du stage" },
            { bullet: "📵", text: "Téléphone éteint ou en mode silencieux pendant toute la durée" },
            { bullet: "🍽️", text: "Repas non fourni — prévoyez un déjeuner ou possibilité à proximité" },
            { bullet: "❌", text: "Annulation gratuite jusqu'à 48h avant le stage — contactez-nous" },
          ].map((item) => (
            <div key={item.text} className="flex items-start gap-3">
              <span className="shrink-0">{item.bullet}</span>
              <span>{item.text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Contact */}
      <div className="bg-[#0A1628] rounded-2xl p-6 mb-8 flex items-center justify-between gap-4">
        <div>
          <p className="text-white font-semibold mb-1">Une question ?</p>
          <p className="text-gray-400 text-sm">Notre équipe répond sous 24h ouvrées.</p>
        </div>
        <div className="flex gap-3 shrink-0">
          <a href="mailto:bysforma95@gmail.com" className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-white transition-colors" style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.15)" }}>
            <FontAwesomeIcon icon={faEnvelope} className="text-xs" />
            Email
          </a>
          <a href="tel:+33123456789" className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-white transition-colors" style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.15)" }}>
            <FontAwesomeIcon icon={faPhone} className="text-xs" />
            Appeler
          </a>
        </div>
      </div>

      {/* CTA */}
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <Link
          href="/espace-eleve/reservations"
          className="inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-xl transition-all"
        >
          Voir mes réservations
          <FontAwesomeIcon icon={faArrowRight} className="text-sm" />
        </Link>
        <Link
          href="/recherche"
          className="inline-flex items-center justify-center gap-2 border border-gray-200 text-gray-700 font-semibold px-6 py-3 rounded-xl hover:bg-gray-50 transition-all"
        >
          Retour à la recherche
        </Link>
      </div>
    </div>
  );
}
