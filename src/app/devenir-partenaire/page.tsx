import type { Metadata } from "next";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import PartnerLeadForm from "@/components/partenaires/PartnerLeadForm";
import { pageMetadata } from "@/lib/seo";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faHandshake,
  faUsers,
  faChartLine,
  faWallet,
  faCalendarCheck,
  faShieldHalved,
  faFileSignature,
  faArrowRight,
  faCircleCheck,
  faMagnifyingGlassLocation,
  faGaugeHigh,
  faLock,
  faQuoteLeft,
  faStar,
  faLandmarkFlag,
  faCreditCard,
  faUserShield,
} from "@fortawesome/free-solid-svg-icons";

export const dynamic = "force-static";

export const metadata: Metadata = pageMetadata({
  title: "Devenir centre partenaire — Remplissez vos stages de récupération de points",
  description:
    "Centres agréés : rejoignez BYS Formation et remplissez vos sessions de stage de récupération de points. Zéro frais d'inscription, visibilité nationale, paiements sécurisés. Recevez une proposition sous 48h.",
  path: "/devenir-partenaire",
  keywords: [
    "devenir centre partenaire",
    "référencer centre stage récupération points",
    "remplir sessions stage permis",
    "partenariat centre sensibilisation sécurité routière",
  ],
});

// ─── DATA ───────────────────────────────────────────────

const benefits = [
  {
    icon: faUsers,
    title: "Des stagiaires qualifiés",
    text: "Nous captons la demande sur tout le territoire et l'orientons vers vos sessions. Vous recevez des inscriptions prêtes à payer, pas des simples contacts.",
  },
  {
    icon: faCalendarCheck,
    title: "Des sessions mieux remplies",
    text: "Publiez vos dates, nous les mettons en avant auprès des conducteurs qui cherchent un stage près de chez eux. Fini les places vides.",
  },
  {
    icon: faWallet,
    title: "Vous gardez la majorité",
    text: "Aucun frais d'inscription. Une commission claire, prélevée uniquement sur les réservations réellement confirmées via la plateforme.",
  },
  {
    icon: faMagnifyingGlassLocation,
    title: "Une visibilité locale et SEO",
    text: "Votre centre apparaît sur nos pages ville et dans les résultats de recherche : une vitrine en ligne sans effort de votre côté.",
  },
  {
    icon: faGaugeHigh,
    title: "Zéro gestion administrative",
    text: "Convocations, attestations, émargement, encaissement : la plateforme automatise le suivi. Vous vous concentrez sur l'animation des stages.",
  },
  {
    icon: faChartLine,
    title: "Un pilotage en temps réel",
    text: "Un tableau de bord clair vous montre vos réservations, votre remplissage et vos revenus. Vous ajustez vos dates et vos prix quand vous voulez.",
  },
];

const steps = [
  {
    num: "01",
    icon: faFileSignature,
    title: "Vous déposez votre demande",
    text: "Vous remplissez le formulaire ci-dessous. Notre équipe vérifie votre agrément préfectoral et vous recontacte sous 48h ouvrées.",
  },
  {
    num: "02",
    icon: faCalendarCheck,
    title: "Vous publiez vos sessions",
    text: "Une fois validé, vous créez vos dates de stage en quelques clics. Elles sont immédiatement visibles sur la marketplace.",
  },
  {
    num: "03",
    icon: faWallet,
    title: "Vous encaissez, sereinement",
    text: "Les conducteurs réservent et paient en ligne. Vous êtes réglé automatiquement, sous quelques jours, après chaque stage.",
  },
];

const transparency = [
  { value: "0 €", label: "de frais d'inscription" },
  { value: "48h", label: "pour être recontacté" },
  { value: "Sans", label: "engagement de durée" },
  { value: "100%", label: "paiements sécurisés Stripe" },
];

const trustBadges = [
  { icon: faLandmarkFlag, label: "Centres agréés préfecture" },
  { icon: faCreditCard, label: "Paiements sécurisés Stripe" },
  { icon: faUserShield, label: "100% conforme RGPD" },
  { icon: faHandshake, label: "Sans engagement de durée" },
];

const testimonials = [
  {
    quote:
      "Nos sessions du samedi étaient rarement pleines. Depuis qu'on est référencés, on tourne à 90% de remplissage sans avoir à faire de pub nous-mêmes.",
    author: "Karim B.",
    role: "Gérant de centre agréé",
    location: "Cergy (95)",
  },
  {
    quote:
      "Ce qui m'a convaincu, c'est la transparence : zéro frais pour démarrer et une commission uniquement quand un stagiaire réserve vraiment. Aucun risque.",
    author: "Nathalie R.",
    role: "Responsable de centre",
    location: "Rouen (76)",
  },
  {
    quote:
      "Les convocations et l'émargement sont automatisés, je gagne un temps fou sur l'administratif. Je me concentre enfin sur l'animation des stages.",
    author: "Philippe M.",
    role: "Animateur BAFM",
    location: "Amiens (80)",
  },
];

const reassurance = [
  {
    icon: faShieldHalved,
    title: "Uniquement des centres agréés",
    text: "Nous vérifions systématiquement l'agrément préfectoral de chaque centre. Une exigence qui protège votre réputation autant que celle des stagiaires.",
  },
  {
    icon: faLock,
    title: "Vos données protégées",
    text: "Conformité RGPD stricte. Vos informations ne sont jamais revendues et servent uniquement à établir le partenariat.",
  },
  {
    icon: faHandshake,
    title: "Un vrai partenariat, pas un annuaire",
    text: "Une équipe dédiée vous accompagne au démarrage et reste joignable. Vous n'êtes pas une ligne dans une base de données.",
  },
];

// ─── PAGE ───────────────────────────────────────────────

export default function DevenirPartenairePage() {
  return (
    <div className="min-h-screen bg-[#F9FAFB]">
      <Header />

      <main>
        {/* ─── Hero ─── */}
        <section className="relative overflow-hidden bg-[#0A1628] text-white py-20 lg:py-28 px-4">
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                "radial-gradient(ellipse 60% 50% at 50% 35%, rgba(37,99,235,0.16) 0%, transparent 70%)",
            }}
          />
          <div className="absolute top-10 left-[8%] w-72 h-72 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-10 right-[12%] w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />

          <div className="absolute bottom-0 left-0 right-0 h-1 flex">
            <div className="flex-1 bg-blue-600" />
            <div className="flex-1 bg-white" />
            <div className="flex-1 bg-red-500" />
          </div>

          <div className="relative max-w-[1440px] mx-auto text-center">
            <div
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium mb-6 border"
              style={{ background: "rgba(255,255,255,0.07)", borderColor: "rgba(255,255,255,0.12)" }}
            >
              <FontAwesomeIcon icon={faHandshake} className="text-blue-400 text-xs" />
              <span className="text-gray-300">Espace partenaires — Centres agréés</span>
            </div>
            <h1 className="font-display font-bold text-4xl md:text-5xl lg:text-6xl mb-6 text-white leading-tight">
              Remplissez vos stages de
              <br className="hidden md:block" />{" "}
              récupération de <span className="text-blue-400">points</span>
            </h1>
            <p className="text-lg text-gray-400 max-w-2xl mx-auto leading-relaxed">
              BYS Formation connecte votre centre aux conducteurs qui cherchent un stage
              près de chez eux. Vous gagnez en visibilité et en remplissage —
              nous nous occupons du reste.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-10">
              <a
                href="#formulaire"
                className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-8 py-3.5 rounded-xl transition-all shadow-lg shadow-blue-600/25 hover:shadow-xl hover:shadow-blue-600/30"
              >
                Devenir partenaire
                <FontAwesomeIcon icon={faArrowRight} className="text-sm" />
              </a>
              <a
                href="#comment"
                className="inline-flex items-center gap-2 border border-white/20 hover:bg-white/5 text-white font-semibold px-8 py-3.5 rounded-xl transition-all"
              >
                Comment ça marche
              </a>
            </div>

            <div className="flex flex-wrap justify-center gap-x-10 gap-y-4 mt-12">
              {transparency.map((t) => (
                <div key={t.label} className="text-center">
                  <div className="font-display font-bold text-2xl md:text-3xl text-white">
                    {t.value}
                  </div>
                  <div className="text-gray-400 text-xs md:text-sm mt-0.5">{t.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ─── Trust strip ─── */}
        <section className="border-b border-brand-border bg-white">
          <div className="max-w-[1440px] mx-auto px-4 sm:px-8 py-6">
            <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-4">
              {trustBadges.map((b) => (
                <div key={b.label} className="flex items-center gap-2.5 text-gray-600">
                  <FontAwesomeIcon icon={b.icon} className="text-blue-600 w-4 h-4" />
                  <span className="text-sm font-medium">{b.label}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ─── Benefits ─── */}
        <section className="section">
          <div className="max-w-[1440px] mx-auto px-4 sm:px-8">
            <div className="text-center mb-14">
              <span className="text-brand-accent font-semibold text-sm uppercase tracking-wider">
                Pourquoi passer par nous
              </span>
              <h2 className="font-display font-bold text-3xl md:text-4xl text-brand-text mt-2 mb-4">
                Ce que BYS Formation change pour votre centre
              </h2>
              <p className="text-gray-500 max-w-2xl mx-auto">
                Vous êtes expert du stage de récupération de points. Notre métier, c&apos;est
                de vous amener des stagiaires et de vous simplifier la gestion.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {benefits.map((b) => (
                <div
                  key={b.title}
                  className="bg-white rounded-2xl border border-brand-border p-7 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300"
                >
                  <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center mb-5">
                    <FontAwesomeIcon icon={b.icon} className="text-blue-600 text-lg" />
                  </div>
                  <h3 className="font-display font-bold text-lg text-brand-text mb-2">
                    {b.title}
                  </h3>
                  <p className="text-gray-500 text-sm leading-relaxed">{b.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ─── How it works ─── */}
        <section id="comment" className="section bg-white scroll-mt-20">
          <div className="max-w-[1440px] mx-auto px-4 sm:px-8">
            <div className="text-center mb-14">
              <span className="text-brand-accent font-semibold text-sm uppercase tracking-wider">
                Un parcours transparent
              </span>
              <h2 className="font-display font-bold text-3xl md:text-4xl text-brand-text mt-2 mb-4">
                De la demande à votre premier stage rempli
              </h2>
              <p className="text-gray-500 max-w-2xl mx-auto">
                Trois étapes simples, aucune surprise. Vous savez à chaque instant ce qui
                se passe.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              {steps.map((s) => (
                <div key={s.num} className="relative">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 rounded-xl bg-[#0A1628] text-white flex items-center justify-center shrink-0">
                      <FontAwesomeIcon icon={s.icon} className="text-blue-400" />
                    </div>
                    <span className="font-display font-bold text-4xl text-blue-100">
                      {s.num}
                    </span>
                  </div>
                  <h3 className="font-display font-bold text-lg text-brand-text mb-2">
                    {s.title}
                  </h3>
                  <p className="text-gray-500 text-sm leading-relaxed">{s.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ─── Transparency band ─── */}
        <section className="py-16 px-4 sm:px-8">
          <div className="max-w-[1440px] mx-auto">
            <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-3xl p-10 lg:p-14 text-white relative overflow-hidden">
              <div className="absolute top-0 right-0 w-72 h-72 bg-white/10 rounded-full blur-3xl" />
              <div className="absolute bottom-0 left-0 w-80 h-80 bg-indigo-300/10 rounded-full blur-3xl" />
              <div className="relative grid lg:grid-cols-2 gap-10 items-center">
                <div>
                  <h2 className="font-display font-bold text-3xl md:text-4xl mb-4">
                    Un modèle clair, sans mauvaise surprise
                  </h2>
                  <p className="text-blue-100 leading-relaxed mb-6">
                    Pas de frais cachés, pas d&apos;abonnement obligatoire pour démarrer.
                    Vous ne payez une commission que sur les réservations réellement
                    apportées et confirmées. Si nous ne vous remplissons pas, vous ne
                    payez rien.
                  </p>
                  <ul className="space-y-3">
                    {[
                      "Inscription 100 % gratuite",
                      "Commission uniquement sur réservations confirmées",
                      "Aucun engagement de durée — vous partez quand vous voulez",
                      "Paiements sécurisés et versés automatiquement",
                    ].map((item) => (
                      <li key={item} className="flex items-center gap-3">
                        <FontAwesomeIcon icon={faCircleCheck} className="text-blue-200 shrink-0" />
                        <span className="text-sm text-blue-50">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="grid grid-cols-2 gap-5">
                  {transparency.map((t) => (
                    <div
                      key={t.label}
                      className="bg-white/10 backdrop-blur-sm border border-white/15 rounded-2xl p-6 text-center"
                    >
                      <div className="font-display font-bold text-3xl mb-1">{t.value}</div>
                      <div className="text-blue-100 text-xs leading-snug">{t.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ─── Reassurance ─── */}
        <section className="section bg-white">
          <div className="max-w-[1440px] mx-auto px-4 sm:px-8">
            <div className="text-center mb-14">
              <span className="text-brand-accent font-semibold text-sm uppercase tracking-wider">
                En toute confiance
              </span>
              <h2 className="font-display font-bold text-3xl md:text-4xl text-brand-text mt-2 mb-4">
                Un partenaire sérieux et exigeant
              </h2>
            </div>
            <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
              {reassurance.map((r) => (
                <div
                  key={r.title}
                  className="bg-[#F9FAFB] rounded-2xl border border-brand-border p-7"
                >
                  <div className="w-12 h-12 rounded-xl bg-white border border-brand-border flex items-center justify-center mb-5">
                    <FontAwesomeIcon icon={r.icon} className="text-blue-600 text-lg" />
                  </div>
                  <h3 className="font-display font-bold text-lg text-brand-text mb-2">
                    {r.title}
                  </h3>
                  <p className="text-gray-500 text-sm leading-relaxed">{r.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ─── Testimonials ─── */}
        <section className="section">
          <div className="max-w-[1440px] mx-auto px-4 sm:px-8">
            <div className="text-center mb-14">
              <span className="text-brand-accent font-semibold text-sm uppercase tracking-wider">
                Ils l&apos;ont fait
              </span>
              <h2 className="font-display font-bold text-3xl md:text-4xl text-brand-text mt-2 mb-4">
                Des centres partenaires qui remplissent leurs stages
              </h2>
              <p className="text-gray-500 max-w-2xl mx-auto">
                Ce que les gérants de centres agréés retiennent après avoir rejoint
                BYS Formation.
              </p>
            </div>
            <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
              {testimonials.map((t) => (
                <div
                  key={t.author}
                  className="bg-white rounded-2xl border border-brand-border p-7 flex flex-col hover:shadow-lg transition-all duration-300"
                >
                  <div className="flex items-center gap-1 mb-4 text-amber-400">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <FontAwesomeIcon key={i} icon={faStar} className="w-3.5 h-3.5" />
                    ))}
                  </div>
                  <FontAwesomeIcon icon={faQuoteLeft} className="text-2xl text-blue-100 mb-3" />
                  <p className="text-gray-600 leading-relaxed mb-6 text-sm flex-1">
                    {t.quote}
                  </p>
                  <div className="flex items-center gap-3 pt-4 border-t border-brand-border">
                    <div className="w-10 h-10 rounded-full bg-[#0A1628] flex items-center justify-center text-white font-bold text-sm">
                      {t.author.charAt(0)}
                    </div>
                    <div>
                      <div className="font-semibold text-brand-text text-sm">{t.author}</div>
                      <div className="text-gray-400 text-xs">
                        {t.role} — {t.location}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <p className="text-center text-gray-400 text-xs mt-8">
              Témoignages représentatifs de centres partenaires. Certains prénoms ont été modifiés.
            </p>
          </div>
        </section>

        {/* ─── Form ─── */}
        <section id="formulaire" className="section bg-white scroll-mt-20">
          <div className="max-w-[1440px] mx-auto px-4 sm:px-8">
            <div className="grid lg:grid-cols-5 gap-10 items-start">
              <div className="lg:col-span-2">
                <span className="text-brand-accent font-semibold text-sm uppercase tracking-wider">
                  Rejoignez le réseau
                </span>
                <h2 className="font-display font-bold text-3xl md:text-4xl text-brand-text mt-2 mb-4">
                  Parlons de votre centre
                </h2>
                <p className="text-gray-500 leading-relaxed mb-8">
                  Laissez-nous vos coordonnées : notre équipe partenariats vérifie votre
                  agrément et revient vers vous sous 48h ouvrées avec une proposition
                  adaptée à votre volume et votre zone.
                </p>

                <div className="space-y-5">
                  {[
                    {
                      icon: faFileSignature,
                      title: "1. Vous remplissez le formulaire",
                      text: "Deux minutes suffisent. Aucune pièce à fournir à cette étape.",
                    },
                    {
                      icon: faShieldHalved,
                      title: "2. Nous vérifions votre agrément",
                      text: "Un échange rapide pour confirmer votre éligibilité.",
                    },
                    {
                      icon: faCalendarCheck,
                      title: "3. Vous publiez vos premières sessions",
                      text: "Votre centre devient visible et vos dates réservables.",
                    },
                  ].map((step) => (
                    <div key={step.title} className="flex gap-4">
                      <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
                        <FontAwesomeIcon icon={step.icon} className="text-blue-600 w-4 h-4" />
                      </div>
                      <div>
                        <p className="font-semibold text-brand-text text-sm">{step.title}</p>
                        <p className="text-gray-500 text-sm">{step.text}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="lg:col-span-3">
                <PartnerLeadForm />
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
