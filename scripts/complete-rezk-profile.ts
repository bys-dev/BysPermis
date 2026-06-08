import "dotenv/config";
import { prisma } from "../src/lib/prisma";

const EMAIL = "alloecotransport78@gmail.com";

async function main() {
  const user = await prisma.user.findUnique({ where: { email: EMAIL }, select: { id: true, prenom: true, nom: true, role: true } });
  if (!user) throw new Error(`User ${EMAIL} introuvable`);
  console.log("User:", user.prenom, user.nom, "| role:", user.role);

  // Trouver le centre (userId 1-1)
  let centre = await prisma.centre.findFirst({
    where: { userId: user.id },
    select: { id: true, nom: true, description: true, adresse: true, codePostal: true, ville: true, telephone: true, email: true, presentationHtml: true, statut: true, stripeOnboardingDone: true, profilCompletionPct: true, slug: true },
  });

  if (!centre) {
    // Créer le centre si absent
    const created = await prisma.centre.create({
      data: {
        userId: user.id,
        nom: "Allo Ecole Transport 78",
        slug: "allo-ecole-transport-78",
        adresse: "18 rue des Tests",
        codePostal: "95002",
        ville: "Osny",
      },
      select: { id: true, nom: true, description: true, adresse: true, codePostal: true, ville: true, telephone: true, email: true, presentationHtml: true, statut: true, stripeOnboardingDone: true, profilCompletionPct: true, slug: true },
    });
    centre = created;
    console.log("Centre créé:", created.nom);
  }

  const description = "TEST — Description du centre Allo Ecole Transport 78. Centre de test agréé Préfecture pour les stages de récupération de points. Données de démo, à remplacer par les vraies informations du centre.";
  const presentationHtml = "<p><strong>TEST — Allo Ecole Transport 78</strong> (centre de démo). Bienvenue sur la page de présentation du centre. Ce contenu est une donnée de test générée pour la démo plateforme — à remplacer par la vraie présentation rédigée par le centre.</p><p>Stage de sensibilisation à la sécurité routière sur 2 jours (14 h), animé par un psychologue et un expert sécurité routière. Récupération jusqu'à 4 points. Attestation remise en fin de stage, points crédités le lendemain.</p>";

  const updated = await prisma.centre.update({
    where: { id: centre.id },
    data: {
      nom: "TEST — Allo Ecole Transport 78",
      description: description, // 50+ chars, marqué TEST
      adresse: "TEST — 18 rue de la Démo",
      codePostal: "95520",
      ville: "Osny",
      telephone: "01 00 00 00 00",
      email: EMAIL,
      presentationHtml,
      statut: "ACTIF",
      stripeOnboardingDone: true, // pour la complétion Paiement — compte plateforme prend le paiement
      profilCompletionPct: 100,
      isActive: true,
    },
    select: { id: true, slug: true },
  });
  console.log("✅ Profil centre rempli (statut ACTIF, completion 100%)");

  // Catégorie récup
  const categorie = await prisma.categorie.findFirst({ where: { nom: { contains: "récup", mode: "insensitive" } }, select: { id: true } });

  // Formation + session
  const formationSlug = "stage-recuperation-points-allo-ecole-transport-78";
  const existingForm = await prisma.formation.findUnique({ where: { slug: formationSlug }, select: { id: true } });
  if (existingForm) {
    await prisma.formation.update({
      where: { id: existingForm.id },
      data: {
        titre: "TEST — Stage récupération de points (démo)",
        description: "TEST — Stage de sensibilisation à la sécurité routière sur 2 jours (14 h). Données de démo : titre, description et programme à remplacer par les vrais contenus du centre. Récupération jusqu'à 4 points.",
        objectifs: "TEST — Récupérer jusqu'à 4 points. Comprendre les causes des infractions. Adopter une conduite responsable.",
        programme: "TEST — Jour 1 : accueil, infractions, vitesse, distances. Jour 2 : alcool/stupéfiants, vigilance, distracteurs, bilan.",
        prerequis: "TEST — Permis valide, au moins 1 point, pas de stage dans les 12 derniers mois.",
        publicCible: "TEST — Conducteurs souhaitant récupérer des points (volontaire ou 48N/48SI).",
        lieu: "TEST — Allo Ecole Transport 78 — Osny",
      },
    });
    console.log("✅ Formation existante mise à jour avec marqueurs TEST");
  } else {
    const today = new Date(2026, 5, 8);
    const day = (off: number, h = 9) => { const d = new Date(today); d.setDate(d.getDate() + off); d.setHours(h, 0, 0, 0); return d; };
    const form = await prisma.formation.create({
      data: {
        centreId: updated.id, categorieId: categorie?.id ?? null,
        titre: "TEST — Stage récupération de points (démo)",
        slug: formationSlug,
        description: "TEST — Stage de sensibilisation à la sécurité routière sur 2 jours (14 h). Données de démo : titre, description et programme à remplacer par les vrais contenus du centre. Récupération jusqu'à 4 points.",
        objectifs: "TEST — Récupérer jusqu'à 4 points. Comprendre les causes des infractions. Adopter une conduite responsable.",
        programme: "TEST — Jour 1 : accueil, infractions, vitesse, distances. Jour 2 : alcool/stupéfiants, vigilance, distracteurs, bilan.",
        prerequis: "TEST — Permis valide, au moins 1 point, pas de stage dans les 12 derniers mois.",
        publicCible: "TEST — Conducteurs souhaitant récupérer des points (volontaire ou 48N/48SI).",
        duree: "2 jours (14 h)", prix: 230, modalite: "PRESENTIEL", lieu: "TEST — Allo Ecole Transport 78 — Osny",
        isQualiopi: true, isCPF: false, isActive: true,
        stageType: "VOLONTAIRE", pointsRecovered: 4,
        image: "https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?auto=format&fit=crop&w=1200&q=80",
        sessions: {
          create: [
            { dateDebut: day(7, 9), dateFin: day(8, 17), placesTotal: 15, placesRestantes: 15, status: "ACTIVE", horaires: "9h00 – 12h30 / 13h30 – 17h00" }, // 15-16 juin
            { dateDebut: day(28, 9), dateFin: day(29, 17), placesTotal: 15, placesRestantes: 15, status: "ACTIVE", horaires: "9h00 – 12h30 / 13h30 – 17h00" }, // 6-7 juillet
          ],
        },
      },
      include: { sessions: true },
    });
    console.log(`✅ Formation créée: ${form.titre} (${form.sessions.length} sessions)`);
  }

  console.log("\n🎯 Centre prêt pour la démo — accès via /espace-centre/dashboard");
}

main().finally(() => prisma.$disconnect());
