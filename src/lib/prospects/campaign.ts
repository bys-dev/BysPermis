/**
 * Moteur de campagnes de démarchage.
 *
 * Trois étapes distinctes, volontairement découplées :
 *   1. `countAudience` / `buildAudienceWhere` — qui est ciblé (prévisualisable).
 *   2. `prepareCampaign`  — figer la liste des destinataires (idempotent).
 *   3. `sendCampaignBatch` — envoyer par lots.
 *
 * L'envoi est découpé en lots pour deux raisons : les fonctions serverless ont
 * un temps d'exécution borné, et expédier des milliers d'emails froids d'un coup
 * dégrade la réputation du domaine. Un cron rappelle donc `sendCampaignBatch`
 * jusqu'à épuisement de la file.
 */

import { prisma } from "@/lib/prisma";
import { resend } from "@/lib/email";
import { logEmail } from "@/lib/email-log";
import type { Prisma, ProspectStatus } from "@/generated/prisma/client";
import { renderCampaignEmail } from "./template";

const RAW_FROM = process.env.EMAIL_FROM ?? "BYS Formations <noreply@byspermis.fr>";

/** Extrait « noreply@byspermis.fr » de « BYS Formations <noreply@byspermis.fr> ». */
function fromAddress(): string {
  const match = RAW_FROM.match(/<([^>]+)>/);
  return (match ? match[1] : RAW_FROM).trim();
}

function buildFrom(fromName?: string | null): string {
  const name = fromName?.trim();
  return name ? `${name} <${fromAddress()}>` : RAW_FROM;
}

/** Identifiant fonctionnel dans `EmailLog`. */
export const CAMPAIGN_EMAIL_KIND = "campagne_prospection";

/** Taille d'un lot d'envoi. L'API batch de Resend accepte 100 messages par appel. */
export const BATCH_SIZE = 100;

/**
 * Cadence du cron qui fait avancer les campagnes, en minutes.
 *
 * Doit rester alignée sur `clevercloud/cron.json` (`*​/5 * * * *` sur
 * `/api/cron/campagnes`). L'admin s'en sert pour afficher le compte à rebours
 * avant le prochain lot : si la crontab change, changer cette valeur aussi,
 * sinon l'interface annonce une échéance fausse.
 */
export const CRON_CADENCE_MINUTES = 5;

// ─── Ciblage ─────────────────────────────────────────────

export interface AudienceFilter {
  statuts?: ProspectStatus[];
  departements?: string[];
  villes?: string[];
  sources?: string[];
  importIds?: string[];
  scoreMin?: number;
  /** Exclut les prospects déjà destinataires d'au moins une campagne. */
  exclureDejaContactes?: boolean;
  /** Exclut les prospects présents dans ces campagnes (anti-doublon de séquence). */
  exclureCampagneIds?: string[];
  /** Recherche libre sur nom / ville / email. */
  recherche?: string;
}

/**
 * Construit le `where` Prisma du ciblage.
 *
 * Les quatre premières conditions ne sont pas négociables et ne dépendent
 * d'aucun filtre : sans email valide et sans consentement (absence
 * d'opposition), un prospect n'est jamais destinataire. C'est ce qui garantit
 * qu'une désinscription est définitive, quelle que soit la campagne suivante.
 */
export function buildAudienceWhere(filter: AudienceFilter = {}): Prisma.ProspectWhereInput {
  const where: Prisma.ProspectWhereInput = {
    email: { not: null },
    emailValide: true,
    unsubscribedAt: null,
    statut: { notIn: ["DESABONNE", "INJOIGNABLE"] },
  };

  if (filter.statuts?.length) {
    // On intersecte avec l'exclusion obligatoire ci-dessus.
    const allowed = filter.statuts.filter((s) => s !== "DESABONNE" && s !== "INJOIGNABLE");
    where.statut = allowed.length ? { in: allowed } : { notIn: ["DESABONNE", "INJOIGNABLE"] };
  }
  if (filter.departements?.length) where.departement = { in: filter.departements };
  if (filter.villes?.length) where.ville = { in: filter.villes };
  if (filter.sources?.length) where.source = { in: filter.sources };
  if (filter.importIds?.length) where.importId = { in: filter.importIds };
  if (typeof filter.scoreMin === "number") where.score = { gte: filter.scoreMin };

  if (filter.exclureDejaContactes) {
    where.nbEmailsEnvoyes = 0;
  }
  if (filter.exclureCampagneIds?.length) {
    where.recipients = { none: { campaignId: { in: filter.exclureCampagneIds } } };
  }
  if (filter.recherche?.trim()) {
    const q = filter.recherche.trim();
    where.OR = [
      { nom: { contains: q, mode: "insensitive" } },
      { ville: { contains: q, mode: "insensitive" } },
      { email: { contains: q, mode: "insensitive" } },
      { raisonSociale: { contains: q, mode: "insensitive" } },
    ];
  }

  return where;
}

export async function countAudience(filter: AudienceFilter = {}): Promise<number> {
  return prisma.prospect.count({ where: buildAudienceWhere(filter) });
}

/** Échantillon pour l'aperçu du ciblage dans l'UI. */
export async function sampleAudience(filter: AudienceFilter = {}, take = 10) {
  return prisma.prospect.findMany({
    where: buildAudienceWhere(filter),
    select: { id: true, nom: true, email: true, ville: true, departement: true, statut: true },
    orderBy: { createdAt: "asc" },
    take,
  });
}

// ─── Préparation ─────────────────────────────────────────

/**
 * Fige la liste des destinataires d'une campagne.
 * Idempotent : `skipDuplicates` sur la contrainte (campaignId, prospectId)
 * permet de rappeler la fonction (ajout de prospects, reprise après erreur)
 * sans risque de doublon d'envoi.
 */
export async function prepareCampaign(campaignId: string): Promise<{ totalCibles: number; ajoutes: number }> {
  const campaign = await prisma.emailCampaign.findUnique({
    where: { id: campaignId },
    select: { id: true, filtre: true },
  });
  if (!campaign) throw new Error("Campagne introuvable.");

  const filter = (campaign.filtre ?? {}) as AudienceFilter;
  const where = buildAudienceWhere(filter);

  let ajoutes = 0;
  const PAGE = 1000;
  let cursor: string | undefined;

  // Pagination par curseur : le fichier de prospects peut être volumineux.
  for (;;) {
    const page = await prisma.prospect.findMany({
      where,
      select: { id: true, email: true },
      orderBy: { id: "asc" },
      take: PAGE,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    });
    if (page.length === 0) break;

    const result = await prisma.campaignRecipient.createMany({
      data: page
        .filter((p) => p.email)
        .map((p) => ({ campaignId, prospectId: p.id, email: p.email as string })),
      skipDuplicates: true,
    });
    ajoutes += result.count;
    cursor = page[page.length - 1].id;
    if (page.length < PAGE) break;
  }

  const totalCibles = await prisma.campaignRecipient.count({ where: { campaignId } });
  await prisma.emailCampaign.update({ where: { id: campaignId }, data: { totalCibles } });

  return { totalCibles, ajoutes };
}

// ─── Envoi ───────────────────────────────────────────────

export interface SendBatchResult {
  envoyes: number;
  echecs: number;
  ignores: number;
  /** Reste-t-il des destinataires en attente ? */
  restant: number;
  termine: boolean;
}

/**
 * Envoie un lot de la campagne.
 *
 * Chaque destinataire est rendu individuellement (personnalisation) puis expédié
 * via l'API batch de Resend — un seul appel réseau pour 100 messages, ce qui
 * respecte la limite de débit du fournisseur.
 */
export async function sendCampaignBatch(
  campaignId: string,
  opts: { limit?: number } = {},
): Promise<SendBatchResult> {
  const limit = Math.min(opts.limit ?? BATCH_SIZE, BATCH_SIZE);

  const campaign = await prisma.emailCampaign.findUnique({ where: { id: campaignId } });
  if (!campaign) throw new Error("Campagne introuvable.");
  if (campaign.statut === "PAUSEE" || campaign.statut === "ANNULEE") {
    throw new Error(`Campagne ${campaign.statut.toLowerCase()} : envoi interrompu.`);
  }

  const pending = await prisma.campaignRecipient.findMany({
    where: { campaignId, status: "EN_ATTENTE" },
    include: {
      prospect: {
        select: {
          id: true,
          nom: true,
          raisonSociale: true,
          ville: true,
          codePostal: true,
          departement: true,
          email: true,
          emailValide: true,
          telephone: true,
          siteWeb: true,
          agrementNumber: true,
          contactNom: true,
          contactPrenom: true,
          contactFonction: true,
          unsubscribeToken: true,
          unsubscribedAt: true,
          statut: true,
        },
      },
    },
    orderBy: { createdAt: "asc" },
    take: limit,
  });

  if (pending.length === 0) {
    await finalizeIfDone(campaignId);
    return { envoyes: 0, echecs: 0, ignores: 0, restant: 0, termine: true };
  }

  if (campaign.statut !== "EN_COURS") {
    await prisma.emailCampaign.update({
      where: { id: campaignId },
      data: { statut: "EN_COURS", startedAt: campaign.startedAt ?? new Date() },
    });
  }

  // ── Filtre de dernière seconde ──
  // Un prospect peut s'être désinscrit entre la préparation et l'envoi : on
  // revérifie systématiquement plutôt que de faire confiance à la liste figée.
  const sendable: typeof pending = [];
  let ignores = 0;
  for (const recipient of pending) {
    const p = recipient.prospect;
    const bloque = !p.email || !p.emailValide || p.unsubscribedAt !== null || p.statut === "DESABONNE" || p.statut === "INJOIGNABLE";
    if (bloque) {
      await prisma.campaignRecipient.update({
        where: { id: recipient.id },
        data: { status: "IGNORE", error: "Désinscrit ou email invalide au moment de l'envoi" },
      });
      ignores++;
      continue;
    }
    sendable.push(recipient);
  }

  let envoyes = 0;
  let echecs = 0;

  if (sendable.length > 0) {
    const from = buildFrom(campaign.fromName);
    const rendered = sendable.map((recipient) => {
      const email = renderCampaignEmail({
        sujet: campaign.sujet,
        contenu: campaign.contenu,
        fromName: campaign.fromName,
        prospect: { ...recipient.prospect, unsubscribeToken: recipient.prospect.unsubscribeToken },
      });
      return { recipient, email };
    });

    const payload = rendered.map(({ recipient, email }) => ({
      from,
      to: recipient.email,
      subject: email.subject,
      html: email.html,
      ...(campaign.replyTo ? { replyTo: campaign.replyTo } : {}),
      headers: {
        // En-tête standard : certains clients affichent un bouton natif de
        // désinscription, ce qui vaut mieux qu'un signalement en spam.
        "List-Unsubscribe": `<${process.env.NEXT_PUBLIC_APP_URL ?? "https://byspermis.fr"}/desabonnement/${recipient.prospect.unsubscribeToken}>`,
        "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
      },
    }));

    const { data, error } = await resend.batch.send(payload);

    if (error) {
      // Échec global du lot (clé invalide, quota, domaine non vérifié) : on
      // marque tout le lot en échec, le cron réessaiera après correction.
      const message = error.message ?? error.name ?? "erreur inconnue";
      console.error("[campaign] échec lot Resend:", error);
      await prisma.campaignRecipient.updateMany({
        where: { id: { in: sendable.map((r) => r.id) } },
        data: { status: "ECHEC", error: message.slice(0, 500) },
      });
      echecs = sendable.length;
      await logEmail({
        destinataire: `${sendable.length} destinataires`,
        sujet: campaign.sujet,
        status: "ECHEC",
        error: message,
        kind: CAMPAIGN_EMAIL_KIND,
      });
    } else {
      const ids = (data?.data ?? []) as { id?: string }[];
      const now = new Date();

      await Promise.all(
        rendered.map(async ({ recipient }, index) => {
          const providerId = ids[index]?.id ?? null;
          await prisma.campaignRecipient.update({
            where: { id: recipient.id },
            data: { status: "ENVOYE", sentAt: now, providerId, error: null },
          });
          await prisma.prospect.update({
            where: { id: recipient.prospectId },
            data: {
              nbEmailsEnvoyes: { increment: 1 },
              lastContactedAt: now,
              // NOUVEAU/A_CONTACTER → CONTACTE ; un prospect déjà contacté
              // passe en RELANCE. Les statuts « travaillés » (INTERESSE,
              // INSCRIT, REFUSE) ne sont pas rétrogradés.
              statut:
                recipient.prospect.statut === "NOUVEAU" || recipient.prospect.statut === "A_CONTACTER"
                  ? "CONTACTE"
                  : recipient.prospect.statut === "CONTACTE"
                    ? "RELANCE"
                    : recipient.prospect.statut,
            },
          });
        }),
      );

      envoyes = rendered.length;
      await logEmail({
        destinataire: `${envoyes} destinataires (campagne ${campaign.nom})`,
        sujet: campaign.sujet,
        status: "ENVOYE",
        providerId: ids[0]?.id ?? null,
        kind: CAMPAIGN_EMAIL_KIND,
      });
    }
  }

  await prisma.emailCampaign.update({
    where: { id: campaignId },
    data: {
      nbEnvoyes: { increment: envoyes },
      nbEchecs: { increment: echecs },
    },
  });

  const restant = await prisma.campaignRecipient.count({ where: { campaignId, status: "EN_ATTENTE" } });
  const termine = restant === 0;
  if (termine) await finalizeIfDone(campaignId);

  return { envoyes, echecs, ignores, restant, termine };
}

async function finalizeIfDone(campaignId: string): Promise<void> {
  const restant = await prisma.campaignRecipient.count({ where: { campaignId, status: "EN_ATTENTE" } });
  if (restant > 0) return;
  const campaign = await prisma.emailCampaign.findUnique({
    where: { id: campaignId },
    select: { statut: true, finishedAt: true },
  });
  if (!campaign || campaign.statut === "ENVOYEE" || campaign.statut === "ANNULEE") return;
  await prisma.emailCampaign.update({
    where: { id: campaignId },
    data: { statut: "ENVOYEE", finishedAt: campaign.finishedAt ?? new Date() },
  });
}

/**
 * Envoi d'un email de test à une adresse arbitraire, avec les données d'un
 * prospect réel (ou un jeu d'exemple) — sans toucher aux compteurs.
 */
export async function sendCampaignTest(params: {
  campaignId: string;
  to: string;
  prospectId?: string | null;
}): Promise<void> {
  const campaign = await prisma.emailCampaign.findUnique({ where: { id: params.campaignId } });
  if (!campaign) throw new Error("Campagne introuvable.");

  const prospect = params.prospectId
    ? await prisma.prospect.findUnique({ where: { id: params.prospectId } })
    : await prisma.prospect.findFirst({ where: buildAudienceWhere((campaign.filtre ?? {}) as AudienceFilter) });

  const sample = prospect ?? {
    nom: "Centre de démonstration",
    raisonSociale: "CENTRE DEMO SARL",
    ville: "Cergy",
    codePostal: "95000",
    departement: "95",
    email: params.to,
    telephone: "01 23 45 67 89",
    siteWeb: null,
    agrementNumber: "R 21 095 0001 0",
    contactNom: "Dupont",
    contactPrenom: "Marc",
    contactFonction: "Gérant",
    unsubscribeToken: "apercu-test",
  };

  const email = renderCampaignEmail({
    sujet: campaign.sujet,
    contenu: campaign.contenu,
    fromName: campaign.fromName,
    prospect: sample,
  });

  const { error } = await resend.emails.send({
    from: buildFrom(campaign.fromName),
    to: params.to,
    subject: `[TEST] ${email.subject}`,
    html: email.html,
    ...(campaign.replyTo ? { replyTo: campaign.replyTo } : {}),
  });
  if (error) throw new Error(`Resend: ${error.message ?? error.name}`);

  await logEmail({
    destinataire: params.to,
    sujet: `[TEST] ${email.subject}`,
    status: "ENVOYE",
    kind: CAMPAIGN_EMAIL_KIND,
  });
}
