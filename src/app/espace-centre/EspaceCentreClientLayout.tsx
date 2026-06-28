"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faChartBar,
  faChartLine,
  faGraduationCap,
  faCalendarDays,
  faCalendar,
  faGear,
  faArrowRightFromBracket,
  faChevronRight,
  faHeadset,
  faUsers,
  faClipboardCheck,
  faBookOpen,
  faPaintBrush,
  faEnvelope,
  faComments,
  faFileLines,
  faFileInvoiceDollar,
  faFileContract,
  faXmark,
  faRocket,
  faTag,
  faStar,
  faBuilding,
} from "@fortawesome/free-solid-svg-icons";
import CentreSwitcher from "@/components/ui/CentreSwitcher";
import { CentreThemeProvider, useCentreTheme } from "@/contexts/CentreThemeContext";
import { centreThemeCssVars } from "@/lib/centre-theme";
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
    href: "/espace-centre/statistiques",
    label: "Statistiques",
    icon: faChartLine,
    roles: ["CENTRE_OWNER", "CENTRE_ADMIN"],
  },
  {
    href: "/espace-centre/avis",
    label: "Avis & questionnaires",
    icon: faStar,
    roles: ["CENTRE_OWNER", "CENTRE_ADMIN"],
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
    href: "/espace-centre/calendrier",
    label: "Calendrier",
    icon: faCalendar,
    roles: ["CENTRE_OWNER", "CENTRE_ADMIN", "CENTRE_FORMATEUR", "CENTRE_SECRETAIRE"],
  },
  {
    href: "/espace-centre/mes-sessions",
    label: "Mes sessions",
    icon: faBookOpen,
    roles: ["CENTRE_FORMATEUR"],
  },
  {
    href: "/espace-centre/disponibilites",
    label: "Disponibilites",
    icon: faCalendar,
    roles: ["CENTRE_FORMATEUR"],
  },
  {
    href: "/espace-centre/contrats",
    label: "Contrats",
    icon: faFileContract,
    roles: ["CENTRE_OWNER", "CENTRE_ADMIN"],
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
    href: "/espace-centre/documents",
    label: "Documents",
    icon: faFileLines,
    roles: ["CENTRE_OWNER", "CENTRE_ADMIN", "CENTRE_SECRETAIRE"],
  },
  {
    href: "/espace-centre/emails",
    label: "Emails",
    icon: faEnvelope,
    roles: ["CENTRE_OWNER", "CENTRE_ADMIN"],
  },
  {
    href: "/espace-centre/messages",
    label: "Messages",
    icon: faComments,
    roles: ["CENTRE_OWNER", "CENTRE_ADMIN", "CENTRE_SECRETAIRE"],
  },
  {
    href: "/espace-centre/promo",
    label: "Codes promo",
    icon: faTag,
    roles: ["CENTRE_OWNER"],
  },
  {
    href: "/espace-centre/facturation",
    label: "Facturation",
    icon: faFileInvoiceDollar,
    roles: ["CENTRE_OWNER"],
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
  if (!role) return allNavItems;
  return allNavItems.filter((item) => item.roles.includes(role));
}

function isNavActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

function EspaceCentreLayoutInner({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const theme = useCentreTheme();
  const [role, setRole] = useState<CentreRole | null>(null);
  const [completionPct, setCompletionPct] = useState<number | null>(null);
  const [bannerDismissed, setBannerDismissed] = useState(false);

  const cssVars = centreThemeCssVars({
    couleurPrimaire: theme.primary,
    couleurSecondaire: theme.secondary,
    logo: theme.logo,
    bannerImage: theme.bannerImage,
    nom: theme.nom,
  });

  const sidebarBg = `linear-gradient(180deg, rgba(${theme.secondaryRgb}, 0.28) 0%, #0A1628 55%)`;
  const panelBg = `linear-gradient(135deg, rgba(${theme.secondaryRgb}, 0.22) 0%, #0D1D3A 100%)`;
  const borderColor = `rgba(${theme.primaryRgb}, 0.18)`;

  useEffect(() => {
    fetch("/api/users/me")
      .then((r) => r.json())
      .then((data) => {
        if (data?.role && data.role.startsWith("CENTRE_")) {
          setRole(data.role as CentreRole);
        } else {
          setRole("CENTRE_OWNER");
        }
      })
      .catch(() => setRole("CENTRE_OWNER"));

    fetch("/api/centre/completion")
      .then((r) => r.json())
      .then((data) => {
        if (typeof data.percentage === "number") {
          setCompletionPct(data.percentage);
        }
      })
      .catch(() => null);
  }, []);

  const navItems = getNavItems(role);
  const showCompletionBanner = completionPct !== null && completionPct < 100 && !bannerDismissed;

  function navLinkClass(href: string, compact = false) {
    const active = isNavActive(pathname, href);
    const base = compact
      ? "flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors"
      : "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all group";

    if (active) {
      return `${base} font-semibold text-white`;
    }
    return `${base} font-medium text-slate-300 hover:text-white hover:bg-white/8`;
  }

  function navLinkStyle(href: string, compact = false) {
    const active = isNavActive(pathname, href);
    if (!active) {
      return compact ? { background: "rgba(255,255,255,0.05)" } : undefined;
    }
    return {
      background: "rgba(255,255,255,0.14)",
      borderLeft: `3px solid ${theme.primary}`,
      borderTop: "1px solid rgba(255,255,255,0.1)",
      borderRight: "1px solid rgba(255,255,255,0.1)",
      borderBottom: "1px solid rgba(255,255,255,0.1)",
      color: "#ffffff",
    };
  }

  return (
    <div
      className="centre-themed min-h-screen flex"
      style={{
        ...cssVars,
        background: `linear-gradient(160deg, rgba(${theme.secondaryRgb}, 0.12) 0%, #0A1628 45%)`,
      }}
    >
      <aside
        className="hidden lg:flex flex-col w-64 shrink-0 border-r"
        style={{ background: sidebarBg, borderColor: "rgba(255,255,255,0.07)" }}
      >
        <div
          className="px-5 py-4 border-b"
          style={{
            borderColor: "rgba(255,255,255,0.1)",
            background: "rgba(255,255,255,0.04)",
          }}
        >
          <Link href="/espace-centre/dashboard" className="flex items-center gap-3 min-w-0">
            {theme.logo ? (
              <div
                className="w-11 h-11 rounded-xl overflow-hidden shrink-0 border flex items-center justify-center"
                style={{
                  borderColor: `rgba(${theme.primaryRgb}, 0.4)`,
                  background: `rgba(${theme.primaryRgb}, 0.15)`,
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={theme.logo} alt="" className="w-full h-full object-contain p-1" />
              </div>
            ) : (
              <div
                className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 font-bold text-sm text-white select-none"
                style={{ background: theme.primary }}
              >
                {(theme.nom ?? "?")
                  .split(/\s+/)
                  .filter(Boolean)
                  .slice(0, 2)
                  .map((w: string) => w[0].toUpperCase())
                  .join("")}
              </div>
            )}
            <div className="min-w-0">
              <p className="text-[15px] font-bold text-white leading-tight tracking-tight">
                Espace centre
              </p>
              <p className="text-xs text-gray-300 mt-1 font-medium">BYS Formation · Permis</p>
            </div>
          </Link>
        </div>

        <div className="border-b" style={{ borderColor: "rgba(255,255,255,0.07)" }}>
          <CentreSwitcher userRole={role} />
        </div>

        <nav className="flex-1 px-4 py-6 space-y-1">
          {navItems.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={navLinkClass(link.href)}
              style={navLinkStyle(link.href)}
            >
              <FontAwesomeIcon
                icon={link.icon}
                className="w-4 h-4 shrink-0 transition-colors"
                style={{
                  color: isNavActive(pathname, link.href) ? "#ffffff" : "rgb(148 163 184)",
                }}
              />
              {link.label}
              <FontAwesomeIcon
                icon={faChevronRight}
                className="w-3 h-3 ml-auto opacity-0 group-hover:opacity-100 transition-opacity"
              />
            </Link>
          ))}
        </nav>

        <div className="px-4 pb-6 border-t pt-4" style={{ borderColor: "rgba(255,255,255,0.07)" }}>
          <Link
            href="/"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-500 transition-colors mb-2 hover:text-white"
            style={{ color: undefined }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = theme.primary;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = "";
            }}
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

      <div className="flex-1 flex flex-col min-w-0">
        <div
          className="lg:hidden flex items-center justify-between px-4 py-4 border-b"
          style={{ background: panelBg, borderColor: "rgba(255,255,255,0.07)" }}
        >
          <Link href="/espace-centre/dashboard" className="flex items-center gap-2 min-w-0">
            {theme.logo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={theme.logo} alt="" className="w-8 h-8 rounded-lg object-contain border border-white/10" />
            ) : (
              <Image
                src="/transparent-logo.svg"
                alt="BYS Formation"
                width={120}
                height={32}
                className="h-8 w-auto brightness-0 invert"
              />
            )}
            <span className="font-bold text-white text-sm truncate max-w-[50vw]">
              {theme.nom || "Espace centre"}
            </span>
          </Link>
          <Link href="/auth/logout" className="text-gray-500 hover:text-red-400 text-sm">
            <FontAwesomeIcon icon={faArrowRightFromBracket} />
          </Link>
        </div>

        {theme.bannerImage && (
          <div
            className="hidden sm:block h-20 lg:h-24 bg-cover bg-center border-b shrink-0"
            style={{
              backgroundImage: `linear-gradient(rgba(10,22,40,0.55), rgba(10,22,40,0.85)), url(${theme.bannerImage})`,
              borderColor: "rgba(255,255,255,0.07)",
            }}
          />
        )}

        <div
          className="lg:hidden flex gap-1 px-4 py-3 border-b overflow-x-auto"
          style={{ borderColor: "rgba(255,255,255,0.07)", background: panelBg }}
        >
          {navItems.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={navLinkClass(link.href, true)}
              style={navLinkStyle(link.href, true)}
            >
              <FontAwesomeIcon icon={link.icon} className="w-3 h-3" />
              {link.label}
            </Link>
          ))}
        </div>

        {showCompletionBanner && (
          <div
            className="flex items-center gap-3 px-6 py-3 text-sm border-b bg-white border-slate-200"
          >
            <FontAwesomeIcon
              icon={faRocket}
              className="w-4 h-4 shrink-0"
              style={{ color: theme.primary }}
            />
            <div className="flex-1 flex items-center gap-3 min-w-0">
              <span className="text-slate-800 text-sm sm:text-base">
                Améliorez votre profil (
                <span className="font-bold" style={{ color: theme.primary }}>
                  {completionPct}%
                </span>
                ) pour optimiser votre visibilité
              </span>
              <div className="hidden sm:block w-24 h-1.5 rounded-full bg-white/10 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{ width: `${completionPct}%`, background: theme.primary }}
                />
              </div>
            </div>
            <Link
              href="/espace-centre/onboarding"
              className="shrink-0 text-xs font-semibold transition-colors px-3 py-1 rounded-lg"
              style={{
                color: theme.primary,
                background: `rgba(${theme.primaryRgb}, 0.12)`,
                border: `1px solid rgba(${theme.primaryRgb}, 0.25)`,
              }}
            >
              Completer
            </Link>
            <button
              onClick={() => setBannerDismissed(true)}
              className="shrink-0 text-gray-600 hover:text-gray-400 transition-colors"
              title="Masquer"
            >
              <FontAwesomeIcon icon={faXmark} className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        <main className="relative flex-1 p-4 sm:p-6 lg:p-8 overflow-auto bg-slate-100">
          {children}
        </main>
      </div>
    </div>
  );
}

export default function EspaceCentreClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <CentreThemeProvider>
      <EspaceCentreLayoutInner>{children}</EspaceCentreLayoutInner>
    </CentreThemeProvider>
  );
}
