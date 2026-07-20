import Link from "next/link";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faChevronRight,
  faLocationDot,
  faPhone,
  faEnvelope,
  faGlobe,
  faBookOpen,
  faCalendarDays,
  faClock,
  faEuroSign,
  faShieldHalved,
  faBuilding,
  faMapLocationDot,
  faUsers,
  faToolbox,
  faCircleCheck,
} from "@fortawesome/free-solid-svg-icons";
import {
  faFacebook,
  faInstagram,
  faLinkedin,
  faYoutube,
} from "@fortawesome/free-brands-svg-icons";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { sanitizeHtml, formatPlacesDisponibles, getPlacesToneClass } from "@/lib/utils";

export const revalidate = 3600;

interface Session {
  id: string;
  dateDebut: Date;
  dateFin: Date;
  placesTotal: number;
  placesRestantes: number;
  status: string;
}

interface Categorie {
  id: string;
  nom: string;
}

interface Formation {
  id: string;
  titre: string;
  slug: string;
  description: string;
  prix: number;
  duree: string;
  modalite: string;
  isQualiopi: boolean;
  isCPF: boolean;
  sessions: Session[];
  categorie: Categorie | null;
}

interface ReseauxSociaux {
  facebook?: string;
  instagram?: string;
  linkedin?: string;
  youtube?: string;
}

function coerceReseauxSociaux(value: unknown): ReseauxSociaux | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const v = value as Record<string, unknown>;
  const pick = (key: keyof ReseauxSociaux) => (typeof v[key] === "string" ? (v[key] as string) : undefined);
  const out: ReseauxSociaux = {
    facebook: pick("facebook"),
    instagram: pick("instagram"),
    linkedin: pick("linkedin"),
    youtube: pick("youtube"),
  };
  return Object.values(out).some(Boolean) ? out : null;
}

interface Centre {
  id: string;
  nom: string;
  slug: string;
  description: string | null;
  adresse: string;
  codePostal: string;
  ville: string;
  telephone: string | null;
  email: string | null;
  siteWeb: string | null;
  latitude: number | null;
  longitude: number | null;
  isActive: boolean;
  bannerImage: string | null;
  couleurPrimaire: string | null;
  couleurSecondaire: string | null;
  presentationHtml: string | null;
  horaires: string | null;
  equipements: string[];
  certifications: string[];
  reseauxSociaux: ReseauxSociaux | null;
  formations: Formation[];
  _count: {
    formations: number;
    sessions: number;
  };
}

function formatDate(date: Date): string {
  return date.toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function formatPrice(price: number): string {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 0,
  }).format(price);
}

function getNextSession(sessions: Session[]): Session | null {
  const now = new Date();
  return sessions.find((s) => s.dateDebut >= now && s.placesRestantes > 0) ?? null;
}

export default async function CentreDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const centreDb = await prisma.centre.findUnique({
    where: { slug },
    include: {
      formations: {
        where: { isActive: true },
        include: {
          sessions: {
            where: {
              status: "ACTIVE",
              dateDebut: { gte: new Date() },
              placesRestantes: { gt: 0 },
            },
            orderBy: { dateDebut: "asc" },
          },
          categorie: true,
        },
      },
    },
  });

  if (!centreDb || !centreDb.isActive) {
    notFound();
  }

  const formationCount = centreDb.formations.length;
  const sessionCount = centreDb.formations.reduce((acc, f) => acc + f.sessions.length, 0);

  const centre: Centre = {
    ...centreDb,
    reseauxSociaux: coerceReseauxSociaux(centreDb.reseauxSociaux),
    presentationHtml: centreDb.presentationHtml ? sanitizeHtml(centreDb.presentationHtml) : null,
    _count: { formations: formationCount, sessions: sessionCount },
  };

  const accentColor = centre.couleurPrimaire || "#3B82F6";
  const socials = centre.reseauxSociaux;
  const hasSocials = socials && Object.values(socials).some((v) => v);

  return (
    <div className="min-h-screen bg-brand-bg">
      <Header />

      {/* ─── HERO ──────────────────────────────────────────── */}
      <section
        className="text-white py-14 px-4 bg-cover bg-center"
        style={{
          background: centre.bannerImage
            ? `linear-gradient(rgba(10,22,40,0.85), rgba(10,22,40,0.95)), url(${centre.bannerImage}) center/cover`
            : "#0A1628",
        }}
      >
        <div className="max-w-5xl mx-auto">
          <nav className="flex items-center gap-2 text-sm text-gray-400 mb-6">
            <Link href="/" className="hover:text-white transition-colors">
              Accueil
            </Link>
            <FontAwesomeIcon icon={faChevronRight} className="text-[10px]" />
            <Link href="/centres" className="hover:text-white transition-colors">
              Centres
            </Link>
            <FontAwesomeIcon icon={faChevronRight} className="text-[10px]" />
            <span className="text-white/90 truncate">{centre.nom}</span>
          </nav>

          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-8">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-4">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center border"
                  style={{ background: `${accentColor}20`, borderColor: `${accentColor}40` }}
                >
                  <FontAwesomeIcon icon={faBuilding} style={{ color: accentColor }} />
                </div>
                <div>
                  <h1 className="font-display font-bold text-3xl sm:text-4xl leading-tight">
                    {centre.nom}
                  </h1>
                  <p className="text-gray-300 text-sm mt-1 flex items-center gap-2">
                    <FontAwesomeIcon icon={faLocationDot} />
                    {centre.ville} ({centre.codePostal})
                  </p>
                </div>
              </div>

              {centre.description && (
                <p className="text-gray-200 leading-relaxed max-w-3xl">
                  {centre.description}
                </p>
              )}

              <div className="mt-6 flex flex-wrap gap-2">
                {centre.certifications?.length > 0 && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-400/10 text-blue-200 border border-blue-500/20 text-xs font-semibold">
                    <FontAwesomeIcon icon={faShieldHalved} className="text-[10px]" />
                    Centre certifié
                  </span>
                )}
              </div>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-2xl p-5 w-full lg:w-[360px]">
              <p className="text-xs text-gray-300 mb-2 flex items-center gap-2">
                <FontAwesomeIcon icon={faMapLocationDot} />
                Adresse
              </p>
              <p className="text-white font-medium">
                {centre.adresse}, {centre.codePostal} {centre.ville}
              </p>

              <div className="mt-4 grid grid-cols-2 gap-3">
                <div className="bg-white/5 border border-white/10 rounded-xl p-3">
                  <p className="text-[11px] text-gray-400 mb-1 flex items-center gap-2">
                    <FontAwesomeIcon icon={faBookOpen} />
                    Formations
                  </p>
                  <p className="text-white font-bold text-lg">{centre._count.formations}</p>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-xl p-3">
                  <p className="text-[11px] text-gray-400 mb-1 flex items-center gap-2">
                    <FontAwesomeIcon icon={faCalendarDays} />
                    Sessions
                  </p>
                  <p className="text-white font-bold text-lg">{centre._count.sessions}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── CONTACT ───────────────────────────────────────── */}
      <section className="max-w-5xl mx-auto px-4 py-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {centre.telephone && (
            <div className="bg-white border border-brand-border rounded-xl p-5 flex items-start gap-3 shadow-sm">
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                style={{ background: `${accentColor}15` }}
              >
                <FontAwesomeIcon icon={faPhone} style={{ color: accentColor }} />
              </div>
              <div>
                <p className="text-xs text-gray-400 font-medium mb-1">Téléphone</p>
                <a
                  href={`tel:${centre.telephone}`}
                  className="text-sm font-semibold hover:underline"
                  style={{ color: accentColor }}
                >
                  {centre.telephone}
                </a>
              </div>
            </div>
          )}

          {centre.email && (
            <div className="bg-white border border-brand-border rounded-xl p-5 flex items-start gap-3 shadow-sm">
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                style={{ background: `${accentColor}15` }}
              >
                <FontAwesomeIcon icon={faEnvelope} style={{ color: accentColor }} />
              </div>
              <div>
                <p className="text-xs text-gray-400 font-medium mb-1">Email</p>
                <a
                  href={`mailto:${centre.email}`}
                  className="text-sm font-semibold hover:underline break-all"
                  style={{ color: accentColor }}
                >
                  {centre.email}
                </a>
              </div>
            </div>
          )}

          {centre.siteWeb && (
            <div className="bg-white border border-brand-border rounded-xl p-5 flex items-start gap-3 shadow-sm">
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                style={{ background: `${accentColor}15` }}
              >
                <FontAwesomeIcon icon={faGlobe} style={{ color: accentColor }} />
              </div>
              <div>
                <p className="text-xs text-gray-400 font-medium mb-1">Site web</p>
                <a
                  href={centre.siteWeb.startsWith("http") ? centre.siteWeb : `https://${centre.siteWeb}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-semibold hover:underline break-all"
                  style={{ color: accentColor }}
                >
                  {centre.siteWeb}
                </a>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ─── PRESENTATION / HORAIRES / EQUIPEMENTS ─────────── */}
      {(centre.presentationHtml || centre.horaires || (centre.equipements && centre.equipements.length > 0)) && (
        <section className="max-w-5xl mx-auto px-4 py-10">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {centre.presentationHtml && (
              <div className="lg:col-span-2 bg-white border border-brand-border rounded-xl p-6 shadow-sm">
                <h2 className="font-display font-bold text-lg text-brand-text mb-4 flex items-center gap-2">
                  <FontAwesomeIcon icon={faBuilding} style={{ color: accentColor }} />
                  A propos
                </h2>
                <div
                  className="prose prose-sm max-w-none text-gray-600 leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: centre.presentationHtml }}
                />
              </div>
            )}

            <div className="space-y-6">
              {centre.horaires && (
                <div className="bg-white border border-brand-border rounded-xl p-6 shadow-sm">
                  <h3 className="font-display font-bold text-sm text-brand-text mb-3 flex items-center gap-2">
                    <FontAwesomeIcon icon={faClock} style={{ color: accentColor }} />
                    Horaires d&apos;ouverture
                  </h3>
                  <p className="text-sm text-gray-600 whitespace-pre-line leading-relaxed">
                    {centre.horaires}
                  </p>
                </div>
              )}

              {centre.equipements && centre.equipements.length > 0 && (
                <div className="bg-white border border-brand-border rounded-xl p-6 shadow-sm">
                  <h3 className="font-display font-bold text-sm text-brand-text mb-3 flex items-center gap-2">
                    <FontAwesomeIcon icon={faToolbox} style={{ color: accentColor }} />
                    Equipements
                  </h3>
                  <div className="space-y-2">
                    {centre.equipements.map((eq, i) => (
                      <div key={i} className="flex items-center gap-2 text-sm text-gray-600">
                        <FontAwesomeIcon
                          icon={faCircleCheck}
                          className="w-3.5 h-3.5"
                          style={{ color: accentColor }}
                        />
                        {eq}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* ─── FORMATIONS ────────────────────────────────────── */}
      <section className="max-w-5xl mx-auto px-4 py-12">
        <h2 className="font-display font-bold text-2xl text-brand-text mb-6">
          Formations proposées
        </h2>

        {centre.formations.length === 0 ? (
          <div className="bg-white border border-brand-border rounded-xl p-8 text-center text-gray-500">
            Aucune formation active pour le moment.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {centre.formations.map((f) => {
              const next = getNextSession(f.sessions);
              const totalPlaces = f.sessions.reduce((sum, s) => sum + s.placesRestantes, 0);
              return (
                <div key={f.id} className="bg-white border border-brand-border rounded-2xl p-6 shadow-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-xs text-gray-400 mb-1">
                        {f.categorie?.nom ?? "Formation"}
                      </p>
                      <h3 className="font-display font-bold text-lg text-brand-text truncate">
                        {f.titre}
                      </h3>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xs text-gray-400">À partir de</p>
                      <p className="text-lg font-bold" style={{ color: accentColor }}>
                        {formatPrice(f.prix)}
                      </p>
                    </div>
                  </div>

                  <p className="text-sm text-gray-500 mt-3 line-clamp-2">
                    {f.description}
                  </p>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-gray-100 text-gray-700">
                      <FontAwesomeIcon icon={faClock} className="text-[10px]" />
                      {f.duree}
                    </span>
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-gray-100 text-gray-700">
                      <FontAwesomeIcon icon={faUsers} className="text-[10px]" />
                      {totalPlaces > 0
                        ? `${totalPlaces} place${totalPlaces > 1 ? "s" : ""} dispo`
                        : `${f.sessions.length} session${f.sessions.length > 1 ? "s" : ""}`}
                    </span>
                    {f.isCPF && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-100">
                        <FontAwesomeIcon icon={faEuroSign} className="text-[10px]" />
                        CPF
                      </span>
                    )}
                  </div>

                  <div className="mt-5 flex items-center justify-between gap-3">
                    <div className="text-xs text-gray-500">
                      {next ? (
                        <span className="inline-flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                          <span className="inline-flex items-center gap-2">
                            <FontAwesomeIcon icon={faCalendarDays} className="text-gray-400" />
                            Prochaine session : {formatDate(next.dateDebut)} — {formatDate(next.dateFin)}
                          </span>
                          <span className={`inline-flex items-center gap-1.5 ${getPlacesToneClass(next.placesRestantes)}`}>
                            <FontAwesomeIcon icon={faUsers} className="text-[10px]" />
                            {formatPlacesDisponibles(next.placesRestantes)}
                          </span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-2">
                          <FontAwesomeIcon icon={faCalendarDays} className="text-gray-400" />
                          Dates à venir
                        </span>
                      )}
                    </div>
                    <Link
                      href={`/formations/${f.slug}`}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white transition-colors"
                      style={{ background: accentColor }}
                    >
                      Voir la fiche
                      <FontAwesomeIcon icon={faChevronRight} className="text-[10px]" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* ─── SOCIALS ───────────────────────────────────────── */}
      {hasSocials && (
        <section className="max-w-5xl mx-auto px-4 pb-14">
          <div className="bg-white border border-brand-border rounded-2xl p-6 shadow-sm">
            <h2 className="font-display font-bold text-lg text-brand-text mb-4">
              Suivre le centre
            </h2>
            <div className="flex flex-wrap gap-3">
              {socials?.facebook && (
                <a className="btn-secondary px-4 py-2 rounded-lg" href={socials.facebook} target="_blank" rel="noreferrer">
                  <FontAwesomeIcon icon={faFacebook} className="mr-2" />
                  Facebook
                </a>
              )}
              {socials?.instagram && (
                <a className="btn-secondary px-4 py-2 rounded-lg" href={socials.instagram} target="_blank" rel="noreferrer">
                  <FontAwesomeIcon icon={faInstagram} className="mr-2" />
                  Instagram
                </a>
              )}
              {socials?.linkedin && (
                <a className="btn-secondary px-4 py-2 rounded-lg" href={socials.linkedin} target="_blank" rel="noreferrer">
                  <FontAwesomeIcon icon={faLinkedin} className="mr-2" />
                  LinkedIn
                </a>
              )}
              {socials?.youtube && (
                <a className="btn-secondary px-4 py-2 rounded-lg" href={socials.youtube} target="_blank" rel="noreferrer">
                  <FontAwesomeIcon icon={faYoutube} className="mr-2" />
                  YouTube
                </a>
              )}
            </div>
          </div>
        </section>
      )}

      <Footer />
    </div>
  );
}

