"use client"

import { useEffect, useState } from "react"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faSpinner, faLaptop } from "@fortawesome/free-solid-svg-icons"
import HalfStarRating from "@/components/reviews/HalfStarRating"
import { formatDate } from "@/lib/utils"

type ResponseItem = {
  id: string
  noteGlobale: number
  reponses: Array<{ libelle: string; note: number }>
  commentaire: string | null
  createdAt: string
  auteur: string
  email: string
  formation: string
  centre: string
}

export default function AdminAvisPlateformePage() {
  const [defaultQuestions, setDefaultQuestions] = useState<string[]>([])
  const [responses, setResponses] = useState<ResponseItem[]>([])
  const [averageRating, setAverageRating] = useState<number | null>(null)
  const [totalCount, setTotalCount] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/admin/questionnaires")
      .then((r) => r.json())
      .then((data) => {
        setDefaultQuestions(data.defaultQuestions ?? [])
        setResponses(data.responses ?? [])
        setAverageRating(data.averageRating ?? null)
        setTotalCount(data.totalCount ?? 0)
      })
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
    <div className="max-w-5xl mx-auto space-y-8">
      <div>
        <h1 className="font-display font-bold text-2xl text-white flex items-center gap-2">
          <FontAwesomeIcon icon={faLaptop} className="text-blue-400" />
          Avis plateforme BYS Permis
        </h1>
        <p className="text-sm text-gray-400 mt-1">
          Retours utilisateurs sur le site et le parcours de réservation (5 questions, notes 1 à 5).
        </p>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div className="rounded-xl border p-4" style={{ background: "rgba(255,255,255,0.04)", borderColor: "rgba(255,255,255,0.08)" }}>
          <p className="text-xs text-gray-500">Note moyenne plateforme</p>
          <p className="text-2xl font-bold text-white mt-1">{averageRating != null ? `${averageRating}/5` : "—"}</p>
        </div>
        <div className="rounded-xl border p-4" style={{ background: "rgba(255,255,255,0.04)", borderColor: "rgba(255,255,255,0.08)" }}>
          <p className="text-xs text-gray-500">Réponses totales</p>
          <p className="text-2xl font-bold text-white mt-1">{totalCount}</p>
        </div>
      </div>

      <section
        className="rounded-xl border p-6"
        style={{ background: "rgba(255,255,255,0.04)", borderColor: "rgba(255,255,255,0.08)" }}
      >
        <h2 className="font-semibold text-white mb-3">Questions plateforme (fixées)</h2>
        <ol className="list-decimal list-inside space-y-1 text-sm text-gray-400">
          {defaultQuestions.map((q, i) => (
            <li key={i}>{q}</li>
          ))}
        </ol>
      </section>

      <section className="space-y-4">
        <h2 className="font-semibold text-white">Derniers retours</h2>
        {responses.length === 0 ? (
          <p className="text-sm text-gray-500">Aucun retour plateforme pour le moment.</p>
        ) : (
          responses.map((r) => (
            <div
              key={r.id}
              className="rounded-xl border p-4"
              style={{ background: "rgba(255,255,255,0.03)", borderColor: "rgba(255,255,255,0.08)" }}
            >
              <div className="flex flex-wrap justify-between gap-2 mb-3">
                <div>
                  <p className="text-sm font-medium text-white">{r.auteur}</p>
                  <p className="text-xs text-gray-500">{r.email}</p>
                  <p className="text-xs text-gray-500">{r.formation} — {r.centre}</p>
                </div>
                <HalfStarRating value={r.noteGlobale} readonly size="sm" />
              </div>
              <div className="space-y-1">
                {r.reponses.map((item, idx) => (
                  <p key={idx} className="text-xs text-gray-400 flex justify-between gap-4">
                    <span>{item.libelle}</span>
                    <span className="text-yellow-400/90">{item.note.toFixed(1)}/5</span>
                  </p>
                ))}
              </div>
              {r.commentaire && (
                <p className="text-sm text-gray-300 italic mt-2 pt-2 border-t border-white/5">
                  « {r.commentaire} »
                </p>
              )}
              <p className="text-xs text-gray-600 mt-2">{formatDate(r.createdAt)}</p>
            </div>
          ))
        )}
      </section>
    </div>
  )
}
