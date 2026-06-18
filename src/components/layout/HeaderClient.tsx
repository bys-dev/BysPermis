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
import {
  dispatchGeoUpdated,
  saveGeoToStorage,
  clearGeoStorage,
  type GeoLocationDetail,
} from "@/lib/geo-client";

const navLinks = [
  { label: "Stages", href: "/recherche" },
  { label: "Nos Centres", href: "/centres" },
  { label: "Blog", href: "/blog" },
  { label: "Espace Pro", href: "/inscription" },
  { label: "FAQ", href: "/faq" },
];

type GeoStatus = "idle" | "loading" | "success" | "error" | "denied";

/**
 * Bell + dropdown notifications.
 * Hook useNotifications n'est actif que pour les utilisateurs authentifiés.
 */
function NotificationsBell({
  isAuthenticated,
  className,
}: {
  isAuthenticated: boolean;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const { unreadCount, notifications, markAsRead, markAllAsRead } =
    useNotifications({ enabled: isAuthenticated, includeList: open });

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  if (!isAuthenticated) return null;

  return (
    <div className={`relative ${className ?? ""}`} ref={ref}>
      <button
        onClick={() => setOpen(!open)}
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
      {open && (
        <div className="absolute right-0 top-full mt-2 w-72 sm:w-80 bg-white rounded-xl shadow-xl border border-gray-100 z-50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <p className="text-sm font-semibold text-gray-800">Notifications</p>
            {unreadCount > 0 && (
              <button
                onClick={() => markAllAsRead()}
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
                  onClick={() => {
                    if (!n.isRead) markAsRead(n.id);
                    setOpen(false);
                  }}
                  className={`w-full text-left px-4 py-3 border-b border-gray-50 hover:bg-gray-50 transition-colors ${!n.isRead ? "bg-blue-50/50" : ""}`}
                >
                  <p className={`text-sm ${!n.isRead ? "font-semibold text-gray-900" : "text-gray-700"}`}>
                    {n.titre}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{n.contenu}</p>
                  <p className="text-[10px] text-gray-400 mt-1">
                    {new Date(n.createdAt).toLocaleDateString("fr-FR", {
                      day: "numeric",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </button>
              ))
            )}
          </div>
          <div className="border-t border-gray-100 px-4 py-2.5">
            <Link
              href="/espace-eleve/notifications"
              onClick={() => setOpen(false)}
              className="text-xs text-blue-600 hover:underline font-medium"
            >
              Voir toutes les notifications
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * HeaderInteractive : géolocalisation, menu mobile, dropdowns utilisateur.
 * Le shell statique du header (logo, navlinks, bandeau) est rendu côté serveur.
 */
export default function HeaderInteractive() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [geoStatus, setGeoStatus] = useState<GeoStatus>("idle");
  const [city, setCity] = useState<string | null>(null);
  const [dept, setDept] = useState<string | null>(null);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [geoOpen, setGeoOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const geoRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (geoRef.current && !geoRef.current.contains(e.target as Node)) {
        setGeoOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem("bys_city");
    if (saved) setCity(saved);
    const savedDept = localStorage.getItem("bys_dept");
    if (savedDept) setDept(savedDept);
    const savedLat = localStorage.getItem("bys_lat");
    const savedLng = localStorage.getItem("bys_lng");
    if (savedLat && savedLng) {
      const lat = parseFloat(savedLat);
      const lng = parseFloat(savedLng);
      if (!isNaN(lat) && !isNaN(lng)) setCoords({ lat, lng });
    }

    fetch("/api/users/me")
      .then((r) => {
        if (r.ok) setIsAuthenticated(true);
      })
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
            `/api/geolocation/reverse?lat=${latitude}&lng=${longitude}`,
          );
          if (!res.ok) throw new Error("reverse geocode failed");
          const data = await res.json();
          const cityName = data.city || "Votre ville";
          const deptCode: string | null = data.dept ?? null;

          setCity(cityName);
          setDept(deptCode);
          setCoords({ lat: latitude, lng: longitude });
          const geo: GeoLocationDetail = {
            city: cityName,
            dept: deptCode,
            lat: latitude,
            lng: longitude,
            rayon: 25,
          };
          saveGeoToStorage(geo);
          dispatchGeoUpdated(geo);
          setGeoStatus("success");

          const params = new URLSearchParams({
            lat: String(latitude),
            lng: String(longitude),
            rayon: "25",
            ville: cityName,
          });
          if (deptCode) params.set("dept", deptCode);
          router.push(`/recherche?${params.toString()}`);
        } catch {
          setGeoStatus("error");
        }
      },
      (err) => {
        if (err.code === 1) setGeoStatus("denied");
        else setGeoStatus("error");
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 60000 },
    );
  }

  function clearLocation() {
    setCity(null);
    setDept(null);
    setCoords(null);
    setGeoStatus("idle");
    clearGeoStorage();
    setGeoOpen(false);
  }

  function rechercheGeoHref() {
    if (coords) {
      const params = new URLSearchParams({
        lat: String(coords.lat),
        lng: String(coords.lng),
        rayon: "25",
        ville: city ?? "",
      });
      if (dept) params.set("dept", dept);
      return `/recherche?${params.toString()}`;
    }
    if (city) return `/recherche?ville=${encodeURIComponent(city)}&rayon=25`;
    return "/recherche";
  }

  return (
    <>
      {/* Actions desktop */}
      <div className="hidden lg:flex items-center gap-4">
        {/* Géolocalisation */}
        <div className="relative" ref={geoRef}>
          <button
            onClick={() => (city ? setGeoOpen(!geoOpen) : detectLocation())}
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
            <span className="max-w-[160px] truncate">
              {geoStatus === "loading"
                ? "Localisation…"
                : city
                  ? dept
                    ? `${city} (${dept})`
                    : city
                  : "Ma position"}
            </span>
            {city && <FontAwesomeIcon icon={faChevronDown} className="w-3 h-3 opacity-50" />}
          </button>

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
                href={rechercheGeoHref()}
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

          {geoStatus === "denied" && (
            <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-xl shadow-xl border border-red-100 p-4 z-50">
              <p className="text-xs text-red-600 font-medium mb-1">Accès refusé</p>
              <p className="text-xs text-gray-500">
                Autorisez la géolocalisation dans les paramètres de votre navigateur.
              </p>
              <button
                onClick={() => setGeoStatus("idle")}
                className="text-xs text-blue-600 mt-2 hover:underline"
              >
                Fermer
              </button>
            </div>
          )}

          {geoStatus === "error" && (
            <div className="absolute right-0 top-full mt-2 w-72 bg-white rounded-xl shadow-xl border border-red-100 p-4 z-50">
              <p className="text-xs text-red-600 font-medium mb-1">Géolocalisation impossible</p>
              <p className="text-xs text-gray-500">
                Vérifiez que la localisation est activée, puis réessayez. Sinon, saisissez votre ville dans la recherche.
              </p>
              <button
                onClick={() => setGeoStatus("idle")}
                className="text-xs text-blue-600 mt-2 hover:underline"
              >
                Fermer
              </button>
            </div>
          )}
        </div>

        {isAuthenticated ? (
          <>
            <NotificationsBell isAuthenticated={isAuthenticated} />
            <Link
              href="/espace-eleve"
              className="text-gray-600 font-medium hover:text-brand-accent transition-colors inline-flex items-center gap-2"
            >
              <FontAwesomeIcon icon={faUser} className="text-sm" />
              Mon espace
            </Link>
          </>
        ) : (
          <Link
            href="/connexion"
            className="text-gray-600 font-medium hover:text-brand-accent transition-colors inline-flex items-center gap-2"
          >
            <FontAwesomeIcon icon={faUser} className="text-sm" />
            Connexion
          </Link>
        )}

        <Link
          href="/recherche"
          className="bg-red-600 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-red-700 transition-colors inline-flex items-center gap-2"
        >
          <FontAwesomeIcon icon={faMagnifyingGlass} className="text-sm" />
          Réserver un stage
        </Link>
      </div>

      {/* Mobile: notification bell + burger */}
      <div className="flex items-center gap-2 lg:hidden">
        {isAuthenticated && <NotificationsBell isAuthenticated={isAuthenticated} />}
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="text-gray-600 hover:text-brand-accent transition-colors p-1"
          aria-label="Menu"
        >
          <FontAwesomeIcon icon={mobileOpen ? faXmark : faBars} className="text-2xl" />
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="lg:hidden absolute top-full left-0 right-0 border-t border-brand-border bg-white px-4 sm:px-8 pb-6 z-40">
          <div className="pt-4 pb-3 border-b border-brand-border">
            <button
              onClick={() => {
                detectLocation();
                setMobileOpen(false);
              }}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all border"
              style={{
                color: city ? "#2563eb" : "#6b7280",
                borderColor: city ? "#bfdbfe" : "#e5e7eb",
                background: city ? "#eff6ff" : "#f9fafb",
              }}
            >
              {geoStatus === "loading" ? (
                <FontAwesomeIcon icon={faSpinner} className="w-4 h-4 animate-spin" />
              ) : (
                <FontAwesomeIcon
                  icon={city ? faLocationDot : faLocationCrosshairs}
                  className="w-4 h-4"
                />
              )}
              {city ? `Stages près de ${city}` : "Détecter ma position"}
            </button>
          </div>

          <nav className="flex flex-col gap-1 pt-4">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="py-3 text-gray-600 font-medium hover:text-brand-accent"
                onClick={() => setMobileOpen(false)}
              >
                {link.label}
              </Link>
            ))}
          </nav>
          <div className="flex flex-col gap-3 mt-4 pt-4 border-t border-brand-border">
            {isAuthenticated ? (
              <Link
                href="/espace-eleve"
                className="text-center py-2.5 text-gray-600 font-medium hover:text-brand-accent inline-flex items-center justify-center gap-2"
                onClick={() => setMobileOpen(false)}
              >
                <FontAwesomeIcon icon={faUser} className="text-sm" />
                Mon espace
              </Link>
            ) : (
              <Link
                href="/connexion"
                className="text-center py-2.5 text-gray-600 font-medium hover:text-brand-accent inline-flex items-center justify-center gap-2"
                onClick={() => setMobileOpen(false)}
              >
                <FontAwesomeIcon icon={faUser} className="text-sm" />
                Connexion
              </Link>
            )}
            <Link
              href="/recherche"
              className="text-center bg-red-600 text-white py-2.5 rounded-lg font-medium hover:bg-red-700 inline-flex items-center justify-center gap-2"
              onClick={() => setMobileOpen(false)}
            >
              <FontAwesomeIcon icon={faMagnifyingGlass} className="text-sm" />
              Réserver un stage
            </Link>
          </div>
        </div>
      )}
    </>
  );
}
