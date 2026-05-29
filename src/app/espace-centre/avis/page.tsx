"use client"

import { useEffect, useState } from "react"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faSave, faStar, faSpinner } from "@fortawesome/free-solid-svg-icons"
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
    setSaving(true)
    setMessage(null)
    try {
      const res = await fetch("/api/centre/questionnaires", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          questions: draft.map((libelle) => ({ libelle })),
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
        <h1 className="font-display font-bold text-2xl text-white">Avis & questionnaires</h1>
        <p className="text-sm text-gray-400 mt-1">
          Personnalisez les 5 questions envoyées à vos stagiaires après chaque formation.
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
        className="rounded-xl border p-6 space-y-4"
        style={{ background: "rgba(255,255,255,0.04)", borderColor: "rgba(255,255,255,0.08)" }}
      >
        <h2 className="font-semibold text-white">Vos 5 questions (centre)</h2>
        {draft.map((libelle, i) => (
          <div key={i}>
            <label className="text-xs text-gray-500 mb-1 block">Question {i + 1}</label>
            <input
              value={libelle}
              onChange={(e) => {
                const next = [...draft]
                next[i] = e.target.value
                setDraft(next)
              }}
              maxLength={300}
              className="w-full px-3 py-2 rounded-lg text-sm text-white border focus:outline-none focus:border-blue-500"
              style={{ background: "rgba(255,255,255,0.06)", borderColor: "rgba(255,255,255,0.1)" }}
            />
          </div>
        ))}
        {message && <p className="text-xs text-blue-300">{message}</p>}
        <button
          type="button"
          onClick={saveQuestions}
          disabled={saving}
          className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700 disabled:opacity-50"
        >
          <FontAwesomeIcon icon={saving ? faSpinner : faSave} className={saving ? "animate-spin" : ""} />
          Enregistrer les questions
        </button>
      </section>

      <section>
        <h2 className="font-semibold text-white mb-4 flex items-center gap-2">
          <FontAwesomeIcon icon={faStar} className="text-yellow-400" />
          Derniers avis reçus
        </h2>
        {responses.length === 0 ? (
          <p className="text-sm text-gray-500">Aucun avis pour le moment.</p>
        ) : (
          <div className="space-y-4">
            {responses.map((r) => (
              <div
                key={r.id}
                className="rounded-xl border p-4"
                style={{ background: "rgba(255,255,255,0.03)", borderColor: "rgba(255,255,255,0.08)" }}
              >
                <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                  <div>
                    <p className="text-sm font-medium text-white">{r.auteur}</p>
                    <p className="text-xs text-gray-500">{r.formation} — {formatDate(r.createdAt)}</p>
                  </div>
                  <HalfStarRating value={r.noteGlobale} readonly size="sm" />
                </div>
                <div className="space-y-1 mb-2">
                  {(r.reponses as Array<{ libelle: string; note: number }>).map((item, idx) => (
                    <p key={idx} className="text-xs text-gray-400 flex justify-between gap-4">
                      <span>{item.libelle}</span>
                      <span className="text-yellow-400/90 shrink-0">{item.note.toFixed(1)}/5</span>
                    </p>
                  ))}
                </div>
                {r.commentaire && (
                  <p className="text-sm text-gray-300 italic border-t border-white/5 pt-2 mt-2">
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
      className="rounded-xl border p-4"
      style={{ background: "rgba(255,255,255,0.04)", borderColor: "rgba(255,255,255,0.08)" }}
    >
      <p className="text-xs text-gray-500">{label}</p>
      <p className="text-2xl font-bold text-white mt-1">{value}</p>
    </div>
  )
}
