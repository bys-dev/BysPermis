"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBell, faCheckDouble, faHandshake } from "@fortawesome/free-solid-svg-icons";

interface NotificationItem {
  id: string;
  titre: string;
  contenu: string;
  isRead: boolean;
  createdAt: string;
}

const POLL_MS = 60_000;

function timeAgo(iso: string): string {
  const minutes = Math.round((Date.now() - new Date(iso).getTime()) / 60_000);
  if (minutes < 1) return "à l'instant";
  if (minutes < 60) return `il y a ${minutes} min`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `il y a ${hours} h`;
  return `il y a ${Math.round(hours / 24)} j`;
}

/** Lien associé à une notification staff (les demandes partenaires ouvrent la page dédiée). */
function hrefFor(n: NotificationItem): string | null {
  if (n.titre.toLowerCase().includes("partenariat")) return "/admin/partenaires";
  if (n.titre.toLowerCase().includes("validation centre")) return "/admin/centres";
  return null;
}

/** Cloche des notifications du panneau admin / owner, avec rafraîchissement périodique. */
export default function AdminNotificationBell() {
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/notifications", { cache: "no-store" });
      if (!res.ok) return;
      const data = (await res.json()) as NotificationItem[];
      setItems(Array.isArray(data) ? data.slice(0, 30) : []);
    } catch {
      /* réseau indisponible : on garde l'état précédent */
    }
  }, []);

  useEffect(() => {
    const first = setTimeout(load, 0);
    const id = setInterval(load, POLL_MS);
    return () => {
      clearTimeout(first);
      clearInterval(id);
    };
  }, [load]);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const unread = items.filter((n) => !n.isRead).length;

  async function markRead(id?: string) {
    setItems((prev) => prev.map((n) => (!id || n.id === id ? { ...n, isRead: true } : n)));
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(id ? { id } : {}),
    }).catch(() => {});
  }

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => {
          setOpen((o) => !o);
          if (!open) load();
        }}
        className="relative w-10 h-10 flex items-center justify-center rounded-lg bg-white/5 border border-white/10 text-slate-200 hover:text-white hover:bg-white/10 transition-colors"
        aria-label={unread ? `Notifications, ${unread} non lue${unread > 1 ? "s" : ""}` : "Notifications"}
        aria-expanded={open}
      >
        <FontAwesomeIcon icon={faBell} className="w-4 h-4" />
        {unread > 0 && (
          <span className="absolute -top-1.5 -right-1.5 min-w-5 h-5 px-1 rounded-full bg-red-600 text-white text-[11px] font-bold flex items-center justify-center ring-2 ring-[#16243F]">
            {unread > 99 ? "99+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-[min(24rem,calc(100vw-2rem))] rounded-xl border border-white/10 bg-[#24385E] shadow-2xl z-50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
            <span className="text-white font-semibold text-sm">Notifications</span>
            {unread > 0 && (
              <button
                onClick={() => markRead()}
                className="text-xs text-blue-300 hover:text-blue-200 flex items-center gap-1.5"
              >
                <FontAwesomeIcon icon={faCheckDouble} className="w-3 h-3" />
                Tout marquer comme lu
              </button>
            )}
          </div>
          <ul className="max-h-96 overflow-y-auto divide-y divide-white/5">
            {items.length === 0 && (
              <li className="px-4 py-8 text-center text-sm text-slate-300">Aucune notification.</li>
            )}
            {items.map((n) => {
              const href = hrefFor(n);
              const body = (
                <div className="flex gap-3">
                  <span
                    className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${n.isRead ? "bg-transparent" : "bg-blue-400"}`}
                    aria-hidden
                  />
                  <div className="min-w-0">
                    <p className={`text-sm ${n.isRead ? "text-slate-300" : "text-white font-semibold"} flex items-center gap-2`}>
                      {n.titre.toLowerCase().includes("partenariat") && (
                        <FontAwesomeIcon icon={faHandshake} className="w-3.5 h-3.5 text-blue-300" />
                      )}
                      {n.titre}
                    </p>
                    <p className="text-xs text-slate-300 mt-0.5 line-clamp-2">{n.contenu}</p>
                    <p className="text-[11px] text-slate-400 mt-1">{timeAgo(n.createdAt)}</p>
                  </div>
                </div>
              );
              return (
                <li key={n.id}>
                  {href ? (
                    <Link
                      href={href}
                      onClick={() => {
                        markRead(n.id);
                        setOpen(false);
                      }}
                      className="block px-4 py-3 hover:bg-white/5"
                    >
                      {body}
                    </Link>
                  ) : (
                    <button onClick={() => markRead(n.id)} className="w-full text-left px-4 py-3 hover:bg-white/5">
                      {body}
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
