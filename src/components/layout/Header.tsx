"use client";

import Link from "next/link";
import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faHeart, faBell } from "@fortawesome/free-regular-svg-icons";
import { faBars, faXmark } from "@fortawesome/free-solid-svg-icons";

export default function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="bg-white border-b border-brand-border sticky top-0 z-50">
      <div className="max-w-[1440px] mx-auto px-8 py-4">
        <div className="flex items-center justify-between">
          {/* Logo + Nav */}
          <div className="flex items-center space-x-12">
            <Link href="/" className="flex items-center space-x-2">
              <div className="w-10 h-10 bg-brand-accent rounded-lg flex items-center justify-center">
                <span className="text-white font-display font-bold text-lg">FC</span>
              </div>
              <span className="font-display font-semibold text-xl text-brand-text">
                Formation Central
              </span>
            </Link>

            <nav className="hidden lg:flex items-center space-x-8">
              <Link
                href="/"
                className="text-brand-text font-medium hover:text-brand-accent transition-colors relative pb-1 border-b-2 border-brand-accent"
              >
                Marketplace
              </Link>
              <Link
                href="/formations"
                className="text-gray-600 font-medium hover:text-brand-accent transition-colors"
              >
                Formations
              </Link>
              <Link
                href="/centres"
                className="text-gray-600 font-medium hover:text-brand-accent transition-colors"
              >
                Centres
              </Link>
              <Link
                href="/a-propos"
                className="text-gray-600 font-medium hover:text-brand-accent transition-colors"
              >
                À propos
              </Link>
            </nav>
          </div>

          {/* Actions desktop */}
          <div className="hidden lg:flex items-center space-x-6">
            <button className="text-gray-600 hover:text-brand-accent transition-colors">
              <FontAwesomeIcon icon={faHeart} className="text-xl" />
            </button>
            <button className="text-gray-600 hover:text-brand-accent transition-colors">
              <FontAwesomeIcon icon={faBell} className="text-xl" />
            </button>
            <div className="h-6 w-px bg-brand-border" />
            <Link
              href="/connexion"
              className="text-gray-600 font-medium hover:text-brand-accent transition-colors"
            >
              Connexion
            </Link>
            <Link
              href="/inscription"
              className="bg-brand-accent text-white px-6 py-2.5 rounded-lg font-medium hover:bg-brand-accent-hover transition-colors"
            >
              S&apos;inscrire
            </Link>
          </div>

          {/* Burger mobile */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="lg:hidden text-gray-600 hover:text-brand-accent transition-colors"
            aria-label="Menu"
          >
            <FontAwesomeIcon icon={mobileOpen ? faXmark : faBars} className="text-2xl" />
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="lg:hidden border-t border-brand-border bg-white px-8 pb-6">
          <nav className="flex flex-col gap-1 pt-4">
            <Link href="/" className="py-3 text-brand-text font-medium border-b border-brand-border" onClick={() => setMobileOpen(false)}>
              Marketplace
            </Link>
            <Link href="/formations" className="py-3 text-gray-600 font-medium hover:text-brand-accent" onClick={() => setMobileOpen(false)}>
              Formations
            </Link>
            <Link href="/centres" className="py-3 text-gray-600 font-medium hover:text-brand-accent" onClick={() => setMobileOpen(false)}>
              Centres
            </Link>
            <Link href="/a-propos" className="py-3 text-gray-600 font-medium hover:text-brand-accent" onClick={() => setMobileOpen(false)}>
              À propos
            </Link>
          </nav>
          <div className="flex flex-col gap-3 mt-4 pt-4 border-t border-brand-border">
            <Link href="/connexion" className="text-center py-2.5 text-gray-600 font-medium hover:text-brand-accent" onClick={() => setMobileOpen(false)}>
              Connexion
            </Link>
            <Link href="/inscription" className="text-center bg-brand-accent text-white py-2.5 rounded-lg font-medium hover:bg-brand-accent-hover" onClick={() => setMobileOpen(false)}>
              S&apos;inscrire
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
