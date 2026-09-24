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
  faFileArrowDown,
} from "@fortawesome/free-solid-svg-icons";

export const dynamic = "force-static";

export const metadata: Metadata = pageMetadata({
  title: "Devenir centre partenaire — Remplissez vos stages de récupération de points",
  description:
    "Centres agréés : rejoignez BYS Permis et remplissez vos sessions de stage de récupération de points. Zéro frais d'inscription, visibilité nationale, paiements sécurisés. Recevez une proposition sous 24h.",
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
    text: "Aucun frais d'inscription, aucun abonnement. Vous conservez 85 % du prix du stage : 15 % de commission, prélevés uniquement sur les réservations confirmées via la plateforme.",
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
    text: "Vous remplissez le formulaire ci-dessous. Notre équipe vérifie votre agrément préfectoral et vous recontacte sous 24h ouvrées.",
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
  { value: "15 %", label: "de commission fixe, c'est tout" },
  { value: "0 €", label: "de frais d'inscription" },
  { value: "24h", label: "pour être recontacté" },
  { value: "Sans", label: "engagement de durée" },
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
        <section className="relative overflow-hidden bg-brand-navy text-white py-20 lg:py-28 px-4">
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                "radial-gradient(ellipse 60% 50% at 50% 35%, rgba(96,165,250,0.30) 0%, transparent 70%)",
            }}
          />
          <div className="absolute top-10 left-[8%] w-72 h-72 bg-blue-400/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-10 right-[12%] w-64 h-64 bg-blue-300/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute inset-0 bg-grid-white mask-fade-radial pointer-events-none" aria-hidden="true" />

          <div className="absolute top-0 left-0 right-0 h-1 flex">
            <div className="flex-1 bg-blue-600" />
            <div className="flex-1 bg-white" />
            <div className="flex-1 bg-red-500" />
          </div>

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
              <span className="text-blue-50">Espace partenaires — Centres agréés</span>
            </div>
            <h1 className="font-display font-bold text-4xl md:text-5xl lg:text-6xl mb-6 text-white leading-tight">
              Remplissez vos stages de
              <br className="hidden md:block" />{" "}
              récupération de <span className="text-blue-400">points</span>
            </h1>
            <p className="text-lg text-blue-100/80 max-w-2xl mx-auto leading-relaxed">
              BYS Permis connecte votre centre aux conducteurs qui cherchent un stage
              près de chez eux. Vous gagnez en visibilité et en remplissage —
              nous nous occupons du reste.
            </p>

            <div className="inline-flex flex-wrap items-center justify-center gap-x-2 gap-y-1 mt-6 px-5 py-2.5 rounded-2xl bg-white/10 border border-blue-300/30 ring-4 ring-blue-400/10 text-sm sm:text-base">
              <span className="font-display font-bold text-white text-lg sm:text-xl">Commission fixe de 15 %</span>
              <span className="text-blue-100/85">sur les réservations confirmées. Pas d&apos;abonnement, pas de frais cachés.</span>
            </div>

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

            <a
              href="/api/brochure-partenaire"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-blue-100/80 hover:text-white text-sm font-medium mt-6 transition-colors"
            >
              <FontAwesomeIcon icon={faFileArrowDown} className="text-xs" />
              Télécharger la brochure partenaire (PDF)
            </a>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 max-w-4xl mx-auto mt-12">
              {transparency.map((t) => (
                <div
                  key={t.label}
                  className="text-center rounded-2xl bg-white/[0.07] border border-white/15 px-3 py-4 sm:py-5 backdrop-blur-sm"
                >
                  <div className="number-gradient-light text-2xl md:text-3xl">
                    {t.value}
                  </div>
                  <div className="text-blue-100/85 text-xs md:text-sm mt-1.5 leading-snug">{t.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ─── Trust strip ─── */}
        <section className="border-b border-blue-100 bg-white">
          <div className="max-w-[1440px] mx-auto px-4 sm:px-8 py-6">
            <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-4">
              {trustBadges.map((b) => (
                <div key={b.label} className="flex items-center gap-3 text-gray-700">
                  <span className="icon-tile-soft w-9 h-9 rounded-lg">
                    <FontAwesomeIcon icon={b.icon} className="w-4 h-4" />
                  </span>
                  <span className="text-sm font-semibold">{b.label}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ─── Benefits ─── */}
        <section className="section relative bg-section-tint overflow-hidden">
          <div className="halo halo-blue w-[28rem] h-[28rem] top-1/4 -right-56" aria-hidden="true" />
          <div className="absolute inset-x-0 top-0 h-72 bg-dots-blue mask-fade-radial opacity-70" aria-hidden="true" />
          <div className="relative max-w-[1440px] mx-auto px-4 sm:px-8">
            <div className="text-center mb-14">
              <span className="eyebrow">
                Pourquoi passer par nous
              </span>
              <h2 className="font-display font-bold text-3xl md:text-4xl text-brand-text mt-4 mb-4">
                Ce que BYS Permis change <span className="title-mark">pour votre centre</span>
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
                  className="card-lift card-accent-top group p-7"
                >
                  <div className="icon-tile w-12 h-12 rounded-xl mb-5 mt-1">
                    <FontAwesomeIcon icon={b.icon} className="text-lg" />
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
        <section id="comment" className="section relative bg-white scroll-mt-20 overflow-hidden">
          <div className="absolute inset-0 bg-grid-blue mask-fade-y" aria-hidden="true" />
          <div className="relative max-w-[1440px] mx-auto px-4 sm:px-8">
            <div className="text-center mb-14">
              <span className="eyebrow">
                Un parcours transparent
              </span>
              <h2 className="font-display font-bold text-3xl md:text-4xl text-brand-text mt-4 mb-4">
                De la demande à <span className="title-mark">votre premier stage</span> rempli
              </h2>
              <p className="text-gray-500 max-w-2xl mx-auto">
                Trois étapes simples, aucune surprise. Vous savez à chaque instant ce qui
                se passe.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
              {steps.map((s) => (
                <div key={s.num} className="card-lift group relative p-7">
                  <div className="flex items-center justify-between gap-4 mb-5">
                    <div className="icon-tile w-12 h-12 rounded-xl">
                      <FontAwesomeIcon icon={s.icon} />
                    </div>
                    <span className="number-gradient text-5xl" aria-hidden="true">
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
            <div className="bg-gradient-to-br from-blue-600 via-blue-700 to-brand-navy rounded-3xl p-6 sm:p-10 lg:p-14 text-white relative overflow-hidden shadow-2xl shadow-blue-900/25">
              <div className="absolute inset-0 bg-dots-white" aria-hidden="true" />
              <div className="absolute top-0 right-0 w-72 h-72 bg-white/10 rounded-full blur-3xl" />
              <div className="absolute bottom-0 left-0 w-80 h-80 bg-blue-300/15 rounded-full blur-3xl" />
              <div className="absolute inset-x-0 top-0 tricolore-rule" aria-hidden="true" />
              <div className="relative grid lg:grid-cols-2 gap-10 items-center">
                <div>
                  <h2 className="font-display font-bold text-3xl md:text-4xl mb-4">
                    Un modèle clair, sans mauvaise surprise
                  </h2>
                  <p className="text-blue-100 leading-relaxed mb-6">
                    Pas de frais cachés, aucun abonnement. Vous ne payez que 15 %
                    de commission sur les réservations réellement apportées et
                    confirmées, et vos revenus vous sont versés chaque semaine. Si
                    nous ne vous remplissons pas, vous ne payez rien.
                  </p>
                  <ul className="space-y-3">
                    {[
                      "Inscription 100 % gratuite",
                      "15 % de commission, uniquement sur réservations confirmées",
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
                <div className="grid grid-cols-2 gap-3 sm:gap-5">
                  {transparency.map((t) => (
                    <div
                      key={t.label}
                      className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-4 sm:p-6 text-center transition-transform duration-200 hover:-translate-y-1 motion-reduce:hover:translate-y-0"
                    >
                      <div className="number-gradient-light text-3xl sm:text-4xl mb-1.5">{t.value}</div>
                      <div className="text-blue-100 text-xs leading-snug">{t.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ─── Reassurance ─── */}
        <section className="section relative bg-white overflow-hidden">
          <div className="relative max-w-[1440px] mx-auto px-4 sm:px-8">
            <div className="text-center mb-14">
              <span className="eyebrow">
                En toute confiance
              </span>
              <h2 className="font-display font-bold text-3xl md:text-4xl text-brand-text mt-4 mb-4">
                Un partenaire <span className="title-mark">sérieux et exigeant</span>
              </h2>
            </div>
            <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
              {reassurance.map((r) => (
                <div
                  key={r.title}
                  className="card-lift card-accent-left group p-7 bg-gradient-to-br from-white to-blue-50/70"
                >
                  <div className="icon-tile w-12 h-12 rounded-xl mb-5">
                    <FontAwesomeIcon icon={r.icon} className="text-lg" />
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
        <section className="section relative bg-section-blue overflow-hidden">
          <div className="halo halo-blue w-96 h-96 top-1/4 -left-56" aria-hidden="true" />
          <div className="relative max-w-[1440px] mx-auto px-4 sm:px-8">
            <div className="text-center mb-14">
              <span className="eyebrow">
                Ils l&apos;ont fait
              </span>
              <h2 className="font-display font-bold text-3xl md:text-4xl text-brand-text mt-4 mb-4">
                Des centres partenaires qui <span className="title-mark">remplissent leurs stages</span>
              </h2>
              <p className="text-gray-500 max-w-2xl mx-auto">
                Ce que les gérants de centres agréés retiennent après avoir rejoint
                BYS Permis.
              </p>
            </div>
            <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
              {testimonials.map((t) => (
                <div
                  key={t.author}
                  className="card-lift card-accent-top p-7 flex flex-col"
                >
                  <div className="flex items-center gap-1 mb-4 mt-1 text-blue-500">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <FontAwesomeIcon key={i} icon={faStar} className="w-3.5 h-3.5" />
                    ))}
                  </div>
                  <FontAwesomeIcon icon={faQuoteLeft} className="text-3xl text-blue-200 mb-3" />
                  <p className="text-gray-700 leading-relaxed mb-6 text-sm flex-1">
                    {t.quote}
                  </p>
                  <div className="flex items-center gap-3 pt-4 border-t border-blue-100">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-brand-navy flex items-center justify-center text-white font-bold text-sm ring-2 ring-blue-100">
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
            <p className="text-center text-gray-500 text-xs mt-8">
              Témoignages représentatifs de centres partenaires. Certains prénoms ont été modifiés.
            </p>
          </div>
        </section>

        {/* ─── Form ─── */}
        <section id="formulaire" className="section relative bg-section-tint scroll-mt-20 overflow-hidden">
          <div className="absolute inset-x-0 top-0 tricolore-rule-light" aria-hidden="true" />
          <div className="halo halo-blue w-[30rem] h-[30rem] top-1/4 -right-64" aria-hidden="true" />
          <div className="relative max-w-[1440px] mx-auto px-4 sm:px-8">
            <div className="grid lg:grid-cols-5 gap-10 items-start">
              <div className="lg:col-span-2">
                <span className="eyebrow">
                  Rejoignez le réseau
                </span>
                <h2 className="font-display font-bold text-3xl md:text-4xl text-brand-text mt-4 mb-4">
                  Parlons de <span className="title-mark">votre centre</span>
                </h2>
                <p className="text-gray-500 leading-relaxed mb-8">
                  Laissez-nous vos coordonnées : notre équipe partenariats vérifie votre
                  agrément et revient vers vous sous 24h ouvrées avec une proposition
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
                    <div key={step.title} className="flex gap-4 bg-white/80 border border-blue-100 rounded-2xl p-4 shadow-sm">
                      <div className="icon-tile w-10 h-10 rounded-xl">
                        <FontAwesomeIcon icon={step.icon} className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="font-semibold text-brand-text text-sm">{step.title}</p>
                        <p className="text-gray-500 text-sm">{step.text}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="lg:col-span-3 rounded-3xl shadow-2xl shadow-blue-900/10">
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
