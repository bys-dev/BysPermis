import type { Metadata } from "next";
import Link from "next/link";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faEye, faHandshake, faAward, faMapMarkerAlt, faUsers, faStar,
  faBuilding, faShieldHalved, faGraduationCap, faArrowRight, faCheckCircle,
} from "@fortawesome/free-solid-svg-icons";

export const metadata: Metadata = {
  title: "À propos — BYS Formation",
  description: "Découvrez BYS Formation, la plateforme de référence pour réserver un stage de récupération de points permis agréé préfecture partout en France.",
};

const values = [
  { icon: faEye, title: "Transparence", description: "Des prix clairs sans surprise. Tous nos centres sont agréés par la préfecture et chaque avis est vérifié.", color: "text-blue-400", bg: "bg-blue-400/10" },
  { icon: faHandshake, title: "Simplicité", description: "Un parcours de réservation fluide en quelques clics. Convocation immédiate par email, sans paperasse.", color: "text-green-400", bg: "bg-green-400/10" },
  { icon: faAward, title: "Qualité", description: "Des centres sélectionnés et évalués par nos stagiaires. Un taux de satisfaction de 4.8/5 en moyenne.", color: "text-yellow-400", bg: "bg-yellow-400/10" },
  { icon: faMapMarkerAlt, title: "Proximité", description: "Plus de 150 centres partenaires dans toute la France. Trouvez un stage près de chez vous.", color: "text-purple-400", bg: "bg-purple-400/10" },
];

const stats = [
  { value: "150+", label: "Centres partenaires", icon: faBuilding },
  { value: "45 000+", label: "Stagiaires accompagnés", icon: faUsers },
  { value: "4.8/5", label: "Satisfaction moyenne", icon: faStar },
  { value: "100%", label: "Agréés préfecture", icon: faShieldHalved },
];

export default function AProposPage() {
  return (
    <div className="min-h-screen bg-[#F9FAFB]">
      <Header />

      <main>
        {/* ─── Hero dark navy ─── */}
        <section className="relative overflow-hidden bg-[#0A1628] text-white py-24 lg:py-32 px-4">
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
              <span className="text-gray-300">Notre histoire</span>
            </div>
            <h1 className="font-display font-bold text-4xl md:text-5xl lg:text-6xl mb-6 text-white">
              À propos de BYS Formation
            </h1>
            <p className="text-lg text-gray-400 max-w-3xl mx-auto leading-relaxed">
              La plateforme de référence pour réserver un stage de récupération de points permis,
              simplement et en toute confiance.
            </p>
          </div>
        </section>

        {/* ─── Stats bar rouge ─── */}
        <section className="py-5 px-4 bg-red-600">
          <div className="max-w-[1440px] mx-auto grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-8">
            {stats.map((s) => (
              <div key={s.label} className="flex items-center justify-center gap-3 text-white">
                <FontAwesomeIcon icon={s.icon} className="text-white/80 text-lg" />
                <div className="flex items-baseline gap-1.5">
                  <span className="text-2xl font-display font-bold">{s.value}</span>
                  <span className="text-sm text-red-100">{s.label}</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ─── Histoire + Mission ─── */}
        <section className="py-20 px-4 sm:px-8 bg-white">
          <div className="max-w-[1440px] mx-auto">
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              <div>
                <span className="text-blue-600 font-semibold text-xs uppercase tracking-widest">Notre histoire</span>
                <h2 className="font-display font-bold text-3xl md:text-4xl text-brand-text mt-2 mb-6">
                  Simplifier l&apos;accès aux stages de récupération de points
                </h2>
                <div className="space-y-4 text-gray-600 leading-relaxed text-sm">
                  <p>BYS Formation est née d&apos;un constat simple : réserver un stage de récupération de points permis en France restait une démarche complexe, opaque et souvent stressante pour les conducteurs.</p>
                  <p>Face à des informations dispersées, des prix peu transparents et des démarches administratives lourdes, nous avons créé une plateforme unique qui centralise l&apos;offre de stages agréés et simplifie chaque étape du parcours.</p>
                  <p>Depuis notre création, nous accompagnons des milliers de conducteurs dans leur démarche de récupération de points, tout en aidant les centres de formation à développer leur activité.</p>
                </div>
              </div>

              {/* Carte mission dark */}
              <div className="rounded-2xl p-8 lg:p-10 text-white relative overflow-hidden" style={{ background: "linear-gradient(135deg, #0A1628 0%, #0f2044 100%)", border: "1px solid rgba(255,255,255,0.08)" }}>
                <div className="absolute top-0 right-0 w-40 h-40 bg-blue-600/10 rounded-full blur-3xl" />
                <div className="w-12 h-12 rounded-xl bg-blue-600/20 flex items-center justify-center mb-5 border border-blue-500/30">
                  <FontAwesomeIcon icon={faGraduationCap} className="text-blue-400 text-xl" />
                </div>
                <h3 className="font-display font-bold text-2xl mb-3">Notre mission</h3>
                <p className="text-gray-400 text-sm leading-relaxed mb-6">
                  Rendre accessible et simple la réservation de stages agréés préfecture pour tous les conducteurs en France. Chaque automobiliste mérite un accès rapide, transparent et abordable à la récupération de ses points.
                </p>
                <ul className="space-y-3">
                  {[
                    "Centraliser l'offre de stages agréés",
                    "Garantir des prix justes et transparents",
                    "Simplifier la réservation en ligne",
                    "Accompagner les centres partenaires",
                  ].map((item) => (
                    <li key={item} className="flex items-center gap-3 text-sm text-gray-300">
                      <FontAwesomeIcon icon={faCheckCircle} className="text-green-400 w-4 h-4 shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* ─── Valeurs ─── */}
        <section className="py-20 px-4 sm:px-8 bg-[#F9FAFB]">
          <div className="max-w-[1440px] mx-auto">
            <div className="text-center mb-14">
              <span className="text-blue-600 font-semibold text-xs uppercase tracking-widest">Nos valeurs</span>
              <h2 className="font-display font-bold text-3xl md:text-4xl text-brand-text mt-2 mb-4">Ce qui nous guide au quotidien</h2>
              <p className="text-gray-500 max-w-xl mx-auto text-sm">Quatre piliers fondamentaux qui façonnent l&apos;expérience BYS Formation.</p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {values.map((v) => (
                <div key={v.title} className="bg-white rounded-2xl p-8 text-center hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 border border-brand-border">
                  <div className={`w-14 h-14 rounded-xl ${v.bg} flex items-center justify-center mx-auto mb-5`}>
                    <FontAwesomeIcon icon={v.icon} className={`text-2xl ${v.color}`} />
                  </div>
                  <h3 className="font-display font-bold text-lg text-brand-text mb-3">{v.title}</h3>
                  <p className="text-gray-500 text-sm leading-relaxed">{v.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ─── Équipe ─── */}
        <section className="py-20 px-4 sm:px-8 bg-white">
          <div className="max-w-[1440px] mx-auto text-center">
            <span className="text-blue-600 font-semibold text-xs uppercase tracking-widest">Notre équipe</span>
            <h2 className="font-display font-bold text-3xl md:text-4xl text-brand-text mt-2 mb-4">Une équipe passionnée par la sécurité routière</h2>
            <p className="text-gray-500 max-w-2xl mx-auto mb-12 text-sm">Derrière BYS Formation, une équipe pluridisciplinaire qui allie expertise en sécurité routière, technologie et service client.</p>
            <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
              {[
                { role: "Direction & Stratégie", description: "Pilotage de la vision produit et développement des partenariats avec les centres agréés.", icon: faBuilding },
                { role: "Technologie & Produit", description: "Conception et développement de la plateforme pour une expérience de réservation fluide et sécurisée.", icon: faGraduationCap },
                { role: "Support & Relation Client", description: "Accompagnement des stagiaires et des centres partenaires, du lundi au vendredi de 9h à 18h.", icon: faUsers },
              ].map((t) => (
                <div key={t.role} className="rounded-2xl p-8 text-left hover:shadow-lg transition-all duration-200" style={{ background: "linear-gradient(135deg, #0A1628 0%, #0f2044 100%)", border: "1px solid rgba(255,255,255,0.07)" }}>
                  <div className="w-12 h-12 rounded-xl bg-blue-600/20 flex items-center justify-center mb-5 border border-blue-500/30">
                    <FontAwesomeIcon icon={t.icon} className="text-blue-400 text-lg" />
                  </div>
                  <h3 className="font-display font-bold text-white mb-3">{t.role}</h3>
                  <p className="text-gray-400 text-sm leading-relaxed">{t.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ─── Certifications ─── */}
        <section className="py-20 px-4 sm:px-8 bg-[#F9FAFB]">
          <div className="max-w-[1440px] mx-auto">
            <div className="text-center mb-14">
              <span className="text-blue-600 font-semibold text-xs uppercase tracking-widest">Nos garanties</span>
              <h2 className="font-display font-bold text-3xl md:text-4xl text-brand-text mt-2 mb-4">Certifications & partenaires</h2>
              <p className="text-gray-500 max-w-xl mx-auto text-sm">BYS Formation travaille exclusivement avec des centres agréés et certifiés.</p>
            </div>
            <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
              {[
                { title: "Agréé Ministère de l'Intérieur", description: "Tous nos stages sont dispensés par des centres titulaires d'un agrément préfectoral, conformément au Code de la route.", icon: faShieldHalved },
                { title: "Certification Qualiopi", description: "Nos centres partenaires respectent les critères du Référentiel National Qualité, gage d'un enseignement de qualité.", icon: faAward },
              ].map((cert) => (
                <div key={cert.title} className="bg-white rounded-2xl border border-brand-border p-8 flex gap-5 hover:shadow-lg transition-all duration-200">
                  <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
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
        <section className="py-20 px-4 sm:px-8 bg-[#0A1628]">
          <div className="max-w-3xl mx-auto text-center">
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
            <p className="text-gray-400 mb-8 text-sm leading-relaxed max-w-xl mx-auto">
              Vous êtes un centre de formation agréé ? Développez votre activité et bénéficiez d&apos;une visibilité accrue auprès de milliers de conducteurs.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/inscription" className="inline-flex items-center gap-2 bg-red-600 text-white font-semibold px-8 py-3.5 rounded-xl hover:bg-red-700 transition-all shadow-lg shadow-red-600/20">
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
