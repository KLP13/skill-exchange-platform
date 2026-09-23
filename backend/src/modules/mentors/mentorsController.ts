import { Request, Response } from "express";
import pool from "../../config/db";

interface DbMentorRow {
  id: string;
  name: string;
  role: string;
  department: string;
  year: string;
  avatar: string | null;
  bio: string | null;
  experience_years: string | null;
  projects_built: string | null;
  languages: string | null;
  teaches: string[];
  learns: string[];
  avg_rating: string | null;
  review_count: string;
  sessions_count: string;
  credits?: string | number;
}

export async function getMentors(req: Request, res: Response): Promise<void> {
  try {
    const { search, department, skill, category } = req.query;

    let query = `
      SELECT 
        u.id,
        u.full_name AS name,
        COALESCE(u.role, 'mentor') AS role,
        COALESCE(d.name, 'Computer Science') AS department,
        COALESCE(u.year_of_study, '3rd Year') AS year,
        u.avatar,
        u.bio,
        u.experience_years,
        u.projects_built,
        u.languages,
        COALESCE(
          (
            SELECT array_agg(s.name)
            FROM user_skills us
            JOIN skills s ON us.skill_id = s.id
            WHERE us.user_id = u.id AND us.skill_type = 'TEACH'
          ),
          ARRAY[]::text[]
        ) AS teaches,
        COALESCE(
          (
            SELECT array_agg(s.name)
            FROM user_skills us
            JOIN skills s ON us.skill_id = s.id
            WHERE us.user_id = u.id AND us.skill_type = 'LEARN'
          ),
          ARRAY[]::text[]
        ) AS learns,
        (
          SELECT ROUND(AVG(r.rating), 1)::text
          FROM reviews r
          WHERE r.reviewee_id = u.id
        ) AS avg_rating,
        (
          SELECT COUNT(r.id)::text
          FROM reviews r
          WHERE r.reviewee_id = u.id
        ) AS review_count,
        (
          SELECT COUNT(s.id)::text
          FROM sessions s
          WHERE (s.mentor_id = u.id OR s.learner_id = u.id) AND s.status = 'completed'
        ) AS sessions_count,
        COALESCE(
          (
            SELECT w.balance
            FROM wallets w
            WHERE w.user_id = u.id
          ),
          40
        ) AS credits
      FROM users u
      LEFT JOIN departments d ON u.department_id = d.id
      WHERE (
        u.role = 'mentor' 
        OR EXISTS (
          SELECT 1 FROM user_skills us 
          WHERE us.user_id = u.id AND us.skill_type = 'TEACH'
        )
      )
    `;

    const values: any[] = [];
    let paramIndex = 1;

    if (search && typeof search === "string" && search.trim() !== "") {
      query += ` AND (
        u.full_name ILIKE $${paramIndex} 
        OR u.bio ILIKE $${paramIndex} 
        OR EXISTS (
          SELECT 1 FROM user_skills us 
          JOIN skills s ON us.skill_id = s.id 
          WHERE us.user_id = u.id AND s.name ILIKE $${paramIndex}
        )
      )`;
      values.push(`%${search.trim()}%`);
      paramIndex++;
    }

    if (department && typeof department === "string" && department !== "ALL") {
      query += ` AND (d.code ILIKE $${paramIndex} OR d.name ILIKE $${paramIndex})`;
      values.push(`%${department.trim()}%`);
      paramIndex++;
    }

    if (skill && typeof skill === "string" && skill !== "ALL") {
      query += ` AND EXISTS (
        SELECT 1 FROM user_skills us 
        JOIN skills s ON us.skill_id = s.id 
        WHERE us.user_id = u.id AND us.skill_type = 'TEACH' AND s.name ILIKE $${paramIndex}
      )`;
      values.push(skill.trim());
      paramIndex++;
    }

    if (category && typeof category === "string" && category !== "ALL") {
      query += ` AND EXISTS (
        SELECT 1 FROM user_skills us 
        JOIN skills s ON us.skill_id = s.id 
        WHERE us.user_id = u.id AND us.skill_type = 'TEACH' AND s.category ILIKE $${paramIndex}
      )`;
      values.push(`%${category.trim()}%`);
      paramIndex++;
    }

    query += ` ORDER BY u.created_at ASC;`;

    const result = await pool.query<DbMentorRow>(query, values);

    // Fetch weekly availability for these mentors
    const mentorIds = result.rows.map((m) => m.id);
    let availabilitiesMap: Record<string, any[]> = {};

    if (mentorIds.length > 0) {
      const availRes = await pool.query(
        `SELECT user_id, day_of_week, is_enabled, start_time, end_time
         FROM user_availabilities
         WHERE user_id = ANY($1::uuid[])
         ORDER BY user_id, day_of_week`,
        [mentorIds]
      );

      availRes.rows.forEach((row) => {
        if (!availabilitiesMap[row.user_id]) {
          availabilitiesMap[row.user_id] = [];
        }
        availabilitiesMap[row.user_id].push({
          day: row.day_of_week,
          enabled: row.is_enabled,
          startTime: row.start_time.slice(0, 5),
          endTime: row.end_time.slice(0, 5),
        });
      });
    }

    const defaultAvailability = [
      { day: "monday", enabled: true, startTime: "17:00", endTime: "20:00" },
      { day: "tuesday", enabled: false, startTime: "17:00", endTime: "20:00" },
      { day: "wednesday", enabled: true, startTime: "16:00", endTime: "19:00" },
      { day: "thursday", enabled: false, startTime: "17:00", endTime: "20:00" },
      { day: "friday", enabled: true, startTime: "17:00", endTime: "20:00" },
      { day: "saturday", enabled: false, startTime: "14:00", endTime: "18:00" },
      { day: "sunday", enabled: false, startTime: "14:00", endTime: "18:00" },
    ];

    const formattedMentors = result.rows.map((row) => ({
      id: row.id,
      name: row.name,
      role: row.role === "mentor" ? (row.teaches[0] ? `${row.teaches[0]} Mentor` : "Campus Mentor") : row.role,
      department: row.department,
      year: row.year,
      rating: row.avg_rating ? parseFloat(row.avg_rating) : 0,
      reviewCount: isNaN(parseInt(row.review_count, 10)) ? 0 : parseInt(row.review_count, 10),
      credits: isNaN(parseInt(String(row.credits), 10)) ? 40 : parseInt(String(row.credits), 10),
      sessionsCount: isNaN(parseInt(row.sessions_count, 10)) ? 0 : parseInt(row.sessions_count, 10),
      avatar: row.avatar,
      teachingSkill: row.teaches[0] ? `${row.teaches[0]} & Development` : "Peer Mentorship",
      teaches: row.teaches.length > 0 ? row.teaches : ["Mentorship"],
      learns: row.learns,
      bio: row.bio || "VIT student and peer mentor ready to help you level up your skills.",
      experienceYears: row.experience_years || "1+ Years",
      projectsBuilt: row.projects_built || "5+",
      languages: row.languages || "English",
      availability: availabilitiesMap[row.id] && availabilitiesMap[row.id].length > 0
        ? availabilitiesMap[row.id]
        : defaultAvailability,
    }));

    res.json({
      success: true,
      count: formattedMentors.length,
      data: formattedMentors,
    });
  } catch (error) {
    console.error("Error fetching mentors:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch mentors list.",
    });
  }
}

export async function getMentorById(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;

    const mentorRes = await pool.query(
      `SELECT 
        u.id,
        u.full_name AS name,
        COALESCE(u.role, 'mentor') AS role,
        COALESCE(d.name, 'Computer Science') AS department,
        COALESCE(u.year_of_study, '3rd Year') AS year,
        u.avatar,
        u.bio,
        u.experience_years,
        u.projects_built,
        u.languages,
        u.email,
        COALESCE(
          (
            SELECT array_agg(s.name)
            FROM user_skills us
            JOIN skills s ON us.skill_id = s.id
            WHERE us.user_id = u.id AND us.skill_type = 'TEACH'
          ),
          ARRAY[]::text[]
        ) AS teaches,
        COALESCE(
          (
            SELECT array_agg(s.name)
            FROM user_skills us
            JOIN skills s ON us.skill_id = s.id
            WHERE us.user_id = u.id AND us.skill_type = 'LEARN'
          ),
          ARRAY[]::text[]
        ) AS learns,
        (
          SELECT ROUND(AVG(r.rating), 1)::text
          FROM reviews r
          WHERE r.reviewee_id = u.id
        ) AS avg_rating,
        (
          SELECT COUNT(r.id)::text
          FROM reviews r
          WHERE r.reviewee_id = u.id
        ) AS review_count,
        (
          SELECT COUNT(s.id)::text
          FROM sessions s
          WHERE (s.mentor_id = u.id OR s.learner_id = u.id) AND s.status = 'completed'
        ) AS sessions_count,
        COALESCE(
          (
            SELECT w.balance
            FROM wallets w
            WHERE w.user_id = u.id
          ),
          40
        ) AS credits
      FROM users u
      LEFT JOIN departments d ON u.department_id = d.id
      WHERE u.id = $1;`,
      [id]
    );

    if (mentorRes.rows.length === 0) {
      res.status(404).json({
        success: false,
        message: "Mentor profile not found.",
      });
      return;
    }

    const mentor = mentorRes.rows[0];

    // Fetch availability
    const availRes = await pool.query(
      `SELECT day_of_week, is_enabled, start_time, end_time
       FROM user_availabilities
       WHERE user_id = $1
       ORDER BY day_of_week`,
      [id]
    );

    const availability = availRes.rows.map((row) => ({
      day: row.day_of_week,
      enabled: row.is_enabled,
      startTime: row.start_time.slice(0, 5),
      endTime: row.end_time.slice(0, 5),
    }));

    // Fetch reviews
    const reviewsRes = await pool.query(
      `SELECT 
        r.id,
        r.rating,
        r.comment,
        r.created_at,
        u.full_name AS reviewer_name,
        u.avatar AS reviewer_avatar
       FROM reviews r
       JOIN users u ON r.reviewer_id = u.id
       WHERE r.reviewee_id = $1
       ORDER BY r.created_at DESC`,
      [id]
    );

    res.json({
      success: true,
      data: {
        id: mentor.id,
        name: mentor.name,
        role: mentor.role === "mentor" ? (mentor.teaches[0] ? `${mentor.teaches[0]} Mentor` : "Mentor") : mentor.role,
        department: mentor.department,
        year: mentor.year,
        email: mentor.email,
        avatar: mentor.avatar,
        bio: mentor.bio,
        rating: mentor.avg_rating ? parseFloat(mentor.avg_rating) : 0,
        reviewCount: isNaN(parseInt(mentor.review_count, 10)) ? 0 : parseInt(mentor.review_count, 10),
        sessionsCount: isNaN(parseInt(mentor.sessions_count, 10)) ? 0 : parseInt(mentor.sessions_count, 10),
        credits: isNaN(parseInt(String(mentor.credits), 10)) ? 40 : parseInt(String(mentor.credits), 10),
        experienceYears: mentor.experience_years || "1+ Years",
        projectsBuilt: mentor.projects_built || "5+",
        languages: mentor.languages || "English",
        teaches: mentor.teaches,
        learns: mentor.learns,
        availability: availability.length > 0 ? availability : [
          { day: "monday", enabled: true, startTime: "17:00", endTime: "20:00" },
          { day: "wednesday", enabled: true, startTime: "16:00", endTime: "19:00" },
          { day: "friday", enabled: true, startTime: "17:00", endTime: "20:00" },
        ],
        reviews: reviewsRes.rows,
      },
    });
  } catch (error) {
    console.error("Error fetching mentor profile:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch mentor profile.",
    });
  }
}

export async function updateMyAvailability(req: Request, res: Response): Promise<void> {
  const client = await pool.connect();
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ success: false, message: "Unauthorized" });
      return;
    }

    const { availability } = req.body;
    if (!Array.isArray(availability)) {
      res.status(400).json({ success: false, message: "Availability must be an array of day slots." });
      return;
    }

    await client.query("BEGIN");

    for (const slot of availability) {
      const day = String(slot.day || "").toLowerCase().trim();
      const isEnabled = Boolean(slot.enabled);
      const startTime = String(slot.startTime || "09:00").trim();
      const endTime = String(slot.endTime || "17:00").trim();

      const validDays = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];
      if (!validDays.includes(day)) continue;

      await client.query(
        `INSERT INTO user_availabilities (user_id, day_of_week, is_enabled, start_time, end_time, updated_at)
         VALUES ($1, $2, $3, $4, $5, NOW())
         ON CONFLICT (user_id, day_of_week) DO UPDATE
         SET is_enabled = EXCLUDED.is_enabled,
             start_time = EXCLUDED.start_time,
             end_time = EXCLUDED.end_time,
             updated_at = NOW()`,
        [userId, day, isEnabled, startTime, endTime]
      );
    }

    await client.query("COMMIT");

    // Fetch saved availability
    const availRes = await client.query(
      `SELECT day_of_week, is_enabled, start_time, end_time
       FROM user_availabilities
       WHERE user_id = $1
       ORDER BY day_of_week`,
      [userId]
    );

    const savedAvailability = availRes.rows.map((row) => ({
      day: row.day_of_week,
      enabled: row.is_enabled,
      startTime: row.start_time.slice(0, 5),
      endTime: row.end_time.slice(0, 5),
    }));

    res.json({
      success: true,
      message: "Availability updated successfully.",
      data: savedAvailability,
    });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Error updating availability:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update teaching availability.",
    });
  } finally {
    client.release();
  }
}

