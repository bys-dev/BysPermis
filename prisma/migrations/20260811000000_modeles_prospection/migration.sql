-- Bibliothèque de modèles d'email de prospection, éditable par le staff.
CREATE TABLE "prospect_email_templates" (
    "id" TEXT NOT NULL,
    "slug" TEXT,
    "nom" TEXT NOT NULL,
    "moment" TEXT,
    "objectif" TEXT,
    "sujet" TEXT NOT NULL,
    "contenu" TEXT NOT NULL,
    "fromName" TEXT,
    "replyTo" TEXT,
    "filtreSuggere" JSONB,
    "delaiJours" INTEGER,
    "ordre" INTEGER NOT NULL DEFAULT 0,
    "isArchive" BOOLEAN NOT NULL DEFAULT false,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "prospect_email_templates_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "prospect_email_templates_slug_key" ON "prospect_email_templates"("slug");

CREATE INDEX "prospect_email_templates_isArchive_ordre_idx" ON "prospect_email_templates"("isArchive", "ordre");

ALTER TABLE "prospect_email_templates"
    ADD CONSTRAINT "prospect_email_templates_createdById_fkey"
    FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
