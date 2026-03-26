import Link from "next/link";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

export default function NotFound() {
  return (
    <>
      <Header />
      <main className="min-h-[70vh] bg-[#0A1628] flex items-center justify-center px-4">
        <div className="text-center max-w-lg">
          {/* Illustration 404 */}
          <div className="mb-8">
            <span className="text-[120px] sm:text-[160px] font-display font-bold leading-none bg-gradient-to-b from-white/20 to-white/5 bg-clip-text text-transparent select-none">
              404
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
            Page introuvable
          </h1>
          <p className="text-gray-400 mb-8 leading-relaxed">
            Oups, cette page n&apos;existe pas ou a été déplacée.
            Pas de panique, vous pouvez retrouver votre chemin ci-dessous.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/"
              className="bg-red-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-red-700 transition-all shadow-lg shadow-red-600/25"
            >
              Retour à l&apos;accueil
            </Link>
            <Link
              href="/recherche"
              className="px-6 py-3 rounded-lg font-semibold transition-all text-white"
              style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)" }}
            >
              Rechercher un stage
            </Link>
          </div>

          {/* Liens utiles */}
          <div className="mt-12 pt-8 flex flex-wrap justify-center gap-6 text-sm" style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}>
            <Link href="/faq" className="text-gray-500 hover:text-blue-400 transition-colors">FAQ</Link>
            <Link href="/contact" className="text-gray-500 hover:text-blue-400 transition-colors">Contact</Link>
            <Link href="/centres" className="text-gray-500 hover:text-blue-400 transition-colors">Nos centres</Link>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
