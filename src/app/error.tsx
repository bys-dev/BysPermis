"use client";

import { useEffect } from "react";
import Link from "next/link";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function ErrorPage({ error, reset }: ErrorProps) {
  useEffect(() => {
    console.error("[BYS Error]", error);
  }, [error]);

  return (
    <>
      <Header />
      <main className="min-h-[70vh] bg-[#0A1628] flex items-center justify-center px-4">
        <div className="text-center max-w-lg">
          {/* Illustration 500 */}
          <div className="mb-8">
            <span className="text-[120px] sm:text-[160px] font-display font-bold leading-none bg-gradient-to-b from-red-500/30 to-red-500/5 bg-clip-text text-transparent select-none">
              500
            </span>
          </div>

          {/* Drapeau tricolore */}
          <div className="flex justify-center mb-6">
            <div className="flex rounded overflow-hidden">
              <div className="w-8 h-1.5 bg-blue-600" />
              <div className="w-8 h-1.5 bg-white" />
              <div className="w-8 h-1.5 bg-red-500" />
            </div>
          </div>

          <h1 className="font-display font-bold text-2xl sm:text-3xl text-white mb-4">
            Une erreur est survenue
          </h1>
          <p className="text-gray-400 mb-8 leading-relaxed">
            Désolé, quelque chose s&apos;est mal passé de notre côté.
            Nos équipes sont informées et travaillent à résoudre le problème.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={reset}
              className="bg-red-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-red-700 transition-all shadow-lg shadow-red-600/25"
            >
              Réessayer
            </button>
            <Link
              href="/"
              className="px-6 py-3 rounded-lg font-semibold transition-all text-white"
              style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)" }}
            >
              Retour à l&apos;accueil
            </Link>
          </div>

          {/* Contact */}
          <div className="mt-12 pt-8 text-sm text-gray-500" style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}>
            Le problème persiste ?{" "}
            <Link href="/contact" className="text-blue-400 hover:text-blue-300 transition-colors">
              Contactez-nous
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
