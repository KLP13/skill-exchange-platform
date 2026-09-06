import pool from "../../config/db";

export interface StepOnePayload {
  fullName?: string;
  registrationNumber?: string;
  university?: string;
  department?: string;
  year?: string;
  phone?: string;
  avatar?: string;
  bio?: string;
  github?: string;
  linkedin?: string;
  portfolio?: string;
}

export interface StepTwoPayload {
  teaches: string[];
  learns: string[];
}

export interface StepThreePayload {
  availability?: string;
  preferredTime?: string;
  github?: string;
  linkedin?: string;
  portfolio?: string;
}

/**
 * 1. Get Onboarding Status & Saved Data
 * Allows resuming incomplete onboarding seamlessly.
 */
export async function getOnboardingStatus(userId: string) {
  const userRes = await pool.query<{
    id: string;
    full_name: string;
    email: string;
    role: string;
    avatar: string | null;
    bio: string | null;
    registration_number: string | null;
    university: string | null;
    year_of_study: string | null;
    phone_number: string | null;
    department_name: string | null;
    availability_preference: string | null;
    preferred_time: string | null;
    github_url: string | null;
    linkedin_url: string | null;
    portfolio_url: string | null;
    onboarding_completed: boolean;
    onboarding_step: number;
    balance: number | null;
  }>(
    `SELECT u.id, u.full_name, u.email, u.role, u.avatar, u.bio,
            u.registration_number, u.university, u.year_of_study, u.phone_number,
            d.name AS department_name, u.availability_preference, u.preferred_time,
            u.github_url, u.linkedin_url, u.portfolio_url,
            u.onboarding_completed, u.onboarding_step, w.balance
     FROM users u
     LEFT JOIN departments d ON d.id = u.department_id
     LEFT JOIN wallets w ON w.user_id = u.id
     WHERE u.id = $1`,
    [userId]
  );

  if (userRes.rows.length === 0) {
    throw { status: 404, message: "User not found." };
  }

  const u = userRes.rows[0];

  // Fetch teaching skills
  const teachSkillsRes = await pool.query<{ name: string }>(
    `SELECT s.name 
     FROM user_skills us
     JOIN skills s ON s.id = us.skill_id
     WHERE us.user_id = $1 AND us.skill_type = 'TEACH'
     ORDER BY s.name`,
    [userId]
  );

  // Fetch learning skills
  const learnSkillsRes = await pool.query<{ name: string }>(
    `SELECT s.name 
     FROM user_skills us
     JOIN skills s ON s.id = us.skill_id
     WHERE us.user_id = $1 AND us.skill_type = 'LEARN'
     ORDER BY s.name`,
    [userId]
  );

  return {
    id: u.id,
    fullName: u.full_name,
    email: u.email,
    avatar: u.avatar || "",
    bio: u.bio || "",
    registrationNumber: u.registration_number || "",
    university: u.university || "VIT Chennai",
    department: u.department_name || "",
    year: u.year_of_study || "",
    phone: u.phone_number || "",
    availability: u.availability_preference || "",
    preferredTime: u.preferred_time || "",
    github: u.github_url || "",
    linkedin: u.linkedin_url || "",
    portfolio: u.portfolio_url || "",
    teaches: teachSkillsRes.rows.map((r) => r.name),
    learns: learnSkillsRes.rows.map((r) => r.name),
    onboardingCompleted: u.onboarding_completed,
    onboardingStep: u.onboarding_step,
    credits: u.balance ?? 40,
  };
}

/**
 * 2. Save Step 1: Personal Information
 */
export async function saveStepOnePersonal(
  userId: string,
  payload: StepOnePayload
) {
  let departmentId: string | null = null;

  if (payload.department?.trim()) {
    const deptName = payload.department.trim();
    
    // Check if department already exists by name
    const existingDept = await pool.query<{ id: string }>(
      "SELECT id FROM departments WHERE LOWER(name) = LOWER($1)",
      [deptName]
    );

    if (existingDept.rows.length > 0) {
      departmentId = existingDept.rows[0].id;
    } else {
      const randomSuffix = Math.floor(100 + Math.random() * 900);
      const deptCode = deptName.replace(/[^A-Za-z0-9]/g, "").substring(0, 10).toUpperCase() + "_" + randomSuffix;
      
      const deptRes = await pool.query<{ id: string }>(
        `INSERT INTO departments (code, name)
         VALUES ($1, $2)
         ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
         RETURNING id`,
        [deptCode, deptName]
      );
      departmentId = deptRes.rows[0]?.id || null;
    }
  }

  await pool.query(
    `UPDATE users
     SET full_name = COALESCE(NULLIF($1, ''), full_name),
         registration_number = $2,
         university = COALESCE(NULLIF($3, ''), 'VIT Chennai'),
         department_id = COALESCE($4, department_id),
         year_of_study = $5,
         phone_number = $6,
         bio = $7,
         avatar = COALESCE($8, avatar),
         github_url = COALESCE($9, github_url),
         linkedin_url = COALESCE($10, linkedin_url),
         portfolio_url = COALESCE($11, portfolio_url),
         onboarding_step = GREATEST(onboarding_step, 2),
         updated_at = CURRENT_TIMESTAMP
     WHERE id = $12`,
    [
      payload.fullName?.trim() || null,
      payload.registrationNumber?.trim() || null,
      payload.university?.trim() || "VIT Chennai",
      departmentId,
      payload.year?.trim() || null,
      payload.phone?.trim() || null,
      payload.bio?.trim() || null,
      payload.avatar?.trim() || null,
      payload.github?.trim() || null,
      payload.linkedin?.trim() || null,
      payload.portfolio?.trim() || null,
      userId,
    ]
  );

  return getOnboardingStatus(userId);
}

/**
 * 3. Save Step 2: Skills & Interests
 */
export async function saveStepTwoSkills(
  userId: string,
  payload: StepTwoPayload
) {
  const teaches = (payload.teaches || []).map((s) => s.trim()).filter(Boolean);
  const learns = (payload.learns || []).map((s) => s.trim()).filter(Boolean);

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // Upsert skills and get their IDs
    const getOrCreateSkillId = async (skillName: string): Promise<string> => {
      const res = await client.query<{ id: string }>(
        `INSERT INTO skills (name)
         VALUES ($1)
         ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
         RETURNING id`,
        [skillName]
      );
      return res.rows[0].id;
    };

    // Remove existing user_skills for clean sync
    await client.query("DELETE FROM user_skills WHERE user_id = $1", [userId]);

    // Insert TEACH skills
    for (const skill of teaches) {
      const skillId = await getOrCreateSkillId(skill);
      await client.query(
        `INSERT INTO user_skills (user_id, skill_id, skill_type)
         VALUES ($1, $2, 'TEACH')
         ON CONFLICT DO NOTHING`,
        [userId, skillId]
      );
    }

    // Insert LEARN skills
    for (const skill of learns) {
      const skillId = await getOrCreateSkillId(skill);
      await client.query(
        `INSERT INTO user_skills (user_id, skill_id, skill_type)
         VALUES ($1, $2, 'LEARN')
         ON CONFLICT DO NOTHING`,
        [userId, skillId]
      );
    }

    // Advance onboarding step to 3
    await client.query(
      `UPDATE users
       SET onboarding_step = GREATEST(onboarding_step, 3),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $1`,
      [userId]
    );

    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }

  return getOnboardingStatus(userId);
}

/**
 * 4. Save Step 3: Preferences & Complete Onboarding
 */
export async function saveStepThreePreferences(
  userId: string,
  payload: StepThreePayload
) {
  await pool.query(
    `UPDATE users
     SET availability_preference = $1,
         preferred_time = $2,
         github_url = COALESCE($3, github_url),
         linkedin_url = COALESCE($4, linkedin_url),
         portfolio_url = COALESCE($5, portfolio_url),
         onboarding_completed = TRUE,
         onboarding_step = 3,
         updated_at = CURRENT_TIMESTAMP
     WHERE id = $6`,
    [
      payload.availability?.trim() || null,
      payload.preferredTime?.trim() || null,
      payload.github?.trim() || null,
      payload.linkedin?.trim() || null,
      payload.portfolio?.trim() || null,
      userId,
    ]
  );

  return getOnboardingStatus(userId);
}
