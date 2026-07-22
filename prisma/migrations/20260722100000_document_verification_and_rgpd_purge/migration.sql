-- Migration: vérification des justificatifs par le centre + purge RGPD à 45 jours
--
-- 1. Le centre doit pouvoir contrôler les pièces transmises par le stagiaire
--    (permis, CNI, lettre 48N) : qui a vérifié, quand, et le motif en cas de refus.
--    Distinct de l'acceptation du bon d'accord, qui est une action de l'ÉLÈVE
--    (colonnes accepted*).
-- 2. Les justificatifs d'identité sont détruits 45 jours après la fin du stage.
--    On conserve la ligne (preuve que la pièce a été fournie puis détruite) et on
--    vide `blobUrl` ; `purgedAt` horodate la destruction.

-- ─── Vérification par le centre ────────────────────────────
ALTER TABLE "documents" ADD COLUMN IF NOT EXISTS "verifiedAt" TIMESTAMP(3);
ALTER TABLE "documents" ADD COLUMN IF NOT EXISTS "verifiedById" TEXT;
ALTER TABLE "documents" ADD COLUMN IF NOT EXISTS "motifRefus" TEXT;

DO $$ BEGIN
  ALTER TABLE "documents" ADD CONSTRAINT "documents_verifiedById_fkey"
    FOREIGN KEY ("verifiedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- ─── Purge RGPD ────────────────────────────────────────────
ALTER TABLE "documents" ADD COLUMN IF NOT EXISTS "purgedAt" TIMESTAMP(3);

-- Le cron de purge balaie les justificatifs non encore purgés : index partiel
-- sur les seules lignes concernées.
CREATE INDEX IF NOT EXISTS "documents_purge_idx"
  ON "documents" ("direction", "kind")
  WHERE "purgedAt" IS NULL;
