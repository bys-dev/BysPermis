import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new (PrismaClient as any)({ adapter }) as InstanceType<typeof PrismaClient>;

async function main() {
  console.log("🌱 Début du seeding...\n");

  // ─── NETTOYAGE (ordre inverse des dépendances) ───────────
  console.log("🗑️  Suppression des données existantes...");
  await (prisma as any).favorite.deleteMany();
  await (prisma as any).message.deleteMany();
  await (prisma as any).article.deleteMany();
  await (prisma as any).promoCode.deleteMany();
  await (prisma as any).invoice.deleteMany();
  await (prisma as any).emailTemplate.deleteMany();
  await (prisma as any).notification.deleteMany();
  await (prisma as any).reservation.deleteMany();
  await (prisma as any).session.deleteMany();
  await (prisma as any).formation.deleteMany();
  await (prisma as any).centreMembre.deleteMany();
  await (prisma as any).centre.deleteMany();
  await (prisma as any).ticketMessage.deleteMany();
  await (prisma as any).ticket.deleteMany();
  await (prisma as any).user.deleteMany();
  await (prisma as any).categorie.deleteMany();
  await (prisma as any).faqItem.deleteMany();
  await (prisma as any).subscriptionPlan.deleteMany();
  await (prisma as any).platformSettings.deleteMany();
  console.log("✅ Données supprimées.\n");

  // ─── 1. CATÉGORIES ───────────────────────────────────────
  console.log("📂 Création des catégories...");
  const categories = await Promise.all([
    (prisma as any).categorie.create({
      data: {
        nom: "Récupération de points",
        description: "Stages agréés de récupération de points sur le permis de conduire. Récupérez jusqu'à 4 points en 2 jours.",
        icon: "shield",
        couleur: "#3B82F6",
        ordre: 1,
      },
    }),
    (prisma as any).categorie.create({
      data: {
        nom: "Permis B",
        description: "Formation complète au permis de conduire voiture. Apprentissage du code de la route et de la conduite.",
        icon: "car",
        couleur: "#10B981",
        ordre: 2,
      },
    }),
    (prisma as any).categorie.create({
      data: {
        nom: "FIMO Marchandises",
        description: "Formation Initiale Minimale Obligatoire pour le transport de marchandises. Obligatoire pour conduire des véhicules de plus de 3,5 tonnes.",
        icon: "truck",
        couleur: "#F59E0B",
        ordre: 3,
      },
    }),
    (prisma as any).categorie.create({
      data: {
        nom: "FCO Marchandises",
        description: "Formation Continue Obligatoire pour les conducteurs de transport de marchandises. Renouvellement tous les 5 ans.",
        icon: "truck",
        couleur: "#EF4444",
        ordre: 4,
      },
    }),
    (prisma as any).categorie.create({
      data: {
        nom: "Transport de personnes",
        description: "Formations pour le transport de voyageurs : FIMO, FCO et capacité professionnelle.",
        icon: "bus",
        couleur: "#8B5CF6",
        ordre: 5,
      },
    }),
    (prisma as any).categorie.create({
      data: {
        nom: "Sensibilisation sécurité routière",
        description: "Stages de sensibilisation aux risques routiers pour les entreprises et les particuliers.",
        icon: "warning",
        couleur: "#F97316",
        ordre: 6,
      },
    }),
    (prisma as any).categorie.create({
      data: {
        nom: "Permis moto",
        description: "Formation au permis A1, A2 et passerelle A. Conduisez en toute sécurité sur deux roues.",
        icon: "motorcycle",
        couleur: "#06B6D4",
        ordre: 7,
      },
    }),
    (prisma as any).categorie.create({
      data: {
        nom: "Eco-conduite",
        description: "Apprenez à conduire de manière économique et écologique. Réduisez votre consommation de carburant jusqu'à 15%.",
        icon: "leaf",
        couleur: "#22C55E",
        ordre: 8,
      },
    }),
  ]);

  const [catRecup, catPermisB, catFIMO, catFCO, catTransport, catSensibilisation, catMoto, catEco] = categories;
  console.log(`✅ ${categories.length} catégories créées.\n`);

  // ─── 1b. PLANS D'ABONNEMENT ──────────────────────────────
  console.log("💎 Création des plans d'abonnement...");
  const subscriptionPlans = await Promise.all([
    (prisma as any).subscriptionPlan.create({
      data: {
        nom: "Essentiel",
        stripePriceId: "price_essentiel_placeholder",
        prix: 49,
        features: [
          "Listing sur la marketplace",
          "Gestion des sessions",
          "Convocations automatiques",
          "Support par email",
          "Paiements automatiques",
        ],
        maxFormations: 5,
        isFeatured: false,
        commissionRate: 10,
        isActive: true,
        ordre: 1,
      },
    }),
    (prisma as any).subscriptionPlan.create({
      data: {
        nom: "Premium",
        stripePriceId: "price_premium_placeholder",
        prix: 99,
        features: [
          "Listing sur la marketplace",
          "Gestion des sessions",
          "Convocations automatiques",
          "Support prioritaire",
          "Paiements automatiques",
          "Mise en avant dans les résultats",
          "Dashboard analytics",
        ],
        maxFormations: 20,
        isFeatured: true,
        commissionRate: 7,
        isActive: true,
        ordre: 2,
      },
    }),
    (prisma as any).subscriptionPlan.create({
      data: {
        nom: "Entreprise",
        stripePriceId: "price_entreprise_placeholder",
        prix: 199,
        features: [
          "Listing sur la marketplace",
          "Gestion des sessions",
          "Convocations automatiques",
          "Support prioritaire",
          "Paiements automatiques",
          "Mise en avant dans les résultats",
          "Dashboard analytics",
          "Account manager dédié",
          "Accès API",
        ],
        maxFormations: 99999,
        isFeatured: true,
        commissionRate: 5,
        isActive: true,
        ordre: 3,
      },
    }),
  ]);
  console.log(`✅ ${subscriptionPlans.length} plans d'abonnement créés.\n`);

  // ─── 2. UTILISATEURS ─────────────────────────────────────
  console.log("👤 Création des utilisateurs...");

  // Owner (super-propriétaire plateforme)
  const owner = await (prisma as any).user.create({
    data: {
      auth0Id: "auth0|owner001",
      email: "sebastien@bys-formation.fr",
      nom: "Moreau",
      prenom: "Sébastien",
      telephone: "06 12 34 56 78",
      adresse: "15 Rue de la Paix",
      codePostal: "95520",
      ville: "Osny",
      role: "OWNER",
    },
  });

  // Admin plateforme
  const admin = await (prisma as any).user.create({
    data: {
      auth0Id: "auth0|admin001",
      email: "admin@bys-formation.fr",
      nom: "Renault",
      prenom: "Julien",
      telephone: "06 10 20 30 40",
      adresse: "5 Rue Victor Hugo",
      codePostal: "75015",
      ville: "Paris",
      role: "ADMIN",
    },
  });

  // Support plateforme
  const support = await (prisma as any).user.create({
    data: {
      auth0Id: "auth0|support001",
      email: "support@bys-formation.fr",
      nom: "Leroy",
      prenom: "Camille",
      telephone: "06 10 20 30 41",
      adresse: "18 Rue de Rivoli",
      codePostal: "75004",
      ville: "Paris",
      role: "SUPPORT",
    },
  });

  // Comptable plateforme
  const comptable = await (prisma as any).user.create({
    data: {
      auth0Id: "auth0|comptable001",
      email: "comptabilite@bys-formation.fr",
      nom: "Mercier",
      prenom: "Isabelle",
      telephone: "06 10 20 30 42",
      adresse: "32 Avenue Foch",
      codePostal: "75016",
      ville: "Paris",
      role: "COMPTABLE",
    },
  });

  // Commercial plateforme
  const commercial = await (prisma as any).user.create({
    data: {
      auth0Id: "auth0|commercial001",
      email: "commercial@bys-formation.fr",
      nom: "Dubois",
      prenom: "Antoine",
      telephone: "06 10 20 30 43",
      adresse: "11 Boulevard Haussmann",
      codePostal: "75009",
      ville: "Paris",
      role: "COMMERCIAL",
    },
  });

  // Centre owners
  const centreUsers = await Promise.all([
    (prisma as any).user.create({
      data: {
        auth0Id: "auth0|centre001",
        email: "contact@bys-formation.fr",
        nom: "Lambert",
        prenom: "Philippe",
        telephone: "01 34 25 67 89",
        adresse: "Bât. 7, 9 Chaussée Jules César",
        codePostal: "95520",
        ville: "Osny",
        role: "CENTRE_OWNER",
      },
    }),
    (prisma as any).user.create({
      data: {
        auth0Id: "auth0|centre002",
        email: "fatima.benali@autoecole-conduite-plus.fr",
        nom: "Benali",
        prenom: "Fatima",
        telephone: "01 43 55 78 90",
        adresse: "45 Avenue de la République",
        codePostal: "75011",
        ville: "Paris",
        role: "CENTRE_OWNER",
      },
    }),
    (prisma as any).user.create({
      data: {
        auth0Id: "auth0|centre003",
        email: "jm.dupont@cfsr-lyon.fr",
        nom: "Dupont",
        prenom: "Jean-Marc",
        telephone: "04 72 33 45 67",
        adresse: "12 Rue de la Part-Dieu",
        codePostal: "69003",
        ville: "Lyon",
        role: "CENTRE_OWNER",
      },
    }),
    (prisma as any).user.create({
      data: {
        auth0Id: "auth0|centre004",
        email: "nadia@permis-express-marseille.fr",
        nom: "Khelifi",
        prenom: "Nadia",
        telephone: "04 91 22 33 44",
        adresse: "78 Boulevard Michelet",
        codePostal: "13008",
        ville: "Marseille",
        role: "CENTRE_OWNER",
      },
    }),
    (prisma as any).user.create({
      data: {
        auth0Id: "auth0|centre005",
        email: "thomas@securite-routiere-nantes.fr",
        nom: "Lefebvre",
        prenom: "Thomas",
        telephone: "02 40 55 66 77",
        adresse: "22 Rue de Strasbourg",
        codePostal: "44000",
        ville: "Nantes",
        role: "CENTRE_OWNER",
      },
    }),
  ]);

  // Eleves
  const eleves = await Promise.all([
    (prisma as any).user.create({
      data: {
        auth0Id: "auth0|eleve001",
        email: "karim.bouaziz@gmail.com",
        nom: "Bouaziz",
        prenom: "Karim",
        telephone: "06 11 22 33 44",
        adresse: "8 Rue des Lilas",
        codePostal: "75020",
        ville: "Paris",
        role: "ELEVE",
      },
    }),
    (prisma as any).user.create({
      data: {
        auth0Id: "auth0|eleve002",
        email: "marie.durand@outlook.fr",
        nom: "Durand",
        prenom: "Marie",
        telephone: "06 22 33 44 55",
        adresse: "14 Avenue Jean Jaurès",
        codePostal: "69007",
        ville: "Lyon",
        role: "ELEVE",
      },
    }),
    (prisma as any).user.create({
      data: {
        auth0Id: "auth0|eleve003",
        email: "lucas.martin@gmail.com",
        nom: "Martin",
        prenom: "Lucas",
        telephone: "06 33 44 55 66",
        adresse: "27 Boulevard Gambetta",
        codePostal: "13001",
        ville: "Marseille",
        role: "ELEVE",
      },
    }),
    (prisma as any).user.create({
      data: {
        auth0Id: "auth0|eleve004",
        email: "amina.diallo@hotmail.fr",
        nom: "Diallo",
        prenom: "Amina",
        telephone: "06 44 55 66 77",
        adresse: "3 Rue Sainte-Catherine",
        codePostal: "33000",
        ville: "Bordeaux",
        role: "ELEVE",
      },
    }),
    (prisma as any).user.create({
      data: {
        auth0Id: "auth0|eleve005",
        email: "pierre.garnier@free.fr",
        nom: "Garnier",
        prenom: "Pierre",
        telephone: "06 55 66 77 88",
        adresse: "56 Rue Nationale",
        codePostal: "59000",
        ville: "Lille",
        role: "ELEVE",
      },
    }),
    (prisma as any).user.create({
      data: {
        auth0Id: "auth0|eleve006",
        email: "sophie.lemaire@yahoo.fr",
        nom: "Lemaire",
        prenom: "Sophie",
        telephone: "06 66 77 88 99",
        adresse: "19 Allée des Demoiselles",
        codePostal: "31000",
        ville: "Toulouse",
        role: "ELEVE",
      },
    }),
    (prisma as any).user.create({
      data: {
        auth0Id: "auth0|eleve007",
        email: "youssef.elmansouri@gmail.com",
        nom: "El Mansouri",
        prenom: "Youssef",
        telephone: "06 77 88 99 00",
        adresse: "41 Rue du Maréchal Foch",
        codePostal: "44000",
        ville: "Nantes",
        role: "ELEVE",
      },
    }),
    (prisma as any).user.create({
      data: {
        auth0Id: "auth0|eleve008",
        email: "chloe.bernard@laposte.net",
        nom: "Bernard",
        prenom: "Chloé",
        telephone: "06 88 99 00 11",
        adresse: "7 Quai des Bateliers",
        codePostal: "67000",
        ville: "Strasbourg",
        role: "ELEVE",
      },
    }),
    (prisma as any).user.create({
      data: {
        auth0Id: "auth0|eleve009",
        email: "alexandre.petit@orange.fr",
        nom: "Petit",
        prenom: "Alexandre",
        telephone: "06 99 00 11 22",
        adresse: "23 Chaussée Jules César",
        codePostal: "95520",
        ville: "Osny",
        role: "ELEVE",
      },
    }),
  ]);

  console.log(`✅ ${5 + centreUsers.length + eleves.length} utilisateurs créés (owner, admin, support, comptable, commercial + centres + élèves).\n`);

  // ─── 3. CENTRES ──────────────────────────────────────────
  console.log("🏢 Création des centres...");
  const centres = await Promise.all([
    (prisma as any).centre.create({
      data: {
        nom: "BYS Formation Osny",
        slug: "bys-formation-osny",
        description:
          "Centre agréé préfecture du Val-d'Oise, spécialisé dans les stages de récupération de points et la formation professionnelle transport.",
        adresse: "Bât. 7, 9 Chaussée Jules César",
        codePostal: "95520",
        ville: "Osny",
        telephone: "01 34 25 67 89",
        email: "contact@bys-formation.fr",
        siteWeb: "https://www.bys-formation.fr",
        latitude: 49.0665,
        longitude: 2.0633,
        profilCompletionPct: 100,
        statut: "ACTIF",
        isActive: true,
        userId: centreUsers[0].id,
        // Personnalisation
        couleurPrimaire: "#2563EB",
        couleurSecondaire: "#1E40AF",
        presentationHtml: "<p>Bienvenue chez <strong>BYS Formation</strong>, votre centre de formation agréé par la préfecture du Val-d'Oise.</p><p>Nous sommes spécialisés dans les <strong>stages de récupération de points</strong> et la <strong>formation professionnelle transport</strong> (FIMO, FCO). Notre équipe de formateurs expérimentés vous accompagne dans un cadre moderne et convivial.</p><ul><li>Plus de 10 ans d'expérience</li><li>Taux de réussite supérieur à 95%</li><li>Formateurs certifiés et passionnés</li></ul>",
        horaires: "Lundi - Vendredi : 8h30 - 18h30\nSamedi : 9h00 - 13h00\nDimanche : Fermé",
        equipements: ["Salle climatisée", "Parking gratuit", "Wifi", "Simulateur", "Accès PMR", "Véhicules récents"],
        certifications: ["Qualiopi", "Agréé Préfecture", "Datadock", "CPF"],
        reseauxSociaux: {
          facebook: "https://www.facebook.com/bysformation",
          instagram: "https://www.instagram.com/bysformation",
          linkedin: "",
          youtube: "",
        },
      },
    }),
    (prisma as any).centre.create({
      data: {
        nom: "Conduite Plus Paris",
        slug: "conduite-plus-paris",
        description:
          "Auto-école et centre de formation au cœur du 11ème arrondissement de Paris. Stages de récupération de points et formations permis B toute l'année.",
        adresse: "45 Avenue de la République",
        codePostal: "75011",
        ville: "Paris",
        telephone: "01 43 55 78 90",
        email: "contact@autoecole-conduite-plus.fr",
        siteWeb: "https://www.conduite-plus-paris.fr",
        latitude: 48.8566,
        longitude: 2.3522,
        profilCompletionPct: 85,
        statut: "ACTIF",
        isActive: true,
        userId: centreUsers[1].id,
        // Personnalisation
        couleurPrimaire: "#10B981",
        couleurSecondaire: "#059669",
        presentationHtml: "<p><strong>Conduite Plus</strong> est votre auto-école de référence dans le 11ème arrondissement de Paris.</p><p>Que vous souhaitiez passer votre permis B, récupérer vos points ou suivre une formation complémentaire, notre équipe dynamique est là pour vous guider vers la réussite.</p>",
        horaires: "Lundi - Vendredi : 9h00 - 19h00\nSamedi : 10h00 - 17h00\nDimanche : Fermé",
        equipements: ["Salle climatisée", "Wifi", "Salle de code", "Véhicules récents"],
        certifications: ["Agréé Préfecture", "Label qualité"],
        reseauxSociaux: {
          facebook: "https://www.facebook.com/conduiteplus",
          instagram: "https://www.instagram.com/conduiteplus",
          linkedin: "https://www.linkedin.com/company/conduite-plus",
          youtube: "https://www.youtube.com/@conduiteplus",
        },
      },
    }),
    (prisma as any).centre.create({
      data: {
        nom: "CFSR Lyon",
        slug: "cfsr-lyon",
        description:
          "Centre de Formation à la Sécurité Routière en Rhône-Alpes. Agréé préfecture du Rhône, nous proposons des stages de récupération de points, des formations FIMO/FCO et des stages de sensibilisation.",
        adresse: "12 Rue de la Part-Dieu",
        codePostal: "69003",
        ville: "Lyon",
        telephone: "04 72 33 45 67",
        email: "contact@cfsr-lyon.fr",
        siteWeb: "https://www.cfsr-lyon.fr",
        latitude: 45.7640,
        longitude: 4.8357,
        profilCompletionPct: 70,
        statut: "ACTIF",
        isActive: true,
        userId: centreUsers[2].id,
      },
    }),
    (prisma as any).centre.create({
      data: {
        nom: "Permis Express Marseille",
        slug: "permis-express-marseille",
        description:
          "Centre de formation situé dans le 8ème arrondissement de Marseille. Spécialisé dans les stages accélérés de récupération de points et les formations au permis moto.",
        adresse: "78 Boulevard Michelet",
        codePostal: "13008",
        ville: "Marseille",
        telephone: "04 91 22 33 44",
        email: "contact@permis-express-marseille.fr",
        siteWeb: "https://www.permis-express-marseille.fr",
        latitude: 43.2965,
        longitude: 5.3698,
        profilCompletionPct: 60,
        statut: "ACTIF",
        isActive: true,
        userId: centreUsers[3].id,
      },
    }),
    (prisma as any).centre.create({
      data: {
        nom: "Sécurité Routière Nantes",
        slug: "securite-routiere-nantes",
        description:
          "Nouveau centre de formation à Nantes, en attente de validation préfectorale. Nous proposerons des stages de récupération de points et des formations éco-conduite.",
        adresse: "22 Rue de Strasbourg",
        codePostal: "44000",
        ville: "Nantes",
        telephone: "02 40 55 66 77",
        email: "contact@securite-routiere-nantes.fr",
        latitude: 47.2184,
        longitude: -1.5536,
        profilCompletionPct: 30,
        statut: "EN_ATTENTE",
        isActive: false,
        userId: centreUsers[4].id,
      },
    }),
  ]);

  // ─── 3a. MULTI-CENTRE: set activeCentreId + give BYS Osny a second centre ──

  // Set activeCentreId for all centre owners
  await Promise.all(
    centreUsers.map((u: { id: string }, i: number) =>
      (prisma as any).user.update({
        where: { id: u.id },
        data: { activeCentreId: centres[i].id },
      })
    )
  );

  // Give BYS Formation Osny owner (centreUsers[0]) a second centre to demo multi-centre
  const centreOsny2 = await (prisma as any).centre.create({
    data: {
      nom: "BYS Formation Cergy",
      slug: "bys-formation-cergy",
      description:
        "Second centre BYS Formation, situé à Cergy-Pontoise. Stages de récupération de points et formation professionnelle transport.",
      adresse: "5 Place des Merveilles",
      codePostal: "95800",
      ville: "Cergy",
      telephone: "01 34 25 99 88",
      email: "cergy@bys-formation.fr",
      latitude: 49.0363,
      longitude: 2.0780,
      profilCompletionPct: 60,
      statut: "ACTIF",
      isActive: true,
      userId: centreUsers[0].id,
      couleurPrimaire: "#2563EB",
      couleurSecondaire: "#1E40AF",
    },
  });

  console.log(`✅ ${centres.length + 1} centres créés (dont 1 second centre pour BYS Osny).\n`);

  // ─── 3b. MEMBRES DE CENTRES ──────────────────────────────
  console.log("👥 Création des membres de centres...");

  // CENTRE_ADMIN — gestionnaire du centre BYS Osny
  const centreAdmin = await (prisma as any).user.create({
    data: {
      auth0Id: "auth0|centreadmin001",
      email: "gestion@bys-formation.fr",
      nom: "Nguyen",
      prenom: "Linh",
      telephone: "06 20 30 40 50",
      adresse: "10 Rue de la Gare",
      codePostal: "95520",
      ville: "Osny",
      role: "CENTRE_ADMIN",
    },
  });

  // CENTRE_FORMATEUR — moniteur du centre BYS Osny
  const centreFormateur = await (prisma as any).user.create({
    data: {
      auth0Id: "auth0|centreformateur001",
      email: "formateur@bys-formation.fr",
      nom: "Garcia",
      prenom: "Miguel",
      telephone: "06 20 30 40 51",
      adresse: "25 Avenue du Général Leclerc",
      codePostal: "95520",
      ville: "Osny",
      role: "CENTRE_FORMATEUR",
    },
  });

  // CENTRE_SECRETAIRE — secrétaire du centre Conduite Plus Paris
  const centreSecretaire = await (prisma as any).user.create({
    data: {
      auth0Id: "auth0|centresecretaire001",
      email: "secretariat@autoecole-conduite-plus.fr",
      nom: "Petit",
      prenom: "Nathalie",
      telephone: "06 20 30 40 52",
      adresse: "50 Rue Oberkampf",
      codePostal: "75011",
      ville: "Paris",
      role: "CENTRE_SECRETAIRE",
    },
  });

  // Créer les CentreMembre pour les lier aux centres
  await Promise.all([
    (prisma as any).centreMembre.create({
      data: {
        userId: centreAdmin.id,
        centreId: centres[0].id,
        role: "CENTRE_ADMIN",
      },
    }),
    (prisma as any).centreMembre.create({
      data: {
        userId: centreFormateur.id,
        centreId: centres[0].id,
        role: "CENTRE_FORMATEUR",
      },
    }),
    (prisma as any).centreMembre.create({
      data: {
        userId: centreSecretaire.id,
        centreId: centres[1].id,
        role: "CENTRE_SECRETAIRE",
      },
    }),
  ]);

  console.log("✅ 3 membres de centres créés.\n");

  // ─── 4. FORMATIONS ───────────────────────────────────────
  console.log("📚 Création des formations...");

  // BYS Formation Osny — 3 formations
  const formBysRecup = await (prisma as any).formation.create({
    data: {
      titre: "Stage de récupération de points - Osny",
      slug: "stage-recuperation-points-osny",
      description:
        "Stage agréé par la préfecture du Val-d'Oise permettant de récupérer jusqu'à 4 points sur votre permis de conduire. Formation dispensée sur 2 jours consécutifs par des animateurs diplômés BAFM.",
      objectifs:
        "Comprendre les facteurs de risque routier. Prendre conscience de ses comportements dangereux. Adopter une conduite plus responsable. Récupérer jusqu'à 4 points sur son permis.",
      programme:
        "Jour 1 : Accueil et présentation, analyse des infractions, facteurs d'accidents, vitesse et distances de sécurité. Jour 2 : Alcool et stupéfiants, fatigue et vigilance, cas pratiques, bilan et attestation.",
      prerequis: "Être titulaire d'un permis de conduire en cours de validité. Ne pas avoir effectué de stage dans les 12 derniers mois.",
      publicCible: "Conducteurs ayant perdu des points sur leur permis de conduire",
      duree: "2 jours",
      prix: 250,
      modalite: "PRESENTIEL",
      lieu: "Bât. 7, 9 Chaussée Jules César, 95520 Osny",
      isQualiopi: true,
      isCPF: false,
      isActive: true,
      centreId: centres[0].id,
      categorieId: catRecup.id,
    },
  });

  const formBysFIMO = await (prisma as any).formation.create({
    data: {
      titre: "FIMO Marchandises",
      slug: "fimo-marchandises-osny",
      description:
        "Formation Initiale Minimale Obligatoire pour le transport de marchandises. Cette formation de 140 heures est obligatoire pour tout conducteur souhaitant exercer le métier de conducteur routier de marchandises.",
      objectifs:
        "Maîtriser les règles de sécurité et la réglementation du transport. Perfectionner la conduite rationnelle. Connaître l'environnement économique et social du transport routier.",
      programme:
        "Module 1 : Perfectionnement à la conduite rationnelle (65h). Module 2 : Réglementation (28h). Module 3 : Santé, sécurité routière et environnement (28h). Module 4 : Service et logistique (19h).",
      prerequis: "Être titulaire du permis C ou CE en cours de validité. Aptitude médicale à jour.",
      publicCible: "Futurs conducteurs routiers de marchandises",
      duree: "140h",
      prix: 2900,
      modalite: "PRESENTIEL",
      lieu: "Bât. 7, 9 Chaussée Jules César, 95520 Osny",
      isQualiopi: true,
      isCPF: true,
      isActive: true,
      centreId: centres[0].id,
      categorieId: catFIMO.id,
    },
  });

  const formBysFCO = await (prisma as any).formation.create({
    data: {
      titre: "FCO Marchandises",
      slug: "fco-marchandises-osny",
      description:
        "Formation Continue Obligatoire de 5 jours pour les conducteurs routiers de marchandises. Renouvellement obligatoire tous les 5 ans pour maintenir sa carte de qualification conducteur.",
      objectifs:
        "Actualiser les connaissances en matière de réglementation. Perfectionner les pratiques de conduite sécuritaire. Sensibiliser à la sécurité routière et à l'éco-conduite.",
      programme:
        "Bilan des connaissances, conduite rationnelle et éco-conduite, réglementation sociale et transport, santé et sécurité routière, évaluation finale.",
      prerequis: "Être titulaire d'une carte de qualification conducteur marchandises.",
      publicCible: "Conducteurs routiers de marchandises en exercice",
      duree: "5 jours (35h)",
      prix: 1800,
      modalite: "PRESENTIEL",
      lieu: "Bât. 7, 9 Chaussée Jules César, 95520 Osny",
      isQualiopi: true,
      isCPF: true,
      isActive: true,
      centreId: centres[0].id,
      categorieId: catFCO.id,
    },
  });

  // Conduite Plus Paris — 3 formations
  const formParisRecup = await (prisma as any).formation.create({
    data: {
      titre: "Stage de récupération de points - Paris 11ème",
      slug: "stage-recuperation-points-paris-11",
      description:
        "Stage agréé préfecture de Paris, dispensé en plein cœur du 11ème arrondissement. Récupérez jusqu'à 4 points en seulement 2 jours. Nos animateurs sont tous titulaires du BAFM et ont plus de 10 ans d'expérience.",
      objectifs:
        "Récupérer jusqu'à 4 points. Comprendre les causes et conséquences des infractions routières. Améliorer son comportement au volant.",
      programme:
        "Jour 1 : Accueil, tour de table, données de l'accidentologie, analyse de cas. Jour 2 : Travail en groupe, mise en situation, engagement personnel, remise de l'attestation.",
      prerequis: "Permis de conduire valide. Pas de stage effectué dans les 12 derniers mois.",
      publicCible: "Conducteurs parisiens et franciliens ayant perdu des points",
      duree: "2 jours",
      prix: 280,
      modalite: "PRESENTIEL",
      lieu: "45 Avenue de la République, 75011 Paris",
      isQualiopi: true,
      isCPF: false,
      isActive: true,
      centreId: centres[1].id,
      categorieId: catRecup.id,
    },
  });

  const formParisPermisB = await (prisma as any).formation.create({
    data: {
      titre: "Formation Permis B - Conduite Plus Paris",
      slug: "permis-b-conduite-plus-paris",
      description:
        "Formation complète au permis de conduire catégorie B. Pack comprenant le code de la route et 30 heures de conduite avec un moniteur diplômé. Véhicules récents à double commande.",
      objectifs:
        "Obtenir le code de la route. Maîtriser la conduite d'un véhicule léger. Réussir l'examen pratique du permis de conduire.",
      programme:
        "Phase 1 : Code de la route (accès illimité en ligne + séances en salle). Phase 2 : 30 heures de conduite (manœuvres, circulation, autoroute). Phase 3 : Préparation à l'examen.",
      prerequis: "Avoir 17 ans minimum (conduite accompagnée) ou 18 ans. Pièce d'identité et justificatif de domicile.",
      publicCible: "Candidats au permis de conduire",
      duree: "30h",
      prix: 1590,
      modalite: "PRESENTIEL",
      lieu: "45 Avenue de la République, 75011 Paris",
      isQualiopi: true,
      isCPF: true,
      isActive: true,
      centreId: centres[1].id,
      categorieId: catPermisB.id,
    },
  });

  const formParisMoto = await (prisma as any).formation.create({
    data: {
      titre: "Permis Moto A2 - Paris",
      slug: "permis-moto-a2-paris",
      description:
        "Formation au permis moto A2 incluant le plateau et la circulation. Motos-écoles Yamaha MT-07 récentes. Équipement de protection fourni pour les séances de conduite.",
      objectifs:
        "Maîtriser les épreuves du plateau. Circuler en toute sécurité en milieu urbain et interurbain. Obtenir le permis A2.",
      programme:
        "Code moto (ETM), 20h de plateau (manœuvres lentes et rapides), 12h de circulation, examen blanc.",
      prerequis: "Avoir 18 ans minimum. Être titulaire de l'ASSR2 ou de l'ASR.",
      publicCible: "Candidats au permis moto",
      duree: "32h",
      prix: 1350,
      modalite: "PRESENTIEL",
      lieu: "45 Avenue de la République, 75011 Paris",
      isQualiopi: true,
      isCPF: false,
      isActive: true,
      centreId: centres[1].id,
      categorieId: catMoto.id,
    },
  });

  // CFSR Lyon — 3 formations
  const formLyonRecup = await (prisma as any).formation.create({
    data: {
      titre: "Stage de récupération de points - Lyon",
      slug: "stage-recuperation-points-lyon",
      description:
        "Stage agréé préfecture du Rhône, à deux pas de la gare Part-Dieu. Récupérez jusqu'à 4 points en 2 jours dans un cadre convivial et bienveillant. Accueil café et déjeuner inclus.",
      objectifs:
        "Récupérer jusqu'à 4 points sur le permis. Sensibilisation aux dangers de la route. Échanges et partage d'expériences entre stagiaires.",
      programme:
        "Jour 1 (9h-17h30) : Statistiques de l'accidentologie, les facteurs de risque, vitesse et freinage. Jour 2 (9h-17h30) : L'alcool au volant, les distracteurs, engagement personnel, attestation.",
      prerequis: "Permis valide. Dernier stage effectué il y a plus d'un an.",
      publicCible: "Conducteurs de la région Auvergne-Rhône-Alpes",
      duree: "2 jours",
      prix: 230,
      modalite: "PRESENTIEL",
      lieu: "12 Rue de la Part-Dieu, 69003 Lyon",
      isQualiopi: true,
      isCPF: false,
      isActive: true,
      centreId: centres[2].id,
      categorieId: catRecup.id,
    },
  });

  const formLyonFIMO = await (prisma as any).formation.create({
    data: {
      titre: "FIMO Marchandises - Lyon",
      slug: "fimo-marchandises-lyon",
      description:
        "Formation FIMO Marchandises de 140 heures à Lyon. Notre piste privée de 3 000 m² permet un apprentissage optimal de la conduite poids lourd. Taux de réussite de 95%.",
      objectifs:
        "Obtenir la qualification initiale de conducteur routier. Maîtriser la conduite rationnelle d'un poids lourd. Connaître la réglementation sociale européenne.",
      programme:
        "Conduite rationnelle (65h), réglementation (28h), santé-sécurité-environnement (28h), logistique et service (19h). Examen final inclus.",
      prerequis: "Permis C ou CE valide. Visite médicale favorable.",
      publicCible: "Futurs conducteurs poids lourd en région lyonnaise",
      duree: "140h",
      prix: 3100,
      modalite: "PRESENTIEL",
      lieu: "12 Rue de la Part-Dieu, 69003 Lyon",
      isQualiopi: true,
      isCPF: true,
      isActive: true,
      centreId: centres[2].id,
      categorieId: catFIMO.id,
    },
  });

  const formLyonSensibilisation = await (prisma as any).formation.create({
    data: {
      titre: "Sensibilisation sécurité routière entreprise",
      slug: "sensibilisation-securite-routiere-lyon",
      description:
        "Formation de sensibilisation aux risques routiers destinée aux entreprises. Réduisez les accidents de trajet et de mission de vos collaborateurs grâce à cette journée de formation interactive.",
      objectifs:
        "Sensibiliser les salariés aux risques routiers professionnels. Réduire le nombre d'accidents de trajet. Promouvoir une culture de la sécurité routière en entreprise.",
      programme:
        "Les chiffres du risque routier professionnel, les facteurs de risque (alcool, téléphone, fatigue), ateliers pratiques (simulateur, parcours lunettes d'alcoolémie), plan d'action individuel.",
      prerequis: "Aucun prérequis. Formation ouverte à tous les salariés.",
      publicCible: "Entreprises et collectivités de la région lyonnaise",
      duree: "1 jour (7h)",
      prix: 350,
      modalite: "PRESENTIEL",
      lieu: "12 Rue de la Part-Dieu, 69003 Lyon",
      isQualiopi: true,
      isCPF: false,
      isActive: true,
      centreId: centres[2].id,
      categorieId: catSensibilisation.id,
    },
  });

  // Permis Express Marseille — 2 formations
  const formMarseilleRecup = await (prisma as any).formation.create({
    data: {
      titre: "Stage de récupération de points - Marseille",
      slug: "stage-recuperation-points-marseille",
      description:
        "Stage express de récupération de points agréé préfecture des Bouches-du-Rhône. Situé près du Prado, facilement accessible en métro (ligne 2, station Rond-Point du Prado).",
      objectifs:
        "Récupérer jusqu'à 4 points. Comprendre l'impact de ses infractions. Redevenir un conducteur responsable.",
      programme:
        "Jour 1 : Accueil, bilan individuel, accidentologie locale, les grandes causes d'accidents. Jour 2 : Groupes de travail, témoignages, bilan personnel, remise de l'attestation de stage.",
      prerequis: "Permis valide. Pas de stage dans les 12 derniers mois. Pièce d'identité et relevé de points.",
      publicCible: "Conducteurs de la région PACA",
      duree: "2 jours",
      prix: 220,
      modalite: "PRESENTIEL",
      lieu: "78 Boulevard Michelet, 13008 Marseille",
      isQualiopi: true,
      isCPF: false,
      isActive: true,
      centreId: centres[3].id,
      categorieId: catRecup.id,
    },
  });

  const formMarseilleMoto = await (prisma as any).formation.create({
    data: {
      titre: "Permis Moto A2 - Marseille",
      slug: "permis-moto-a2-marseille",
      description:
        "Passez votre permis moto sous le soleil de Marseille ! Formation complète A2 avec des moniteurs passionnés. Notre piste privée offre des conditions idéales d'apprentissage.",
      objectifs:
        "Réussir l'examen du plateau moto. Maîtriser la circulation en milieu urbain et péri-urbain. Conduire une moto en toute confiance.",
      programme:
        "ETM (code moto en ligne), plateau (20h de manœuvres), circulation (12h en conditions réelles), examen blanc plateau et circulation.",
      prerequis: "18 ans minimum. ASSR2 ou ASR.",
      publicCible: "Candidats au permis moto dans la région marseillaise",
      duree: "32h",
      prix: 1250,
      modalite: "PRESENTIEL",
      lieu: "78 Boulevard Michelet, 13008 Marseille",
      isQualiopi: true,
      isCPF: false,
      isActive: true,
      centreId: centres[3].id,
      categorieId: catMoto.id,
    },
  });

  // Sécurité Routière Nantes — 2 formations (centre en attente)
  const formNantesRecup = await (prisma as any).formation.create({
    data: {
      titre: "Stage de récupération de points - Nantes",
      slug: "stage-recuperation-points-nantes",
      description:
        "Nouveau stage de récupération de points à Nantes, en plein centre-ville. Formation agréée en cours de validation par la préfecture de Loire-Atlantique.",
      objectifs:
        "Récupérer jusqu'à 4 points. Réfléchir à sa conduite. Repartir avec de bonnes résolutions.",
      programme:
        "Jour 1 : L'accidentologie en France, les facteurs humains, vitesse et distances. Jour 2 : Addictions et conduite, fatigue, plan d'action personnel, attestation.",
      prerequis: "Permis en cours de validité. Pas de stage dans les 12 mois précédents.",
      publicCible: "Conducteurs de la région nantaise",
      duree: "2 jours",
      prix: 210,
      modalite: "PRESENTIEL",
      lieu: "22 Rue de Strasbourg, 44000 Nantes",
      isQualiopi: false,
      isCPF: false,
      isActive: false,
      centreId: centres[4].id,
      categorieId: catRecup.id,
    },
  });

  const formNantesEco = await (prisma as any).formation.create({
    data: {
      titre: "Formation Eco-conduite",
      slug: "eco-conduite-nantes",
      description:
        "Apprenez à réduire votre consommation de carburant jusqu'à 15% grâce à notre formation éco-conduite. Idéal pour les entreprises souhaitant réduire leur empreinte carbone et leurs coûts de déplacement.",
      objectifs:
        "Réduire la consommation de carburant. Diminuer l'usure du véhicule. Adopter une conduite plus souple et sécuritaire.",
      programme:
        "Diagnostic initial de conduite, principes de l'éco-conduite, exercices pratiques sur route, comparaison avant/après, remise du certificat.",
      prerequis: "Permis B valide.",
      publicCible: "Particuliers et entreprises soucieux de l'environnement",
      duree: "1 jour (7h)",
      prix: 290,
      modalite: "PRESENTIEL",
      lieu: "22 Rue de Strasbourg, 44000 Nantes",
      isQualiopi: false,
      isCPF: false,
      isActive: false,
      centreId: centres[4].id,
      categorieId: catEco.id,
    },
  });

  const allFormations = [
    formBysRecup, formBysFIMO, formBysFCO,
    formParisRecup, formParisPermisB, formParisMoto,
    formLyonRecup, formLyonFIMO, formLyonSensibilisation,
    formMarseilleRecup, formMarseilleMoto,
    formNantesRecup, formNantesEco,
  ];
  console.log(`✅ ${allFormations.length} formations créées.\n`);

  // ─── 5. SESSIONS ─────────────────────────────────────────
  console.log("📅 Création des sessions...");

  // Helper to create dates
  const d = (year: number, month: number, day: number, hour = 9) =>
    new Date(year, month - 1, day, hour, 0, 0);

  const sessions = await Promise.all([
    // BYS Osny - Récup (4 sessions)
    (prisma as any).session.create({
      data: {
        dateDebut: d(2026, 4, 6, 9),
        dateFin: d(2026, 4, 7, 17),
        placesTotal: 20,
        placesRestantes: 3,
        status: "ACTIVE",
        formationId: formBysRecup.id,
      },
    }),
    (prisma as any).session.create({
      data: {
        dateDebut: d(2026, 4, 20, 9),
        dateFin: d(2026, 4, 21, 17),
        placesTotal: 20,
        placesRestantes: 12,
        status: "ACTIVE",
        formationId: formBysRecup.id,
      },
    }),
    (prisma as any).session.create({
      data: {
        dateDebut: d(2026, 5, 11, 9),
        dateFin: d(2026, 5, 12, 17),
        placesTotal: 20,
        placesRestantes: 20,
        status: "ACTIVE",
        formationId: formBysRecup.id,
      },
    }),
    (prisma as any).session.create({
      data: {
        dateDebut: d(2026, 6, 8, 9),
        dateFin: d(2026, 6, 9, 17),
        placesTotal: 20,
        placesRestantes: 18,
        status: "ACTIVE",
        formationId: formBysRecup.id,
      },
    }),

    // BYS Osny - FIMO (2 sessions)
    (prisma as any).session.create({
      data: {
        dateDebut: d(2026, 4, 14, 8),
        dateFin: d(2026, 5, 8, 17),
        placesTotal: 12,
        placesRestantes: 4,
        status: "ACTIVE",
        formationId: formBysFIMO.id,
      },
    }),
    (prisma as any).session.create({
      data: {
        dateDebut: d(2026, 6, 1, 8),
        dateFin: d(2026, 6, 26, 17),
        placesTotal: 12,
        placesRestantes: 10,
        status: "ACTIVE",
        formationId: formBysFIMO.id,
      },
    }),

    // BYS Osny - FCO (2 sessions)
    (prisma as any).session.create({
      data: {
        dateDebut: d(2026, 5, 4, 8),
        dateFin: d(2026, 5, 8, 17),
        placesTotal: 15,
        placesRestantes: 7,
        status: "ACTIVE",
        formationId: formBysFCO.id,
      },
    }),
    (prisma as any).session.create({
      data: {
        dateDebut: d(2026, 7, 6, 8),
        dateFin: d(2026, 7, 10, 17),
        placesTotal: 15,
        placesRestantes: 15,
        status: "ACTIVE",
        formationId: formBysFCO.id,
      },
    }),

    // Paris - Récup (3 sessions, 1 passée)
    (prisma as any).session.create({
      data: {
        dateDebut: d(2026, 3, 2, 9),
        dateFin: d(2026, 3, 3, 17),
        placesTotal: 20,
        placesRestantes: 0,
        status: "COMPLETE",
        formationId: formParisRecup.id,
      },
    }),
    (prisma as any).session.create({
      data: {
        dateDebut: d(2026, 4, 13, 9),
        dateFin: d(2026, 4, 14, 17),
        placesTotal: 20,
        placesRestantes: 5,
        status: "ACTIVE",
        formationId: formParisRecup.id,
      },
    }),
    (prisma as any).session.create({
      data: {
        dateDebut: d(2026, 5, 18, 9),
        dateFin: d(2026, 5, 19, 17),
        placesTotal: 20,
        placesRestantes: 16,
        status: "ACTIVE",
        formationId: formParisRecup.id,
      },
    }),

    // Paris - Permis B (2 sessions)
    (prisma as any).session.create({
      data: {
        dateDebut: d(2026, 4, 1, 9),
        dateFin: d(2026, 5, 15, 17),
        placesTotal: 10,
        placesRestantes: 2,
        status: "ACTIVE",
        formationId: formParisPermisB.id,
      },
    }),
    (prisma as any).session.create({
      data: {
        dateDebut: d(2026, 6, 1, 9),
        dateFin: d(2026, 7, 15, 17),
        placesTotal: 10,
        placesRestantes: 8,
        status: "ACTIVE",
        formationId: formParisPermisB.id,
      },
    }),

    // Paris - Moto (2 sessions)
    (prisma as any).session.create({
      data: {
        dateDebut: d(2026, 4, 7, 8),
        dateFin: d(2026, 5, 2, 17),
        placesTotal: 8,
        placesRestantes: 1,
        status: "ACTIVE",
        formationId: formParisMoto.id,
      },
    }),
    (prisma as any).session.create({
      data: {
        dateDebut: d(2026, 6, 15, 8),
        dateFin: d(2026, 7, 10, 17),
        placesTotal: 8,
        placesRestantes: 6,
        status: "ACTIVE",
        formationId: formParisMoto.id,
      },
    }),

    // Lyon - Récup (3 sessions, 1 complète)
    (prisma as any).session.create({
      data: {
        dateDebut: d(2026, 3, 9, 9),
        dateFin: d(2026, 3, 10, 17),
        placesTotal: 22,
        placesRestantes: 0,
        status: "COMPLETE",
        formationId: formLyonRecup.id,
      },
    }),
    (prisma as any).session.create({
      data: {
        dateDebut: d(2026, 4, 27, 9),
        dateFin: d(2026, 4, 28, 17),
        placesTotal: 22,
        placesRestantes: 9,
        status: "ACTIVE",
        formationId: formLyonRecup.id,
      },
    }),
    (prisma as any).session.create({
      data: {
        dateDebut: d(2026, 6, 22, 9),
        dateFin: d(2026, 6, 23, 17),
        placesTotal: 22,
        placesRestantes: 22,
        status: "ACTIVE",
        formationId: formLyonRecup.id,
      },
    }),

    // Lyon - FIMO (1 session)
    (prisma as any).session.create({
      data: {
        dateDebut: d(2026, 5, 18, 8),
        dateFin: d(2026, 6, 12, 17),
        placesTotal: 12,
        placesRestantes: 6,
        status: "ACTIVE",
        formationId: formLyonFIMO.id,
      },
    }),

    // Lyon - Sensibilisation (2 sessions)
    (prisma as any).session.create({
      data: {
        dateDebut: d(2026, 4, 15, 9),
        dateFin: d(2026, 4, 15, 17),
        placesTotal: 25,
        placesRestantes: 10,
        status: "ACTIVE",
        formationId: formLyonSensibilisation.id,
      },
    }),
    (prisma as any).session.create({
      data: {
        dateDebut: d(2026, 6, 3, 9),
        dateFin: d(2026, 6, 3, 17),
        placesTotal: 25,
        placesRestantes: 25,
        status: "ACTIVE",
        formationId: formLyonSensibilisation.id,
      },
    }),

    // Marseille - Récup (3 sessions, 1 complète)
    (prisma as any).session.create({
      data: {
        dateDebut: d(2026, 3, 16, 9),
        dateFin: d(2026, 3, 17, 17),
        placesTotal: 18,
        placesRestantes: 0,
        status: "COMPLETE",
        formationId: formMarseilleRecup.id,
      },
    }),
    (prisma as any).session.create({
      data: {
        dateDebut: d(2026, 5, 4, 9),
        dateFin: d(2026, 5, 5, 17),
        placesTotal: 18,
        placesRestantes: 7,
        status: "ACTIVE",
        formationId: formMarseilleRecup.id,
      },
    }),
    (prisma as any).session.create({
      data: {
        dateDebut: d(2026, 6, 29, 9),
        dateFin: d(2026, 6, 30, 17),
        placesTotal: 18,
        placesRestantes: 18,
        status: "ACTIVE",
        formationId: formMarseilleRecup.id,
      },
    }),

    // Marseille - Moto (1 session)
    (prisma as any).session.create({
      data: {
        dateDebut: d(2026, 5, 11, 8),
        dateFin: d(2026, 6, 5, 17),
        placesTotal: 8,
        placesRestantes: 3,
        status: "ACTIVE",
        formationId: formMarseilleMoto.id,
      },
    }),
  ]);

  console.log(`✅ ${sessions.length} sessions créées.\n`);

  // ─── 6. RÉSERVATIONS ─────────────────────────────────────
  console.log("🎫 Création des réservations...");

  const reservations = await Promise.all([
    // Karim → BYS Osny Récup session 1 (presque pleine)
    (prisma as any).reservation.create({
      data: {
        numero: "RES-2026-0001",
        status: "CONFIRMEE",
        montant: 250,
        commissionMontant: 25,
        civilite: "M.",
        nom: "Bouaziz",
        prenom: "Karim",
        email: "karim.bouaziz@gmail.com",
        telephone: "06 11 22 33 44",
        adresse: "8 Rue des Lilas",
        codePostal: "75020",
        ville: "Paris",
        numeroPermis: "12AA34567",
        userId: eleves[0].id,
        sessionId: sessions[0].id,
      },
    }),
    // Marie → Lyon Récup session complète (terminée)
    (prisma as any).reservation.create({
      data: {
        numero: "RES-2026-0002",
        status: "TERMINEE",
        montant: 230,
        commissionMontant: 23,
        civilite: "Mme",
        nom: "Durand",
        prenom: "Marie",
        email: "marie.durand@outlook.fr",
        telephone: "06 22 33 44 55",
        adresse: "14 Avenue Jean Jaurès",
        codePostal: "69007",
        ville: "Lyon",
        numeroPermis: "07BB89012",
        userId: eleves[1].id,
        sessionId: sessions[16].id, // Lyon récup complète
      },
    }),
    // Lucas → Marseille Récup session complète (terminée)
    (prisma as any).reservation.create({
      data: {
        numero: "RES-2026-0003",
        status: "TERMINEE",
        montant: 220,
        commissionMontant: 22,
        civilite: "M.",
        nom: "Martin",
        prenom: "Lucas",
        email: "lucas.martin@gmail.com",
        telephone: "06 33 44 55 66",
        adresse: "27 Boulevard Gambetta",
        codePostal: "13001",
        ville: "Marseille",
        numeroPermis: "13CC45678",
        userId: eleves[2].id,
        sessionId: sessions[22].id, // Marseille récup complète
      },
    }),
    // Amina → Paris Récup session 2 (active)
    (prisma as any).reservation.create({
      data: {
        numero: "RES-2026-0004",
        status: "CONFIRMEE",
        montant: 280,
        commissionMontant: 28,
        civilite: "Mme",
        nom: "Diallo",
        prenom: "Amina",
        email: "amina.diallo@hotmail.fr",
        telephone: "06 44 55 66 77",
        adresse: "3 Rue Sainte-Catherine",
        codePostal: "33000",
        ville: "Bordeaux",
        numeroPermis: "33DD90123",
        userId: eleves[3].id,
        sessionId: sessions[10].id, // Paris récup active
      },
    }),
    // Pierre → BYS FIMO session 1
    (prisma as any).reservation.create({
      data: {
        numero: "RES-2026-0005",
        status: "CONFIRMEE",
        montant: 2900,
        commissionMontant: 290,
        civilite: "M.",
        nom: "Garnier",
        prenom: "Pierre",
        email: "pierre.garnier@free.fr",
        telephone: "06 55 66 77 88",
        adresse: "56 Rue Nationale",
        codePostal: "59000",
        ville: "Lille",
        numeroPermis: "59EE12345",
        userId: eleves[4].id,
        sessionId: sessions[4].id, // BYS FIMO
      },
    }),
    // Sophie → Paris Permis B session 1
    (prisma as any).reservation.create({
      data: {
        numero: "RES-2026-0006",
        status: "CONFIRMEE",
        montant: 1590,
        commissionMontant: 159,
        civilite: "Mme",
        nom: "Lemaire",
        prenom: "Sophie",
        email: "sophie.lemaire@yahoo.fr",
        telephone: "06 66 77 88 99",
        adresse: "19 Allée des Demoiselles",
        codePostal: "31000",
        ville: "Toulouse",
        userId: eleves[5].id,
        sessionId: sessions[12].id, // Paris Permis B
      },
    }),
    // Youssef → Lyon Sensibilisation session 1
    (prisma as any).reservation.create({
      data: {
        numero: "RES-2026-0007",
        status: "EN_ATTENTE",
        montant: 350,
        commissionMontant: 35,
        civilite: "M.",
        nom: "El Mansouri",
        prenom: "Youssef",
        email: "youssef.elmansouri@gmail.com",
        telephone: "06 77 88 99 00",
        adresse: "41 Rue du Maréchal Foch",
        codePostal: "44000",
        ville: "Nantes",
        userId: eleves[6].id,
        sessionId: sessions[20].id, // Lyon Sensibilisation
      },
    }),
    // Chloé → Marseille Moto
    (prisma as any).reservation.create({
      data: {
        numero: "RES-2026-0008",
        status: "CONFIRMEE",
        montant: 1250,
        commissionMontant: 125,
        civilite: "Mme",
        nom: "Bernard",
        prenom: "Chloé",
        email: "chloe.bernard@laposte.net",
        telephone: "06 88 99 00 11",
        adresse: "7 Quai des Bateliers",
        codePostal: "67000",
        ville: "Strasbourg",
        userId: eleves[7].id,
        sessionId: sessions[24].id, // Marseille Moto
      },
    }),
    // Alexandre → BYS Osny Récup session 2
    (prisma as any).reservation.create({
      data: {
        numero: "RES-2026-0009",
        status: "EN_ATTENTE",
        montant: 250,
        commissionMontant: 25,
        civilite: "M.",
        nom: "Petit",
        prenom: "Alexandre",
        email: "alexandre.petit@orange.fr",
        telephone: "06 99 00 11 22",
        adresse: "23 Chaussée Jules César",
        codePostal: "95520",
        ville: "Osny",
        numeroPermis: "95FF67890",
        userId: eleves[8].id,
        sessionId: sessions[1].id, // BYS Récup session 2
      },
    }),
    // Karim → Paris Récup complète (terminée - double réservation, different stage)
    (prisma as any).reservation.create({
      data: {
        numero: "RES-2026-0010",
        status: "TERMINEE",
        montant: 280,
        commissionMontant: 28,
        civilite: "M.",
        nom: "Bouaziz",
        prenom: "Karim",
        email: "karim.bouaziz@gmail.com",
        telephone: "06 11 22 33 44",
        adresse: "8 Rue des Lilas",
        codePostal: "75020",
        ville: "Paris",
        numeroPermis: "12AA34567",
        userId: eleves[0].id,
        sessionId: sessions[9].id, // Paris récup complète
      },
    }),
  ]);

  console.log(`✅ ${reservations.length} réservations créées.\n`);

  // ─── 7. FAQ ──────────────────────────────────────────────
  console.log("❓ Création des FAQ...");
  await (prisma as any).faqItem.createMany({
    data: [
      {
        question: "Combien de points peut-on récupérer lors d'un stage ?",
        reponse:
          "Un stage de sensibilisation à la sécurité routière permet de récupérer jusqu'à 4 points sur votre permis de conduire. Les points sont crédités le lendemain du dernier jour de stage. Attention, le nombre de points ne peut pas dépasser le plafond de votre permis (12 points pour un permis classique, 6 à 12 points pour un jeune conducteur).",
        categorie: "Récupération de points",
        ordre: 1,
        isActive: true,
      },
      {
        question: "Combien coûte un stage de récupération de points ?",
        reponse:
          "Le prix d'un stage varie en fonction du centre et de la région, généralement entre 200€ et 290€. Sur BYS Formation, vous pouvez comparer les prix de tous les centres agréés et réserver en ligne en quelques clics. Le paiement est sécurisé par Stripe.",
        categorie: "Récupération de points",
        ordre: 2,
        isActive: true,
      },
      {
        question: "Quels documents faut-il apporter le jour du stage ?",
        reponse:
          "Vous devez vous munir de : votre pièce d'identité en cours de validité (carte d'identité ou passeport), votre permis de conduire original, et le courrier 48N ou 48SI si vous en avez reçu un. Nous vous enverrons un email de rappel avec la liste complète des documents 48h avant le stage.",
        categorie: "Récupération de points",
        ordre: 3,
        isActive: true,
      },
      {
        question: "Peut-on annuler ou reporter un stage ?",
        reponse:
          "Oui, vous pouvez annuler ou reporter votre stage gratuitement jusqu'à 7 jours avant la date de début. Entre 7 et 3 jours avant, des frais d'annulation de 50€ s'appliquent. Moins de 3 jours avant le stage, aucun remboursement n'est possible sauf cas de force majeure (justificatif médical, etc.).",
        categorie: "Réservation",
        ordre: 4,
        isActive: true,
      },
      {
        question: "Combien de temps dure un stage de récupération de points ?",
        reponse:
          "Un stage de récupération de points dure 2 jours consécutifs (14 heures au total). Les horaires sont généralement de 9h à 12h30 et de 13h30 à 17h30. La présence est obligatoire pendant toute la durée du stage, sous peine de non-validation.",
        categorie: "Récupération de points",
        ordre: 5,
        isActive: true,
      },
      {
        question: "À quelle fréquence peut-on effectuer un stage de récupération de points ?",
        reponse:
          "Vous ne pouvez effectuer qu'un seul stage de récupération de points par période de 12 mois (un an jour pour jour). Si vous avez effectué un stage le 15 mars 2026, le prochain stage ne pourra avoir lieu qu'à partir du 16 mars 2027.",
        categorie: "Récupération de points",
        ordre: 6,
        isActive: true,
      },
      {
        question: "Comment se déroulent les 2 jours de stage ?",
        reponse:
          "Le stage est animé par deux formateurs (un psychologue et un spécialiste de la sécurité routière). Le programme comprend : des échanges en groupe sur les infractions commises, l'analyse des facteurs d'accident (vitesse, alcool, fatigue, téléphone), des études de cas et des exercices pratiques, ainsi qu'un bilan personnel. L'ambiance est bienveillante et non culpabilisante.",
        categorie: "Récupération de points",
        ordre: 7,
        isActive: true,
      },
      {
        question: "Peut-on financer une formation avec le CPF ?",
        reponse:
          "Certaines formations sont éligibles au Compte Personnel de Formation (CPF), notamment les formations FIMO, FCO et le permis B. Les stages de récupération de points ne sont pas éligibles au CPF. Pour utiliser votre CPF, rendez-vous sur moncompteformation.gouv.fr et recherchez la formation souhaitée. Nos centres partenaires Qualiopi vous accompagnent dans les démarches.",
        categorie: "Financement",
        ordre: 8,
        isActive: true,
      },
    ],
  });
  console.log("✅ 8 FAQ créées.\n");

  // ─── 8. PARAMÈTRES PLATEFORME ────────────────────────────
  console.log("⚙️  Configuration de la plateforme...");
  await (prisma as any).platformSettings.create({
    data: {
      id: "default",
      commissionRate: 10,
      monetisationModel: "COMMISSION",
    },
  });
  console.log("✅ Paramètres plateforme configurés.\n");

  // ─── 9. NOTIFICATIONS ────────────────────────────────────
  console.log("🔔 Création des notifications...");
  await (prisma as any).notification.createMany({
    data: [
      {
        titre: "Bienvenue sur BYS Formation !",
        contenu:
          "Bonjour Karim, bienvenue sur la plateforme BYS Formation. Vous pouvez dès maintenant rechercher et réserver un stage de récupération de points près de chez vous.",
        isRead: true,
        userId: eleves[0].id,
      },
      {
        titre: "Réservation confirmée",
        contenu:
          "Votre réservation RES-2026-0001 pour le stage de récupération de points à BYS Formation Osny (6-7 avril 2026) est confirmée. N'oubliez pas d'apporter votre pièce d'identité et votre permis de conduire.",
        isRead: true,
        userId: eleves[0].id,
      },
      {
        titre: "Bienvenue sur BYS Formation !",
        contenu:
          "Bonjour Amina, bienvenue sur BYS Formation. Trouvez facilement un stage de récupération de points ou une formation professionnelle près de chez vous.",
        isRead: false,
        userId: eleves[3].id,
      },
      {
        titre: "Rappel : stage dans 3 jours",
        contenu:
          "Rappel : votre stage de récupération de points à Paris (13-14 avril 2026) approche. Pensez à préparer vos documents : pièce d'identité, permis de conduire et courrier 48N le cas échéant.",
        isRead: false,
        userId: eleves[3].id,
      },
      {
        titre: "Votre attestation est disponible",
        contenu:
          "Félicitations Marie ! Votre stage de récupération de points à Lyon est terminé. Votre attestation de stage est disponible dans votre espace personnel. Vos points seront crédités sous 24h.",
        isRead: false,
        userId: eleves[1].id,
      },
    ],
  });
  console.log("✅ 5 notifications créées.\n");

  // ─── EMAIL TEMPLATES PAR DÉFAUT ──────────────────────────
  console.log("📧 Création des templates d'emails par défaut...");
  const emailTemplates = await Promise.all([
    (prisma as any).emailTemplate.create({
      data: {
        slug: "convocation",
        nom: "Convocation de stage",
        sujet: "Convocation — {{formation}}",
        contenu: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;color:#1f2937">
  <div style="background:#0A1628;padding:24px 32px;border-radius:8px 8px 0 0">
    <h1 style="color:#fff;margin:0;font-size:22px">Convocation</h1>
    <p style="color:#9CA3AF;margin:4px 0 0;font-size:13px">BYS Formation</p>
  </div>
  <div style="padding:24px 32px;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 8px 8px">
    <p>Bonjour <strong>{{prenom}} {{nom}}</strong>,</p>
    <p>Vous êtes convoqué(e) à la formation suivante :</p>
    <table style="width:100%;border-collapse:collapse;margin:16px 0">
      <tr><td style="padding:8px 12px;font-weight:bold;color:#6B7280;width:140px">Formation</td><td style="padding:8px 12px">{{formation}}</td></tr>
      <tr style="background:#f9fafb"><td style="padding:8px 12px;font-weight:bold;color:#6B7280">Du</td><td style="padding:8px 12px">{{dateDebut}}</td></tr>
      <tr><td style="padding:8px 12px;font-weight:bold;color:#6B7280">Au</td><td style="padding:8px 12px">{{dateFin}}</td></tr>
      <tr style="background:#f9fafb"><td style="padding:8px 12px;font-weight:bold;color:#6B7280">Lieu</td><td style="padding:8px 12px">{{lieu}}</td></tr>
      <tr><td style="padding:8px 12px;font-weight:bold;color:#6B7280">Centre</td><td style="padding:8px 12px">{{centre}}</td></tr>
      <tr style="background:#f9fafb"><td style="padding:8px 12px;font-weight:bold;color:#6B7280">N° réservation</td><td style="padding:8px 12px">{{numero}}</td></tr>
    </table>
    <div style="background:#FEF3C7;border:1px solid #F59E0B;border-radius:6px;padding:12px 16px;margin:16px 0">
      <p style="margin:0 0 8px;font-weight:bold;color:#92400E;font-size:13px">Documents obligatoires à apporter :</p>
      <ul style="margin:0;padding-left:18px;color:#78350F;font-size:13px">
        <li>Pièce d'identité en cours de validité (CNI ou passeport)</li>
        <li>Permis de conduire original</li>
        <li>Cette convocation imprimée ou sur votre smartphone</li>
      </ul>
    </div>
    <p style="margin:20px 0 12px">
      <a href="{{lienConvocation}}" style="display:inline-block;background:#2563EB;color:#fff;text-decoration:none;padding:10px 24px;border-radius:6px;font-weight:bold;font-size:14px">Télécharger ma convocation PDF</a>
    </p>
    <p style="color:#6B7280;font-size:12px;margin-top:24px">Cordialement,<br/>L'équipe BYS Formation</p>
  </div>
</div>`,
        variables: ["prenom", "nom", "email", "formation", "centre", "dateDebut", "dateFin", "lieu", "prix", "numero", "lienConvocation"],
        isActive: true,
        centreId: null,
      },
    }),
    (prisma as any).emailTemplate.create({
      data: {
        slug: "confirmation_reservation",
        nom: "Confirmation de réservation",
        sujet: "Confirmation de réservation #{{numero}}",
        contenu: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;color:#1f2937">
  <div style="background:#0A1628;padding:24px 32px;border-radius:8px 8px 0 0">
    <h1 style="color:#fff;margin:0;font-size:22px">Réservation confirmée</h1>
    <p style="color:#9CA3AF;margin:4px 0 0;font-size:13px">BYS Formation</p>
  </div>
  <div style="padding:24px 32px;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 8px 8px">
    <p>Bonjour <strong>{{prenom}}</strong>,</p>
    <p>Votre réservation <strong>#{{numero}}</strong> a bien été enregistrée et confirmée.</p>
    <table style="width:100%;border-collapse:collapse;margin:16px 0">
      <tr><td style="padding:8px 12px;font-weight:bold;color:#6B7280;width:140px">Formation</td><td style="padding:8px 12px">{{formation}}</td></tr>
      <tr style="background:#f9fafb"><td style="padding:8px 12px;font-weight:bold;color:#6B7280">Date</td><td style="padding:8px 12px">{{dateDebut}} - {{dateFin}}</td></tr>
      <tr><td style="padding:8px 12px;font-weight:bold;color:#6B7280">Centre</td><td style="padding:8px 12px">{{centre}}</td></tr>
      <tr style="background:#f9fafb"><td style="padding:8px 12px;font-weight:bold;color:#6B7280">Lieu</td><td style="padding:8px 12px">{{lieu}}</td></tr>
      <tr><td style="padding:8px 12px;font-weight:bold;color:#6B7280">Montant</td><td style="padding:8px 12px">{{prix}}</td></tr>
    </table>
    <p>Vous recevrez votre convocation par email avant la date de la session.</p>
    <p style="margin:20px 0 12px">
      <a href="{{lienConvocation}}" style="display:inline-block;background:#2563EB;color:#fff;text-decoration:none;padding:10px 24px;border-radius:6px;font-weight:bold;font-size:14px">Télécharger ma convocation PDF</a>
    </p>
    <p style="color:#6B7280;font-size:12px;margin-top:24px">Cordialement,<br/>L'équipe BYS Formation</p>
  </div>
</div>`,
        variables: ["prenom", "nom", "email", "formation", "centre", "dateDebut", "dateFin", "lieu", "prix", "numero", "lienConvocation"],
        isActive: true,
        centreId: null,
      },
    }),
    (prisma as any).emailTemplate.create({
      data: {
        slug: "rappel_session",
        nom: "Rappel de session",
        sujet: "Rappel : {{formation}} dans 48h",
        contenu: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;color:#1f2937">
  <div style="background:#0A1628;padding:24px 32px;border-radius:8px 8px 0 0">
    <h1 style="color:#fff;margin:0;font-size:22px">Rappel — Votre formation approche</h1>
    <p style="color:#9CA3AF;margin:4px 0 0;font-size:13px">BYS Formation</p>
  </div>
  <div style="padding:24px 32px;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 8px 8px">
    <p>Bonjour <strong>{{prenom}}</strong>,</p>
    <p>Votre formation <strong>{{formation}}</strong> commence bientôt. Voici un rappel des informations pratiques :</p>
    <table style="width:100%;border-collapse:collapse;margin:16px 0">
      <tr><td style="padding:8px 12px;font-weight:bold;color:#6B7280;width:140px">Formation</td><td style="padding:8px 12px">{{formation}}</td></tr>
      <tr style="background:#f9fafb"><td style="padding:8px 12px;font-weight:bold;color:#6B7280">Date</td><td style="padding:8px 12px">{{dateDebut}} - {{dateFin}}</td></tr>
      <tr><td style="padding:8px 12px;font-weight:bold;color:#6B7280">Lieu</td><td style="padding:8px 12px">{{lieu}}</td></tr>
      <tr style="background:#f9fafb"><td style="padding:8px 12px;font-weight:bold;color:#6B7280">Centre</td><td style="padding:8px 12px">{{centre}}</td></tr>
    </table>
    <div style="background:#FEF3C7;border:1px solid #F59E0B;border-radius:6px;padding:12px 16px;margin:16px 0">
      <p style="margin:0 0 8px;font-weight:bold;color:#92400E;font-size:13px">N'oubliez pas d'apporter :</p>
      <ul style="margin:0;padding-left:18px;color:#78350F;font-size:13px">
        <li>Pièce d'identité en cours de validité</li>
        <li>Permis de conduire original</li>
        <li>Votre convocation</li>
      </ul>
    </div>
    <p style="margin:20px 0 12px">
      <a href="{{lienConvocation}}" style="display:inline-block;background:#2563EB;color:#fff;text-decoration:none;padding:10px 24px;border-radius:6px;font-weight:bold;font-size:14px">Télécharger ma convocation PDF</a>
    </p>
    <p style="color:#6B7280;font-size:12px;margin-top:24px">Cordialement,<br/>L'équipe BYS Formation</p>
  </div>
</div>`,
        variables: ["prenom", "nom", "email", "formation", "centre", "dateDebut", "dateFin", "lieu", "prix", "numero", "lienConvocation"],
        isActive: true,
        centreId: null,
      },
    }),
    (prisma as any).emailTemplate.create({
      data: {
        slug: "bienvenue",
        nom: "Bienvenue",
        sujet: "Bienvenue sur BYS Formation, {{prenom}} !",
        contenu: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;color:#1f2937">
  <div style="background:#0A1628;padding:24px 32px;border-radius:8px 8px 0 0">
    <h1 style="color:#fff;margin:0;font-size:22px">Bienvenue !</h1>
    <p style="color:#9CA3AF;margin:4px 0 0;font-size:13px">BYS Formation</p>
  </div>
  <div style="padding:24px 32px;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 8px 8px">
    <p>Bonjour <strong>{{prenom}} {{nom}}</strong>,</p>
    <p>Bienvenue sur <strong>BYS Formation</strong>, votre plateforme de stages agréés et de formations professionnelles.</p>
    <p>Avec BYS Formation, vous pouvez :</p>
    <ul style="color:#4B5563;line-height:1.8">
      <li>Trouver un stage de récupération de points près de chez vous</li>
      <li>Réserver en ligne en quelques clics</li>
      <li>Recevoir votre convocation automatiquement</li>
      <li>Accéder à toutes vos formations depuis votre espace personnel</li>
    </ul>
    <p>N'hésitez pas à parcourir nos formations disponibles et à réserver votre prochaine session.</p>
    <p style="color:#6B7280;font-size:12px;margin-top:24px">Cordialement,<br/>L'équipe BYS Formation</p>
  </div>
</div>`,
        variables: ["prenom", "nom", "email"],
        isActive: true,
        centreId: null,
      },
    }),
    (prisma as any).emailTemplate.create({
      data: {
        slug: "invitation_centre",
        nom: "Invitation centre",
        sujet: "Bienvenue sur BYS Formation — Votre espace centre est prêt",
        contenu: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;color:#1f2937">
  <div style="background:#0A1628;padding:24px 32px;border-radius:8px 8px 0 0;text-align:center">
    <div style="display:inline-block;background:#2563EB;border-radius:8px;padding:8px 16px;margin-bottom:12px">
      <span style="color:#fff;font-weight:bold;font-size:18px">BYS</span>
    </div>
    <h1 style="color:#fff;margin:0;font-size:22px">Bienvenue sur BYS Formation</h1>
    <p style="color:#9CA3AF;margin:8px 0 0;font-size:13px">Votre espace centre est prêt !</p>
  </div>
  <div style="padding:24px 32px;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 8px 8px">
    <p>Bonjour,</p>
    <p>Nous avons le plaisir de vous informer que votre centre <strong>{{centreName}}</strong> a été créé sur la plateforme <strong>BYS Formation</strong>.</p>
    <p>Votre espace est prêt — il ne reste plus qu'à compléter votre profil pour être visible sur notre marketplace et commencer à recevoir des réservations.</p>
    <div style="background:#F0F9FF;border:1px solid #BAE6FD;border-radius:8px;padding:16px 20px;margin:20px 0">
      <p style="margin:0 0 8px;font-weight:bold;color:#0369A1;font-size:14px">Vos identifiants de connexion :</p>
      <table style="border-collapse:collapse">
        <tr><td style="padding:4px 16px 4px 0;font-weight:bold;color:#0C4A6E;font-size:13px">Email</td><td style="font-size:13px;color:#1E3A5F">{{email}}</td></tr>
        <tr><td style="padding:4px 16px 4px 0;font-weight:bold;color:#0C4A6E;font-size:13px">Mot de passe</td><td style="font-size:13px;color:#1E3A5F;font-family:monospace;background:#E0F2FE;padding:2px 8px;border-radius:4px">{{tempPassword}}</td></tr>
      </table>
    </div>
    <h3 style="color:#1E293B;font-size:15px;margin:24px 0 12px">Les étapes pour démarrer :</h3>
    <ol style="color:#4B5563;line-height:2;font-size:14px;padding-left:20px">
      <li><strong>Informations de base</strong> — Nom, adresse et description (~2 min)</li>
      <li><strong>Contact</strong> — Téléphone, email et site web (~1 min)</li>
      <li><strong>Présentation</strong> — Texte, équipements, certifications (~5 min)</li>
      <li><strong>Première formation</strong> — Créez votre première offre (~5 min)</li>
      <li><strong>Paiement</strong> — Connectez Stripe (~3 min)</li>
    </ol>
    <p style="text-align:center;margin:24px 0">
      <a href="{{loginUrl}}" style="display:inline-block;background:#2563EB;color:#fff;text-decoration:none;padding:14px 32px;border-radius:8px;font-weight:bold;font-size:15px">Accéder à mon espace centre</a>
    </p>
    <p style="color:#6B7280;font-size:12px;margin-top:24px;text-align:center">Cordialement,<br/>L'équipe BYS Formation</p>
  </div>
</div>`,
        variables: ["centreName", "email", "tempPassword", "loginUrl"],
        isActive: true,
        centreId: null,
      },
    }),
    (prisma as any).emailTemplate.create({
      data: {
        slug: "activation_centre",
        nom: "Activation centre",
        sujet: "Votre centre est maintenant visible sur BYS Formation !",
        contenu: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;color:#1f2937">
  <div style="background:#0A1628;padding:24px 32px;border-radius:8px 8px 0 0;text-align:center">
    <div style="display:inline-block;background:#2563EB;border-radius:8px;padding:8px 16px;margin-bottom:12px">
      <span style="color:#fff;font-weight:bold;font-size:18px">BYS</span>
    </div>
    <h1 style="color:#fff;margin:0;font-size:22px">Félicitations !</h1>
    <p style="color:#4ADE80;margin:8px 0 0;font-size:14px;font-weight:bold">Votre centre est maintenant actif</p>
  </div>
  <div style="padding:24px 32px;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 8px 8px">
    <p>Bonjour,</p>
    <p>Excellente nouvelle ! Votre centre <strong>{{centreName}}</strong> a été validé par notre équipe et est désormais <strong>visible sur la marketplace BYS Formation</strong>.</p>
    <div style="background:#F0FDF4;border:1px solid #BBF7D0;border-radius:8px;padding:16px 20px;margin:20px 0;text-align:center">
      <p style="margin:0;color:#166534;font-size:15px;font-weight:bold">Votre centre est en ligne !</p>
      <p style="margin:8px 0 0;color:#15803D;font-size:13px">Les stagiaires peuvent désormais découvrir et réserver vos formations.</p>
    </div>
    <h3 style="color:#1E293B;font-size:15px;margin:24px 0 12px">Prochaines étapes recommandées :</h3>
    <ul style="color:#4B5563;line-height:2;font-size:14px;padding-left:20px">
      <li>Ajoutez d'autres formations pour attirer plus de stagiaires</li>
      <li>Planifiez vos prochaines sessions</li>
      <li>Partagez votre profil sur vos réseaux sociaux</li>
      <li>Consultez votre dashboard pour suivre vos statistiques</li>
    </ul>
    <p style="text-align:center;margin:24px 0">
      <a href="{{dashboardUrl}}" style="display:inline-block;background:#2563EB;color:#fff;text-decoration:none;padding:14px 32px;border-radius:8px;font-weight:bold;font-size:15px">Accéder à mon dashboard</a>
    </p>
    <p style="color:#6B7280;font-size:12px;margin-top:24px;text-align:center">Cordialement,<br/>L'équipe BYS Formation</p>
  </div>
</div>`,
        variables: ["centreName", "dashboardUrl"],
        isActive: true,
        centreId: null,
      },
    }),
    (prisma as any).emailTemplate.create({
      data: {
        slug: "centre_notification",
        nom: "Notification centre",
        sujet: "Nouvelle réservation — {{formation}}",
        contenu: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;color:#1f2937">
  <div style="background:#0A1628;padding:24px 32px;border-radius:8px 8px 0 0">
    <h1 style="color:#fff;margin:0;font-size:22px">Nouvelle réservation</h1>
    <p style="color:#9CA3AF;margin:4px 0 0;font-size:13px">BYS Formation</p>
  </div>
  <div style="padding:24px 32px;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 8px 8px">
    <p>Bonjour,</p>
    <p>Un nouvel élève a réservé une place dans votre formation.</p>
    <table style="width:100%;border-collapse:collapse;margin:16px 0">
      <tr><td style="padding:8px 12px;font-weight:bold;color:#6B7280;width:140px">Élève</td><td style="padding:8px 12px">{{prenom}} {{nom}}</td></tr>
      <tr style="background:#f9fafb"><td style="padding:8px 12px;font-weight:bold;color:#6B7280">Formation</td><td style="padding:8px 12px">{{formation}}</td></tr>
      <tr><td style="padding:8px 12px;font-weight:bold;color:#6B7280">Date</td><td style="padding:8px 12px">{{dateDebut}} - {{dateFin}}</td></tr>
      <tr style="background:#f9fafb"><td style="padding:8px 12px;font-weight:bold;color:#6B7280">N° réservation</td><td style="padding:8px 12px">{{numero}}</td></tr>
      <tr><td style="padding:8px 12px;font-weight:bold;color:#6B7280">Montant</td><td style="padding:8px 12px">{{prix}}</td></tr>
    </table>
    <p>Connectez-vous à votre espace centre pour gérer cette réservation.</p>
    <p style="color:#6B7280;font-size:12px;margin-top:24px">Cordialement,<br/>L'équipe BYS Formation</p>
  </div>
</div>`,
        variables: ["prenom", "nom", "email", "formation", "centre", "dateDebut", "dateFin", "lieu", "prix", "numero"],
        isActive: true,
        centreId: null,
      },
    }),
  ]);
  console.log(`✅ ${emailTemplates.length} templates d'emails par défaut créés.\n`);

  // ─── CODES PROMO ─────────────────────────────────────────
  console.log("🏷️  Création des codes promo...");
  const promoCodes = await Promise.all([
    (prisma as any).promoCode.create({
      data: {
        code: "BIENVENUE10",
        description: "10% de réduction pour les nouveaux utilisateurs",
        type: "POURCENTAGE",
        valeur: 10,
        minAchat: null,
        maxUtilisations: null,
        utilisations: 0,
        dateDebut: new Date("2026-01-01"),
        dateFin: new Date("2026-12-31"),
        isActive: true,
        centreId: null,
      },
    }),
    (prisma as any).promoCode.create({
      data: {
        code: "STAGE20",
        description: "20€ de réduction sur les stages de 200€ minimum",
        type: "MONTANT_FIXE",
        valeur: 20,
        minAchat: 200,
        maxUtilisations: 100,
        utilisations: 0,
        dateDebut: new Date("2026-01-01"),
        dateFin: new Date("2026-12-31"),
        isActive: true,
        centreId: null,
      },
    }),
    (prisma as any).promoCode.create({
      data: {
        code: "BYSOSNY",
        description: "15% de réduction chez BYS Formation Osny",
        type: "POURCENTAGE",
        valeur: 15,
        minAchat: null,
        maxUtilisations: 50,
        utilisations: 0,
        dateDebut: new Date("2026-01-01"),
        dateFin: new Date("2026-12-31"),
        isActive: true,
        centreId: centres[0].id,
      },
    }),
  ]);
  console.log(`✅ ${promoCodes.length} codes promo créés.\n`);

  // ─── ARTICLES / BLOG ────────────────────────────────────────
  console.log("📝 Création des articles de blog...");
  const articles = await Promise.all([
    (prisma as any).article.create({
      data: {
        titre: "Comment fonctionne un stage de récupération de points ?",
        slug: "comment-fonctionne-stage-recuperation-points",
        extrait: "Découvrez le déroulement d'un stage de récupération de points : inscription, programme sur 2 jours, récupération de 4 points et attestation.",
        contenu: `<h2>Qu'est-ce qu'un stage de récupération de points ?</h2>
<p>Le stage de sensibilisation à la sécurité routière, communément appelé stage de récupération de points, est une formation de 2 jours consécutifs (14 heures) qui permet de récupérer jusqu'à 4 points sur votre permis de conduire.</p>
<h2>Qui peut participer ?</h2>
<p>Tout titulaire d'un permis de conduire ayant perdu des points peut effectuer un stage volontaire, à condition de ne pas avoir effectué de stage dans les 12 derniers mois. Le stage peut aussi être imposé par un juge ou dans le cadre du permis probatoire.</p>
<h2>Le déroulement du stage</h2>
<p>Le stage se déroule sur 2 jours consécutifs dans un centre agréé par la préfecture. Il est animé par deux professionnels : un psychologue et un expert en sécurité routière. Le programme comprend des échanges, des études de cas et des ateliers de sensibilisation.</p>
<h2>Combien de points peut-on récupérer ?</h2>
<p>À l'issue du stage, vous récupérez jusqu'à 4 points, dans la limite du plafond de votre permis (12 points pour un permis classique, 6 à 12 points pour un permis probatoire). Les points sont crédités le lendemain du dernier jour de stage.</p>`,
        image: null,
        categorie: "conseils",
        tags: ["recuperation de points", "stage", "permis"],
        isPublished: true,
        publishedAt: new Date("2026-03-15"),
        authorId: admin.id,
      },
    }),
    (prisma as any).article.create({
      data: {
        titre: "Nouvelle réglementation 2026 : ce qui change pour le permis de conduire",
        slug: "nouvelle-reglementation-2026-permis-conduire",
        extrait: "La réforme du permis de conduire 2026 apporte plusieurs changements importants. Passage en revue des nouvelles mesures.",
        contenu: `<h2>Les principaux changements de 2026</h2>
<p>L'année 2026 marque un tournant dans la politique de sécurité routière française. Plusieurs mesures entrent en vigueur pour moderniser le système du permis de conduire et renforcer la prévention.</p>
<h2>Le permis dématérialisé</h2>
<p>Le permis de conduire est désormais disponible sous forme dématérialisée via l'application France Identité. Cette version numérique a la même valeur légale que le document physique et peut être présentée lors des contrôles routiers.</p>
<h2>Renforcement de la formation continue</h2>
<p>Les stages de sensibilisation à la sécurité routière voient leur programme actualisé avec de nouveaux modules sur les mobilités douces, la conduite et les distracteurs (smartphone, GPS intégré).</p>
<h2>Impact sur les centres de formation</h2>
<p>Les centres de formation agréés doivent se conformer aux nouvelles exigences de qualité Qualiopi. Cela garantit aux stagiaires une formation de qualité, dispensée par des professionnels certifiés.</p>`,
        image: null,
        categorie: "reglementation",
        tags: ["reglementation", "2026", "reforme", "permis"],
        isPublished: true,
        publishedAt: new Date("2026-03-20"),
        authorId: admin.id,
      },
    }),
    (prisma as any).article.create({
      data: {
        titre: "5 conseils pour ne pas perdre de points sur son permis",
        slug: "5-conseils-ne-pas-perdre-points-permis",
        extrait: "Adoptez les bons réflexes pour préserver votre capital points. Nos 5 conseils pratiques pour une conduite responsable au quotidien.",
        contenu: `<h2>1. Respectez les limitations de vitesse</h2>
<p>Les excès de vitesse représentent la première cause de perte de points en France. Un petit excès de moins de 20 km/h vous coûte déjà 1 point. Utilisez un régulateur de vitesse et restez vigilant dans les zones de changement de limitation.</p>
<h2>2. Anticipez les contrôles d'alcoolémie</h2>
<p>La conduite sous l'emprise de l'alcool est sévèrement sanctionnée : 6 points retirés pour un taux supérieur à 0,5 g/l. Prévoyez un conducteur désigné ou utilisez un éthylotest avant de prendre le volant.</p>
<h2>3. Rangez votre téléphone</h2>
<p>L'usage du téléphone au volant coûte 3 points et 135 euros d'amende. Activez le mode « ne pas déranger » ou utilisez un kit mains libres homologué.</p>
<h2>4. Respectez les feux et stops</h2>
<p>Griller un feu rouge ou un stop, c'est 4 points en moins et 135 euros d'amende. Ces infractions sont de plus en plus contrôlées par vidéo-verbalisation.</p>
<h2>5. Maintenez votre véhicule en bon état</h2>
<p>Des pneus usés, des feux défectueux ou un contrôle technique périmé peuvent entraîner des sanctions. Un véhicule bien entretenu est aussi un véhicule plus sûr.</p>`,
        image: null,
        categorie: "conseils",
        tags: ["conseils", "points", "prevention", "securite routiere"],
        isPublished: true,
        publishedAt: new Date("2026-03-25"),
        authorId: admin.id,
      },
    }),
  ]);
  console.log(`✅ ${articles.length} articles de blog créés.\n`);

  // ─── RÉSUMÉ ──────────────────────────────────────────────
  console.log("═══════════════════════════════════════════");
  console.log("🌱 Seeding terminé avec succès !");
  console.log("═══════════════════════════════════════════");
  console.log(`  📂 ${categories.length} catégories`);
  console.log(`  💎 ${subscriptionPlans.length} plans d'abonnement`);
  console.log(`  👤 ${1 + 1 + 1 + 1 + 1 + centreUsers.length + 3 + eleves.length} utilisateurs (1 owner, 1 admin, 1 support, 1 comptable, 1 commercial, 5 centre owners, 3 membres centre, 9 élèves)`);
  console.log(`  🏢 ${centres.length} centres`);
  console.log(`  👥 3 membres de centres`);
  console.log(`  📚 ${allFormations.length} formations`);
  console.log(`  📅 ${sessions.length} sessions`);
  console.log(`  🎫 ${reservations.length} réservations`);
  console.log(`  ❓ 8 FAQ`);
  console.log(`  🔔 5 notifications`);
  console.log(`  📧 ${emailTemplates.length} templates d'emails`);
  console.log(`  🏷️  ${promoCodes.length} codes promo`);
  console.log(`  📝 ${articles.length} articles de blog`);
  console.log(`  ⚙️  1 paramètre plateforme`);
  console.log("═══════════════════════════════════════════\n");
}

main()
  .catch((e) => {
    console.error("❌ Erreur lors du seeding :", e);
    process.exit(1);
  })
  .finally(async () => {
    await (prisma as any).$disconnect();
  });
