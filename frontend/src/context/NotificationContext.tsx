import { createContext, useState, useEffect, useCallback } from "react";
import type { ReactNode } from "react";
import { initialNotifications } from "@/data/notifications";
import type {
  Notification,
  NotificationFilter,
} from "@/data/notifications";
import { notificationApi } from "@/services/notificationApi";

export interface NotificationContextType {
  notifications: Notification[];
  activeFilter: NotificationFilter;
  setActiveFilter: (filter: NotificationFilter) => void;
  getUserNotifications: (userId: string | undefined) => Notification[];
  getUserUnreadCount: (userId: string | undefined) => number;
  getFilteredUserNotifications: (
    userId: string | undefined,
    filter: NotificationFilter
  ) => Notification[];
  markAsRead: (id: string, userId?: string) => void;
  markNotificationsAsReadByRelatedId: (relatedId: string, userId?: string) => void;
  markMessageNotificationsAsRead: (userId?: string) => void;
  markAllAsRead: (userId: string | undefined) => void;
  addNotification: (
    notification: Omit<Notification, "id" | "isRead"> & {
      id?: string;
      isRead?: boolean;
      userId?: string;
    }
  ) => void;
}

export const NotificationContext = createContext<
  NotificationContextType | undefined
>(undefined);

export const NotificationProvider = ({
  children,
}: {
  children: ReactNode;
}) => {
  const [notifications, setNotifications] =
    useState<Notification[]>(initialNotifications);
  const [activeFilter, setActiveFilter] =
    useState<NotificationFilter>("all");

  // Periodic sync & online/focus recovery for notifications
  const syncNotifications = useCallback(() => {
    notificationApi
      .getNotifications()
      .then(({ notifications: liveNotifs }) => {
        if (liveNotifs) {
          setNotifications((prev) => {
            const map = new Map<string, Notification>();
            prev.forEach((n) => map.set(n.id, n));
            liveNotifs.forEach((n) => {
              const existing = map.get(n.id);
              if (!existing) {
                map.set(n.id, n);
              } else {
                map.set(n.id, {
                  ...existing,
                  ...n,
                  isRead: existing.isRead || n.isRead,
                });
              }
            });
            return Array.from(map.values());
          });
        }
      })
      .catch((err) => {
        console.warn("Using local notifications fallback:", err);
      });
  }, []);

  useEffect(() => {
    syncNotifications();

    const interval = setInterval(() => {
      if (document.visibilityState === "visible") {
        syncNotifications();
      }
    }, 3500);

    const handleOnline = () => {
      syncNotifications();
    };
    const handleFocus = () => {
      if (document.visibilityState === "visible") {
        syncNotifications();
      }
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleFocus);

    return () => {
      clearInterval(interval);
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleFocus);
    };
  }, [syncNotifications]);

  const getUserNotifications = (userId: string | undefined): Notification[] => {
    if (!userId) return [];
    return notifications.filter((n) => n.userId === String(userId));
  };

  const getUserUnreadCount = (userId: string | undefined): number => {
    if (!userId) return 0;
    return notifications.filter((n) => n.userId === String(userId) && !n.isRead)
      .length;
  };

  const getFilteredUserNotifications = (
    userId: string | undefined,
    filter: NotificationFilter
  ): Notification[] => {
    const userNotifs = getUserNotifications(userId);
    if (filter === "all") return userNotifs;
    if (filter === "unread") return userNotifs.filter((n) => !n.isRead);
    if (filter === "session") return userNotifs.filter((n) => n.type === "session");
    if (filter === "message") return userNotifs.filter((n) => n.type === "message");
    if (filter === "review") return userNotifs.filter((n) => n.type === "review");
    if (filter === "credit") return userNotifs.filter((n) => n.type === "credit");
    if (filter === "system") return userNotifs.filter((n) => n.type === "system");
    return userNotifs;
  };

  const markAsRead = (id: string, userId?: string) => {
    setNotifications((prev) =>
      prev.map((n) => {
        if (n.id === id) {
          if (!userId || n.userId === String(userId)) {
            return { ...n, isRead: true };
          }
        }
        return n;
      })
    );
    notificationApi.markAsRead(id).catch((err) => {
      console.warn("Backend notification markAsRead note:", err);
    });
  };

  const markNotificationsAsReadByRelatedId = (
    relatedId: string,
    userId?: string
  ) => {
    if (!relatedId) return;
    const targetIds: string[] = [];
    setNotifications((prev) =>
      prev.map((n) => {
        const matchesUser = !userId || n.userId === String(userId);
        const matchesRelated =
          n.relatedId === relatedId ||
          n.relatedRoute === `/messages/${relatedId}` ||
          n.relatedRoute?.includes(relatedId);
        if (matchesUser && matchesRelated && !n.isRead) {
          targetIds.push(n.id);
          return { ...n, isRead: true };
        }
        return n;
      })
    );
    notificationApi.markAsReadByRelatedId(relatedId).catch(() => {});
    targetIds.forEach((id) => {
      notificationApi.markAsRead(id).catch(() => {});
    });
  };

  const markMessageNotificationsAsRead = (userId?: string) => {
    const targetIds: string[] = [];
    setNotifications((prev) =>
      prev.map((n) => {
        const matchesUser = !userId || n.userId === String(userId);
        if (matchesUser && n.type === "message" && !n.isRead) {
          targetIds.push(n.id);
          return { ...n, isRead: true };
        }
        return n;
      })
    );
    targetIds.forEach((id) => {
      notificationApi.markAsRead(id).catch(() => {});
    });
  };

  const markAllAsRead = (userId: string | undefined) => {
    if (!userId) return;
    setNotifications((prev) =>
      prev.map((n) => (n.userId === String(userId) ? { ...n, isRead: true } : n))
    );
    notificationApi.markAllAsRead().catch((err) => {
      console.warn("Backend notification markAllAsRead note:", err);
    });
  };

  const addNotification = (
    notif: Omit<Notification, "id" | "isRead"> & {
      id?: string;
      isRead?: boolean;
      userId?: string;
    }
  ) => {
    const newNotif: Notification = {
      id:
        notif.id ||
        `notif-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      userId: notif.userId || "chidvi",
      type: notif.type,
      title: notif.title,
      message: notif.message,
      timestamp: notif.timestamp || "Just now",
      isRead: notif.isRead ?? false,
      relatedId: notif.relatedId,
      relatedRoute: notif.relatedRoute,
      group: notif.group || "today",
    };
    setNotifications((prev) => [newNotif, ...prev]);
  };

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        activeFilter,
        setActiveFilter,
        getUserNotifications,
        getUserUnreadCount,
        getFilteredUserNotifications,
        markAsRead,
        markNotificationsAsReadByRelatedId,
        markMessageNotificationsAsRead,
        markAllAsRead,
        addNotification,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};
