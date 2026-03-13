import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFacebookF, faTwitter, faLinkedinIn, faInstagram } from "@fortawesome/free-brands-svg-icons";

export default function Footer() {
  return (
    <footer className="bg-brand-text text-gray-300 pt-16 pb-8 px-8">
      <div className="max-w-[1440px] mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-12 mb-12">
          {/* Brand */}
          <div className="col-span-1 lg:col-span-2">
            <div className="flex items-center space-x-2 mb-6">
              <div className="w-10 h-10 bg-brand-accent rounded-lg flex items-center justify-center">
                <span className="text-white font-display font-bold text-lg">FC</span>
              </div>
              <span className="font-display font-semibold text-xl text-white">
                Formation Central
              </span>
            </div>
            <p className="text-gray-400 mb-6 leading-relaxed">
              La plateforme de référence pour trouver et réserver vos formations
              professionnelles. Plus de 5 000 formations certifiées et 850
              centres partenaires.
            </p>
            <div className="flex items-center space-x-4">
              <a href="#" className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-brand-accent transition-colors">
                <FontAwesomeIcon icon={faFacebookF} />
              </a>
              <a href="#" className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-brand-accent transition-colors">
                <FontAwesomeIcon icon={faTwitter} />
              </a>
              <a href="#" className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-brand-accent transition-colors">
                <FontAwesomeIcon icon={faLinkedinIn} />
              </a>
              <a href="#" className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-brand-accent transition-colors">
                <FontAwesomeIcon icon={faInstagram} />
              </a>
            </div>
          </div>

          {/* Formations */}
          <div>
            <h3 className="font-display font-semibold text-white mb-4">Formations</h3>
            <ul className="space-y-3">
              <li><Link href="#" className="hover:text-white transition-colors">Développement</Link></li>
              <li><Link href="#" className="hover:text-white transition-colors">Design &amp; UX</Link></li>
              <li><Link href="#" className="hover:text-white transition-colors">Marketing</Link></li>
              <li><Link href="#" className="hover:text-white transition-colors">Management</Link></li>
              <li><Link href="#" className="hover:text-white transition-colors">Langues</Link></li>
            </ul>
          </div>

          {/* Entreprise */}
          <div>
            <h3 className="font-display font-semibold text-white mb-4">Entreprise</h3>
            <ul className="space-y-3">
              <li><Link href="/a-propos" className="hover:text-white transition-colors">À propos</Link></li>
              <li><Link href="/inscription" className="hover:text-white transition-colors">Devenir partenaire</Link></li>
              <li><Link href="#" className="hover:text-white transition-colors">Carrières</Link></li>
              <li><Link href="#" className="hover:text-white transition-colors">Blog</Link></li>
              <li><Link href="#" className="hover:text-white transition-colors">Presse</Link></li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="font-display font-semibold text-white mb-4">Support</h3>
            <ul className="space-y-3">
              <li><Link href="#" className="hover:text-white transition-colors">Centre d&apos;aide</Link></li>
              <li><Link href="#" className="hover:text-white transition-colors">Contact</Link></li>
              <li><Link href="#" className="hover:text-white transition-colors">FAQ</Link></li>
              <li><Link href="#" className="hover:text-white transition-colors">Conditions CPF</Link></li>
              <li><Link href="#" className="hover:text-white transition-colors">Accessibilité</Link></li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-gray-800 pt-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-sm text-gray-500">
              © {new Date().getFullYear()} Formation Central. Tous droits réservés.
            </div>
            <div className="flex items-center space-x-6 text-sm">
              <Link href="#" className="hover:text-white transition-colors">Mentions légales</Link>
              <Link href="#" className="hover:text-white transition-colors">Politique de confidentialité</Link>
              <Link href="#" className="hover:text-white transition-colors">CGU</Link>
              <Link href="#" className="hover:text-white transition-colors">Cookies</Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
