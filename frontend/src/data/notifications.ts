export type NotificationType =
  | "session"
  | "message"
  | "review"
  | "credit"
  | "system";

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  timestamp: string;
  isRead: boolean;
  relatedId?: string;
  relatedRoute?: string;
  group?: "today" | "earlier";
}

export type NotificationFilter =
  | "all"
  | "unread"
  | "session"
  | "message"
  | "review"
  | "credit"
  | "system";

export const initialNotifications: Notification[] = [];
