-- Migration: fonction réglementaire animateur + n° d'autorisation d'animer
-- Distincte du droit d'accès `Role`. Chaque stage est co-animé par un expert en
-- sécurité routière et un psychologue, chacun titulaire d'un numéro d'autorisation
-- d'animer (préfecture). Ces données alimentent l'attestation de suivi (Annexe I).

-- ─── Enum FonctionAnimateur ────────────────────────────────
DO $$ BEGIN
  CREATE TYPE "FonctionAnimateur" AS ENUM (
    'EXPERT_SR',    -- Expert en sécurité routière (BAFM)
    'PSYCHOLOGUE'   -- Animateur psychologue
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- ─── CentreMembre: fonction animateur + n° autorisation ────
ALTER TABLE "centre_membres" ADD COLUMN IF NOT EXISTS "fonctionAnimateur" "FonctionAnimateur";
ALTER TABLE "centre_membres" ADD COLUMN IF NOT EXISTS "numeroAutorisation" TEXT;
