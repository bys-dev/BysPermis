-- Migration: galerie photos des centres
-- Un centre ne pouvait publier qu'une seule image d'illustration (bannerImage).
-- Cette colonne stocke les URLs des photos de ses locaux, sur le meme modele
-- que "equipements" et "certifications".

ALTER TABLE "centres" ADD COLUMN IF NOT EXISTS "photos" TEXT[] DEFAULT ARRAY[]::TEXT[];
