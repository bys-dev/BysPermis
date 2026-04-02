"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { useState, useEffect } from "react";
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
  faAward,
  faShieldHalved,
  faBuilding,
  faMapLocationDot,
  faSpinner,
  faArrowRight,
  faUsers,
  faCircleExclamation,
  faToolbox,
  faCircleCheck,
} from "@fortawesome/free-solid-svg-icons";
import {
  faFacebook,
  faInstagram,
  faLinkedin,
  faYoutube,
} from "@fortawesome/free-brands-svg-icons";

// ─── TYPES ────────────────────────────────────────────────

interface Session {
  id: string;
  dateDebut: string;
  dateFin: string;
  placesTotal: number;
  placesRestantes: number;
  status: string;
}

interface Categorie {
  id: string;
  nom: string;
  slug: string;
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

// ─── HELPERS ──────────────────────────────────────────────

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("fr-FR", {
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
  return (
    sessions.find(
      (s) => new Date(s.dateDebut) >= now && s.placesRestantes > 0
    ) ?? null
  );
}

// ─── COMPONENT ────────────────────────────────────────────

export default function CentreDetailPage() {
  const params = useParams();
  const slug = params.slug as string;

  const [centre, setCentre] = useState<Centre | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!slug) return;

    async function fetchCentre() {
      setLoading(true);
      try {
        const res = await fetch(`/api/centres/${slug}`);
        if (res.status === 404) {
          setNotFound(true);
          return;
        }
        if (!res.ok) throw new Error("Erreur serveur");
        const data = await res.json();
        setCentre(data);
      } catch {
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    }

    fetchCentre();
  }, [slug]);

  // ─── LOADING ────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-brand-bg">
        <Header />
        <div className="flex items-center justify-center py-32">
          <div className="text-center">
            <FontAwesomeIcon
              icon={faSpinner}
              className="text-4xl text-brand-accent mb-4 animate-spin"
            />
            <p className="text-gray-500">Chargement du centre...</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  // ─── NOT FOUND ──────────────────────────────────────────
  if (notFound || !centre) {
    return (
      <div className="min-h-screen bg-brand-bg">
        <Header />
        <div className="flex items-center justify-center py-32">
          <div className="text-center">
            <FontAwesomeIcon
              icon={faCircleExclamation}
              className="text-5xl text-gray-300 mb-4"
            />
            <h1 className="font-display font-bold text-2xl text-brand-text mb-2">
              Centre non trouvé
            </h1>
            <p className="text-gray-500 mb-6">
              Le centre que vous recherchez n&apos;existe pas ou a été
              désactivé.
            </p>
            <Link
              href="/centres"
              className="btn-primary px-6 py-2.5 rounded-lg inline-flex items-center gap-2"
            >
              Voir tous les centres
              <FontAwesomeIcon icon={faArrowRight} />
            </Link>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const hasQualiopi = centre.formations.some((f) => f.isQualiopi);
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
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-sm text-gray-400 mb-6">
            <Link href="/" className="hover:text-white transition-colors">
              Accueil
            </Link>
            <FontAwesomeIcon icon={faChevronRight} className="text-xs" />
            <Link
              href="/centres"
              className="hover:text-white transition-colors"
            >
              Centres
            </Link>
            <FontAwesomeIcon icon={faChevronRight} className="text-xs" />
            <span style={{ color: accentColor }}>{centre.nom}</span>
          </nav>

          <div className="flex flex-col md:flex-row items-start gap-6">
            {/* Logo */}
            <div
              className="w-20 h-20 rounded-2xl flex items-center justify-center shrink-0"
              style={{ background: `${accentColor}20` }}
            >
              <FontAwesomeIcon
                icon={faBuilding}
                className="text-3xl"
                style={{ color: accentColor }}
              />
            </div>

            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-3 mb-3">
                <h1 className="font-display font-bold text-3xl md:text-4xl">
                  {centre.nom}
                </h1>
                {hasQualiopi && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    <FontAwesomeIcon icon={faAward} className="mr-1.5" />
                    Qualiopi
                  </span>
                )}
                {/* Display certifications as badges */}
                {centre.certifications && centre.certifications.length > 0 ? (
                  centre.certifications.map((cert, i) => (
                    <span
                      key={i}
                      className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-green-500/20 text-green-300 border border-green-500/30"
                    >
                      <FontAwesomeIcon icon={faShieldHalved} className="mr-1.5" />
                      {cert}
                    </span>
                  ))
                ) : (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-green-500/20 text-green-300 border border-green-500/30">
                    <FontAwesomeIcon icon={faShieldHalved} className="mr-1.5" />
                    Agree Prefecture
                  </span>
                )}
              </div>

              <p className="text-gray-300 flex items-center gap-2 mb-3">
                <FontAwesomeIcon icon={faLocationDot} style={{ color: accentColor }} />
                {centre.adresse}, {centre.codePostal} {centre.ville}
              </p>

              {centre.description && (
                <p className="text-gray-400 max-w-2xl leading-relaxed">
                  {centre.description}
                </p>
              )}

              {/* Stats */}
              <div className="flex flex-wrap gap-6 mt-5">
                <div className="flex items-center gap-2 text-sm">
                  <FontAwesomeIcon
                    icon={faBookOpen}
                    style={{ color: accentColor }}
                  />
                  <span className="text-white font-semibold">
                    {centre._count.formations}
                  </span>
                  <span className="text-gray-400">
                    formation{centre._count.formations > 1 ? "s" : ""}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <FontAwesomeIcon
                    icon={faCalendarDays}
                    style={{ color: accentColor }}
                  />
                  <span className="text-white font-semibold">
                    {centre._count.sessions}
                  </span>
                  <span className="text-gray-400">
                    session{centre._count.sessions > 1 ? "s" : ""} a venir
                  </span>
                </div>
              </div>

              {/* Social media links */}
              {hasSocials && (
                <div className="flex gap-3 mt-5">
                  {socials.facebook && (
                    <a
                      href={socials.facebook}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-9 h-9 rounded-lg bg-white/10 hover:bg-[#1877F2]/30 flex items-center justify-center transition-colors"
                    >
                      <FontAwesomeIcon icon={faFacebook} className="text-[#1877F2]" />
                    </a>
                  )}
                  {socials.instagram && (
                    <a
                      href={socials.instagram}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-9 h-9 rounded-lg bg-white/10 hover:bg-[#E4405F]/30 flex items-center justify-center transition-colors"
                    >
                      <FontAwesomeIcon icon={faInstagram} className="text-[#E4405F]" />
                    </a>
                  )}
                  {socials.linkedin && (
                    <a
                      href={socials.linkedin}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-9 h-9 rounded-lg bg-white/10 hover:bg-[#0A66C2]/30 flex items-center justify-center transition-colors"
                    >
                      <FontAwesomeIcon icon={faLinkedin} className="text-[#0A66C2]" />
                    </a>
                  )}
                  {socials.youtube && (
                    <a
                      href={socials.youtube}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-9 h-9 rounded-lg bg-white/10 hover:bg-[#FF0000]/30 flex items-center justify-center transition-colors"
                    >
                      <FontAwesomeIcon icon={faYoutube} className="text-[#FF0000]" />
                    </a>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ─── INFO CARDS ────────────────────────────────────── */}
      <section className="max-w-5xl mx-auto px-4 -mt-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Adresse */}
          <div className="bg-white border border-brand-border rounded-xl p-5 flex items-start gap-3 shadow-sm">
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
              style={{ background: `${accentColor}15` }}
            >
              <FontAwesomeIcon
                icon={faLocationDot}
                style={{ color: accentColor }}
              />
            </div>
            <div>
              <p className="text-xs text-gray-400 font-medium mb-1">Adresse</p>
              <p className="text-sm text-brand-text font-semibold">
                {centre.adresse}
              </p>
              <p className="text-sm text-gray-500">
                {centre.codePostal} {centre.ville}
              </p>
            </div>
          </div>

          {/* Telephone */}
          {centre.telephone && (
            <div className="bg-white border border-brand-border rounded-xl p-5 flex items-start gap-3 shadow-sm">
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                style={{ background: `${accentColor}15` }}
              >
                <FontAwesomeIcon
                  icon={faPhone}
                  style={{ color: accentColor }}
                />
              </div>
              <div>
                <p className="text-xs text-gray-400 font-medium mb-1">
                  Telephone
                </p>
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

          {/* Email */}
          {centre.email && (
            <div className="bg-white border border-brand-border rounded-xl p-5 flex items-start gap-3 shadow-sm">
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                style={{ background: `${accentColor}15` }}
              >
                <FontAwesomeIcon
                  icon={faEnvelope}
                  style={{ color: accentColor }}
                />
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

          {/* Site web */}
          {centre.siteWeb && (
            <div className="bg-white border border-brand-border rounded-xl p-5 flex items-start gap-3 shadow-sm">
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                style={{ background: `${accentColor}15` }}
              >
                <FontAwesomeIcon
                  icon={faGlobe}
                  style={{ color: accentColor }}
                />
              </div>
              <div>
                <p className="text-xs text-gray-400 font-medium mb-1">
                  Site web
                </p>
                <a
                  href={
                    centre.siteWeb.startsWith("http")
                      ? centre.siteWeb
                      : `https://${centre.siteWeb}`
                  }
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
            {/* Presentation */}
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
              {/* Horaires */}
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

              {/* Equipements */}
              {centre.equipements && centre.equipements.length > 0 && (
                <div className="bg-white border border-brand-border rounded-xl p-6 shadow-sm">
                  <h3 className="font-display font-bold text-sm text-brand-text mb-3 flex items-center gap-2">
                    <FontAwesomeIcon icon={faToolbox} style={{ color: accentColor }} />
                    Equipements
                  </h3>
                  <div className="space-y-2">
                    {centre.equipements.map((eq, i) => (
                      <div
                        key={i}
                        className="flex items-center gap-2 text-sm text-gray-600"
                      >
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

        {centre.formations.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {centre.formations.map((formation) => {
              const nextSession = getNextSession(formation.sessions);
              return (
                <Link
                  key={formation.id}
                  href={`/formations/${formation.slug}`}
                  className="card p-0 overflow-hidden flex flex-col group hover:shadow-lg transition-shadow"
                >
                  <div className="p-6 flex flex-col flex-1">
                    {/* Badges */}
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      {formation.categorie && (
                        <span className="text-[11px] px-2 py-0.5 rounded-full bg-blue-50 text-brand-accent font-medium">
                          {formation.categorie.nom}
                        </span>
                      )}
                      {formation.isQualiopi && (
                        <span className="inline-flex items-center text-[10px] px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 font-bold">
                          <FontAwesomeIcon
                            icon={faAward}
                            className="mr-1"
                          />
                          Qualiopi
                        </span>
                      )}
                      {formation.isCPF && (
                        <span className="inline-flex items-center text-[10px] px-2 py-0.5 rounded-full bg-green-50 text-green-700 font-bold">
                          Éligible CPF
                        </span>
                      )}
                    </div>

                    {/* Titre */}
                    <h3 className="font-display font-semibold text-lg text-brand-text mb-2 group-hover:text-brand-accent transition-colors">
                      {formation.titre}
                    </h3>

                    {/* Description */}
                    <p className="text-sm text-gray-500 mb-4 line-clamp-2">
                      {formation.description}
                    </p>

                    {/* Infos */}
                    <div className="flex flex-wrap gap-4 text-sm text-gray-600 mb-4">
                      <span className="flex items-center gap-1.5">
                        <FontAwesomeIcon
                          icon={faEuroSign}
                          className="text-gray-400 w-4"
                        />
                        <span className="font-semibold text-brand-text">
                          {formatPrice(formation.prix)}
                        </span>
                      </span>
                      <span className="flex items-center gap-1.5">
                        <FontAwesomeIcon
                          icon={faClock}
                          className="text-gray-400 w-4"
                        />
                        {formation.duree}
                      </span>
                      <span className="flex items-center gap-1.5 capitalize">
                        <FontAwesomeIcon
                          icon={faMapLocationDot}
                          className="text-gray-400 w-4"
                        />
                        {formation.modalite.toLowerCase()}
                      </span>
                    </div>

                    {/* Prochaine session */}
                    <div className="mt-auto pt-4 border-t border-brand-border">
                      {nextSession ? (
                        <div className="flex items-center justify-between">
                          <span className="flex items-center gap-2 text-sm text-gray-600">
                            <FontAwesomeIcon
                              icon={faCalendarDays}
                              className="text-brand-accent"
                            />
                            {formatDate(nextSession.dateDebut)}
                          </span>
                          <span className="flex items-center gap-1.5 text-xs text-gray-500">
                            <FontAwesomeIcon
                              icon={faUsers}
                              className="text-gray-400"
                            />
                            {nextSession.placesRestantes} place
                            {nextSession.placesRestantes > 1 ? "s" : ""}
                          </span>
                        </div>
                      ) : (
                        <p className="text-sm text-gray-400 italic">
                          Aucune session programmée
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="px-6 py-3 bg-gray-50 border-t border-brand-border flex items-center justify-between">
                    <span className="text-sm font-medium text-brand-accent">
                      Voir le détail
                    </span>
                    <FontAwesomeIcon
                      icon={faArrowRight}
                      className="text-brand-accent text-sm group-hover:translate-x-1 transition-transform"
                    />
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12 bg-white border border-brand-border rounded-xl">
            <FontAwesomeIcon
              icon={faBookOpen}
              className="text-4xl text-gray-200 mb-4"
            />
            <p className="text-gray-500">
              Aucune formation disponible pour le moment.
            </p>
          </div>
        )}
      </section>

      {/* ─── LOCALISATION ──────────────────────────────────── */}
      {centre.latitude && centre.longitude && (
        <section className="max-w-5xl mx-auto px-4 pb-12">
          <h2 className="font-display font-bold text-2xl text-brand-text mb-6">
            Localisation
          </h2>
          <div className="bg-white border border-brand-border rounded-xl overflow-hidden">
            <div className="h-64 bg-gradient-to-b from-blue-50 to-indigo-50 flex items-center justify-center">
              <div className="text-center">
                <FontAwesomeIcon
                  icon={faMapLocationDot}
                  className="text-5xl text-blue-200 mb-3"
                />
                <p className="text-gray-600 font-medium">
                  {centre.adresse}, {centre.codePostal} {centre.ville}
                </p>
                <p className="text-sm text-gray-400 mt-1">
                  Coordonnées : {centre.latitude.toFixed(5)},{" "}
                  {centre.longitude.toFixed(5)}
                </p>
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${centre.latitude},${centre.longitude}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 mt-4 px-5 py-2.5 rounded-lg bg-brand-accent text-white text-sm font-semibold hover:bg-brand-accent-hover transition-colors"
                >
                  <FontAwesomeIcon icon={faLocationDot} />
                  Ouvrir dans Google Maps
                </a>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ─── CTA ───────────────────────────────────────────── */}
      <section className="bg-[#0A1628] text-white py-14 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="font-display font-bold text-2xl md:text-3xl mb-4">
            Trouvez votre formation idéale
          </h2>
          <p className="text-gray-300 mb-8">
            Parcourez toutes les formations disponibles ou contactez directement
            le centre pour en savoir plus.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/recherche"
              className="btn-primary px-8 py-3 rounded-lg inline-flex items-center gap-2"
            >
              Toutes les formations
              <FontAwesomeIcon icon={faArrowRight} />
            </Link>
            <Link
              href="/centres"
              className="btn-secondary px-8 py-3 rounded-lg inline-flex items-center gap-2"
            >
              Tous les centres
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
