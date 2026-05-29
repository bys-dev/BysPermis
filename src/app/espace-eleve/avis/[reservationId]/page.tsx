"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faCheckCircle, faBuilding, faLaptop } from "@fortawesome/free-solid-svg-icons"
import LoadingOverlay, { PageHeaderSkeleton } from "@/components/ui/LoadingOverlay"
import QuestionnaireForm, { type QuestionItem } from "@/components/reviews/QuestionnaireForm"

type QuestionnaireData = {
  reservationId: string
  formationTitre: string
  centre: { nom: string; ville: string }
  completed: { CENTRE: boolean; PLATFORM: boolean }
  questions: { CENTRE: QuestionItem[]; PLATFORM: QuestionItem[] }
}

export default function QuestionnaireReservationPage() {
  const { reservationId } = useParams<{ reservationId: string }>()
  const [data, setData] = useState<QuestionnaireData | null>(null)
  const [loading, setLoading] = useState(true)
  const [step, setStep] = useState<"CENTRE" | "PLATFORM" | "done">("CENTRE")

  useEffect(() => {
    fetch(`/api/questionnaires/${reservationId}`)
      .then((r) => {
        if (!r.ok) throw new Error("not found")
        return r.json()
      })
      .then((json: QuestionnaireData) => {
        setData(json)
        if (json.completed.CENTRE && !json.completed.PLATFORM) setStep("PLATFORM")
        if (json.completed.CENTRE && json.completed.PLATFORM) setStep("done")
      })
      .catch(() => setData(null))
      .finally(() => setLoading(false))
  }, [reservationId])

  function refreshAfterSubmit(type: "CENTRE" | "PLATFORM") {
    if (!data) return
    const completed = { ...data.completed, [type]: true }
    setData({ ...data, completed })
    if (type === "CENTRE" && !completed.PLATFORM) {
      setStep("PLATFORM")
    } else {
      setStep("done")
    }
  }

  if (!loading && !data) {
    return (
      <div className="max-w-lg mx-auto text-center py-16">
        <p className="text-gray-400 mb-4">Questionnaire indisponible.</p>
        <Link href="/espace-eleve/avis" className="text-blue-400 hover:underline">
          Retour aux questionnaires
        </Link>
      </div>
    )
  }

  if (!loading && data && (step === "done" || (data.completed.CENTRE && data.completed.PLATFORM))) {
    return (
      <div className="max-w-lg mx-auto text-center py-16">
        <FontAwesomeIcon icon={faCheckCircle} className="text-5xl text-green-400 mb-4" />
        <h1 className="font-display font-bold text-xl text-white mb-2">Merci pour vos retours !</h1>
        <p className="text-gray-400 text-sm mb-6">
          Vos avis sur {data.centre.nom} et sur BYS Permis ont bien été enregistrés.
        </p>
        <Link
          href="/espace-eleve/mes-formations"
          className="inline-block bg-blue-600 text-white px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-blue-700"
        >
          Retour à mes formations
        </Link>
      </div>
    )
  }

  return (
    <div className="relative min-h-[50vh] max-w-xl mx-auto">
      <div className={loading ? "opacity-40 pointer-events-none select-none" : ""}>
      {loading ? (
        <>
          <PageHeaderSkeleton />
          <div className="flex gap-2 mb-6">
            <div className="flex-1 h-10 rounded-lg bg-white/5 animate-pulse" />
            <div className="flex-1 h-10 rounded-lg bg-white/5 animate-pulse" />
          </div>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 rounded-xl bg-white/5 border border-white/5 animate-pulse" />
            ))}
          </div>
        </>
      ) : data ? (
        <>
      <div className="flex gap-2 mb-6">
        <StepBadge
          label="Centre"
          icon={faBuilding}
          active={step === "CENTRE"}
          done={data.completed.CENTRE}
        />
        <StepBadge
          label="Plateforme BYS"
          icon={faLaptop}
          active={step === "PLATFORM"}
          done={data.completed.PLATFORM}
        />
      </div>

      <p className="text-xs text-gray-500 mb-4">
        {data.formationTitre} — {data.centre.nom}
      </p>

      {step === "CENTRE" && !data.completed.CENTRE && (
        <QuestionnaireForm
          title="Votre avis sur le centre"
          subtitle={`5 questions sur votre expérience chez ${data.centre.nom}. Cliquez à gauche ou à droite de l'étoile pour une demi-note.`}
          questions={data.questions.CENTRE}
          type="CENTRE"
          reservationId={data.reservationId}
          onSuccess={() => refreshAfterSubmit("CENTRE")}
        />
      )}

      {step === "PLATFORM" && !data.completed.PLATFORM && (
        <QuestionnaireForm
          title="Votre avis sur BYS Permis"
          subtitle="5 questions sur votre expérience avec la plateforme (réservation, paiement, suivi)."
          questions={data.questions.PLATFORM}
          type="PLATFORM"
          reservationId={data.reservationId}
          onSuccess={() => refreshAfterSubmit("PLATFORM")}
        />
      )}
        </>
      ) : null}
      </div>
      <LoadingOverlay show={loading} label="Chargement du questionnaire..." />
    </div>
  )
}

function StepBadge({
  label,
  icon,
  active,
  done,
}: {
  label: string
  icon: typeof faBuilding
  active: boolean
  done: boolean
}) {
  return (
    <div
      className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-semibold border ${
        done
          ? "border-green-500/40 text-green-400 bg-green-500/10"
          : active
            ? "border-blue-500/50 text-blue-300 bg-blue-500/10"
            : "border-white/10 text-gray-500"
      }`}
    >
      <FontAwesomeIcon icon={done ? faCheckCircle : icon} />
      {label}
    </div>
  )
}
