import "dotenv/config";
import { prisma } from "../src/lib/prisma";

const SCOPE_RE = /(récup|recup|sensib|48|probatoire)/i;
const TITLE_RE = /(récupération de points|recuperation de points|stage 48|sensibilisation|probatoire)/i;

async function main() {
  // 1. Verify the queries that were 500ing (include on reservation + session)
  let statsOk = false;
  try {
    await prisma.reservation.findMany({
      include: { user: true, session: { include: { formation: true } } },
      take: 1,
    });
    await prisma.questionnaireResponse.findMany({ where: { type: "PLATFORM" }, take: 1 });
    statsOk = true;
  } catch (e) {
    console.log("QUERY STILL FAILS:", e instanceof Error ? e.message : e);
  }
  console.log("includeQueriesOk:", statsOk);

  // 2. Off-scope formations
  const formations = await prisma.formation.findMany({
    select: {
      id: true, titre: true, slug: true, isActive: true,
      categorie: { select: { nom: true } },
      centre: { select: { nom: true, ville: true } },
      _count: { select: { sessions: true } },
    },
  });
  const offScopeForms = formations.filter((f) => {
    const cat = f.categorie?.nom ?? "";
    return !SCOPE_RE.test(cat) && !TITLE_RE.test(f.titre);
  });

  // 3. Off-scope blog articles + duplicates
  const articles = await prisma.article.findMany({
    select: { id: true, titre: true, slug: true, isPublished: true, createdAt: true },
    orderBy: { createdAt: "asc" },
  });
  const offScopeArticles = articles.filter((a) => {
    const t = `${a.titre} ${a.slug}`;
    return /(fimo|fco|marchandise|conducteur.?pro)/i.test(t);
  });
  // duplicate detection: same normalized title base
  const seen = new Map<string, string[]>();
  for (const a of articles) {
    const base = a.titre.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim().slice(0, 40);
    const arr = seen.get(base) ?? [];
    arr.push(a.slug);
    seen.set(base, arr);
  }
  const dupes = [...seen.entries()].filter(([, slugs]) => slugs.length > 1);

  console.log("\n=== FORMATIONS HORS-SCOPE (" + offScopeForms.length + "/" + formations.length + ") ===");
  for (const f of offScopeForms) {
    console.log(`- [${f.id}] "${f.titre}" | cat=${f.categorie?.nom ?? "—"} | ${f.centre.nom} ${f.centre.ville} | sessions=${f._count.sessions} | active=${f.isActive}`);
  }

  console.log("\n=== ARTICLES HORS-SCOPE (" + offScopeArticles.length + "/" + articles.length + ") ===");
  for (const a of offScopeArticles) {
    console.log(`- [${a.id}] "${a.titre}" | /${a.slug}`);
  }

  console.log("\n=== TITRES EN DOUBLON (" + dupes.length + " groupes) ===");
  for (const [base, slugs] of dupes) {
    console.log(`- "${base}…" -> ${slugs.length}x : ${slugs.join(", ")}`);
  }

  console.log("\n=== TOTAUX ===");
  console.log("articles total:", articles.length, "| formations total:", formations.length);
}

main().finally(() => prisma.$disconnect());
