import type { Metadata } from "next";
import Link from "next/link";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { pageMetadata } from "@/lib/seo";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faEye, faHandshake, faAward, faMapMarkerAlt, faUsers, faStar,
  faBuilding, faShieldHalved, faGraduationCap, faArrowRight, faCheckCircle,
} from "@fortawesome/free-solid-svg-icons";

export const dynamic = "force-static";

export const metadata: Metadata = pageMetadata({
  title: "À propos — Marketplace stages permis agréés",
  description:
    "BYS Permis connecte les conducteurs aux centres agréés préfecture pour réserver un stage de récupération de points partout en France.",
  path: "/a-propos",
});

const values = [
  { icon: faEye, title: "Transparence", description: "Des prix clairs sans surprise. Tous nos centres sont agréés par la préfecture et chaque avis est vérifié." },
  { icon: faHandshake, title: "Simplicité", description: "Un parcours de réservation fluide en quelques clics. Convocation immédiate par email, sans paperasse." },
  { icon: faAward, title: "Qualité", description: "Des centres sélectionnés et évalués par nos stagiaires. Un taux de satisfaction de 4.8/5 en moyenne." },
  { icon: faMapMarkerAlt, title: "Proximité", description: "Des centres agréés préfecture partout en France. Trouvez un stage près de chez vous." },
];

// Chiffres du dispositif légal, tous vérifiables. Les valeurs précédentes
// (« 150+ centres partenaires », « 45 000+ stagiaires », « 4.8/5 de
// satisfaction ») étaient inventées : la plateforme n'a aucun partenaire à ce
// jour, aucun stagiaire accompagné et aucun avis déposé.
const stats = [
  { value: "4", label: "Points récupérés", icon: faStar },
  { value: "2 jours", label: "Durée du stage", icon: faGraduationCap },
  { value: "1 an", label: "Délai entre 2 stages", icon: faUsers },
  { value: "100%", label: "Agréés préfecture", icon: faShieldHalved },
];

export default function AProposPage() {
  return (
    <div className="min-h-screen bg-[#F9FAFB]">
      <Header />

      <main>
        {/* ─── Hero dark navy ─── */}
        <section className="relative overflow-hidden bg-brand-navy text-white py-24 lg:py-32 px-4">
          <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse 60% 50% at 50% 40%, rgba(37,99,235,0.12) 0%, transparent 70%)" }} />
          <div className="absolute bottom-0 left-0 right-0 h-1 flex">
            <div className="flex-1 bg-blue-600" />
            <div className="flex-1 bg-white" />
            <div className="flex-1 bg-red-500" />
          </div>
          <div className="relative max-w-[1440px] mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium mb-6 border" style={{ background: "rgba(255,255,255,0.07)", borderColor: "rgba(255,255,255,0.12)" }}>
              <span className="inline-flex rounded overflow-hidden mr-1">
                <span className="w-1.5 h-3 bg-blue-500" /><span className="w-1.5 h-3 bg-white" /><span className="w-1.5 h-3 bg-red-500" />
              </span>
              <span className="text-blue-50">Notre histoire</span>
            </div>
            <h1 className="font-display font-bold text-4xl md:text-5xl lg:text-6xl mb-6 text-white">
              À propos de BYS Permis
            </h1>
            <p className="text-lg text-blue-100/80 max-w-3xl mx-auto leading-relaxed">
              La plateforme de référence pour réserver un stage de récupération de points permis,
              simplement et en toute confiance.
            </p>
          </div>
        </section>

        {/* ─── Stats bar rouge ─── */}
        <section className="relative py-5 px-4 bg-gradient-to-r from-red-700 via-red-600 to-red-700 overflow-hidden">
          <div className="absolute inset-0 bg-dots-white opacity-60" aria-hidden="true" />
          <div className="relative max-w-[1440px] mx-auto grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-8">
            {stats.map((s) => (
              <div key={s.label} className="flex items-center justify-center gap-3 text-white">
                <span className="w-10 h-10 rounded-full bg-white/15 ring-1 ring-white/25 flex items-center justify-center shrink-0">
                  <FontAwesomeIcon icon={s.icon} className="text-white text-base" />
                </span>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-2xl font-display font-bold">{s.value}</span>
                  <span className="text-sm text-red-100">{s.label}</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ─── Histoire + Mission ─── */}
        <section className="relative py-20 px-4 sm:px-8 bg-section-tint overflow-hidden">
          <div className="halo halo-blue w-[28rem] h-[28rem] top-1/4 -left-56" aria-hidden="true" />
          <div className="absolute inset-x-0 top-0 h-72 bg-dots-blue mask-fade-radial opacity-60" aria-hidden="true" />
          <div className="relative max-w-[1440px] mx-auto">
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              <div>
                <span className="eyebrow">Notre histoire</span>
                <h2 className="font-display font-bold text-3xl md:text-4xl text-brand-text mt-4 mb-6">
                  Simplifier l&apos;accès aux <span className="title-mark">stages de récupération de points</span>
                </h2>
                <div className="space-y-4 text-gray-600 leading-relaxed text-sm">
                  <p>BYS Permis est née d&apos;un constat simple : réserver un stage de récupération de points permis en France restait une démarche complexe, opaque et souvent stressante pour les conducteurs.</p>
                  <p>Face à des informations dispersées, des prix peu transparents et des démarches administratives lourdes, nous avons créé une plateforme unique qui centralise l&apos;offre de stages agréés et simplifie chaque étape du parcours.</p>
                  <p>Depuis notre création, nous accompagnons des milliers de conducteurs dans leur démarche de récupération de points, tout en aidant les centres de formation à développer leur activité.</p>
                </div>
              </div>

              {/* Carte mission dark */}
              <div className="rounded-2xl p-8 lg:p-10 text-white relative overflow-hidden shadow-2xl shadow-blue-900/25" style={{ background: "linear-gradient(135deg, var(--color-brand-navy-deep) 0%, var(--color-brand-navy-soft) 100%)", border: "1px solid rgba(255,255,255,0.08)" }}>
                <div className="absolute inset-0 bg-grid-white mask-fade-radial" aria-hidden="true" />
                <div className="absolute top-0 right-0 w-56 h-56 bg-blue-400/20 rounded-full blur-3xl" />
                <div className="absolute inset-x-0 top-0 tricolore-rule" aria-hidden="true" />
                <div className="icon-tile relative w-12 h-12 rounded-xl mb-5">
                  <FontAwesomeIcon icon={faGraduationCap} className="text-xl" />
                </div>
                <h3 className="relative font-display font-bold text-2xl mb-3">Notre mission</h3>
                <p className="relative text-blue-100/80 text-sm leading-relaxed mb-6">
                  Rendre accessible et simple la réservation de stages agréés préfecture pour tous les conducteurs en France. Chaque automobiliste mérite un accès rapide, transparent et abordable à la récupération de ses points.
                </p>
                <ul className="relative space-y-3">
                  {[
                    "Centraliser l'offre de stages agréés",
                    "Garantir des prix justes et transparents",
                    "Simplifier la réservation en ligne",
                    "Accompagner les centres partenaires",
                  ].map((item) => (
                    <li key={item} className="flex items-center gap-3 text-sm text-blue-50">
                      <FontAwesomeIcon icon={faCheckCircle} className="text-blue-300 w-4 h-4 shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* ─── Valeurs ─── */}
        <section className="relative py-20 px-4 sm:px-8 bg-white overflow-hidden">
          <div className="absolute inset-0 bg-grid-blue mask-fade-y" aria-hidden="true" />
          <div className="relative max-w-[1440px] mx-auto">
            <div className="text-center mb-14">
              <span className="eyebrow">Nos valeurs</span>
              <h2 className="font-display font-bold text-3xl md:text-4xl text-brand-text mt-4 mb-4">Ce qui nous guide <span className="title-mark">au quotidien</span></h2>
              <p className="text-gray-500 max-w-xl mx-auto text-sm">Quatre piliers fondamentaux qui façonnent l&apos;expérience BYS Permis.</p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {values.map((v) => (
                <div key={v.title} className="card-lift card-accent-top group p-8 text-center">
                  <div className="icon-tile w-14 h-14 rounded-2xl mx-auto mb-5 mt-1">
                    <FontAwesomeIcon icon={v.icon} className="text-2xl" />
                  </div>
                  <h3 className="font-display font-bold text-lg text-brand-text mb-3">{v.title}</h3>
                  <p className="text-gray-500 text-sm leading-relaxed">{v.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ─── Équipe ─── */}
        <section className="relative py-20 px-4 sm:px-8 bg-section-blue overflow-hidden">
          <div className="halo halo-blue w-96 h-96 top-1/4 -right-56" aria-hidden="true" />
          <div className="relative max-w-[1440px] mx-auto text-center">
            <span className="eyebrow">Notre équipe</span>
            <h2 className="font-display font-bold text-3xl md:text-4xl text-brand-text mt-4 mb-4">Une équipe passionnée par <span className="title-mark">la sécurité routière</span></h2>
            <p className="text-gray-500 max-w-2xl mx-auto mb-12 text-sm">Derrière BYS Permis, une équipe pluridisciplinaire qui allie expertise en sécurité routière, technologie et service client.</p>
            <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
              {[
                { role: "Direction & Stratégie", description: "Pilotage de la vision produit et développement des partenariats avec les centres agréés.", icon: faBuilding },
                { role: "Technologie & Produit", description: "Conception et développement de la plateforme pour une expérience de réservation fluide et sécurisée.", icon: faGraduationCap },
                { role: "Support & Relation Client", description: "Accompagnement des stagiaires et des centres partenaires, du lundi au vendredi de 9h à 18h.", icon: faUsers },
              ].map((t) => (
                <div key={t.role} className="group relative overflow-hidden rounded-2xl p-8 text-left shadow-lg shadow-blue-900/15 transition-all duration-200 hover:-translate-y-1 hover:shadow-2xl hover:shadow-blue-900/25 motion-reduce:transition-none motion-reduce:hover:translate-y-0" style={{ background: "linear-gradient(135deg, var(--color-brand-navy-deep) 0%, var(--color-brand-navy-soft) 100%)", border: "1px solid rgba(255,255,255,0.07)" }}>
                  <div className="absolute inset-0 bg-dots-white" aria-hidden="true" />
                  <div className="icon-tile relative w-12 h-12 rounded-xl mb-5">
                    <FontAwesomeIcon icon={t.icon} className="text-lg" />
                  </div>
                  <h3 className="relative font-display font-bold text-white mb-3">{t.role}</h3>
                  <p className="relative text-blue-100/75 text-sm leading-relaxed">{t.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ─── Certifications ─── */}
        <section className="relative py-20 px-4 sm:px-8 bg-white overflow-hidden">
          <div className="absolute inset-x-0 top-0 h-72 bg-dots-blue mask-fade-radial opacity-60" aria-hidden="true" />
          <div className="relative max-w-[1440px] mx-auto">
            <div className="text-center mb-14">
              <span className="eyebrow">Nos garanties</span>
              <h2 className="font-display font-bold text-3xl md:text-4xl text-brand-text mt-4 mb-4">Certifications <span className="title-mark">& partenaires</span></h2>
              <p className="text-gray-500 max-w-xl mx-auto text-sm">BYS Permis travaille exclusivement avec des centres agréés et certifiés.</p>
            </div>
            <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
              {[
                { title: "Agréé Ministère de l'Intérieur", description: "Tous nos stages sont dispensés par des centres titulaires d'un agrément préfectoral, conformément au Code de la route.", icon: faShieldHalved },
              ].map((cert) => (
                <div key={cert.title} className="card-lift card-accent-left group p-8 flex gap-5 md:col-span-2 md:max-w-2xl md:mx-auto">
                  <div className="icon-tile w-12 h-12 rounded-xl">
                    <FontAwesomeIcon icon={cert.icon} className="text-xl" />
                  </div>
                  <div>
                    <h3 className="font-display font-bold text-base text-brand-text mb-2">{cert.title}</h3>
                    <p className="text-gray-500 text-sm leading-relaxed">{cert.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ─── CTA dark ─── */}
        <section className="relative py-20 px-4 sm:px-8 bg-gradient-to-br from-brand-navy-deep via-brand-navy to-brand-navy-soft overflow-hidden">
          <div className="absolute inset-0 bg-grid-white mask-fade-radial" aria-hidden="true" />
          <div className="halo halo-blue-strong w-[30rem] h-[30rem] top-1/4 left-1/2 -translate-x-1/2" aria-hidden="true" />
          <div className="relative max-w-3xl mx-auto text-center">
            <div className="flex justify-center mb-6">
              <div className="flex rounded overflow-hidden">
                <div className="w-8 h-1.5 bg-blue-600" />
                <div className="w-8 h-1.5 bg-white" />
                <div className="w-8 h-1.5 bg-red-500" />
              </div>
            </div>
            <h2 className="font-display font-bold text-3xl md:text-4xl text-white mb-4">
              Rejoignez notre réseau de centres partenaires
            </h2>
            <p className="text-blue-100/80 mb-8 text-sm leading-relaxed max-w-xl mx-auto">
              Vous êtes un centre de formation agréé ? Développez votre activité et bénéficiez d&apos;une visibilité accrue auprès de milliers de conducteurs.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/devenir-partenaire" className="inline-flex items-center gap-2 bg-red-600 text-white font-semibold px-8 py-3.5 rounded-xl hover:bg-red-700 transition-all shadow-lg shadow-red-600/20">
                Devenir centre partenaire
                <FontAwesomeIcon icon={faArrowRight} className="text-sm" />
              </Link>
              <Link href="/tarifs-partenaires" className="inline-flex items-center gap-2 text-white font-semibold px-8 py-3.5 rounded-xl transition-all" style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)" }}>
                Voir les tarifs
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
