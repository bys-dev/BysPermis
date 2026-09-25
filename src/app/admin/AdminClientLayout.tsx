"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import AdminNotificationBell from "@/components/admin/AdminNotificationBell";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faGauge,
  faBuilding,
  faUsers,
  faHeadset,
  faChartLine,
  faCog,
  faBars,
  faXmark,
  faArrowUpRightFromSquare,
  faShieldHalved,
  faUserShield,
  faScrewdriverWrench,
  faRightFromBracket,
  faCrown,
  faTag,
  faNewspaper,
  faChartBar,
  faStar,
  faBullseye,
  faEnvelopeOpenText,
  faHandshake,
} from "@fortawesome/free-solid-svg-icons";

type UserRole = "ADMIN" | "OWNER";

interface AdminUser {
  prenom: string;
  nom: string;
  role: UserRole;
}

const baseNavItems = [
  { href: "/admin/dashboard", icon: faGauge, label: "Dashboard" },
  { href: "/admin/centres", icon: faBuilding, label: "Centres" },
  { href: "/admin/partenaires", icon: faHandshake, label: "Demandes partenaires" },
  { href: "/admin/prospects", icon: faBullseye, label: "Prospects" },
  { href: "/admin/campagnes", icon: faEnvelopeOpenText, label: "Campagnes" },
  { href: "/admin/utilisateurs", icon: faUsers, label: "Utilisateurs" },
  { href: "/admin/support", icon: faHeadset, label: "Support" },
  { href: "/admin/avis", icon: faStar, label: "Avis plateforme" },
  { href: "/admin/statistiques", icon: faChartLine, label: "Statistiques" },
  { href: "/admin/promo", icon: faTag, label: "Codes promo" },
  { href: "/admin/blog", icon: faNewspaper, label: "Blog" },
  { href: "/admin/parametres", icon: faCog, label: "Paramètres" },
];

const ownerNavItems = [
  { href: "/admin/analytics", icon: faChartBar, label: "Analytics" },
  { href: "/admin/roles", icon: faUserShield, label: "Rôles & Permissions" },
  { href: "/admin/configuration", icon: faScrewdriverWrench, label: "Configuration avancée" },
];

export default function AdminClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [user, setUser] = useState<AdminUser | null>(null);

  useEffect(() => {
    fetch("/api/admin/me")
      .then((r) => {
        if (!r.ok) throw new Error("unauthorized");
        return r.json();
      })
      .then((data) => {
        if (data?.role) setUser(data);
      })
      .catch(() => setUser(null));
  }, []);

  // Demandes partenaires à traiter : badge du menu, rafraîchi à chaque navigation et toutes les minutes.
  const [pendingLeads, setPendingLeads] = useState(0);
  useEffect(() => {
    const load = () =>
      fetch("/api/admin/partenaires?only=pending", { cache: "no-store" })
        .then((r) => (r.ok ? r.json() : null))
        .then((d) => typeof d?.pending === "number" && setPendingLeads(d.pending))
        .catch(() => {});
    const first = setTimeout(load, 0);
    const id = setInterval(load, 60_000);
    return () => {
      clearTimeout(first);
      clearInterval(id);
    };
  }, [pathname]);

  const isOwner = user?.role === "OWNER";
  const navItems = isOwner ? [...baseNavItems, ...ownerNavItems] : baseNavItems;

  return (
    <div className="min-h-screen flex bg-[#16243F]">
      {/* ── Overlay mobile ── */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ── Sidebar ── */}
      <aside
        className={`fixed top-0 left-0 h-full w-64 bg-navy-900 border-r border-white/8 flex flex-col z-40 transform transition-transform duration-200
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0 lg:sticky lg:top-0 lg:h-screen lg:self-start lg:shrink-0 lg:z-auto overflow-y-auto`}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-5 py-5 border-b border-white/8">
          <div className="w-9 h-9 rounded-lg bg-red-600 flex items-center justify-center shrink-0">
            <FontAwesomeIcon icon={faShieldHalved} className="text-white text-sm" />
          </div>
          <div>
            <p className="text-white font-bold text-sm leading-none">BYS Permis</p>
            <p className="text-red-400 text-[10px] font-semibold uppercase tracking-widest mt-0.5">
              {isOwner ? "Owner" : "Admin"} Panel
            </p>
          </div>
          <button
            className="ml-auto lg:hidden text-slate-300 hover:text-white"
            onClick={() => setSidebarOpen(false)}
          >
            <FontAwesomeIcon icon={faXmark} />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {baseNavItems.map((item) => {
            const active = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all
                  ${
                    active
                      ? "bg-red-600/15 text-red-400 border border-red-500/20"
                      : "text-slate-300 hover:text-white hover:bg-white/5"
                  }`}
              >
                <FontAwesomeIcon icon={item.icon} className="w-4 h-4 shrink-0" />
                <span className="flex-1">{item.label}</span>
                {item.href === "/admin/partenaires" && pendingLeads > 0 && (
                  <span
                    className="min-w-5 h-5 px-1.5 rounded-full bg-red-600 text-white text-[11px] font-bold flex items-center justify-center"
                    aria-label={`${pendingLeads} demande(s) à traiter`}
                  >
                    {pendingLeads}
                  </span>
                )}
              </Link>
            );
          })}

          {/* OWNER-only section */}
          {isOwner && (
            <>
              <div className="pt-4 pb-2 px-3">
                <p className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold flex items-center gap-1.5">
                  <FontAwesomeIcon icon={faCrown} className="text-yellow-500 text-[9px]" />
                  Owner uniquement
                </p>
              </div>
              {ownerNavItems.map((item) => {
                const active = pathname === item.href || pathname.startsWith(item.href + "/");
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setSidebarOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all
                      ${
                        active
                          ? "bg-yellow-600/15 text-yellow-400 border border-yellow-500/20"
                          : "text-slate-300 hover:text-white hover:bg-white/5"
                      }`}
                  >
                    <FontAwesomeIcon icon={item.icon} className="w-4 h-4 shrink-0" />
                    {item.label}
                  </Link>
                );
              })}
            </>
          )}
        </nav>

        {/* Footer sidebar */}
        <div className="px-3 pb-4 border-t border-white/8 pt-4 space-y-1">
          {/* User info + role badge */}
          {user && (
            <div className="px-3 py-2.5 rounded-lg bg-white/3 border border-white/5 mb-2">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-linear-to-br from-red-600 to-red-800 flex items-center justify-center shrink-0">
                  <span className="text-white text-[10px] font-bold">
                    {user.prenom?.[0]?.toUpperCase() ?? "A"}
                    {user.nom?.[0]?.toUpperCase() ?? ""}
                  </span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-white text-xs font-medium truncate">
                    {user.prenom} {user.nom}
                  </p>
                  <span
                    className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider mt-0.5
                    ${
                      isOwner
                        ? "bg-yellow-400/10 text-yellow-400 border border-yellow-500/20"
                        : "bg-red-400/10 text-red-400 border border-red-500/20"
                    }`}
                  >
                    <FontAwesomeIcon
                      icon={isOwner ? faCrown : faShieldHalved}
                      className="text-[8px]"
                    />
                    {isOwner ? "Owner" : "Admin"}
                  </span>
                </div>
              </div>
            </div>
          )}

          <Link
            href="/"
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-slate-400 hover:text-gray-300 transition-colors"
          >
            <FontAwesomeIcon icon={faArrowUpRightFromSquare} className="w-3 h-3" />
            Voir le site public
          </Link>
          <a
            href="/auth/logout"
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-red-400/70 hover:text-red-400 transition-colors"
          >
            <FontAwesomeIcon icon={faRightFromBracket} className="w-3 h-3" />
            Déconnexion
          </a>
        </div>
      </aside>

      {/* ── Main ── */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar mobile */}
        <div className="lg:hidden flex items-center gap-3 px-4 py-3 bg-navy-900 border-b border-white/8">
          <button
            onClick={() => setSidebarOpen(true)}
            className="w-9 h-9 flex items-center justify-center rounded-lg bg-white/5 text-gray-300"
          >
            <FontAwesomeIcon icon={faBars} />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-red-600 flex items-center justify-center">
              <FontAwesomeIcon icon={faShieldHalved} className="text-white text-[10px]" />
            </div>
            <span className="text-white font-bold text-sm">BYS Admin</span>
            {user && (
              <span
                className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase
                ${
                  isOwner
                    ? "bg-yellow-400/10 text-yellow-400 border border-yellow-500/20"
                    : "bg-red-400/10 text-red-400 border border-red-500/20"
                }`}
              >
                {isOwner ? "Owner" : "Admin"}
              </span>
            )}
          </div>
          <div className="ml-auto">
            <AdminNotificationBell />
          </div>
        </div>

        {/* Barre desktop : notifications toujours accessibles */}
        <div className="hidden lg:flex sticky top-0 z-30 items-center justify-end gap-3 px-8 py-3 bg-[#16243F]/90 backdrop-blur border-b border-white/5">
          {pendingLeads > 0 && (
            <Link
              href="/admin/partenaires"
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-500/15 border border-blue-400/30 text-blue-200 hover:text-white text-sm font-medium"
            >
              <FontAwesomeIcon icon={faHandshake} className="w-3.5 h-3.5" />
              {pendingLeads} demande{pendingLeads > 1 ? "s" : ""} partenaire{pendingLeads > 1 ? "s" : ""} à traiter
            </Link>
          )}
          <AdminNotificationBell />
        </div>

        <main className="flex-1 p-4 lg:p-8 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}

