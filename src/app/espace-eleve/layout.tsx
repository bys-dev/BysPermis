"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faHouse,
  faCalendarCheck,
  faUser,
  faBell,
  faHeadset,
  faArrowRightFromBracket,
  faChevronRight,
  faGraduationCap,
  faCreditCard,
  faComments,
  faHeart,
  faStar,
  faFolderOpen,
} from "@fortawesome/free-solid-svg-icons";
import { useNotifications } from "@/lib/useNotifications";

const sidebarLinks = [
  { href: "/espace-eleve", label: "Accueil", icon: faHouse, exact: true },
  { href: "/espace-eleve/reservations", label: "Mes réservations", icon: faCalendarCheck },
  { href: "/espace-eleve/mes-formations", label: "Mes formations", icon: faGraduationCap },
  { href: "/espace-eleve/paiements", label: "Paiements", icon: faCreditCard },
  { href: "/espace-eleve/documents", label: "Documents", icon: faFolderOpen },
  { href: "/espace-eleve/profil", label: "Mon profil", icon: faUser },
  { href: "/espace-eleve/messages", label: "Messages", icon: faComments },
  { href: "/espace-eleve/fidelite", label: "Fidelite", icon: faStar },
  { href: "/espace-eleve/favoris", label: "Favoris", icon: faHeart },
  { href: "/espace-eleve/notifications", label: "Notifications", icon: faBell, showBadge: true },
  { href: "/espace-eleve/support", label: "Support", icon: faHeadset },
];

export default function EspaceEleveLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { unreadCount } = useNotifications();

  function isActive(href: string, exact?: boolean) {
    if (exact) return pathname === href;
    return pathname === href || pathname.startsWith(href + "/");
  }

  return (
    <div className="min-h-screen flex" style={{ background: "#0A1628" }}>
      {/* Sidebar */}
      <aside className="hidden lg:flex flex-col w-64 shrink-0 border-r" style={{ background: "#0D1D3A", borderColor: "rgba(255,255,255,0.07)" }}>
        {/* Logo */}
        <div className="px-6 py-6 border-b" style={{ borderColor: "rgba(255,255,255,0.07)" }}>
          <Link href="/" className="flex items-center gap-3">
            <div className="w-9 h-9 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="font-bold text-sm text-white">BYS</span>
            </div>
            <span className="font-semibold text-white text-sm">BYS Formation</span>
          </Link>
        </div>

        {/* User badge */}
        <div className="px-6 py-5 border-b" style={{ borderColor: "rgba(255,255,255,0.07)" }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-600/20 flex items-center justify-center">
              <FontAwesomeIcon icon={faGraduationCap} className="text-blue-400 text-sm" />
            </div>
            <div>
              <p className="text-sm font-semibold text-white">Espace Élève</p>
              <p className="text-xs text-gray-500">Mon compte</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-4 py-6 space-y-1">
          {sidebarLinks.map((link) => {
            const active = isActive(link.href, link.exact);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all group ${
                  active
                    ? "text-white bg-white/5"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                <div className="relative">
                  <FontAwesomeIcon
                    icon={link.icon}
                    className={`w-4 h-4 transition-colors ${
                      active ? "text-blue-400" : "group-hover:text-blue-400"
                    }`}
                  />
                  {link.showBadge && unreadCount > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 min-w-[16px] h-4 flex items-center justify-center px-1 rounded-full bg-red-500 text-white text-[10px] font-bold leading-none">
                      {unreadCount > 99 ? "99+" : unreadCount}
                    </span>
                  )}
                </div>
                {link.label}
                <FontAwesomeIcon
                  icon={faChevronRight}
                  className={`w-3 h-3 ml-auto transition-opacity ${
                    active ? "opacity-100 text-blue-400" : "opacity-0 group-hover:opacity-100"
                  }`}
                />
              </Link>
            );
          })}
        </nav>

        {/* Bottom */}
        <div className="px-4 pb-6 border-t pt-4" style={{ borderColor: "rgba(255,255,255,0.07)" }}>
          <Link
            href="/auth/logout"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-500 hover:text-red-400 transition-colors"
          >
            <FontAwesomeIcon icon={faArrowRightFromBracket} className="w-4 h-4" />
            Se déconnecter
          </Link>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar mobile */}
        <div className="lg:hidden flex items-center justify-between px-4 py-4 border-b" style={{ background: "#0D1D3A", borderColor: "rgba(255,255,255,0.07)" }}>
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="font-bold text-xs text-white">BYS</span>
            </div>
            <span className="font-semibold text-white text-sm">Espace Élève</span>
          </Link>
          <div className="flex items-center gap-3">
            {unreadCount > 0 && (
              <Link href="/espace-eleve/notifications" className="relative text-gray-400 hover:text-white text-sm">
                <FontAwesomeIcon icon={faBell} />
                <span className="absolute -top-1 -right-1.5 min-w-[14px] h-3.5 flex items-center justify-center px-0.5 rounded-full bg-red-500 text-white text-[9px] font-bold leading-none">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              </Link>
            )}
            <Link href="/auth/logout" className="text-gray-500 hover:text-red-400 text-sm">
              <FontAwesomeIcon icon={faArrowRightFromBracket} />
            </Link>
          </div>
        </div>

        {/* Mobile nav */}
        <div className="lg:hidden flex gap-1 px-4 py-3 border-b overflow-x-auto" style={{ borderColor: "rgba(255,255,255,0.07)", background: "#0D1D3A" }}>
          {sidebarLinks.map((link) => {
            const active = isActive(link.href, link.exact);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                  active
                    ? "text-white bg-white/10"
                    : "text-gray-400 hover:text-white"
                }`}
                style={active ? undefined : { background: "rgba(255,255,255,0.05)" }}
              >
                <div className="relative">
                  <FontAwesomeIcon icon={link.icon} className="w-3 h-3" />
                  {link.showBadge && unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-red-500" />
                  )}
                </div>
                {link.label}
              </Link>
            );
          })}
        </div>

        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
