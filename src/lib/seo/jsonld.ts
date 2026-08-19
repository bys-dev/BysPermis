/**
 * Helpers JSON-LD (schema.org) pour le SEO de BYS Formation.
 *
 * Chaque fonction renvoie un objet sérialisable à injecter via
 * <JsonLd data={...} /> ou <script type="application/ld+json">.
 *
 * Référence : https://schema.org/Course, /LocalBusiness, /FAQPage, /BreadcrumbList
 */

const BASE_URL =
  process.env.NEXT_PUBLIC_APP_URL ?? "https://byspermis.fr";

const ORG_NAME = "BYS Formation";
const ORG_LEGAL = "BYS Formation"; // À ajuster une fois la raison sociale exacte fournie par le client
const ORG_LOGO = `${BASE_URL}/colored-logo.png`;

// ─── Organization ──────────────────────────────────────────────────

export function organizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${BASE_URL}/#organization`,
    name: ORG_NAME,
    legalName: ORG_LEGAL,
    url: BASE_URL,
    logo: ORG_LOGO,
    sameAs: [
      // À remplir quand les comptes seront fournis
      // "https://www.facebook.com/bysformation",
      // "https://www.linkedin.com/company/bysformation",
    ],
    description:
      "Place de marché des stages de sensibilisation à la sécurité routière (stages de récupération de points) organisés par des centres agréés par les préfectures françaises.",
    areaServed: { "@type": "Country", name: "France" },
    knowsAbout: [
      "Stage de récupération de points",
      "Stage de sensibilisation à la sécurité routière",
      "Permis à points",
      "Lettre 48N",
      "Lettre 48SI",
      "Permis probatoire",
      "Code de la route",
    ],
    contactPoint: [
      {
        "@type": "ContactPoint",
        contactType: "customer support",
        email: "contact@byspermis.fr",
        availableLanguage: ["French"],
        areaServed: "FR",
      },
    ],
  };
}

// ─── WebSite (sitelinks search box) ────────────────────────────────

export function websiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${BASE_URL}/#website`,
    url: BASE_URL,
    name: ORG_NAME,
    inLanguage: "fr-FR",
    publisher: { "@id": `${BASE_URL}/#organization` },
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${BASE_URL}/recherche?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };
}

// ─── Breadcrumb ────────────────────────────────────────────────────

export interface BreadcrumbItem {
  name: string;
  url: string;
}

export function breadcrumbJsonLd(items: BreadcrumbItem[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url.startsWith("http") ? item.url : `${BASE_URL}${item.url}`,
    })),
  };
}

// ─── FAQ ───────────────────────────────────────────────────────────

export interface FaqEntry {
  question: string;
  answer: string;
}

export function faqJsonLd(entries: FaqEntry[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: entries.map((e) => ({
      "@type": "Question",
      name: e.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: e.answer,
      },
    })),
  };
}

// ─── Course (fiche formation) ──────────────────────────────────────

export interface CourseJsonLdInput {
  title: string;
  description: string;
  slug: string;
  price: number;
  centreName: string;
  centreCity?: string;
  durationISO?: string; // ex: "P2D" pour 2 jours
  sessions?: Array<{
    startDate: string;
    endDate: string;
    placesRestantes: number;
    ville?: string;
  }>;
  rating?: { value: number; count: number };
}

export function courseJsonLd(input: CourseJsonLdInput) {
  const hasOfferableSessions = input.sessions && input.sessions.length > 0;

  return {
    "@context": "https://schema.org",
    "@type": "Course",
    name: input.title,
    description: input.description,
    url: `${BASE_URL}/formations/${input.slug}`,
    provider: {
      "@type": "Organization",
      name: input.centreName,
      sameAs: `${BASE_URL}/centres/${slugify(input.centreName)}`,
    },
    inLanguage: "fr-FR",
    educationalLevel: "Adulte",
    courseMode: "onsite",
    timeRequired: input.durationISO ?? "P2D",
    offers: {
      "@type": "Offer",
      price: input.price,
      priceCurrency: "EUR",
      availability: hasOfferableSessions
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
      url: `${BASE_URL}/formations/${input.slug}`,
      validFrom: new Date().toISOString(),
    },
    hasCourseInstance: (input.sessions ?? []).map((s) => ({
      "@type": "CourseInstance",
      courseMode: "onsite",
      startDate: s.startDate,
      endDate: s.endDate,
      location: {
        "@type": "Place",
        name: input.centreName,
        address: {
          "@type": "PostalAddress",
          addressLocality: s.ville ?? input.centreCity,
          addressCountry: "FR",
        },
      },
    })),
    ...(input.rating && input.rating.count > 0
      ? {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: input.rating.value,
            reviewCount: input.rating.count,
            bestRating: 5,
            worstRating: 1,
          },
        }
      : {}),
  };
}

// ─── LocalBusiness (centre partenaire) ─────────────────────────────

export interface LocalBusinessInput {
  name: string;
  slug: string;
  description?: string;
  address: string;
  postalCode: string;
  city: string;
  phone?: string;
  email?: string;
  latitude?: number;
  longitude?: number;
  image?: string;
  rating?: { value: number; count: number };
}

export function localBusinessJsonLd(input: LocalBusinessInput) {
  return {
    "@context": "https://schema.org",
    "@type": ["LocalBusiness", "EducationalOrganization"],
    "@id": `${BASE_URL}/centres/${input.slug}#business`,
    name: input.name,
    description: input.description,
    url: `${BASE_URL}/centres/${input.slug}`,
    telephone: input.phone,
    email: input.email,
    image: input.image,
    address: {
      "@type": "PostalAddress",
      streetAddress: input.address,
      postalCode: input.postalCode,
      addressLocality: input.city,
      addressCountry: "FR",
    },
    ...(input.latitude && input.longitude
      ? {
          geo: {
            "@type": "GeoCoordinates",
            latitude: input.latitude,
            longitude: input.longitude,
          },
        }
      : {}),
    ...(input.rating && input.rating.count > 0
      ? {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: input.rating.value,
            reviewCount: input.rating.count,
            bestRating: 5,
            worstRating: 1,
          },
        }
      : {}),
  };
}

// ─── Service (page ville / page d'accueil) ─────────────────────────

export interface ServiceJsonLdInput {
  city?: string;
  /** Département servi (page /stages/departement/[dept]). */
  departement?: { code: string; nom: string };
  geo?: { lat: number; lng: number; rayonKm?: number };
  averagePrice?: { min: number; max: number; count?: number };
  url?: string;
}

export function serviceJsonLd(input: ServiceJsonLdInput = {}) {
  const areaServed = input.city
    ? { "@type": "City", name: input.city }
    : input.departement
      ? { "@type": "AdministrativeArea", name: `${input.departement.nom} (${input.departement.code})` }
      : { "@type": "Country", name: "France" };

  return {
    "@context": "https://schema.org",
    "@type": "Service",
    serviceType: "Stage de récupération de points du permis de conduire",
    ...(input.url ? { url: input.url } : {}),
    provider: { "@id": `${BASE_URL}/#organization` },
    areaServed,
    ...(input.geo
      ? {
          serviceArea: {
            "@type": "GeoCircle",
            geoMidpoint: {
              "@type": "GeoCoordinates",
              latitude: input.geo.lat,
              longitude: input.geo.lng,
            },
            geoRadius: (input.geo.rayonKm ?? 50) * 1000,
          },
        }
      : {}),
    description:
      "Stage de sensibilisation à la sécurité routière agréé par la préfecture, permettant de récupérer jusqu'à 4 points sur le permis de conduire en 2 jours.",
    ...(input.averagePrice
      ? {
          offers: {
            "@type": "AggregateOffer",
            priceCurrency: "EUR",
            lowPrice: input.averagePrice.min,
            highPrice: input.averagePrice.max,
            offerCount: input.averagePrice.count ?? 1,
          },
        }
      : {}),
  };
}

// ─── HowTo (parcours de récupération de points) ────────────────────

export interface HowToStep {
  name: string;
  text: string;
  url?: string;
}

export function howToJsonLd(input: {
  name: string;
  description: string;
  steps: HowToStep[];
  totalTimeISO?: string;
  estimatedCost?: { min: number; max: number };
}) {
  return {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: input.name,
    description: input.description,
    inLanguage: "fr-FR",
    totalTime: input.totalTimeISO ?? "P2D",
    ...(input.estimatedCost
      ? {
          estimatedCost: {
            "@type": "MonetaryAmount",
            currency: "EUR",
            minValue: input.estimatedCost.min,
            maxValue: input.estimatedCost.max,
          },
        }
      : {}),
    supply: [
      { "@type": "HowToSupply", name: "Permis de conduire original" },
      { "@type": "HowToSupply", name: "Pièce d'identité en cours de validité" },
      { "@type": "HowToSupply", name: "Convocation reçue par e-mail" },
    ],
    step: input.steps.map((s, i) => ({
      "@type": "HowToStep",
      position: i + 1,
      name: s.name,
      text: s.text,
      ...(s.url ? { url: s.url.startsWith("http") ? s.url : `${BASE_URL}${s.url}` } : {}),
    })),
  };
}

// ─── ItemList (pages de listing : villes, départements, centres) ───

export interface ItemListEntry {
  name: string;
  url: string;
  description?: string;
}

export function itemListJsonLd(input: { name: string; items: ItemListEntry[] }) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: input.name,
    numberOfItems: input.items.length,
    itemListOrder: "https://schema.org/ItemListOrderAscending",
    itemListElement: input.items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      url: item.url.startsWith("http") ? item.url : `${BASE_URL}${item.url}`,
      ...(item.description ? { description: item.description } : {}),
    })),
  };
}

// ─── WebPage (ancrage entité + extraits pour moteurs génératifs) ───

/**
 * Déclare explicitement le sujet de la page et la date de dernière mise à
 * jour. C'est ce qui permet aux moteurs de réponse (AI Overviews, Perplexity,
 * ChatGPT Search) de rattacher la page à une entité connue plutôt que de
 * deviner à partir du seul texte, et de juger sa fraîcheur.
 */
export function webPageJsonLd(input: {
  name: string;
  description: string;
  path: string;
  dateModifiedISO?: string;
  /** Entités Wikipédia/Wikidata décrivant le sujet. */
  aboutUrls?: string[];
  primaryTopic?: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "@id": `${BASE_URL}${input.path}#webpage`,
    url: `${BASE_URL}${input.path}`,
    name: input.name,
    description: input.description,
    inLanguage: "fr-FR",
    isPartOf: { "@id": `${BASE_URL}/#website` },
    ...(input.dateModifiedISO ? { dateModified: input.dateModifiedISO } : {}),
    about: {
      "@type": "Thing",
      name: input.primaryTopic ?? "Stage de récupération de points du permis de conduire",
      sameAs: input.aboutUrls ?? [
        "https://fr.wikipedia.org/wiki/Permis_%C3%A0_points_en_France",
        "https://www.service-public.fr/particuliers/vosdroits/F14208",
      ],
    },
    publisher: { "@id": `${BASE_URL}/#organization` },
  };
}

// ─── QAPage (contenu explicitement citable) ────────────────────────

/**
 * Une question unique avec sa réponse de référence. Complémentaire de
 * `faqJsonLd` : les moteurs génératifs privilégient les réponses courtes,
 * datées et attribuables à une source identifiée.
 */
export function qaPageJsonLd(input: {
  question: string;
  answer: string;
  path: string;
  dateISO: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "QAPage",
    mainEntity: {
      "@type": "Question",
      name: input.question,
      text: input.question,
      answerCount: 1,
      dateCreated: input.dateISO,
      author: { "@id": `${BASE_URL}/#organization` },
      acceptedAnswer: {
        "@type": "Answer",
        text: input.answer,
        url: `${BASE_URL}${input.path}`,
        dateCreated: input.dateISO,
        author: { "@id": `${BASE_URL}/#organization` },
      },
    },
  };
}

// ─── Article (blog) ────────────────────────────────────────────────

export interface ArticleJsonLdInput {
  title: string;
  slug: string;
  description: string;
  image?: string | null;
  publishedAtISO: string;
  authorName?: string;
}

export function articleJsonLd(input: ArticleJsonLdInput) {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `${BASE_URL}/blog/${input.slug}`,
    },
    headline: input.title,
    description: input.description,
    image: input.image ? [input.image] : undefined,
    datePublished: input.publishedAtISO,
    dateModified: input.publishedAtISO,
    author: input.authorName
      ? { "@type": "Person", name: input.authorName }
      : { "@type": "Organization", name: ORG_NAME },
    publisher: {
      "@id": `${BASE_URL}/#organization`,
    },
  };
}

// ─── Utils ─────────────────────────────────────────────────────────

function slugify(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}
