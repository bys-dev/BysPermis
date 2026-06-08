"use client";

import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeft } from "@fortawesome/free-solid-svg-icons";
import { TricoloreParticles } from "@/components/ui/TricoloreParticles";

export default function AuthClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="relative flex items-start sm:items-center justify-center min-h-screen px-4 py-12 overflow-y-auto"
      style={{ background: "#0A1628" }}
    >
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 60% 50% at 50% 40%, rgba(59,130,246,0.08) 0%, transparent 70%)",
        }}
      />
      <TricoloreParticles />
      <Link
        href="/"
        className="absolute top-6 left-6 z-20 inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors px-3 py-1.5 rounded-lg"
        style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}
      >
        <FontAwesomeIcon icon={faArrowLeft} className="w-3 h-3" />
        Retour à l&apos;accueil
      </Link>
      <div className="relative z-10 w-full flex items-center justify-center">{children}</div>
    </div>
  );
}

