import type { Metadata } from "next";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

export const metadata: Metadata = {
  title: "Mentions légales — BYS Formation",
  description:
    "Mentions légales du site BYS Formation, marketplace de stages de récupération de points permis.",
};

export default function MentionsLegalesPage() {
  return (
    <>
      <Header />
      <main className="bg-[#F9FAFB] min-h-screen py-16 px-4 sm:px-6 lg:px-8">
        <article className="max-w-4xl mx-auto">
          <h1 className="font-display text-3xl sm:text-4xl font-bold text-brand-text mb-10">
            Mentions légales
          </h1>

          {/* Éditeur du site */}
          <section className="mb-10">
            <h2 className="font-display text-xl font-semibold text-brand-text mb-4">
              1. Éditeur du site
            </h2>
            <div className="leading-relaxed text-gray-700 space-y-1">
              <p>
                Le site <strong>bys-formation.fr</strong> est édité par :
              </p>
              <ul className="list-none mt-3 space-y-1">
                <li>
                  <strong>Raison sociale :</strong> BYS Formation — SAS
                </li>
                <li>
                  <strong>SIRET :</strong> 987 512 381 00011
                </li>
                <li>
                  <strong>Siège social :</strong> Bât. 7, 9 Chaussée Jules
                  César, 95520 Osny
                </li>
                <li>
                  <strong>Email :</strong>{" "}
                  <a
                    href="mailto:bysforma95@gmail.com"
                    className="text-brand-accent hover:text-brand-accent-hover underline"
                  >
                    bysforma95@gmail.com
                  </a>
                </li>
              </ul>
            </div>
          </section>

          {/* Directeur de publication */}
          <section className="mb-10">
            <h2 className="font-display text-xl font-semibold text-brand-text mb-4">
              2. Directeur de publication
            </h2>
            <p className="leading-relaxed text-gray-700">
              Le directeur de la publication est{" "}
              <strong>Sébastien</strong>, en qualité de représentant légal de
              BYS Formation.
            </p>
          </section>

          {/* Hébergeur */}
          <section className="mb-10">
            <h2 className="font-display text-xl font-semibold text-brand-text mb-4">
              3. Hébergeur
            </h2>
            <div className="leading-relaxed text-gray-700 space-y-1">
              <ul className="list-none space-y-1">
                <li>
                  <strong>Raison sociale :</strong> Vercel Inc.
                </li>
                <li>
                  <strong>Adresse :</strong> 340 S Lemon Ave #4133, Walnut, CA
                  91789, USA
                </li>
                <li>
                  <strong>Site web :</strong>{" "}
                  <a
                    href="https://vercel.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-brand-accent hover:text-brand-accent-hover underline"
                  >
                    https://vercel.com
                  </a>
                </li>
              </ul>
            </div>
          </section>

          {/* Propriété intellectuelle */}
          <section className="mb-10">
            <h2 className="font-display text-xl font-semibold text-brand-text mb-4">
              4. Propriété intellectuelle
            </h2>
            <div className="leading-relaxed text-gray-700 space-y-4">
              <p>
                L&apos;ensemble du contenu du site BYS Formation (textes,
                images, graphismes, logo, icônes, logiciels, base de données)
                est protégé par les lois françaises et internationales relatives
                à la propriété intellectuelle.
              </p>
              <p>
                Toute reproduction, représentation, modification, publication ou
                adaptation de tout ou partie des éléments du site, quel que soit
                le moyen ou le procédé utilisé, est interdite sans
                l&apos;autorisation écrite préalable de BYS Formation.
              </p>
              <p>
                Toute exploitation non autorisée du site ou de l&apos;un
                quelconque des éléments qu&apos;il contient sera considérée
                comme constitutive d&apos;une contrefaçon et poursuivie
                conformément aux dispositions des articles L.335-2 et suivants
                du Code de la propriété intellectuelle.
              </p>
            </div>
          </section>

          {/* Limitation de responsabilité */}
          <section className="mb-10">
            <h2 className="font-display text-xl font-semibold text-brand-text mb-4">
              5. Limitation de responsabilité
            </h2>
            <div className="leading-relaxed text-gray-700 space-y-4">
              <p>
                BYS Formation s&apos;efforce de fournir sur le site des
                informations aussi précises que possible. Toutefois, elle ne
                pourra être tenue responsable des omissions, des inexactitudes
                ou des carences dans la mise à jour, qu&apos;elles soient de son
                fait ou du fait des tiers partenaires qui lui fournissent ces
                informations.
              </p>
              <p>
                BYS Formation ne pourra être tenue responsable des dommages
                directs ou indirects résultant de l&apos;accès au site ou de
                l&apos;utilisation du site et/ou des informations qui y sont
                disponibles.
              </p>
              <p>
                BYS Formation agit en qualité d&apos;intermédiaire entre les
                utilisateurs et les centres de formation partenaires. Elle ne
                saurait être tenue responsable du contenu pédagogique des
                formations dispensées par les centres partenaires.
              </p>
            </div>
          </section>

          {/* Droit applicable */}
          <section className="mb-10">
            <h2 className="font-display text-xl font-semibold text-brand-text mb-4">
              6. Droit applicable
            </h2>
            <div className="leading-relaxed text-gray-700 space-y-4">
              <p>
                Les présentes mentions légales sont régies par le droit français.
                En cas de litige, et après tentative de résolution amiable, les
                tribunaux français seront seuls compétents pour en connaître.
              </p>
              <p>
                Conformément à la réglementation européenne, tout consommateur
                peut recourir à la plateforme de résolution des litiges en ligne
                de la Commission européenne accessible à l&apos;adresse suivante
                :{" "}
                <a
                  href="https://ec.europa.eu/consumers/odr"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-brand-accent hover:text-brand-accent-hover underline"
                >
                  https://ec.europa.eu/consumers/odr
                </a>
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
