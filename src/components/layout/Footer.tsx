import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFacebookF, faInstagram } from "@fortawesome/free-brands-svg-icons";
import { faEnvelope } from "@fortawesome/free-regular-svg-icons";
import { faLocationDot } from "@fortawesome/free-solid-svg-icons";

export default function Footer() {
  return (
    <footer className="bg-brand-text text-gray-300 pt-16 pb-8 px-8">
      <div className="max-w-[1440px] mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12 mb-12">
          {/* Brand */}
          <div className="col-span-1 lg:col-span-2">
            <div className="flex items-center space-x-2 mb-6">
              <div className="w-10 h-10 bg-brand-accent rounded-lg flex items-center justify-center">
                <span className="text-white font-display font-bold text-lg">
                  BYS
                </span>
              </div>
              <span className="font-display font-semibold text-xl text-white">
                BYS Formation
              </span>
            </div>
            <p className="text-gray-400 mb-6 leading-relaxed max-w-md">
              Le groupe BYS Formation est votre partenaire de confiance pour les
              stages de récupération de points permis et les formations
              professionnelles liées à la mobilité. Agréé Ministère de
              l&apos;Intérieur.
            </p>

            {/* Contact info */}
            <div className="flex flex-col gap-2 mb-6 text-sm text-gray-400">
              <a
                href="mailto:bysforma95@gmail.com"
                className="flex items-center gap-2 hover:text-white transition-colors"
              >
                <FontAwesomeIcon icon={faEnvelope} className="w-4 h-4" />
                bysforma95@gmail.com
              </a>
              <span className="flex items-center gap-2">
                <FontAwesomeIcon icon={faLocationDot} className="w-4 h-4" />
                Osny (95)
              </span>
            </div>

            {/* Social icons */}
            <div className="flex items-center space-x-4">
              <a
                href="#"
                aria-label="Facebook"
                className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-brand-accent transition-colors"
              >
                <FontAwesomeIcon icon={faFacebookF} className="w-4 h-4" />
              </a>
              <a
                href="#"
                aria-label="Instagram"
                className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-brand-accent transition-colors"
              >
                <FontAwesomeIcon icon={faInstagram} className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Nos Stages */}
          <div>
            <h3 className="font-display font-semibold text-white mb-4">
              Nos Stages
            </h3>
            <ul className="space-y-3">
              <li>
                <Link
                  href="/formations/recuperation-de-points"
                  className="hover:text-white transition-colors"
                >
                  Récupération de points
                </Link>
              </li>
              <li>
                <Link
                  href="/formations/permis-b-accelere"
                  className="hover:text-white transition-colors"
                >
                  Permis B accéléré
                </Link>
              </li>
              <li>
                <Link
                  href="/formations/fimo-fco"
                  className="hover:text-white transition-colors"
                >
                  FIMO / FCO
                </Link>
              </li>
              <li>
                <Link
                  href="/formations/sensibilisation-securite-routiere"
                  className="hover:text-white transition-colors"
                >
                  Sensibilisation sécurité routière
                </Link>
              </li>
              <li>
                <Link
                  href="/recherche"
                  className="hover:text-white transition-colors"
                >
                  Toutes les formations
                </Link>
              </li>
            </ul>
          </div>

          {/* Espace Pro */}
          <div>
            <h3 className="font-display font-semibold text-white mb-4">
              Espace Pro
            </h3>
            <ul className="space-y-3">
              <li>
                <Link
                  href="/inscription"
                  className="hover:text-white transition-colors"
                >
                  Devenir centre partenaire
                </Link>
              </li>
              <li>
                <Link
                  href="/espace-centre"
                  className="hover:text-white transition-colors"
                >
                  Connexion espace centre
                </Link>
              </li>
              <li>
                <Link
                  href="/comment-ca-marche"
                  className="hover:text-white transition-colors"
                >
                  Comment ça marche
                </Link>
              </li>
              <li>
                <Link
                  href="/tarifs-partenaires"
                  className="hover:text-white transition-colors"
                >
                  Tarifs partenaires
                </Link>
              </li>
            </ul>
          </div>

          {/* Informations */}
          <div>
            <h3 className="font-display font-semibold text-white mb-4">
              Informations
            </h3>
            <ul className="space-y-3">
              <li>
                <Link
                  href="/a-propos"
                  className="hover:text-white transition-colors"
                >
                  À propos de BYS
                </Link>
              </li>
              <li>
                <Link
                  href="/faq"
                  className="hover:text-white transition-colors"
                >
                  FAQ
                </Link>
              </li>
              <li>
                <Link
                  href="/contact"
                  className="hover:text-white transition-colors"
                >
                  Contact / Support
                </Link>
              </li>
              <li>
                <Link
                  href="/mentions-legales"
                  className="hover:text-white transition-colors"
                >
                  Mentions légales
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-gray-800 pt-8">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-4">
            <div className="text-sm text-gray-500 text-center lg:text-left">
              © 2026 BYS Formation — SAS — SIRET : 987 512 381 00011 — Bât. 7,
              9 Chaussée Jules César, 95520 Osny
            </div>
            <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm">
              <Link
                href="/mentions-legales"
                className="hover:text-white transition-colors"
              >
                Mentions légales
              </Link>
              <Link
                href="/politique-de-confidentialite"
                className="hover:text-white transition-colors"
              >
                Politique de confidentialité
              </Link>
              <Link
                href="/cgu"
                className="hover:text-white transition-colors"
              >
                CGU
              </Link>
              <Link
                href="/cookies"
                className="hover:text-white transition-colors"
              >
                Cookies
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
