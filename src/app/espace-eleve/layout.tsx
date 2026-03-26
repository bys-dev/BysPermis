import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCalendarCheck,
  faUser,
  faBell,
  faArrowRightFromBracket,
  faChevronRight,
  faGraduationCap,
} from "@fortawesome/free-solid-svg-icons";

const sidebarLinks = [
  { href: "/espace-eleve/reservations", label: "Mes réservations", icon: faCalendarCheck },
  { href: "/espace-eleve/profil", label: "Mon profil", icon: faUser },
  { href: "/espace-eleve/notifications", label: "Notifications", icon: faBell },
];

export default function EspaceEleveLayout({ children }: { children: React.ReactNode }) {
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
          {sidebarLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-400 hover:text-white transition-all group"
            >
              <FontAwesomeIcon icon={link.icon} className="w-4 h-4 group-hover:text-blue-400 transition-colors" />
              {link.label}
              <FontAwesomeIcon icon={faChevronRight} className="w-3 h-3 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
            </Link>
          ))}
        </nav>

        {/* Bottom */}
        <div className="px-4 pb-6 border-t pt-4" style={{ borderColor: "rgba(255,255,255,0.07)" }}>
          <Link
            href="/api/auth/logout"
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
          <Link href="/api/auth/logout" className="text-gray-500 hover:text-red-400 text-sm">
            <FontAwesomeIcon icon={faArrowRightFromBracket} />
          </Link>
        </div>

        {/* Mobile nav */}
        <div className="lg:hidden flex gap-1 px-4 py-3 border-b overflow-x-auto" style={{ borderColor: "rgba(255,255,255,0.07)", background: "#0D1D3A" }}>
          {sidebarLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium text-gray-400 hover:text-white whitespace-nowrap transition-colors"
              style={{ background: "rgba(255,255,255,0.05)" }}
            >
              <FontAwesomeIcon icon={link.icon} className="w-3 h-3" />
              {link.label}
            </Link>
          ))}
        </div>

        <main className="flex-1 p-6 lg:p-8 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
