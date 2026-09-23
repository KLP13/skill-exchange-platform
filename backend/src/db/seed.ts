import dotenv from "dotenv";
dotenv.config();

import pool from "../config/db";

interface SeedDepartment {
  code: string;
  name: string;
  description: string;
}

interface SeedSkill {
  name: string;
  category: string;
  description: string;
  deptCode: string;
}

interface SeedMentor {
  id?: string;
  fullName: string;
  email: string;
  role: string;
  deptCode: string;
  year: string;
  avatar: string;
  bio: string;
  experienceYears: string;
  projectsBuilt: string;
  languages: string;
  teaches: string[];
  learns: string[];
  availabilities: Array<{
    day: string;
    isEnabled: boolean;
    startTime: string;
    endTime: string;
  }>;
}

const DEPARTMENTS: SeedDepartment[] = [
  { code: "CSE", name: "Computer Science and Engineering", description: "Computing, algorithms, software engineering, and artificial intelligence" },
  { code: "ECE", name: "Electronics and Communication Engineering", description: "Embedded systems, communication networks, and signal processing" },
  { code: "EEE", name: "Electrical and Electronics Engineering", description: "Power systems, circuits, and renewable energy technologies" },
  { code: "IT", name: "Information Technology", description: "Software architecture, cloud infrastructure, and enterprise systems" },
  { code: "MECH", name: "Mechanical Engineering", description: "Design, robotics, thermodynamics, and manufacturing technologies" },
];

const SKILLS: SeedSkill[] = [
  // Web Dev
  { name: "React", category: "Web Development", description: "Component-based UI development with hooks and state management", deptCode: "CSE" },
  { name: "TypeScript", category: "Web Development", description: "Type-safe JavaScript for scalable web applications", deptCode: "CSE" },
  { name: "Next.js", category: "Web Development", description: "Full-stack React framework with SSR and server actions", deptCode: "CSE" },
  { name: "JavaScript", category: "Web Development", description: "Core web programming, async programming, and DOM manipulation", deptCode: "CSE" },
  { name: "Tailwind CSS", category: "Web Development", description: "Utility-first modern responsive CSS styling", deptCode: "IT" },
  { name: "Node.js", category: "Web Development", description: "Server-side JavaScript runtime with Express and REST APIs", deptCode: "IT" },

  // AI & Data
  { name: "Python", category: "AI & Data Science", description: "Versatile programming for scripting, data analysis, and machine learning", deptCode: "CSE" },
  { name: "Machine Learning", category: "AI & Data Science", description: "Supervised and unsupervised models with scikit-learn", deptCode: "ECE" },
  { name: "Deep Learning", category: "AI & Data Science", description: "Neural networks with PyTorch and TensorFlow", deptCode: "ECE" },
  { name: "Data Science", category: "AI & Data Science", description: "Exploratory data analysis, pandas, numpy, and visualization", deptCode: "IT" },

  // CS Fundamentals
  { name: "DSA", category: "CS Fundamentals", description: "Data structures, algorithms, graph theory, and LeetCode problem solving", deptCode: "CSE" },
  { name: "C++", category: "CS Fundamentals", description: "Object-oriented programming, STL, and competitive programming", deptCode: "CSE" },
  { name: "Java", category: "CS Fundamentals", description: "Enterprise OOP, Spring Boot foundations, and multithreading", deptCode: "IT" },

  // Design
  { name: "UI/UX Design", category: "Design", description: "User-centered design principles, wireframing, and user testing", deptCode: "IT" },
  { name: "Figma", category: "Design", description: "Interactive prototyping, design systems, and component libraries", deptCode: "IT" },

  // DevOps & Cloud
  { name: "Docker", category: "DevOps & Cloud", description: "Containerization, Dockerfiles, and multi-container Compose stacks", deptCode: "EEE" },
  { name: "Cloud Computing", category: "DevOps & Cloud", description: "AWS core services (EC2, S3, RDS) and cloud architecture", deptCode: "EEE" },
];

const MENTORS: SeedMentor[] = [];

export async function seedDatabase(): Promise<void> {
  console.log("\n🌱  Starting SkillSwap Database Seeder...");
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // 1. Seed Departments
    console.log("   Seeding academic departments...");
    const deptMap = new Map<string, string>(); // code -> uuid

    for (const d of DEPARTMENTS) {
      const res = await client.query<{ id: string }>(
        `INSERT INTO departments (code, name, description)
         VALUES ($1, $2, $3)
         ON CONFLICT (code) DO UPDATE 
         SET name = EXCLUDED.name, description = EXCLUDED.description
         RETURNING id`,
        [d.code, d.name, d.description]
      );
      deptMap.set(d.code, res.rows[0].id);
    }

    // 2. Seed Skills
    console.log("   Seeding skills catalog...");
    const skillMap = new Map<string, string>(); // name -> uuid

    for (const s of SKILLS) {
      const deptId = deptMap.get(s.deptCode) || null;
      const res = await client.query<{ id: string }>(
        `INSERT INTO skills (name, category, description, department_id)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (name) DO UPDATE
         SET category = EXCLUDED.category, description = EXCLUDED.description, department_id = EXCLUDED.department_id
         RETURNING id`,
        [s.name, s.category, s.description, deptId]
      );
      skillMap.set(s.name, res.rows[0].id);
    }

    // 3. Seed Mentors
    console.log("   Seeding student mentors, skills, and availabilities...");

    for (const m of MENTORS) {
      const deptId = deptMap.get(m.deptCode) || null;

      // Upsert user
      const userRes = await client.query<{ id: string }>(
        `INSERT INTO users (
           full_name, email, role, department_id, year_of_study,
           avatar, bio, experience_years, projects_built, languages,
           onboarding_completed, onboarding_step
         )
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, TRUE, 3)
         ON CONFLICT (email) DO UPDATE
         SET full_name = EXCLUDED.full_name,
             role = EXCLUDED.role,
             department_id = EXCLUDED.department_id,
             year_of_study = EXCLUDED.year_of_study,
             avatar = EXCLUDED.avatar,
             bio = EXCLUDED.bio,
             experience_years = EXCLUDED.experience_years,
             projects_built = EXCLUDED.projects_built,
             languages = EXCLUDED.languages,
             onboarding_completed = TRUE
         RETURNING id`,
        [
          m.fullName,
          m.email,
          m.role,
          deptId,
          m.year,
          m.avatar,
          m.bio,
          m.experienceYears,
          m.projectsBuilt,
          m.languages,
        ]
      );

      const userId = userRes.rows[0].id;

      // Upsert wallet (40 credits)
      const walletRes = await client.query<{ id: string }>(
        `INSERT INTO wallets (user_id, balance)
         VALUES ($1, 40)
         ON CONFLICT (user_id) DO UPDATE
         SET balance = GREATEST(wallets.balance, 40)
         RETURNING id`,
        [userId]
      );

      // Seed TEACH skills
      for (const skillName of m.teaches) {
        const skillId = skillMap.get(skillName);
        if (skillId) {
          await client.query(
            `INSERT INTO user_skills (user_id, skill_id, skill_type)
             VALUES ($1, $2, 'TEACH')
             ON CONFLICT (user_id, skill_id, skill_type) DO NOTHING`,
            [userId, skillId]
          );
        }
      }

      // Seed LEARN skills
      for (const skillName of m.learns) {
        const skillId = skillMap.get(skillName);
        if (skillId) {
          await client.query(
            `INSERT INTO user_skills (user_id, skill_id, skill_type)
             VALUES ($1, $2, 'LEARN')
             ON CONFLICT (user_id, skill_id, skill_type) DO NOTHING`,
            [userId, skillId]
          );
        }
      }

      // Seed Availability
      for (const a of m.availabilities) {
        await client.query(
          `INSERT INTO user_availabilities (user_id, day_of_week, is_enabled, start_time, end_time)
           VALUES ($1, $2, $3, $4, $5)
           ON CONFLICT (user_id, day_of_week) DO UPDATE
           SET is_enabled = EXCLUDED.is_enabled,
               start_time = EXCLUDED.start_time,
               end_time = EXCLUDED.end_time`,
          [userId, a.day, a.isEnabled, a.startTime, a.endTime]
        );
      }
    }

    await client.query("COMMIT");
    console.log("✅  Database seeded successfully with departments, skills, and mentors!\n");
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("❌  Seeding failed:", (error as Error).message);
    throw error;
  } finally {
    client.release();
  }
}

// Allow direct CLI execution: ts-node src/db/seed.ts
if (require.main === module) {
  seedDatabase()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}
