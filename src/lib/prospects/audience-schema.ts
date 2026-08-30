/**
 * Schéma de validation du ciblage d'une campagne.
 *
 * Mutualisé entre les quatre routes qui manipulent un filtre (comptage, liste
 * des destinataires, création et modification de campagne) : une divergence
 * entre elles laisserait passer un ciblage à l'enregistrement qu'un autre
 * écran refuserait ensuite de compter.
 */

import { z } from "zod";

/** Plafond de la sélection nominative. */
export const MAX_SELECTION = 2000;

export const AudienceFilterSchema = z.object({
  mode: z.enum(["FILTRE", "SELECTION"]).optional(),
  prospectIds: z.array(z.string().max(40)).max(MAX_SELECTION).optional(),
  statuts: z
    .array(
      z.enum([
        "NOUVEAU",
        "A_CONTACTER",
        "CONTACTE",
        "RELANCE",
        "INTERESSE",
        "INSCRIT",
        "REFUSE",
        "INJOIGNABLE",
        "DESABONNE",
      ]),
    )
    .optional(),
  departements: z.array(z.string().max(5)).optional(),
  villes: z.array(z.string().max(120)).optional(),
  sources: z.array(z.string().max(100)).optional(),
  importIds: z.array(z.string()).optional(),
  scoreMin: z.number().int().min(0).max(100).optional(),
  exclureDejaContactes: z.boolean().optional(),
  exclureCampagneIds: z.array(z.string()).optional(),
  recherche: z.string().max(200).optional(),
});

export type AudienceFilterInput = z.infer<typeof AudienceFilterSchema>;
