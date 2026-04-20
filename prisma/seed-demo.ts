/**
 * Seed demo — ajoute du volume réaliste PAR-DESSUS le seed de base.
 *
 * Pré-requis : `npm run db:seed` doit avoir été exécuté avant (centres, formations, sessions en place).
 *
 * Lancement :
 *   npm run seed:demo
 */

import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { fakerFR as faker } from "@faker-js/faker";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error("DATABASE_URL non defini");
const adapter = new PrismaPg({ connectionString });
const prisma = new (PrismaClient as unknown as new (opts: { adapter: PrismaPg }) => PrismaClient)({
  adapter,
});

const EXTRA_STUDENTS = 60;
const EXTRA_RESERVATIONS = 120;
const EXTRA_REVIEWS = 40;
const EXTRA_TICKETS = 15;
const EXTRA_ARTICLES = 12;

faker.seed(42); // reproductibilité

const reviewComments = [
  "Formation très claire, le formateur explique bien. Je repars avec mes points !",
  "Ambiance bienveillante, on ne se sent pas jugé. À recommander.",
  "Deux jours denses mais vraiment enrichissants. Ça m'a fait réfléchir sur ma conduite.",
  "Organisation impeccable, convocation reçue rapidement. Parfait.",
  "Un peu long parfois mais le contenu est utile. Les exercices pratiques sont top.",
  "Super expérience, j'ai vraiment appris des choses sur la sécurité routière.",
  "Formateur dynamique et pédagogue. Je recommande vivement.",
  "Bien encadré, beaucoup d'exemples concrets. Points récupérés comme prévu.",
  "Sessions interactives, on échange beaucoup avec les autres stagiaires.",
  "Rien à redire, stage agréé préfecture comme annoncé. Convocation rapide.",
  "Je conseille de venir avec son dossier bien préparé, ça facilite tout.",
  "Vraiment utile pour prendre du recul sur ses habitudes au volant.",
  "Les supports sont bien faits, facile à suivre même sans connaissances juridiques.",
  "Centre facile d'accès, accueil chaleureux. Merci à l'équipe.",
  "Stage de qualité, je reviendrai en cas de besoin.",
];

const ticketSubjects = [
  "Question sur ma convocation",
  "Annulation suite à un imprévu",
  "Report de session possible ?",
  "Attestation de présence non reçue",
  "Problème de paiement",
  "Je n'ai pas reçu l'email de confirmation",
  "Changement d'adresse email",
  "Je souhaite modifier ma réservation",
  "Récupération des points après le stage",
  "Demande de remboursement",
];

const ticketMessages = [
  "Bonjour, je n'arrive pas à accéder à ma convocation. Pouvez-vous me la renvoyer ?",
  "Suite à un empêchement, je dois annuler ma participation. Comment procéder ?",
  "Est-il possible de reporter ma session à une date ultérieure ?",
  "Bonjour, mon attestation n'apparaît pas dans mon espace. Merci d'avance.",
  "Mon paiement a échoué deux fois, je ne comprends pas pourquoi.",
];

const articleCategories = [
  "Conseils",
  "Sécurité routière",
  "Actualité",
  "Guide stage",
  "Permis de conduire",
];

const articleTemplates = [
  {
    titre: "Comment récupérer ses points rapidement en 2026",
    extrait:
      "Découvrez les conditions et étapes pour récupérer jusqu'à 4 points sur votre permis en seulement 2 jours.",
    contenu: `<h2>Pourquoi faire un stage de récupération de points ?</h2>
<p>Le stage de sensibilisation à la sécurité routière permet de récupérer jusqu'à <strong>4 points</strong> sur votre permis de conduire, dans la limite du capital initial de 12 points.</p>
<h3>Les conditions à remplir</h3>
<ul>
  <li>Avoir un solde positif au moment de l'inscription</li>
  <li>Ne pas avoir effectué de stage dans les 12 derniers mois</li>
  <li>Présenter un permis valide</li>
</ul>
<p>Le stage dure <em>2 jours consécutifs</em> (14 heures) et est animé par un psychologue et un formateur BAFM agréés.</p>`,
  },
  {
    titre: "Permis probatoire : que faire en cas d'infraction ?",
    extrait:
      "Conducteur débutant ? Voici les démarches pour ne pas perdre votre permis en cas de retrait de points.",
    contenu: `<h2>Le permis probatoire expliqué</h2>
<p>Pendant 3 ans (2 ans avec la conduite accompagnée), votre permis est probatoire. Vous commencez avec <strong>6 points</strong> et en gagnez 2 par an sans infraction.</p>
<h3>En cas de perte de 3 points ou plus</h3>
<p>La préfecture vous adresse une <em>lettre recommandée</em>. Vous avez 4 mois pour effectuer un stage obligatoire.</p>
<ul>
  <li>Le stage est à vos frais (environ 200 à 250€)</li>
  <li>Il est remboursable sous conditions en cas d'infraction de catégorie 4 ou plus</li>
  <li>À l'issue du stage, vous récupérez 4 points</li>
</ul>`,
  },
  {
    titre: "Les 10 infractions les plus coûteuses en points",
    extrait: "Excès de vitesse, téléphone au volant, feu rouge… le top 10 des infractions qui font mal au permis.",
    contenu: `<h2>Top 10 des infractions en points</h2>
<ol>
  <li><strong>Alcool ou stupéfiants au volant</strong> : -6 points</li>
  <li><strong>Grand excès de vitesse (+50 km/h)</strong> : -6 points</li>
  <li><strong>Refus de priorité</strong> : -4 points</li>
  <li><strong>Franchissement de ligne continue</strong> : -3 points</li>
  <li><strong>Téléphone au volant</strong> : -3 points</li>
  <li><strong>Non-port de la ceinture</strong> : -3 points</li>
  <li><strong>Feu rouge grillé</strong> : -4 points</li>
  <li><strong>Stop non marqué</strong> : -4 points</li>
  <li><strong>Excès entre 30 et 40 km/h</strong> : -4 points</li>
  <li><strong>Circulation sans assurance</strong> : suspension du permis</li>
</ol>
<p>Un bon réflexe : anticiper, maintenir les distances de sécurité et ne jamais utiliser son téléphone en conduisant.</p>`,
  },
  {
    titre: "Qualiopi : pourquoi nos stages sont certifiés",
    extrait:
      "La certification Qualiopi garantit la qualité de nos formations. Explications de ce label.",
    contenu: `<h2>Qu'est-ce que Qualiopi ?</h2>
<p>Qualiopi est la <strong>certification unique nationale</strong> attestant de la qualité des prestataires de formation. Elle est obligatoire depuis 2022 pour bénéficier de fonds publics (CPF, OPCO, Pôle emploi).</p>
<h3>Ce que cela garantit pour vous</h3>
<ul>
  <li>Des formateurs qualifiés et régulièrement évalués</li>
  <li>Un suivi pédagogique rigoureux</li>
  <li>Des supports pédagogiques actualisés</li>
  <li>Un processus d'amélioration continue</li>
</ul>
<p>Tous les centres partenaires référencés sur BYS Formation respectent les 7 critères Qualiopi.</p>`,
  },
  {
    titre: "Stage obligatoire vs stage volontaire : quelles différences ?",
    extrait:
      "Stages récupération de points, permis probatoire, tribunal… tout savoir sur les 4 types de stages existants.",
    contenu: `<h2>Les 4 types de stages</h2>
<h3>1. Stage volontaire de récupération</h3>
<p>Vous choisissez de faire un stage pour récupérer jusqu'à 4 points, sans obligation légale. Accessible à tout titulaire du permis.</p>
<h3>2. Stage obligatoire en permis probatoire</h3>
<p>Imposé après la perte de 3 points ou plus sur un permis probatoire. <strong>À effectuer dans les 4 mois</strong> suivant la notification préfectorale.</p>
<h3>3. Stage judiciaire</h3>
<p>Prononcé par le tribunal en peine complémentaire. Le stage remplace tout ou partie d'une autre sanction.</p>
<h3>4. Stage de composition pénale</h3>
<p>Proposé par le procureur en alternative aux poursuites. Accepter évite le passage au tribunal.</p>`,
  },
  {
    titre: "Comment vérifier votre solde de points sur le permis",
    extrait:
      "Mespoints, Télépoints, courriers préfectoraux : trois méthodes pour connaître votre solde.",
    contenu: `<h2>Trois moyens simples</h2>
<h3>1. Mespoints.permisdeconduire.gouv.fr</h3>
<p>Le portail officiel de l'État. Connexion par FranceConnect, accès immédiat et sécurisé.</p>
<h3>2. Télépoints</h3>
<p>Service en ligne accessible avec votre numéro de permis et un code confidentiel (reçu par courrier).</p>
<h3>3. En préfecture</h3>
<p>Sur présentation d'une pièce d'identité, la préfecture peut vous remettre un relevé d'information.</p>
<p><em>À savoir :</em> BYS Formation ne peut pas vérifier votre solde pour vous — ces démarches restent strictement personnelles.</p>`,
  },
  {
    titre: "FIMO / FCO : les formations obligatoires pour les conducteurs pros",
    extrait: "Transport de marchandises ou de personnes : les formations continues obligatoires tous les 5 ans.",
    contenu: `<h2>FIMO et FCO : de quoi parle-t-on ?</h2>
<p>La <strong>FIMO</strong> (Formation Initiale Minimale Obligatoire) s'adresse aux nouveaux conducteurs professionnels (transport marchandises ou voyageurs). Durée : 140h.</p>
<p>La <strong>FCO</strong> (Formation Continue Obligatoire) est à renouveler tous les 5 ans pour conserver le droit de conduire en transport professionnel. Durée : 35h.</p>
<h3>Financement</h3>
<ul>
  <li>CPF (Compte Personnel de Formation)</li>
  <li>OPCO (employeurs)</li>
  <li>Pôle Emploi (demandeurs d'emploi)</li>
</ul>`,
  },
  {
    titre: "Nos conseils pour bien choisir votre centre de formation",
    extrait: "Prix, localisation, avis, certifications : 5 critères pour choisir le bon stage près de chez vous.",
    contenu: `<h2>5 critères clés</h2>
<h3>1. La certification Qualiopi</h3>
<p>Indispensable si vous financez par CPF. Garantit la qualité pédagogique du centre.</p>
<h3>2. La proximité</h3>
<p>Un centre à moins de 30 min de chez vous évite la fatigue et les frais annexes.</p>
<h3>3. Les avis des anciens stagiaires</h3>
<p>Lisez au moins 5 avis récents. Attention aux centres sans aucun retour.</p>
<h3>4. Le prix</h3>
<p>Comptez entre 180 et 280€ pour un stage de récupération. Méfiez-vous des offres beaucoup moins chères.</p>
<h3>5. La disponibilité des créneaux</h3>
<p>Certains centres affichent complet 2 mois à l'avance. Anticipez votre réservation.</p>`,
  },
];

function randomPick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]!;
}

async function seedExtraStudents() {
  console.log(`👥 Création de ${EXTRA_STUDENTS} élèves supplémentaires…`);
  const created: { id: string }[] = [];

  for (let i = 0; i < EXTRA_STUDENTS; i++) {
    const firstName = faker.person.firstName();
    const lastName = faker.person.lastName();
    const email = faker.internet
      .email({ firstName, lastName, provider: faker.helpers.arrayElement(["gmail.com", "outlook.fr", "hotmail.fr", "yahoo.fr", "free.fr", "laposte.net", "orange.fr"]) })
      .toLowerCase();

    try {
      const user = await prisma.user.upsert({
        where: { email },
        update: {},
        create: {
          auth0Id: `demo_${Date.now()}_${i}_${faker.string.alphanumeric(8)}`,
          email,
          prenom: firstName,
          nom: lastName,
          telephone: faker.phone.number({ style: "national" }),
          codePostal: faker.location.zipCode("#####"),
          ville: faker.location.city(),
          role: "ELEVE",
          emailVerified: true,
          newsletterOptIn: faker.datatype.boolean({ probability: 0.7 }),
          loyaltyLevel: faker.helpers.arrayElement(["BRONZE", "SILVER", "GOLD"]),
          totalPoints: faker.number.int({ min: 0, max: 1500 }),
        },
      });
      created.push({ id: user.id });
    } catch (err) {
      // collision email, skip
    }
  }
  console.log(`   ↳ ${created.length} élèves créés`);
  return created;
}

async function seedExtraReservations(studentIds: { id: string }[]) {
  if (studentIds.length === 0) return;
  console.log(`🎫 Création de ${EXTRA_RESERVATIONS} réservations supplémentaires…`);
  const sessions = await prisma.session.findMany({
    where: { status: { in: ["ACTIVE", "COMPLETE", "PASSEE"] } },
    include: { formation: true },
  });
  if (sessions.length === 0) {
    console.log("   ⚠️  aucune session en base, skip");
    return;
  }

  const statuses: ("CONFIRMEE" | "TERMINEE" | "EN_ATTENTE" | "ANNULEE")[] = [
    "CONFIRMEE",
    "CONFIRMEE",
    "CONFIRMEE",
    "TERMINEE",
    "TERMINEE",
    "EN_ATTENTE",
    "ANNULEE",
  ];
  let ok = 0;
  for (let i = 0; i < EXTRA_RESERVATIONS; i++) {
    const user = randomPick(studentIds);
    const session = randomPick(sessions);
    const status = randomPick(statuses);
    const prix = session.formation.prix;
    try {
      await prisma.reservation.create({
        data: {
          status,
          montant: prix,
          commissionMontant: Math.round(prix * 0.1 * 100) / 100,
          nom: faker.person.lastName(),
          prenom: faker.person.firstName(),
          email: faker.internet.email().toLowerCase(),
          telephone: faker.phone.number({ style: "national" }),
          adresse: faker.location.streetAddress(),
          codePostal: faker.location.zipCode("#####"),
          ville: faker.location.city(),
          userId: user.id,
          sessionId: session.id,
        },
      });
      ok++;
    } catch (err) {
      // collisions possibles, continue
    }
  }
  console.log(`   ↳ ${ok} réservations créées`);
}

async function seedReviews(studentIds: { id: string }[]) {
  if (studentIds.length === 0) return;
  console.log(`⭐ Création de ${EXTRA_REVIEWS} avis…`);
  const formations = await prisma.formation.findMany({ take: 20 });
  if (formations.length === 0) return;

  let ok = 0;
  for (let i = 0; i < EXTRA_REVIEWS; i++) {
    const user = randomPick(studentIds);
    const formation = randomPick(formations);
    const note = faker.helpers.weightedArrayElement([
      { weight: 1, value: 3 },
      { weight: 2, value: 4 },
      { weight: 7, value: 5 },
    ]);
    try {
      await prisma.review.create({
        data: {
          userId: user.id,
          formationId: formation.id,
          note,
          commentaire: randomPick(reviewComments),
        },
      });
      ok++;
    } catch (err) {
      // doublon userId+formationId, skip
    }
  }
  console.log(`   ↳ ${ok} avis créés`);
}

async function seedTickets(studentIds: { id: string }[]) {
  if (studentIds.length === 0) return;
  console.log(`🎟️  Création de ${EXTRA_TICKETS} tickets support…`);
  const statuses: ("OUVERT" | "EN_COURS" | "RESOLU" | "FERME")[] = [
    "OUVERT",
    "OUVERT",
    "EN_COURS",
    "RESOLU",
    "RESOLU",
    "FERME",
  ];
  const priorites: ("BASSE" | "NORMALE" | "HAUTE" | "URGENTE")[] = [
    "NORMALE",
    "NORMALE",
    "NORMALE",
    "BASSE",
    "HAUTE",
  ];

  let ok = 0;
  for (let i = 0; i < EXTRA_TICKETS; i++) {
    const user = randomPick(studentIds);
    const ticket = await prisma.ticket.create({
      data: {
        sujet: randomPick(ticketSubjects),
        status: randomPick(statuses),
        priorite: randomPick(priorites),
        categorie: faker.helpers.arrayElement(["Paiement", "Convocation", "Annulation", "Compte", "Autre"]),
        userId: user.id,
      },
    });
    await prisma.ticketMessage.create({
      data: {
        ticketId: ticket.id,
        userId: user.id,
        contenu: randomPick(ticketMessages),
        isAdmin: false,
      },
    });
    ok++;
  }
  console.log(`   ↳ ${ok} tickets créés`);
}

async function seedArticles() {
  console.log(`📝 Création de ${EXTRA_ARTICLES} articles de blog…`);
  const admin = await prisma.user.findFirst({ where: { role: "ADMIN" } });
  if (!admin) {
    console.log("   ⚠️  aucun admin en base, skip");
    return;
  }

  let ok = 0;
  for (let i = 0; i < EXTRA_ARTICLES; i++) {
    const tmpl = articleTemplates[i % articleTemplates.length]!;
    const suffix = i >= articleTemplates.length ? ` — édition ${Math.floor(i / articleTemplates.length) + 1}` : "";
    const titre = tmpl.titre + suffix;
    const slug = faker.helpers.slugify(titre).toLowerCase() + "-" + faker.string.alphanumeric(4).toLowerCase();
    try {
      await prisma.article.create({
        data: {
          titre,
          slug,
          extrait: tmpl.extrait,
          contenu: tmpl.contenu,
          image: `https://images.unsplash.com/photo-${faker.helpers.arrayElement([
            "1449824913935-59a10b8d2000",
            "1502877338535-766e1452684a",
            "1494412574643-ff11b0a5c1c3",
            "1578662996442-48f60103fc96",
            "1486406146926-c627a92ad1ab",
          ])}?auto=format&fit=crop&w=800&q=70`,
          categorie: randomPick(articleCategories),
          isPublished: true,
          authorId: admin.id,
          publishedAt: faker.date.recent({ days: 120 }),
        },
      });
      ok++;
    } catch (err) {
      // slug collision, skip
    }
  }
  console.log(`   ↳ ${ok} articles créés`);
}

async function main() {
  console.log("═══════════════════════════════════════════");
  console.log("🌱 Seed DEMO — enrichissement des données");
  console.log("═══════════════════════════════════════════\n");

  const students = await seedExtraStudents();
  await seedExtraReservations(students);
  await seedReviews(students);
  await seedTickets(students);
  await seedArticles();

  console.log("\n═══════════════════════════════════════════");
  console.log("✅ Seed demo terminé.");
  console.log("═══════════════════════════════════════════");
}

main()
  .catch((err) => {
    console.error("❌ Erreur:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
