"use client";

import { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCalendarCheck,
  faCircleCheck,
  faHourglassHalf,
  faFlagCheckered,
  faClipboardList,
  faSearch,
  faUser,
  faListCheck,
  faBell,
  faCircleInfo,
  faFileLines,
  faSpinner,
  faTriangleExclamation,
  faArrowRight,
  faClock,
  faLocationDot,
} from "@fortawesome/free-solid-svg-icons";
import Link from "next/link";
import { formatDate, formatPrice } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────
interface UserProfile {
  id: string;
  prenom: string;
  nom: string;
  email: string;
}

interface Reservation {
  id: string;
  numero: string;
  status: "EN_ATTENTE" | "CONFIRMEE" | "ANNULEE" | "REMBOURSEE" | "TERMINEE";
  montant: number;
  createdAt: string;
  session: {
    dateDebut: string;
    dateFin: string;
    formation: {
      titre: string;
      slug?: string;
      centre: { nom: string; ville: string };
    };
  };
}

interface Notification {
  id: string;
  titre: string;
  contenu: string;
  isRead: boolean;
  createdAt: string;
}

function iconForNotif(titre: string) {
  const t = titre.toLowerCase();
  if (t.includes("réservation") || t.includes("confirmé")) {
    return { icon: faCalendarCheck, color: "text-green-400", bg: "bg-green-400/10" };
  }
  if (t.includes("convocation") || t.includes("document")) {
    return { icon: faFileLines, color: "text-blue-400", bg: "bg-blue-400/10" };
  }
  if (t.includes("annul")) {
    return { icon: faCircleInfo, color: "text-red-400", bg: "bg-red-400/10" };
  }
  return { icon: faBell, color: "text-gray-400", bg: "bg-gray-400/10" };
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "A l'instant";
  if (mins < 60) return `Il y a ${mins}min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `Il y a ${hours}h`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "Hier";
  return `Il y a ${days} jours`;
}

function daysUntil(dateStr: string): number {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const target = new Date(dateStr);
  target.setHours(0, 0, 0, 0);
  return Math.ceil((target.getTime() - now.getTime()) / 86400000);
}

export default function DashboardPage() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchAll() {
      try {
        const [userRes, reservRes, notifRes] = await Promise.all([
          fetch("/api/users/me"),
          fetch("/api/reservations"),
          fetch("/api/notifications"),
        ]);

        if (!userRes.ok) throw new Error("Impossible de charger votre profil");

        const userData = await userRes.json();
        setUser(userData);

        if (reservRes.ok) {
          const reservData = await reservRes.json();
          setReservations(Array.isArray(reservData) ? reservData : []);
        }

        if (notifRes.ok) {
          const notifData = await notifRes.json();
          setNotifications(Array.isArray(notifData) ? notifData.slice(0, 3) : []);
        }
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Erreur lors du chargement"
        );
      } finally {
        setLoading(false);
      }
    }
    fetchAll();
  }, []);

  // Compute stats
  const stats = {
    total: reservations.length,
    confirmees: reservations.filter((r) => r.status === "CONFIRMEE").length,
    terminees: reservations.filter((r) => r.status === "TERMINEE").length,
    enAttente: reservations.filter((r) => r.status === "EN_ATTENTE").length,
  };

  // Next upcoming confirmed reservation
  const now = new Date();
  const nextReservation = reservations
    .filter(
      (r) =>
        r.status === "CONFIRMEE" && new Date(r.session.dateDebut) > now
    )
    .sort(
      (a, b) =>
        new Date(a.session.dateDebut).getTime() -
        new Date(b.session.dateDebut).getTime()
    )[0] ?? null;

  // ─── Loading ──────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 gap-3 text-gray-500">
        <FontAwesomeIcon icon={faSpinner} className="animate-spin text-xl" />
        <span className="text-sm">Chargement du tableau de bord...</span>
      </div>
    );
  }

  // ─── Error ────────────────────────────────────────────
  if (error || !user) {
    return (
      <div
        className="text-center py-16 rounded-xl border"
        style={{
          background: "rgba(220,38,38,0.05)",
          borderColor: "rgba(220,38,38,0.15)",
        }}
      >
        <FontAwesomeIcon
          icon={faTriangleExclamation}
          className="text-3xl text-red-400 mb-3"
        />
        <p className="text-white font-medium mb-1">Erreur de chargement</p>
        <p className="text-gray-500 text-sm mb-6">
          {error || "Impossible de charger votre profil."}
        </p>
        <button
          onClick={() => window.location.reload()}
          className="inline-block bg-red-600 text-white px-6 py-2.5 rounded-lg font-semibold text-sm hover:bg-red-700 transition-all"
        >
          Réessayer
        </button>
      </div>
    );
  }

  const daysLeft = nextReservation
    ? daysUntil(nextReservation.session.dateDebut)
    : null;

  return (
    <div>
      {/* Welcome */}
      <div className="mb-8">
        <h1 className="font-display font-bold text-2xl text-white mb-1">
          Bonjour, {user.prenom || user.nom} !
        </h1>
        <p className="text-gray-500 text-sm">
          Bienvenue dans votre espace personnel
        </p>
      </div>

      {/* Next session card */}
      {nextReservation && (
        <Link
          href={`/espace-eleve/reservations/${nextReservation.id}`}
          className="block mb-8 rounded-xl p-6 border transition-all hover:border-blue-500/30"
          style={{
            background:
              "linear-gradient(135deg, rgba(59,130,246,0.12) 0%, rgba(59,130,246,0.04) 100%)",
            borderColor: "rgba(59,130,246,0.2)",
          }}
        >
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-lg bg-blue-600/20 flex items-center justify-center">
              <FontAwesomeIcon
                icon={faCalendarCheck}
                className="text-blue-400 text-sm"
              />
            </div>
            <h2 className="text-sm font-semibold text-blue-400">
              Prochaine session
            </h2>
            {daysLeft !== null && (
              <span className="ml-auto text-xs font-medium text-blue-300 bg-blue-500/15 px-2.5 py-1 rounded-full">
                {daysLeft === 0
                  ? "Aujourd'hui"
                  : daysLeft === 1
                    ? "Demain"
                    : `Dans ${daysLeft} jours`}
              </span>
            )}
          </div>
          <h3 className="text-white font-semibold text-lg mb-2">
            {nextReservation.session.formation.titre}
          </h3>
          <div className="flex flex-wrap gap-x-5 gap-y-1 text-sm text-gray-400">
            <span className="flex items-center gap-1.5">
              <FontAwesomeIcon icon={faClock} className="w-3.5 h-3.5" />
              {formatDate(nextReservation.session.dateDebut)} —{" "}
              {formatDate(nextReservation.session.dateFin)}
            </span>
            <span className="flex items-center gap-1.5">
              <FontAwesomeIcon icon={faLocationDot} className="w-3.5 h-3.5" />
              {nextReservation.session.formation.centre.nom} —{" "}
              {nextReservation.session.formation.centre.ville}
            </span>
          </div>
        </Link>
      )}

      {/* Stats rapides */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          {
            label: "Total réservations",
            value: stats.total,
            icon: faClipboardList,
            color: "text-white",
            iconColor: "text-blue-400",
            iconBg: "bg-blue-400/10",
          },
          {
            label: "Confirmées",
            value: stats.confirmees,
            icon: faCircleCheck,
            color: "text-green-400",
            iconColor: "text-green-400",
            iconBg: "bg-green-400/10",
          },
          {
            label: "Terminées",
            value: stats.terminees,
            icon: faFlagCheckered,
            color: "text-gray-400",
            iconColor: "text-gray-400",
            iconBg: "bg-gray-400/10",
          },
          {
            label: "En attente",
            value: stats.enAttente,
            icon: faHourglassHalf,
            color: "text-yellow-400",
            iconColor: "text-yellow-400",
            iconBg: "bg-yellow-400/10",
          },
        ].map((s) => (
          <div
            key={s.label}
            className="rounded-xl p-4 border"
            style={{
              background: "rgba(255,255,255,0.04)",
              borderColor: "rgba(255,255,255,0.07)",
            }}
          >
            <div className="flex items-center gap-3 mb-3">
              <div
                className={`w-9 h-9 rounded-lg flex items-center justify-center ${s.iconBg}`}
              >
                <FontAwesomeIcon
                  icon={s.icon}
                  className={`w-4 h-4 ${s.iconColor}`}
                />
              </div>
            </div>
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-gray-500 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Actions rapides */}
      <div className="mb-8">
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">
          Actions rapides
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            {
              href: "/recherche",
              label: "Rechercher un stage",
              icon: faSearch,
              color: "text-red-400",
              bg: "bg-red-400/10",
            },
            {
              href: "/espace-eleve/profil",
              label: "Mon profil",
              icon: faUser,
              color: "text-blue-400",
              bg: "bg-blue-400/10",
            },
            {
              href: "/espace-eleve/reservations",
              label: "Mes réservations",
              icon: faListCheck,
              color: "text-green-400",
              bg: "bg-green-400/10",
            },
          ].map((action) => (
            <Link
              key={action.href}
              href={action.href}
              className="flex items-center gap-3 p-4 rounded-xl border transition-all hover:border-blue-500/20 group"
              style={{
                background: "rgba(255,255,255,0.04)",
                borderColor: "rgba(255,255,255,0.07)",
              }}
            >
              <div
                className={`w-10 h-10 rounded-lg flex items-center justify-center ${action.bg}`}
              >
                <FontAwesomeIcon
                  icon={action.icon}
                  className={`w-4 h-4 ${action.color}`}
                />
              </div>
              <span className="text-sm font-medium text-white">
                {action.label}
              </span>
              <FontAwesomeIcon
                icon={faArrowRight}
                className="w-3 h-3 ml-auto text-gray-600 group-hover:text-blue-400 transition-colors"
              />
            </Link>
          ))}
        </div>
      </div>

      {/* Dernières notifications */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">
            Dernières notifications
          </h2>
          <Link
            href="/espace-eleve/notifications"
            className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
          >
            Voir tout
          </Link>
        </div>

        {notifications.length === 0 ? (
          <div
            className="text-center py-8 rounded-xl border"
            style={{
              background: "rgba(255,255,255,0.03)",
              borderColor: "rgba(255,255,255,0.06)",
            }}
          >
            <FontAwesomeIcon
              icon={faBell}
              className="text-gray-700 text-2xl mb-2"
            />
            <p className="text-gray-500 text-sm">Aucune notification</p>
          </div>
        ) : (
          <div className="space-y-2">
            {notifications.map((n) => {
              const { icon, color, bg } = iconForNotif(n.titre);
              return (
                <div
                  key={n.id}
                  className="flex gap-3 p-3.5 rounded-xl"
                  style={{
                    background: n.isRead
                      ? "rgba(255,255,255,0.03)"
                      : "rgba(255,255,255,0.06)",
                    border: `1px solid ${n.isRead ? "rgba(255,255,255,0.06)" : "rgba(59,130,246,0.2)"}`,
                  }}
                >
                  <div
                    className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${bg}`}
                  >
                    <FontAwesomeIcon
                      icon={icon}
                      className={`w-3.5 h-3.5 ${color}`}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="text-sm font-medium text-white truncate">
                        {n.titre}
                      </p>
                      {!n.isRead && (
                        <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0" />
                      )}
                    </div>
                    <p className="text-xs text-gray-500 truncate">
                      {n.contenu}
                    </p>
                    <p className="text-xs text-gray-700 mt-1">
                      {timeAgo(n.createdAt)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
