import { Request, Response } from "express";
import pool from "../../config/db";

export async function saveSessionNotes(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user?.userId;
    const { sessionId } = req.params;
    const {
      summary,
      keyTakeaways = [],
      additionalNotes,
      mentorFeedback,
      recommendedResources = [],
      fileName,
      fileUrl,
      fileSizeBytes,
      fileType = "application/pdf",
    } = req.body;

    if (!userId) {
      res.status(401).json({ success: false, message: "Unauthorized" });
      return;
    }

    // Verify session
    const sessionRes = await pool.query(
      `SELECT id, mentor_id, learner_id, topic FROM sessions WHERE id = $1`,
      [sessionId]
    );

    if (sessionRes.rows.length === 0) {
      res.status(404).json({ success: false, message: "Session not found." });
      return;
    }

    const session = sessionRes.rows[0];
    if (session.mentor_id !== userId && session.learner_id !== userId) {
      res.status(403).json({ success: false, message: "Not authorized to upload notes for this session." });
      return;
    }

    const result = await pool.query(
      `INSERT INTO session_notes (
        session_id, uploaded_by, summary, key_takeaways, additional_notes,
        mentor_feedback, recommended_resources, file_name, file_url, file_size_bytes, file_type
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING id, created_at, updated_at;`,
      [
        sessionId,
        userId,
        summary || null,
        JSON.stringify(keyTakeaways),
        additionalNotes || null,
        mentorFeedback || null,
        JSON.stringify(recommendedResources),
        fileName || null,
        fileUrl || null,
        fileSizeBytes || null,
        fileType,
      ]
    );

    // Notify counterpart
    const counterpartId = session.mentor_id === userId ? session.learner_id : session.mentor_id;
    await pool.query(
      `INSERT INTO notifications (user_id, type, title, message, related_id, related_route)
       VALUES ($1, 'session', 'Session Notes Uploaded', $2, $3, $4)`,
      [
        counterpartId,
        `New session notes were uploaded for your session on "${session.topic}".`,
        sessionId,
        `/session-notes/${sessionId}`,
      ]
    );

    res.status(201).json({
      success: true,
      message: "Session notes saved successfully!",
      data: result.rows[0],
    });
  } catch (error) {
    console.error("Error saving session notes:", error);
    res.status(500).json({
      success: false,
      message: "Failed to save session notes.",
    });
  }
}

export async function getSessionNotes(req: Request, res: Response): Promise<void> {
  try {
    const { sessionId } = req.params;

    const result = await pool.query(
      `SELECT 
        sn.id,
        sn.session_id,
        sn.uploaded_by,
        sn.summary,
        sn.key_takeaways,
        sn.additional_notes,
        sn.mentor_feedback,
        sn.recommended_resources,
        sn.file_name,
        sn.file_url,
        sn.file_size_bytes,
        sn.file_type,
        sn.created_at,
        u.full_name AS uploaded_by_name
       FROM session_notes sn
       JOIN users u ON sn.uploaded_by = u.id
       WHERE sn.session_id = $1
       ORDER BY sn.created_at DESC`,
      [sessionId]
    );

    res.json({
      success: true,
      data: result.rows,
    });
  } catch (error) {
    console.error("Error fetching session notes:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch session notes.",
    });
  }
}
