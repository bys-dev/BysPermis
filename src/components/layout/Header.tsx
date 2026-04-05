"use client";

import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBars,
  faXmark,
  faUser,
  faMagnifyingGlass,
  faLocationDot,
  faLocationCrosshairs,
  faSpinner,
  faChevronDown,
  faBell,
} from "@fortawesome/free-solid-svg-icons";
import { useNotifications } from "@/lib/useNotifications";

const navLinks = [
  { label: "Stages", href: "/recherche" },
  { label: "Nos Centres", href: "/centres" },
  { label: "Blog", href: "/blog" },
  { label: "Espace Pro", href: "/inscription" },
  { label: "FAQ", href: "/faq" },
];

type GeoStatus = "idle" | "loading" | "success" | "error" | "denied";

export default function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [geoStatus, setGeoStatus] = useState<GeoStatus>("idle");
  const [city, setCity] = useState<string | null>(null);
  const [geoOpen, setGeoOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const geoRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const { unreadCount, notifications, markAsRead, markAllAsRead } = useNotifications();

  // Fermer dropdown si clic extérieur
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (geoRef.current && !geoRef.current.contains(e.target as Node)) {
        setGeoOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // Charger la ville sauvegardée + vérifier l'authentification
  useEffect(() => {
    const saved = localStorage.getItem("bys_city");
    if (saved) setCity(saved);

    // Quick auth check
    fetch("/api/users/me")
      .then((r) => { if (r.ok) setIsAuthenticated(true); })
      .catch(() => {});
  }, []);

  async function detectLocation() {
    if (!navigator.geolocation) {
      setGeoStatus("error");
      return;
    }
    setGeoStatus("loading");
    setGeoOpen(false);

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { latitude, longitude } = pos.coords;
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&accept-language=fr`
          );
          const data = await res.json();
          const cityName =
            data.address?.city ||
            data.address?.town ||
            data.address?.village ||
            data.address?.municipality ||
            "Votre ville";
          setCity(cityName);
          localStorage.setItem("bys_city", cityName);
          setGeoStatus("success");
          router.push(`/recherche?ville=${encodeURIComponent(cityName)}`);
        } catch {
          setGeoStatus("error");
        }
      },
      (err) => {
        if (err.code === 1) setGeoStatus("denied");
        else setGeoStatus("error");
      },
      { timeout: 8000 }
    );
  }

  function clearLocation() {
    setCity(null);
    setGeoStatus("idle");
    localStorage.removeItem("bys_city");
    setGeoOpen(false);
  }

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
      <div className="bg-white border-b border-brand-border">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-8 py-3 sm:py-4">
          <div className="flex items-center justify-between gap-3 sm:gap-4">

            {/* Logo + Nav */}
            <div className="flex items-center space-x-6 lg:space-x-12 min-w-0">
              <Link href="/" className="flex items-center space-x-2 sm:space-x-2.5 shrink-0">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center bg-brand-accent">
                  <span className="text-white font-display font-bold text-xs sm:text-sm tracking-tight">BYS</span>
                </div>
                <span className="font-display font-semibold text-lg sm:text-xl text-brand-text hidden sm:inline">BYS Formation</span>
              </Link>

              <nav className="hidden lg:flex items-center space-x-8">
                {navLinks.map((link) => (
                  <Link key={link.href} href={link.href} className="text-gray-600 font-medium hover:text-brand-accent transition-colors">
                    {link.label}
                  </Link>
                ))}
              </nav>
            </div>

            {/* Actions desktop */}
            <div className="hidden lg:flex items-center gap-4">

              {/* Géolocalisation */}
              <div className="relative" ref={geoRef}>
                <button
                  onClick={() => city ? setGeoOpen(!geoOpen) : detectLocation()}
                  className="flex items-center gap-2 text-sm font-medium transition-all px-3 py-2 rounded-lg border"
                  style={{
                    color: city ? "#2563eb" : "#6b7280",
                    borderColor: city ? "#bfdbfe" : "#e5e7eb",
                    background: city ? "#eff6ff" : "transparent",
                  }}
                  title={city ? `Stages près de ${city}` : "Détecter ma position"}
                >
                  {geoStatus === "loading" ? (
                    <FontAwesomeIcon icon={faSpinner} className="w-4 h-4 animate-spin" />
                  ) : (
                    <FontAwesomeIcon
                      icon={city ? faLocationDot : faLocationCrosshairs}
                      className="w-4 h-4"
                    />
                  )}
                  <span className="max-w-[120px] truncate">
                    {geoStatus === "loading" ? "Localisation…" : city ?? "Ma position"}
                  </span>
                  {city && <FontAwesomeIcon icon={faChevronDown} className="w-3 h-3 opacity-50" />}
                </button>

                {/* Dropdown */}
                {geoOpen && city && (
                  <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-xl border border-gray-100 py-2 z-50">
                    <div className="px-4 py-2 border-b border-gray-100">
                      <p className="text-xs text-gray-400 mb-0.5">Position actuelle</p>
                      <p className="text-sm font-semibold text-gray-800 flex items-center gap-1.5">
                        <FontAwesomeIcon icon={faLocationDot} className="text-blue-600 w-3.5 h-3.5" />
                        {city}
                      </p>
                    </div>
                    <Link
                      href={`/recherche?ville=${encodeURIComponent(city)}`}
                      onClick={() => setGeoOpen(false)}
                      className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
                    >
                      <FontAwesomeIcon icon={faMagnifyingGlass} className="w-3.5 h-3.5 text-blue-600" />
                      Stages près de {city}
                    </Link>
                    <button
                      onClick={detectLocation}
                      className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
                    >
                      <FontAwesomeIcon icon={faLocationCrosshairs} className="w-3.5 h-3.5 text-blue-600" />
                      Mettre à jour ma position
                    </button>
                    <button
                      onClick={clearLocation}
                      className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors"
                    >
                      <FontAwesomeIcon icon={faXmark} className="w-3.5 h-3.5" />
                      Effacer la position
                    </button>
                  </div>
                )}

                {/* Erreur permission */}
                {geoStatus === "denied" && (
                  <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-xl shadow-xl border border-red-100 p-4 z-50">
                    <p className="text-xs text-red-600 font-medium mb-1">Accès refusé</p>
                    <p className="text-xs text-gray-500">Autorisez la géolocalisation dans les paramètres de votre navigateur.</p>
                    <button onClick={() => setGeoStatus("idle")} className="text-xs text-blue-600 mt-2 hover:underline">Fermer</button>
                  </div>
                )}
              </div>

              {isAuthenticated ? (
                <>
                  {/* Notification bell */}
                  <div className="relative" ref={notifRef}>
                    <button
                      onClick={() => setNotifOpen(!notifOpen)}
                      className="relative text-gray-500 hover:text-brand-accent transition-colors p-2"
                      title="Notifications"
                    >
                      <FontAwesomeIcon icon={faBell} className="text-lg" />
                      {unreadCount > 0 && (
                        <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center px-1 rounded-full bg-red-500 text-white text-[10px] font-bold leading-none">
                          {unreadCount > 99 ? "99+" : unreadCount}
                        </span>
                      )}
                    </button>

                    {notifOpen && (
                      <div className="absolute right-0 top-full mt-2 w-72 sm:w-80 bg-white rounded-xl shadow-xl border border-gray-100 z-50 overflow-hidden">
                        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                          <p className="text-sm font-semibold text-gray-800">Notifications</p>
                          {unreadCount > 0 && (
                            <button
                              onClick={() => { markAllAsRead(); }}
                              className="text-xs text-blue-600 hover:underline"
                            >
                              Tout marquer comme lu
                            </button>
                          )}
                        </div>
                        <div className="max-h-72 overflow-y-auto">
                          {notifications.length === 0 ? (
                            <p className="text-center text-sm text-gray-400 py-8">Aucune notification</p>
                          ) : (
                            notifications.slice(0, 5).map((n) => (
                              <button
                                key={n.id}
                                onClick={() => { if (!n.isRead) markAsRead(n.id); setNotifOpen(false); }}
                                className={`w-full text-left px-4 py-3 border-b border-gray-50 hover:bg-gray-50 transition-colors ${!n.isRead ? "bg-blue-50/50" : ""}`}
                              >
                                <p className={`text-sm ${!n.isRead ? "font-semibold text-gray-900" : "text-gray-700"}`}>
                                  {n.titre}
                                </p>
                                <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{n.contenu}</p>
                                <p className="text-[10px] text-gray-400 mt-1">
                                  {new Date(n.createdAt).toLocaleDateString("fr-FR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                                </p>
                              </button>
                            ))
                          )}
                        </div>
                        <div className="border-t border-gray-100 px-4 py-2.5">
                          <Link
                            href="/espace-eleve/notifications"
                            onClick={() => setNotifOpen(false)}
                            className="text-xs text-blue-600 hover:underline font-medium"
                          >
                            Voir toutes les notifications
                          </Link>
                        </div>
                      </div>
                    )}
                  </div>

                  <Link href="/espace-eleve" className="text-gray-600 font-medium hover:text-brand-accent transition-colors inline-flex items-center gap-2">
                    <FontAwesomeIcon icon={faUser} className="text-sm" />
                    Mon espace
                  </Link>
                </>
              ) : (
                <Link href="/connexion" className="text-gray-600 font-medium hover:text-brand-accent transition-colors inline-flex items-center gap-2">
                  <FontAwesomeIcon icon={faUser} className="text-sm" />
                  Connexion
                </Link>
              )}

              <Link href="/recherche" className="bg-red-600 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-red-700 transition-colors inline-flex items-center gap-2">
                <FontAwesomeIcon icon={faMagnifyingGlass} className="text-sm" />
                Réserver un stage
              </Link>
            </div>

            {/* Mobile: notification bell + burger */}
            <div className="flex items-center gap-2 lg:hidden">
              {isAuthenticated && (
                <button
                  onClick={() => setNotifOpen(!notifOpen)}
                  className="relative text-gray-500 hover:text-brand-accent transition-colors p-2"
                  title="Notifications"
                >
                  <FontAwesomeIcon icon={faBell} className="text-lg" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center px-1 rounded-full bg-red-500 text-white text-[10px] font-bold leading-none">
                      {unreadCount > 99 ? "99+" : unreadCount}
                    </span>
                  )}
                </button>
              )}
              <button
                onClick={() => setMobileOpen(!mobileOpen)}
                className="text-gray-600 hover:text-brand-accent transition-colors p-1"
                aria-label="Menu"
              >
                <FontAwesomeIcon icon={mobileOpen ? faXmark : faBars} className="text-2xl" />
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="lg:hidden border-t border-brand-border bg-white px-4 sm:px-8 pb-6">
            {/* Géoloc mobile */}
            <div className="pt-4 pb-3 border-b border-brand-border">
              <button
                onClick={() => { detectLocation(); setMobileOpen(false); }}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all border"
                style={{ color: city ? "#2563eb" : "#6b7280", borderColor: city ? "#bfdbfe" : "#e5e7eb", background: city ? "#eff6ff" : "#f9fafb" }}
              >
                {geoStatus === "loading"
                  ? <FontAwesomeIcon icon={faSpinner} className="w-4 h-4 animate-spin" />
                  : <FontAwesomeIcon icon={city ? faLocationDot : faLocationCrosshairs} className="w-4 h-4" />
                }
                {city ? `Stages près de ${city}` : "Détecter ma position"}
              </button>
            </div>

            <nav className="flex flex-col gap-1 pt-4">
              {navLinks.map((link) => (
                <Link key={link.href} href={link.href} className="py-3 text-gray-600 font-medium hover:text-brand-accent" onClick={() => setMobileOpen(false)}>
                  {link.label}
                </Link>
              ))}
            </nav>
            <div className="flex flex-col gap-3 mt-4 pt-4 border-t border-brand-border">
              {isAuthenticated ? (
                <Link href="/espace-eleve" className="text-center py-2.5 text-gray-600 font-medium hover:text-brand-accent inline-flex items-center justify-center gap-2" onClick={() => setMobileOpen(false)}>
                  <FontAwesomeIcon icon={faUser} className="text-sm" />
                  Mon espace
                  {unreadCount > 0 && (
                    <span className="min-w-[18px] h-[18px] flex items-center justify-center px-1 rounded-full bg-red-500 text-white text-[10px] font-bold leading-none">
                      {unreadCount}
                    </span>
                  )}
                </Link>
              ) : (
                <Link href="/connexion" className="text-center py-2.5 text-gray-600 font-medium hover:text-brand-accent inline-flex items-center justify-center gap-2" onClick={() => setMobileOpen(false)}>
                  <FontAwesomeIcon icon={faUser} className="text-sm" />
                  Connexion
                </Link>
              )}
              <Link href="/recherche" className="text-center bg-red-600 text-white py-2.5 rounded-lg font-medium hover:bg-red-700 inline-flex items-center justify-center gap-2" onClick={() => setMobileOpen(false)}>
                <FontAwesomeIcon icon={faMagnifyingGlass} className="text-sm" />
                Réserver un stage
              </Link>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
