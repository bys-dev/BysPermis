"use client";

import { useState, useEffect, useCallback } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBell, faCalendarCheck, faFileLines, faCircleInfo,
  faSpinner, faTriangleExclamation,
} from "@fortawesome/free-solid-svg-icons";

interface Notification {
  id: string;
  titre: string;
  contenu: string;
  isRead: boolean;
  createdAt: string;
}

function iconForType(titre: string) {
  const t = titre.toLowerCase();
  if (t.includes("réservation") || t.includes("confirmé")) {
    return { icon: faCalendarCheck, color: "text-green-400", bg: "bg-green-400/10" };
  }
  if (t.includes("convocation") || t.includes("document")) {
    return { icon: faFileLines, color: "text-blue-400", bg: "bg-blue-400/10" };
  }
  return { icon: faCircleInfo, color: "text-gray-400", bg: "bg-gray-400/10" };
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

function getDateGroup(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const notifDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const diffDays = Math.floor((today.getTime() - notifDay.getTime()) / 86400000);

  if (diffDays === 0) return "Aujourd'hui";
  if (diffDays < 7) return "Cette semaine";
  return "Plus ancien";
}

export default function NotificationsPage() {
  const [notifs, setNotifs] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [marking, setMarking] = useState(false);

  useEffect(() => {
    fetch("/api/notifications")
      .then(async (r) => {
        if (!r.ok) {
          const body = await r.json().catch(() => ({}));
          throw new Error(body.error || "Erreur lors du chargement");
        }
        return r.json();
      })
      .then((data) => {
        if (Array.isArray(data)) {
          setNotifs(data);
        } else {
          setNotifs([]);
        }
      })
      .catch((err) => {
        setError(err.message || "Impossible de charger vos notifications.");
      })
      .finally(() => setLoading(false));
  }, []);

  const markOneRead = useCallback(async (id: string) => {
    // Optimistic update
    setNotifs((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    }).catch(() => {
      // Revert on failure
      setNotifs((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: false } : n)));
    });
  }, []);

  async function markAllRead() {
    setMarking(true);
    try {
      const res = await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      if (res.ok) {
        setNotifs((prev) => prev.map((n) => ({ ...n, isRead: true })));
      }
    } catch {
      // silently fail
    }
    setMarking(false);
  }

  const unreadCount = notifs.filter((n) => !n.isRead).length;

  // Group notifications by date
  const grouped: Record<string, Notification[]> = {};
  for (const n of notifs) {
    const group = getDateGroup(n.createdAt);
    if (!grouped[group]) grouped[group] = [];
    grouped[group].push(n);
  }
  // Ordered group keys
  const groupOrder = ["Aujourd'hui", "Cette semaine", "Plus ancien"];
  const orderedGroups = groupOrder.filter((g) => grouped[g]?.length);

  return (
    <div className="max-w-2xl">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="font-display font-bold text-2xl text-white mb-1">Notifications</h1>
          <p className="text-gray-500 text-sm">
            {loading
              ? "Chargement..."
              : error
                ? "Erreur"
                : unreadCount > 0
                  ? `${unreadCount} non lue${unreadCount > 1 ? "s" : ""}`
                  : "Tout est lu"}
          </p>
        </div>
        {!loading && !error && unreadCount > 0 && (
          <button
            onClick={markAllRead}
            disabled={marking}
            className="text-xs text-gray-500 hover:text-blue-400 transition-colors disabled:opacity-50"
          >
            {marking ? "..." : "Tout marquer comme lu"}
          </button>
        )}
      </div>

      {/* Loading */}
      {loading ? (
        <div className="flex items-center justify-center py-16 gap-3 text-gray-500">
          <FontAwesomeIcon icon={faSpinner} className="animate-spin text-xl" />
          <span className="text-sm">Chargement des notifications...</span>
        </div>
      ) : error ? (
        /* Error */
        <div className="text-center py-16 rounded-xl border" style={{ background: "rgba(220,38,38,0.05)", borderColor: "rgba(220,38,38,0.15)" }}>
          <FontAwesomeIcon icon={faTriangleExclamation} className="text-3xl text-red-400 mb-3" />
          <p className="text-white font-medium mb-1">Erreur de chargement</p>
          <p className="text-gray-500 text-sm mb-6">{error}</p>
          <button
            onClick={() => { setError(null); setLoading(true); window.location.reload(); }}
            className="inline-block bg-red-600 text-white px-6 py-2.5 rounded-lg font-semibold text-sm hover:bg-red-700 transition-all"
          >
            Réessayer
          </button>
        </div>
      ) : notifs.length === 0 ? (
        /* Empty */
        <div className="text-center py-16">
          <FontAwesomeIcon icon={faBell} className="text-gray-700 text-4xl mb-4" />
          <p className="text-white font-medium mb-1">Aucune notification</p>
          <p className="text-gray-500 text-sm">Vos notifications apparaitront ici.</p>
        </div>
      ) : (
        /* Grouped list */
        <div className="space-y-6">
          {orderedGroups.map((groupName) => (
            <div key={groupName}>
              <h2 className="text-xs font-semibold text-gray-600 uppercase tracking-wider mb-3">{groupName}</h2>
              <div className="space-y-3">
                {grouped[groupName].map((n) => {
                  const { icon, color, bg } = iconForType(n.titre);
                  return (
                    <button
                      key={n.id}
                      onClick={() => !n.isRead && markOneRead(n.id)}
                      className="w-full text-left flex gap-4 p-4 rounded-xl transition-all cursor-pointer"
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
                        <p className="text-xs text-gray-500 leading-relaxed">{n.contenu}</p>
                        <p className="text-xs text-gray-700 mt-2">{timeAgo(n.createdAt)}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
