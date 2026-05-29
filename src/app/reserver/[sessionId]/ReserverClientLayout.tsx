"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCheck, faShieldHalved, faLock } from "@fortawesome/free-solid-svg-icons";

const steps = [
  { label: "Informations", path: "donnees" },
  { label: "Éligibilité", path: "eligibilite" },
  { label: "Paiement", path: "paiement" },
  { label: "Confirmation", path: "confirmation" },
];

export default function ReserverClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const currentStep = steps.findIndex((s) => pathname.includes(s.path));

  return (
    <div className="min-h-screen bg-brand-bg">
      <header className="bg-navy-900 border-b border-white/8 px-4 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2" aria-label="BYS Formation — accueil">
            <Image
              src="/transparent-logo.svg"
              alt="BYS Formation"
              width={140}
              height={36}
              className="h-9 w-auto brightness-0 invert"
            />
          </Link>

          <div className="flex items-center gap-0">
            {steps.map((step, i) => {
              const done = i < currentStep;
              const active = i === currentStep;
              return (
                <div key={step.path} className="flex items-center">
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors
                      ${
                        done
                          ? "bg-green-500 text-white"
                          : active
                            ? "bg-blue-600 text-white"
                            : "bg-white/10 text-gray-500"
                      }`}
                    >
                      {done ? (
                        <FontAwesomeIcon icon={faCheck} className="text-[10px]" />
                      ) : (
                        i + 1
                      )}
                    </div>
                    <span
                      className={`text-xs font-medium hidden sm:block ${
                        active ? "text-white" : done ? "text-green-400" : "text-gray-500"
                      }`}
                    >
                      {step.label}
                    </span>
                  </div>
                  {i < steps.length - 1 && (
                    <div
                      className={`w-8 sm:w-16 h-px mx-2 ${
                        i < currentStep ? "bg-green-500/50" : "bg-white/10"
                      }`}
                    />
                  )}
                </div>
              );
            })}
          </div>

          <div className="flex items-center gap-1.5 text-xs text-gray-400">
            <FontAwesomeIcon icon={faLock} className="text-green-400 text-[10px]" />
            <span className="hidden sm:block">Paiement sécurisé</span>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">{children}</main>

      <footer className="border-t border-gray-200 py-6 mt-8">
        <div className="max-w-5xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-400">
          <div className="flex items-center gap-1.5">
            <FontAwesomeIcon icon={faShieldHalved} className="text-blue-500" />
            Paiement 100% sécurisé par Stripe — Données chiffrées SSL
          </div>
          <div className="flex gap-4">
            <Link href="/cgu" className="hover:text-gray-600 transition-colors">
              CGU
            </Link>
            <Link
              href="/politique-de-confidentialite"
              className="hover:text-gray-600 transition-colors"
            >
              Confidentialité
            </Link>
            <Link href="/contact" className="hover:text-gray-600 transition-colors">
              Aide
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

