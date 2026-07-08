'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faEnvelope,
  faLock,
  faUser,
  faSpinner,
  faCircleCheck,
  faTriangleExclamation,
} from '@fortawesome/free-solid-svg-icons';

interface FormState {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
  acceptCGU: boolean;
}

const initialFormState: FormState = {
  firstName: '',
  lastName: '',
  email: '',
  password: '',
  confirmPassword: '',
  acceptCGU: false,
};

const inputClass = "w-full pr-4 py-3 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-600 transition-all";
const inputStyle = { background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)' };

export default function InscriptionPage() {
  const searchParams = useSearchParams();
  const [form, setForm] = useState<FormState>(initialFormState);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState | 'global', string>>>({});
  const [referralCode, setReferralCode] = useState<string>('');

  useEffect(() => {
    const ref = searchParams.get('ref');
    if (ref) setReferralCode(ref);
  }, [searchParams]);

  function updateField(field: keyof FormState, value: string | boolean) {
    setForm((prev) => ({ ...prev, [field]: value }));
    // Effacer l'erreur du champ modifié
    if (errors[field]) setErrors((prev) => { const n = { ...prev }; delete n[field]; return n; });
  }

  function validate(): boolean {
    const e: typeof errors = {};
    if (!form.firstName.trim()) e.firstName = 'Prénom requis';
    if (!form.lastName.trim()) e.lastName = 'Nom requis';
    if (!form.email.trim()) e.email = 'Email requis';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Email invalide';
    if (!form.password) e.password = 'Mot de passe requis';
    else if (form.password.length < 8) e.password = 'Minimum 8 caractères';
    if (form.password !== form.confirmPassword) e.confirmPassword = 'Les mots de passe ne correspondent pas';
    if (!form.acceptCGU) e.acceptCGU = 'Vous devez accepter les CGU';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, accountType: 'eleve', referralCode: referralCode || undefined }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrors({ global: data.error ?? 'Une erreur est survenue. Réessayez.' });
      } else {
        setSuccess(true);
      }
    } catch {
      setErrors({ global: 'Erreur réseau. Vérifiez votre connexion et réessayez.' });
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    const returnTo = '/dashboard';
    return (
      <div className="w-full max-w-md text-center">
        <div className="rounded-2xl p-10 backdrop-blur-md" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}>
          <div className="w-20 h-20 rounded-full bg-green-400/10 border-2 border-green-500/30 flex items-center justify-center mx-auto mb-6">
            <FontAwesomeIcon icon={faCircleCheck} className="text-green-400 text-4xl" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-3">Compte créé !</h2>
          <p className="text-gray-400 text-sm leading-relaxed mb-8">
            Bienvenue, <span className="text-white font-semibold">{form.firstName}</span> !<br />
            Votre compte a bien été créé. Connectez-vous maintenant via Auth0.
          </p>
          <a
            href={`/auth/login?returnTo=${returnTo}`}
            className="block w-full text-center bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-semibold transition-all"
          >
            Se connecter
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md sm:max-w-lg">
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
          <h2 className="text-2xl font-bold mb-2 text-white">Créer votre compte élève</h2>
          <p className="text-sm text-gray-400">
            Réservez vos stages et suivez vos réservations en quelques clics.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Erreur globale */}
          {errors.global && (
            <div className="flex items-center gap-3 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
              <FontAwesomeIcon icon={faTriangleExclamation} className="shrink-0" />
              {errors.global}
            </div>
          )}
          {/* Name row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="firstName" className="block text-sm font-medium text-gray-300 mb-2">Prénom</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                  <FontAwesomeIcon icon={faUser} className="w-4 h-4" />
                </span>
                <input id="firstName" type="text" value={form.firstName} onChange={(e) => updateField('firstName', e.target.value)} placeholder="Jean" className={`${inputClass} pl-10 ${errors.firstName ? 'ring-1 ring-red-500' : ''}`} style={inputStyle} autoComplete="given-name" />
              </div>
              {errors.firstName && <p className="text-red-400 text-xs mt-1">{errors.firstName}</p>}
            </div>
            <div>
              <label htmlFor="lastName" className="block text-sm font-medium text-gray-300 mb-2">Nom</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                  <FontAwesomeIcon icon={faUser} className="w-4 h-4" />
                </span>
                <input id="lastName" type="text" value={form.lastName} onChange={(e) => updateField('lastName', e.target.value)} placeholder="Dupont" className={`${inputClass} pl-10 ${errors.lastName ? 'ring-1 ring-red-500' : ''}`} style={inputStyle} autoComplete="family-name" />
              </div>
              {errors.lastName && <p className="text-red-400 text-xs mt-1">{errors.lastName}</p>}
            </div>
          </div>

          {/* Email */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">Adresse email</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                <FontAwesomeIcon icon={faEnvelope} className="w-4 h-4" />
              </span>
              <input id="email" type="email" value={form.email} onChange={(e) => updateField('email', e.target.value)} placeholder="vous@exemple.fr" className={`${inputClass} pl-10 ${errors.email ? 'ring-1 ring-red-500' : ''}`} style={inputStyle} autoComplete="email" />
            </div>
            {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email}</p>}
          </div>

          {/* Password */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">Mot de passe</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                <FontAwesomeIcon icon={faLock} className="w-4 h-4" />
              </span>
              <input id="password" type="password" value={form.password} onChange={(e) => updateField('password', e.target.value)} placeholder="Minimum 8 caractères" className={`${inputClass} pl-10 ${errors.password ? 'ring-1 ring-red-500' : ''}`} style={inputStyle} autoComplete="new-password" />
            </div>
            {errors.password && <p className="text-red-400 text-xs mt-1">{errors.password}</p>}
          </div>

          {/* Confirm Password */}
          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-300 mb-2">Confirmer le mot de passe</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                <FontAwesomeIcon icon={faLock} className="w-4 h-4" />
              </span>
              <input id="confirmPassword" type="password" value={form.confirmPassword} onChange={(e) => updateField('confirmPassword', e.target.value)} placeholder="Retapez votre mot de passe" className={`${inputClass} pl-10 ${errors.confirmPassword ? 'ring-1 ring-red-500' : ''}`} style={inputStyle} autoComplete="new-password" />
            </div>
            {errors.confirmPassword && <p className="text-red-400 text-xs mt-1">{errors.confirmPassword}</p>}
          </div>

          {/* Lien centres → lead-gen vérifié */}
          <p className="text-xs text-gray-500 text-center">
            Vous êtes un centre agréé ?{' '}
            <Link href="/devenir-partenaire" className="text-blue-400 hover:text-blue-300 underline">
              Devenez partenaire
            </Link>
          </p>

          {/* CGU Checkbox */}
          <div>
            <div className="flex items-start gap-3">
              <input
                id="acceptCGU"
                type="checkbox"
                checked={form.acceptCGU}
                onChange={(e) => updateField('acceptCGU', e.target.checked)}
                className="mt-1 w-4 h-4 rounded accent-blue-600"
              />
              <label htmlFor="acceptCGU" className="text-sm text-gray-400">
                J&apos;accepte les{' '}
                <Link href="/cgu" className="text-blue-400 hover:text-blue-300 underline">CGU</Link>{' '}
                et la{' '}
                <Link href="/politique-de-confidentialite" className="text-blue-400 hover:text-blue-300 underline">
                  politique de confidentialité
                </Link>
              </label>
            </div>
            {errors.acceptCGU && <p className="text-red-400 text-xs mt-1 ml-7">{errors.acceptCGU}</p>}
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="flex items-center justify-center gap-2 w-full bg-red-600 text-white py-3 rounded-lg font-semibold hover:bg-red-700 disabled:opacity-60 disabled:cursor-not-allowed transition-all shadow-lg shadow-red-600/25"
          >
            {loading ? (
              <><FontAwesomeIcon icon={faSpinner} className="animate-spin" /> Création en cours…</>
            ) : (
              'Créer mon compte'
            )}
          </button>
        </form>

        {/* Already have account */}
        <div className="mt-8 pt-6 text-center" style={{ borderTop: '1px solid rgba(255,255,255,0.1)' }}>
          <p className="text-sm text-gray-400">
            Déjà un compte ?{' '}
            <Link href="/connexion" className="text-blue-400 hover:text-blue-300 font-semibold transition-colors">
              Se connecter
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
