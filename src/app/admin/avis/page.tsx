"use client"

import { useEffect, useState } from "react"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faLaptop, faSave, faPlus, faTrash, faSpinner } from "@fortawesome/free-solid-svg-icons"
import LoadingOverlay, { PageHeaderSkeleton } from "@/components/ui/LoadingOverlay"
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

type Question = { id: string; libelle: string; ordre: number }

export default function AdminAvisPlateformePage() {
  const [draft, setDraft] = useState<string[]>([])
  const [responses, setResponses] = useState<ResponseItem[]>([])
  const [averageRating, setAverageRating] = useState<number | null>(null)
  const [totalCount, setTotalCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  function load() {
    setLoading(true)
    fetch("/api/admin/questionnaires")
      .then((r) => r.json())
      .then((data) => {
        const qs: Question[] = data.questions ?? []
        setDraft(qs.length ? qs.map((q) => q.libelle) : (data.defaultQuestions ?? []))
        setResponses(data.responses ?? [])
        setAverageRating(data.averageRating ?? null)
        setTotalCount(data.totalCount ?? 0)
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
  }, [])

  async function saveQuestions() {
    const cleaned = draft.map((q) => q.trim()).filter(Boolean)
    if (cleaned.length < 1) {
      setMessage("Au moins une question est requise.")
      return
    }
    setSaving(true)
    setMessage(null)
    try {
      const res = await fetch("/api/admin/questionnaires", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questions: cleaned.map((libelle) => ({ libelle })) }),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error || "Erreur")
      }
      setMessage("Questions mises à jour.")
      load()
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Erreur")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="relative min-h-[50vh] max-w-5xl mx-auto">
      <div className={loading ? "opacity-40 pointer-events-none select-none" : ""}>
        {loading ? (
          <PageHeaderSkeleton />
        ) : (
          <div>
            <h1 className="font-display font-bold text-2xl text-white flex items-center gap-2">
              <FontAwesomeIcon icon={faLaptop} className="text-blue-400" />
              Avis plateforme BYS Permis
            </h1>
            <p className="text-sm text-gray-400 mt-1">
              Retours utilisateurs sur le site et le parcours de réservation (5 questions, notes 1 à 5).
            </p>
          </div>
        )}

        <div className="space-y-8 mt-8">
          {loading ? (
            <div className="grid sm:grid-cols-2 gap-4 animate-pulse">
              <div className="h-20 rounded-xl bg-white/5 border border-white/5" />
              <div className="h-20 rounded-xl bg-white/5 border border-white/5" />
            </div>
          ) : (
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
          )}

          {loading ? (
            <div className="rounded-xl border p-6 animate-pulse h-40 bg-white/5 border-white/5" />
          ) : (
            <section
              className="rounded-xl border p-6 space-y-3"
              style={{ background: "rgba(255,255,255,0.04)", borderColor: "rgba(255,255,255,0.08)" }}
            >
              <div className="flex items-center justify-between">
                <h2 className="font-semibold text-white">Questions plateforme</h2>
                <span className="text-xs text-gray-500">{draft.length}/10</span>
              </div>
              <p className="text-xs text-gray-500">
                Ces questions sont envoyées aux stagiaires après leur formation. Notes de 1 à 5.
              </p>
              {draft.map((libelle, i) => (
                <div key={i} className="flex items-start gap-2">
                  <span className="text-xs text-gray-500 mt-2.5 w-5 shrink-0">{i + 1}.</span>
                  <input
                    value={libelle}
                    onChange={(e) => {
                      const next = [...draft]
                      next[i] = e.target.value
                      setDraft(next)
                    }}
                    maxLength={300}
                    className="flex-1 px-3 py-2 rounded-lg text-sm text-white border focus:outline-none focus:border-blue-500"
                    style={{ background: "rgba(255,255,255,0.06)", borderColor: "rgba(255,255,255,0.1)" }}
                  />
                  <button
                    type="button"
                    onClick={() => setDraft(draft.filter((_, idx) => idx !== i))}
                    disabled={draft.length <= 1}
                    title="Supprimer"
                    className="mt-1 p-2 text-gray-500 hover:text-red-400 disabled:opacity-30 disabled:hover:text-gray-500"
                  >
                    <FontAwesomeIcon icon={faTrash} className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
              <div className="flex items-center gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setDraft([...draft, ""])}
                  disabled={draft.length >= 10}
                  className="inline-flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300 disabled:opacity-40"
                >
                  <FontAwesomeIcon icon={faPlus} className="w-3 h-3" />
                  Ajouter une question
                </button>
                <button
                  type="button"
                  onClick={saveQuestions}
                  disabled={saving}
                  className="ml-auto inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700 disabled:opacity-50"
                >
                  <FontAwesomeIcon icon={saving ? faSpinner : faSave} className={saving ? "animate-spin" : ""} />
                  Enregistrer
                </button>
              </div>
              {message && <p className="text-xs text-blue-300">{message}</p>}
            </section>
          )}

          <section className="space-y-4">
            {!loading && <h2 className="font-semibold text-white">Derniers retours</h2>}
            {loading ? (
              <div className="space-y-4 animate-pulse">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="h-28 rounded-xl bg-white/5 border border-white/5" />
                ))}
              </div>
            ) : responses.length === 0 ? (
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
      </div>
      <LoadingOverlay show={loading} label="Chargement des avis plateforme..." />
    </div>
  )
}
