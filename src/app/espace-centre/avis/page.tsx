"use client"

import { useEffect, useState } from "react"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faSave, faStar, faSpinner, faPlus, faTrash } from "@fortawesome/free-solid-svg-icons"
import LoadingOverlay, { PageHeaderSkeleton } from "@/components/ui/LoadingOverlay"
import HalfStarRating from "@/components/reviews/HalfStarRating"
import { formatDate } from "@/lib/utils"

type Question = { id: string; libelle: string; ordre: number }

type ResponseItem = {
  id: string
  noteGlobale: number
  reponses: Array<{ libelle: string; note: number }>
  commentaire: string | null
  createdAt: string
  auteur: string
  formation: string | null
}

export default function CentreAvisPage() {
  const [questions, setQuestions] = useState<Question[]>([])
  const [draft, setDraft] = useState<string[]>([])
  const [responses, setResponses] = useState<ResponseItem[]>([])
  const [averageRating, setAverageRating] = useState<number | null>(null)
  const [totalCount, setTotalCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  function load() {
    setLoading(true)
    fetch("/api/centre/questionnaires")
      .then((r) => r.json())
      .then((data) => {
        setQuestions(data.questions ?? [])
        setDraft((data.questions ?? []).map((q: Question) => q.libelle))
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
      const res = await fetch("/api/centre/questionnaires", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          questions: cleaned.map((libelle) => ({ libelle })),
        }),
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
    <div className="relative min-h-[50vh] max-w-4xl mx-auto">
      <div className={loading ? "opacity-40 pointer-events-none select-none" : ""}>
      {loading ? (
        <PageHeaderSkeleton />
      ) : (
      <div className="mb-8">
        <h1 className="font-display font-bold text-2xl text-gray-900">Avis & questionnaires</h1>
        <p className="text-sm text-gray-500 mt-1">
          Personnalisez les questions envoyées à vos stagiaires après chaque formation (1 à 10).
        </p>
      </div>
      )}

      {!loading && (
    <div className="space-y-8">

      <div className="grid sm:grid-cols-2 gap-4">
        <StatCard label="Note moyenne centre" value={averageRating != null ? `${averageRating}/5` : "—"} />
        <StatCard label="Réponses reçues" value={String(totalCount)} />
      </div>

      <section
        className="rounded-xl border p-6 space-y-4 bg-white"
        style={{ borderColor: "#E5E7EB" }}
      >
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-gray-900">Vos questions (centre)</h2>
          <span className="text-xs text-gray-500">{draft.length}/10</span>
        </div>
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
              className="flex-1 px-3 py-2 rounded-lg text-sm text-gray-900 border border-gray-200 bg-gray-50 focus:outline-none focus:border-blue-500 focus:bg-white"
            />
            <button
              type="button"
              onClick={() => setDraft(draft.filter((_, idx) => idx !== i))}
              disabled={draft.length <= 1}
              title="Supprimer"
              className="mt-1 p-2 text-gray-400 hover:text-red-500 disabled:opacity-30 disabled:hover:text-gray-400"
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
            className="inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 disabled:opacity-40"
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
            Enregistrer les questions
          </button>
        </div>
        {message && <p className="text-xs text-blue-600">{message}</p>}
      </section>

      <section>
        <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <FontAwesomeIcon icon={faStar} className="text-yellow-500" />
          Derniers avis reçus
        </h2>
        {responses.length === 0 ? (
          <p className="text-sm text-gray-500">Aucun avis pour le moment.</p>
        ) : (
          <div className="space-y-4">
            {responses.map((r) => (
              <div
                key={r.id}
                className="rounded-xl border p-4 bg-white"
                style={{ borderColor: "#E5E7EB" }}
              >
                <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{r.auteur}</p>
                    <p className="text-xs text-gray-500">{r.formation} — {formatDate(r.createdAt)}</p>
                  </div>
                  <HalfStarRating value={r.noteGlobale} readonly size="sm" />
                </div>
                <div className="space-y-1 mb-2">
                  {(r.reponses as Array<{ libelle: string; note: number }>).map((item, idx) => (
                    <p key={idx} className="text-xs text-gray-600 flex justify-between gap-4">
                      <span>{item.libelle}</span>
                      <span className="text-yellow-600 shrink-0">{item.note.toFixed(1)}/5</span>
                    </p>
                  ))}
                </div>
                {r.commentaire && (
                  <p className="text-sm text-gray-600 italic border-t border-gray-100 pt-2 mt-2">
                    « {r.commentaire} »
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
      )}
      </div>
      <LoadingOverlay show={loading} label="Chargement des avis..." />
    </div>
  )
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div
      className="rounded-xl border p-4 bg-white"
      style={{ borderColor: "#E5E7EB" }}
    >
      <p className="text-xs text-gray-500">{label}</p>
      <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
    </div>
  )
}
