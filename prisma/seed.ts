import { PrismaClient } from "../src/generated/prisma/client";

const prisma = new (PrismaClient as any)() as InstanceType<typeof PrismaClient>;

async function main() {
  console.log("🌱 Début du seeding...\n");

  // ─── NETTOYAGE (ordre inverse des dépendances) ───────────
  console.log("🗑️  Suppression des données existantes...");
  await (prisma as any).notification.deleteMany();
  await (prisma as any).reservation.deleteMany();
  await (prisma as any).session.deleteMany();
  await (prisma as any).formation.deleteMany();
  await (prisma as any).centre.deleteMany();
  await (prisma as any).ticketMessage.deleteMany();
  await (prisma as any).ticket.deleteMany();
  await (prisma as any).user.deleteMany();
  await (prisma as any).categorie.deleteMany();
  await (prisma as any).faqItem.deleteMany();
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

  // ─── 2. UTILISATEURS ─────────────────────────────────────
  console.log("👤 Création des utilisateurs...");

  // Admin
  const admin = await (prisma as any).user.create({
    data: {
      auth0Id: "auth0|admin001",
      email: "admin@bys-formation.fr",
      nom: "Magar",
      prenom: "Andrys",
      telephone: "06 12 34 56 78",
      adresse: "15 Rue de la Paix",
      codePostal: "95520",
      ville: "Osny",
      role: "ADMIN",
    },
  });

  // Centre owners
  const centreUsers = await Promise.all([
    (prisma as any).user.create({
      data: {
        auth0Id: "auth0|centre001",
        email: "sebastien@bys-formation.fr",
        nom: "Moreau",
        prenom: "Sébastien",
        telephone: "01 34 25 67 89",
        adresse: "Bât. 7, 9 Chaussée Jules César",
        codePostal: "95520",
        ville: "Osny",
        role: "CENTRE",
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
        role: "CENTRE",
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
        role: "CENTRE",
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
        role: "CENTRE",
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
        role: "CENTRE",
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

  console.log(`✅ ${1 + centreUsers.length + eleves.length} utilisateurs créés.\n`);

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
        statut: "ACTIF",
        isActive: true,
        userId: centreUsers[0].id,
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
        statut: "ACTIF",
        isActive: true,
        userId: centreUsers[1].id,
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
        statut: "EN_ATTENTE",
        isActive: false,
        userId: centreUsers[4].id,
      },
    }),
  ]);

  console.log(`✅ ${centres.length} centres créés.\n`);

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
        sessionId: sessions[25].id, // Marseille Moto
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

  // ─── RÉSUMÉ ──────────────────────────────────────────────
  console.log("═══════════════════════════════════════════");
  console.log("🌱 Seeding terminé avec succès !");
  console.log("═══════════════════════════════════════════");
  console.log(`  📂 ${categories.length} catégories`);
  console.log(`  👤 ${1 + centreUsers.length + eleves.length} utilisateurs (1 admin, 5 centres, 9 élèves)`);
  console.log(`  🏢 ${centres.length} centres`);
  console.log(`  📚 ${allFormations.length} formations`);
  console.log(`  📅 ${sessions.length} sessions`);
  console.log(`  🎫 ${reservations.length} réservations`);
  console.log(`  ❓ 8 FAQ`);
  console.log(`  🔔 5 notifications`);
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
