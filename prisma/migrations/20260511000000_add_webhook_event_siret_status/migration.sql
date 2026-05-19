-- Migration: add webhook idempotence table, siret on Centre, EN_ATTENTE_PAIEMENT status

-- AlterEnum: add EN_ATTENTE_PAIEMENT status
ALTER TYPE "ReservationStatus" ADD VALUE IF NOT EXISTS 'EN_ATTENTE_PAIEMENT';

-- AlterTable: add siret column on Centre
ALTER TABLE "centres" ADD COLUMN IF NOT EXISTS "siret" TEXT;

-- CreateTable: webhook_events
CREATE TABLE IF NOT EXISTS "webhook_events" (
    "id" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "processedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "webhook_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "webhook_events_provider_id_key" ON "webhook_events"("provider", "id");
