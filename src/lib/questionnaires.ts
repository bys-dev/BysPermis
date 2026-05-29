import { prisma } from "@/lib/prisma"
import type { QuestionnaireType } from "@/generated/prisma/client"

export const DEFAULT_CENTRE_QUESTIONS = [
  "Accueil et organisation du centre",
  "Qualité pédagogique des formateurs",
  "Clarté des contenus et supports de formation",
  "Confort des locaux et des équipements",
  "Rapport qualité / prix de la prestation",
] as const

export const DEFAULT_PLATFORM_QUESTIONS = [
  "Facilité de réservation en ligne sur BYS Permis",
  "Clarté et ergonomie du site",
  "Processus de paiement et confirmation",
  "Suivi de ma formation (convocation, documents, attestation)",
  "Recommanderiez-vous BYS Permis à un proche ?",
] as const

export type QuestionnaireAnswer = {
  questionId: string
  libelle: string
  note: number
}

export function averageRating(answers: QuestionnaireAnswer[]): number {
  if (answers.length === 0) return 0
  const sum = answers.reduce((acc, a) => acc + a.note, 0)
  return Math.round((sum / answers.length) * 10) / 10
}

export function roundedStarNote(noteGlobale: number): number {
  return Math.min(5, Math.max(1, Math.round(noteGlobale)))
}

export async function getQuestionsForContext(
  type: QuestionnaireType,
  centreId: string | null,
): Promise<Array<{ id: string; libelle: string; ordre: number }>> {
  if (type === "CENTRE" && centreId) {
    const custom = await prisma.questionnaireQuestion.findMany({
      where: { type: "CENTRE", centreId, actif: true },
      orderBy: { ordre: "asc" },
      take: 10,
    })
    if (custom.length >= 1) {
      return custom.map((q) => ({ id: q.id, libelle: q.libelle, ordre: q.ordre }))
    }
  }

  if (type === "PLATFORM") {
    const custom = await prisma.questionnaireQuestion.findMany({
      where: { type: "PLATFORM", centreId: null, actif: true },
      orderBy: { ordre: "asc" },
      take: 10,
    })
    if (custom.length >= 1) {
      return custom.map((q) => ({ id: q.id, libelle: q.libelle, ordre: q.ordre }))
    }
  }

  const defaults = type === "CENTRE" ? DEFAULT_CENTRE_QUESTIONS : DEFAULT_PLATFORM_QUESTIONS
  return defaults.map((libelle, index) => ({
    id: `default-${type.toLowerCase()}-${index}`,
    libelle,
    ordre: index,
  }))
}

export async function ensurePlatformDefaultQuestions(): Promise<void> {
  const count = await prisma.questionnaireQuestion.count({
    where: { type: "PLATFORM", centreId: null },
  })
  if (count > 0) return

  await prisma.questionnaireQuestion.createMany({
    data: DEFAULT_PLATFORM_QUESTIONS.map((libelle, ordre) => ({
      type: "PLATFORM" as const,
      centreId: null,
      libelle,
      ordre,
    })),
  })
}

export async function ensureCentreDefaultQuestions(centreId: string): Promise<void> {
  const count = await prisma.questionnaireQuestion.count({
    where: { centreId, type: "CENTRE" },
  })
  if (count > 0) return

  await prisma.questionnaireQuestion.createMany({
    data: DEFAULT_CENTRE_QUESTIONS.map((libelle, ordre) => ({
      type: "CENTRE" as const,
      centreId,
      libelle,
      ordre,
    })),
  })
}
