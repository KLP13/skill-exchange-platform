import { Request, Response } from "express";
import pool from "../../config/db";

export async function getConversations(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ success: false, message: "Unauthorized" });
      return;
    }

    const result = await pool.query(
      `SELECT 
        c.id,
        c.session_id,
        c.updated_at,
        u.id AS other_user_id,
        u.full_name AS other_user_name,
        u.avatar AS other_user_avatar,
        COALESCE(u.role, 'student') AS other_user_role,
        COALESCE(
          (
            SELECT m.message_text 
            FROM messages m 
            WHERE m.conversation_id = c.id 
            ORDER BY m.created_at DESC 
            LIMIT 1
          ),
          'Started conversation'
        ) AS last_message,
        (
          SELECT m.created_at 
          FROM messages m 
          WHERE m.conversation_id = c.id 
          ORDER BY m.created_at DESC 
          LIMIT 1
        ) AS last_message_time,
        (
          SELECT COUNT(*) 
          FROM messages m 
          WHERE m.conversation_id = c.id 
            AND m.receiver_id = $1 
            AND m.is_read = FALSE
        )::int AS unread_count
      FROM conversations c
      JOIN users u ON (
        CASE 
          WHEN c.participant_one_id = $1 THEN c.participant_two_id 
          ELSE c.participant_one_id 
        END = u.id
      )
      WHERE c.participant_one_id = $1 OR c.participant_two_id = $1
      ORDER BY c.updated_at DESC;`,
      [userId]
    );

    const formatted = result.rows.map((row) => ({
      id: row.id,
      sessionId: row.session_id,
      participantIds: [userId, row.other_user_id],
      participantId: row.other_user_id,
      participantName: row.other_user_name,
      participantRole: row.other_user_role,
      participantAvatar: row.other_user_avatar,
      lastMessage: row.last_message,
      lastMessageTime: row.last_message_time
        ? new Date(row.last_message_time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
        : "Just now",
      unreadCount: row.unread_count || 0,
    }));

    res.json({
      success: true,
      data: formatted,
    });
  } catch (error) {
    console.error("Error fetching conversations:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch conversations.",
    });
  }
}

export async function getMessages(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user?.userId;
    const { conversationId } = req.params;

    if (!userId) {
      res.status(401).json({ success: false, message: "Unauthorized" });
      return;
    }

    // Verify user is in conversation
    const convCheck = await pool.query(
      `SELECT id FROM conversations 
       WHERE id = $1 AND (participant_one_id = $2 OR participant_two_id = $2)`,
      [conversationId, userId]
    );

    if (convCheck.rows.length === 0) {
      res.status(403).json({ success: false, message: "Conversation not found or access denied." });
      return;
    }

    const messagesRes = await pool.query(
      `SELECT 
        m.id,
        m.conversation_id,
        m.sender_id,
        m.receiver_id,
        m.message_text,
        m.is_read,
        m.created_at
       FROM messages m
       WHERE m.conversation_id = $1
       ORDER BY m.created_at ASC;`,
      [conversationId]
    );

    const formatted = messagesRes.rows.map((m) => ({
      id: m.id,
      conversationId: m.conversation_id,
      senderId: m.sender_id,
      receiverId: m.receiver_id,
      senderName: m.sender_id === userId ? "You" : "Participant",
      sender: m.sender_id === userId ? "user" : "other",
      text: m.message_text,
      timestamp: new Date(m.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      read: m.is_read,
      isRead: m.is_read,
    }));

    res.json({
      success: true,
      data: formatted,
    });
  } catch (error) {
    console.error("Error fetching messages:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch messages.",
    });
  }
}

export async function sendMessage(req: Request, res: Response): Promise<void> {
  const client = await pool.connect();
  try {
    const senderId = req.user?.userId;
    const { recipientId, conversationId, text, sessionId } = req.body;

    if (!senderId) {
      res.status(401).json({ success: false, message: "Unauthorized" });
      return;
    }

    if (!text || text.trim() === "") {
      res.status(400).json({ success: false, message: "Message cannot be empty." });
      return;
    }

    await client.query("BEGIN");

    let finalConvId = conversationId;
    let finalReceiverId = recipientId;

    if (!finalConvId) {
      if (!recipientId) {
        await client.query("ROLLBACK");
        res.status(400).json({ success: false, message: "Recipient ID or Conversation ID required." });
        return;
      }

      if (senderId === recipientId) {
        await client.query("ROLLBACK");
        res.status(400).json({ success: false, message: "Cannot send message to yourself." });
        return;
      }

      // Check order constraint: participant_one_id < participant_two_id
      const [p1, p2] = [senderId, recipientId].sort();

      // Find or create conversation
      const convRes = await client.query<{ id: string }>(
        `INSERT INTO conversations (participant_one_id, participant_two_id, session_id)
         VALUES ($1, $2, $3)
         ON CONFLICT (participant_one_id, participant_two_id) DO UPDATE
         SET updated_at = NOW()
         RETURNING id`,
        [p1, p2, sessionId || null]
      );
      finalConvId = convRes.rows[0].id;
    } else {
      // Find receiver from existing conversation
      const convRes = await client.query(
        `SELECT participant_one_id, participant_two_id FROM conversations WHERE id = $1`,
        [finalConvId]
      );
      if (convRes.rows.length === 0) {
        await client.query("ROLLBACK");
        res.status(404).json({ success: false, message: "Conversation not found." });
        return;
      }
      const c = convRes.rows[0];
      finalReceiverId = c.participant_one_id === senderId ? c.participant_two_id : c.participant_one_id;
    }

    // Insert message
    const msgRes = await client.query<{ id: string; created_at: Date }>(
      `INSERT INTO messages (conversation_id, sender_id, receiver_id, message_text)
       VALUES ($1, $2, $3, $4)
       RETURNING id, created_at`,
      [finalConvId, senderId, finalReceiverId, text.trim()]
    );

    // Update conversation updated_at
    await client.query(`UPDATE conversations SET updated_at = NOW() WHERE id = $1`, [finalConvId]);

    // Create notification for receiver
    const senderUser = await client.query<{ full_name: string }>(
      `SELECT full_name FROM users WHERE id = $1`,
      [senderId]
    );
    const senderName = senderUser.rows[0]?.full_name || "A student";

    await client.query(
      `INSERT INTO notifications (user_id, type, title, message, related_id, related_route)
       VALUES ($1, 'message', $2, $3, $4, $5)`,
      [
        finalReceiverId,
        `New message from ${senderName}`,
        text.trim().length > 60 ? `${text.trim().slice(0, 60)}...` : text.trim(),
        finalConvId,
        `/messages/${finalConvId}`,
      ]
    );

    await client.query("COMMIT");

    const newMsg = msgRes.rows[0];

    res.status(201).json({
      success: true,
      data: {
        id: newMsg.id,
        conversationId: finalConvId,
        senderId,
        receiverId: finalReceiverId,
        senderName: senderName,
        sender: "user",
        text: text.trim(),
        timestamp: new Date(newMsg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        read: false,
        isRead: false,
      },
    });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Error sending message:", error);
    res.status(500).json({
      success: false,
      message: "Failed to send message.",
    });
  } finally {
    client.release();
  }
}

export async function markConversationAsRead(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user?.userId;
    const { conversationId } = req.params;

    if (!userId) {
      res.status(401).json({ success: false, message: "Unauthorized" });
      return;
    }

    await pool.query(
      `UPDATE messages 
       SET is_read = TRUE, read_at = NOW() 
       WHERE conversation_id = $1 AND receiver_id = $2 AND is_read = FALSE`,
      [conversationId, userId]
    );

    // Also mark any message notifications related to this conversation as read in PostgreSQL
    await pool.query(
      `UPDATE notifications 
       SET is_read = TRUE 
       WHERE user_id = $1 
         AND is_read = FALSE 
         AND (
           related_id = $2 
           OR related_route = '/messages/' || $2 
           OR related_route LIKE '%/messages/' || $2 || '%'
         )`,
      [userId, conversationId]
    );

    res.json({
      success: true,
      message: "Messages and related notifications marked as read.",
    });
  } catch (error) {
    console.error("Error marking messages as read:", error);
    res.status(500).json({
      success: false,
      message: "Failed to mark messages as read.",
    });
  }
}
