-- Migration: journal des emails + archivage des documents transactionnels
--
-- 1. Nouveaux DocumentKind pour les PDF générés par la plateforme et désormais
--    archivés dans le storage (Cellar / Blob) au lieu d'être régénérés à la volée.
-- 2. Table `email_logs` : traçabilité des envois Resend ET substrat d'idempotence
--    pour le pipeline de fulfillment rejoué par le webhook Stripe.

-- ─── DocumentKind: convocation / facture / attestation ─────
-- ADD VALUE IF NOT EXISTS est supporté depuis PG 9.6 et transactionnel depuis PG 12.
ALTER TYPE "DocumentKind" ADD VALUE IF NOT EXISTS 'CONVOCATION';
ALTER TYPE "DocumentKind" ADD VALUE IF NOT EXISTS 'FACTURE';
ALTER TYPE "DocumentKind" ADD VALUE IF NOT EXISTS 'ATTESTATION';

-- ─── Verrou d'idempotence du fulfillment post-paiement ─────
-- Réclamé par UPDATE ... WHERE "fulfilledAt" IS NULL : la route de réservation et
-- le webhook Stripe se disputent le verrou, un seul gagne → pas de double envoi.
ALTER TABLE "reservations" ADD COLUMN IF NOT EXISTS "fulfilledAt" TIMESTAMP(3);

-- Les réservations déjà confirmées avant cette migration ont forcément reçu leurs
-- emails via l'ancien flux : on les marque comme traitées pour que le filet de
-- sécurité ne renvoie pas tout l'historique.
UPDATE "reservations"
   SET "fulfilledAt" = "updatedAt"
 WHERE "fulfilledAt" IS NULL
   AND "status" IN ('CONFIRMEE', 'TERMINEE', 'ANNULEE', 'REMBOURSEE');

-- ─── Enum EmailLogStatus ───────────────────────────────────
DO $$ BEGIN
  CREATE TYPE "EmailLogStatus" AS ENUM ('ENVOYE', 'ECHEC');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- ─── Table email_logs ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS "email_logs" (
  "id"            TEXT NOT NULL,
  "destinataire"  TEXT NOT NULL,
  "sujet"         TEXT NOT NULL,
  "kind"          TEXT NOT NULL,
  "status"        "EmailLogStatus" NOT NULL DEFAULT 'ENVOYE',
  "error"         TEXT,
  "providerId"    TEXT,
  "createdAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "reservationId" TEXT,
  "userId"        TEXT,
  "centreId"      TEXT,

  CONSTRAINT "email_logs_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "email_logs_reservationId_kind_status_idx"
  ON "email_logs" ("reservationId", "kind", "status");
CREATE INDEX IF NOT EXISTS "email_logs_destinataire_idx" ON "email_logs" ("destinataire");
CREATE INDEX IF NOT EXISTS "email_logs_createdAt_idx" ON "email_logs" ("createdAt");

-- Clés étrangères (SET NULL : on ne perd jamais une ligne de journal)
DO $$ BEGIN
  ALTER TABLE "email_logs" ADD CONSTRAINT "email_logs_reservationId_fkey"
    FOREIGN KEY ("reservationId") REFERENCES "reservations"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "email_logs" ADD CONSTRAINT "email_logs_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "email_logs" ADD CONSTRAINT "email_logs_centreId_fkey"
    FOREIGN KEY ("centreId") REFERENCES "centres"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;
