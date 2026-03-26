import type { Metadata } from "next";
import Link from "next/link";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

export const metadata: Metadata = {
  title: "Politique de confidentialité — BYS Formation",
  description:
    "Politique de confidentialité et protection des données personnelles (RGPD) du site BYS Formation.",
};

export default function PolitiqueDeConfidentialitePage() {
  return (
    <>
      <Header />
      <main className="bg-[#F9FAFB] min-h-screen py-16 px-4 sm:px-6 lg:px-8">
        <article className="max-w-4xl mx-auto">
          <h1 className="font-display text-3xl sm:text-4xl font-bold text-brand-text mb-10">
            Politique de confidentialité
          </h1>

          <p className="leading-relaxed text-gray-700 mb-10">
            BYS Formation (ci-après « nous ») accorde une grande importance à la
            protection de vos données personnelles. La présente politique de
            confidentialité décrit les données que nous collectons, les raisons
            pour lesquelles nous les collectons et la manière dont nous les
            utilisons, conformément au Règlement Général sur la Protection des
            Données (RGPD — Règlement UE 2016/679) et à la loi Informatique et
            Libertés.
          </p>

          {/* Données collectées */}
          <section className="mb-10">
            <h2 className="font-display text-xl font-semibold text-brand-text mb-4">
              1. Données collectées
            </h2>
            <div className="leading-relaxed text-gray-700 space-y-4">
              <p>
                Dans le cadre de l&apos;utilisation de notre plateforme, nous
                sommes amenés à collecter les données suivantes :
              </p>
              <h3 className="font-semibold text-brand-text mt-4">
                Données d&apos;identification
              </h3>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>Nom et prénom</li>
                <li>Adresse email</li>
                <li>Numéro de téléphone (facultatif)</li>
                <li>Adresse postale (si nécessaire à la réservation)</li>
              </ul>

              <h3 className="font-semibold text-brand-text mt-4">
                Données liées à la réservation
              </h3>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>Détails des stages réservés</li>
                <li>Historique des réservations</li>
                <li>Statut des paiements</li>
              </ul>

              <h3 className="font-semibold text-brand-text mt-4">
                Données techniques
              </h3>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>Adresse IP</li>
                <li>Type de navigateur et version</li>
                <li>Pages consultées et durée de visite</li>
                <li>Données de connexion (cookies de session)</li>
              </ul>

              <h3 className="font-semibold text-brand-text mt-4">
                Données de paiement
              </h3>
              <p>
                Les données bancaires (numéro de carte, date d&apos;expiration,
                cryptogramme) ne sont <strong>jamais stockées</strong> sur nos
                serveurs. Elles sont traitées exclusivement par notre
                prestataire de paiement{" "}
                <strong>Stripe</strong> (certifié PCI-DSS niveau 1), via une
                connexion sécurisée.
              </p>
            </div>
          </section>

          {/* Finalité du traitement */}
          <section className="mb-10">
            <h2 className="font-display text-xl font-semibold text-brand-text mb-4">
              2. Finalité du traitement
            </h2>
            <div className="leading-relaxed text-gray-700 space-y-2">
              <p>Vos données sont collectées pour les finalités suivantes :</p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>
                  Création et gestion de votre compte utilisateur (via{" "}
                  <strong>Auth0</strong>)
                </li>
                <li>
                  Traitement de vos réservations de stages de récupération de
                  points
                </li>
                <li>
                  Gestion des paiements et remboursements (via{" "}
                  <strong>Stripe</strong>)
                </li>
                <li>
                  Envoi de confirmations de réservation et de convocations par
                  email
                </li>
                <li>Communication relative à votre commande (support client)</li>
                <li>
                  Amélioration de nos services et de l&apos;expérience
                  utilisateur
                </li>
                <li>
                  Respect de nos obligations légales et réglementaires
                </li>
              </ul>
            </div>
          </section>

          {/* Base légale */}
          <section className="mb-10">
            <h2 className="font-display text-xl font-semibold text-brand-text mb-4">
              3. Base légale du traitement
            </h2>
            <div className="leading-relaxed text-gray-700 space-y-2">
              <p>
                Le traitement de vos données repose sur les bases légales
                suivantes :
              </p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>
                  <strong>Exécution du contrat :</strong> traitement nécessaire à
                  la réservation et au paiement de votre stage
                </li>
                <li>
                  <strong>Consentement :</strong> pour le dépôt de cookies
                  analytiques et l&apos;envoi de communications commerciales
                </li>
                <li>
                  <strong>Intérêt légitime :</strong> amélioration de nos
                  services, prévention de la fraude
                </li>
                <li>
                  <strong>Obligation légale :</strong> conservation des données
                  de facturation
                </li>
              </ul>
            </div>
          </section>

          {/* Durée de conservation */}
          <section className="mb-10">
            <h2 className="font-display text-xl font-semibold text-brand-text mb-4">
              4. Durée de conservation
            </h2>
            <div className="leading-relaxed text-gray-700 space-y-2">
              <p>
                Vos données personnelles sont conservées pour les durées
                suivantes :
              </p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>
                  <strong>Données de compte :</strong> pendant toute la durée de
                  votre inscription, puis 3 ans après votre dernière activité
                </li>
                <li>
                  <strong>Données de réservation :</strong> 5 ans à compter de la
                  date du stage (obligation comptable)
                </li>
                <li>
                  <strong>Données de paiement :</strong> conservées par Stripe
                  conformément à leurs obligations légales (non stockées sur nos
                  serveurs)
                </li>
                <li>
                  <strong>Cookies :</strong> 13 mois maximum
                </li>
                <li>
                  <strong>Données de support :</strong> 2 ans après la clôture du
                  ticket
                </li>
              </ul>
            </div>
          </section>

          {/* Destinataires */}
          <section className="mb-10">
            <h2 className="font-display text-xl font-semibold text-brand-text mb-4">
              5. Destinataires des données
            </h2>
            <div className="leading-relaxed text-gray-700 space-y-2">
              <p>
                Vos données personnelles peuvent être partagées avec les
                destinataires suivants :
              </p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>
                  <strong>Centres de formation partenaires :</strong> pour
                  l&apos;organisation de votre stage (nom, prénom, email)
                </li>
                <li>
                  <strong>Auth0 (Okta) :</strong> gestion de
                  l&apos;authentification (données de connexion)
                </li>
                <li>
                  <strong>Stripe :</strong> traitement des paiements (données
                  transactionnelles)
                </li>
                <li>
                  <strong>Vercel :</strong> hébergement de la plateforme
                </li>
                <li>
                  <strong>Resend :</strong> envoi d&apos;emails transactionnels
                </li>
              </ul>
              <p className="mt-3">
                Aucune donnée n&apos;est transférée à des fins commerciales à
                des tiers. Les sous-traitants susmentionnés sont soumis à des
                obligations contractuelles de confidentialité et de sécurité
                conformes au RGPD.
              </p>
            </div>
          </section>

          {/* Cookies */}
          <section className="mb-10">
            <h2 className="font-display text-xl font-semibold text-brand-text mb-4">
              6. Cookies
            </h2>
            <div className="leading-relaxed text-gray-700 space-y-4">
              <p>
                Notre site utilise des cookies pour assurer son bon
                fonctionnement et améliorer votre expérience. Pour en savoir
                plus sur les cookies utilisés et la manière de les gérer,
                consultez notre{" "}
                <Link
                  href="/cookies"
                  className="text-brand-accent hover:text-brand-accent-hover underline"
                >
                  politique relative aux cookies
                </Link>
                .
              </p>
            </div>
          </section>

          {/* Droits des utilisateurs */}
          <section className="mb-10">
            <h2 className="font-display text-xl font-semibold text-brand-text mb-4">
              7. Vos droits
            </h2>
            <div className="leading-relaxed text-gray-700 space-y-4">
              <p>
                Conformément au RGPD et à la loi Informatique et Libertés, vous
                disposez des droits suivants sur vos données personnelles :
              </p>
              <ul className="list-disc list-inside space-y-2 ml-2">
                <li>
                  <strong>Droit d&apos;accès :</strong> obtenir la confirmation
                  que des données vous concernant sont traitées et en recevoir
                  une copie
                </li>
                <li>
                  <strong>Droit de rectification :</strong> demander la
                  correction de données inexactes ou incomplètes
                </li>
                <li>
                  <strong>Droit à l&apos;effacement :</strong> demander la
                  suppression de vos données (sous réserve des obligations
                  légales de conservation)
                </li>
                <li>
                  <strong>Droit à la portabilité :</strong> recevoir vos données
                  dans un format structuré et couramment utilisé
                </li>
                <li>
                  <strong>Droit d&apos;opposition :</strong> vous opposer au
                  traitement de vos données pour des motifs légitimes
                </li>
                <li>
                  <strong>Droit à la limitation :</strong> demander la limitation
                  du traitement dans certains cas prévus par la loi
                </li>
                <li>
                  <strong>Droit de retirer votre consentement :</strong> à tout
                  moment, pour les traitements fondés sur le consentement
                </li>
              </ul>
              <p>
                Pour exercer ces droits, contactez-nous à l&apos;adresse :{" "}
                <a
                  href="mailto:bysforma95@gmail.com"
                  className="text-brand-accent hover:text-brand-accent-hover underline"
                >
                  bysforma95@gmail.com
                </a>
              </p>
              <p>
                Vous disposez également du droit d&apos;introduire une
                réclamation auprès de la Commission Nationale de
                l&apos;Informatique et des Libertés (CNIL) :{" "}
                <a
                  href="https://www.cnil.fr"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-brand-accent hover:text-brand-accent-hover underline"
                >
                  www.cnil.fr
                </a>
              </p>
            </div>
          </section>

          {/* DPO */}
          <section className="mb-10">
            <h2 className="font-display text-xl font-semibold text-brand-text mb-4">
              8. Contact — Délégué à la protection des données
            </h2>
            <div className="leading-relaxed text-gray-700 space-y-2">
              <p>
                Pour toute question relative à la protection de vos données
                personnelles, vous pouvez contacter notre responsable de
                traitement :
              </p>
              <ul className="list-none space-y-1 mt-3">
                <li>
                  <strong>BYS Formation</strong>
                </li>
                <li>Bât. 7, 9 Chaussée Jules César, 95520 Osny</li>
                <li>
                  Email :{" "}
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

          {/* Modifications */}
          <section className="mb-10">
            <h2 className="font-display text-xl font-semibold text-brand-text mb-4">
              9. Modifications de la politique de confidentialité
            </h2>
            <div className="leading-relaxed text-gray-700 space-y-4">
              <p>
                Nous nous réservons le droit de modifier la présente politique de
                confidentialité à tout moment. En cas de modification
                substantielle, nous vous en informerons par email ou par une
                notification visible sur le site.
              </p>
              <p>
                Nous vous invitons à consulter régulièrement cette page afin de
                prendre connaissance de toute mise à jour.
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
