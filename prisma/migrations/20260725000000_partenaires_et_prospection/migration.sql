-- CreateEnum
CREATE TYPE "PartnerLeadStatus" AS ENUM ('NOUVEAU', 'EN_COURS', 'COMPTE_CREE', 'REFUSE', 'ARCHIVE');

-- CreateEnum
CREATE TYPE "CentreDocumentKind" AS ENUM ('KBIS', 'AGREMENT_PREFECTORAL', 'PIECE_IDENTITE_REPRESENTANT', 'ASSURANCE_RC_PRO', 'ATTESTATION_URSSAF', 'RIB', 'AUTORISATION_ANIMER', 'AUTRE');

-- CreateEnum
CREATE TYPE "CentreDocumentStatus" AS ENUM ('EN_ATTENTE', 'VALIDE', 'REFUSE');

-- CreateEnum
CREATE TYPE "CentreVerificationStatus" AS ENUM ('INCOMPLET', 'EN_VERIFICATION', 'VERIFIE', 'REFUSE');

-- CreateEnum
CREATE TYPE "ProspectStatus" AS ENUM ('NOUVEAU', 'A_CONTACTER', 'CONTACTE', 'RELANCE', 'INTERESSE', 'INSCRIT', 'REFUSE', 'INJOIGNABLE', 'DESABONNE');

-- CreateEnum
CREATE TYPE "ProspectImportFormat" AS ENUM ('XLSX', 'CSV', 'JSON');

-- CreateEnum
CREATE TYPE "CampaignStatus" AS ENUM ('BROUILLON', 'PROGRAMMEE', 'EN_COURS', 'ENVOYEE', 'PAUSEE', 'ANNULEE');

-- CreateEnum
CREATE TYPE "CampaignRecipientStatus" AS ENUM ('EN_ATTENTE', 'ENVOYE', 'ECHEC', 'IGNORE', 'OUVERT', 'CLIQUE', 'BOUNCE', 'PLAINTE');

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "mustChangePassword" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "passwordChangedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "centres" ADD COLUMN     "assuranceRcPro" TEXT,
ADD COLUMN     "representantFonction" TEXT,
ADD COLUMN     "verificationAt" TIMESTAMP(3),
ADD COLUMN     "verificationMotif" TEXT,
ADD COLUMN     "verificationStatut" "CentreVerificationStatus" NOT NULL DEFAULT 'INCOMPLET';

-- CreateTable
CREATE TABLE "partner_leads" (
    "id" TEXT NOT NULL,
    "centreNom" TEXT NOT NULL,
    "raisonSociale" TEXT,
    "siret" TEXT,
    "agrementNumber" TEXT,
    "agrementDepartement" TEXT,
    "adresse" TEXT,
    "codePostal" TEXT,
    "ville" TEXT NOT NULL,
    "telephone" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "siteWeb" TEXT,
    "contactNom" TEXT NOT NULL,
    "contactPrenom" TEXT,
    "contactFonction" TEXT,
    "contactEmail" TEXT NOT NULL,
    "contactTelephone" TEXT,
    "volumeMensuel" TEXT,
    "typesStages" TEXT[],
    "capaciteParSession" INTEGER,
    "prixPublic" DOUBLE PRECISION,
    "nbLieux" INTEGER,
    "message" TEXT,
    "statut" "PartnerLeadStatus" NOT NULL DEFAULT 'NOUVEAU',
    "notesInternes" TEXT,
    "motifRefus" TEXT,
    "traiteParId" TEXT,
    "traiteAt" TIMESTAMP(3),
    "centreId" TEXT,
    "consentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "consentIp" TEXT,
    "source" TEXT DEFAULT 'devenir-partenaire',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "partner_leads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "centre_verification_documents" (
    "id" TEXT NOT NULL,
    "kind" "CentreDocumentKind" NOT NULL,
    "nom" TEXT NOT NULL,
    "blobUrl" TEXT NOT NULL,
    "mimeType" TEXT,
    "taille" INTEGER,
    "status" "CentreDocumentStatus" NOT NULL DEFAULT 'EN_ATTENTE',
    "motifRefus" TEXT,
    "expiresAt" TIMESTAMP(3),
    "verifiedAt" TIMESTAMP(3),
    "verifiedById" TEXT,
    "centreId" TEXT NOT NULL,
    "uploadedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "centre_verification_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "prospects" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "raisonSociale" TEXT,
    "siret" TEXT,
    "agrementNumber" TEXT,
    "agrementDepartement" TEXT,
    "email" TEXT,
    "emailValide" BOOLEAN NOT NULL DEFAULT true,
    "telephone" TEXT,
    "siteWeb" TEXT,
    "adresse" TEXT,
    "codePostal" TEXT,
    "ville" TEXT,
    "departement" TEXT,
    "contactNom" TEXT,
    "contactPrenom" TEXT,
    "contactFonction" TEXT,
    "source" TEXT,
    "importId" TEXT,
    "raw" JSONB,
    "dedupeKey" TEXT NOT NULL,
    "statut" "ProspectStatus" NOT NULL DEFAULT 'NOUVEAU',
    "score" INTEGER,
    "notesInternes" TEXT,
    "ownerId" TEXT,
    "lastContactedAt" TIMESTAMP(3),
    "nbEmailsEnvoyes" INTEGER NOT NULL DEFAULT 0,
    "nbOuvertures" INTEGER NOT NULL DEFAULT 0,
    "nbClics" INTEGER NOT NULL DEFAULT 0,
    "unsubscribeToken" TEXT NOT NULL,
    "unsubscribedAt" TIMESTAMP(3),
    "bouncedAt" TIMESTAMP(3),
    "partnerLeadId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "prospects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "prospect_imports" (
    "id" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "format" "ProspectImportFormat" NOT NULL,
    "source" TEXT,
    "totalRows" INTEGER NOT NULL DEFAULT 0,
    "nbCrees" INTEGER NOT NULL DEFAULT 0,
    "nbMisAJour" INTEGER NOT NULL DEFAULT 0,
    "nbIgnores" INTEGER NOT NULL DEFAULT 0,
    "nbErreurs" INTEGER NOT NULL DEFAULT 0,
    "erreurs" JSONB,
    "mappage" JSONB,
    "importedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "prospect_imports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "email_campaigns" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "sujet" TEXT NOT NULL,
    "contenu" TEXT NOT NULL,
    "fromName" TEXT,
    "replyTo" TEXT,
    "statut" "CampaignStatus" NOT NULL DEFAULT 'BROUILLON',
    "filtre" JSONB,
    "scheduledAt" TIMESTAMP(3),
    "startedAt" TIMESTAMP(3),
    "finishedAt" TIMESTAMP(3),
    "totalCibles" INTEGER NOT NULL DEFAULT 0,
    "nbEnvoyes" INTEGER NOT NULL DEFAULT 0,
    "nbEchecs" INTEGER NOT NULL DEFAULT 0,
    "nbOuvertures" INTEGER NOT NULL DEFAULT 0,
    "nbClics" INTEGER NOT NULL DEFAULT 0,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "email_campaigns_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "campaign_recipients" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "prospectId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "status" "CampaignRecipientStatus" NOT NULL DEFAULT 'EN_ATTENTE',
    "error" TEXT,
    "providerId" TEXT,
    "sentAt" TIMESTAMP(3),
    "openedAt" TIMESTAMP(3),
    "clickedAt" TIMESTAMP(3),
    "bouncedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "campaign_recipients_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "partner_leads_centreId_key" ON "partner_leads"("centreId");

-- CreateIndex
CREATE INDEX "partner_leads_statut_createdAt_idx" ON "partner_leads"("statut", "createdAt");

-- CreateIndex
CREATE INDEX "partner_leads_contactEmail_idx" ON "partner_leads"("contactEmail");

-- CreateIndex
CREATE INDEX "centre_verification_documents_centreId_kind_idx" ON "centre_verification_documents"("centreId", "kind");

-- CreateIndex
CREATE INDEX "centre_verification_documents_status_idx" ON "centre_verification_documents"("status");

-- CreateIndex
CREATE UNIQUE INDEX "prospects_dedupeKey_key" ON "prospects"("dedupeKey");

-- CreateIndex
CREATE UNIQUE INDEX "prospects_unsubscribeToken_key" ON "prospects"("unsubscribeToken");

-- CreateIndex
CREATE UNIQUE INDEX "prospects_partnerLeadId_key" ON "prospects"("partnerLeadId");

-- CreateIndex
CREATE INDEX "prospects_statut_createdAt_idx" ON "prospects"("statut", "createdAt");

-- CreateIndex
CREATE INDEX "prospects_departement_idx" ON "prospects"("departement");

-- CreateIndex
CREATE INDEX "prospects_email_idx" ON "prospects"("email");

-- CreateIndex
CREATE INDEX "prospect_imports_createdAt_idx" ON "prospect_imports"("createdAt");

-- CreateIndex
CREATE INDEX "email_campaigns_statut_createdAt_idx" ON "email_campaigns"("statut", "createdAt");

-- CreateIndex
CREATE INDEX "campaign_recipients_campaignId_status_idx" ON "campaign_recipients"("campaignId", "status");

-- CreateIndex
CREATE INDEX "campaign_recipients_providerId_idx" ON "campaign_recipients"("providerId");

-- CreateIndex
CREATE UNIQUE INDEX "campaign_recipients_campaignId_prospectId_key" ON "campaign_recipients"("campaignId", "prospectId");

-- AddForeignKey
ALTER TABLE "partner_leads" ADD CONSTRAINT "partner_leads_traiteParId_fkey" FOREIGN KEY ("traiteParId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "partner_leads" ADD CONSTRAINT "partner_leads_centreId_fkey" FOREIGN KEY ("centreId") REFERENCES "centres"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "centre_verification_documents" ADD CONSTRAINT "centre_verification_documents_verifiedById_fkey" FOREIGN KEY ("verifiedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "centre_verification_documents" ADD CONSTRAINT "centre_verification_documents_centreId_fkey" FOREIGN KEY ("centreId") REFERENCES "centres"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "centre_verification_documents" ADD CONSTRAINT "centre_verification_documents_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prospects" ADD CONSTRAINT "prospects_importId_fkey" FOREIGN KEY ("importId") REFERENCES "prospect_imports"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prospects" ADD CONSTRAINT "prospects_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prospect_imports" ADD CONSTRAINT "prospect_imports_importedById_fkey" FOREIGN KEY ("importedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "email_campaigns" ADD CONSTRAINT "email_campaigns_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campaign_recipients" ADD CONSTRAINT "campaign_recipients_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "email_campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campaign_recipients" ADD CONSTRAINT "campaign_recipients_prospectId_fkey" FOREIGN KEY ("prospectId") REFERENCES "prospects"("id") ON DELETE CASCADE ON UPDATE CASCADE;
