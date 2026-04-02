"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faGauge,
  faUser,
  faHeadset,
  faShieldHalved,
  faEuro,
  faFileExport,
  faPercent,
  faBuilding,
  faUserTie,
  faChartLine,
  faBars,
  faXmark,
  faArrowUpRightFromSquare,
  faRightFromBracket,
  faSpinner,
} from "@fortawesome/free-solid-svg-icons";
import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";

interface NavItem {
  href: string;
  icon: IconDefinition;
  label: string;
  roles: string[];
}

const navItems: NavItem[] = [
  // Common
  { href: "/plateforme/dashboard", icon: faGauge, label: "Dashboard", roles: ["SUPPORT", "COMPTABLE", "COMMERCIAL", "ADMIN", "OWNER"] },
  { href: "/plateforme/profil", icon: faUser, label: "Mon profil", roles: ["SUPPORT", "COMPTABLE", "COMMERCIAL", "ADMIN", "OWNER"] },
  // Support
  { href: "/plateforme/tickets", icon: faHeadset, label: "Tickets", roles: ["SUPPORT", "ADMIN", "OWNER"] },
  { href: "/plateforme/moderation", icon: faShieldHalved, label: "Moderation", roles: ["SUPPORT", "ADMIN", "OWNER"] },
  // Comptable
  { href: "/plateforme/revenus", icon: faEuro, label: "Revenus", roles: ["COMPTABLE", "ADMIN", "OWNER"] },
  { href: "/plateforme/commissions", icon: faPercent, label: "Commissions", roles: ["COMPTABLE", "ADMIN", "OWNER"] },
  { href: "/plateforme/exports", icon: faFileExport, label: "Exports", roles: ["COMPTABLE", "ADMIN", "OWNER"] },
  // Commercial
  { href: "/plateforme/commercial", icon: faChartLine, label: "Commercial", roles: ["COMMERCIAL", "ADMIN", "OWNER"] },
  { href: "/plateforme/centres", icon: faBuilding, label: "Centres", roles: ["COMMERCIAL", "ADMIN", "OWNER"] },
  { href: "/plateforme/prospects", icon: faUserTie, label: "Prospects", roles: ["COMMERCIAL", "ADMIN", "OWNER"] },
  { href: "/plateforme/statistiques", icon: faChartLine, label: "Statistiques", roles: ["COMMERCIAL", "ADMIN", "OWNER"] },
];

const roleLabelMap: Record<string, string> = {
  SUPPORT: "Support",
  COMPTABLE: "Comptable",
  COMMERCIAL: "Commercial",
  ADMIN: "Admin",
  OWNER: "Owner",
};

export default function PlateformeLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((data) => {
        if (data?.role) setUserRole(data.role);
        else setUserRole("SUPPORT");
      })
      .catch(() => setUserRole("SUPPORT"))
      .finally(() => setLoading(false));
  }, []);

  const visibleItems = navItems.filter(
    (item) => userRole && item.roles.includes(userRole)
  );

  const roleLabel = userRole ? (roleLabelMap[userRole] ?? userRole) : "Staff";

  return (
    <div className="min-h-screen flex bg-[#060E1A]">
      {/* Overlay mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full w-64 bg-[#0A1628] border-r border-white/8 flex flex-col z-40 transform transition-transform duration-200
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0 lg:static lg:z-auto`}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-5 py-5 border-b border-white/8">
          <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center shrink-0">
            <FontAwesomeIcon icon={faShieldHalved} className="text-white text-sm" />
          </div>
          <div>
            <p className="text-white font-bold text-sm leading-none">BYS Permis</p>
            <p className="text-blue-400 text-[10px] font-semibold uppercase tracking-widest mt-0.5">
              {loading ? "..." : roleLabel}
            </p>
          </div>
          <button
            className="ml-auto lg:hidden text-gray-400 hover:text-white"
            onClick={() => setSidebarOpen(false)}
          >
            <FontAwesomeIcon icon={faXmark} />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {loading ? (
            <div className="flex items-center gap-2 px-3 py-4 text-gray-500 text-sm">
              <FontAwesomeIcon icon={faSpinner} className="animate-spin" />
              <span>Chargement...</span>
            </div>
          ) : (
            visibleItems.map((item) => {
              const active = pathname === item.href || pathname.startsWith(item.href + "/");
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all
                    ${active
                      ? "bg-blue-600/15 text-blue-400 border border-blue-500/20"
                      : "text-gray-400 hover:text-white hover:bg-white/5"
                    }`}
                >
                  <FontAwesomeIcon icon={item.icon} className="w-4 h-4 shrink-0" />
                  {item.label}
                </Link>
              );
            })
          )}
        </nav>

        {/* Footer sidebar */}
        <div className="px-3 pb-4 border-t border-white/8 pt-4 space-y-1">
          <Link
            href="/"
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-gray-500 hover:text-gray-300 transition-colors"
          >
            <FontAwesomeIcon icon={faArrowUpRightFromSquare} className="w-3 h-3" />
            Voir le site public
          </Link>
          <a
            href="/auth/logout"
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-gray-500 hover:text-red-400 transition-colors"
          >
            <FontAwesomeIcon icon={faRightFromBracket} className="w-3 h-3" />
            Se deconnecter
          </a>
          <div className="px-3 py-2">
            <p className="text-[10px] text-gray-600 leading-relaxed">
              Connecte en tant que {roleLabel.toLowerCase()}
            </p>
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar mobile */}
        <div className="lg:hidden flex items-center gap-3 px-4 py-3 bg-[#0A1628] border-b border-white/8">
          <button
            onClick={() => setSidebarOpen(true)}
            className="w-9 h-9 flex items-center justify-center rounded-lg bg-white/5 text-gray-300"
          >
            <FontAwesomeIcon icon={faBars} />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-blue-600 flex items-center justify-center">
              <FontAwesomeIcon icon={faShieldHalved} className="text-white text-[10px]" />
            </div>
            <span className="text-white font-bold text-sm">BYS Plateforme</span>
          </div>
        </div>

        <main className="flex-1 p-4 lg:p-8 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
