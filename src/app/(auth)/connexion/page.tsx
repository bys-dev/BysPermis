'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowRight, faShieldHalved, faUserGraduate, faBuilding } from '@fortawesome/free-solid-svg-icons';
import { faGoogle } from '@fortawesome/free-brands-svg-icons';

export default function ConnexionPage() {
  const searchParams = useSearchParams();
  const returnTo = searchParams.get('returnTo') ?? '/dashboard';

  return (
    <div className="w-full max-w-md">
      {/* Card */}
      <div className="rounded-2xl p-8 sm:p-10 backdrop-blur-md" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}>
        {/* Logo */}
        <div className="text-center mb-8">
          <Image
            src="/transparent-logo.svg"
            alt="BYS Formation"
            width={200}
            height={56}
            priority
            className="h-14 w-auto mx-auto mb-2 brightness-0 invert"
          />
        </div>

        {/* Title */}
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold mb-2 text-white">Connexion</h2>
          <p className="text-sm text-gray-400">
            Connectez-vous pour accéder à votre espace
          </p>
        </div>

        {/* Auth buttons */}
        <div className="space-y-4">
          {/* Auth0 login (email/password via Universal Login) */}
          <a
            href={`/auth/login?returnTo=${encodeURIComponent(returnTo)}`}
            className="flex items-center justify-center gap-3 w-full bg-blue-600 hover:bg-blue-700 text-white py-3.5 rounded-lg font-semibold transition-all shadow-lg shadow-blue-600/25"
          >
            <FontAwesomeIcon icon={faArrowRight} />
            Se connecter avec Email
          </a>

          {/* Divider */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.1)' }} />
            <span className="text-xs text-gray-500 uppercase tracking-wider">ou</span>
            <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.1)' }} />
          </div>

          {/* Google login */}
          <a
            href={`/auth/login?connection=google-oauth2&returnTo=${encodeURIComponent(returnTo)}`}
            className="flex items-center justify-center gap-3 w-full py-3.5 rounded-lg font-semibold transition-all hover:opacity-90"
            style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', color: 'white' }}
          >
            <FontAwesomeIcon icon={faGoogle} />
            Continuer avec Google
          </a>
        </div>

        {/* Roles info */}
        <div className="mt-8 pt-6 space-y-3" style={{ borderTop: '1px solid rgba(255,255,255,0.1)' }}>
          <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold mb-3">Accès par profil</p>
          <div className="flex items-center gap-3 text-sm text-gray-400">
            <FontAwesomeIcon icon={faUserGraduate} className="w-4 text-blue-400" />
            <span><strong className="text-gray-300">Élève</strong> — Réservez et suivez vos formations</span>
          </div>
          <div className="flex items-center gap-3 text-sm text-gray-400">
            <FontAwesomeIcon icon={faBuilding} className="w-4 text-green-400" />
            <span><strong className="text-gray-300">Centre</strong> — Gérez vos formations et sessions</span>
          </div>
          <div className="flex items-center gap-3 text-sm text-gray-400">
            <FontAwesomeIcon icon={faShieldHalved} className="w-4 text-purple-400" />
            <span><strong className="text-gray-300">Admin</strong> — Pilotez la plateforme</span>
          </div>
        </div>

        {/* Register link */}
        <div className="mt-8 pt-6 text-center" style={{ borderTop: '1px solid rgba(255,255,255,0.1)' }}>
          <p className="text-sm text-gray-400">
            Pas de compte ?{' '}
            <Link href="/inscription" className="text-blue-400 hover:text-blue-300 font-semibold transition-colors">
              S&apos;inscrire
            </Link>
          </p>
        </div>
      </div>

      {/* Footer */}
      <p className="text-center text-xs mt-6 text-gray-600">
        © 2026 BYS Formation — Tous droits réservés
      </p>
    </div>
  );
}
