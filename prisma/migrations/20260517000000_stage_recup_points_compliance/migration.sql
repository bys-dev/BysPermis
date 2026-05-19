-- Migration: compliance fields for stages de récupération de points
-- Adds the legal/operational fields required by the Ministère de l'Intérieur
-- regulation (agrément préfectoral, stage type, attendee proof of identity).

-- ─── Enum StageType ─────────────────────────────────────────
DO $$ BEGIN
  CREATE TYPE "StageType" AS ENUM (
    'VOLONTAIRE',           -- Récupération volontaire (max 1 / an)
    'PROBATOIRE',           -- Permis probatoire (lettre 48N)
    'LETTRE_48N',           -- Notification 48N (jeunes permis < 3 ans)
    'LETTRE_48SI',          -- Notification 48SI (solde de points épuisé)
    'JUDICIAIRE',           -- Peine alternative judiciaire
    'COMPOSITION_PENALE'    -- Composition pénale
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- ─── Centre: agrément préfectoral ──────────────────────────
ALTER TABLE "centres" ADD COLUMN IF NOT EXISTS "agrementNumber" TEXT;
ALTER TABLE "centres" ADD COLUMN IF NOT EXISTS "agrementDepartement" TEXT;
ALTER TABLE "centres" ADD COLUMN IF NOT EXISTS "agrementValidUntil" TIMESTAMP(3);

-- ─── Formation: type de stage + points récupérés ──────────
ALTER TABLE "formations" ADD COLUMN IF NOT EXISTS "stageType" "StageType" NOT NULL DEFAULT 'VOLONTAIRE';
ALTER TABLE "formations" ADD COLUMN IF NOT EXISTS "pointsRecovered" INTEGER NOT NULL DEFAULT 4;

-- ─── Reservation: justificatifs uploadés par le stagiaire ──
ALTER TABLE "reservations" ADD COLUMN IF NOT EXISTS "lettre48NUrl" TEXT;
ALTER TABLE "reservations" ADD COLUMN IF NOT EXISTS "pieceIdentiteUrl" TEXT;
