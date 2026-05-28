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
  /**
   * If true, also fetch the full notifications list (used for dropdowns/pages).
   * If false (default), polling only fetches the unread count.
   */
  includeList?: boolean;
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
  const includeList = options.includeList ?? false;

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchUnreadCount = useCallback(async () => {
    if (!enabled) return;
    try {
      const res = await fetch("/api/notifications?only=unreadCount");
      if (!res.ok) return;
      const data = await res.json().catch(() => null);
      const count = typeof data?.unreadCount === "number" ? data.unreadCount : null;
      if (count !== null) setUnreadCount(count);
    } catch {
      // Silently fail — notifications are non-critical
    }
  }, [enabled]);

  const fetchNotifications = useCallback(async () => {
    if (!enabled || !includeList) return;
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
  }, [enabled, includeList]);

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
    // Initial: always fetch count, list only if requested
    fetchUnreadCount();
    fetchNotifications();

    // Set up polling with Page Visibility API
    function startPolling() {
      if (intervalRef.current) clearInterval(intervalRef.current);
      intervalRef.current = setInterval(fetchUnreadCount, interval);
    }

    function stopPolling() {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    function handleVisibility() {
      if (document.visibilityState === "visible") {
        fetchUnreadCount(); // Fetch immediately when tab becomes visible
        fetchNotifications();
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
  }, [enabled, fetchNotifications, fetchUnreadCount, interval]);

  return {
    unreadCount,
    notifications,
    markAsRead,
    markAllAsRead,
    refresh: async () => {
      await Promise.all([fetchUnreadCount(), fetchNotifications()]);
    },
  };
}
