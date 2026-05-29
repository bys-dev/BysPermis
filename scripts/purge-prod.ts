import "dotenv/config";
import { writeFileSync } from "node:fs";
import { prisma } from "../src/lib/prisma";

const SCOPE_RE = /(récup|recup|sensib|48|probatoire)/i;
const TITLE_RE = /(récupération de points|recuperation de points|stage 48|sensibilisation|probatoire)/i;
const APPLY = process.env.APPLY === "1";

async function main() {
  // ── Identify off-scope formations ──
  const formations = await prisma.formation.findMany({
    select: {
      id: true, titre: true, slug: true, isActive: true, categorieId: true,
      categorie: { select: { id: true, nom: true } },
      centre: { select: { nom: true } },
      sessions: { select: { id: true } },
    },
  });
  const offForms = formations.filter((f) => !SCOPE_RE.test(f.categorie?.nom ?? "") && !TITLE_RE.test(f.titre));
  const offFormIds = offForms.map((f) => f.id);
  const offSessionIds = offForms.flatMap((f) => f.sessions.map((s) => s.id));

  // ── Articles to delete: FIMO/FCO + "édition 2" duplicates ──
  const articles = await prisma.article.findMany({ select: { id: true, titre: true, slug: true } });
  const delArticles = articles.filter(
    (a) => /(fimo|fco|marchandise|conducteur.?pro)/i.test(`${a.titre} ${a.slug}`) || /edition-2/i.test(a.slug),
  );
  const delArticleIds = delArticles.map((a) => a.id);

  // ── Reservation guard ──
  const reservationsOnOffScope = offSessionIds.length
    ? await prisma.reservation.count({ where: { sessionId: { in: offSessionIds } } })
    : 0;

  // ── Backup ──
  const backup = {
    generatedAt: new Date().toISOString(),
    formations: await prisma.formation.findMany({
      where: { id: { in: offFormIds } },
      include: { sessions: true, reviews: true, favorites: true },
    }),
    articles: await prisma.article.findMany({ where: { id: { in: delArticleIds } } }),
  };
  const backupPath = `scripts/backup-purge-${Date.now()}.json`;
  writeFileSync(backupPath, JSON.stringify(backup, null, 2), "utf8");

  console.log("=== CIBLES PURGE ===");
  console.log("Formations hors-scope:", offForms.length, offForms.map((f) => f.titre));
  console.log("Sessions liées:", offSessionIds.length);
  console.log("Réservations sur ces sessions:", reservationsOnOffScope);
  console.log("Articles à supprimer:", delArticles.length, delArticles.map((a) => a.slug));
  console.log("Backup écrit:", backupPath);

  if (!APPLY) {
    console.log("\n[DRY-RUN] APPLY!=1 — aucune suppression effectuée.");
    return;
  }

  // ── Blog: always safe (no reservation dependency) ──
  const artDeleted = await prisma.article.deleteMany({ where: { id: { in: delArticleIds } } });
  console.log("\n[BLOG] Articles supprimés:", artDeleted.count);

  const PURGE_RES = process.env.PURGE_RESERVATIONS === "1";
  if (reservationsOnOffScope > 0 && !PURGE_RES) {
    console.log(`\n[FORMATIONS — SKIP] ${reservationsOnOffScope} réservations sur les formations hors-scope. Relancer avec PURGE_RESERVATIONS=1 pour cascader.`);
    return;
  }

  // ── Delete formations + (optionally) their reservations & children ──
  const result = await prisma.$transaction(async (tx) => {
    let resChildren = { invoices: 0, reviews: 0, questionnaires: 0, messages: 0, reservations: 0 };
    if (offSessionIds.length) {
      const resIds = (await tx.reservation.findMany({ where: { sessionId: { in: offSessionIds } }, select: { id: true } })).map((r) => r.id);
      if (resIds.length) {
        const inv = await tx.invoice.deleteMany({ where: { reservationId: { in: resIds } } });
        const rvw = await tx.review.deleteMany({ where: { reservationId: { in: resIds } } });
        const qst = await tx.questionnaireResponse.deleteMany({ where: { reservationId: { in: resIds } } });
        const msg = await tx.message.deleteMany({ where: { reservationId: { in: resIds } } });
        const rsv = await tx.reservation.deleteMany({ where: { id: { in: resIds } } });
        resChildren = { invoices: inv.count, reviews: rvw.count, questionnaires: qst.count, messages: msg.count, reservations: rsv.count };
      }
    }
    const rev = await tx.review.deleteMany({ where: { formationId: { in: offFormIds } } });
    const fav = await tx.favorite.deleteMany({ where: { formationId: { in: offFormIds } } });
    const ses = await tx.session.deleteMany({ where: { formationId: { in: offFormIds } } });
    const frm = await tx.formation.deleteMany({ where: { id: { in: offFormIds } } });
    const art = { count: 0 };
    // orphan off-scope categories
    const offCatIds = [...new Set(offForms.map((f) => f.categorie?.id).filter((x): x is string => !!x))];
    let cat = { count: 0 };
    if (offCatIds.length) {
      const stillUsed = await tx.formation.findMany({ where: { categorieId: { in: offCatIds } }, select: { categorieId: true } });
      const usedSet = new Set(stillUsed.map((f) => f.categorieId));
      const toDelete = offCatIds.filter((id) => !usedSet.has(id));
      if (toDelete.length) cat = await tx.categorie.deleteMany({ where: { id: { in: toDelete } } });
    }
    return { ...resChildren, reviewsOnForm: rev.count, favorites: fav.count, sessions: ses.count, formations: frm.count, articles: art.count, categories: cat.count };
  });

  console.log("\n[APPLIQUÉ] Supprimé:", result);

  // verification
  const remForms = await prisma.formation.count();
  const remArts = await prisma.article.count();
  console.log("Restant — formations:", remForms, "| articles:", remArts);
}

main().finally(() => prisma.$disconnect());
