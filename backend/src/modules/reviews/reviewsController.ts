import { Request, Response } from "express";
import pool from "../../config/db";

export async function createReview(req: Request, res: Response): Promise<void> {
  const client = await pool.connect();
  try {
    const reviewerId = req.user?.userId;
    const { sessionId, rating, comment } = req.body;

    if (!reviewerId) {
      res.status(401).json({ success: false, message: "Unauthorized" });
      return;
    }

    const numRating = parseFloat(rating);
    if (isNaN(numRating) || numRating < 1.0 || numRating > 5.0) {
      res.status(400).json({ success: false, message: "Rating must be between 1.0 and 5.0." });
      return;
    }

    await client.query("BEGIN");

    // Fetch session
    const sessionRes = await client.query(
      `SELECT id, mentor_id, learner_id, topic, status FROM sessions WHERE id = $1`,
      [sessionId]
    );

    if (sessionRes.rows.length === 0) {
      await client.query("ROLLBACK");
      res.status(404).json({ success: false, message: "Session not found." });
      return;
    }

    const session = sessionRes.rows[0];

    // Only learner can submit review for mentor
    if (session.learner_id !== reviewerId) {
      await client.query("ROLLBACK");
      res.status(403).json({ success: false, message: "Only the learner can submit a review for this session." });
      return;
    }

    const revieweeId = session.mentor_id;

    // Check duplicate
    const dupCheck = await client.query(
      `SELECT id FROM reviews WHERE session_id = $1 AND reviewer_id = $2`,
      [sessionId, reviewerId]
    );

    if (dupCheck.rows.length > 0) {
      await client.query("ROLLBACK");
      res.status(400).json({ success: false, message: "Review already submitted for this session." });
      return;
    }

    // Insert review
    const reviewRes = await client.query<{ id: string; created_at: Date }>(
      `INSERT INTO reviews (session_id, reviewer_id, reviewee_id, rating, comment)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, created_at`,
      [sessionId, reviewerId, revieweeId, numRating, comment || null]
    );

    const reviewerRes = await client.query<{ full_name: string }>(
      `SELECT full_name FROM users WHERE id = $1`,
      [reviewerId]
    );
    const reviewerName = reviewerRes.rows[0]?.full_name || "A student";

    // Notify mentor
    await client.query(
      `INSERT INTO notifications (user_id, type, title, message, related_id, related_route)
       VALUES ($1, 'review', 'New Review Received', $2, $3, '/dashboard')`,
      [
        revieweeId,
        `${reviewerName} left you a ${numRating}-star review for your session on "${session.topic}".`,
        sessionId,
      ]
    );

    await client.query("COMMIT");

    res.status(201).json({
      success: true,
      message: "Review submitted successfully!",
      data: {
        id: reviewRes.rows[0].id,
        sessionId,
        reviewerId,
        revieweeId,
        rating: numRating,
        comment,
        createdAt: reviewRes.rows[0].created_at,
      },
    });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Error creating review:", error);
    res.status(500).json({
      success: false,
      message: "Failed to submit review.",
    });
  } finally {
    client.release();
  }
}

export async function getMentorReviews(req: Request, res: Response): Promise<void> {
  try {
    const { mentorId } = req.params;

    const result = await pool.query(
      `SELECT 
        r.id,
        r.session_id,
        r.rating,
        r.comment,
        r.created_at,
        u.full_name AS reviewer_name,
        u.avatar AS reviewer_avatar,
        s.topic AS session_topic
       FROM reviews r
       JOIN users u ON r.reviewer_id = u.id
       JOIN sessions s ON r.session_id = s.id
       WHERE r.reviewee_id = $1
       ORDER BY r.created_at DESC`,
      [mentorId]
    );

    res.json({
      success: true,
      data: result.rows,
    });
  } catch (error) {
    console.error("Error fetching mentor reviews:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch reviews.",
    });
  }
}

export async function getMyReviews(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ success: false, message: "Unauthorized" });
      return;
    }

    const result = await pool.query(
      `SELECT 
        r.id,
        r.session_id,
        r.reviewer_id,
        r.reviewee_id,
        r.rating,
        r.comment,
        r.created_at,
        u.full_name AS mentor_name,
        s.topic AS session_topic
       FROM reviews r
       LEFT JOIN users u ON u.id = r.reviewee_id
       LEFT JOIN sessions s ON s.id = r.session_id
       WHERE r.reviewer_id = $1 OR r.reviewee_id = $1
       ORDER BY r.created_at DESC`,
      [userId]
    );

    res.json({
      success: true,
      data: result.rows.map((row) => ({
        id: row.id,
        sessionId: row.session_id,
        reviewerId: row.reviewer_id,
        revieweeId: row.reviewee_id,
        mentor: row.mentor_name || "Mentor",
        topic: row.session_topic || "Mentoring Session",
        rating: parseFloat(row.rating),
        reviewText: row.comment || "",
        comment: row.comment || "",
        submittedAt: row.created_at,
      })),
    });
  } catch (error) {
    console.error("Error fetching user reviews:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch reviews.",
    });
  }
}

