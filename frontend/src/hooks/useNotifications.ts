import { useContext } from "react";
import { NotificationContext } from "@/context/NotificationContext";
import { SessionContext } from "@/context/SessionContext";
import type { Notification } from "@/data/notifications";
import type { NotificationContextType } from "@/context/NotificationContext";

export interface UseNotificationsReturn extends NotificationContextType {
  currentUserId: string;
  notifications: Notification[];
  unreadCount: number;
  filteredNotifications: Notification[];
  markAsRead: (id: string, userId?: string) => void;
  markNotificationsAsReadByRelatedId: (relatedId: string, userId?: string) => void;
  markMessageNotificationsAsRead: (userId?: string) => void;
  markAllAsRead: (userId?: string) => void;
  addNotification: (
    notification: Omit<Notification, "id" | "isRead"> & {
      id?: string;
      isRead?: boolean;
      userId?: string;
    }
  ) => void;
}

export const useNotifications = (): UseNotificationsReturn => {
  const notificationContext = useContext(NotificationContext);
  const sessionContext = useContext(SessionContext);

  if (!notificationContext) {
    throw new Error(
      "useNotifications must be used within a NotificationProvider"
    );
  }

  const currentUserId = sessionContext?.currentUser?.id || "chidvi";

  const userNotifications =
    notificationContext.getUserNotifications(currentUserId);
  const unreadCount = notificationContext.getUserUnreadCount(currentUserId);
  const filteredNotifications =
    notificationContext.getFilteredUserNotifications(
      currentUserId,
      notificationContext.activeFilter
    );

  const markAsRead = (id: string, userId?: string) => {
    notificationContext.markAsRead(id, userId || currentUserId);
  };

  const markNotificationsAsReadByRelatedId = (relatedId: string, userId?: string) => {
    notificationContext.markNotificationsAsReadByRelatedId(relatedId, userId || currentUserId);
  };

  const markMessageNotificationsAsRead = (userId?: string) => {
    notificationContext.markMessageNotificationsAsRead(userId || currentUserId);
  };

  const markAllAsRead = (userId?: string) => {
    notificationContext.markAllAsRead(userId || currentUserId);
  };

  const addNotification = (
    notif: Omit<Notification, "id" | "isRead"> & {
      id?: string;
      isRead?: boolean;
      userId?: string;
    }
  ) => {
    notificationContext.addNotification({
      ...notif,
      userId: notif.userId || currentUserId,
    });
  };

  return {
    ...notificationContext,
    currentUserId,
    notifications: userNotifications,
    unreadCount,
    filteredNotifications,
    markAsRead,
    markNotificationsAsReadByRelatedId,
    markMessageNotificationsAsRead,
    markAllAsRead,
    addNotification,
  };
};
