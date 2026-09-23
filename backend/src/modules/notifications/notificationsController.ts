import { Request, Response } from "express";
import pool from "../../config/db";

export async function getNotifications(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ success: false, message: "Unauthorized" });
      return;
    }

    const result = await pool.query(
      `SELECT 
        id,
        user_id,
        type,
        title,
        message,
        related_id,
        related_route,
        is_read,
        created_at
       FROM notifications
       WHERE user_id = $1
       ORDER BY created_at DESC;`,
      [userId]
    );

    const formatted = result.rows.map((n) => {
      const now = new Date();
      const created = new Date(n.created_at);
      const diffMinutes = Math.floor((now.getTime() - created.getTime()) / (1000 * 60));

      let timestamp = "Just now";
      let group: "today" | "yesterday" | "earlier" = "today";

      if (diffMinutes < 60) {
        timestamp = diffMinutes <= 1 ? "Just now" : `${diffMinutes}m ago`;
      } else if (diffMinutes < 1440) {
        timestamp = `${Math.floor(diffMinutes / 60)}h ago`;
      } else if (diffMinutes < 2880) {
        timestamp = "Yesterday";
        group = "yesterday";
      } else {
        timestamp = `${Math.floor(diffMinutes / 1440)}d ago`;
        group = "earlier";
      }

      return {
        id: n.id,
        userId: n.user_id,
        type: n.type,
        title: n.title,
        message: n.message,
        timestamp,
        isRead: n.is_read,
        relatedId: n.related_id,
        relatedRoute: n.related_route,
        group,
        createdAt: n.created_at,
      };
    });

    const unreadCount = formatted.filter((n) => !n.isRead).length;

    res.json({
      success: true,
      data: formatted,
      unreadCount,
    });
  } catch (error) {
    console.error("Error fetching notifications:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch notifications.",
    });
  }
}

export async function markNotificationAsRead(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user?.userId;
    const { id } = req.params;

    if (!userId) {
      res.status(401).json({ success: false, message: "Unauthorized" });
      return;
    }

    await pool.query(
      `UPDATE notifications SET is_read = TRUE WHERE id = $1 AND user_id = $2`,
      [id, userId]
    );

    res.json({
      success: true,
      message: "Notification marked as read.",
    });
  } catch (error) {
    console.error("Error marking notification as read:", error);
    res.status(500).json({
      success: false,
      message: "Failed to mark notification as read.",
    });
  }
}

export async function markAllNotificationsAsRead(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({ success: false, message: "Unauthorized" });
      return;
    }

    await pool.query(
      `UPDATE notifications SET is_read = TRUE WHERE user_id = $1 AND is_read = FALSE`,
      [userId]
    );

    res.json({
      success: true,
      message: "All notifications marked as read.",
    });
  } catch (error) {
    console.error("Error marking all notifications as read:", error);
    res.status(500).json({
      success: false,
      message: "Failed to mark all notifications as read.",
    });
  }
}

export async function markNotificationByRelatedIdAsRead(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user?.userId;
    const { relatedId } = req.params;

    if (!userId) {
      res.status(401).json({ success: false, message: "Unauthorized" });
      return;
    }

    await pool.query(
      `UPDATE notifications 
       SET is_read = TRUE 
       WHERE user_id = $1 
         AND is_read = FALSE 
         AND (
           related_id = $2 
           OR related_route = '/messages/' || $2 
           OR related_route LIKE '%/' || $2 || '%'
         )`,
      [userId, relatedId]
    );

    res.json({
      success: true,
      message: "Notifications marked as read.",
    });
  } catch (error) {
    console.error("Error marking notification as read by relatedId:", error);
    res.status(500).json({
      success: false,
      message: "Failed to mark notifications as read.",
    });
  }
}

