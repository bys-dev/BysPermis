"use client";

import { useState, useEffect, useCallback, useRef } from "react";

interface Notification {
  id: string;
  titre: string;
  contenu: string;
  isRead: boolean;
  createdAt: string;
}

interface UseNotificationsReturn {
  unreadCount: number;
  notifications: Notification[];
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  refresh: () => Promise<void>;
}

interface UseNotificationsOptions {
  /** Polling interval in ms (defaults to 30s). */
  interval?: number;
  /**
   * Whether to actually fetch. Pass `false` for anonymous visitors to avoid
   * sending an authenticated request the API would reject — this keeps the
   * hook cheap on public pages.
   */
  enabled?: boolean;
}

export function useNotifications(
  optionsOrInterval: UseNotificationsOptions | number = {},
): UseNotificationsReturn {
  const options: UseNotificationsOptions =
    typeof optionsOrInterval === "number"
      ? { interval: optionsOrInterval }
      : optionsOrInterval;
  const interval = options.interval ?? 30000;
  const enabled = options.enabled ?? true;

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchNotifications = useCallback(async () => {
    if (!enabled) return;
    try {
      const res = await fetch("/api/notifications");
      if (!res.ok) return;
      const data = await res.json();
      if (Array.isArray(data)) {
        setNotifications(data);
        setUnreadCount(data.filter((n: Notification) => !n.isRead).length);
      }
    } catch {
      // Silently fail — notifications are non-critical
    }
  }, [enabled]);

  const markAsRead = useCallback(async (id: string) => {
    try {
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch {
      // Silently fail
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    try {
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch {
      // Silently fail
    }
  }, []);

  useEffect(() => {
    if (!enabled) return;
    // Initial fetch
    fetchNotifications();

    // Set up polling with Page Visibility API
    function startPolling() {
      if (intervalRef.current) clearInterval(intervalRef.current);
      intervalRef.current = setInterval(fetchNotifications, interval);
    }

    function stopPolling() {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    function handleVisibility() {
      if (document.visibilityState === "visible") {
        fetchNotifications(); // Fetch immediately when tab becomes visible
        startPolling();
      } else {
        stopPolling();
      }
    }

    // Start polling if page is visible
    if (document.visibilityState === "visible") {
      startPolling();
    }

    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      stopPolling();
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [enabled, fetchNotifications, interval]);

  return {
    unreadCount,
    notifications,
    markAsRead,
    markAllAsRead,
    refresh: fetchNotifications,
  };
}
