'use client';

import { useState } from 'react';
import Link from 'next/link';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEnvelope, faLock } from '@fortawesome/free-solid-svg-icons';
import { faGoogle } from '@fortawesome/free-brands-svg-icons';

type AuthTab = 'email' | 'google';

export default function ConnexionPage() {
  const [activeTab, setActiveTab] = useState<AuthTab>('email');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  return (
    <div className="w-full max-w-md">
      {/* Card */}
      <div className="rounded-2xl p-8 sm:p-10 backdrop-blur-md" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}>
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl mb-4 bg-blue-600">
            <span className="font-display font-bold text-lg text-white">BYS</span>
          </div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-white">
            BYS Formation
          </h1>
        </div>

        {/* Title */}
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold mb-2 text-white">
            Bienvenue
          </h2>
          <p className="text-sm text-gray-400">
            Connectez-vous pour accéder à votre espace
          </p>
        </div>

        {/* Tabs */}
        <div className="flex mb-6" style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
          <button
            type="button"
            onClick={() => setActiveTab('email')}
            className="flex-1 pb-3 text-sm font-semibold transition-colors"
            style={{
              color: activeTab === 'email' ? '#3B82F6' : 'rgba(255,255,255,0.4)',
              borderBottom: activeTab === 'email' ? '2px solid #3B82F6' : '2px solid transparent',
            }}
          >
            <FontAwesomeIcon icon={faEnvelope} className="mr-2" />
            Email
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('google')}
            className="flex-1 pb-3 text-sm font-semibold transition-colors"
            style={{
              color: activeTab === 'google' ? '#3B82F6' : 'rgba(255,255,255,0.4)',
              borderBottom: activeTab === 'google' ? '2px solid #3B82F6' : '2px solid transparent',
            }}
          >
            <FontAwesomeIcon icon={faGoogle} className="mr-2" />
            Google
          </button>
        </div>

        {/* Email Tab */}
        {activeTab === 'email' && (
          <div className="space-y-5">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">Adresse email</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                  <FontAwesomeIcon icon={faEnvelope} className="w-4 h-4" />
                </span>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="vous@exemple.fr"
                  className="w-full pl-10 pr-4 py-3 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-600 transition-all"
                  style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)' }}
                  autoComplete="email"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">Mot de passe</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                  <FontAwesomeIcon icon={faLock} className="w-4 h-4" />
                </span>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Votre mot de passe"
                  className="w-full pl-10 pr-4 py-3 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-600 transition-all"
                  style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)' }}
                  autoComplete="current-password"
                />
              </div>
            </div>

            <div className="text-right">
              <Link href="/api/auth/login" className="text-sm text-blue-400 hover:text-blue-300 transition-colors">
                Mot de passe oublié ?
              </Link>
            </div>

            <Link
              href="/api/auth/login?returnTo=/espace-eleve"
              className="block w-full text-center bg-red-600 text-white py-3 rounded-lg font-semibold hover:bg-red-700 transition-all shadow-lg shadow-red-600/25"
            >
              Se connecter
            </Link>
          </div>
        )}

        {/* Google Tab */}
        {activeTab === 'google' && (
          <div className="space-y-5">
            <p className="text-sm text-center text-gray-400">
              Utilisez votre compte Google pour vous connecter rapidement.
            </p>
            <Link
              href="/api/auth/login?connection=google-oauth2&returnTo=/espace-eleve"
              className="block w-full text-center py-3 rounded-lg font-semibold transition-all hover:opacity-90"
              style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)', color: 'white' }}
            >
              <FontAwesomeIcon icon={faGoogle} className="mr-2" />
              Continuer avec Google
            </Link>
          </div>
        )}

        {/* Divider */}
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
