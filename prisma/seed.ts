/* eslint-disable @typescript-eslint/no-explicit-any */
// Seed scripts use `any` for Prisma's dynamic create payloads (nested includes,
// connect-or-create, polymorphic upserts). Strict typing here would add 100s of
// lines of Prisma.XxxCreateInput boilerplate for zero runtime benefit. Out of
// production code path.
import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new (PrismaClient as any)({ adapter }) as InstanceType<typeof PrismaClient>;

async function main() {
  console.log("🌱 Début du seeding...\n");

  // ─── NETTOYAGE (ordre inverse des dépendances) ───────────
  console.log("🗑️  Suppression des données existantes...");
  await (prisma as any).availability.deleteMany();
  await (prisma as any).loyaltyPoints.deleteMany();
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
  // Scope V1 (mai 2026) : une seule catégorie, le stage de récupération de points.
  // Le modèle Categorie reste en place pour permettre d'autres catégories dans le futur.
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
  ]);

  const [catRecup] = categories;
  console.log(`✅ ${categories.length} catégorie créée.\n`);

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
    // Élèves supplémentaires pour densifier réservations, reviews et messagerie
    (prisma as any).user.create({
      data: {
        auth0Id: "auth0|eleve010",
        email: "julien.rousseau@gmail.com",
        nom: "Rousseau",
        prenom: "Julien",
        telephone: "06 12 45 78 90",
        adresse: "9 Rue des Acacias",
        codePostal: "75012",
        ville: "Paris",
        role: "ELEVE",
        emailVerified: true,
      },
    }),
    (prisma as any).user.create({
      data: {
        auth0Id: "auth0|eleve011",
        email: "fanny.michel@outlook.fr",
        nom: "Michel",
        prenom: "Fanny",
        telephone: "06 23 56 89 01",
        adresse: "27 Boulevard Voltaire",
        codePostal: "75011",
        ville: "Paris",
        role: "ELEVE",
        emailVerified: true,
      },
    }),
    (prisma as any).user.create({
      data: {
        auth0Id: "auth0|eleve012",
        email: "mehdi.belkacem@gmail.com",
        nom: "Belkacem",
        prenom: "Mehdi",
        telephone: "06 34 67 90 12",
        adresse: "14 Rue de la République",
        codePostal: "69002",
        ville: "Lyon",
        role: "ELEVE",
        emailVerified: true,
      },
    }),
    (prisma as any).user.create({
      data: {
        auth0Id: "auth0|eleve013",
        email: "elodie.fournier@hotmail.fr",
        nom: "Fournier",
        prenom: "Élodie",
        telephone: "06 45 78 01 23",
        adresse: "5 Place Bellecour",
        codePostal: "69002",
        ville: "Lyon",
        role: "ELEVE",
        emailVerified: true,
      },
    }),
    (prisma as any).user.create({
      data: {
        auth0Id: "auth0|eleve014",
        email: "nicolas.faure@free.fr",
        nom: "Faure",
        prenom: "Nicolas",
        telephone: "06 56 89 12 34",
        adresse: "33 Avenue du Prado",
        codePostal: "13008",
        ville: "Marseille",
        role: "ELEVE",
        emailVerified: true,
      },
    }),
    (prisma as any).user.create({
      data: {
        auth0Id: "auth0|eleve015",
        email: "celine.barbier@gmail.com",
        nom: "Barbier",
        prenom: "Céline",
        telephone: "06 67 90 23 45",
        adresse: "11 Cours Julien",
        codePostal: "13006",
        ville: "Marseille",
        role: "ELEVE",
        emailVerified: true,
      },
    }),
    (prisma as any).user.create({
      data: {
        auth0Id: "auth0|eleve016",
        email: "florian.morel@yahoo.fr",
        nom: "Morel",
        prenom: "Florian",
        telephone: "06 78 01 34 56",
        adresse: "8 Rue des Frères Lumière",
        codePostal: "95800",
        ville: "Cergy",
        role: "ELEVE",
        emailVerified: true,
      },
    }),
    (prisma as any).user.create({
      data: {
        auth0Id: "auth0|eleve017",
        email: "sarah.benabid@gmail.com",
        nom: "Benabid",
        prenom: "Sarah",
        telephone: "06 89 12 45 67",
        adresse: "21 Boulevard Pereire",
        codePostal: "75017",
        ville: "Paris",
        role: "ELEVE",
        emailVerified: true,
      },
    }),
    (prisma as any).user.create({
      data: {
        auth0Id: "auth0|eleve018",
        email: "thierry.lopez@orange.fr",
        nom: "Lopez",
        prenom: "Thierry",
        telephone: "06 90 23 56 78",
        adresse: "47 Rue de la Liberté",
        codePostal: "95300",
        ville: "Pontoise",
        role: "ELEVE",
        emailVerified: true,
      },
    }),
    (prisma as any).user.create({
      data: {
        auth0Id: "auth0|eleve019",
        email: "ines.giraud@laposte.net",
        nom: "Giraud",
        prenom: "Inès",
        telephone: "06 01 34 67 89",
        adresse: "12 Allée Mendès France",
        codePostal: "69007",
        ville: "Lyon",
        role: "ELEVE",
        emailVerified: true,
      },
    }),
    (prisma as any).user.create({
      data: {
        auth0Id: "auth0|eleve020",
        email: "kevin.roux@gmail.com",
        nom: "Roux",
        prenom: "Kévin",
        telephone: "06 13 46 79 02",
        adresse: "73 Avenue de la Capelette",
        codePostal: "13010",
        ville: "Marseille",
        role: "ELEVE",
        emailVerified: true,
      },
    }),
    (prisma as any).user.create({
      data: {
        auth0Id: "auth0|eleve021",
        email: "manon.leclerc@outlook.fr",
        nom: "Leclerc",
        prenom: "Manon",
        telephone: "06 24 57 80 13",
        adresse: "3 Rue du Marché",
        codePostal: "95520",
        ville: "Osny",
        role: "ELEVE",
        emailVerified: true,
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
          "Centre agréé préfecture du Val-d'Oise, spécialisé dans les stages de récupération de points du permis de conduire.",
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
        // Identité visuelle
        logo: "https://api.dicebear.com/7.x/initials/svg?seed=BYS%20Osny&backgroundColor=0A1628&textColor=FFFFFF&fontWeight=700",
        bannerImage: "https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?auto=format&fit=crop&w=1200&q=80",
        // Personnalisation
        couleurPrimaire: "#2563EB",
        couleurSecondaire: "#1E40AF",
        presentationHtml: "<p>Bienvenue chez <strong>BYS Formation</strong>, votre centre agréé par la préfecture du Val-d'Oise pour les <strong>stages de récupération de points du permis de conduire</strong>. Nos formateurs (psychologue + expert sécurité routière) vous accompagnent sur 2 jours dans un cadre moderne et convivial.</p><ul><li>Plus de 10 ans d'expérience</li><li>Taux de satisfaction supérieur à 95%</li><li>Formateurs certifiés BAFM</li></ul>",
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
          "Centre agréé préfecture de Paris, situé au cœur du 11ème arrondissement. Stages de récupération de points toute l'année.",
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
        // Identité visuelle
        logo: "https://api.dicebear.com/7.x/initials/svg?seed=CP%20Paris&backgroundColor=10B981&textColor=FFFFFF&fontWeight=700",
        bannerImage: "https://images.unsplash.com/photo-1499856871958-5b9627545d1a?auto=format&fit=crop&w=1200&q=80",
        // Personnalisation
        couleurPrimaire: "#10B981",
        couleurSecondaire: "#059669",
        presentationHtml: "<p><strong>Conduite Plus</strong> est votre centre de référence dans le 11ème arrondissement de Paris pour les stages de récupération de points. Notre équipe dynamique vous accompagne sur 2 jours dans une démarche bienveillante et constructive.</p>",
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
          "Centre de Formation à la Sécurité Routière en Rhône-Alpes. Agréé préfecture du Rhône, nous proposons des stages de récupération de points dans une ambiance bienveillante.",
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
        logo: "https://api.dicebear.com/7.x/initials/svg?seed=CFSR%20Lyon&backgroundColor=DC2626&textColor=FFFFFF&fontWeight=700",
        bannerImage: "https://images.unsplash.com/photo-1502920917128-1aa500764cbd?auto=format&fit=crop&w=1200&q=80",
      },
    }),
    (prisma as any).centre.create({
      data: {
        nom: "Permis Express Marseille",
        slug: "permis-express-marseille",
        description:
          "Centre agréé préfecture des Bouches-du-Rhône, situé dans le 8ème arrondissement de Marseille. Spécialisé dans les stages express de récupération de points (2 jours).",
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
        logo: "https://api.dicebear.com/7.x/initials/svg?seed=PE%20Marseille&backgroundColor=F59E0B&textColor=FFFFFF&fontWeight=700",
        bannerImage: "https://images.unsplash.com/photo-1568827999250-3f6afff96e66?auto=format&fit=crop&w=1200&q=80",
      },
    }),
    (prisma as any).centre.create({
      data: {
        nom: "Sécurité Routière Nantes",
        slug: "securite-routiere-nantes",
        description:
          "Nouveau centre à Nantes, en attente de validation préfectorale. Nous proposerons des stages de récupération de points en plein centre-ville.",
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
        logo: "https://api.dicebear.com/7.x/initials/svg?seed=SR%20Nantes&backgroundColor=6366F1&textColor=FFFFFF&fontWeight=700",
        bannerImage: "https://images.unsplash.com/photo-1542362567-b07e54358753?auto=format&fit=crop&w=1200&q=80",
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
        "Second centre BYS Formation, situé à Cergy-Pontoise. Stages de récupération de points du permis de conduire.",
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
      logo: "https://api.dicebear.com/7.x/initials/svg?seed=BYS%20Cergy&backgroundColor=0A1628&textColor=FFFFFF&fontWeight=700",
      bannerImage: "https://images.unsplash.com/photo-1486325212027-8081e485255e?auto=format&fit=crop&w=1200&q=80",
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

  // Conduite Plus Paris — 1 formation (récup points uniquement, scope V1)
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

  // CFSR Lyon — 1 formation (récup points uniquement, scope V1)
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

  // Permis Express Marseille — 1 formation (récup points uniquement, scope V1)
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

  // BYS Formation Cergy — 1 formation (second centre BYS, scope V1)
  const formCergyRecup = await (prisma as any).formation.create({
    data: {
      titre: "Stage de récupération de points - Cergy",
      slug: "stage-recuperation-points-cergy",
      description:
        "Stage agréé préfecture du Val-d'Oise, dispensé dans nos locaux de Cergy-Pontoise (à 5 min de la gare). Récupérez jusqu'à 4 points en 2 jours, mêmes formateurs et même qualité que notre centre d'Osny.",
      objectifs:
        "Récupérer jusqu'à 4 points. Identifier ses comportements à risque. Repartir avec une feuille de route personnelle.",
      programme:
        "Jour 1 : Accueil, analyse de l'accidentologie, focus vitesse et distances. Jour 2 : Alcool/stupéfiants, fatigue, distracteurs, engagement personnel, attestation.",
      prerequis: "Permis de conduire en cours de validité. Pas de stage dans les 12 derniers mois.",
      publicCible: "Conducteurs du Val-d'Oise et de l'ouest francilien",
      duree: "2 jours",
      prix: 240,
      modalite: "PRESENTIEL",
      lieu: "5 Place des Merveilles, 95800 Cergy",
      isQualiopi: true,
      isCPF: false,
      isActive: true,
      centreId: centreOsny2.id,
      categorieId: catRecup.id,
    },
  });

  // Sécurité Routière Nantes — 1 formation (centre en attente, récup points uniquement)
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

  const allFormations = [
    formBysRecup,
    formParisRecup,
    formLyonRecup,
    formMarseilleRecup,
    formCergyRecup,
    formNantesRecup,
  ];
  console.log(`✅ ${allFormations.length} formations créées.\n`);

  // ─── 5. SESSIONS ─────────────────────────────────────────
  console.log("📅 Création des sessions...");

  // Helper to create dates
  const d = (year: number, month: number, day: number, hour = 9) =>
    new Date(year, month - 1, day, hour, 0, 0);

  const sessions = await Promise.all([
    // ─── BYS Osny - Récup ────────────────────────────────────
    // Sessions passées (dateDebut < 2026-05-11) → statut PASSEE
    (prisma as any).session.create({
      data: {
        dateDebut: d(2026, 4, 6, 9),
        dateFin: d(2026, 4, 7, 17),
        placesTotal: 20,
        placesRestantes: 3,
        status: "PASSEE",
        formationId: formBysRecup.id,
      },
    }),
    (prisma as any).session.create({
      data: {
        dateDebut: d(2026, 4, 20, 9),
        dateFin: d(2026, 4, 21, 17),
        placesTotal: 20,
        placesRestantes: 12,
        status: "PASSEE",
        formationId: formBysRecup.id,
      },
    }),
    // Session "en cours" - démarre aujourd'hui
    (prisma as any).session.create({
      data: {
        dateDebut: d(2026, 5, 11, 9),
        dateFin: d(2026, 5, 12, 17),
        placesTotal: 20,
        placesRestantes: 4,
        status: "ACTIVE",
        formationId: formBysRecup.id,
      },
    }),
    // Sessions futures BYS Osny (6 supplémentaires : juin → septembre 2026)
    (prisma as any).session.create({
      data: {
        dateDebut: d(2026, 6, 8, 9),
        dateFin: d(2026, 6, 9, 17),
        placesTotal: 20,
        placesRestantes: 11,
        status: "ACTIVE",
        formationId: formBysRecup.id,
      },
    }),
    (prisma as any).session.create({
      data: {
        dateDebut: d(2026, 6, 22, 9),
        dateFin: d(2026, 6, 23, 17),
        placesTotal: 18,
        placesRestantes: 0,
        status: "COMPLETE",
        formationId: formBysRecup.id,
      },
    }),
    (prisma as any).session.create({
      data: {
        dateDebut: d(2026, 7, 6, 9),
        dateFin: d(2026, 7, 7, 17),
        placesTotal: 20,
        placesRestantes: 14,
        status: "ACTIVE",
        formationId: formBysRecup.id,
      },
    }),
    (prisma as any).session.create({
      data: {
        dateDebut: d(2026, 7, 20, 9),
        dateFin: d(2026, 7, 21, 17),
        placesTotal: 20,
        placesRestantes: 17,
        status: "ACTIVE",
        formationId: formBysRecup.id,
      },
    }),
    (prisma as any).session.create({
      data: {
        dateDebut: d(2026, 8, 24, 9),
        dateFin: d(2026, 8, 25, 17),
        placesTotal: 18,
        placesRestantes: 16,
        status: "ACTIVE",
        formationId: formBysRecup.id,
      },
    }),
    (prisma as any).session.create({
      data: {
        dateDebut: d(2026, 9, 14, 9),
        dateFin: d(2026, 9, 15, 17),
        placesTotal: 20,
        placesRestantes: 18,
        status: "ACTIVE",
        formationId: formBysRecup.id,
      },
    }),

    // ─── Paris - Récup ───────────────────────────────────────
    (prisma as any).session.create({
      data: {
        dateDebut: d(2026, 3, 2, 9),
        dateFin: d(2026, 3, 3, 17),
        placesTotal: 20,
        placesRestantes: 0,
        status: "PASSEE",
        formationId: formParisRecup.id,
      },
    }),
    (prisma as any).session.create({
      data: {
        dateDebut: d(2026, 4, 13, 9),
        dateFin: d(2026, 4, 14, 17),
        placesTotal: 20,
        placesRestantes: 5,
        status: "PASSEE",
        formationId: formParisRecup.id,
      },
    }),
    // Sessions futures Paris (8 sessions, cadence 2/mois)
    (prisma as any).session.create({
      data: {
        dateDebut: d(2026, 5, 18, 9),
        dateFin: d(2026, 5, 19, 17),
        placesTotal: 20,
        placesRestantes: 7,
        status: "ACTIVE",
        formationId: formParisRecup.id,
      },
    }),
    (prisma as any).session.create({
      data: {
        dateDebut: d(2026, 6, 1, 9),
        dateFin: d(2026, 6, 2, 17),
        placesTotal: 18,
        placesRestantes: 0,
        status: "COMPLETE",
        formationId: formParisRecup.id,
      },
    }),
    (prisma as any).session.create({
      data: {
        dateDebut: d(2026, 6, 15, 9),
        dateFin: d(2026, 6, 16, 17),
        placesTotal: 20,
        placesRestantes: 9,
        status: "ACTIVE",
        formationId: formParisRecup.id,
      },
    }),
    (prisma as any).session.create({
      data: {
        dateDebut: d(2026, 7, 6, 9),
        dateFin: d(2026, 7, 7, 17),
        placesTotal: 20,
        placesRestantes: 12,
        status: "ACTIVE",
        formationId: formParisRecup.id,
      },
    }),
    (prisma as any).session.create({
      data: {
        dateDebut: d(2026, 7, 20, 9),
        dateFin: d(2026, 7, 21, 17),
        placesTotal: 20,
        placesRestantes: 4,
        status: "ACTIVE",
        formationId: formParisRecup.id,
      },
    }),
    (prisma as any).session.create({
      data: {
        dateDebut: d(2026, 8, 10, 9),
        dateFin: d(2026, 8, 11, 17),
        placesTotal: 18,
        placesRestantes: 0,
        status: "COMPLETE",
        formationId: formParisRecup.id,
      },
    }),
    (prisma as any).session.create({
      data: {
        dateDebut: d(2026, 8, 24, 9),
        dateFin: d(2026, 8, 25, 17),
        placesTotal: 20,
        placesRestantes: 15,
        status: "ACTIVE",
        formationId: formParisRecup.id,
      },
    }),
    (prisma as any).session.create({
      data: {
        dateDebut: d(2026, 9, 7, 9),
        dateFin: d(2026, 9, 8, 17),
        placesTotal: 20,
        placesRestantes: 17,
        status: "ACTIVE",
        formationId: formParisRecup.id,
      },
    }),
    (prisma as any).session.create({
      data: {
        dateDebut: d(2026, 9, 21, 9),
        dateFin: d(2026, 9, 22, 17),
        placesTotal: 18,
        placesRestantes: 16,
        status: "ACTIVE",
        formationId: formParisRecup.id,
      },
    }),

    // ─── Lyon - Récup ────────────────────────────────────────
    (prisma as any).session.create({
      data: {
        dateDebut: d(2026, 3, 9, 9),
        dateFin: d(2026, 3, 10, 17),
        placesTotal: 22,
        placesRestantes: 0,
        status: "PASSEE",
        formationId: formLyonRecup.id,
      },
    }),
    (prisma as any).session.create({
      data: {
        dateDebut: d(2026, 4, 27, 9),
        dateFin: d(2026, 4, 28, 17),
        placesTotal: 22,
        placesRestantes: 9,
        status: "PASSEE",
        formationId: formLyonRecup.id,
      },
    }),
    // Sessions futures Lyon (4 sessions)
    (prisma as any).session.create({
      data: {
        dateDebut: d(2026, 6, 22, 9),
        dateFin: d(2026, 6, 23, 17),
        placesTotal: 16,
        placesRestantes: 8,
        status: "ACTIVE",
        formationId: formLyonRecup.id,
      },
    }),
    (prisma as any).session.create({
      data: {
        dateDebut: d(2026, 7, 13, 9),
        dateFin: d(2026, 7, 14, 17),
        placesTotal: 16,
        placesRestantes: 13,
        status: "ACTIVE",
        formationId: formLyonRecup.id,
      },
    }),
    (prisma as any).session.create({
      data: {
        dateDebut: d(2026, 8, 17, 9),
        dateFin: d(2026, 8, 18, 17),
        placesTotal: 16,
        placesRestantes: 14,
        status: "ACTIVE",
        formationId: formLyonRecup.id,
      },
    }),
    (prisma as any).session.create({
      data: {
        dateDebut: d(2026, 9, 28, 9),
        dateFin: d(2026, 9, 29, 17),
        placesTotal: 14,
        placesRestantes: 12,
        status: "ACTIVE",
        formationId: formLyonRecup.id,
      },
    }),

    // ─── Marseille - Récup ───────────────────────────────────
    (prisma as any).session.create({
      data: {
        dateDebut: d(2026, 3, 16, 9),
        dateFin: d(2026, 3, 17, 17),
        placesTotal: 18,
        placesRestantes: 0,
        status: "PASSEE",
        formationId: formMarseilleRecup.id,
      },
    }),
    (prisma as any).session.create({
      data: {
        dateDebut: d(2026, 5, 4, 9),
        dateFin: d(2026, 5, 5, 17),
        placesTotal: 18,
        placesRestantes: 7,
        status: "PASSEE",
        formationId: formMarseilleRecup.id,
      },
    }),
    // Sessions futures Marseille (4 sessions)
    (prisma as any).session.create({
      data: {
        dateDebut: d(2026, 6, 29, 9),
        dateFin: d(2026, 6, 30, 17),
        placesTotal: 14,
        placesRestantes: 6,
        status: "ACTIVE",
        formationId: formMarseilleRecup.id,
      },
    }),
    (prisma as any).session.create({
      data: {
        dateDebut: d(2026, 7, 27, 9),
        dateFin: d(2026, 7, 28, 17),
        placesTotal: 12,
        placesRestantes: 0,
        status: "COMPLETE",
        formationId: formMarseilleRecup.id,
      },
    }),
    (prisma as any).session.create({
      data: {
        dateDebut: d(2026, 8, 31, 9),
        dateFin: d(2026, 9, 1, 17),
        placesTotal: 14,
        placesRestantes: 10,
        status: "ACTIVE",
        formationId: formMarseilleRecup.id,
      },
    }),
    (prisma as any).session.create({
      data: {
        dateDebut: d(2026, 9, 21, 9),
        dateFin: d(2026, 9, 22, 17),
        placesTotal: 14,
        placesRestantes: 13,
        status: "ACTIVE",
        formationId: formMarseilleRecup.id,
      },
    }),

    // ─── BYS Cergy - Récup (2 sessions futures) ──────────────
    (prisma as any).session.create({
      data: {
        dateDebut: d(2026, 7, 13, 9),
        dateFin: d(2026, 7, 14, 17),
        placesTotal: 16,
        placesRestantes: 11,
        status: "ACTIVE",
        formationId: formCergyRecup.id,
      },
    }),
    (prisma as any).session.create({
      data: {
        dateDebut: d(2026, 9, 14, 9),
        dateFin: d(2026, 9, 15, 17),
        placesTotal: 16,
        placesRestantes: 15,
        status: "ACTIVE",
        formationId: formCergyRecup.id,
      },
    }),

  ]);

  console.log(`✅ ${sessions.length} sessions créées.\n`);

  // ─── 6. RÉSERVATIONS ─────────────────────────────────────
  console.log("🎫 Création des réservations...");

  const reservations = await Promise.all([
    // Karim → BYS Osny Récup session 1 PASSEE (terminée)
    (prisma as any).reservation.create({
      data: {
        numero: "RES-2026-0001",
        status: "TERMINEE",
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
        sessionId: sessions[0].id, // BYS Récup #1 PASSEE
      },
    }),
    // Marie → Lyon Récup #2 PASSEE (terminée)
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
        sessionId: sessions[21].id, // Lyon récup #2 PASSEE
      },
    }),
    // Lucas → Marseille Récup #2 PASSEE (terminée)
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
        sessionId: sessions[27].id, // Marseille récup #2 PASSEE
      },
    }),
    // Amina → Paris Récup session 2026-05-18 (active)
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
        sessionId: sessions[11].id, // Paris récup 2026-05-18 ACTIVE
      },
    }),
    // Alexandre → BYS Osny Récup session 2 PASSEE
    (prisma as any).reservation.create({
      data: {
        numero: "RES-2026-0005",
        status: "TERMINEE",
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
        sessionId: sessions[1].id, // BYS Récup #2 PASSEE
      },
    }),
    // Karim → Paris Récup #2 PASSEE (terminée - double réservation, different stage)
    (prisma as any).reservation.create({
      data: {
        numero: "RES-2026-0006",
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
        sessionId: sessions[10].id, // Paris récup #2 PASSEE
      },
    }),
  ]);

  console.log(`✅ ${reservations.length} réservations créées.\n`);

  // ─── 6b. RÉSERVATIONS SUPPLÉMENTAIRES (densité catalogue) ──
  console.log("🎫 Création des réservations supplémentaires...");
  const extraReservations = await Promise.all([
    // ─── CONFIRMEE (futur, ~60%) ────────────────────────────
    (prisma as any).reservation.create({ data: { numero: "RES-2026-0101", status: "CONFIRMEE", montant: 250, commissionMontant: 25, civilite: "M.", nom: "Rousseau", prenom: "Julien", email: "julien.rousseau@gmail.com", telephone: "06 12 45 78 90", adresse: "9 Rue des Acacias", codePostal: "75012", ville: "Paris", numeroPermis: "75JR00001", userId: eleves[9].id, sessionId: sessions[3].id } }),
    (prisma as any).reservation.create({ data: { numero: "RES-2026-0102", status: "CONFIRMEE", montant: 250, commissionMontant: 25, civilite: "Mme", nom: "Michel", prenom: "Fanny", email: "fanny.michel@outlook.fr", telephone: "06 23 56 89 01", adresse: "27 Boulevard Voltaire", codePostal: "75011", ville: "Paris", numeroPermis: "75FM00002", userId: eleves[10].id, sessionId: sessions[13].id } }),
    (prisma as any).reservation.create({ data: { numero: "RES-2026-0103", status: "CONFIRMEE", montant: 230, commissionMontant: 23, civilite: "M.", nom: "Belkacem", prenom: "Mehdi", email: "mehdi.belkacem@gmail.com", telephone: "06 34 67 90 12", adresse: "14 Rue de la République", codePostal: "69002", ville: "Lyon", numeroPermis: "69MB00003", userId: eleves[11].id, sessionId: sessions[22].id } }),
    (prisma as any).reservation.create({ data: { numero: "RES-2026-0104", status: "CONFIRMEE", montant: 230, commissionMontant: 23, civilite: "Mme", nom: "Fournier", prenom: "Élodie", email: "elodie.fournier@hotmail.fr", telephone: "06 45 78 01 23", adresse: "5 Place Bellecour", codePostal: "69002", ville: "Lyon", numeroPermis: "69EF00004", userId: eleves[12].id, sessionId: sessions[23].id } }),
    (prisma as any).reservation.create({ data: { numero: "RES-2026-0105", status: "CONFIRMEE", montant: 220, commissionMontant: 22, civilite: "M.", nom: "Faure", prenom: "Nicolas", email: "nicolas.faure@free.fr", telephone: "06 56 89 12 34", adresse: "33 Avenue du Prado", codePostal: "13008", ville: "Marseille", numeroPermis: "13NF00005", userId: eleves[13].id, sessionId: sessions[28].id } }),
    (prisma as any).reservation.create({ data: { numero: "RES-2026-0106", status: "CONFIRMEE", montant: 220, commissionMontant: 22, civilite: "Mme", nom: "Barbier", prenom: "Céline", email: "celine.barbier@gmail.com", telephone: "06 67 90 23 45", adresse: "11 Cours Julien", codePostal: "13006", ville: "Marseille", numeroPermis: "13CB00006", userId: eleves[14].id, sessionId: sessions[30].id } }),
    (prisma as any).reservation.create({ data: { numero: "RES-2026-0107", status: "CONFIRMEE", montant: 240, commissionMontant: 24, civilite: "M.", nom: "Morel", prenom: "Florian", email: "florian.morel@yahoo.fr", telephone: "06 78 01 34 56", adresse: "8 Rue des Frères Lumière", codePostal: "95800", ville: "Cergy", numeroPermis: "95FM00007", userId: eleves[15].id, sessionId: sessions[32].id } }),
    (prisma as any).reservation.create({ data: { numero: "RES-2026-0108", status: "CONFIRMEE", montant: 280, commissionMontant: 28, civilite: "Mme", nom: "Benabid", prenom: "Sarah", email: "sarah.benabid@gmail.com", telephone: "06 89 12 45 67", adresse: "21 Boulevard Pereire", codePostal: "75017", ville: "Paris", numeroPermis: "75SB00008", userId: eleves[16].id, sessionId: sessions[14].id } }),
    (prisma as any).reservation.create({ data: { numero: "RES-2026-0109", status: "CONFIRMEE", montant: 250, commissionMontant: 25, civilite: "M.", nom: "Lopez", prenom: "Thierry", email: "thierry.lopez@orange.fr", telephone: "06 90 23 56 78", adresse: "47 Rue de la Liberté", codePostal: "95300", ville: "Pontoise", numeroPermis: "95TL00009", userId: eleves[17].id, sessionId: sessions[5].id } }),
    (prisma as any).reservation.create({ data: { numero: "RES-2026-0110", status: "CONFIRMEE", montant: 230, commissionMontant: 23, civilite: "Mme", nom: "Giraud", prenom: "Inès", email: "ines.giraud@laposte.net", telephone: "06 01 34 67 89", adresse: "12 Allée Mendès France", codePostal: "69007", ville: "Lyon", numeroPermis: "69IG00010", userId: eleves[18].id, sessionId: sessions[24].id } }),
    (prisma as any).reservation.create({ data: { numero: "RES-2026-0111", status: "CONFIRMEE", montant: 220, commissionMontant: 22, civilite: "M.", nom: "Roux", prenom: "Kévin", email: "kevin.roux@gmail.com", telephone: "06 13 46 79 02", adresse: "73 Avenue de la Capelette", codePostal: "13010", ville: "Marseille", numeroPermis: "13KR00011", userId: eleves[19].id, sessionId: sessions[31].id } }),
    (prisma as any).reservation.create({ data: { numero: "RES-2026-0112", status: "CONFIRMEE", montant: 250, commissionMontant: 25, civilite: "Mme", nom: "Leclerc", prenom: "Manon", email: "manon.leclerc@outlook.fr", telephone: "06 24 57 80 13", adresse: "3 Rue du Marché", codePostal: "95520", ville: "Osny", numeroPermis: "95ML00012", userId: eleves[20].id, sessionId: sessions[7].id } }),
    (prisma as any).reservation.create({ data: { numero: "RES-2026-0113", status: "CONFIRMEE", montant: 280, commissionMontant: 28, civilite: "M.", nom: "Bouaziz", prenom: "Karim", email: "karim.bouaziz@gmail.com", telephone: "06 11 22 33 44", adresse: "8 Rue des Lilas", codePostal: "75020", ville: "Paris", numeroPermis: "12AA34567", userId: eleves[0].id, sessionId: sessions[17].id } }),
    (prisma as any).reservation.create({ data: { numero: "RES-2026-0114", status: "CONFIRMEE", montant: 230, commissionMontant: 23, civilite: "Mme", nom: "Durand", prenom: "Marie", email: "marie.durand@outlook.fr", telephone: "06 22 33 44 55", adresse: "14 Avenue Jean Jaurès", codePostal: "69007", ville: "Lyon", numeroPermis: "07BB89012", userId: eleves[1].id, sessionId: sessions[25].id } }),
    (prisma as any).reservation.create({ data: { numero: "RES-2026-0115", status: "CONFIRMEE", montant: 220, commissionMontant: 22, civilite: "M.", nom: "Martin", prenom: "Lucas", email: "lucas.martin@gmail.com", telephone: "06 33 44 55 66", adresse: "27 Boulevard Gambetta", codePostal: "13001", ville: "Marseille", numeroPermis: "13CC45678", userId: eleves[2].id, sessionId: sessions[30].id } }),
    (prisma as any).reservation.create({ data: { numero: "RES-2026-0116", status: "CONFIRMEE", montant: 250, commissionMontant: 25, civilite: "Mme", nom: "Lemaire", prenom: "Sophie", email: "sophie.lemaire@yahoo.fr", telephone: "06 66 77 88 99", adresse: "19 Allée des Demoiselles", codePostal: "31000", ville: "Toulouse", numeroPermis: "31SL45611", userId: eleves[5].id, sessionId: sessions[6].id } }),
    (prisma as any).reservation.create({ data: { numero: "RES-2026-0117", status: "CONFIRMEE", montant: 280, commissionMontant: 28, civilite: "M.", nom: "Garnier", prenom: "Pierre", email: "pierre.garnier@free.fr", telephone: "06 55 66 77 88", adresse: "56 Rue Nationale", codePostal: "59000", ville: "Lille", numeroPermis: "59PG23399", userId: eleves[4].id, sessionId: sessions[18].id } }),
    (prisma as any).reservation.create({ data: { numero: "RES-2026-0118", status: "CONFIRMEE", montant: 240, commissionMontant: 24, civilite: "M.", nom: "El Mansouri", prenom: "Youssef", email: "youssef.elmansouri@gmail.com", telephone: "06 77 88 99 00", adresse: "41 Rue du Maréchal Foch", codePostal: "44000", ville: "Nantes", numeroPermis: "44YE12321", userId: eleves[6].id, sessionId: sessions[33].id } }),
    (prisma as any).reservation.create({ data: { numero: "RES-2026-0119", status: "CONFIRMEE", montant: 250, commissionMontant: 25, civilite: "Mme", nom: "Bernard", prenom: "Chloé", email: "chloe.bernard@laposte.net", telephone: "06 88 99 00 11", adresse: "7 Quai des Bateliers", codePostal: "67000", ville: "Strasbourg", numeroPermis: "67CB55512", userId: eleves[7].id, sessionId: sessions[8].id } }),
    (prisma as any).reservation.create({ data: { numero: "RES-2026-0120", status: "CONFIRMEE", montant: 230, commissionMontant: 23, civilite: "Mme", nom: "Diallo", prenom: "Amina", email: "amina.diallo@hotmail.fr", telephone: "06 44 55 66 77", adresse: "3 Rue Sainte-Catherine", codePostal: "33000", ville: "Bordeaux", numeroPermis: "33DD90123", userId: eleves[3].id, sessionId: sessions[22].id } }),
    (prisma as any).reservation.create({ data: { numero: "RES-2026-0121", status: "CONFIRMEE", montant: 250, commissionMontant: 25, civilite: "M.", nom: "Petit", prenom: "Alexandre", email: "alexandre.petit@orange.fr", telephone: "06 99 00 11 22", adresse: "23 Chaussée Jules César", codePostal: "95520", ville: "Osny", numeroPermis: "95FF67890", userId: eleves[8].id, sessionId: sessions[6].id } }),
    (prisma as any).reservation.create({ data: { numero: "RES-2026-0122", status: "CONFIRMEE", montant: 280, commissionMontant: 28, civilite: "Mme", nom: "Michel", prenom: "Fanny", email: "fanny.michel@outlook.fr", telephone: "06 23 56 89 01", adresse: "27 Boulevard Voltaire", codePostal: "75011", ville: "Paris", numeroPermis: "75FM00002", userId: eleves[10].id, sessionId: sessions[19].id } }),
    (prisma as any).reservation.create({ data: { numero: "RES-2026-0123", status: "CONFIRMEE", montant: 250, commissionMontant: 25, civilite: "M.", nom: "Faure", prenom: "Nicolas", email: "nicolas.faure@free.fr", telephone: "06 56 89 12 34", adresse: "33 Avenue du Prado", codePostal: "13008", ville: "Marseille", numeroPermis: "13NF00005", userId: eleves[13].id, sessionId: sessions[5].id } }),
    (prisma as any).reservation.create({ data: { numero: "RES-2026-0124", status: "CONFIRMEE", montant: 230, commissionMontant: 23, civilite: "M.", nom: "Belkacem", prenom: "Mehdi", email: "mehdi.belkacem@gmail.com", telephone: "06 34 67 90 12", adresse: "14 Rue de la République", codePostal: "69002", ville: "Lyon", numeroPermis: "69MB00003", userId: eleves[11].id, sessionId: sessions[25].id } }),

    // ─── EN_ATTENTE (~15%) ──────────────────────────────────
    (prisma as any).reservation.create({ data: { numero: "RES-2026-0125", status: "EN_ATTENTE", montant: 250, commissionMontant: 25, civilite: "Mme", nom: "Leclerc", prenom: "Manon", email: "manon.leclerc@outlook.fr", telephone: "06 24 57 80 13", adresse: "3 Rue du Marché", codePostal: "95520", ville: "Osny", numeroPermis: "95ML00012", userId: eleves[20].id, sessionId: sessions[3].id } }),
    (prisma as any).reservation.create({ data: { numero: "RES-2026-0126", status: "EN_ATTENTE", montant: 280, commissionMontant: 28, civilite: "M.", nom: "Lopez", prenom: "Thierry", email: "thierry.lopez@orange.fr", telephone: "06 90 23 56 78", adresse: "47 Rue de la Liberté", codePostal: "95300", ville: "Pontoise", numeroPermis: "95TL00009", userId: eleves[17].id, sessionId: sessions[11].id } }),
    (prisma as any).reservation.create({ data: { numero: "RES-2026-0127", status: "EN_ATTENTE", montant: 220, commissionMontant: 22, civilite: "Mme", nom: "Barbier", prenom: "Céline", email: "celine.barbier@gmail.com", telephone: "06 67 90 23 45", adresse: "11 Cours Julien", codePostal: "13006", ville: "Marseille", numeroPermis: "13CB00006", userId: eleves[14].id, sessionId: sessions[28].id } }),
    (prisma as any).reservation.create({ data: { numero: "RES-2026-0128", status: "EN_ATTENTE", montant: 230, commissionMontant: 23, civilite: "M.", nom: "Roux", prenom: "Kévin", email: "kevin.roux@gmail.com", telephone: "06 13 46 79 02", adresse: "73 Avenue de la Capelette", codePostal: "13010", ville: "Marseille", numeroPermis: "13KR00011", userId: eleves[19].id, sessionId: sessions[31].id } }),
    (prisma as any).reservation.create({ data: { numero: "RES-2026-0129", status: "EN_ATTENTE", montant: 250, commissionMontant: 25, civilite: "Mme", nom: "Giraud", prenom: "Inès", email: "ines.giraud@laposte.net", telephone: "06 01 34 67 89", adresse: "12 Allée Mendès France", codePostal: "69007", ville: "Lyon", numeroPermis: "69IG00010", userId: eleves[18].id, sessionId: sessions[23].id } }),
    (prisma as any).reservation.create({ data: { numero: "RES-2026-0130", status: "EN_ATTENTE", montant: 280, commissionMontant: 28, civilite: "M.", nom: "Morel", prenom: "Florian", email: "florian.morel@yahoo.fr", telephone: "06 78 01 34 56", adresse: "8 Rue des Frères Lumière", codePostal: "95800", ville: "Cergy", numeroPermis: "95FM00007", userId: eleves[15].id, sessionId: sessions[18].id } }),

    // ─── ANNULEE (~10%) ─────────────────────────────────────
    (prisma as any).reservation.create({ data: { numero: "RES-2026-0131", status: "ANNULEE", montant: 230, commissionMontant: 0, civilite: "Mme", nom: "Fournier", prenom: "Élodie", email: "elodie.fournier@hotmail.fr", telephone: "06 45 78 01 23", adresse: "5 Place Bellecour", codePostal: "69002", ville: "Lyon", numeroPermis: "69EF00004", userId: eleves[12].id, sessionId: sessions[24].id } }),
    (prisma as any).reservation.create({ data: { numero: "RES-2026-0132", status: "ANNULEE", montant: 250, commissionMontant: 0, civilite: "M.", nom: "Garnier", prenom: "Pierre", email: "pierre.garnier@free.fr", telephone: "06 55 66 77 88", adresse: "56 Rue Nationale", codePostal: "59000", ville: "Lille", numeroPermis: "59PG23399", userId: eleves[4].id, sessionId: sessions[7].id } }),
    (prisma as any).reservation.create({ data: { numero: "RES-2026-0133", status: "ANNULEE", montant: 240, commissionMontant: 0, civilite: "Mme", nom: "Bernard", prenom: "Chloé", email: "chloe.bernard@laposte.net", telephone: "06 88 99 00 11", adresse: "7 Quai des Bateliers", codePostal: "67000", ville: "Strasbourg", numeroPermis: "67CB55512", userId: eleves[7].id, sessionId: sessions[33].id } }),
    (prisma as any).reservation.create({ data: { numero: "RES-2026-0134", status: "ANNULEE", montant: 220, commissionMontant: 0, civilite: "M.", nom: "Martin", prenom: "Lucas", email: "lucas.martin@gmail.com", telephone: "06 33 44 55 66", adresse: "27 Boulevard Gambetta", codePostal: "13001", ville: "Marseille", numeroPermis: "13CC45678", userId: eleves[2].id, sessionId: sessions[29].id } }),

    // ─── TERMINEE (sessions passées, ~15%) ─────────────────
    (prisma as any).reservation.create({ data: { numero: "RES-2026-0135", status: "TERMINEE", montant: 280, commissionMontant: 28, civilite: "M.", nom: "Rousseau", prenom: "Julien", email: "julien.rousseau@gmail.com", telephone: "06 12 45 78 90", adresse: "9 Rue des Acacias", codePostal: "75012", ville: "Paris", numeroPermis: "75JR00001", userId: eleves[9].id, sessionId: sessions[9].id } }),
    (prisma as any).reservation.create({ data: { numero: "RES-2026-0136", status: "TERMINEE", montant: 280, commissionMontant: 28, civilite: "Mme", nom: "Michel", prenom: "Fanny", email: "fanny.michel@outlook.fr", telephone: "06 23 56 89 01", adresse: "27 Boulevard Voltaire", codePostal: "75011", ville: "Paris", numeroPermis: "75FM00002", userId: eleves[10].id, sessionId: sessions[10].id } }),
    (prisma as any).reservation.create({ data: { numero: "RES-2026-0137", status: "TERMINEE", montant: 230, commissionMontant: 23, civilite: "M.", nom: "Belkacem", prenom: "Mehdi", email: "mehdi.belkacem@gmail.com", telephone: "06 34 67 90 12", adresse: "14 Rue de la République", codePostal: "69002", ville: "Lyon", numeroPermis: "69MB00003", userId: eleves[11].id, sessionId: sessions[20].id } }),
    (prisma as any).reservation.create({ data: { numero: "RES-2026-0138", status: "TERMINEE", montant: 230, commissionMontant: 23, civilite: "Mme", nom: "Fournier", prenom: "Élodie", email: "elodie.fournier@hotmail.fr", telephone: "06 45 78 01 23", adresse: "5 Place Bellecour", codePostal: "69002", ville: "Lyon", numeroPermis: "69EF00004", userId: eleves[12].id, sessionId: sessions[21].id } }),
    (prisma as any).reservation.create({ data: { numero: "RES-2026-0139", status: "TERMINEE", montant: 220, commissionMontant: 22, civilite: "M.", nom: "Faure", prenom: "Nicolas", email: "nicolas.faure@free.fr", telephone: "06 56 89 12 34", adresse: "33 Avenue du Prado", codePostal: "13008", ville: "Marseille", numeroPermis: "13NF00005", userId: eleves[13].id, sessionId: sessions[26].id } }),
    (prisma as any).reservation.create({ data: { numero: "RES-2026-0140", status: "TERMINEE", montant: 250, commissionMontant: 25, civilite: "Mme", nom: "Leclerc", prenom: "Manon", email: "manon.leclerc@outlook.fr", telephone: "06 24 57 80 13", adresse: "3 Rue du Marché", codePostal: "95520", ville: "Osny", numeroPermis: "95ML00012", userId: eleves[20].id, sessionId: sessions[0].id } }),
  ]);
  console.log(`✅ ${extraReservations.length} réservations supplémentaires créées (total ${reservations.length + extraReservations.length}).\n`);

  // ─── 6c. REVIEWS ─────────────────────────────────────────
  console.log("⭐ Création des avis (reviews)...");
  const reviewsData = await Promise.all([
    // 10 reviews à 5★
    (prisma as any).review.create({ data: { note: 5, commentaire: "Formation impeccable chez BYS Osny ! Les deux formateurs étaient pédagogues et bienveillants, on ne se sent pas jugé. J'ai récupéré mes 4 points sans souci, attestation reçue le lendemain.", userId: eleves[0].id, formationId: formBysRecup.id, createdAt: new Date("2026-04-10T14:30:00Z") } }),
    (prisma as any).review.create({ data: { note: 5, commentaire: "Centre très bien situé à Osny, parking gratuit en face. La salle est moderne, climatisée. Animateur très clair sur l'accidentologie, ça donne vraiment à réfléchir. Je recommande à 100%.", userId: eleves[8].id, formationId: formBysRecup.id, createdAt: new Date("2026-04-23T16:45:00Z") } }),
    (prisma as any).review.create({ data: { note: 5, commentaire: "Stage à Paris 11e très enrichissant. Bonne ambiance dans le groupe, échanges intéressants. Le déjeuner inclus était un vrai plus. 4 points récupérés comme promis.", userId: eleves[9].id, formationId: formParisRecup.id, createdAt: new Date("2026-03-05T11:20:00Z") } }),
    (prisma as any).review.create({ data: { note: 5, commentaire: "Formateurs au top à Conduite Plus, expert sécurité routière passionnant. Les horaires (9h-17h30) sont respectés, pauses régulières. Aucune perte de temps, contenu très dense.", userId: eleves[10].id, formationId: formParisRecup.id, createdAt: new Date("2026-04-16T09:15:00Z") } }),
    (prisma as any).review.create({ data: { note: 5, commentaire: "CFSR Lyon : super accueil dès l'entrée, café et viennoiseries offerts. Le psychologue était vraiment à l'écoute, on échange sans tabou. Stage à conseiller absolument.", userId: eleves[1].id, formationId: formLyonRecup.id, createdAt: new Date("2026-03-12T13:40:00Z") } }),
    (prisma as any).review.create({ data: { note: 5, commentaire: "Très bonne expérience à CFSR Lyon, le centre est à 5 min à pied de la Part-Dieu c'est ultra pratique. Salle moderne, contenu pédagogique de qualité, 4 points récupérés.", userId: eleves[11].id, formationId: formLyonRecup.id, createdAt: new Date("2026-05-02T15:10:00Z") } }),
    (prisma as any).review.create({ data: { note: 5, commentaire: "Permis Express Marseille : stage parfaitement organisé, convocation reçue 10 jours avant. L'équipe est sympa et professionnelle, on apprend beaucoup en 2 jours. Top !", userId: eleves[2].id, formationId: formMarseilleRecup.id, createdAt: new Date("2026-03-19T17:25:00Z") } }),
    (prisma as any).review.create({ data: { note: 5, commentaire: "Excellent stage chez Permis Express, près du Prado très accessible en métro. Le formateur sécurité routière connaît son sujet sur le bout des doigts. Recommandé !", userId: eleves[13].id, formationId: formMarseilleRecup.id, createdAt: new Date("2026-05-07T10:50:00Z") } }),
    (prisma as any).review.create({ data: { note: 5, commentaire: "BYS Cergy : centre récent, locaux nickel et bien insonorisés. Formateurs identiques à ceux d'Osny, même qualité. Idéal si on habite proche de la gare RER. 4 points récupérés.", userId: eleves[15].id, formationId: formCergyRecup.id, createdAt: new Date("2026-04-28T12:00:00Z") } }),
    (prisma as any).review.create({ data: { note: 5, commentaire: "Je suis ravi de mon stage à BYS Osny. Mention spéciale au formateur Miguel, vraiment top. Les exercices pratiques en groupe sont les meilleurs moments du stage.", userId: eleves[20].id, formationId: formBysRecup.id, createdAt: new Date("2026-05-08T18:30:00Z") } }),

    // 5 reviews à 4★
    (prisma as any).review.create({ data: { note: 4, commentaire: "Bon stage à Paris, contenu pertinent mais 2 jours c'est dense, on ressort la tête bien remplie. Le repas de midi un peu juste pour le prix. Sinon récup 4 points OK.", userId: eleves[16].id, formationId: formParisRecup.id, createdAt: new Date("2026-02-18T14:00:00Z") } }),
    (prisma as any).review.create({ data: { note: 4, commentaire: "Stage utile et bien mené à BYS Osny. Salle de stage agréable, équipements modernes. Bémol : la pause déjeuner est un peu courte (45 min), faut être rapide.", userId: eleves[16].id, formationId: formBysRecup.id, createdAt: new Date("2026-03-08T16:20:00Z") } }),
    (prisma as any).review.create({ data: { note: 4, commentaire: "CFSR Lyon : bon stage globalement, formateurs compétents. La salle est un peu petite quand le groupe est complet (22 personnes). Sinon RAS, points récupérés sans souci.", userId: eleves[18].id, formationId: formLyonRecup.id, createdAt: new Date("2026-04-02T11:35:00Z") } }),
    (prisma as any).review.create({ data: { note: 4, commentaire: "Stage chez Permis Express correct, formateurs disponibles. Le centre est facile d'accès en métro. Quelques temps morts l'après-midi du J2 mais sinon contenu utile.", userId: eleves[19].id, formationId: formMarseilleRecup.id, createdAt: new Date("2026-04-19T13:10:00Z") } }),
    (prisma as any).review.create({ data: { note: 4, commentaire: "Très bon accueil à Conduite Plus, secrétaire au téléphone très pro. Le stage est intéressant, surtout la partie sur les distracteurs (smartphone). Je referai si besoin.", userId: eleves[17].id, formationId: formParisRecup.id, createdAt: new Date("2026-04-29T15:55:00Z") } }),

    // 3 reviews à 3★
    (prisma as any).review.create({ data: { note: 3, commentaire: "Stage correct à Marseille, contenu standard. Salle un peu vieillotte mais propre. Les points ont bien été crédités. Pour le prix (220€) c'est dans la moyenne.", userId: eleves[14].id, formationId: formMarseilleRecup.id, createdAt: new Date("2026-02-25T10:40:00Z") } }),
    (prisma as any).review.create({ data: { note: 3, commentaire: "Stage qui fait le job à Lyon, sans plus. Formateurs OK mais pas spécialement passionnés. Cafetière en panne le J2 c'est un détail mais bon. Points récupérés c'est l'essentiel.", userId: eleves[12].id, formationId: formLyonRecup.id, createdAt: new Date("2026-03-26T17:00:00Z") } }),
    (prisma as any).review.create({ data: { note: 3, commentaire: "Stage à Paris 11e, contenu intéressant mais format un peu scolaire à mon goût. Plus de cas pratiques auraient été bienvenus. Bonne organisation néanmoins, attestation rapide.", userId: eleves[3].id, formationId: formParisRecup.id, createdAt: new Date("2026-04-22T09:30:00Z") } }),
  ]);
  console.log(`✅ ${reviewsData.length} avis créés.\n`);

  // ─── 6d. INVOICES ────────────────────────────────────────
  console.log("🧾 Création des factures test...");
  const invoicesData = await Promise.all([
    // 4 PAYEE
    (prisma as any).invoice.create({ data: { numero: "FAC-2026-0001", type: "ELEVE", montantHT: 208.33, tva: 41.67, montantTTC: 250, status: "PAYEE", userId: eleves[0].id, centreId: centres[0].id, reservationId: reservations[0].id } }),
    (prisma as any).invoice.create({ data: { numero: "FAC-2026-0002", type: "ELEVE", montantHT: 191.67, tva: 38.33, montantTTC: 230, status: "PAYEE", userId: eleves[1].id, centreId: centres[2].id, reservationId: reservations[1].id } }),
    (prisma as any).invoice.create({ data: { numero: "FAC-2026-0003", type: "ELEVE", montantHT: 183.33, tva: 36.67, montantTTC: 220, status: "PAYEE", userId: eleves[2].id, centreId: centres[3].id, reservationId: reservations[2].id } }),
    (prisma as any).invoice.create({ data: { numero: "FAC-2026-0004", type: "ELEVE", montantHT: 233.33, tva: 46.67, montantTTC: 280, status: "PAYEE", userId: eleves[3].id, centreId: centres[1].id, reservationId: reservations[3].id } }),
    // 2 EN_ATTENTE
    (prisma as any).invoice.create({ data: { numero: "FAC-2026-0005", type: "ELEVE", montantHT: 208.33, tva: 41.67, montantTTC: 250, status: "EN_ATTENTE", userId: eleves[9].id, centreId: centres[0].id, reservationId: extraReservations[0].id } }),
    (prisma as any).invoice.create({ data: { numero: "FAC-2026-0006", type: "ELEVE", montantHT: 191.67, tva: 38.33, montantTTC: 230, status: "EN_ATTENTE", userId: eleves[11].id, centreId: centres[2].id, reservationId: extraReservations[2].id } }),
    // 1 ANNULEE
    (prisma as any).invoice.create({ data: { numero: "FAC-2026-0007", type: "ELEVE", montantHT: 191.67, tva: 38.33, montantTTC: 230, status: "ANNULEE", userId: eleves[12].id, centreId: centres[2].id, reservationId: extraReservations[26].id } }),
    // 1 EN_RETARD (utilise status "EN_RETARD" — string libre, le champ status est String)
    (prisma as any).invoice.create({ data: { numero: "FAC-2026-0008", type: "CENTRE_COMMISSION", montantHT: 250, tva: 50, montantTTC: 300, status: "EN_RETARD", centreId: centres[1].id } }),
  ]);
  console.log(`✅ ${invoicesData.length} factures créées.\n`);

  // ─── 6e. MESSAGES (centre <-> élève) ────────────────────
  console.log("💬 Création des messages...");
  const messagesData = await Promise.all([
    // Centre BYS Osny → Karim
    (prisma as any).message.create({ data: { contenu: "Bonjour Karim, nous confirmons votre réservation pour la session du 6-7 avril. La convocation arrive dans la journée par email.", senderId: centreFormateur.id, receiverId: eleves[0].id, isRead: true, reservationId: reservations[0].id } }),
    (prisma as any).message.create({ data: { contenu: "Merci pour la confirmation. Faut-il prévoir un repas ou est-ce inclus ?", senderId: eleves[0].id, receiverId: centreFormateur.id, isRead: true, reservationId: reservations[0].id } }),
    (prisma as any).message.create({ data: { contenu: "Le déjeuner est inclus dans le stage, ne vous inquiétez pas. À très bientôt !", senderId: centreFormateur.id, receiverId: eleves[0].id, isRead: true, reservationId: reservations[0].id } }),
    // Centre Paris → Amina
    (prisma as any).message.create({ data: { contenu: "Bonjour Amina, votre réservation est confirmée pour la session du 18 mai. N'oubliez pas votre permis original le jour J.", senderId: centreSecretaire.id, receiverId: eleves[3].id, isRead: true, reservationId: reservations[3].id } }),
    (prisma as any).message.create({ data: { contenu: "Bonjour, merci. Une question : puis-je arriver à 8h45 ou faut-il être à 9h pile ?", senderId: eleves[3].id, receiverId: centreSecretaire.id, isRead: true, reservationId: reservations[3].id } }),
    (prisma as any).message.create({ data: { contenu: "L'accueil est ouvert dès 8h30, vous pouvez arriver en avance, ça nous arrange.", senderId: centreSecretaire.id, receiverId: eleves[3].id, isRead: false, reservationId: reservations[3].id } }),
    // Centre BYS → Julien (futur stagiaire)
    (prisma as any).message.create({ data: { contenu: "Bonjour Julien, bienvenue chez BYS Formation ! Votre stage du 8-9 juin est confirmé. Si vous avez des questions, n'hésitez pas.", senderId: centreAdmin.id, receiverId: eleves[9].id, isRead: true, reservationId: extraReservations[0].id } }),
    (prisma as any).message.create({ data: { contenu: "Merci ! Le centre est-il accessible en bus depuis la gare ?", senderId: eleves[9].id, receiverId: centreAdmin.id, isRead: false, reservationId: extraReservations[0].id } }),
    // Lyon → Mehdi
    (prisma as any).message.create({ data: { contenu: "Bonjour Mehdi, votre réservation est enregistrée. Pensez à apporter votre relevé d'information intégral si vous en avez un.", senderId: centreUsers[2].id, receiverId: eleves[11].id, isRead: true, reservationId: extraReservations[2].id } }),
    // Marseille → Nicolas
    (prisma as any).message.create({ data: { contenu: "Bonjour Nicolas, suite à votre inscription : la session de juin est presque pleine, merci de venir à 8h45 le J1 pour l'émargement.", senderId: centreUsers[3].id, receiverId: eleves[13].id, isRead: false, reservationId: extraReservations[4].id } }),
  ]);
  console.log(`✅ ${messagesData.length} messages créés.\n`);

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
        question: "Le stage de récupération de points est-il éligible au CPF ?",
        reponse:
          "Non. Les stages de récupération de points (officiellement « stages de sensibilisation à la sécurité routière ») ne sont pas éligibles au Compte Personnel de Formation (CPF). Le règlement les considère comme un dispositif de prévention administratif, pas comme une formation professionnelle. Le paiement se fait directement par carte bancaire au moment de la réservation.",
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
          "Bonjour Amina, bienvenue sur BYS Formation. Trouvez facilement un stage de récupération de points agréé près de chez vous.",
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
      // ─── 15 notifications supplémentaires pour densifier l'activité ──
      {
        titre: "Réservation confirmée",
        contenu: "Votre réservation RES-2026-0101 pour le stage des 8-9 juin 2026 chez BYS Formation Osny est confirmée. Convocation envoyée par email.",
        isRead: false,
        userId: eleves[9].id,
      },
      {
        titre: "Bienvenue sur BYS Formation !",
        contenu: "Bonjour Julien, bienvenue ! Nous avons trouvé 3 centres disponibles près de chez vous. Découvrez nos prochaines sessions.",
        isRead: true,
        userId: eleves[9].id,
      },
      {
        titre: "Réservation confirmée",
        contenu: "Votre réservation RES-2026-0103 pour le stage Lyon (22-23 juin 2026) est confirmée. Vous recevrez votre convocation par email sous 24h.",
        isRead: false,
        userId: eleves[11].id,
      },
      {
        titre: "Nouveau message du centre",
        contenu: "Le centre Conduite Plus Paris vous a envoyé un message concernant votre prochaine session. Consultez-le dans votre messagerie.",
        isRead: false,
        userId: eleves[3].id,
      },
      {
        titre: "Rappel : stage dans 7 jours",
        contenu: "Votre stage de récupération de points à Paris approche (18-19 mai 2026). Préparez vos documents : permis original + pièce d'identité.",
        isRead: false,
        userId: eleves[3].id,
      },
      {
        titre: "Facture disponible",
        contenu: "Votre facture FAC-2026-0001 est désormais disponible dans votre espace personnel, rubrique « Mes factures ».",
        isRead: true,
        userId: eleves[0].id,
      },
      {
        titre: "Réservation en attente de paiement",
        contenu: "Votre réservation RES-2026-0125 est en attente. Le paiement n'a pas été finalisé, merci de compléter le règlement sous 24h.",
        isRead: false,
        userId: eleves[20].id,
      },
      {
        titre: "Bienvenue sur BYS Formation !",
        contenu: "Bonjour Mehdi, bienvenue ! Plus de 30 sessions sont disponibles dans toute la France. Trouvez votre stage en quelques clics.",
        isRead: false,
        userId: eleves[11].id,
      },
      {
        titre: "Nouvelle session ouverte près de chez vous",
        contenu: "Une nouvelle session de récupération de points vient d'ouvrir à Cergy (5 Place des Merveilles), 13-14 juillet 2026. Encore 11 places.",
        isRead: false,
        userId: eleves[15].id,
      },
      {
        titre: "Annulation enregistrée",
        contenu: "Votre annulation pour la réservation RES-2026-0131 est bien prise en compte. Le remboursement sera effectué sous 5 jours ouvrés.",
        isRead: true,
        userId: eleves[12].id,
      },
      {
        titre: "Votre attestation est disponible",
        contenu: "Bravo Julien ! Votre stage de récupération de points à Paris est terminé. Téléchargez votre attestation depuis votre espace.",
        isRead: false,
        userId: eleves[9].id,
      },
      {
        titre: "Promotion BIENVENUE10",
        contenu: "Profitez de 10% sur votre première réservation avec le code BIENVENUE10. Valable jusqu'au 31 décembre 2026.",
        isRead: false,
        userId: eleves[16].id,
      },
      {
        titre: "Nouveau message du centre",
        contenu: "Le centre BYS Formation Osny vous a envoyé un message concernant votre stage à venir.",
        isRead: false,
        userId: eleves[9].id,
      },
      {
        titre: "Réservation confirmée",
        contenu: "Votre réservation RES-2026-0108 chez Conduite Plus Paris (6-7 juillet 2026) est confirmée. Bonne préparation !",
        isRead: false,
        userId: eleves[16].id,
      },
      {
        titre: "Sondage satisfaction",
        contenu: "Merci d'avoir suivi votre stage chez BYS Formation. Pourriez-vous prendre 1 minute pour nous laisser un avis ? Ça nous aide beaucoup !",
        isRead: false,
        userId: eleves[8].id,
      },
    ],
  });
  console.log("✅ 20 notifications créées.\n");

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
    <p>Bienvenue sur <strong>BYS Formation</strong>, votre plateforme de référence pour les stages agréés de récupération de points du permis de conduire.</p>
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
    // ─── 5 articles supplémentaires (avril-mai 2026) ────────
    (prisma as any).article.create({
      data: {
        titre: "Stage 48SI : pour qui, à quel prix ?",
        slug: "stage-48si-pour-qui-quel-prix",
        extrait: "La lettre 48SI marque l'invalidation de votre permis. Découvrez les conditions, le déroulé et le coût d'un stage 48SI en 2026.",
        contenu: `<h2>La lettre 48SI : c'est quoi exactement ?</h2>
<p>La lettre 48SI est la notification officielle adressée par le ministère de l'Intérieur lorsqu'un permis de conduire arrive à un <strong>solde de points nul</strong>. Elle entraîne automatiquement l'<strong>invalidation du permis</strong> pour une durée de 6 mois (1 an en cas de récidive).</p>
<h2>Stage 48SI : que faut-il savoir ?</h2>
<p>Contrairement au stage de récupération de points classique, le stage 48SI <em>n'a pas pour but de récupérer des points</em> — ils sont déjà tous perdus. Son objectif est différent :</p>
<ul>
  <li>Sensibiliser le conducteur aux risques routiers avant la repasse du permis</li>
  <li>Conditionner l'obtention d'un nouveau titre de conduite</li>
  <li>Réduire la probabilité de récidive</li>
</ul>
<h2>Prix d'un stage 48SI en 2026</h2>
<p>Le coût se situe généralement entre <strong>200€ et 280€</strong>, dans la même fourchette qu'un stage volontaire de récupération de points. La durée est identique : <em>2 jours consécutifs (14 heures)</em>.</p>
<h2>Quand effectuer le stage ?</h2>
<p>Le stage doit obligatoirement avoir lieu <strong>avant de pouvoir repasser le code</strong> (et la conduite si vous avez le permis depuis moins de 3 ans). Sans attestation de stage, votre dossier de re-candidature en préfecture sera refusé.</p>
<h2>Comment réserver ?</h2>
<p>Sur BYS Formation, vous comparez en quelques clics les centres agréés près de chez vous, vous filtrez par date et vous réservez en ligne. Le règlement est sécurisé par Stripe et la convocation officielle vous est envoyée par email sous 24h.</p>
<h2>Documents à présenter le jour J</h2>
<ul>
  <li>Pièce d'identité en cours de validité</li>
  <li>La lettre 48SI originale (recommandé avec AR)</li>
  <li>Votre permis de conduire (même invalidé)</li>
  <li>Confirmation de réservation ou convocation</li>
</ul>
<p>Préparez ces documents la veille du stage pour éviter tout stress de dernière minute. Sans ces pièces, le centre est en droit de refuser votre participation.</p>`,
        image: "https://images.unsplash.com/photo-1532153975070-2e9ab71f1b14?auto=format&fit=crop&w=1200&q=80",
        categorie: "reglementation",
        tags: ["48SI", "invalidation", "stage", "permis"],
        isPublished: true,
        publishedAt: new Date("2026-04-08"),
        authorId: admin.id,
      },
    }),
    (prisma as any).article.create({
      data: {
        titre: "Récupérer 4 points en 48h : comment ça marche",
        slug: "recuperer-4-points-en-48h-comment-ca-marche",
        extrait: "Le stage de récupération de points permet de récupérer jusqu'à 4 points en 2 jours. On vous explique tout le processus, du choix du centre à la mise à jour effective du solde.",
        contenu: `<h2>Le principe en 3 minutes</h2>
<p>Le stage de sensibilisation à la sécurité routière, communément appelé <strong>stage de récupération de points</strong>, est une formation agréée qui permet de récupérer <strong>jusqu'à 4 points</strong> sur votre permis de conduire. Il se déroule sur 2 jours consécutifs (14 heures au total) dans un centre agréé par la préfecture.</p>
<h2>Étape 1 — Vérifiez votre éligibilité</h2>
<p>Pour pouvoir faire un stage volontaire, trois conditions :</p>
<ul>
  <li>Avoir un permis de conduire en cours de validité</li>
  <li>Disposer d'au moins 1 point sur son permis (sinon c'est un stage 48SI obligatoire)</li>
  <li>Ne pas avoir fait de stage dans les 12 derniers mois</li>
</ul>
<p>Vous pouvez vérifier votre solde gratuitement sur <code>mespoints.permisdeconduire.gouv.fr</code> via FranceConnect.</p>
<h2>Étape 2 — Choisissez votre stage</h2>
<p>Sur BYS Formation, comparez les <strong>5+ centres agréés</strong> (Osny, Paris, Lyon, Marseille, Cergy) selon vos critères :</p>
<ul>
  <li>Date qui vous arrange</li>
  <li>Prix (entre 210€ et 280€)</li>
  <li>Distance depuis chez vous</li>
  <li>Avis des anciens stagiaires</li>
</ul>
<h2>Étape 3 — Réservez et payez en ligne</h2>
<p>La réservation se fait en 3 minutes. Paiement sécurisé par Stripe (CB ou prélèvement). Vous recevez immédiatement :</p>
<ul>
  <li>La confirmation de réservation par email</li>
  <li>Votre facture en PDF</li>
  <li>La convocation officielle 48h à 7 jours avant le stage</li>
</ul>
<h2>Étape 4 — Le stage (jour 1 et 2)</h2>
<p>Le stage est animé par deux professionnels : <em>un psychologue et un expert sécurité routière</em>. Le programme alterne échanges de groupe, études de cas, analyses statistiques et engagement personnel. <strong>Aucun examen, aucun jugement</strong> — l'objectif est la prise de conscience.</p>
<h2>Étape 5 — Les points sont crédités</h2>
<p>À l'issue du stage, vous recevez votre <strong>attestation de stage</strong>. Les 4 points sont automatiquement crédités sur votre permis dès le <em>lendemain</em>, dans la limite du capital maximal (12 points pour un permis classique).</p>
<h2>Bon à savoir</h2>
<p>Le stage de récupération de points n'est pas remboursable par l'assurance, ni éligible au CPF. C'est une démarche personnelle et volontaire qui reste à votre charge.</p>`,
        image: "https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?auto=format&fit=crop&w=1200&q=80",
        categorie: "conseils",
        tags: ["recuperation", "stage", "points", "guide"],
        isPublished: true,
        publishedAt: new Date("2026-04-18"),
        authorId: admin.id,
      },
    }),
    (prisma as any).article.create({
      data: {
        titre: "Permis probatoire et stage 48N : guide 2026",
        slug: "permis-probatoire-stage-48n-guide-2026",
        extrait: "Vous avez reçu une lettre 48N ? On vous explique vos obligations, les délais à respecter et comment réserver votre stage rapidement.",
        contenu: `<h2>Permis probatoire : un statut spécifique</h2>
<p>Après l'obtention de votre permis, vous êtes en <strong>période probatoire pendant 3 ans</strong> (2 ans avec la conduite accompagnée). Pendant cette période, votre capital points est limité à <em>6 points au départ</em>, puis 2 points supplémentaires par an sans infraction.</p>
<h2>La lettre 48N : à quoi correspond-elle ?</h2>
<p>La lettre 48N est adressée aux conducteurs en permis probatoire qui perdent <strong>3 points ou plus en une seule infraction</strong>. Elle impose deux obligations :</p>
<ol>
  <li>Effectuer un <strong>stage de sensibilisation obligatoire</strong> dans un délai de 4 mois</li>
  <li>À l'issue du stage, vous récupérez 4 points et le remboursement de l'amende forfaitaire est possible sous conditions</li>
</ol>
<h2>Combien de temps pour réagir ?</h2>
<p>Vous avez <strong>4 mois</strong> à compter de la réception de la lettre 48N pour effectuer votre stage. Au-delà, vous risquez :</p>
<ul>
  <li>Une amende de 4ᵉ classe (jusqu'à 135€)</li>
  <li>La suspension administrative du permis (jusqu'à 3 ans)</li>
  <li>L'impossibilité de récupérer les points perdus</li>
</ul>
<h2>Comment trouver et réserver un stage 48N ?</h2>
<p>Tous les centres agréés sur BYS Formation sont habilités à recevoir les stagiaires en obligation 48N. Réservez en ligne, indiquez « stage 48N » dans le champ <em>« motif de la formation »</em> lors de l'inscription pour pouvoir <strong>demander le remboursement de votre amende ensuite</strong>.</p>
<h2>Le remboursement de l'amende : conditions</h2>
<p>Vous pouvez demander le remboursement de votre amende forfaitaire si :</p>
<ul>
  <li>L'infraction est de catégorie 4 (-3 ou -4 points)</li>
  <li>Le stage est effectué dans les 4 mois suivant la 48N</li>
  <li>Vous adressez votre demande à l'ANTAI avec l'attestation de stage et le procès-verbal</li>
</ul>
<h2>Prix moyen et durée</h2>
<p>Le stage 48N dure <em>2 jours</em> et coûte entre <strong>200€ et 280€</strong>. Ce coût reste à votre charge, mais peut être partiellement compensé par le remboursement de l'amende.</p>
<h2>Conseils pour les jeunes conducteurs</h2>
<p>Sur permis probatoire, prudence redoublée : la moindre infraction peut entraîner une chute rapide du solde. Anticipez : si vous perdez plus de 2 points, envisagez un stage volontaire <em>avant</em> de recevoir une éventuelle 48N.</p>`,
        image: "https://images.unsplash.com/photo-1486325212027-8081e485255e?auto=format&fit=crop&w=1200&q=80",
        categorie: "reglementation",
        tags: ["48N", "permis probatoire", "jeune conducteur", "stage obligatoire"],
        isPublished: true,
        publishedAt: new Date("2026-04-26"),
        authorId: admin.id,
      },
    }),
    (prisma as any).article.create({
      data: {
        titre: "Le top 10 des erreurs qui font perdre des points",
        slug: "top-10-erreurs-perte-points-permis",
        extrait: "Vitesse, téléphone, alcool, feu rouge… le classement des 10 infractions les plus fréquentes et leurs sanctions exactes en points et en euros.",
        contenu: `<h2>Pourquoi connaître les sanctions ?</h2>
<p>Mieux on connaît le barème des infractions, mieux on peut adapter sa conduite. Voici le <strong>top 10 des erreurs qui coûtent des points</strong> en 2026, avec les sanctions exactes prévues par le Code de la route.</p>
<h2>1. Petit excès de vitesse (-1 point, 68€)</h2>
<p>Excès de moins de 20 km/h hors agglomération. C'est l'infraction la plus fréquente : un radar mal anticipé suffit. Pour l'éviter, programmez un régulateur de vitesse.</p>
<h2>2. Téléphone au volant (-3 points, 135€)</h2>
<p>Même à l'arrêt à un feu rouge, tenir son téléphone est verbalisé. Utilisez un kit Bluetooth ou activez le mode « ne pas déranger ».</p>
<h2>3. Non-port de la ceinture (-3 points, 135€)</h2>
<p>L'erreur de débutant qui coûte cher. Le conducteur ET les passagers de moins de 18 ans sont sanctionnés.</p>
<h2>4. Franchissement de ligne continue (-3 points, 135€)</h2>
<p>Souvent dans des situations de dépassement ou de pénétration de bande d'urgence. Restez patient.</p>
<h2>5. Stop ou feu rouge non respecté (-4 points, 135€)</h2>
<p>Très contrôlé par caméras de vidéo-verbalisation. Marquez systématiquement un arrêt complet au stop.</p>
<h2>6. Refus de priorité (-4 points, 135€)</h2>
<p>Y compris à un piéton sur un passage protégé. Soyez vigilant en agglomération.</p>
<h2>7. Excès entre 30 et 40 km/h (-3 points, 135€)</h2>
<p>Souvent autour des autoroutes ou voies rapides en zones à 110/130 km/h.</p>
<h2>8. Conduite en état d'alcoolémie (-6 points, 4500€)</h2>
<p>Taux à partir de 0,5 g/L de sang. Au-delà de 0,8 g/L : suspension du permis et tribunal.</p>
<h2>9. Conduite sous stupéfiants (-6 points, 4500€)</h2>
<p>Même sanction que l'alcool. Les contrôles salivaires sont systématiques en cas de doute.</p>
<h2>10. Grand excès de vitesse +50 km/h (-6 points, 1500€)</h2>
<p>Suspension du permis immédiate possible. Confiscation du véhicule en récidive.</p>
<h2>En cas de perte de points</h2>
<p>Si votre solde devient critique (moins de 6 points), envisagez un stage de récupération <strong>volontaire</strong>. Vous récupérez jusqu'à 4 points en 2 jours, sans attendre une lettre 48N ou 48SI.</p>`,
        image: "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1200&q=80",
        categorie: "conseils",
        tags: ["infractions", "barème", "perte points", "prevention"],
        isPublished: true,
        publishedAt: new Date("2026-05-03"),
        authorId: admin.id,
      },
    }),
    (prisma as any).article.create({
      data: {
        titre: "Stage volontaire vs stage obligatoire : que choisir ?",
        slug: "stage-volontaire-vs-stage-obligatoire-comparatif",
        extrait: "Stage volontaire ou imposé par la préfecture (48N, 48SI) ou par le juge ? Comparatif complet pour comprendre quel stage correspond à votre situation.",
        contenu: `<h2>4 types de stages, 4 contextes différents</h2>
<p>Tous les stages durent <strong>2 jours (14 heures)</strong> et coûtent entre 200€ et 280€. Le contenu pédagogique est identique. Ce qui change : <em>les motivations, les obligations légales et les conséquences en cas de non-réalisation</em>.</p>
<h2>1. Le stage volontaire — pour anticiper</h2>
<p>C'est le plus courant. <strong>Vous choisissez librement</strong> de faire un stage pour récupérer jusqu'à 4 points avant que votre solde ne devienne critique.</p>
<ul>
  <li><strong>Quand le faire ?</strong> Dès que votre solde descend sous 6 points</li>
  <li><strong>Avantage :</strong> récupération immédiate de 4 points</li>
  <li><strong>Délai à respecter :</strong> aucun, hors période de 12 mois depuis le dernier stage</li>
  <li><strong>Limitation :</strong> 1 seul stage par année glissante</li>
</ul>
<h2>2. Le stage 48N — pour les jeunes conducteurs</h2>
<p>Imposé par la préfecture aux conducteurs en <strong>permis probatoire</strong> qui ont perdu 3 points ou plus en une seule infraction.</p>
<ul>
  <li><strong>Délai :</strong> 4 mois après réception de la lettre</li>
  <li><strong>Avantage :</strong> remboursement possible de l'amende</li>
  <li><strong>Risque si non-respect :</strong> amende de 135€ et suspension du permis</li>
</ul>
<h2>3. Le stage 48SI — après invalidation</h2>
<p>Imposé après une <strong>invalidation du permis pour solde nul</strong>. Indispensable pour pouvoir repasser le code.</p>
<ul>
  <li><strong>Quand :</strong> avant tout dépôt d'une nouvelle demande de permis</li>
  <li><strong>Particularité :</strong> ne crédite pas de points (le permis est annulé)</li>
  <li><strong>Avantage :</strong> condition sine qua non pour repasser le code</li>
</ul>
<h2>4. Le stage judiciaire — décision du tribunal</h2>
<p>Imposé par un juge en peine complémentaire ou en alternative aux poursuites. <strong>Refuser = retour à la sanction initiale</strong> (souvent plus lourde).</p>
<h2>Tableau récapitulatif</h2>
<table>
  <thead>
    <tr><th>Type</th><th>Initiative</th><th>Récupération points</th><th>Délai</th></tr>
  </thead>
  <tbody>
    <tr><td>Volontaire</td><td>Vous</td><td>+4 points</td><td>Libre</td></tr>
    <tr><td>48N (probatoire)</td><td>Préfecture</td><td>+4 points</td><td>4 mois</td></tr>
    <tr><td>48SI (invalidation)</td><td>Préfecture</td><td>0 (permis annulé)</td><td>Avant repasse</td></tr>
    <tr><td>Judiciaire</td><td>Juge</td><td>0 ou +4 selon cas</td><td>Décision</td></tr>
  </tbody>
</table>
<h2>Notre conseil</h2>
<p><strong>N'attendez pas la lettre de la préfecture</strong>. Un stage volontaire effectué à temps évite une situation administrative compliquée et garantit que vous restez en règle. Sur BYS Formation, vous comparez les centres en quelques clics et réservez 100% en ligne.</p>`,
        image: "https://images.unsplash.com/photo-1494412574643-ff11b0a5c1c3?auto=format&fit=crop&w=1200&q=80",
        categorie: "conseils",
        tags: ["comparatif", "stage volontaire", "stage obligatoire", "48N", "48SI"],
        isPublished: true,
        publishedAt: new Date("2026-05-09"),
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
  console.log(`  👤 ${1 + 1 + 1 + 1 + 1 + centreUsers.length + 3 + eleves.length} utilisateurs (1 owner, 1 admin, 1 support, 1 comptable, 1 commercial, 5 centre owners, 3 membres centre, ${eleves.length} élèves)`);
  console.log(`  🏢 ${centres.length + 1} centres (dont 1 second centre BYS Cergy)`);
  console.log(`  👥 3 membres de centres`);
  console.log(`  📚 ${allFormations.length} formations`);
  console.log(`  📅 ${sessions.length} sessions`);
  console.log(`  🎫 ${reservations.length + extraReservations.length} réservations`);
  console.log(`  ⭐ ${reviewsData.length} avis`);
  console.log(`  🧾 ${invoicesData.length} factures`);
  console.log(`  💬 ${messagesData.length} messages`);
  console.log(`  ❓ 8 FAQ`);
  console.log(`  🔔 20 notifications`);
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
