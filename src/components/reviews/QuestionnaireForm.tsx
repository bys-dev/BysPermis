"use client"

import { useState } from "react"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faCheck, faSpinner } from "@fortawesome/free-solid-svg-icons"
import HalfStarRating from "@/components/reviews/HalfStarRating"

export type QuestionItem = {
  id: string
  libelle: string
  ordre: number
}

type Props = {
  title: string
  subtitle: string
  questions: QuestionItem[]
  type: "CENTRE" | "PLATFORM"
  reservationId: string
  onSuccess: () => void
  showComment?: boolean
}

export default function QuestionnaireForm({
  title,
  subtitle,
  questions,
  type,
  reservationId,
  onSuccess,
  showComment = true,
}: Props) {
  const [notes, setNotes] = useState<Record<string, number>>({})
  const [commentaire, setCommentaire] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const allAnswered = questions.every((q) => (notes[q.id] ?? 0) >= 1)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!allAnswered) {
      setError("Veuillez noter chaque question (1 à 5, demi-étoiles possibles).")
      return
    }

    setSubmitting(true)
    setError(null)
    try {
      const res = await fetch("/api/questionnaires/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          reservationId,
          answers: questions.map((q) => ({
            questionId: q.id,
            libelle: q.libelle,
            note: notes[q.id],
          })),
          commentaire: commentaire.trim() || undefined,
        }),
      })
      const body = await res.json().catch(() => ({}))
      if (!res.ok) {
        throw new Error(typeof body.error === "string" ? body.error : "Envoi impossible")
      }
      onSuccess()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <h2 className="font-display font-bold text-xl text-white">{title}</h2>
        <p className="text-sm text-gray-400 mt-1">{subtitle}</p>
      </div>

      <div className="space-y-5">
        {questions.map((q, index) => (
          <div
            key={q.id}
            className="rounded-xl border p-4"
            style={{ background: "rgba(255,255,255,0.04)", borderColor: "rgba(255,255,255,0.08)" }}
          >
            <p className="text-sm text-white font-medium mb-3">
              {index + 1}. {q.libelle}
            </p>
            <HalfStarRating
              value={notes[q.id] ?? 0}
              onChange={(v) => setNotes((prev) => ({ ...prev, [q.id]: v }))}
            />
          </div>
        ))}
      </div>

      {showComment && (
        <div>
          <label className="block text-xs text-gray-400 mb-1">Commentaire libre (optionnel)</label>
          <textarea
            value={commentaire}
            onChange={(e) => setCommentaire(e.target.value)}
            rows={3}
            maxLength={1000}
            placeholder="Précisez votre expérience..."
            className="w-full px-3 py-2 rounded-lg text-sm text-white placeholder-gray-600 border focus:outline-none focus:border-blue-500 resize-none"
            style={{ background: "rgba(255,255,255,0.06)", borderColor: "rgba(255,255,255,0.1)" }}
          />
        </div>
      )}

      {error && <p className="text-xs text-red-400">{error}</p>}

      <button
        type="submit"
        disabled={submitting || !allAnswered}
        className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white py-3 rounded-lg font-semibold text-sm hover:bg-blue-700 transition-colors disabled:opacity-50"
      >
        {submitting ? (
          <FontAwesomeIcon icon={faSpinner} className="animate-spin" />
        ) : (
          <>
            <FontAwesomeIcon icon={faCheck} className="w-3 h-3" />
            Envoyer mes réponses
          </>
        )}
      </button>
    </form>
  )
}
