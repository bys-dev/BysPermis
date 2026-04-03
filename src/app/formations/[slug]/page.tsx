"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { useState, useEffect } from "react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faChevronRight,
  faClock,
  faEuroSign,
  faGraduationCap,
  faMapMarkerAlt,
  faCalendarDays,
  faUsers,
  faCheck,
  faShieldHalved,
  faAward,
  faCertificate,
  faFileLines,
  faCircleInfo,
  faPhone,
  faStar,
  faStarHalfStroke,
  faQuoteLeft,
  faArrowRight,
  faIdCard,
  faTruck,
  faTriangleExclamation,
  faClipboardList,
  faChevronDown,
  faChevronUp,
  faMagnifyingGlass,
} from "@fortawesome/free-solid-svg-icons";
import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";

// ─── TYPES ────────────────────────────────────────────────

interface Session {
  date: string;
  ville: string;
  centre: string;
  placesRestantes: number;
  prix: number;
}

interface ProgrammeJour {
  titre: string;
  modules: string[];
}

interface Testimonial {
  name: string;
  rating: number;
  text: string;
  date: string;
  ville: string;
}

interface RelatedFormation {
  title: string;
  slug: string;
  price: string;
  duration: string;
  icon: IconDefinition;
}

interface FormationData {
  title: string;
  subtitle: string;
  description: string;
  longDescription: string;
  duree: string;
  prix: string;
  prixNum: number;
  modalite: string;
  pointsRecuperes: string | null;
  badges: { label: string; variant: string }[];
  sessions: Session[];
  programme: ProgrammeJour[];
  infosPratiques: string[];
  documentsApporter: string[];
  horaires: string;
  testimonials: Testimonial[];
  relatedFormations: RelatedFormation[];
  icon: IconDefinition;
  metaKeywords: string[];
  eligibleCPF: boolean;
  obligatoire: boolean;
}

// ─── MOCK DATA ────────────────────────────────────────────

const formationsData: Record<string, FormationData> = {
  "recuperation-de-points": {
    title: "Stage de Recuperation de Points",
    subtitle: "Recuperez jusqu'a 4 points sur votre permis de conduire en 2 jours",
    description:
      "Le stage de sensibilisation a la securite routiere, communement appele stage de recuperation de points, vous permet de recuperer jusqu'a 4 points sur votre permis de conduire. Ce stage est accessible a tout conducteur ayant perdu des points, sous reserve de ne pas avoir effectue de stage dans les 12 derniers mois.",
    longDescription:
      "Le stage de recuperation de points est anime par deux professionnels : un psychologue et un specialiste de la securite routiere (BAFM). Durant ces deux jours, vous aborderez les facteurs generaux de l'insecurite routiere, analyserez vos comportements au volant et echangerez en groupe sur les risques lies a la conduite. Ce stage est strictement encadre par la reglementation (articles R223-5 et suivants du Code de la route). A l'issue du stage, une attestation vous est delivree et les 4 points sont credites le lendemain du dernier jour de stage sur votre solde de points.",
    duree: "2 jours (14 heures)",
    prix: "200 - 280 \u20ac",
    prixNum: 200,
    modalite: "Presentiel obligatoire",
    pointsRecuperes: "Jusqu'a 4 points",
    badges: [
      { label: "Agree Prefecture", variant: "qualiopi" },
      { label: "Qualiopi", variant: "qualiopi" },
      { label: "+4 points", variant: "success" },
    ],
    sessions: [
      { date: "5-6 Avril 2026", ville: "Paris 12e", centre: "Centre BYS Paris Est", placesRestantes: 8, prix: 230 },
      { date: "12-13 Avril 2026", ville: "Cergy-Pontoise", centre: "BYS Formation Osny", placesRestantes: 12, prix: 200 },
      { date: "19-20 Avril 2026", ville: "Lyon 3e", centre: "Centre Permis Lyon", placesRestantes: 3, prix: 250 },
      { date: "26-27 Avril 2026", ville: "Marseille 1er", centre: "Auto-Ecole du Vieux Port", placesRestantes: 6, prix: 240 },
      { date: "3-4 Mai 2026", ville: "Toulouse", centre: "Centre Occitanie Formation", placesRestantes: 15, prix: 220 },
      { date: "10-11 Mai 2026", ville: "Bordeaux", centre: "BYS Formation Aquitaine", placesRestantes: 9, prix: 235 },
    ],
    programme: [
      {
        titre: "Jour 1 - Analyse des comportements et facteurs d'accidents",
        modules: [
          "Accueil des stagiaires et presentation du cadre reglementaire",
          "Les donnees de l'accidentologie en France : chiffres cles et tendances",
          "Les facteurs d'accidents : vitesse, alcool, stupéfiants, fatigue, distracteurs",
          "L'influence de la vitesse sur la distance de freinage et la gravite des chocs",
          "Alcool et conduite : effets physiologiques, seuils legaux, sanctions",
          "Echanges en groupe et analyse de cas concrets",
        ],
      },
      {
        titre: "Jour 2 - Vigilance, perception des risques et bilan",
        modules: [
          "La vigilance et l'attention au volant : facteurs de degradation",
          "Perception des risques : angles morts, usagers vulnerables, conditions meteo",
          "Les sanctions et le systeme du permis a points (echelle des infractions)",
          "Travail en sous-groupes sur des situations a risque",
          "Bilan individuel et engagement personnel pour une conduite plus sure",
          "Remise de l'attestation de stage",
        ],
      },
    ],
    infosPratiques: [
      "Stage limite a 20 participants maximum",
      "Presence obligatoire pendant la totalite du stage (2 jours complets)",
      "Un seul stage de recuperation de points autorise par periode de 12 mois",
      "Les points sont credites le lendemain du dernier jour de stage",
      "Aucun examen ou controle de connaissances a la fin du stage",
    ],
    documentsApporter: [
      "Piece d'identite en cours de validite (CNI ou passeport)",
      "Permis de conduire original",
      "Convocation au stage (envoyee par email apres reservation)",
      "Releve d'information integral (RII) - recommande",
    ],
    horaires: "9h00 - 12h30 / 14h00 - 17h30 (les deux jours)",
    testimonials: [
      {
        name: "Marie L.",
        rating: 5,
        text: "Stage tres instructif. Les animateurs sont bienveillants et les echanges en groupe sont enrichissants. J'ai recupere mes 4 points rapidement.",
        date: "Mars 2026",
        ville: "Paris",
      },
      {
        name: "Thomas D.",
        rating: 4,
        text: "Bon stage, bien organise. J'apprehendais un peu mais l'ambiance etait detendue. On apprend beaucoup sur les risques de la route.",
        date: "Fevrier 2026",
        ville: "Cergy-Pontoise",
      },
      {
        name: "Sophie M.",
        rating: 5,
        text: "Excellent stage. Le psychologue et l'animateur etaient tres professionnels. Je recommande le centre BYS Formation.",
        date: "Janvier 2026",
        ville: "Lyon",
      },
    ],
    relatedFormations: [
      { title: "Stage 48N (permis probatoire)", slug: "sensibilisation-securite-routiere", price: "A partir de 200 \u20ac", duration: "2 jours", icon: faTriangleExclamation },
      { title: "Permis B accelere", slug: "permis-b-accelere", price: "A partir de 1 200 \u20ac", duration: "2-4 semaines", icon: faIdCard },
      { title: "FIMO / FCO Transport", slug: "fimo-fco", price: "A partir de 1 500 \u20ac", duration: "5 jours", icon: faTruck },
    ],
    icon: faShieldHalved,
    metaKeywords: ["stage recuperation points", "permis a points", "stage agree prefecture"],
    eligibleCPF: false,
    obligatoire: false,
  },

  "permis-b-accelere": {
    title: "Formation Permis B Accelere",
    subtitle: "Obtenez votre permis de conduire en 2 a 4 semaines grace a notre formation intensive",
    description:
      "La formation acceleree au permis B vous permet d'obtenir votre permis de conduire en un temps reduit. Grace a un programme intensif combinant code de la route et lecons de conduite, vous maximisez vos chances de reussite aux examens theorique et pratique.",
    longDescription:
      "Notre formation permis B accelere est concue pour les personnes souhaitant obtenir rapidement leur permis de conduire. Le programme comprend une formation intensive au code de la route (5 jours de cours collectifs + acces a la plateforme en ligne), suivie de 20 a 30 heures de conduite reparties sur 2 a 3 semaines. Nos moniteurs diplomes d'Etat (BEPECASER ou Titre Professionnel ECSR) vous accompagnent avec une pedagogie adaptee a votre rythme. La formation inclut la presentation aux examens theorique (ETG) et pratique. Le taux de reussite de nos eleves en formation acceleree est de 75% a la premiere presentation.",
    duree: "2 a 4 semaines",
    prix: "1 200 - 1 800 \u20ac",
    prixNum: 1200,
    modalite: "Presentiel (code + conduite)",
    pointsRecuperes: null,
    badges: [
      { label: "Qualiopi", variant: "qualiopi" },
      { label: "Eligible CPF", variant: "cpf" },
      { label: "Formation intensive", variant: "warning" },
    ],
    sessions: [
      { date: "7 Avril 2026", ville: "Cergy-Pontoise", centre: "BYS Formation Osny", placesRestantes: 5, prix: 1400 },
      { date: "14 Avril 2026", ville: "Paris 15e", centre: "Auto-Ecole Vaugirard", placesRestantes: 3, prix: 1800 },
      { date: "21 Avril 2026", ville: "Nanterre", centre: "Centre de Formation 92", placesRestantes: 8, prix: 1350 },
      { date: "5 Mai 2026", ville: "Versailles", centre: "BYS Formation Yvelines", placesRestantes: 6, prix: 1500 },
      { date: "12 Mai 2026", ville: "Pontoise", centre: "Ecole de Conduite du Val d'Oise", placesRestantes: 4, prix: 1200 },
    ],
    programme: [
      {
        titre: "Semaine 1 - Formation intensive au code de la route",
        modules: [
          "Cours collectifs de code de la route (5 jours, 35 heures)",
          "Signalisation routiere et regles de priorite",
          "Circulation et croisements",
          "Regles de stationnement et d'arret",
          "Visibilite, eclairage et conditions meteorologiques",
          "Acces illimite a la plateforme de revision en ligne",
          "Examens blancs quotidiens avec correction commentee",
        ],
      },
      {
        titre: "Semaines 2 a 4 - Cours de conduite intensifs",
        modules: [
          "Prise en main du vehicule et maniabilite (5 premieres heures)",
          "Circulation en agglomeration : intersections, ronds-points, priorites",
          "Conduite hors agglomeration : routes departementales, nationales",
          "Insertion et conduite sur voie rapide / autoroute",
          "Manoeuvres : creneaux, marche arriere, demi-tour",
          "Conduite autonome et preparation a l'examen pratique",
          "Examen blanc dans les conditions reelles",
          "Presentation a l'examen du code (ETG) et a l'epreuve pratique",
        ],
      },
    ],
    infosPratiques: [
      "Age minimum : 17 ans (conduite accompagnee) ou 18 ans (permis classique)",
      "Formation de 20 heures minimum obligatoires (souvent 25-30h en accelere)",
      "Passage de l'ETG (code) inclus dans le forfait",
      "Presentation a l'examen pratique incluse (1 presentation)",
      "Vehicule a double commande fourni pour les lecons et l'examen",
      "Eligible au CPF (Compte Personnel de Formation)",
      "Eligible au permis a 1 euro par jour (sous conditions)",
    ],
    documentsApporter: [
      "Piece d'identite en cours de validite",
      "Justificatif de domicile de moins de 6 mois",
      "4 photos d'identite aux normes (e-photo recommande)",
      "Certificat individuel de participation a la JDC (ou JAPD)",
      "ASSR 2 ou ASR (si ne en 1988 ou apres)",
      "Formulaire Cerfa 02 (fourni par le centre)",
    ],
    horaires: "Lundi au vendredi : 8h00 - 12h00 / 13h00 - 17h00 (code) | Heures de conduite selon planning",
    testimonials: [
      {
        name: "Alexis R.",
        rating: 5,
        text: "J'ai obtenu mon permis en 3 semaines ! La formation acceleree est intense mais tres efficace. Les moniteurs sont patients et pedagogues.",
        date: "Mars 2026",
        ville: "Cergy-Pontoise",
      },
      {
        name: "Camille B.",
        rating: 4,
        text: "Tres bonne experience. Le rythme est soutenu pour le code mais ca permet de rester concentre. J'ai eu le code du premier coup et le permis au deuxieme passage.",
        date: "Fevrier 2026",
        ville: "Nanterre",
      },
      {
        name: "Hugo P.",
        rating: 5,
        text: "Je recommande a 100% ! Formation tres bien organisee, moniteurs top. J'ai eu le code et le permis du premier coup en seulement 2 semaines et demie.",
        date: "Janvier 2026",
        ville: "Paris",
      },
    ],
    relatedFormations: [
      { title: "Stage recuperation de points", slug: "recuperation-de-points", price: "A partir de 200 \u20ac", duration: "2 jours", icon: faShieldHalved },
      { title: "FIMO / FCO Transport", slug: "fimo-fco", price: "A partir de 1 500 \u20ac", duration: "5 jours", icon: faTruck },
      { title: "Stage securite routiere (48N)", slug: "sensibilisation-securite-routiere", price: "A partir de 200 \u20ac", duration: "2 jours", icon: faTriangleExclamation },
    ],
    icon: faIdCard,
    metaKeywords: ["permis b accelere", "permis rapide", "formation intensive permis"],
    eligibleCPF: true,
    obligatoire: false,
  },

  "fimo-fco": {
    title: "FIMO / FCO Transport de Marchandises",
    subtitle: "Formation Initiale Minimale Obligatoire et Formation Continue Obligatoire pour le transport routier",
    description:
      "La FIMO (Formation Initiale Minimale Obligatoire) et la FCO (Formation Continue Obligatoire) sont des formations reglementaires pour exercer le metier de conducteur routier de marchandises. La FIMO est obligatoire pour tout nouveau conducteur, la FCO doit etre renouvelee tous les 5 ans.",
    longDescription:
      "La FIMO permet d'obtenir la qualification initiale necessaire pour conduire un vehicule de transport de marchandises de plus de 3,5 tonnes. D'une duree de 140 heures (4 semaines), elle couvre l'ensemble des competences requises : reglementation du transport, securite routiere, conduite rationnelle et logistique. La FCO, d'une duree de 35 heures (5 jours), permet de renouveler la qualification tous les 5 ans. Ces formations sont dispensees dans des centres agrees par la DREAL (Direction Regionale de l'Environnement, de l'Amenagement et du Logement) et donnent lieu a la delivrance d'une carte de qualification de conducteur (CQC).",
    duree: "5 jours (35h) pour la FCO / 4 semaines (140h) pour la FIMO",
    prix: "1 500 - 2 800 \u20ac",
    prixNum: 1500,
    modalite: "Presentiel (theorie + pratique)",
    pointsRecuperes: null,
    badges: [
      { label: "Agree DREAL", variant: "qualiopi" },
      { label: "Qualiopi", variant: "qualiopi" },
      { label: "Eligible CPF", variant: "cpf" },
      { label: "Obligatoire", variant: "danger" },
    ],
    sessions: [
      { date: "6 Avril 2026 (FCO)", ville: "Cergy-Pontoise", centre: "BYS Formation Osny", placesRestantes: 6, prix: 1500 },
      { date: "7 Avril 2026 (FIMO)", ville: "Cergy-Pontoise", centre: "BYS Formation Osny", placesRestantes: 4, prix: 2500 },
      { date: "13 Avril 2026 (FCO)", ville: "Roissy CDG", centre: "Centre Logistique IDF", placesRestantes: 10, prix: 1600 },
      { date: "4 Mai 2026 (FIMO)", ville: "Lyon", centre: "Centre Transport Rhone-Alpes", placesRestantes: 3, prix: 2800 },
      { date: "11 Mai 2026 (FCO)", ville: "Marseille", centre: "Formation Transport PACA", placesRestantes: 8, prix: 1550 },
    ],
    programme: [
      {
        titre: "Module 1 - Reglementation du transport routier",
        modules: [
          "Reglementation sociale europeenne (temps de conduite et de repos)",
          "Reglementation applicable aux transports de marchandises (national et international)",
          "Le contrat de transport et les documents de bord obligatoires",
          "Les responsabilites du conducteur routier",
          "Les sanctions en cas d'infraction a la reglementation",
        ],
      },
      {
        titre: "Module 2 - Securite routiere et prevention des risques",
        modules: [
          "Les accidents de la route impliquant des poids lourds : analyse et prevention",
          "La conduite en conditions difficiles (nuit, pluie, verglas, brouillard)",
          "Le chargement et l'arrimage des marchandises (normes EN 12195)",
          "Le transport de marchandises dangereuses (sensibilisation ADR)",
          "Les gestes de premiers secours (PSC1 ou equivalent)",
        ],
      },
      {
        titre: "Module 3 - Technique automobile et conduite rationnelle",
        modules: [
          "Fonctionnement et entretien du vehicule (moteur, freins, pneumatiques)",
          "Les organes de securite : ABS, EBS, ralentisseur, limiteur de vitesse",
          "L'eco-conduite : techniques pour reduire la consommation de carburant",
          "Conduite sur piste : freinage d'urgence, evitement, manoeuvres",
          "Lecture de cartes et utilisation du chronotachygraphe numerique",
        ],
      },
    ],
    infosPratiques: [
      "FIMO : obligatoire pour tout nouveau conducteur (pas de permis C/CE avant 2008 sans FIMO)",
      "FCO : renouvellement obligatoire tous les 5 ans",
      "Conditions : etre titulaire du permis C ou CE en cours de validite",
      "La formation donne lieu a la delivrance de la carte CQC (Carte de Qualification de Conducteur)",
      "Centre agree par la DREAL Ile-de-France",
      "Eligible au CPF et a divers financements (Pole Emploi, OPCO, region)",
    ],
    documentsApporter: [
      "Piece d'identite en cours de validite",
      "Permis de conduire C ou CE en cours de validite",
      "Carte CQC precedente (pour renouvellement FCO)",
      "Visite medicale du permis de conduire a jour",
      "Justificatif de domicile de moins de 6 mois",
      "Attestation de financement (si CPF, OPCO ou Pole Emploi)",
    ],
    horaires: "Lundi au vendredi : 8h00 - 12h00 / 13h00 - 16h00",
    testimonials: [
      {
        name: "Karim A.",
        rating: 5,
        text: "Formation FCO tres complete. Les formateurs sont des anciens routiers, ils connaissent parfaitement le metier. La partie conduite sur piste est un vrai plus.",
        date: "Mars 2026",
        ville: "Cergy-Pontoise",
      },
      {
        name: "Jean-Pierre M.",
        rating: 4,
        text: "Bonne formation FIMO. Le rythme est intense sur 4 semaines mais c'est necessaire pour etre bien prepare. Centre bien equipe avec vehicules recents.",
        date: "Fevrier 2026",
        ville: "Roissy",
      },
      {
        name: "David N.",
        rating: 5,
        text: "J'ai fait ma FCO chez BYS. Tout etait bien organise, les formateurs sont pros et le contenu est pertinent. Je reviendrais dans 5 ans !",
        date: "Janvier 2026",
        ville: "Lyon",
      },
    ],
    relatedFormations: [
      { title: "Stage recuperation de points", slug: "recuperation-de-points", price: "A partir de 200 \u20ac", duration: "2 jours", icon: faShieldHalved },
      { title: "Permis B accelere", slug: "permis-b-accelere", price: "A partir de 1 200 \u20ac", duration: "2-4 semaines", icon: faIdCard },
      { title: "Stage securite routiere (48N)", slug: "sensibilisation-securite-routiere", price: "A partir de 200 \u20ac", duration: "2 jours", icon: faTriangleExclamation },
    ],
    icon: faTruck,
    metaKeywords: ["FIMO", "FCO", "formation transport marchandises", "carte CQC"],
    eligibleCPF: true,
    obligatoire: true,
  },

  "sensibilisation-securite-routiere": {
    title: "Stage de Sensibilisation a la Securite Routiere (48N)",
    subtitle: "Stage obligatoire pour les titulaires d'un permis probatoire ayant commis une infraction",
    description:
      "Le stage de sensibilisation a la securite routiere en permis probatoire (dit \"stage 48N\") est un stage obligatoire destine aux jeunes conducteurs ayant commis une infraction entrainant un retrait de 3 points ou plus pendant leur periode probatoire. Ce stage permet de recuperer jusqu'a 4 points et est rembourse par le Tresor public.",
    longDescription:
      "Lorsque vous recevez la lettre 48N de la part du Ministere de l'Interieur, vous disposez de 4 mois pour effectuer un stage de sensibilisation a la securite routiere dans un centre agree par la Prefecture. Ce stage de 2 jours (14 heures) est identique dans son contenu au stage volontaire de recuperation de points, mais il est obligatoire et son non-respect peut entrainer la suspension de votre permis de conduire. A l'issue du stage, vous recuperez jusqu'a 4 points et vous pouvez demander le remboursement de l'amende forfaitaire aupres du Tresor public (article R223-4 du Code de la route).",
    duree: "2 jours (14 heures)",
    prix: "200 - 280 \u20ac",
    prixNum: 200,
    modalite: "Presentiel obligatoire",
    pointsRecuperes: "Jusqu'a 4 points",
    badges: [
      { label: "Agree Prefecture", variant: "qualiopi" },
      { label: "Obligatoire (48N)", variant: "danger" },
      { label: "+4 points", variant: "success" },
      { label: "Amende remboursable", variant: "info" },
    ],
    sessions: [
      { date: "5-6 Avril 2026", ville: "Paris 12e", centre: "Centre BYS Paris Est", placesRestantes: 6, prix: 250 },
      { date: "12-13 Avril 2026", ville: "Cergy-Pontoise", centre: "BYS Formation Osny", placesRestantes: 10, prix: 210 },
      { date: "19-20 Avril 2026", ville: "Lille", centre: "Centre Formation Nord", placesRestantes: 8, prix: 230 },
      { date: "26-27 Avril 2026", ville: "Nantes", centre: "Formation Atlantique", placesRestantes: 5, prix: 240 },
      { date: "3-4 Mai 2026", ville: "Strasbourg", centre: "Centre Alsace Formation", placesRestantes: 12, prix: 220 },
    ],
    programme: [
      {
        titre: "Jour 1 - Accidentologie et facteurs de risque",
        modules: [
          "Accueil, presentation du cadre legal du stage 48N",
          "Rappel du fonctionnement du permis probatoire et du systeme de points",
          "Donnees de l'accidentologie : les jeunes conducteurs surrepresentes",
          "Facteurs de risque : vitesse, alcool, stupefiants, telephone, fatigue",
          "L'influence de la prise de risque et du sentiment d'invulnerabilite",
          "Echanges en groupe sur les circonstances de l'infraction commise",
        ],
      },
      {
        titre: "Jour 2 - Perception des risques et engagement",
        modules: [
          "La perception des risques : comment notre cerveau nous trompe",
          "Les consequences d'un accident : physiques, psychologiques, juridiques, financieres",
          "La pression des pairs et l'influence du groupe sur la conduite",
          "Etudes de cas et temoignages de victimes d'accidents",
          "Bilan individuel : identifier ses facteurs de risque personnels",
          "Engagement personnel pour une conduite responsable",
          "Remise de l'attestation de stage 48N",
        ],
      },
    ],
    infosPratiques: [
      "Stage obligatoire apres reception de la lettre 48N du Ministere de l'Interieur",
      "Vous disposez de 4 mois apres reception de la lettre pour effectuer le stage",
      "Le non-respect du delai de 4 mois entraine la suspension du permis de conduire",
      "L'amende forfaitaire est remboursable sur demande aupres du Tresor public",
      "Le stage est identique au stage volontaire mais avec un caractere obligatoire",
      "Les points sont credites le lendemain du dernier jour de stage",
      "Limite a 20 participants maximum par session",
    ],
    documentsApporter: [
      "Piece d'identite en cours de validite (CNI ou passeport)",
      "Permis de conduire original",
      "Lettre 48N originale du Ministere de l'Interieur",
      "Convocation au stage (envoyee par email apres reservation)",
      "Releve d'information integral (RII) - recommande",
    ],
    horaires: "9h00 - 12h30 / 14h00 - 17h30 (les deux jours)",
    testimonials: [
      {
        name: "Lucas T.",
        rating: 4,
        text: "J'ai recu ma lettre 48N apres un exces de vitesse. Le stage m'a permis de prendre conscience des risques. Les animateurs ne sont pas moralisateurs, c'est appreciable.",
        date: "Mars 2026",
        ville: "Cergy-Pontoise",
      },
      {
        name: "Emma G.",
        rating: 5,
        text: "Stage obligatoire mais finalement tres enrichissant. J'ai recupere mes points et j'ai pu me faire rembourser l'amende. Merci BYS Formation !",
        date: "Fevrier 2026",
        ville: "Paris",
      },
      {
        name: "Amine K.",
        rating: 5,
        text: "Tres bon stage, les intervenants sont professionnels et a l'ecoute. Le remboursement de l'amende est un vrai plus. Je recommande ce centre.",
        date: "Janvier 2026",
        ville: "Lille",
      },
    ],
    relatedFormations: [
      { title: "Stage volontaire recuperation de points", slug: "recuperation-de-points", price: "A partir de 200 \u20ac", duration: "2 jours", icon: faShieldHalved },
      { title: "Permis B accelere", slug: "permis-b-accelere", price: "A partir de 1 200 \u20ac", duration: "2-4 semaines", icon: faIdCard },
      { title: "FIMO / FCO Transport", slug: "fimo-fco", price: "A partir de 1 500 \u20ac", duration: "5 jours", icon: faTruck },
    ],
    icon: faTriangleExclamation,
    metaKeywords: ["stage 48N", "permis probatoire", "stage obligatoire", "lettre 48N"],
    eligibleCPF: false,
    obligatoire: true,
  },
};

// ─── STAR RATING COMPONENT ────────────────────────────────

function StarRating({ rating }: { rating: number }) {
  const stars = [];
  for (let i = 1; i <= 5; i++) {
    if (i <= Math.floor(rating)) {
      stars.push(<FontAwesomeIcon key={i} icon={faStar} className="text-yellow-400 text-sm" />);
    } else if (i - 0.5 <= rating) {
      stars.push(<FontAwesomeIcon key={i} icon={faStarHalfStroke} className="text-yellow-400 text-sm" />);
    } else {
      stars.push(<FontAwesomeIcon key={i} icon={faStar} className="text-gray-300 text-sm" />);
    }
  }
  return <div className="flex items-center gap-0.5">{stars}</div>;
}

// ─── BADGE COMPONENT (inline) ─────────────────────────────

function BadgeInline({ label, variant }: { label: string; variant: string }) {
  const styles: Record<string, string> = {
    qualiopi: "bg-blue-50 text-blue-700 border border-blue-200",
    cpf: "bg-indigo-50 text-indigo-700 border border-indigo-200",
    success: "bg-emerald-50 text-emerald-700 border border-emerald-200",
    warning: "bg-amber-50 text-amber-700 border border-amber-200",
    danger: "bg-red-50 text-red-700 border border-red-200",
    info: "bg-cyan-50 text-cyan-700 border border-cyan-200",
    default: "bg-gray-100 text-gray-600 border border-gray-200",
  };
  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${styles[variant] || styles.default}`}>
      {label}
    </span>
  );
}

// ─── MAIN PAGE COMPONENT ──────────────────────────────────

interface LiveSession {
  id: string;
  dateDebut: string;
  dateFin: string;
  placesRestantes: number;
  prix: number;
  ville: string;
  centre: string;
}

interface ReviewPublic {
  id: string;
  note: number;
  commentaire: string | null;
  createdAt: string;
  user: { prenom: string; nom: string };
}

interface ReviewsData {
  reviews: ReviewPublic[];
  average: number;
  count: number;
}

export default function FormationDetailPage() {
  const params = useParams();
  const slug = params.slug as string;
  const [openProgramme, setOpenProgramme] = useState<number | null>(0);
  const [liveSessions, setLiveSessions] = useState<LiveSession[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [apiNotFound, setApiNotFound] = useState(false);
  const [reviewsData, setReviewsData] = useState<ReviewsData | null>(null);

  useEffect(() => {
    setLoading(true);
    setApiNotFound(false);
    fetch(`/api/formations/slug/${slug}`)
      .then((r) => {
        if (r.status === 404) {
          setApiNotFound(true);
          return null;
        }
        return r.json();
      })
      .then((data) => {
        if (data?.sessions?.length > 0) setLiveSessions(data.sessions);
        if (data?.id) {
          // Fetch reviews for this formation
          fetch(`/api/formations/${data.id}/reviews`)
            .then((r) => (r.ok ? r.json() : null))
            .then((rd) => { if (rd) setReviewsData(rd); })
            .catch(() => null);
        }
      })
      .catch(() => null)
      .finally(() => setLoading(false));
  }, [slug]);

  const formation = formationsData[slug];

  // Show loading state while API is being fetched (only when no mock data either)
  if (loading && !formation) {
    return (
      <>
        <Header />
        <main className="bg-[#F9FAFB] min-h-screen">
          <div className="max-w-4xl mx-auto px-4 py-24 text-center">
            <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-6" />
            <p className="text-gray-500 text-lg">Chargement de la formation...</p>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  // 404-like state: no mock data AND (API returned 404 or finished loading)
  if (!formation && (apiNotFound || !loading)) {
    return (
      <>
        <Header />
        <main className="bg-[#F9FAFB] min-h-screen">
          <div className="max-w-4xl mx-auto px-4 py-24 text-center">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <FontAwesomeIcon icon={faCircleInfo} className="text-3xl text-gray-400" />
            </div>
            <h1 className="font-display text-3xl font-bold text-brand-text mb-4">Formation introuvable</h1>
            <p className="text-gray-500 mb-8 text-lg">
              La formation recherch&eacute;e n&apos;existe pas ou n&apos;est plus disponible.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/recherche"
                className="inline-flex items-center gap-2 bg-red-600 text-white px-8 py-3 rounded-lg text-base font-semibold hover:bg-red-700 transition-colors"
              >
                <FontAwesomeIcon icon={faMagnifyingGlass} className="text-sm" />
                Rechercher une formation
              </Link>
              <Link
                href="/"
                className="inline-flex items-center gap-2 border-2 border-brand-border text-gray-600 px-8 py-3 rounded-lg text-base font-medium hover:border-brand-accent hover:text-brand-accent transition-colors"
              >
                Retour &agrave; l&apos;accueil
              </Link>
            </div>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header />
      <main className="bg-[#F9FAFB] min-h-screen">
        {/* ─── BREADCRUMB ─── */}
        <div className="bg-white border-b border-brand-border">
          <div className="max-w-[1440px] mx-auto px-4 sm:px-8 py-3">
            <nav className="flex items-center gap-2 text-sm text-gray-500">
              <Link href="/" className="hover:text-brand-accent transition-colors">
                Accueil
              </Link>
              <FontAwesomeIcon icon={faChevronRight} className="text-[10px] text-gray-400" />
              <Link href="/recherche" className="hover:text-brand-accent transition-colors">
                Formations
              </Link>
              <FontAwesomeIcon icon={faChevronRight} className="text-[10px] text-gray-400" />
              <span className="text-brand-text font-medium truncate">{formation.title}</span>
            </nav>
          </div>
        </div>

        {/* ─── HERO ─── */}
        <section className="bg-white border-b border-brand-border">
          <div className="max-w-[1440px] mx-auto px-4 sm:px-8 py-10 lg:py-14">
            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-8">
              <div className="flex-1 max-w-3xl">
                {/* Badges */}
                <div className="flex flex-wrap gap-2 mb-5">
                  {formation.badges.map((badge, idx) => (
                    <BadgeInline key={idx} label={badge.label} variant={badge.variant} />
                  ))}
                </div>

                {/* Title */}
                <h1 className="font-display text-3xl sm:text-4xl lg:text-[42px] font-bold text-brand-text leading-tight mb-4">
                  {formation.title}
                </h1>
                <p className="text-gray-500 text-lg leading-relaxed">
                  {formation.subtitle}
                </p>
              </div>

              {/* Icon */}
              <div className="hidden lg:flex w-24 h-24 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-100 items-center justify-center shrink-0">
                <FontAwesomeIcon icon={formation.icon} className="text-4xl text-brand-accent" />
              </div>
            </div>

            {/* Key Info Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-10">
              <div className="bg-[#F9FAFB] rounded-xl p-5 border border-brand-border">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center">
                    <FontAwesomeIcon icon={faClock} className="text-brand-accent text-sm" />
                  </div>
                  <span className="text-xs text-gray-500 font-medium uppercase tracking-wide">Duree</span>
                </div>
                <p className="font-display font-bold text-brand-text">{formation.duree}</p>
              </div>

              <div className="bg-[#F9FAFB] rounded-xl p-5 border border-brand-border">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-9 h-9 rounded-lg bg-emerald-50 flex items-center justify-center">
                    <FontAwesomeIcon icon={faEuroSign} className="text-emerald-600 text-sm" />
                  </div>
                  <span className="text-xs text-gray-500 font-medium uppercase tracking-wide">Prix</span>
                </div>
                <p className="font-display font-bold text-brand-text">{formation.prix}</p>
              </div>

              <div className="bg-[#F9FAFB] rounded-xl p-5 border border-brand-border">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-9 h-9 rounded-lg bg-purple-50 flex items-center justify-center">
                    <FontAwesomeIcon icon={faGraduationCap} className="text-purple-600 text-sm" />
                  </div>
                  <span className="text-xs text-gray-500 font-medium uppercase tracking-wide">Modalite</span>
                </div>
                <p className="font-display font-bold text-brand-text text-sm">{formation.modalite}</p>
              </div>

              <div className="bg-[#F9FAFB] rounded-xl p-5 border border-brand-border">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-9 h-9 rounded-lg bg-amber-50 flex items-center justify-center">
                    <FontAwesomeIcon
                      icon={formation.pointsRecuperes ? faShieldHalved : faClipboardList}
                      className={`text-sm ${formation.pointsRecuperes ? "text-amber-600" : "text-amber-600"}`}
                    />
                  </div>
                  <span className="text-xs text-gray-500 font-medium uppercase tracking-wide">
                    {formation.pointsRecuperes ? "Points" : "Type"}
                  </span>
                </div>
                <p className="font-display font-bold text-brand-text text-sm">
                  {formation.pointsRecuperes || (formation.obligatoire ? "Formation obligatoire" : "Formation qualifiante")}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ─── CONTENT + SIDEBAR ─── */}
        <div className="max-w-[1440px] mx-auto px-4 sm:px-8 py-10 lg:py-14">
          <div className="flex flex-col lg:flex-row gap-10">
            {/* Main Content */}
            <div className="flex-1 min-w-0">
              {/* Description */}
              <section className="bg-white rounded-xl border border-brand-border p-6 sm:p-8 mb-8">
                <h2 className="font-display text-2xl font-bold text-brand-text mb-4">
                  A propos de cette formation
                </h2>
                <p className="text-gray-600 leading-relaxed mb-4">
                  {formation.description}
                </p>
                <p className="text-gray-600 leading-relaxed">
                  {formation.longDescription}
                </p>
              </section>

              {/* Programme */}
              <section className="bg-white rounded-xl border border-brand-border p-6 sm:p-8 mb-8">
                <h2 className="font-display text-2xl font-bold text-brand-text mb-6">
                  Programme de la formation
                </h2>
                <div className="space-y-4">
                  {formation.programme.map((jour, idx) => (
                    <div key={idx} className="border border-brand-border rounded-lg overflow-hidden">
                      <button
                        onClick={() => setOpenProgramme(openProgramme === idx ? null : idx)}
                        className="w-full flex items-center justify-between p-5 bg-gray-50 hover:bg-gray-100 transition-colors text-left"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-brand-accent flex items-center justify-center shrink-0">
                            <span className="text-white font-bold text-sm">{idx + 1}</span>
                          </div>
                          <h3 className="font-display font-semibold text-brand-text text-sm sm:text-base">
                            {jour.titre}
                          </h3>
                        </div>
                        <FontAwesomeIcon
                          icon={openProgramme === idx ? faChevronUp : faChevronDown}
                          className="text-gray-400 text-sm shrink-0 ml-4"
                        />
                      </button>
                      {openProgramme === idx && (
                        <div className="p-5 border-t border-brand-border">
                          <ul className="space-y-3">
                            {jour.modules.map((module, mIdx) => (
                              <li key={mIdx} className="flex items-start gap-3">
                                <FontAwesomeIcon icon={faCheck} className="text-emerald-500 text-xs mt-1.5 shrink-0" />
                                <span className="text-gray-600 text-sm leading-relaxed">{module}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </section>

              {/* Prochaines sessions */}
              <section className="bg-white rounded-xl border border-brand-border p-6 sm:p-8 mb-8">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="font-display text-2xl font-bold text-brand-text">
                    Prochaines sessions
                  </h2>
                  <span className="text-sm text-gray-500">
                    {(liveSessions ?? formation.sessions).length} sessions disponibles
                  </span>
                </div>

                {/* Desktop table */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-brand-border">
                        <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide pb-3 pr-4">Date</th>
                        <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide pb-3 pr-4">Ville</th>
                        <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide pb-3 pr-4">Centre</th>
                        <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide pb-3 pr-4">Places</th>
                        <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide pb-3 pr-4">Prix</th>
                        <th className="text-right text-xs font-semibold text-gray-500 uppercase tracking-wide pb-3"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {(liveSessions
                        ? liveSessions.map((s) => ({
                            id: s.id,
                            date: `${new Date(s.dateDebut).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })} — ${new Date(s.dateFin).toLocaleDateString("fr-FR", { day: "numeric", month: "long" })}`,
                            ville: s.ville,
                            centre: s.centre,
                            placesRestantes: s.placesRestantes,
                            prix: s.prix,
                            sessionId: s.id,
                          }))
                        : formation.sessions.map((s, i) => ({ ...s, id: String(i), sessionId: `mock_${i}` }))
                      ).map((session) => (
                        <tr key={session.id} className="border-b border-brand-border last:border-0 hover:bg-gray-50 transition-colors">
                          <td className="py-4 pr-4">
                            <div className="flex items-center gap-2">
                              <FontAwesomeIcon icon={faCalendarDays} className="text-brand-accent text-xs" />
                              <span className="font-medium text-brand-text text-sm">{session.date}</span>
                            </div>
                          </td>
                          <td className="py-4 pr-4">
                            <div className="flex items-center gap-2">
                              <FontAwesomeIcon icon={faMapMarkerAlt} className="text-gray-400 text-xs" />
                              <span className="text-gray-600 text-sm">{session.ville}</span>
                            </div>
                          </td>
                          <td className="py-4 pr-4 text-gray-600 text-sm">{session.centre}</td>
                          <td className="py-4 pr-4">
                            <span
                              className={`inline-flex items-center gap-1.5 text-sm font-medium ${
                                session.placesRestantes <= 3
                                  ? "text-red-600"
                                  : session.placesRestantes <= 6
                                  ? "text-amber-600"
                                  : "text-emerald-600"
                              }`}
                            >
                              <FontAwesomeIcon icon={faUsers} className="text-xs" />
                              {session.placesRestantes} places
                            </span>
                          </td>
                          <td className="py-4 pr-4">
                            <span className="font-display font-bold text-brand-text">{session.prix} &euro;</span>
                          </td>
                          <td className="py-4 text-right">
                            <Link
                              href={`/reserver/${session.sessionId}/donnees`}
                              className="inline-flex items-center gap-2 bg-red-600 text-white px-5 py-2 rounded-lg text-sm font-semibold hover:bg-red-700 transition-colors"
                            >
                              Réserver
                              <FontAwesomeIcon icon={faArrowRight} className="text-xs" />
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile cards */}
                <div className="md:hidden space-y-4">
                  {(liveSessions
                    ? liveSessions.map((s) => ({
                        id: s.id,
                        date: `${new Date(s.dateDebut).toLocaleDateString("fr-FR", { day: "numeric", month: "long" })} — ${new Date(s.dateFin).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}`,
                        ville: s.ville, centre: s.centre,
                        placesRestantes: s.placesRestantes, prix: s.prix, sessionId: s.id,
                      }))
                    : formation.sessions.map((s, i) => ({ ...s, id: String(i), sessionId: `mock_${i}` }))
                  ).map((session) => (
                    <div key={session.id} className="border border-brand-border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <FontAwesomeIcon icon={faCalendarDays} className="text-brand-accent text-sm" />
                          <span className="font-medium text-brand-text text-sm">{session.date}</span>
                        </div>
                        <span className="font-display font-bold text-brand-text">{session.prix} &euro;</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
                        <FontAwesomeIcon icon={faMapMarkerAlt} className="text-xs" />
                        {session.ville} - {session.centre}
                      </div>
                      <div className="flex items-center justify-between mt-3">
                        <span
                          className={`text-sm font-medium ${
                            session.placesRestantes <= 3
                              ? "text-red-600"
                              : session.placesRestantes <= 6
                              ? "text-amber-600"
                              : "text-emerald-600"
                          }`}
                        >
                          {session.placesRestantes} places restantes
                        </span>
                        <Link
                          href={`/reserver/${session.sessionId}/donnees`}
                          className="inline-flex items-center gap-2 bg-brand-accent text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-brand-accent-hover transition-colors"
                        >
                          Réserver
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              {/* Testimonials */}
              <section className="bg-white rounded-xl border border-brand-border p-6 sm:p-8 mb-8">
                <h2 className="font-display text-2xl font-bold text-brand-text mb-6">
                  Avis de nos stagiaires
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {formation.testimonials.map((testimonial, idx) => (
                    <div key={idx} className="bg-gray-50 rounded-xl p-5 border border-brand-border">
                      <div className="flex items-center justify-between mb-3">
                        <StarRating rating={testimonial.rating} />
                        <span className="text-xs text-gray-400">{testimonial.date}</span>
                      </div>
                      <div className="relative mb-3">
                        <FontAwesomeIcon icon={faQuoteLeft} className="text-gray-200 text-2xl absolute -top-1 -left-1" />
                        <p className="text-gray-600 text-sm leading-relaxed pl-6">
                          {testimonial.text}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 pt-2 border-t border-brand-border">
                        <div className="w-8 h-8 rounded-full bg-brand-accent flex items-center justify-center">
                          <span className="text-white text-xs font-bold">
                            {testimonial.name.charAt(0)}
                          </span>
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-brand-text">{testimonial.name}</p>
                          <p className="text-xs text-gray-400">{testimonial.ville}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              {/* Dynamic Reviews from DB */}
              {reviewsData && reviewsData.count > 0 && (
                <section className="bg-white rounded-xl border border-brand-border p-6 sm:p-8 mb-8">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="font-display text-2xl font-bold text-brand-text">
                      Avis vérifiés
                    </h2>
                    <div className="flex items-center gap-3">
                      <StarRating rating={reviewsData.average} />
                      <span className="text-sm font-semibold text-brand-text">{reviewsData.average}/5</span>
                      <span className="text-sm text-gray-400">({reviewsData.count} avis)</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {reviewsData.reviews.map((review) => (
                      <div key={review.id} className="bg-gray-50 rounded-xl p-5 border border-brand-border">
                        <div className="flex items-center justify-between mb-3">
                          <StarRating rating={review.note} />
                          <span className="text-xs text-gray-400">
                            {new Date(review.createdAt).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
                          </span>
                        </div>
                        {review.commentaire && (
                          <div className="relative mb-3">
                            <FontAwesomeIcon icon={faQuoteLeft} className="text-gray-200 text-2xl absolute -top-1 -left-1" />
                            <p className="text-gray-600 text-sm leading-relaxed pl-6">
                              {review.commentaire}
                            </p>
                          </div>
                        )}
                        <div className="flex items-center gap-2 pt-2 border-t border-brand-border">
                          <div className="w-8 h-8 rounded-full bg-brand-accent flex items-center justify-center">
                            <span className="text-white text-xs font-bold">
                              {review.user.prenom.charAt(0)}
                            </span>
                          </div>
                          <p className="text-sm font-semibold text-brand-text">
                            {review.user.prenom} {review.user.nom}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* Related Formations */}
              <section>
                <h2 className="font-display text-2xl font-bold text-brand-text mb-6">
                  Formations associees
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                  {formation.relatedFormations.map((related, idx) => (
                    <Link
                      key={idx}
                      href={`/formations/${related.slug}`}
                      className="bg-white rounded-xl border border-brand-border p-5 hover:shadow-lg hover:-translate-y-1 transition-all group"
                    >
                      <div className="w-11 h-11 rounded-xl bg-blue-50 flex items-center justify-center mb-4 group-hover:bg-blue-100 transition-colors">
                        <FontAwesomeIcon icon={related.icon} className="text-brand-accent text-lg" />
                      </div>
                      <h3 className="font-display font-semibold text-brand-text mb-2 group-hover:text-brand-accent transition-colors">
                        {related.title}
                      </h3>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500">{related.duration}</span>
                        <span className="font-semibold text-brand-accent">{related.price}</span>
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            </div>

            {/* ─── SIDEBAR ─── */}
            <aside className="w-full lg:w-[360px] shrink-0">
              <div className="lg:sticky lg:top-36 space-y-6">
                {/* Price + CTA Card */}
                <div className="bg-white rounded-xl border border-brand-border p-6 shadow-sm">
                  <div className="text-center mb-5">
                    <p className="text-sm text-gray-500 mb-1">A partir de</p>
                    <p className="font-display text-4xl font-bold text-brand-text">
                      {formation.prixNum} <span className="text-xl">&euro;</span>
                    </p>
                    {formation.eligibleCPF && (
                      <p className="text-xs text-indigo-600 font-medium mt-1">
                        Eligible au CPF
                      </p>
                    )}
                  </div>

                  <Link
                    href={liveSessions?.[0] ? `/reserver/${liveSessions[0].id}/donnees` : `/recherche?q=${encodeURIComponent(formation.title)}`}
                    className="w-full flex items-center justify-center gap-2 bg-red-600 text-white py-3.5 rounded-lg font-semibold text-base hover:bg-red-700 transition-colors mb-3"
                  >
                    Réserver ce stage
                    <FontAwesomeIcon icon={faArrowRight} className="text-sm" />
                  </Link>

                  <Link
                    href="/contact"
                    className="w-full flex items-center justify-center gap-2 border-2 border-brand-border text-gray-600 py-3 rounded-lg font-medium text-sm hover:border-brand-accent hover:text-brand-accent transition-colors"
                  >
                    <FontAwesomeIcon icon={faPhone} className="text-sm" />
                    Nous contacter
                  </Link>

                  <div className="flex items-center justify-center gap-4 mt-5 pt-4 border-t border-brand-border">
                    <div className="flex items-center gap-1.5 text-xs text-gray-500">
                      <FontAwesomeIcon icon={faShieldHalved} className="text-emerald-500" />
                      Paiement securise
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-gray-500">
                      <FontAwesomeIcon icon={faAward} className="text-blue-500" />
                      Centre agree
                    </div>
                  </div>
                </div>

                {/* Infos pratiques */}
                <div className="bg-white rounded-xl border border-brand-border p-6">
                  <h3 className="font-display font-semibold text-brand-text mb-4 flex items-center gap-2">
                    <FontAwesomeIcon icon={faCircleInfo} className="text-brand-accent" />
                    Infos pratiques
                  </h3>
                  <ul className="space-y-3">
                    {formation.infosPratiques.map((info, idx) => (
                      <li key={idx} className="flex items-start gap-2.5 text-sm text-gray-600">
                        <FontAwesomeIcon icon={faCheck} className="text-emerald-500 text-xs mt-1 shrink-0" />
                        <span>{info}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Documents a apporter */}
                <div className="bg-white rounded-xl border border-brand-border p-6">
                  <h3 className="font-display font-semibold text-brand-text mb-4 flex items-center gap-2">
                    <FontAwesomeIcon icon={faFileLines} className="text-brand-accent" />
                    Documents a apporter
                  </h3>
                  <ul className="space-y-3">
                    {formation.documentsApporter.map((doc, idx) => (
                      <li key={idx} className="flex items-start gap-2.5 text-sm text-gray-600">
                        <FontAwesomeIcon icon={faCertificate} className="text-amber-500 text-xs mt-1 shrink-0" />
                        <span>{doc}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Horaires */}
                <div className="bg-white rounded-xl border border-brand-border p-6">
                  <h3 className="font-display font-semibold text-brand-text mb-3 flex items-center gap-2">
                    <FontAwesomeIcon icon={faClock} className="text-brand-accent" />
                    Horaires
                  </h3>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    {formation.horaires}
                  </p>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
