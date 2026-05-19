-- Migration: add facturation / juridique fields on Centre
-- Allows centres to fully customize their PDFs (contracts, invoices, etc.)
-- and override the platform-wide commission rate.

ALTER TABLE "centres" ADD COLUMN IF NOT EXISTS "raisonSociale" TEXT;
ALTER TABLE "centres" ADD COLUMN IF NOT EXISTS "tva" TEXT;
ALTER TABLE "centres" ADD COLUMN IF NOT EXISTS "ape" TEXT;
ALTER TABLE "centres" ADD COLUMN IF NOT EXISTS "iban" TEXT;
ALTER TABLE "centres" ADD COLUMN IF NOT EXISTS "bic" TEXT;
ALTER TABLE "centres" ADD COLUMN IF NOT EXISTS "mentionsLegales" TEXT;
ALTER TABLE "centres" ADD COLUMN IF NOT EXISTS "cgv" TEXT;
ALTER TABLE "centres" ADD COLUMN IF NOT EXISTS "nomResponsable" TEXT;
ALTER TABLE "centres" ADD COLUMN IF NOT EXISTS "signatureUrl" TEXT;
ALTER TABLE "centres" ADD COLUMN IF NOT EXISTS "commissionRateOverride" DOUBLE PRECISION;
