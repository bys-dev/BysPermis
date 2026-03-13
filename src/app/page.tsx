"use client";

import Link from "next/link";
import Image from "next/image";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faMagnifyingGlass,
  faLocationDot,
  faChevronDown,
  faCode,
  faPalette,
  faChartLine,
  faBriefcase,
  faLanguage,
  faCoins,
  faShieldHalved,
  faGraduationCap,
  faArrowRight,
  faStar,
  faShield,
  faUsers,
  faClock,
  faHeadset,
  faCertificate,
  faGauge,
  faBuilding,
  faCircleCheck,
  faWallet,
  faCheck,
  faLock,
} from "@fortawesome/free-solid-svg-icons";
import { faCalendar, faEnvelope } from "@fortawesome/free-regular-svg-icons";

// ─── DATA ────────────────────────────────────────────────

const categories = [
  { name: "Développement", desc: "Web, Mobile, Data Science", count: "847 formations", icon: faCode, from: "from-blue-50", to: "to-blue-100", border: "border-blue-200", iconBg: "bg-brand-accent", textColor: "text-brand-accent" },
  { name: "Design & UX", desc: "UI/UX, Graphisme, Motion", count: "523 formations", icon: faPalette, from: "from-purple-50", to: "to-purple-100", border: "border-purple-200", iconBg: "bg-purple-500", textColor: "text-purple-600" },
  { name: "Marketing Digital", desc: "SEO, Social Media, Analytics", count: "692 formations", icon: faChartLine, from: "from-green-50", to: "to-green-100", border: "border-green-200", iconBg: "bg-green-500", textColor: "text-green-600" },
  { name: "Management", desc: "Leadership, RH, Gestion", count: "438 formations", icon: faBriefcase, from: "from-orange-50", to: "to-orange-100", border: "border-orange-200", iconBg: "bg-orange-500", textColor: "text-orange-600" },
  { name: "Langues", desc: "Anglais, Espagnol, Allemand", count: "756 formations", icon: faLanguage, from: "from-red-50", to: "to-red-100", border: "border-red-200", iconBg: "bg-red-500", textColor: "text-red-600" },
  { name: "Finance & Compta", desc: "Comptabilité, Audit, Fiscalité", count: "312 formations", icon: faCoins, from: "from-teal-50", to: "to-teal-100", border: "border-teal-200", iconBg: "bg-teal-500", textColor: "text-teal-600" },
  { name: "Cybersécurité", desc: "Sécurité réseau, Ethical hacking", count: "284 formations", icon: faShieldHalved, from: "from-indigo-50", to: "to-indigo-100", border: "border-indigo-200", iconBg: "bg-indigo-500", textColor: "text-indigo-600" },
  { name: "Autres domaines", desc: "Découvrez plus de catégories", count: "1,200+ formations", icon: faGraduationCap, from: "from-pink-50", to: "to-pink-100", border: "border-pink-200", iconBg: "bg-pink-500", textColor: "text-pink-600" },
];

const featuredCourses = [
  {
    title: "Développeur Full Stack JavaScript",
    desc: "Maîtrisez React, Node.js et MongoDB pour créer des applications web modernes et performantes de A à Z.",
    tag: "Développement", tagColor: "bg-blue-50 text-brand-accent",
    hours: "35h", rating: "4.9", reviews: "234",
    centre: "Tech Academy Paris",
    oldPrice: "3 500 €", price: "2 800 €",
    gradient: "from-blue-400 to-blue-600",
    image: "https://storage.googleapis.com/uxpilot-auth.appspot.com/367a18e619-2cd1e34f55b2ede73d4a.png",
    avatar: "https://storage.googleapis.com/uxpilot-auth.appspot.com/avatars/avatar-2.jpg",
  },
  {
    title: "UI/UX Designer Professionnel",
    desc: "Apprenez à concevoir des interfaces utilisateur exceptionnelles avec Figma, les principes UX et le design thinking.",
    tag: "Design", tagColor: "bg-purple-50 text-purple-600",
    hours: "28h", rating: "4.8", reviews: "189",
    centre: "Design Institute",
    oldPrice: "2 900 €", price: "2 400 €",
    gradient: "from-purple-400 to-purple-600",
    image: "https://storage.googleapis.com/uxpilot-auth.appspot.com/d50d1467a4-1f84f3c2ed1fd7f14fc9.png",
    avatar: "https://storage.googleapis.com/uxpilot-auth.appspot.com/avatars/avatar-5.jpg",
  },
  {
    title: "Expert Marketing Digital",
    desc: "Formation complète en SEO, SEA, Social Media Marketing et Analytics pour booster votre carrière digitale.",
    tag: "Marketing", tagColor: "bg-green-50 text-green-600",
    hours: "42h", rating: "4.7", reviews: "156",
    centre: "Digital School",
    oldPrice: "3 200 €", price: "2 600 €",
    gradient: "from-green-400 to-green-600",
    image: "https://storage.googleapis.com/uxpilot-auth.appspot.com/3808a2bf47-70908830ee7b06b1acd6.png",
    avatar: "https://storage.googleapis.com/uxpilot-auth.appspot.com/avatars/avatar-8.jpg",
  },
];

const whyUsItems = [
  { icon: faShield, title: "Formations certifiées", desc: "Tous nos centres sont certifiés Qualiopi et nos formations sont éligibles au CPF pour un financement simplifié.", color: "bg-blue-50", iconColor: "text-brand-accent", hoverBg: "group-hover:bg-brand-accent" },
  { icon: faUsers, title: "Formateurs experts", desc: "Apprenez auprès de professionnels reconnus dans leur domaine avec une expérience terrain significative.", color: "bg-purple-50", iconColor: "text-purple-500", hoverBg: "group-hover:bg-purple-500" },
  { icon: faClock, title: "Flexibilité totale", desc: "Choisissez entre formations en présentiel, à distance ou en mode hybride selon vos contraintes.", color: "bg-green-50", iconColor: "text-green-500", hoverBg: "group-hover:bg-green-500" },
  { icon: faHeadset, title: "Support dédié", desc: "Une équipe à votre écoute avant, pendant et après votre formation pour garantir votre réussite.", color: "bg-orange-50", iconColor: "text-orange-500", hoverBg: "group-hover:bg-orange-500" },
  { icon: faCertificate, title: "Certification reconnue", desc: "Obtenez des certifications valorisables sur le marché du travail et reconnues par les entreprises.", color: "bg-teal-50", iconColor: "text-teal-500", hoverBg: "group-hover:bg-teal-500" },
  { icon: faGauge, title: "Réservation instantanée", desc: "Réservez votre place en quelques clics et recevez votre confirmation immédiatement par email.", color: "bg-red-50", iconColor: "text-red-500", hoverBg: "group-hover:bg-red-500" },
];

const testimonials = [
  { name: "Sarah Martinez", role: "Développeuse Full Stack", text: "Grâce à Formation Central, j'ai pu me reconvertir dans le développement web. La formation était complète, les formateurs excellents et j'ai trouvé un emploi 2 semaines après ma certification !", formation: "Développeur Full Stack", stars: 5, avatar: "https://storage.googleapis.com/uxpilot-auth.appspot.com/avatars/avatar-1.jpg" },
  { name: "Thomas Dubois", role: "Chef de projet digital", text: "La plateforme est intuitive, le paiement CPF simplifié et le suivi pendant la formation impeccable. Je recommande vivement pour toute montée en compétences professionnelle.", formation: "Gestion de projet Agile", stars: 5, avatar: "https://storage.googleapis.com/uxpilot-auth.appspot.com/avatars/avatar-3.jpg" },
  { name: "Marie Lefevre", role: "UX Designer", text: "J'ai adoré la flexibilité offerte avec le mode hybride. Les outils pédagogiques sont modernes et les projets pratiques m'ont vraiment permis de progresser rapidement.", formation: "UI/UX Designer", stars: 5, avatar: "https://storage.googleapis.com/uxpilot-auth.appspot.com/avatars/avatar-6.jpg" },
  { name: "Antoine Bernard", role: "Data Analyst", text: "Formation très complète en Data Science. Le contenu est dense mais bien structuré. Le formateur était disponible et répondait rapidement à nos questions.", formation: "Data Science avec Python", stars: 4, avatar: "https://storage.googleapis.com/uxpilot-auth.appspot.com/avatars/avatar-4.jpg" },
  { name: "Julie Moreau", role: "Community Manager", text: "Le processus de réservation était super simple et le financement CPF s'est fait sans accroc. La formation m'a permis de décrocher le poste que je visais.", formation: "Social Media Marketing", stars: 5, avatar: "https://storage.googleapis.com/uxpilot-auth.appspot.com/avatars/avatar-7.jpg" },
  { name: "Lucas Petit", role: "DevOps Engineer", text: "Excellente expérience ! Les labs pratiques étaient très bien conçus et m'ont permis d'acquérir des compétences directement applicables en entreprise.", formation: "DevOps & Cloud AWS", stars: 5, avatar: "https://storage.googleapis.com/uxpilot-auth.appspot.com/avatars/avatar-9.jpg" },
];

const steps = [
  { number: "1", title: "Recherchez", desc: "Utilisez notre moteur de recherche pour trouver la formation qui correspond à vos besoins et objectifs.", bg: "bg-brand-accent" },
  { number: "2", title: "Comparez", desc: "Consultez les détails, les avis et les programmes pour choisir la formation qui vous convient le mieux.", bg: "bg-purple-500" },
  { number: "3", title: "Réservez", desc: "Inscrivez-vous en quelques clics et utilisez votre CPF pour financer votre formation facilement.", bg: "bg-green-500" },
  { number: "4", title: "Formez-vous", desc: "Commencez votre formation et bénéficiez d'un accompagnement personnalisé jusqu'à la certification.", bg: "bg-orange-500" },
];

const faqItems = [
  "Comment utiliser mon CPF pour financer une formation ?",
  "Puis-je annuler ma réservation ?",
  "Les formations sont-elles certifiées ?",
  "Quelle est la différence entre présentiel et distanciel ?",
  "Comment contacter le support ?",
  "Recevrai-je un certificat à la fin de ma formation ?",
];

// ─── COMPONENT ───────────────────────────────────────────

export default function Home() {
  return (
    <>
      <Header />
      <main>
        {/* ═══ HERO ═══ */}
        <section className="bg-linear-to-b from-white to-brand-bg pt-20 pb-24 px-8 min-h-[680px] flex items-center">
          <div className="max-w-[1440px] mx-auto w-full">
            <div className="max-w-4xl mx-auto text-center">
              <div className="inline-flex items-center px-4 py-2 bg-blue-50 rounded-full mb-6">
                <span className="text-sm font-medium text-brand-accent">✨ Trouvez votre formation idéale</span>
              </div>
              <h1 className="font-display font-bold text-4xl sm:text-5xl lg:text-6xl text-brand-text mb-6 leading-tight">
                Accédez aux meilleures<br />formations professionnelles
              </h1>
              <p className="text-lg sm:text-xl text-gray-600 mb-12 leading-relaxed">
                Découvrez plus de 5 000 formations certifiées Qualiopi et CPF.<br className="hidden sm:block" />
                Réservez en quelques clics et démarrez votre montée en compétences.
              </p>

              {/* Search Card */}
              <div className="bg-white rounded-2xl shadow-xl border border-brand-border p-6 sm:p-8 max-w-5xl mx-auto">
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
                  <div className="sm:col-span-5">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Quelle formation ?</label>
                    <div className="relative">
                      <FontAwesomeIcon icon={faMagnifyingGlass} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input type="text" placeholder="Ex: Développement web, Marketing digital..." className="w-full pl-12 pr-4 py-3.5 border border-brand-border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-accent focus:border-transparent text-brand-text" />
                    </div>
                  </div>
                  <div className="sm:col-span-3">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Où ?</label>
                    <div className="relative">
                      <FontAwesomeIcon icon={faLocationDot} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input type="text" placeholder="Ville ou région" className="w-full pl-12 pr-4 py-3.5 border border-brand-border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-accent focus:border-transparent text-brand-text" />
                    </div>
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Quand ?</label>
                    <div className="relative">
                      <FontAwesomeIcon icon={faCalendar} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input type="text" placeholder="Date" className="w-full pl-12 pr-4 py-3.5 border border-brand-border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-accent focus:border-transparent text-brand-text" />
                    </div>
                  </div>
                  <div className="sm:col-span-2 flex items-end">
                    <button className="w-full bg-brand-accent text-white py-3.5 rounded-lg font-medium hover:bg-brand-accent-hover transition-colors shadow-lg shadow-blue-500/30">
                      Rechercher
                    </button>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between mt-6 pt-6 border-t border-brand-border gap-4">
                  <div className="flex items-center space-x-6">
                    <label className="flex items-center cursor-pointer">
                      <input type="checkbox" className="w-4 h-4 text-brand-accent border-brand-border rounded focus:ring-brand-accent" />
                      <span className="ml-2 text-sm text-gray-600">Éligible CPF</span>
                    </label>
                    <label className="flex items-center cursor-pointer">
                      <input type="checkbox" className="w-4 h-4 text-brand-accent border-brand-border rounded focus:ring-brand-accent" />
                      <span className="ml-2 text-sm text-gray-600">À distance</span>
                    </label>
                    <label className="flex items-center cursor-pointer">
                      <input type="checkbox" className="w-4 h-4 text-brand-accent border-brand-border rounded focus:ring-brand-accent" />
                      <span className="ml-2 text-sm text-gray-600">En présentiel</span>
                    </label>
                  </div>
                  <button className="text-brand-accent text-sm font-medium hover:underline flex items-center">
                    <span>Plus de filtres</span>
                    <FontAwesomeIcon icon={faChevronDown} className="ml-2 text-xs" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ═══ CATEGORIES ═══ */}
        <section className="py-20 px-8 bg-white">
          <div className="max-w-[1440px] mx-auto">
            <div className="text-center mb-12">
              <h2 className="font-display font-bold text-3xl sm:text-4xl text-brand-text mb-4">Catégories populaires</h2>
              <p className="text-lg text-gray-600">Explorez nos formations par domaine d&apos;expertise</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {categories.map((cat) => (
                <Link
                  key={cat.name}
                  href="/formations"
                  className={`bg-linear-to-br ${cat.from} ${cat.to} rounded-2xl p-8 border ${cat.border} hover:shadow-xl transition-all cursor-pointer group`}
                >
                  <div className={`w-14 h-14 ${cat.iconBg} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                    <FontAwesomeIcon icon={cat.icon} className="text-white text-2xl" />
                  </div>
                  <h3 className="font-display font-semibold text-xl text-brand-text mb-2">{cat.name}</h3>
                  <p className="text-gray-600 text-sm mb-4">{cat.desc}</p>
                  <div className="flex items-center justify-between">
                    <span className={`text-sm font-medium ${cat.textColor}`}>{cat.count}</span>
                    <FontAwesomeIcon icon={faArrowRight} className={`${cat.textColor} group-hover:translate-x-1 transition-transform`} />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* ═══ FEATURED COURSES ═══ */}
        <section className="py-20 px-8 bg-brand-bg">
          <div className="max-w-[1440px] mx-auto">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-12 gap-4">
              <div>
                <h2 className="font-display font-bold text-3xl sm:text-4xl text-brand-text mb-2">Formations en vedette</h2>
                <p className="text-lg text-gray-600">Les formations les plus populaires ce mois-ci</p>
              </div>
              <Link href="/formations" className="flex items-center space-x-2 text-brand-accent font-medium hover:underline">
                <span>Voir toutes les formations</span>
                <FontAwesomeIcon icon={faArrowRight} />
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {featuredCourses.map((course) => (
                <div key={course.title} className="bg-white rounded-2xl border border-brand-border overflow-hidden hover:shadow-xl transition-all group cursor-pointer">
                  <div className={`relative h-48 bg-linear-to-br ${course.gradient} overflow-hidden`}>
                    <Image src={course.image} alt={course.title} fill className="object-cover" />
                    <div className="absolute top-4 right-4 bg-white px-3 py-1 rounded-full text-xs font-semibold text-brand-accent">CPF</div>
                    <div className="absolute top-4 left-4 bg-black/50 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-medium text-white">
                      <FontAwesomeIcon icon={faStar} className="text-yellow-400 mr-1" />
                      {course.rating} ({course.reviews})
                    </div>
                  </div>
                  <div className="p-6">
                    <div className="flex items-center space-x-2 mb-3">
                      <span className={`px-3 py-1 ${course.tagColor} text-xs font-medium rounded-full`}>{course.tag}</span>
                      <span className="px-3 py-1 bg-gray-100 text-gray-600 text-xs font-medium rounded-full">{course.hours}</span>
                    </div>
                    <h3 className="font-display font-semibold text-xl text-brand-text mb-2 group-hover:text-brand-accent transition-colors">
                      {course.title}
                    </h3>
                    <p className="text-gray-600 text-sm mb-4 line-clamp-2">{course.desc}</p>
                    <div className="flex items-center justify-between pt-4 border-t border-brand-border">
                      <div className="flex items-center space-x-2">
                        <Image src={course.avatar} alt={course.centre} width={32} height={32} className="rounded-full" />
                        <span className="text-sm font-medium text-gray-700">{course.centre}</span>
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-gray-500 line-through">{course.oldPrice}</div>
                        <div className="text-lg font-bold text-brand-text">{course.price}</div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ═══ WHY US ═══ */}
        <section className="py-24 px-8 bg-white">
          <div className="max-w-[1440px] mx-auto">
            <div className="text-center mb-16">
              <h2 className="font-display font-bold text-3xl sm:text-4xl text-brand-text mb-4">Pourquoi Formation Central ?</h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                La plateforme de référence pour votre développement professionnel
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {whyUsItems.map((item) => (
                <div key={item.title} className="text-center group">
                  <div className={`w-20 h-20 ${item.color} rounded-2xl flex items-center justify-center mx-auto mb-6 ${item.hoverBg} transition-colors`}>
                    <FontAwesomeIcon icon={item.icon} className={`text-4xl ${item.iconColor} group-hover:text-white transition-colors`} />
                  </div>
                  <h3 className="font-display font-semibold text-xl text-brand-text mb-3">{item.title}</h3>
                  <p className="text-gray-600 leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ═══ STATS ═══ */}
        <section className="py-20 px-8 bg-linear-to-br from-brand-accent to-blue-700">
          <div className="max-w-[1440px] mx-auto">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-12">
              {[
                { value: "5,000+", label: "Formations disponibles" },
                { value: "850+", label: "Centres partenaires" },
                { value: "45,000+", label: "Élèves formés" },
                { value: "4.8/5", label: "Satisfaction moyenne" },
              ].map((stat) => (
                <div key={stat.label} className="text-center">
                  <div className="text-4xl lg:text-5xl font-display font-bold text-white mb-2">{stat.value}</div>
                  <div className="text-blue-100 text-lg">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ═══ TESTIMONIALS ═══ */}
        <section className="py-24 px-8 bg-brand-bg">
          <div className="max-w-[1440px] mx-auto">
            <div className="text-center mb-16">
              <h2 className="font-display font-bold text-3xl sm:text-4xl text-brand-text mb-4">Ils ont réussi avec nous</h2>
              <p className="text-lg text-gray-600">Découvrez les témoignages de nos élèves</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {testimonials.map((t) => (
                <div key={t.name} className="bg-white rounded-2xl p-8 border border-brand-border hover:shadow-xl transition-all">
                  <div className="flex items-center mb-6">
                    <Image src={t.avatar} alt={t.name} width={64} height={64} className="rounded-full mr-4" />
                    <div>
                      <div className="font-semibold text-brand-text">{t.name}</div>
                      <div className="text-sm text-gray-600">{t.role}</div>
                    </div>
                  </div>
                  <div className="flex items-center mb-4">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <FontAwesomeIcon key={i} icon={faStar} className={i < t.stars ? "text-yellow-400" : "text-gray-300"} />
                    ))}
                  </div>
                  <p className="text-gray-700 leading-relaxed mb-4">&ldquo;{t.text}&rdquo;</p>
                  <div className="text-sm text-gray-500">Formation suivie : {t.formation}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ═══ HOW IT WORKS ═══ */}
        <section className="py-24 px-8 bg-white">
          <div className="max-w-[1440px] mx-auto">
            <div className="text-center mb-16">
              <h2 className="font-display font-bold text-3xl sm:text-4xl text-brand-text mb-4">Comment ça marche ?</h2>
              <p className="text-lg text-gray-600">Réservez votre formation en 4 étapes simples</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 relative">
              <div className="absolute top-12 left-0 right-0 h-1 bg-linear-to-r from-brand-accent via-purple-500 to-green-500 hidden lg:block" style={{ width: "75%", marginLeft: "12.5%" }} />
              {steps.map((step) => (
                <div key={step.number} className="relative text-center">
                  <div className={`w-24 h-24 ${step.bg} rounded-full flex items-center justify-center mx-auto mb-6 relative z-10 shadow-lg`}>
                    <span className="text-white text-3xl font-display font-bold">{step.number}</span>
                  </div>
                  <h3 className="font-display font-semibold text-xl text-brand-text mb-3">{step.title}</h3>
                  <p className="text-gray-600">{step.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ═══ PARTNERS CTA ═══ */}
        <section className="py-24 px-8 bg-linear-to-br from-indigo-600 to-purple-700">
          <div className="max-w-[1440px] mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
              <div>
                <div className="inline-flex items-center px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full mb-6">
                  <FontAwesomeIcon icon={faBuilding} className="text-white mr-2" />
                  <span className="text-sm font-medium text-white">Pour les centres de formation</span>
                </div>
                <h2 className="font-display font-bold text-3xl sm:text-5xl text-white mb-6 leading-tight">
                  Développez votre activité avec Formation Central
                </h2>
                <p className="text-xl text-indigo-100 mb-8 leading-relaxed">
                  Rejoignez plus de 850 centres partenaires et accédez à des milliers d&apos;élèves motivés.
                </p>
                <ul className="space-y-4 mb-10">
                  {[
                    "Visibilité accrue auprès de milliers d'élèves potentiels",
                    "Gestion simplifiée de vos sessions et inscriptions",
                    "Paiements sécurisés et virements automatiques",
                    "Support dédié et accompagnement personnalisé",
                  ].map((item) => (
                    <li key={item} className="flex items-start">
                      <FontAwesomeIcon icon={faCircleCheck} className="text-green-400 text-xl mr-3 mt-1" />
                      <span className="text-indigo-100">{item}</span>
                    </li>
                  ))}
                </ul>
                <div className="flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-4">
                  <Link href="/inscription" className="bg-white text-indigo-600 px-8 py-4 rounded-lg font-semibold hover:bg-indigo-50 transition-colors shadow-xl">
                    Devenir partenaire
                  </Link>
                  <button className="border-2 border-white text-white px-8 py-4 rounded-lg font-semibold hover:bg-white/10 transition-colors">
                    En savoir plus
                  </button>
                </div>
              </div>

              <div className="relative">
                <div className="bg-white/10 backdrop-blur-sm rounded-3xl p-8 border border-white/20">
                  <div className="grid grid-cols-2 gap-6">
                    {[
                      { val: "850+", label: "Centres partenaires" },
                      { val: "45K+", label: "Élèves formés" },
                      { val: "98%", label: "Taux de satisfaction" },
                      { val: "24/7", label: "Support disponible" },
                    ].map((s) => (
                      <div key={s.label} className="bg-white rounded-2xl p-6">
                        <div className="text-3xl sm:text-4xl font-display font-bold text-indigo-600 mb-2">{s.val}</div>
                        <div className="text-gray-600 font-medium">{s.label}</div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-8 bg-white rounded-2xl p-6">
                    <div className="flex items-center mb-4">
                      <Image src="https://storage.googleapis.com/uxpilot-auth.appspot.com/avatars/avatar-2.jpg" alt="Pierre Durand" width={48} height={48} className="rounded-full mr-3" />
                      <div>
                        <div className="font-semibold text-brand-text">Pierre Durand</div>
                        <div className="text-sm text-gray-600">Directeur - Tech Academy</div>
                      </div>
                    </div>
                    <p className="text-gray-700 italic">
                      &ldquo;Formation Central a transformé notre activité. Nous avons doublé nos inscriptions en 6 mois !&rdquo;
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ═══ CPF INFO ═══ */}
        <section className="py-20 px-8 bg-brand-bg">
          <div className="max-w-[1440px] mx-auto">
            <div className="bg-white rounded-3xl border border-brand-border overflow-hidden">
              <div className="grid grid-cols-1 lg:grid-cols-2">
                <div className="p-8 sm:p-12">
                  <div className="inline-flex items-center px-4 py-2 bg-blue-50 rounded-full mb-6">
                    <FontAwesomeIcon icon={faWallet} className="text-brand-accent mr-2" />
                    <span className="text-sm font-medium text-brand-accent">Financement CPF</span>
                  </div>
                  <h2 className="font-display font-bold text-3xl sm:text-4xl text-brand-text mb-6">
                    Financez votre formation avec votre CPF
                  </h2>
                  <p className="text-lg text-gray-600 mb-8 leading-relaxed">
                    Le Compte Personnel de Formation (CPF) vous permet de financer tout ou partie de votre formation. Toutes nos formations sont éligibles au CPF.
                  </p>
                  <div className="space-y-4 mb-8">
                    {[
                      { title: "Vérifiez votre solde CPF", desc: "Connectez-vous à votre compte CPF pour connaître le montant disponible" },
                      { title: "Choisissez votre formation", desc: "Sélectionnez la formation qui correspond à vos objectifs professionnels" },
                      { title: "Réservez en un clic", desc: "Le paiement CPF est directement intégré dans notre processus de réservation" },
                    ].map((step) => (
                      <div key={step.title} className="flex items-start">
                        <div className="w-8 h-8 bg-brand-accent rounded-full flex items-center justify-center mr-4 flex-shrink-0">
                          <FontAwesomeIcon icon={faCheck} className="text-white text-sm" />
                        </div>
                        <div>
                          <div className="font-semibold text-brand-text mb-1">{step.title}</div>
                          <div className="text-gray-600 text-sm">{step.desc}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <button className="bg-brand-accent text-white px-8 py-4 rounded-lg font-semibold hover:bg-brand-accent-hover transition-colors shadow-lg shadow-blue-500/30">
                    Découvrir les formations CPF
                  </button>
                </div>
                <div className="bg-linear-to-br from-blue-50 to-indigo-100 p-12 flex items-center justify-center">
                  <Image
                    src="https://storage.googleapis.com/uxpilot-auth.appspot.com/ce79197cc0-9eeb8ca85f0355d74088.png"
                    alt="CPF illustration"
                    width={500}
                    height={400}
                    className="w-full h-auto max-h-96 object-contain"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ═══ FAQ ═══ */}
        <section className="py-24 px-8 bg-white">
          <div className="max-w-[1440px] mx-auto">
            <div className="text-center mb-16">
              <h2 className="font-display font-bold text-3xl sm:text-4xl text-brand-text mb-4">Questions fréquentes</h2>
              <p className="text-lg text-gray-600">Tout ce que vous devez savoir sur Formation Central</p>
            </div>

            <div className="max-w-4xl mx-auto space-y-4">
              {faqItems.map((q) => (
                <div key={q} className="bg-brand-bg rounded-2xl border border-brand-border overflow-hidden">
                  <button className="w-full px-8 py-6 flex items-center justify-between text-left hover:bg-gray-50 transition-colors">
                    <span className="font-semibold text-lg text-brand-text">{q}</span>
                    <FontAwesomeIcon icon={faChevronDown} className="text-gray-400" />
                  </button>
                </div>
              ))}
            </div>

            <div className="text-center mt-12">
              <p className="text-gray-600 mb-4">Vous ne trouvez pas la réponse à votre question ?</p>
              <button className="text-brand-accent font-semibold hover:underline">
                Contactez notre support <FontAwesomeIcon icon={faArrowRight} className="ml-2" />
              </button>
            </div>
          </div>
        </section>

        {/* ═══ NEWSLETTER ═══ */}
        <section className="py-20 px-8 bg-brand-bg">
          <div className="max-w-[1440px] mx-auto">
            <div className="bg-linear-to-r from-brand-accent to-indigo-600 rounded-3xl p-10 sm:p-16 text-center">
              <div className="max-w-2xl mx-auto">
                <FontAwesomeIcon icon={faEnvelope} className="text-6xl text-white mb-6" />
                <h2 className="font-display font-bold text-3xl sm:text-4xl text-white mb-4">
                  Restez informé des nouvelles formations
                </h2>
                <p className="text-lg sm:text-xl text-indigo-100 mb-8">
                  Inscrivez-vous à notre newsletter et recevez chaque semaine les meilleures formations et offres exclusives.
                </p>
                <div className="flex flex-col sm:flex-row items-center max-w-lg mx-auto">
                  <input type="email" placeholder="Votre adresse email" className="w-full flex-1 px-6 py-4 rounded-lg sm:rounded-r-none focus:outline-none text-brand-text" />
                  <button className="w-full sm:w-auto bg-white text-brand-accent px-8 py-4 rounded-lg sm:rounded-l-none font-semibold hover:bg-indigo-50 transition-colors mt-3 sm:mt-0">
                    S&apos;inscrire
                  </button>
                </div>
                <p className="text-indigo-200 text-sm mt-4">
                  <FontAwesomeIcon icon={faLock} className="mr-1" />
                  Vos données sont protégées. Désinscription possible à tout moment.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
