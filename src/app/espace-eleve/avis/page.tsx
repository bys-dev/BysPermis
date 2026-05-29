"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faSpinner, faClipboardList, faArrowRight } from "@fortawesome/free-solid-svg-icons"

type PendingItem = {
  reservationId: string
  formationTitre: string
  centre: { nom: string; ville: string }
  needsCentre: boolean
  needsPlatform: boolean
}

export default function AvisEnAttentePage() {
  const [items, setItems] = useState<PendingItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/questionnaires/pending")
      .then((r) => r.json())
      .then((data) => setItems(Array.isArray(data) ? data : []))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <FontAwesomeIcon icon={faSpinner} className="animate-spin text-2xl text-blue-400" />
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="font-display font-bold text-2xl text-white mb-2">Questionnaires satisfaction</h1>
      <p className="text-sm text-gray-400 mb-8">
        Après votre stage, partagez votre avis sur le centre (5 questions) puis sur la plateforme BYS Permis (5 questions).
        Notes de 1 à 5, demi-étoiles possibles.
      </p>

      {items.length === 0 ? (
        <div
          className="rounded-xl border p-8 text-center"
          style={{ background: "rgba(255,255,255,0.04)", borderColor: "rgba(255,255,255,0.08)" }}
        >
          <FontAwesomeIcon icon={faClipboardList} className="text-3xl text-gray-600 mb-3" />
          <p className="text-gray-400">Aucun questionnaire en attente pour le moment.</p>
          <Link href="/espace-eleve/mes-formations" className="text-blue-400 text-sm mt-3 inline-block hover:underline">
            Voir mes formations
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {items.map((item) => (
            <div
              key={item.reservationId}
              className="rounded-xl border p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
              style={{ background: "rgba(255,255,255,0.04)", borderColor: "rgba(255,255,255,0.08)" }}
            >
              <div>
                <p className="font-semibold text-white">{item.formationTitre}</p>
                <p className="text-sm text-gray-400">
                  {item.centre.nom} — {item.centre.ville}
                </p>
                <p className="text-xs text-yellow-400/90 mt-1">
                  {item.needsCentre && item.needsPlatform
                    ? "Centre + plateforme à compléter"
                    : item.needsCentre
                      ? "Questionnaire centre restant"
                      : "Questionnaire plateforme restant"}
                </p>
              </div>
              <Link
                href={`/espace-eleve/avis/${item.reservationId}`}
                className="inline-flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-lg text-sm font-semibold hover:bg-blue-700 shrink-0"
              >
                Répondre
                <FontAwesomeIcon icon={faArrowRight} className="w-3 h-3" />
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
