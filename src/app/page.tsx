import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { CentresProximite } from "@/components/marketplace/CentresProximite";
import HeroSearchForm from "@/components/marketplace/HeroSearchForm";
import HomeFaq from "@/components/marketplace/HomeFaq";
import JsonLd from "@/components/seo/JsonLd";
import { serviceJsonLd } from "@/lib/seo/jsonld";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faMagnifyingGlass,
  faShieldHalved,
  faIdCard,
  faGavel,
  faBalanceScale,
  faArrowRight,
  faCircleCheck,
  faBuilding,
  faLock,
  faUsers,
  faCalendarCheck,
  faEnvelopeOpenText,
  faAward,
  faCreditCard,
  faUserShield,
  faClock,
  faMapMarkerAlt,
  faCheck,
  faXmark,
  faStar,
  faClipboardList,
  faBolt,
} from "@fortawesome/free-solid-svg-icons";
import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import { prisma } from "@/lib/prisma";

// ISR — la home se régénère toutes les heures
export const revalidate = 3600;

export const metadata: Metadata = {
  title: "BYS Formation Permis — Stages récupération de points & formations permis",
  description:
    "Comparez et réservez votre stage de récupération de points près de chez vous. 150+ centres agréés préfecture, convocation immédiate, paiement sécurisé.",
  alternates: { canonical: "/" },
  openGraph: {
    title: "BYS Formation Permis — Marketplace de stages permis",
    description:
      "Récupérez jusqu'à 4 points en 2 jours dans un centre agréé près de chez vous.",
    url: "/",
    type: "website",
    locale: "fr_FR",
    siteName: "BYS Formation Permis",
  },
};

// ─── DATA ────────────────────────────────────────────────

interface StageType {
  name: string;
  subtitle: string;
  desc: string;
  icon: IconDefinition;
  badge: string;
  badgeStyle: string;
  price: string;
  slug: string;
}

const stageTypes: StageType[] = [
  {
    name: "Stage volontaire",
    subtitle: "Récupération de points",
    desc: "Après une infraction, récupérez 4 points sur votre permis. Possibilité de faire un stage 1 fois par an maximum.",
    icon: faShieldHalved,
    badge: "+4 points",
    badgeStyle: "bg-red-50 text-red-600 font-bold",
    price: "À partir de 200 €",
    slug: "recuperation-de-points",
  },
  {
    name: "Stage 48N",
    subtitle: "Permis probatoire",
    desc: "Lettre 48N reçue ? Vous avez 4 mois pour effectuer ce stage obligatoire et récupérer 4 points.",
    icon: faIdCard,
    badge: "Obligatoire",
    badgeStyle: "bg-red-50 text-red-600 font-bold",
    price: "À partir de 200 €",
    slug: "sensibilisation-securite-routiere",
  },
  {
    name: "Composition pénale",
    subtitle: "Alternative aux poursuites",
    desc: "Stage proposé par le Procureur de la République comme alternative aux poursuites judiciaires.",
    icon: faGavel,
    badge: "0 point récupéré",
    badgeStyle: "bg-gray-100 text-gray-500",
    price: "À partir de 250 €",
    slug: "recuperation-de-points",
  },
  {
    name: "Peine complémentaire",
    subtitle: "Décision de justice",
    desc: "Stage ordonné par un tribunal en complément d'une condamnation. Aucun point n'est restitué.",
    icon: faBalanceScale,
    badge: "0 point récupéré",
    badgeStyle: "bg-gray-100 text-gray-500",
    price: "À partir de 250 €",
    slug: "recuperation-de-points",
  },
];

const canDoStage = [
  "Votre permis est valide (pas de lettre 48SI reçue)",
  "Vous n'avez pas fait de stage depuis 12 mois",
  "Vous avez perdu au moins 1 point",
  "Votre permis est suspendu (le stage reste possible)",
  "Vous habitez un autre département que le centre",
];

const cannotDoStage = [
  "Vous avez reçu la lettre 48SI (permis invalidé)",
  "Stage effectué il y a moins de 12 mois",
  "Permis annulé par décision judiciaire",
];

const steps = [
  {
    number: "1",
    title: "Recherchez",
    desc: "Trouvez un stage agréé préfecture près de chez vous parmi 150+ centres en France",
    icon: faMagnifyingGlass,
  },
  {
    number: "2",
    title: "Réservez",
    desc: "Choisissez votre date, payez en ligne de manière sécurisée",
    icon: faCalendarCheck,
  },
  {
    number: "3",
    title: "Recevez votre convocation",
    desc: "Convocation officielle envoyée par email en 5 minutes",
    icon: faEnvelopeOpenText,
  },
  {
    number: "4",
    title: "Récupérez vos points",
    desc: "Participez au stage 2 jours et récupérez jusqu'à 4 points (crédités le lendemain)",
    icon: faAward,
  },
];

const stageProgram = [
  {
    day: "Jour 1",
    title: "Bilan et sensibilisation",
    items: [
      "Accueil des participants et présentation",
      "Bilan personnel : analyse de vos infractions",
      "Étude des accidents de la route (statistiques)",
      "Vitesse, alcool, drogues : comprendre les risques",
      "Exercices interactifs en groupe",
    ],
  },
  {
    day: "Jour 2",
    title: "Conduite sécurisée",
    items: [
      "Règles de circulation et signalisation",
      "Fatigue au volant : la détecter, l'éviter",
      "Distances de sécurité et freinage d'urgence",
      "Mises en situation et études de cas",
      "Remise de l'attestation de stage",
    ],
  },
];

interface FeaturedCourse {
  title: string;
  desc: string;
  tag: string;
  duration: string;
  modality: string;
  centre: string;
  price: string;
  places: number;
  icon: IconDefinition;
}

const featuredCourses: FeaturedCourse[] = [
  {
    title: "Stage récupération de points — Osny",
    desc: "Stage agréé préfecture du Val-d'Oise. Récupérez jusqu'à 4 points sur votre permis en 2 jours, encadré par un psychologue et un expert sécurité routière.",
    tag: "Récupération de points",
    duration: "2 jours",
    modality: "Présentiel",
    centre: "BYS Formation Osny",
    price: "250 €",
    places: 8,
    icon: faShieldHalved,
  },
  {
    title: "Stage récupération de points — Paris 11",
    desc: "Stage agréé préfecture de Paris au cœur du 11ème arrondissement. Sessions garanties chaque semaine, formateurs BAFM avec plus de 10 ans d'expérience.",
    tag: "Récupération de points",
    duration: "2 jours",
    modality: "Présentiel",
    centre: "Conduite Plus Paris",
    price: "280 €",
    places: 5,
    icon: faShieldHalved,
  },
  {
    title: "Stage récupération de points — Lyon Part-Dieu",
    desc: "Stage agréé préfecture du Rhône, à deux pas de la gare Part-Dieu. Ambiance bienveillante, accueil café et déjeuner inclus.",
    tag: "Récupération de points",
    duration: "2 jours",
    modality: "Présentiel",
    centre: "CFSR Lyon",
    price: "230 €",
    places: 9,
    icon: faShieldHalved,
  },
];

const cityGroups = [
  {
    region: "Île-de-France",
    cities: ["Paris", "Cergy", "Osny", "Nanterre", "Créteil", "Versailles", "Saint-Denis", "Argenteuil"],
  },
  {
    region: "Grandes villes",
    cities: ["Lyon", "Marseille", "Toulouse", "Nice", "Nantes", "Bordeaux", "Lille", "Strasbourg", "Montpellier", "Rennes"],
  },
];

const trustBadges = [
  {
    icon: faShieldHalved,
    title: "Agréé Ministère de l'Intérieur",
    desc: "Tous nos stages sont agréés par la préfecture",
  },
  {
    icon: faAward,
    title: "Certifié Qualiopi",
    desc: "Certification qualité des organismes de formation",
  },
  {
    icon: faCreditCard,
    title: "Paiement sécurisé Stripe",
    desc: "Transactions cryptées et 100% sécurisées",
  },
  {
    icon: faUserShield,
    title: "Données protégées RGPD",
    desc: "Vos données personnelles sont protégées",
  },
];

const faqItems = [
  {
    question: "Combien de points puis-je récupérer avec un stage ?",
    answer:
      "Un stage de sensibilisation à la sécurité routière permet de récupérer 4 points, crédités le lendemain du 2ème jour de stage (art. R223-8 du Code de la route). Le total de vos points ne peut pas dépasser 12 (ou 6 en permis probatoire).",
  },
  {
    question: "Combien coûte un stage de récupération de points ?",
    answer:
      "Le prix varie entre 200 € et 300 € selon le centre et la région. Sur BYS Formation Permis, vous pouvez comparer les prix de tous les centres agréés près de chez vous pour trouver le meilleur tarif. Attention : les stages ne sont pas remboursés par la Sécurité sociale ni éligibles CPF.",
  },
  {
    question: "Quels documents dois-je apporter le jour du stage ?",
    answer:
      "Vous devez impérativement présenter votre permis de conduire ORIGINAL (pas de copie), une pièce d'identité en cours de validité (carte d'identité ou passeport), et votre convocation reçue par email (imprimée ou sur smartphone).",
  },
  {
    question: "Puis-je faire un stage avec un permis suspendu ?",
    answer:
      "Oui, la suspension administrative ou judiciaire de votre permis ne vous empêche pas de suivre un stage de récupération de points. En revanche, si votre permis est invalidé (lettre 48SI), vous ne pouvez plus faire de stage.",
  },
  {
    question: "À quelle fréquence puis-je faire un stage ?",
    answer:
      "Vous pouvez effectuer un stage volontaire 1 fois par an maximum (délai de 1 an entre la date du dernier stage et le nouveau stage, art. L223-6 du Code de la route). Ce délai s'applique aussi au stage 48N.",
  },
  {
    question: "Comment vérifier mon solde de points ?",
    answer:
      "Rendez-vous sur le site officiel mespoints.permisdeconduire.gouv.fr et connectez-vous avec France Connect. Vous obtiendrez un relevé intégral d'information qui indique votre solde exact et l'historique de vos infractions.",
  },
];

const keyStats = [
  { value: "4", label: "points récupérés", icon: faStar },
  { value: "2", label: "jours de stage", icon: faCalendarCheck },
  { value: "150+", label: "centres agréés", icon: faMapMarkerAlt },
  { value: "5 min", label: "convocation email", icon: faBolt },
];

// ─── HELPERS ─────────────────────────────────────────────

function citySlug(city: string): string {
  return city
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/\s+/g, "-");
}

function iconForCategorie(nom: string): IconDefinition {
  if (nom.includes("point") || nom.includes("sensib") || nom.includes("48")) return faShieldHalved;
  return faClipboardList;
}

interface LiveFormation {
  id: string;
  titre: string;
  slug: string;
  prix: number;
  duree: string;
  modalite: string;
  isQualiopi: boolean;
  categorie: { nom: string } | null;
  centre: { nom: string; ville: string; logo: string | null };
  sessions: { placesRestantes: number }[];
}

async function fetchLiveFormations(): Promise<LiveFormation[]> {
  try {
    const formations = await prisma.formation.findMany({
      where: {
        isActive: true,
        modalite: "PRESENTIEL",
        centre: { isActive: true, statut: "ACTIF" },
        // Scope V1 : uniquement les stages de récupération de points (Ministère de l'Intérieur).
        OR: [
          { categorie: { nom: { contains: "récup", mode: "insensitive" } } },
          { categorie: { nom: { contains: "sensib", mode: "insensitive" } } },
          { categorie: { nom: { contains: "48", mode: "insensitive" } } },
          { categorie: { nom: { contains: "probatoire", mode: "insensitive" } } },
          { titre: { contains: "récupération de points", mode: "insensitive" } },
          { titre: { contains: "stage 48", mode: "insensitive" } },
        ],
      },
      include: {
        categorie: { select: { nom: true } },
        centre: { select: { nom: true, ville: true, logo: true } },
        sessions: {
          where: { status: "ACTIVE", dateDebut: { gte: new Date() } },
          orderBy: { dateDebut: "asc" },
          take: 1,
          select: { placesRestantes: true },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 3,
    });
    return formations as unknown as LiveFormation[];
  } catch {
    return [];
  }
}

// ─── PAGE ────────────────────────────────────────────────

export default async function Home() {
  const liveCourses = await fetchLiveFormations();

  const courses =
    liveCourses.length > 0
      ? liveCourses.map((f) => ({
          id: f.id,
          title: f.titre,
          slug: f.slug,
          desc: "",
          tag: f.categorie?.nom ?? "Formation",
          duration: f.duree,
          modality:
            f.modalite === "PRESENTIEL"
              ? "Présentiel"
              : f.modalite === "DISTANCIEL"
                ? "Distanciel"
                : "Hybride",
          centre: f.centre.nom,
          centreLogo: f.centre.logo,
          ville: f.centre.ville,
          price: `${f.prix} €`,
          places: f.sessions[0]?.placesRestantes ?? 0,
          icon: iconForCategorie(f.categorie?.nom ?? ""),
        }))
      : featuredCourses.map((c) => ({
          ...c,
          id: c.title,
          slug: "",
          centreLogo: null as string | null,
          ville: "Île-de-France",
        }));

  return (
    <>
      <JsonLd
        id="ld-home-service"
        data={serviceJsonLd({ averagePrice: { min: 200, max: 280 } })}
      />
      <Header />
      <main>
        {/* ═══ 1. HERO ═══ */}
        <section className="relative bg-navy-900 pt-12 sm:pt-20 pb-16 sm:pb-24 px-4 sm:px-8 min-h-[520px] sm:min-h-[720px] flex items-center overflow-hidden">
          <div className="absolute inset-0 z-0" aria-hidden="true">
            <Image
              src="/hero-radar-permis.jpg"
              alt=""
              fill
              priority
              sizes="100vw"
              className="object-cover scale-105 opacity-35"
            />
            <div className="absolute inset-0 bg-navy-900/75" />
          </div>

          <div className="max-w-[1440px] mx-auto w-full relative z-10">
            <div className="flex flex-col items-center">
              <div className="max-w-4xl mx-auto text-center flex-1 w-full">
                <div className="rounded-2xl bg-navy-900/95 border border-white/15 px-5 py-8 sm:px-10 sm:py-10 mb-6 sm:mb-8">
                  <div className="inline-flex items-center px-3 sm:px-4 py-2 bg-white/10 border border-white/20 rounded-full mb-5 sm:mb-6 max-w-full">
                    <span className="inline-flex mr-2 rounded overflow-hidden shrink-0">
                      <span className="w-1.5 h-4 bg-blue-500" />
                      <span className="w-1.5 h-4 bg-white" />
                      <span className="w-1.5 h-4 bg-red-500" />
                    </span>
                    <span className="text-xs sm:text-sm font-semibold text-white truncate">
                      Agréé Ministère de l&apos;Intérieur — Stages agréés préfecture 🇫🇷
                    </span>
                  </div>

                  <h1 className="font-display font-bold text-3xl sm:text-5xl lg:text-[3.25rem] text-white mb-5 leading-tight tracking-tight">
                    Récupérez vos <span className="text-red-300">points</span> près de chez vous
                    <br className="hidden sm:block" /> au meilleur prix
                  </h1>

                  <p className="text-base sm:text-lg text-white leading-relaxed max-w-3xl mx-auto">
                    Stage agréé préfecture — Récupérez jusqu&apos;à 4 points en 2 jours.
                    Convocation immédiate par email. Plus de 150 centres partenaires en France.
                  </p>
                </div>

                <HeroSearchForm />

                <div className="mt-8 rounded-xl bg-navy-900/90 border border-white/10 px-4 py-4 sm:px-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-3 text-sm font-medium text-white">
                  <span className="flex items-center gap-2">
                    <svg className="inline-block w-5 h-3.5 rounded-sm overflow-hidden shrink-0" viewBox="0 0 30 20">
                      <rect width="10" height="20" x="0" fill="#002395" />
                      <rect width="10" height="20" x="10" fill="#FFFFFF" />
                      <rect width="10" height="20" x="20" fill="#ED2939" />
                    </svg>
                    Agréé Préfecture
                  </span>
                  <span className="hidden sm:inline text-white/30">|</span>
                  <span className="flex items-center gap-2">
                    <FontAwesomeIcon icon={faAward} className="text-blue-300 shrink-0" />
                    Certifié Qualiopi
                  </span>
                  <span className="hidden sm:inline text-white/30">|</span>
                  <span className="flex items-center gap-2">
                    <FontAwesomeIcon icon={faMapMarkerAlt} className="text-blue-300 shrink-0" />
                    +150 centres en France
                  </span>
                  <span className="hidden sm:inline text-white/30">|</span>
                  <span className="flex items-center gap-2">
                    <FontAwesomeIcon icon={faEnvelopeOpenText} className="text-blue-300 shrink-0" />
                    Convocation immédiate
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ═══ 2. KEY NUMBERS BAR ═══ */}
        <section className="py-6 px-4 sm:px-8 bg-red-600">
          <div className="max-w-[1440px] mx-auto">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-3 gap-y-5 lg:gap-8">
              {keyStats.map((stat) => (
                <div
                  key={stat.label}
                  className="flex flex-col sm:flex-row items-center sm:justify-center text-center sm:text-left gap-1 sm:gap-3 text-white min-w-0"
                >
                  <FontAwesomeIcon
                    icon={stat.icon}
                    className="text-white/80 text-base sm:text-lg shrink-0"
                  />
                  <div className="flex flex-col sm:flex-row sm:items-baseline sm:gap-1.5 min-w-0">
                    <span className="text-xl sm:text-2xl font-display font-bold whitespace-nowrap leading-tight">
                      {stat.value}
                    </span>
                    <span className="text-xs sm:text-sm text-red-100 leading-tight">
                      {stat.label}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ═══ 3. CENTRES À PROXIMITÉ ═══ */}
        <CentresProximite />

        {/* ═══ 4. LES 4 TYPES DE STAGES ═══ */}
        <section className="py-20 px-4 sm:px-8 bg-white">
          <div className="max-w-[1440px] mx-auto">
            <div className="text-center mb-14">
              <h2 className="font-display font-bold text-3xl sm:text-4xl text-brand-text mb-4">
                Quel stage est fait pour vous ?
              </h2>
              <p className="text-lg text-gray-500">4 cas différents selon votre situation</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {stageTypes.map((stage) => (
                <div
                  key={stage.name}
                  className="bg-white rounded-2xl border border-brand-border p-6 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 group flex flex-col"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center group-hover:bg-gradient-to-br group-hover:from-blue-600 group-hover:to-indigo-600 transition-all duration-200">
                      <FontAwesomeIcon
                        icon={stage.icon}
                        className="text-blue-600 text-lg group-hover:text-white transition-colors duration-200"
                      />
                    </div>
                    <span
                      className={`text-xs font-semibold px-2.5 py-1 rounded-full ${stage.badgeStyle}`}
                    >
                      {stage.badge}
                    </span>
                  </div>
                  <h3 className="font-display font-semibold text-lg text-brand-text mb-1">
                    {stage.name}
                  </h3>
                  <p className="text-xs font-medium text-blue-600 mb-3">{stage.subtitle}</p>
                  <p className="text-gray-500 text-sm mb-5 flex-1">{stage.desc}</p>
                  <div className="pt-4 border-t border-brand-border">
                    <p className="text-sm font-semibold text-brand-text mb-3">{stage.price}</p>
                    <Link
                      href={`/formations/${stage.slug}`}
                      className="flex items-center text-sm font-medium text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                    >
                      <span>En savoir plus</span>
                      <FontAwesomeIcon
                        icon={faArrowRight}
                        className="ml-2 group-hover:translate-x-1 transition-transform duration-200"
                      />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ═══ 5. ÉLIGIBILITÉ ═══ */}
        <section className="py-20 px-4 sm:px-8 bg-gray-50">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-14">
              <h2 className="font-display font-bold text-3xl sm:text-4xl text-brand-text mb-4">
                Êtes-vous éligible au stage ?
              </h2>
              <p className="text-lg text-gray-500">
                Vérifiez rapidement votre situation avant de réserver
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-white rounded-2xl border border-brand-border p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center">
                    <FontAwesomeIcon icon={faCheck} className="text-blue-600" />
                  </div>
                  <h3 className="font-display font-semibold text-lg text-brand-text">
                    Vous POUVEZ faire le stage si...
                  </h3>
                </div>
                <ul className="space-y-4">
                  {canDoStage.map((item) => (
                    <li key={item} className="flex items-start gap-3">
                      <FontAwesomeIcon icon={faCheck} className="text-blue-600 mt-1 flex-shrink-0" />
                      <span className="text-gray-600 text-sm">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="bg-white rounded-2xl border border-brand-border p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-red-50 rounded-full flex items-center justify-center">
                    <FontAwesomeIcon icon={faXmark} className="text-red-400" />
                  </div>
                  <h3 className="font-display font-semibold text-lg text-brand-text">
                    Vous NE POUVEZ PAS si...
                  </h3>
                </div>
                <ul className="space-y-4">
                  {cannotDoStage.map((item) => (
                    <li key={item} className="flex items-start gap-3">
                      <FontAwesomeIcon icon={faXmark} className="text-red-400 mt-1 flex-shrink-0" />
                      <span className="text-gray-600 text-sm">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="mt-8 text-center">
              <p className="text-sm text-gray-400">
                Vérifiez votre solde de points sur{" "}
                <a
                  href="https://mespoints.permisdeconduire.gouv.fr"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  mespoints.permisdeconduire.gouv.fr
                </a>{" "}
                — Réf. article L223-6 du Code de la route
              </p>
            </div>
          </div>
        </section>

        {/* ═══ 6. COMMENT ÇA MARCHE ═══ */}
        <section className="py-20 px-4 sm:px-8 bg-white">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-14">
              <h2 className="font-display font-bold text-3xl sm:text-4xl text-brand-text mb-4">
                Comment ça marche ?
              </h2>
              <p className="text-base text-gray-500">Réservez votre stage en 4 étapes simples</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {steps.map((step) => (
                <div key={step.number} className="text-center">
                  <div className="w-14 h-14 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <FontAwesomeIcon icon={step.icon} className="text-white text-lg" />
                  </div>
                  <div className="text-xs font-semibold text-blue-600 mb-2">
                    ÉTAPE {step.number}
                  </div>
                  <h3 className="font-display font-semibold text-lg text-brand-text mb-2">
                    {step.title}
                  </h3>
                  <p className="text-gray-500 text-sm leading-relaxed">{step.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ═══ 7. DÉROULÉ DU STAGE ═══ */}
        <section className="py-20 px-4 sm:px-8 bg-gray-50">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-14">
              <h2 className="font-display font-bold text-3xl sm:text-4xl text-brand-text mb-4">
                Comment se déroule un stage ?
              </h2>
              <p className="text-lg text-gray-500">
                2 jours de sensibilisation à la sécurité routière (14 heures)
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {stageProgram.map((day) => (
                <div
                  key={day.day}
                  className="bg-white rounded-2xl border border-brand-border overflow-hidden"
                >
                  <div className="h-1 bg-gradient-to-r from-blue-600 to-indigo-600" />
                  <div className="p-8">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center">
                        <FontAwesomeIcon icon={faClipboardList} className="text-white text-sm" />
                      </div>
                      <div>
                        <div className="text-xs font-semibold text-blue-600">{day.day}</div>
                        <h3 className="font-display font-semibold text-lg text-brand-text">
                          {day.title}
                        </h3>
                      </div>
                    </div>
                    <ul className="space-y-3">
                      {day.items.map((item) => (
                        <li key={item} className="flex items-start gap-3">
                          <FontAwesomeIcon
                            icon={faCircleCheck}
                            className="text-blue-600 mt-0.5 flex-shrink-0 text-sm"
                          />
                          <span className="text-gray-600 text-sm">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-8 bg-white rounded-2xl border border-brand-border p-6 text-center">
              <p className="text-sm text-gray-500">
                Animé par{" "}
                <span className="font-medium text-brand-text">
                  1 psychologue + 1 formateur BAFM agréés
                </span>{" "}
                • 6 à 20 participants • Pas de contrôle de connaissances
              </p>
            </div>
          </div>
        </section>

        {/* ═══ 8. FORMATIONS VEDETTES ═══ */}
        <section className="py-20 px-4 sm:px-8 bg-white">
          <div className="max-w-[1440px] mx-auto">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-12 gap-4">
              <div>
                <h2 className="font-display font-bold text-3xl sm:text-4xl text-brand-text mb-2">
                  Stages et formations à la une
                </h2>
                <p className="text-lg text-gray-500">
                  Les prochains stages disponibles près de chez vous
                </p>
              </div>
              <Link
                href="/recherche"
                className="flex items-center space-x-2 text-blue-600 font-medium hover:underline"
              >
                <span>Voir tous les stages</span>
                <FontAwesomeIcon icon={faArrowRight} />
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {courses.map((course) => (
                <div
                  key={course.id}
                  className="bg-white rounded-2xl border border-brand-border overflow-hidden hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 group cursor-pointer flex flex-col"
                >
                  <div className="h-1 bg-gradient-to-r from-blue-600 to-indigo-600" />
                  <div className="p-6 flex flex-col flex-1">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0">
                        <FontAwesomeIcon icon={course.icon} className="text-blue-600 text-sm" />
                      </div>
                      <span className="px-3 py-1 bg-blue-50 text-blue-600 text-xs font-medium rounded-full">
                        {course.tag}
                      </span>
                      <span className="px-3 py-1 bg-gray-50 text-gray-500 text-xs font-medium rounded-full flex items-center">
                        <FontAwesomeIcon icon={faClock} className="mr-1 text-[10px]" />
                        {course.duration}
                      </span>
                    </div>

                    <h3 className="font-display font-semibold text-lg text-brand-text mb-2 group-hover:text-blue-600 transition-colors duration-200">
                      {course.title}
                    </h3>
                    {"desc" in course && course.desc && (
                      <p className="text-gray-500 text-sm mb-5 line-clamp-2">{course.desc}</p>
                    )}

                    <div className="flex items-center space-x-2 mb-5">
                      <div className="w-8 h-8 bg-white border border-gray-200 rounded-full flex items-center justify-center overflow-hidden shrink-0">
                        {course.centreLogo ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={course.centreLogo.startsWith("http") ? course.centreLogo : course.centreLogo}
                            alt={course.centre}
                            className="w-full h-full object-contain"
                          />
                        ) : (
                          <Image
                            src="/colored-logo.svg"
                            alt={course.centre}
                            width={32}
                            height={32}
                            className="w-full h-full object-contain p-0.5"
                          />
                        )}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-gray-700">{course.centre}</span>
                        <span className="text-xs text-gray-400 flex items-center">
                          <FontAwesomeIcon icon={faMapMarkerAlt} className="mr-1 text-[10px]" />
                          {course.ville}
                        </span>
                      </div>
                    </div>

                    <div className="mb-5">
                      <div className="flex items-center justify-between text-xs mb-1.5">
                        <span className="flex items-center text-gray-400">
                          <FontAwesomeIcon icon={faUsers} className="mr-1" />
                          {course.places} places restantes
                        </span>
                        <span className="text-gray-400">{course.modality}</span>
                      </div>
                      <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full transition-all duration-500"
                          style={{ width: `${Math.max(100 - (course.places / 15) * 100, 15)}%` }}
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-brand-border mt-auto">
                      <div className="text-2xl font-display font-bold text-brand-text">
                        {course.price}
                      </div>
                      <Link
                        href={course.slug ? `/formations/${course.slug}` : "/recherche"}
                        className="bg-red-600 text-white px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-red-700 transition-all duration-200 flex items-center gap-2 shadow-lg shadow-red-600/20"
                      >
                        Réserver
                        <FontAwesomeIcon icon={faArrowRight} className="text-xs" />
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ═══ 9. VILLES POPULAIRES ═══ */}
        <section className="py-20 px-4 sm:px-8 bg-gray-50">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-14">
              <h2 className="font-display font-bold text-3xl sm:text-4xl text-brand-text mb-4">
                Trouvez un stage près de chez vous
              </h2>
              <p className="text-lg text-gray-500">
                Stages de récupération de points dans toute la France
              </p>
            </div>

            <div className="space-y-10">
              {cityGroups.map((group) => (
                <div key={group.region}>
                  <h3 className="font-display font-semibold text-lg text-brand-text mb-4 flex items-center gap-2">
                    <FontAwesomeIcon icon={faMapMarkerAlt} className="text-blue-600 text-sm" />
                    {group.region}
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {group.cities.map((city) => (
                      <Link
                        key={city}
                        href={`/recherche?ville=${citySlug(city)}`}
                        className="px-4 py-2 bg-white border border-brand-border rounded-full text-sm text-gray-600 hover:text-blue-600 hover:border-blue-600 transition-all duration-200"
                      >
                        {city}
                      </Link>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ═══ 10. ESPACE PRO CTA ═══ */}
        <section className="py-24 px-4 sm:px-8 bg-[#0A1628]">
          <div className="max-w-[1440px] mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
              <div>
                <div className="inline-flex items-center px-4 py-2 bg-white/5 border border-white/10 rounded-full mb-6">
                  <FontAwesomeIcon icon={faBuilding} className="text-blue-300 mr-2" />
                  <span className="text-sm font-medium text-gray-300">
                    Pour les centres de formation
                  </span>
                </div>
                <h2 className="font-display font-bold text-3xl sm:text-5xl text-white mb-6 leading-tight">
                  Vous êtes centre de formation ?{" "}
                  <span className="text-blue-300">Rejoignez le réseau BYS</span>
                </h2>
                <p className="text-xl text-gray-300 mb-8 leading-relaxed">
                  Ouvrez votre boutique en ligne et accédez à des milliers de conducteurs qui
                  cherchent un stage.
                </p>
                <ul className="space-y-4 mb-10">
                  {[
                    "Visibilité accrue sur toute la France",
                    "Gestion simplifiée des inscriptions et convocations",
                    "Paiements sécurisés et virements automatiques",
                    "Dashboard complet avec statistiques en temps réel",
                  ].map((item) => (
                    <li key={item} className="flex items-start">
                      <FontAwesomeIcon icon={faCircleCheck} className="text-blue-300 text-lg mr-3 mt-1" />
                      <span className="text-gray-300">{item}</span>
                    </li>
                  ))}
                </ul>
                <div className="flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-4">
                  <Link
                    href="/inscription"
                    className="bg-red-600 text-white px-8 py-4 rounded-lg font-semibold hover:bg-red-700 transition-all duration-200 shadow-xl shadow-red-600/20"
                  >
                    Devenir partenaire
                  </Link>
                  <Link
                    href="/a-propos"
                    className="border border-white/20 text-gray-300 px-8 py-4 rounded-lg font-semibold hover:bg-white/5 transition-colors duration-200"
                  >
                    En savoir plus
                  </Link>
                </div>
              </div>

              <div className="relative">
                <div className="bg-white/[0.04] backdrop-blur-sm rounded-2xl border border-white/10 p-6 shadow-2xl">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                        <span className="text-white text-xs font-bold">B</span>
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-white">BYS Dashboard</div>
                        <div className="text-xs text-gray-500">Centre de formation</div>
                      </div>
                    </div>
                    <div className="flex gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-full bg-gray-600" />
                      <div className="w-2.5 h-2.5 rounded-full bg-gray-600" />
                      <div className="w-2.5 h-2.5 rounded-full bg-blue-600" />
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-3 mb-5">
                    {[
                      { val: "127", lbl: "Réservations" },
                      { val: "4 850 €", lbl: "Revenus" },
                      { val: "98%", lbl: "Satisfaction" },
                    ].map((s) => (
                      <div
                        key={s.lbl}
                        className="bg-white/[0.06] border border-white/10 rounded-xl p-3 text-center"
                      >
                        <div className="text-lg font-display font-bold text-white">{s.val}</div>
                        <div className="text-[10px] text-gray-500">{s.lbl}</div>
                      </div>
                    ))}
                  </div>
                  <div className="bg-white/[0.04] border border-white/10 rounded-xl p-4 mb-4">
                    <div className="text-xs text-gray-500 mb-3">Réservations (7 derniers jours)</div>
                    <div className="flex items-end gap-2 h-20">
                      {[40, 65, 45, 80, 55, 90, 70].map((h, i) => (
                        <div
                          key={i}
                          className="flex-1 rounded-t"
                          style={{
                            height: `${h}%`,
                            backgroundColor: i === 5 ? "#2563EB" : "rgba(37,99,235,0.2)",
                          }}
                        />
                      ))}
                    </div>
                    <div className="flex justify-between mt-2 text-[10px] text-gray-600">
                      <span>Lun</span>
                      <span>Mar</span>
                      <span>Mer</span>
                      <span>Jeu</span>
                      <span>Ven</span>
                      <span>Sam</span>
                      <span>Dim</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    {[
                      { name: "J. Dupont", status: "Confirmée" },
                      { name: "M. Martin", status: "En attente" },
                    ].map((r) => (
                      <div
                        key={r.name}
                        className="flex items-center justify-between bg-white/[0.04] border border-white/10 rounded-lg px-3 py-2"
                      >
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 bg-blue-600/20 rounded-full flex items-center justify-center">
                            <span className="text-[10px] text-blue-300 font-bold">
                              {r.name.charAt(0)}
                            </span>
                          </div>
                          <span className="text-xs text-gray-300">{r.name}</span>
                        </div>
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full ${r.status === "Confirmée" ? "bg-blue-600/20 text-blue-300" : "bg-white/10 text-gray-400"}`}
                        >
                          {r.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ═══ 11. TRUST BADGES ═══ */}
        <section className="py-8 px-4 sm:px-8 bg-gray-50 border-y border-brand-border">
          <div className="max-w-[1440px] mx-auto">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {trustBadges.map((badge) => (
                <div
                  key={badge.title}
                  className="flex items-center gap-3 justify-center sm:justify-start"
                >
                  <FontAwesomeIcon icon={badge.icon} className="text-blue-600 text-lg flex-shrink-0" />
                  <div>
                    <div className="text-sm font-semibold text-brand-text">{badge.title}</div>
                    <div className="text-xs text-gray-400">{badge.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ═══ 12. FAQ ═══ */}
        <section className="py-24 px-4 sm:px-8 bg-white">
          <div className="max-w-[1440px] mx-auto">
            <div className="text-center mb-16">
              <h2 className="font-display font-bold text-3xl sm:text-4xl text-brand-text mb-4">
                Questions fréquentes
              </h2>
              <p className="text-lg text-gray-500">
                Tout ce que vous devez savoir sur les stages de récupération de points
              </p>
            </div>

            <HomeFaq items={faqItems} />

            <div className="text-center mt-12">
              <p className="text-gray-500 mb-4">
                Vous ne trouvez pas la réponse à votre question ?
              </p>
              <Link href="/faq" className="text-blue-600 font-semibold hover:underline">
                Voir toutes les questions <FontAwesomeIcon icon={faArrowRight} className="ml-2" />
              </Link>
            </div>
          </div>
        </section>

        {/* ═══ 13. NEWSLETTER ═══ */}
        <section className="py-12 px-4 sm:px-8 bg-[#0A1628]">
          <div className="max-w-[1440px] mx-auto">
            <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
              <div className="text-center lg:text-left">
                <h3 className="font-display font-bold text-xl text-white mb-1">
                  Restez informé des prochains stages près de chez vous
                </h3>
                <p className="text-gray-300 text-sm">
                  Recevez les alertes de nouveaux stages et formations dans votre région.
                </p>
              </div>
              <form className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto">
                <input
                  type="email"
                  placeholder="Votre adresse email"
                  className="w-full sm:w-72 px-5 py-3 bg-white/10 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 text-white placeholder-gray-400 transition-all duration-200"
                />
                <button
                  type="submit"
                  className="w-full sm:w-auto bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-blue-600 hover:to-indigo-700 transition-all duration-200 whitespace-nowrap"
                >
                  S&apos;inscrire
                </button>
              </form>
              <p className="text-gray-600 text-xs flex items-center gap-1 lg:hidden">
                <FontAwesomeIcon icon={faLock} />
                Données protégées. Désinscription à tout moment.
              </p>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
