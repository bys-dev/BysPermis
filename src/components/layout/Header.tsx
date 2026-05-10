import Link from "next/link";
import HeaderInteractive from "./HeaderClient";

const navLinks = [
  { label: "Stages", href: "/recherche" },
  { label: "Nos Centres", href: "/centres" },
  { label: "Blog", href: "/blog" },
  { label: "Espace Pro", href: "/inscription" },
  { label: "FAQ", href: "/faq" },
];

/**
 * Header — Server Component shell.
 * Le shell (logo, navlinks, bandeau) est rendu côté serveur ;
 * la partie interactive (menu mobile, dropdowns, géoloc, notifs) est
 * chargée via `HeaderInteractive` ("use client"), réduisant le JS hydraté.
 */
export default function Header() {
  return (
    <header className="sticky top-0 z-50">
      {/* Tricolore line */}
      <div className="h-1 flex">
        <div className="w-1/3 bg-blue-600" />
        <div className="w-1/3 bg-white" />
        <div className="w-1/3 bg-red-500" />
      </div>

      {/* Top bar */}
      <div className="bg-gray-900 text-gray-300 text-[10px] sm:text-[11px] tracking-wide text-center py-1.5 px-3 sm:px-4 flex items-center justify-center gap-2 overflow-hidden">
        <span className="inline-flex rounded overflow-hidden mr-1">
          <span className="w-1 h-3 bg-blue-500" />
          <span className="w-1 h-3 bg-white" />
          <span className="w-1 h-3 bg-red-500" />
        </span>
        Agréé Ministère de l&apos;Intérieur &bull; Stages agréés préfecture 🇫🇷
      </div>

      {/* Main header */}
      <div className="bg-white border-b border-brand-border relative">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-8 py-3 sm:py-4">
          <div className="flex items-center justify-between gap-3 sm:gap-4">
            {/* Logo + Nav — fully static */}
            <div className="flex items-center space-x-6 lg:space-x-12 min-w-0">
              <Link href="/" className="flex items-center space-x-2 sm:space-x-2.5 shrink-0">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center bg-brand-accent">
                  <span className="text-white font-display font-bold text-xs sm:text-sm tracking-tight">
                    BYS
                  </span>
                </div>
                <span className="font-display font-semibold text-lg sm:text-xl text-brand-text hidden sm:inline">
                  BYS Formation
                </span>
              </Link>

              <nav className="hidden lg:flex items-center space-x-8">
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="text-gray-600 font-medium hover:text-brand-accent transition-colors"
                  >
                    {link.label}
                  </Link>
                ))}
              </nav>
            </div>

            {/* Interactive bits hydrated client-side */}
            <HeaderInteractive />
          </div>
        </div>
      </div>
    </header>
  );
}
