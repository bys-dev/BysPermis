import type { Metadata } from "next";
import Link from "next/link";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

export const metadata: Metadata = {
  title: "Politique relative aux cookies — BYS Formation",
  description:
    "Politique relative aux cookies du site BYS Formation : types de cookies utilisés, durée de conservation et gestion de vos préférences.",
};

export default function CookiesPage() {
  return (
    <>
      <Header />
      <main className="bg-[#F9FAFB] min-h-screen py-16 px-4 sm:px-6 lg:px-8">
        <article className="max-w-4xl mx-auto">
          <h1 className="font-display text-3xl sm:text-4xl font-bold text-brand-text mb-10">
            Politique relative aux cookies
          </h1>

          {/* Qu'est-ce qu'un cookie */}
          <section className="mb-10">
            <h2 className="font-display text-xl font-semibold text-brand-text mb-4">
              1. Qu&apos;est-ce qu&apos;un cookie ?
            </h2>
            <div className="leading-relaxed text-gray-700 space-y-4">
              <p>
                Un cookie est un petit fichier texte déposé sur votre terminal
                (ordinateur, tablette, smartphone) lors de votre visite sur un
                site internet. Il permet au site de mémoriser certaines
                informations relatives à votre navigation afin de faciliter vos
                visites ultérieures et de rendre le site plus fonctionnel.
              </p>
              <p>
                Les cookies ne permettent pas de vous identifier personnellement.
                Ils enregistrent des informations relatives à votre navigation
                (pages consultées, date et heure de la visite, etc.) qui peuvent
                être lues lors de vos visites suivantes.
              </p>
            </div>
          </section>

          {/* Cookies utilisés */}
          <section className="mb-10">
            <h2 className="font-display text-xl font-semibold text-brand-text mb-4">
              2. Cookies utilisés sur notre site
            </h2>
            <div className="leading-relaxed text-gray-700 space-y-6">
              {/* Essentiels */}
              <div>
                <h3 className="font-semibold text-brand-text mb-2">
                  Cookies essentiels (strictement nécessaires)
                </h3>
                <p className="mb-3">
                  Ces cookies sont indispensables au fonctionnement de la
                  Plateforme. Ils ne peuvent pas être désactivés.
                </p>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm border border-brand-border rounded-lg">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="text-left p-3 font-semibold border-b border-brand-border">
                          Cookie
                        </th>
                        <th className="text-left p-3 font-semibold border-b border-brand-border">
                          Fournisseur
                        </th>
                        <th className="text-left p-3 font-semibold border-b border-brand-border">
                          Finalité
                        </th>
                        <th className="text-left p-3 font-semibold border-b border-brand-border">
                          Durée
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="p-3 border-b border-brand-border">
                          appSession
                        </td>
                        <td className="p-3 border-b border-brand-border">
                          Auth0
                        </td>
                        <td className="p-3 border-b border-brand-border">
                          Gestion de la session utilisateur et de
                          l&apos;authentification
                        </td>
                        <td className="p-3 border-b border-brand-border">
                          Session
                        </td>
                      </tr>
                      <tr>
                        <td className="p-3 border-b border-brand-border">
                          __Host-next-auth.csrf-token
                        </td>
                        <td className="p-3 border-b border-brand-border">
                          Next.js
                        </td>
                        <td className="p-3 border-b border-brand-border">
                          Protection contre les attaques CSRF
                        </td>
                        <td className="p-3 border-b border-brand-border">
                          Session
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Fonctionnels */}
              <div>
                <h3 className="font-semibold text-brand-text mb-2">
                  Cookies fonctionnels
                </h3>
                <p className="mb-3">
                  Ces cookies permettent d&apos;améliorer votre expérience en
                  mémorisant vos préférences.
                </p>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm border border-brand-border rounded-lg">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="text-left p-3 font-semibold border-b border-brand-border">
                          Cookie
                        </th>
                        <th className="text-left p-3 font-semibold border-b border-brand-border">
                          Fournisseur
                        </th>
                        <th className="text-left p-3 font-semibold border-b border-brand-border">
                          Finalité
                        </th>
                        <th className="text-left p-3 font-semibold border-b border-brand-border">
                          Durée
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="p-3 border-b border-brand-border">
                          cookie-consent
                        </td>
                        <td className="p-3 border-b border-brand-border">
                          BYS Formation
                        </td>
                        <td className="p-3 border-b border-brand-border">
                          Mémorisation de vos choix en matière de cookies
                        </td>
                        <td className="p-3 border-b border-brand-border">
                          13 mois
                        </td>
                      </tr>
                      <tr>
                        <td className="p-3 border-b border-brand-border">
                          user-preferences
                        </td>
                        <td className="p-3 border-b border-brand-border">
                          BYS Formation
                        </td>
                        <td className="p-3 border-b border-brand-border">
                          Préférences de recherche et de navigation
                        </td>
                        <td className="p-3 border-b border-brand-border">
                          6 mois
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Analytiques */}
              <div>
                <h3 className="font-semibold text-brand-text mb-2">
                  Cookies analytiques (mesure d&apos;audience)
                </h3>
                <p className="mb-3">
                  Ces cookies nous permettent de mesurer l&apos;audience du site
                  et de comprendre comment les visiteurs interagissent avec la
                  Plateforme, afin d&apos;en améliorer le fonctionnement.
                </p>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm border border-brand-border rounded-lg">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="text-left p-3 font-semibold border-b border-brand-border">
                          Cookie
                        </th>
                        <th className="text-left p-3 font-semibold border-b border-brand-border">
                          Fournisseur
                        </th>
                        <th className="text-left p-3 font-semibold border-b border-brand-border">
                          Finalité
                        </th>
                        <th className="text-left p-3 font-semibold border-b border-brand-border">
                          Durée
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="p-3 border-b border-brand-border">
                          _vercel_insights
                        </td>
                        <td className="p-3 border-b border-brand-border">
                          Vercel Analytics
                        </td>
                        <td className="p-3 border-b border-brand-border">
                          Mesure d&apos;audience et analyse du trafic
                        </td>
                        <td className="p-3 border-b border-brand-border">
                          12 mois
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Tiers */}
              <div>
                <h3 className="font-semibold text-brand-text mb-2">
                  Cookies tiers
                </h3>
                <p className="mb-3">
                  Ces cookies sont déposés par des services tiers intégrés à
                  notre Plateforme pour assurer certaines fonctionnalités.
                </p>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm border border-brand-border rounded-lg">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="text-left p-3 font-semibold border-b border-brand-border">
                          Cookie
                        </th>
                        <th className="text-left p-3 font-semibold border-b border-brand-border">
                          Fournisseur
                        </th>
                        <th className="text-left p-3 font-semibold border-b border-brand-border">
                          Finalité
                        </th>
                        <th className="text-left p-3 font-semibold border-b border-brand-border">
                          Durée
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="p-3 border-b border-brand-border">
                          __stripe_mid
                        </td>
                        <td className="p-3 border-b border-brand-border">
                          Stripe
                        </td>
                        <td className="p-3 border-b border-brand-border">
                          Prévention de la fraude lors du paiement
                        </td>
                        <td className="p-3 border-b border-brand-border">
                          1 an
                        </td>
                      </tr>
                      <tr>
                        <td className="p-3 border-b border-brand-border">
                          __stripe_sid
                        </td>
                        <td className="p-3 border-b border-brand-border">
                          Stripe
                        </td>
                        <td className="p-3 border-b border-brand-border">
                          Gestion de la session de paiement sécurisée
                        </td>
                        <td className="p-3 border-b border-brand-border">
                          30 min
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </section>

          {/* Durée de conservation */}
          <section className="mb-10">
            <h2 className="font-display text-xl font-semibold text-brand-text mb-4">
              3. Durée de conservation des cookies
            </h2>
            <div className="leading-relaxed text-gray-700 space-y-4">
              <p>
                Conformément à la réglementation en vigueur, les cookies ont une
                durée de vie maximale de <strong>13 mois</strong> après leur
                dépôt sur votre terminal. Au-delà de cette durée, votre
                consentement sera de nouveau sollicité.
              </p>
              <p>
                Les cookies de session sont supprimés automatiquement à la
                fermeture de votre navigateur.
              </p>
            </div>
          </section>

          {/* Gestion des cookies */}
          <section className="mb-10">
            <h2 className="font-display text-xl font-semibold text-brand-text mb-4">
              4. Gestion des cookies
            </h2>
            <div className="leading-relaxed text-gray-700 space-y-4">
              <p>
                Vous pouvez à tout moment modifier vos préférences en matière de
                cookies. Plusieurs options s&apos;offrent à vous :
              </p>

              <h3 className="font-semibold text-brand-text mt-4">
                Via les paramètres de votre navigateur
              </h3>
              <p>
                Chaque navigateur propose des options de configuration
                permettant de refuser, accepter ou supprimer les cookies. Voici
                les liens vers les instructions des principaux navigateurs :
              </p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>
                  <a
                    href="https://support.google.com/chrome/answer/95647"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-brand-accent hover:text-brand-accent-hover underline"
                  >
                    Google Chrome
                  </a>
                </li>
                <li>
                  <a
                    href="https://support.mozilla.org/fr/kb/cookies-informations-sites-enregistrent"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-brand-accent hover:text-brand-accent-hover underline"
                  >
                    Mozilla Firefox
                  </a>
                </li>
                <li>
                  <a
                    href="https://support.apple.com/fr-fr/guide/safari/sfri11471/mac"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-brand-accent hover:text-brand-accent-hover underline"
                  >
                    Safari
                  </a>
                </li>
                <li>
                  <a
                    href="https://support.microsoft.com/fr-fr/microsoft-edge/supprimer-les-cookies-dans-microsoft-edge-63947406-40ac-c3b8-57b9-2a946a29ae09"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-brand-accent hover:text-brand-accent-hover underline"
                  >
                    Microsoft Edge
                  </a>
                </li>
              </ul>

              <div className="bg-white border border-brand-border rounded-lg p-4 mt-4">
                <p className="text-sm">
                  <strong>Attention :</strong> la désactivation des cookies
                  essentiels peut empêcher le bon fonctionnement de la
                  Plateforme, notamment l&apos;authentification et le processus
                  de paiement.
                </p>
              </div>
            </div>
          </section>

          {/* Consentement */}
          <section className="mb-10">
            <h2 className="font-display text-xl font-semibold text-brand-text mb-4">
              5. Consentement
            </h2>
            <div className="leading-relaxed text-gray-700 space-y-4">
              <p>
                Lors de votre première visite sur la Plateforme, un bandeau
                d&apos;information vous permet d&apos;accepter ou de refuser le
                dépôt de cookies non essentiels (fonctionnels, analytiques,
                tiers).
              </p>
              <p>
                Les cookies strictement nécessaires au fonctionnement du site ne
                requièrent pas votre consentement, conformément à l&apos;article
                82 de la loi Informatique et Libertés.
              </p>
              <p>
                Vous pouvez modifier votre consentement à tout moment. Votre
                choix est conservé pendant une durée de 13 mois.
              </p>
              <p>
                Pour toute question relative à notre utilisation des cookies,
                vous pouvez nous contacter à l&apos;adresse :{" "}
                <a
                  href="mailto:bysforma95@gmail.com"
                  className="text-brand-accent hover:text-brand-accent-hover underline"
                >
                  bysforma95@gmail.com
                </a>
              </p>
              <p>
                Pour en savoir plus sur la protection de vos données
                personnelles, consultez notre{" "}
                <Link
                  href="/politique-de-confidentialite"
                  className="text-brand-accent hover:text-brand-accent-hover underline"
                >
                  politique de confidentialité
                </Link>
                .
              </p>
            </div>
          </section>

          <p className="text-sm text-gray-500 mt-12">
            Dernière mise à jour : mars 2026
          </p>
        </article>
      </main>
      <Footer />
    </>
  );
}
