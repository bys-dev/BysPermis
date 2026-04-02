"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faChartBar,
  faGraduationCap,
  faCalendarDays,
  faGear,
  faArrowRightFromBracket,
  faChevronRight,
  faBuilding,
  faHeadset,
  faUsers,
  faClipboardCheck,
  faBookOpen,
  faPaintBrush,
  faEnvelope,
} from "@fortawesome/free-solid-svg-icons";
import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";

type CentreRole = "CENTRE_OWNER" | "CENTRE_ADMIN" | "CENTRE_FORMATEUR" | "CENTRE_SECRETAIRE";

interface NavItem {
  href: string;
  label: string;
  icon: IconDefinition;
  roles: CentreRole[];
}

const allNavItems: NavItem[] = [
  {
    href: "/espace-centre/dashboard",
    label: "Dashboard",
    icon: faChartBar,
    roles: ["CENTRE_OWNER", "CENTRE_ADMIN", "CENTRE_FORMATEUR", "CENTRE_SECRETAIRE"],
  },
  {
    href: "/espace-centre/formations",
    label: "Mes formations",
    icon: faGraduationCap,
    roles: ["CENTRE_OWNER", "CENTRE_ADMIN"],
  },
  {
    href: "/espace-centre/sessions",
    label: "Sessions",
    icon: faCalendarDays,
    roles: ["CENTRE_OWNER", "CENTRE_ADMIN", "CENTRE_SECRETAIRE"],
  },
  {
    href: "/espace-centre/mes-sessions",
    label: "Mes sessions",
    icon: faBookOpen,
    roles: ["CENTRE_FORMATEUR"],
  },
  {
    href: "/espace-centre/equipe",
    label: "Équipe",
    icon: faUsers,
    roles: ["CENTRE_OWNER", "CENTRE_ADMIN"],
  },
  {
    href: "/espace-centre/emargement",
    label: "Émargement",
    icon: faClipboardCheck,
    roles: ["CENTRE_FORMATEUR"],
  },
  {
    href: "/espace-centre/profil-centre",
    label: "Profil centre",
    icon: faPaintBrush,
    roles: ["CENTRE_OWNER", "CENTRE_ADMIN"],
  },
  {
    href: "/espace-centre/emails",
    label: "Emails",
    icon: faEnvelope,
    roles: ["CENTRE_OWNER", "CENTRE_ADMIN"],
  },
  {
    href: "/espace-centre/support",
    label: "Support",
    icon: faHeadset,
    roles: ["CENTRE_OWNER", "CENTRE_ADMIN", "CENTRE_SECRETAIRE"],
  },
  {
    href: "/espace-centre/parametres",
    label: "Paramètres",
    icon: faGear,
    roles: ["CENTRE_OWNER"],
  },
];

function getNavItems(role: CentreRole | null): NavItem[] {
  if (!role) return allNavItems; // fallback: show all while loading
  return allNavItems.filter((item) => item.roles.includes(role));
}

const roleBadgeLabels: Record<CentreRole, string> = {
  CENTRE_OWNER: "Propriétaire",
  CENTRE_ADMIN: "Administrateur",
  CENTRE_FORMATEUR: "Formateur",
  CENTRE_SECRETAIRE: "Secrétariat",
};

export default function EspaceCentreLayout({ children }: { children: React.ReactNode }) {
  const [role, setRole] = useState<CentreRole | null>(null);

  useEffect(() => {
    fetch("/api/users/me")
      .then((r) => r.json())
      .then((data) => {
        if (data?.role && data.role.startsWith("CENTRE_")) {
          setRole(data.role as CentreRole);
        } else {
          // Platform admins viewing centre space — show everything
          setRole("CENTRE_OWNER");
        }
      })
      .catch(() => setRole("CENTRE_OWNER"));
  }, []);

  const navItems = getNavItems(role);

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

        {/* Centre badge */}
        <div className="px-6 py-5 border-b" style={{ borderColor: "rgba(255,255,255,0.07)" }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-600/20 flex items-center justify-center">
              <FontAwesomeIcon icon={faBuilding} className="text-blue-400 text-sm" />
            </div>
            <div>
              <p className="text-sm font-semibold text-white">Espace Centre</p>
              <p className="text-xs text-gray-500">
                {role ? roleBadgeLabels[role] : "Chargement…"}
              </p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-4 py-6 space-y-1">
          {navItems.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-400 hover:text-white hover:bg-white/5 transition-all group"
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
            href="/"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-500 hover:text-blue-400 transition-colors mb-2"
          >
            ← Voir le site
          </Link>
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
            <span className="font-semibold text-white text-sm">Espace Centre</span>
          </Link>
          <Link href="/auth/logout" className="text-gray-500 hover:text-red-400 text-sm">
            <FontAwesomeIcon icon={faArrowRightFromBracket} />
          </Link>
        </div>

        {/* Mobile nav */}
        <div className="lg:hidden flex gap-1 px-4 py-3 border-b overflow-x-auto" style={{ borderColor: "rgba(255,255,255,0.07)", background: "#0D1D3A" }}>
          {navItems.map((link) => (
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
