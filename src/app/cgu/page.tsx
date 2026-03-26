import type { Metadata } from "next";
import Link from "next/link";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

export const metadata: Metadata = {
  title: "Conditions générales d'utilisation — BYS Formation",
  description:
    "Conditions générales d'utilisation de la plateforme BYS Formation, marketplace de stages de récupération de points permis.",
};

export default function CGUPage() {
  return (
    <>
      <Header />
      <main className="bg-[#F9FAFB] min-h-screen py-16 px-4 sm:px-6 lg:px-8">
        <article className="max-w-4xl mx-auto">
          <h1 className="font-display text-3xl sm:text-4xl font-bold text-brand-text mb-10">
            Conditions générales d&apos;utilisation
          </h1>

          {/* Objet */}
          <section className="mb-10">
            <h2 className="font-display text-xl font-semibold text-brand-text mb-4">
              1. Objet
            </h2>
            <div className="leading-relaxed text-gray-700 space-y-4">
              <p>
                Les présentes conditions générales d&apos;utilisation (ci-après
                « CGU ») ont pour objet de définir les modalités et conditions
                d&apos;utilisation de la plateforme BYS Formation (ci-après « la
                Plateforme »), accessible à l&apos;adresse bys-formation.fr.
              </p>
              <p>
                L&apos;inscription et l&apos;utilisation de la Plateforme
                impliquent l&apos;acceptation pleine et entière des présentes
                CGU. Si vous n&apos;acceptez pas ces conditions, vous ne devez
                pas utiliser la Plateforme.
              </p>
            </div>
          </section>

          {/* Définitions */}
          <section className="mb-10">
            <h2 className="font-display text-xl font-semibold text-brand-text mb-4">
              2. Définitions
            </h2>
            <ul className="leading-relaxed text-gray-700 space-y-2">
              <li>
                <strong>« Plateforme »</strong> : le site internet
                bys-formation.fr et l&apos;ensemble de ses fonctionnalités.
              </li>
              <li>
                <strong>« BYS Formation »</strong> : la société BYS Formation —
                SAS, SIRET 987 512 381 00011, éditrice de la Plateforme.
              </li>
              <li>
                <strong>« Utilisateur »</strong> : toute personne physique
                inscrite sur la Plateforme en vue de réserver un stage.
              </li>
              <li>
                <strong>« Centre partenaire »</strong> : tout organisme de
                formation référencé sur la Plateforme et proposant des stages de
                récupération de points.
              </li>
              <li>
                <strong>« Stage »</strong> : une session de formation de
                récupération de points permis, dispensée par un Centre
                partenaire agréé.
              </li>
              <li>
                <strong>« Réservation »</strong> : l&apos;acte par lequel un
                Utilisateur réserve et paie une place pour un Stage via la
                Plateforme.
              </li>
            </ul>
          </section>

          {/* Inscription */}
          <section className="mb-10">
            <h2 className="font-display text-xl font-semibold text-brand-text mb-4">
              3. Inscription
            </h2>
            <div className="leading-relaxed text-gray-700 space-y-4">
              <p>
                L&apos;accès à certaines fonctionnalités de la Plateforme
                (réservation, espace personnel) nécessite la création d&apos;un
                compte utilisateur.
              </p>
              <p>
                L&apos;Utilisateur s&apos;engage à fournir des informations
                exactes, complètes et à jour lors de son inscription. Il est
                responsable de la confidentialité de ses identifiants de
                connexion et de toute activité réalisée depuis son compte.
              </p>
              <p>
                L&apos;authentification est gérée par le service tiers Auth0. En
                créant un compte, l&apos;Utilisateur accepte également les
                conditions d&apos;utilisation d&apos;Auth0.
              </p>
              <p>
                BYS Formation se réserve le droit de suspendre ou supprimer tout
                compte en cas de manquement aux présentes CGU.
              </p>
            </div>
          </section>

          {/* Réservation et paiement */}
          <section className="mb-10">
            <h2 className="font-display text-xl font-semibold text-brand-text mb-4">
              4. Réservation et paiement
            </h2>
            <div className="leading-relaxed text-gray-700 space-y-4">
              <p>
                La Plateforme permet à l&apos;Utilisateur de rechercher, comparer
                et réserver des stages de récupération de points auprès de
                Centres partenaires agréés.
              </p>
              <p>
                Le prix du stage est indiqué en euros (TTC) sur la fiche de
                chaque session. La réservation est considérée comme ferme et
                définitive après le paiement intégral en ligne.
              </p>
              <p>
                Le paiement est effectué de manière sécurisée via{" "}
                <strong>Stripe</strong>. Les données bancaires ne transitent pas
                par les serveurs de BYS Formation. Un email de confirmation est
                envoyé à l&apos;Utilisateur après le paiement.
              </p>
              <p>
                BYS Formation agit en qualité d&apos;intermédiaire entre
                l&apos;Utilisateur et le Centre partenaire. La facturation du
                stage est réalisée par le Centre partenaire.
              </p>
            </div>
          </section>

          {/* Annulation et remboursement */}
          <section className="mb-10">
            <h2 className="font-display text-xl font-semibold text-brand-text mb-4">
              5. Annulation et remboursement
            </h2>
            <div className="leading-relaxed text-gray-700 space-y-4">
              <p>Les conditions d&apos;annulation sont les suivantes :</p>
              <div className="bg-white border border-brand-border rounded-lg p-6 space-y-4">
                <div className="flex items-start gap-3">
                  <span className="inline-block w-2 h-2 mt-2 rounded-full bg-green-500 flex-shrink-0" />
                  <p>
                    <strong>Annulation 7 jours ou plus avant le stage :</strong>{" "}
                    remboursement intégral du montant payé. Le remboursement est
                    effectué sur le moyen de paiement utilisé lors de la
                    réservation, dans un délai de 14 jours ouvrés.
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <span className="inline-block w-2 h-2 mt-2 rounded-full bg-red-500 flex-shrink-0" />
                  <p>
                    <strong>Annulation à moins de 7 jours du stage :</strong>{" "}
                    aucun remboursement ne sera accordé, sauf cas de force
                    majeure dûment justifié (hospitalisation, décès d&apos;un
                    proche, convocation judiciaire).
                  </p>
                </div>
              </div>
              <p>
                En cas d&apos;annulation du stage par le Centre partenaire ou
                par BYS Formation, l&apos;Utilisateur bénéficie d&apos;un
                remboursement intégral ou de la possibilité de se reporter sur
                une autre session.
              </p>
              <p>
                Toute demande d&apos;annulation doit être adressée depuis
                l&apos;espace personnel de l&apos;Utilisateur ou par email à{" "}
                <a
                  href="mailto:bysforma95@gmail.com"
                  className="text-brand-accent hover:text-brand-accent-hover underline"
                >
                  bysforma95@gmail.com
                </a>
                .
              </p>
            </div>
          </section>

          {/* Obligations utilisateur */}
          <section className="mb-10">
            <h2 className="font-display text-xl font-semibold text-brand-text mb-4">
              6. Obligations de l&apos;Utilisateur
            </h2>
            <div className="leading-relaxed text-gray-700 space-y-2">
              <p>L&apos;Utilisateur s&apos;engage à :</p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>
                  Fournir des informations exactes et à jour lors de son
                  inscription et de ses réservations
                </li>
                <li>
                  Se présenter au stage à la date, l&apos;heure et au lieu
                  indiqués sur la convocation
                </li>
                <li>
                  Se munir des documents requis (pièce d&apos;identité, lettre
                  48N ou 48SI le cas échéant)
                </li>
                <li>
                  Utiliser la Plateforme de manière loyale, sans tentative de
                  fraude
                </li>
                <li>
                  Ne pas utiliser la Plateforme à des fins illicites ou
                  contraires aux bonnes mœurs
                </li>
                <li>
                  Respecter les droits de propriété intellectuelle de BYS
                  Formation et des tiers
                </li>
              </ul>
            </div>
          </section>

          {/* Obligations BYS Formation */}
          <section className="mb-10">
            <h2 className="font-display text-xl font-semibold text-brand-text mb-4">
              7. Obligations de BYS Formation
            </h2>
            <div className="leading-relaxed text-gray-700 space-y-2">
              <p>BYS Formation s&apos;engage à :</p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>
                  Mettre en relation l&apos;Utilisateur avec des Centres
                  partenaires agréés par la préfecture
                </li>
                <li>
                  Assurer le bon fonctionnement de la Plateforme et la sécurité
                  des transactions
                </li>
                <li>
                  Transmettre les informations nécessaires à la réservation au
                  Centre partenaire concerné
                </li>
                <li>
                  Envoyer la convocation à l&apos;Utilisateur par email après
                  confirmation de la réservation
                </li>
                <li>
                  Traiter les demandes de support dans un délai raisonnable
                </li>
                <li>
                  Protéger les données personnelles conformément à sa{" "}
                  <Link
                    href="/politique-de-confidentialite"
                    className="text-brand-accent hover:text-brand-accent-hover underline"
                  >
                    politique de confidentialité
                  </Link>
                </li>
              </ul>
            </div>
          </section>

          {/* Responsabilité */}
          <section className="mb-10">
            <h2 className="font-display text-xl font-semibold text-brand-text mb-4">
              8. Responsabilité
            </h2>
            <div className="leading-relaxed text-gray-700 space-y-4">
              <p>
                BYS Formation agit en qualité d&apos;intermédiaire et de
                marketplace. À ce titre, elle n&apos;est pas responsable :
              </p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>
                  Du contenu pédagogique des formations dispensées par les
                  Centres partenaires
                </li>
                <li>
                  De l&apos;annulation d&apos;un stage par un Centre partenaire
                </li>
                <li>
                  De la non-récupération des points due à une situation
                  administrative particulière de l&apos;Utilisateur
                </li>
                <li>
                  Des interruptions temporaires du site pour maintenance ou mise
                  à jour
                </li>
              </ul>
              <p>
                BYS Formation met tout en œuvre pour garantir la disponibilité de
                la Plateforme mais ne saurait garantir un accès ininterrompu.
              </p>
            </div>
          </section>

          {/* Propriété intellectuelle */}
          <section className="mb-10">
            <h2 className="font-display text-xl font-semibold text-brand-text mb-4">
              9. Propriété intellectuelle
            </h2>
            <div className="leading-relaxed text-gray-700 space-y-4">
              <p>
                L&apos;ensemble des éléments constituant la Plateforme (textes,
                images, logos, graphismes, logiciels, base de données) est la
                propriété exclusive de BYS Formation ou de ses partenaires et
                est protégé par le droit de la propriété intellectuelle.
              </p>
              <p>
                Toute reproduction, représentation, diffusion ou exploitation
                non autorisée de tout ou partie de ces éléments est interdite et
                constitue une contrefaçon sanctionnée par les articles L.335-2
                et suivants du Code de la propriété intellectuelle.
              </p>
            </div>
          </section>

          {/* Données personnelles */}
          <section className="mb-10">
            <h2 className="font-display text-xl font-semibold text-brand-text mb-4">
              10. Données personnelles
            </h2>
            <div className="leading-relaxed text-gray-700 space-y-4">
              <p>
                BYS Formation collecte et traite des données personnelles dans
                le cadre de l&apos;utilisation de la Plateforme. Le détail des
                traitements, les droits des utilisateurs et les modalités
                d&apos;exercice de ces droits sont décrits dans notre{" "}
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

          {/* Droit applicable et juridiction */}
          <section className="mb-10">
            <h2 className="font-display text-xl font-semibold text-brand-text mb-4">
              11. Droit applicable et juridiction compétente
            </h2>
            <div className="leading-relaxed text-gray-700 space-y-4">
              <p>
                Les présentes CGU sont régies par le droit français.
              </p>
              <p>
                En cas de litige relatif à l&apos;interprétation ou
                l&apos;exécution des présentes, les parties s&apos;engagent à
                rechercher une solution amiable avant tout recours judiciaire.
              </p>
              <p>
                À défaut de résolution amiable dans un délai de 30 jours, le
                litige sera porté devant les tribunaux compétents du ressort du
                siège social de BYS Formation.
              </p>
              <p>
                Conformément à l&apos;article L.612-1 du Code de la
                consommation, l&apos;Utilisateur est informé qu&apos;il peut
                recourir à un médiateur de la consommation en cas de litige non
                résolu. La plateforme de résolution des litiges en ligne de la
                Commission européenne est accessible à l&apos;adresse :{" "}
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
