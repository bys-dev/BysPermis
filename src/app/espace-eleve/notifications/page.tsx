"use client";

import { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBell, faCalendarCheck, faFileLines, faCircleInfo, faSpinner } from "@fortawesome/free-solid-svg-icons";

interface Notification {
  id: string;
  titre: string;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: string;
}

function iconForType(type: string) {
  if (type === "RESERVATION") return { icon: faCalendarCheck, color: "text-green-400", bg: "bg-green-400/10" };
  if (type === "DOCUMENT") return { icon: faFileLines, color: "text-blue-400", bg: "bg-blue-400/10" };
  return { icon: faCircleInfo, color: "text-gray-400", bg: "bg-gray-400/10" };
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `Il y a ${mins}min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `Il y a ${hours}h`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "Hier";
  return `Il y a ${days} jours`;
}

const MOCK: Notification[] = [
  { id: "1", titre: "Réservation confirmée", message: "Votre stage du 12 avril 2026 à Osny est confirmé. Votre convocation a été envoyée par email.", type: "RESERVATION", isRead: false, createdAt: new Date(Date.now() - 2 * 3600000).toISOString() },
  { id: "2", titre: "Convocation disponible", message: "La convocation pour votre stage BYS Formation — Osny est disponible.", type: "DOCUMENT", isRead: false, createdAt: new Date(Date.now() - 3 * 3600000).toISOString() },
  { id: "3", titre: "Rappel de stage", message: "Votre stage commence dans 7 jours. Pensez à préparer vos documents.", type: "INFO", isRead: true, createdAt: new Date(Date.now() - 86400000).toISOString() },
];

export default function NotificationsPage() {
  const [notifs, setNotifs] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [marking, setMarking] = useState(false);

  useEffect(() => {
    fetch("/api/notifications")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) setNotifs(data);
        else setNotifs(MOCK);
      })
      .catch(() => setNotifs(MOCK))
      .finally(() => setLoading(false));
  }, []);

  async function markAllRead() {
    setMarking(true);
    await fetch("/api/notifications", { method: "PATCH" }).catch(() => null);
    setNotifs((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setMarking(false);
  }

  const unreadCount = notifs.filter((n) => !n.isRead).length;

  return (
    <div className="max-w-2xl">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="font-display font-bold text-2xl text-white mb-1">Notifications</h1>
          <p className="text-gray-500 text-sm">
            {loading ? "Chargement…" : unreadCount > 0 ? `${unreadCount} non lue${unreadCount > 1 ? "s" : ""}` : "Tout est lu"}
          </p>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={markAllRead}
            disabled={marking}
            className="text-xs text-gray-500 hover:text-blue-400 transition-colors disabled:opacity-50"
          >
            {marking ? "…" : "Tout marquer comme lu"}
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16 gap-3 text-gray-500">
          <FontAwesomeIcon icon={faSpinner} className="animate-spin text-xl" />
          <span className="text-sm">Chargement…</span>
        </div>
      ) : notifs.length === 0 ? (
        <div className="text-center py-16">
          <FontAwesomeIcon icon={faBell} className="text-gray-700 text-4xl mb-4" />
          <p className="text-gray-500">Aucune notification</p>
        </div>
      ) : (
        <div className="space-y-3">
          {notifs.map((n) => {
            const { icon, color, bg } = iconForType(n.type);
            return (
              <div
                key={n.id}
                className="flex gap-4 p-4 rounded-xl transition-all"
                style={{
                  background: n.isRead ? "rgba(255,255,255,0.03)" : "rgba(255,255,255,0.06)",
                  border: `1px solid ${n.isRead ? "rgba(255,255,255,0.06)" : "rgba(59,130,246,0.2)"}`,
                }}
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${bg}`}>
                  <FontAwesomeIcon icon={icon} className={`w-4 h-4 ${color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <p className="text-sm font-semibold text-white">{n.titre}</p>
                    {!n.isRead && <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0" />}
                  </div>
                  <p className="text-xs text-gray-500 leading-relaxed">{n.message}</p>
                  <p className="text-xs text-gray-700 mt-2">{timeAgo(n.createdAt)}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
