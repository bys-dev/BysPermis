import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faLocationDot,
  faCalendarDays,
  faShieldHalved,
  faAward,
  faArrowRight,
  faMagnifyingGlass,
  faClock,
  faEuroSign,
} from "@fortawesome/free-solid-svg-icons";

interface Props {
  params: Promise<{ ville: string }>;
}

function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { ville } = await params;
  const villeDecoded = capitalize(decodeURIComponent(ville));

  return {
    title: `Stages permis à ${villeDecoded} — Récupération de points, FIMO, FCO`,
    description: `Trouvez et réservez votre stage de récupération de points à ${villeDecoded}. Comparez les centres agréés, les prix et les dates disponibles. Réservation en ligne sécurisée.`,
    keywords: [
      `stage récupération points ${villeDecoded}`,
      `permis ${villeDecoded}`,
      `auto-école ${villeDecoded}`,
      `formation FIMO ${villeDecoded}`,
      `stage permis ${villeDecoded}`,
    ],
    openGraph: {
      title: `Stages permis à ${villeDecoded}`,
      description: `Comparez les centres agréés et réservez votre stage à ${villeDecoded}.`,
      type: "website",
      locale: "fr_FR",
      siteName: "BYS Formation",
    },
  };
}

interface FormationResult {
  id: string;
  titre: string;
  slug: string;
  description: string;
  prix: number;
  duree: string;
  isQualiopi: boolean;
  isCPF: boolean;
  modalite: string;
  centre: {
    nom: string;
    ville: string;
    slug: string;
  };
  sessions: {
    id: string;
    dateDebut: string;
    dateFin: string;
    placesRestantes: number;
  }[];
}

export default async function StagesVillePage({ params }: Props) {
  const { ville } = await params;
  const villeDecoded = capitalize(decodeURIComponent(ville));

  let formations: FormationResult[] = [];
  try {
    formations = (await prisma.formation.findMany({
      where: {
        isActive: true,
        centre: {
          isActive: true,
          statut: "ACTIF",
          ville: { equals: villeDecoded, mode: "insensitive" },
        },
      },
      include: {
        centre: { select: { nom: true, ville: true, slug: true } },
        sessions: {
          where: { status: "ACTIVE", dateDebut: { gte: new Date() } },
          orderBy: { dateDebut: "asc" },
          take: 3,
          select: { id: true, dateDebut: true, dateFin: true, placesRestantes: true },
        },
      },
      orderBy: { prix: "asc" },
    })) as unknown as FormationResult[];
  } catch {
    // DB might not be available
  }

  return (
    <>
      <Header />
      <main className="min-h-screen bg-brand-bg">
        {/* Hero */}
        <section className="bg-[#0A1628] text-white py-16">
          <div className="max-w-7xl mx-auto px-6">
            <div className="flex items-center gap-2 text-sm text-gray-400 mb-4">
              <Link href="/" className="hover:text-white transition-colors">Accueil</Link>
              <span>/</span>
              <Link href="/recherche" className="hover:text-white transition-colors">Stages</Link>
              <span>/</span>
              <span className="text-white">{villeDecoded}</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-display font-bold mb-4">
              Stages permis à {villeDecoded}
            </h1>
            <p className="text-gray-400 text-lg max-w-2xl">
              Trouvez et réservez votre stage de récupération de points, formation permis ou FIMO/FCO
              à {villeDecoded}. Tous nos centres sont agréés par la préfecture.
            </p>
            <div className="flex items-center gap-4 mt-6">
              <span className="inline-flex items-center gap-2 text-sm text-blue-400">
                <FontAwesomeIcon icon={faLocationDot} className="text-xs" />
                {villeDecoded}
              </span>
              <span className="text-gray-600">|</span>
              <span className="text-sm text-gray-400">
                {formations.length} formation{formations.length > 1 ? "s" : ""} disponible{formations.length > 1 ? "s" : ""}
              </span>
            </div>
          </div>
        </section>

        {/* Formations list */}
        <section className="max-w-7xl mx-auto px-6 py-12">
          {formations.length === 0 ? (
            <div className="text-center py-20">
              <FontAwesomeIcon icon={faMagnifyingGlass} className="text-4xl text-gray-300 mb-4" />
              <h2 className="text-xl font-semibold text-gray-700 mb-2">
                Aucune formation disponible à {villeDecoded}
              </h2>
              <p className="text-gray-500 mb-6">
                Essayez une recherche plus large ou consultez les villes à proximité.
              </p>
              <Link
                href="/recherche"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 transition-colors"
              >
                <FontAwesomeIcon icon={faMagnifyingGlass} className="text-sm" />
                Rechercher partout
              </Link>
            </div>
          ) : (
            <>
              <h2 className="text-2xl font-display font-bold text-gray-900 mb-8">
                {formations.length} formation{formations.length > 1 ? "s" : ""} à {villeDecoded}
              </h2>
              <div className="grid gap-6">
                {formations.map((f) => (
                  <div
                    key={f.id}
                    className="bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow p-6"
                  >
                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-2">
                          {f.isQualiopi && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] bg-purple-50 text-purple-700 border border-purple-200 font-medium">
                              <FontAwesomeIcon icon={faAward} className="text-[9px]" /> Qualiopi
                            </span>
                          )}
                          {f.isCPF && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] bg-green-50 text-green-700 border border-green-200 font-medium">
                              CPF
                            </span>
                          )}
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] bg-blue-50 text-blue-700 border border-blue-200 font-medium">
                            <FontAwesomeIcon icon={faShieldHalved} className="text-[9px]" /> Agréé Préfecture
                          </span>
                        </div>

                        <Link href={`/formations/${f.slug}`} className="hover:text-blue-600 transition-colors">
                          <h3 className="text-lg font-semibold text-gray-900 mb-1">{f.titre}</h3>
                        </Link>
                        <p className="text-sm text-gray-500 mb-3">
                          {f.centre.nom} — {f.centre.ville}
                        </p>
                        <p className="text-sm text-gray-600 line-clamp-2">{f.description}</p>

                        <div className="flex items-center gap-4 mt-3 text-sm text-gray-500">
                          <span className="flex items-center gap-1.5">
                            <FontAwesomeIcon icon={faClock} className="text-xs text-gray-400" />
                            {f.duree}
                          </span>
                          <span className="flex items-center gap-1.5">
                            <FontAwesomeIcon icon={faEuroSign} className="text-xs text-gray-400" />
                            À partir de {f.prix} €
                          </span>
                        </div>

                        {/* Prochaines sessions */}
                        {f.sessions.length > 0 && (
                          <div className="mt-4 flex flex-wrap gap-2">
                            {f.sessions.map((sess) => (
                              <Link
                                key={sess.id}
                                href={`/reserver/${sess.id}`}
                                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium bg-gray-50 border border-gray-200 text-gray-700 hover:bg-blue-50 hover:border-blue-200 hover:text-blue-700 transition-all"
                              >
                                <FontAwesomeIcon icon={faCalendarDays} className="text-[10px]" />
                                {new Date(sess.dateDebut).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}
                                {sess.placesRestantes <= 3 && (
                                  <span className="text-red-500 font-semibold">
                                    {sess.placesRestantes} place{sess.placesRestantes > 1 ? "s" : ""}
                                  </span>
                                )}
                              </Link>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="shrink-0 flex flex-col items-end gap-3">
                        <div className="text-right">
                          <p className="text-2xl font-bold text-gray-900">{f.prix} €</p>
                          <p className="text-xs text-gray-500">TVA incluse</p>
                        </div>
                        <Link
                          href={`/formations/${f.slug}`}
                          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-700 transition-colors"
                        >
                          Voir les dates
                          <FontAwesomeIcon icon={faArrowRight} className="text-xs" />
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </section>

        {/* SEO content */}
        <section className="max-w-7xl mx-auto px-6 pb-16">
          <div className="bg-gray-50 rounded-2xl p-8 border border-gray-200">
            <h2 className="text-xl font-display font-bold text-gray-900 mb-4">
              Stages de récupération de points à {villeDecoded}
            </h2>
            <div className="prose prose-sm text-gray-600 max-w-none">
              <p>
                BYS Formation vous permet de trouver et réserver facilement votre stage de
                récupération de points à {villeDecoded}. Tous nos centres partenaires sont
                agréés par la préfecture et dispensent des formations conformes à la
                réglementation en vigueur.
              </p>
              <p>
                Un stage de récupération de points dure 2 jours consécutifs et permet de
                récupérer jusqu&apos;à 4 points sur votre permis de conduire. Les points sont
                crédités le lendemain du dernier jour de stage.
              </p>
              <p>
                En plus des stages de récupération de points, nos centres à {villeDecoded}{" "}
                proposent également des formations au permis B, des formations FIMO et FCO
                pour les professionnels du transport, ainsi que des stages de sensibilisation
                à la sécurité routière.
              </p>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
