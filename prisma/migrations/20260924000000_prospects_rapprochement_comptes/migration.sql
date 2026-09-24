-- Rapprochement automatique prospects <-> comptes du site.
-- Un centre démarché qui crée son compte est rattaché à sa fiche de
-- prospection (centreId) et daté (inscritAt) ; il sort des listes de relance.

-- AlterTable
ALTER TABLE "prospects" ADD COLUMN "centreId" TEXT,
ADD COLUMN "inscritAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "prospects_centreId_idx" ON "prospects"("centreId");

-- AddForeignKey
ALTER TABLE "prospects" ADD CONSTRAINT "prospects_centreId_fkey" FOREIGN KEY ("centreId") REFERENCES "centres"("id") ON DELETE SET NULL ON UPDATE CASCADE;
