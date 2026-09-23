import { Request, Response } from "express";
import pool from "../../config/db";

export async function getMySessions(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ success: false, message: "Unauthorized" });
      return;
    }

    const result = await pool.query(
      `SELECT 
        s.id,
        s.topic,
        s.session_description,
        s.learner_goal,
        s.scheduled_date::text AS scheduled_date,
        s.start_time::text AS start_time,
        s.end_time::text AS end_time,
        s.duration_minutes,
        s.credits,
        s.status,
        s.is_started,
        s.started_at,
        s.ended_at,
        s.created_at,
        m.id AS mentor_id,
        m.full_name AS mentor_name,
        m.avatar AS mentor_avatar,
        m.email AS mentor_email,
        l.id AS learner_id,
        l.full_name AS learner_name,
        l.avatar AS learner_avatar,
        l.email AS learner_email,
        sk.name AS skill_name,
        sk.category AS skill_category
      FROM sessions s
      JOIN users m ON s.mentor_id = m.id
      JOIN users l ON s.learner_id = l.id
      LEFT JOIN skills sk ON s.skill_id = sk.id
      WHERE s.mentor_id = $1 OR s.learner_id = $1
      ORDER BY s.scheduled_date DESC, s.start_time DESC;`,
      [userId]
    );

    const formatted = result.rows.map((row) => {
      let durMinutes = Number(row.duration_minutes);
      if ((!durMinutes || durMinutes === 60) && row.start_time && row.end_time) {
        const [sh, sm] = row.start_time.slice(0, 5).split(":").map(Number);
        const [eh, em] = row.end_time.slice(0, 5).split(":").map(Number);
        const diff = (eh * 60 + em) - (sh * 60 + sm);
        if (diff > 0) {
          durMinutes = diff;
        }
      }
      const finalMins = durMinutes > 0 ? durMinutes : 30;
      return {
        id: row.id,
        topic: row.topic,
        description: row.session_description,
        learnerGoal: row.learner_goal,
        date: row.scheduled_date,
        startTime: row.start_time.slice(0, 5),
        endTime: row.end_time.slice(0, 5),
        durationMinutes: finalMins,
        duration: `${finalMins} minutes`,
        credits: row.credits,
        status: row.status,
        isStarted: row.is_started,
        mentorId: row.mentor_id,
        mentorName: row.mentor_name,
        mentorAvatar: row.mentor_avatar,
        learnerId: row.learner_id,
        learnerName: row.learner_name,
        learnerAvatar: row.learner_avatar,
        skill: row.skill_name,
        category: row.skill_category,
        createdAt: row.created_at,
      };
    });

    res.json({
      success: true,
      data: formatted,
    });
  } catch (error) {
    console.error("Error fetching sessions:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch user sessions.",
    });
  }
}

// Helper: Normalize date string into YYYY-MM-DD for PostgreSQL
function parseToSqlDate(input: string): string {
  if (!input) return new Date().toISOString().split("T")[0];
  if (/^\d{4}-\d{2}-\d{2}$/.test(input.trim())) {
    return input.trim();
  }
  const timestamp = Date.parse(input);
  if (!isNaN(timestamp)) {
    const d = new Date(timestamp);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }
  return new Date().toISOString().split("T")[0];
}

// Helper: Normalize time string into HH:MM:00 (24h) for PostgreSQL
function parseToSqlTime(input: string, fallback: string = "17:00:00"): string {
  if (!input) return fallback;
  let clean = input.replace(/[\u2013\u2014–—]/g, "-").trim();
  if (clean.includes("-")) {
    clean = clean.split("-")[0].trim();
  }
  const match12 = clean.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(AM|PM)$/i);
  if (match12) {
    let hours = parseInt(match12[1], 10);
    const mins = match12[2];
    const period = match12[4].toUpperCase();
    if (period === "PM" && hours < 12) hours += 12;
    if (period === "AM" && hours === 12) hours = 0;
    return `${String(hours).padStart(2, "0")}:${mins}:00`;
  }
  const match24 = clean.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/);
  if (match24) {
    const hours = String(parseInt(match24[1], 10)).padStart(2, "0");
    const mins = match24[2];
    return `${hours}:${mins}:00`;
  }
  return fallback;
}

export async function bookSession(req: Request, res: Response): Promise<void> {
  const client = await pool.connect();
  try {
    const learnerId = req.user?.userId;
    if (!learnerId) {
      res.status(401).json({ success: false, message: "Unauthorized" });
      return;
    }

    const {
      mentorId,
      skillName,
      topic,
      sessionDescription,
      learnerGoal,
      scheduledDate,
      startTime,
      endTime,
      durationMinutes = 60,
      credits = 5,
    } = req.body;

    if (!mentorId || !topic || !scheduledDate || !startTime || !endTime) {
      res.status(400).json({
        success: false,
        message: "Missing required booking details (mentorId, topic, date, start/end time).",
      });
      return;
    }

    // Resolve mentorId to valid UUID if legacy numeric ID or name is passed
    let finalMentorId = mentorId;
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(mentorId);
    if (!isUuid) {
      const mentorLookup: Record<string, string> = {
        "1": "b9f3bb0f-f8dc-4f97-b8ef-a992e682529e", // Priya Sharma
        "2": "8487f33b-3184-4ce6-a786-a403cdf3bbf8", // Rahul Verma
        "3": "df97b94f-769d-4c08-859e-d2f986a58aa9", // Sneha Reddy
        "4": "0994ab6c-bc3d-46d4-ac30-96d0121313d4", // Arjun Mehta
        "5": "e1009757-a79d-438f-9510-f38f7efb237a", // Ananya Rao
        "6": "41ede7b0-880a-4518-aa2a-ebb15eef839d", // Karthik Kumar
      };
      if (mentorLookup[mentorId]) {
        finalMentorId = mentorLookup[mentorId];
      } else {
        const uRes = await client.query<{ id: string }>(
          `SELECT id FROM users WHERE full_name ILIKE $1 OR email ILIKE $1 LIMIT 1`,
          [`%${mentorId}%`]
        );
        if (uRes.rows.length > 0) {
          finalMentorId = uRes.rows[0].id;
        }
      }
    }

    if (finalMentorId === learnerId) {
      res.status(400).json({
        success: false,
        message: "You cannot book a session with yourself.",
      });
      return;
    }

    await client.query("BEGIN");

    // Check learner wallet balance
    const walletRes = await client.query<{ balance: number }>(
      `SELECT balance FROM wallets WHERE user_id = $1`,
      [learnerId]
    );

    const balance = walletRes.rows[0]?.balance ?? 0;
    if (balance < credits) {
      await client.query("ROLLBACK");
      res.status(400).json({
        success: false,
        message: `Insufficient credits. You have ${balance} credits, but ${credits} are required.`,
      });
      return;
    }

    // Resolve skillId if skillName provided
    let skillId: string | null = null;
    if (skillName) {
      const skillRes = await client.query<{ id: string }>(
        `SELECT id FROM skills WHERE name ILIKE $1 LIMIT 1`,
        [skillName.trim()]
      );
      if (skillRes.rows.length > 0) {
        skillId = skillRes.rows[0].id;
      }
    }

    const sessionInitialStatus = req.body.status === "upcoming" ? "upcoming" : "pending";
    const sqlScheduledDate = parseToSqlDate(scheduledDate);
    const sqlStartTime = parseToSqlTime(startTime, "17:00:00");
    const sqlEndTime = parseToSqlTime(endTime, "18:00:00");

    // Compute duration in minutes from start and end time if available
    let finalDurationMinutes = Number(durationMinutes) || 30;
    if (startTime && endTime) {
      const [sh, sm] = sqlStartTime.split(":").map(Number);
      const [eh, em] = sqlEndTime.split(":").map(Number);
      const diff = (eh * 60 + em) - (sh * 60 + sm);
      if (diff > 0) {
        finalDurationMinutes = diff;
      }
    }

    // Insert session
    const sessionRes = await client.query<{ id: string }>(
      `INSERT INTO sessions (
        mentor_id, learner_id, skill_id, topic, session_description,
        learner_goal, scheduled_date, start_time, end_time, duration_minutes,
        credits, status
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING id`,
      [
        finalMentorId,
        learnerId,
        skillId,
        topic,
        sessionDescription || null,
        learnerGoal || null,
        sqlScheduledDate,
        sqlStartTime,
        sqlEndTime,
        finalDurationMinutes,
        credits,
        sessionInitialStatus,
      ]
    );

    const sessionId = sessionRes.rows[0].id;

    // Create session request record
    const requestStatus = sessionInitialStatus === "upcoming" ? "accepted" : "pending";
    await client.query(
      `INSERT INTO session_requests (session_id, requester_id, recipient_id, status, expires_at)
       VALUES ($1, $2, $3, $4, NOW() + INTERVAL '48 hours')`,
      [sessionId, learnerId, finalMentorId, requestStatus]
    );

    // Notify mentor
    await client.query(
      `INSERT INTO notifications (user_id, type, title, message, related_id, related_route)
       VALUES ($1, 'session', 'New Session Request', $2, $3, '/session-requests')`,
      [
        finalMentorId,
        `A student requested a session on "${topic}" for ${scheduledDate} at ${startTime}.`,
        sessionId,
      ]
    );

    await client.query("COMMIT");

    res.status(201).json({
      success: true,
      message: "Session booked successfully!",
      sessionId,
    });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Error booking session:", error);
    res.status(500).json({
      success: false,
      message: "Failed to book session.",
    });
  } finally {
    client.release();
  }
}

export async function updateSessionStatus(req: Request, res: Response): Promise<void> {
  const client = await pool.connect();
  try {
    const userId = req.user?.userId;
    const { id } = req.params;
    const { status } = req.body;

    if (!userId) {
      res.status(401).json({ success: false, message: "Unauthorized" });
      return;
    }

    if (!["pending", "upcoming", "in_progress", "completed", "cancelled"].includes(status)) {
      res.status(400).json({ success: false, message: "Invalid session status." });
      return;
    }

    await client.query("BEGIN");

    // Fetch existing session
    const sessionRes = await client.query(
      `SELECT id, mentor_id, learner_id, topic, credits, status FROM sessions WHERE id = $1`,
      [id]
    );

    if (sessionRes.rows.length === 0) {
      await client.query("ROLLBACK");
      res.status(404).json({ success: false, message: "Session not found." });
      return;
    }

    const session = sessionRes.rows[0];

    // Verify user is party to this session
    if (session.mentor_id !== userId && session.learner_id !== userId) {
      await client.query("ROLLBACK");
      res.status(403).json({ success: false, message: "Not authorized to update this session." });
      return;
    }

    // If status is transitioning to 'completed'
    if (status === "completed" && session.status !== "completed") {
      // 1. Deduct credits from learner (-5)
      await client.query(
        `UPDATE wallets SET balance = GREATEST(0, balance - $1), updated_at = NOW() WHERE user_id = $2`,
        [session.credits, session.learner_id]
      );

      await client.query(
        `INSERT INTO credit_transactions (user_id, session_id, amount, transaction_type, description)
         VALUES ($1, $2, $3, 'SESSION_LEARNED', $4)`,
        [
          session.learner_id,
          session.id,
          -session.credits,
          `Completed learning session: ${session.topic} (-${session.credits} credits)`,
        ]
      );

      // 2. Add credits to mentor (+10)
      const earnedCredits = 10;
      await client.query(
        `UPDATE wallets SET balance = balance + $1, updated_at = NOW() WHERE user_id = $2`,
        [earnedCredits, session.mentor_id]
      );

      await client.query(
        `INSERT INTO credit_transactions (user_id, session_id, amount, transaction_type, description)
         VALUES ($1, $2, $3, 'SESSION_TAUGHT', $4)`,
        [
          session.mentor_id,
          session.id,
          earnedCredits,
          `Completed mentoring session: ${session.topic} (+${earnedCredits} credits)`,
        ]
      );

      // Notifications
      await client.query(
        `INSERT INTO notifications (user_id, type, title, message, related_id, related_route)
         VALUES 
         ($1, 'credit', 'Credits Earned! (+10)', 'You earned 10 credits for completing your mentoring session.', $3, '/wallet'),
         ($2, 'review', 'Leave a Review', 'Please rate and review your session with your mentor.', $3, '/my-sessions')`,
        [session.mentor_id, session.learner_id, session.id]
      );
    }

    if (status === "in_progress" && session.status !== "in_progress") {
      await client.query(
        `INSERT INTO notifications (user_id, type, title, message, related_id, related_route)
         VALUES ($1, 'session', 'Session Started!', $2, $3, $4)`,
        [
          session.learner_id,
          `Your mentor has started the session on ${session.topic}. Click to enter the room now!`,
          session.id,
          `/session-room/${session.id}`,
        ]
      );
    }

    await client.query(
      `UPDATE sessions SET status = $1, updated_at = NOW() WHERE id = $2`,
      [status, id]
    );

    if (status === "upcoming") {
      await client.query(
        `UPDATE session_requests SET status = 'accepted', responded_at = NOW(), updated_at = NOW() WHERE session_id = $1`,
        [id]
      );
    } else if (status === "cancelled" || status === "rejected") {
      await client.query(
        `UPDATE session_requests SET status = 'cancelled', responded_at = NOW(), updated_at = NOW() WHERE session_id = $1`,
        [id]
      );
    }

    await client.query("COMMIT");

    res.json({
      success: true,
      message: `Session status updated to ${status}.`,
    });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Error updating session status:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update session status.",
    });
  } finally {
    client.release();
  }
}

export async function updateSessionTiming(req: Request, res: Response): Promise<void> {
  const client = await pool.connect();
  try {
    const userId = req.user?.userId;
    const { id } = req.params;
    const { scheduledDate, startTime, endTime, status } = req.body;

    if (!userId) {
      res.status(401).json({ success: false, message: "Unauthorized" });
      return;
    }

    const sessionRes = await client.query(
      `SELECT * FROM sessions WHERE id = $1 AND (mentor_id = $2 OR learner_id = $2)`,
      [id, userId]
    );

    if (sessionRes.rows.length === 0) {
      res.status(404).json({ success: false, message: "Session not found or access denied." });
      return;
    }

    const currentSession = sessionRes.rows[0];
    const sqlDate = scheduledDate ? parseToSqlDate(scheduledDate) : currentSession.scheduled_date;
    const sqlStart = startTime ? parseToSqlTime(startTime, "17:00:00") : currentSession.start_time;
    const sqlEnd = endTime ? parseToSqlTime(endTime, "18:00:00") : currentSession.end_time;
    const newStatus = status || currentSession.status;

    // Compute updated duration_minutes
    const [sh, sm] = sqlStart.split(":").map(Number);
    const [eh, em] = sqlEnd.split(":").map(Number);
    const diff = (eh * 60 + em) - (sh * 60 + sm);
    const updatedDurationMinutes = diff > 0 ? diff : currentSession.duration_minutes;

    await client.query("BEGIN");

    await client.query(
      `UPDATE sessions 
       SET scheduled_date = $1, start_time = $2, end_time = $3, duration_minutes = $4, status = $5, updated_at = NOW()
       WHERE id = $6`,
      [sqlDate, sqlStart, sqlEnd, updatedDurationMinutes, newStatus, id]
    );

    // If status became upcoming, update session_requests
    if (newStatus === "upcoming") {
      await client.query(
        `UPDATE session_requests SET status = 'accepted', responded_at = NOW(), updated_at = NOW() WHERE session_id = $1`,
        [id]
      );
    }

    // Notify other participant
    const otherUserId = currentSession.mentor_id === userId ? currentSession.learner_id : currentSession.mentor_id;
    const sender = await client.query<{ full_name: string }>(`SELECT full_name FROM users WHERE id = $1`, [userId]);
    const senderName = sender.rows[0]?.full_name || "A participant";

    await client.query(
      `INSERT INTO notifications (user_id, type, title, message, related_id, related_route)
       VALUES ($1, 'session', 'Session Schedule Negotiated', $2, $3, $4)`,
      [
        otherUserId,
        `${senderName} proposed/updated the session timing for "${currentSession.topic}" to ${sqlDate} at ${sqlStart.slice(0, 5)}.`,
        id,
        `/session-details/${id}`,
      ]
    );

    await client.query("COMMIT");

    res.json({
      success: true,
      message: "Session timing updated successfully.",
      data: {
        id,
        scheduledDate: sqlDate,
        startTime: sqlStart.slice(0, 5),
        endTime: sqlEnd.slice(0, 5),
        status: newStatus,
      },
    });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Error updating session timing:", error);
    res.status(500).json({ success: false, message: "Failed to update session timing." });
  } finally {
    client.release();
  }
}

