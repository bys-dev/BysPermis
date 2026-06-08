import "dotenv/config";
import { prisma } from "../src/lib/prisma";

const SLUGS = {
  recup: "stage-recuperation-points-osny",
  n48: "stage-48n-probatoire-osny",
  weekend: "stage-volontaire-weekend-osny",
} as const;

const IMAGES: Record<keyof typeof SLUGS, string> = {
  recup: "https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?auto=format&fit=crop&w=1200&q=80",
  n48: "https://images.unsplash.com/photo-1486325212027-8081e485255e?auto=format&fit=crop&w=1200&q=80",
  weekend: "https://images.unsplash.com/photo-1494412574643-ff11b0a5c1c3?auto=format&fit=crop&w=1200&q=80",
};

const REVIEWS: Record<keyof typeof SLUGS, { note: number; notePrecise: number; commentaire: string }[]> = {
  recup: [
    { note: 5, notePrecise: 5, commentaire: "Excellent stage, formateurs très pédagogues. Salle confortable et accueil au top. Je recommande sans hésiter." },
    { note: 5, notePrecise: 4.5, commentaire: "Deux jours qui passent vite, contenu très riche. Vraiment utile, ça remet bien les idées en place sur la conduite." },
    { note: 4, notePrecise: 4, commentaire: "Stage bien organisé, horaires respectés. Le psychologue était très intéressant, beaucoup d'échanges entre stagiaires." },
    { note: 5, notePrecise: 5, commentaire: "Réservation en ligne ultra simple, attestation reçue le lendemain. Centre BYS Osny au top, je reviendrai si besoin." },
  ],
  n48: [
    { note: 5, notePrecise: 5, commentaire: "Reçu ma 48N à 22 ans, stage hyper rassurant. Les formateurs n'ont pas du tout jugé, ambiance bienveillante." },
    { note: 4, notePrecise: 4.5, commentaire: "Très bonne formation pour les jeunes permis. Beaucoup d'infos pratiques sur les distracteurs (téléphone, GPS)." },
    { note: 4, notePrecise: 4, commentaire: "Stage utile pour récupérer les points avant le délai des 4 mois. Le centre m'a aidé pour la demande de remboursement de l'amende." },
  ],
  weekend: [
    { note: 5, notePrecise: 5, commentaire: "Format weekend parfait pour les actifs ! J'ai pu faire mon stage sans poser de jours. Centre BYS impeccable." },
    { note: 4, notePrecise: 4.5, commentaire: "Samedi-dimanche bien rythmé, on ne s'ennuie pas. Échanges intéressants avec d'autres stagiaires aux profils variés." },
    { note: 5, notePrecise: 4.5, commentaire: "Très bon stage, je n'avais pas envie de poser deux jours en semaine. Le weekend c'est l'idéal. Merci à l'équipe." },
  ],
};

async function main() {
  const formations = await prisma.formation.findMany({
    where: { slug: { in: Object.values(SLUGS) } },
    select: { id: true, slug: true, titre: true, image: true },
  });
  const bySlug = new Map(formations.map((f) => [f.slug, f]));

  // ── Images ──
  for (const [key, slug] of Object.entries(SLUGS) as [keyof typeof SLUGS, string][]) {
    const f = bySlug.get(slug);
    if (!f) { console.log(`⚠ formation ${slug} introuvable`); continue; }
    if (f.image) { console.log(`  ↺ image déjà présente pour "${f.titre}"`); continue; }
    await prisma.formation.update({ where: { id: f.id }, data: { image: IMAGES[key] } });
    console.log(`  + image sur "${f.titre}"`);
  }

  // ── Reviews ──
  const eleves = await prisma.user.findMany({
    where: { role: "ELEVE" },
    select: { id: true, prenom: true, nom: true },
    take: 15,
    orderBy: { createdAt: "asc" },
  });
  if (eleves.length < 5) throw new Error("Pas assez d'élèves pour générer des avis");
  let idx = 0;

  for (const [key, slug] of Object.entries(SLUGS) as [keyof typeof SLUGS, string][]) {
    const f = bySlug.get(slug);
    if (!f) continue;
    for (const r of REVIEWS[key]) {
      const user = eleves[idx % eleves.length]; idx++;
      const existing = await prisma.review.findUnique({
        where: { userId_formationId: { userId: user.id, formationId: f.id } },
        select: { id: true },
      });
      if (existing) { console.log(`  ↺ avis ${user.prenom} sur "${f.titre}" déjà présent`); continue; }
      await prisma.review.create({
        data: { userId: user.id, formationId: f.id, note: r.note, notePrecise: r.notePrecise, commentaire: r.commentaire },
      });
      console.log(`  + avis ★${r.notePrecise} de ${user.prenom} sur "${f.titre}"`);
    }
  }

  // ── Session bonus weekend (sam 13 – dim 14 juin) sur la formation weekend ──
  const weekendForm = bySlug.get(SLUGS.weekend);
  if (weekendForm) {
    const dateDebut = new Date(2026, 5, 13, 9, 0, 0); // 13 juin samedi
    const exists = await prisma.session.findFirst({ where: { formationId: weekendForm.id, dateDebut }, select: { id: true } });
    if (!exists) {
      await prisma.session.create({
        data: {
          formationId: weekendForm.id, dateDebut,
          dateFin: new Date(2026, 5, 14, 17, 0, 0),
          placesTotal: 20, placesRestantes: 20, status: "ACTIVE",
          horaires: "9h00 – 12h30 / 13h30 – 17h00",
        },
      });
      console.log(`  + session 13-14/06 (weekend bonus) sur "${weekendForm.titre}"`);
    } else {
      console.log("  ↺ session 13-14/06 déjà présente");
    }
  }

  console.log("\n✅ Polish démo terminé.");
}

main().finally(() => prisma.$disconnect());
