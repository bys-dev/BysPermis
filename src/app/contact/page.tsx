import type { Metadata } from "next";
import Link from "next/link";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import ContactForm from "@/components/contact/ContactForm";
import { pageMetadata } from "@/lib/seo";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faEnvelope,
  faLocationDot,
  faClock,
  faBuilding,
  faArrowRight,
  faShieldHalved,
  faChevronRight,
  faPhone,
  faHeadset,
} from "@fortawesome/free-solid-svg-icons";

export const dynamic = "force-static";

export const metadata: Metadata = pageMetadata({
  title: "Contact — Support stages & partenariats",
  description:
    "Contactez BYS Formation Permis pour vos questions sur les stages de récupération de points, le partenariat centre ou le support technique. Réponse sous 24h ouvrées.",
  path: "/contact",
});

const faqLinks = [
  { question: "Comment réserver un stage ?", href: "/comment-ca-marche" },
  { question: "Tarifs pour les centres partenaires ?", href: "/tarifs-partenaires" },
  { question: "Comment devenir centre partenaire ?", href: "/devenir-partenaire" },
  { question: "Consulter toute la FAQ", href: "/faq" },
];

const heroContacts = [
  { icon: faEnvelope, label: "Email", value: "bysforma95@gmail.com", href: "mailto:bysforma95@gmail.com" },
  { icon: faPhone, label: "Téléphone", value: "01 34 25 XX XX" },
  { icon: faLocationDot, label: "Adresse", value: "Osny (95) — Val-d'Oise" },
  { icon: faClock, label: "Horaires", value: "Lun – Ven : 9h – 18h" },
];

const sidebarContacts = [
  { icon: faEnvelope, label: "Email", value: "bysforma95@gmail.com", href: "mailto:bysforma95@gmail.com" },
  { icon: faPhone, label: "Téléphone", value: "01 34 25 XX XX", href: "tel:+33134250000" },
  { icon: faLocationDot, label: "Adresse", value: "Bât. 7, 9 Chaussée Jules César, 95520 Osny" },
  { icon: faClock, label: "Horaires", value: "Lun – Ven : 9h – 18h" },
];

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-[#F9FAFB]">
      <Header />

      <main>
        {/* Hero */}
        <section className="relative overflow-hidden bg-[#0A1628] text-white py-20 lg:py-28 px-4">
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                "radial-gradient(ellipse 60% 50% at 50% 40%, rgba(37,99,235,0.15) 0%, transparent 70%)",
            }}
          />
          <div className="absolute top-10 left-[10%] w-72 h-72 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-10 right-[15%] w-56 h-56 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />

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
              <FontAwesomeIcon icon={faHeadset} className="text-blue-400 text-xs" />
              <span className="text-gray-300">Contact &amp; Support</span>
            </div>
            <h1 className="font-display font-bold text-4xl md:text-5xl lg:text-6xl mb-6 text-white">
              Contactez-nous
            </h1>
            <p className="text-lg text-gray-400 max-w-2xl mx-auto leading-relaxed">
              Une question sur un stage, un partenariat ou besoin d&apos;aide ?<br />
              Notre équipe répond sous 24h ouvrées.
            </p>

            <div className="flex flex-wrap justify-center gap-4 mt-10">
              {heroContacts.map((info) => (
                <div
                  key={info.label}
                  className="flex items-center gap-3 px-5 py-3 rounded-xl text-sm"
                  style={{
                    background: "rgba(255,255,255,0.06)",
                    border: "1px solid rgba(255,255,255,0.08)",
                  }}
                >
                  <div className="w-8 h-8 rounded-lg bg-blue-500/15 flex items-center justify-center shrink-0">
                    <FontAwesomeIcon icon={info.icon} className="text-blue-400 w-3.5 h-3.5" />
                  </div>
                  {info.href ? (
                    <a href={info.href} className="text-gray-300 hover:text-white transition-colors">
                      {info.value}
                    </a>
                  ) : (
                    <span className="text-gray-300">{info.value}</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Form + Sidebar */}
        <section className="py-16 px-4 sm:px-8">
          <div className="max-w-[1440px] mx-auto">
            <div className="grid lg:grid-cols-3 gap-10">
              <div className="lg:col-span-2">
                <ContactForm />
              </div>

              {/* Sidebar (statique) */}
              <div className="space-y-5">
                <div
                  className="rounded-2xl p-7 text-white relative overflow-hidden"
                  style={{
                    background: "linear-gradient(135deg, #0A1628 0%, #0f2044 100%)",
                    border: "1px solid rgba(255,255,255,0.08)",
                  }}
                >
                  <div className="absolute top-0 right-0 w-40 h-40 bg-blue-600/10 rounded-full blur-3xl" />
                  <div className="absolute bottom-0 left-0 w-24 h-24 bg-indigo-500/10 rounded-full blur-2xl" />
                  <div className="relative">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center mb-5 shadow-lg shadow-blue-500/20">
                      <FontAwesomeIcon icon={faBuilding} className="text-white w-5 h-5" />
                    </div>
                    <h3 className="font-display font-bold text-lg mb-2">Vous êtes un centre ?</h3>
                    <p className="text-gray-400 text-sm leading-relaxed mb-6">
                      Rejoignez le réseau BYS Formation. Remplissez vos sessions et recevez 90% de
                      chaque réservation.
                    </p>
                    <Link
                      href="/devenir-partenaire"
                      className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-5 py-2.5 rounded-lg text-sm transition-all shadow-md shadow-blue-600/20 hover:shadow-lg hover:shadow-blue-600/30"
                    >
                      Devenir partenaire
                      <FontAwesomeIcon icon={faArrowRight} className="w-3 h-3" />
                    </Link>
                  </div>
                </div>

                <div className="bg-white rounded-2xl border border-gray-100 p-7 shadow-sm">
                  <h3 className="font-display font-bold text-base text-gray-900 mb-5 flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
                      <FontAwesomeIcon icon={faShieldHalved} className="text-blue-600 w-3.5 h-3.5" />
                    </div>
                    Nos coordonnées
                  </h3>
                  <div className="space-y-4">
                    {sidebarContacts.map((info) => (
                      <div key={info.label} className="flex gap-3 group">
                        <div className="w-10 h-10 rounded-xl bg-blue-50 group-hover:bg-blue-100 flex items-center justify-center shrink-0 transition-colors">
                          <FontAwesomeIcon icon={info.icon} className="text-blue-600 w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold mb-0.5">
                            {info.label}
                          </p>
                          {info.href ? (
                            <a
                              href={info.href}
                              className="text-sm text-gray-800 font-medium hover:text-blue-600 transition-colors"
                            >
                              {info.value}
                            </a>
                          ) : (
                            <p className="text-sm text-gray-800 font-medium">{info.value}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-white rounded-2xl border border-gray-100 p-7 shadow-sm">
                  <h3 className="font-display font-bold text-base text-gray-900 mb-1">
                    Questions fréquentes
                  </h3>
                  <p className="text-gray-400 text-xs mb-4">
                    Peut-être avez-vous déjà votre réponse ?
                  </p>
                  <ul className="space-y-1.5">
                    {faqLinks.map((faq) => (
                      <li key={faq.href}>
                        <Link
                          href={faq.href}
                          className="flex items-center gap-2.5 py-2.5 px-3.5 rounded-xl text-sm text-gray-600 hover:bg-blue-50/80 hover:text-blue-600 transition-all group border border-transparent hover:border-blue-100"
                        >
                          <FontAwesomeIcon
                            icon={faChevronRight}
                            className="w-2.5 h-2.5 text-gray-300 group-hover:text-blue-500 transition-colors shrink-0"
                          />
                          {faq.question}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
