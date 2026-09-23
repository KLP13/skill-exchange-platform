import api from "./api";
import type { Notification } from "@/data/notifications";

export const notificationApi = {
  async getNotifications(): Promise<{ notifications: Notification[]; unreadCount: number }> {
    const res = await api.get<{
      success: boolean;
      data: Notification[];
      unreadCount: number;
    }>("/notifications");
    return {
      notifications: res.data.data,
      unreadCount: res.data.unreadCount,
    };
  },

  async markAsRead(id: string): Promise<{ success: boolean }> {
    const res = await api.patch<{ success: boolean }>(`/notifications/${id}/read`);
    return res.data;
  },

  async markAsReadByRelatedId(relatedId: string): Promise<{ success: boolean }> {
    const res = await api.patch<{ success: boolean }>(`/notifications/related/${relatedId}/read`);
    return res.data;
  },

  async markAllAsRead(): Promise<{ success: boolean }> {
    const res = await api.patch<{ success: boolean }>("/notifications/read-all");
    return res.data;
  },
};
