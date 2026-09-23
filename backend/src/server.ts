import dotenv from "dotenv";
dotenv.config();

import app from "./app";
import pool, { testDatabaseConnection } from "./config/db";
import { runMigrations } from "./db/migrate";
import { seedDatabase } from "./db/seed";

const PORT = Number(process.env.PORT) || 5000;

async function startServer(): Promise<void> {
  // Test the database connection before accepting traffic
  await testDatabaseConnection();

  // Automated migration and seeding on container boot
  try {
    const tableRes = await pool.query<{ count: string }>(`
      SELECT count(*) FROM information_schema.tables WHERE table_schema = 'public';
    `);
    const count = parseInt(tableRes.rows[0]?.count || "0", 10);
    if (count === 0) {
      console.log("📦 Fresh database detected. Running automated migrations and seeding...");
      await runMigrations();
      await seedDatabase();
    } else {
      // Ensure schemas are up to date
      await runMigrations();
    }
  } catch (err) {
    console.warn("Automated database initialization note:", (err as Error).message);
  }

  app.listen(PORT, () => {
    console.log(`🚀  SkillSwap backend running on http://localhost:${PORT}`);
    console.log(`   Health check  → http://localhost:${PORT}/api/health`);
    console.log(`   DB check      → http://localhost:${PORT}/api/health/database`);
  });
}

startServer().catch((error) => {
  console.error("Failed to start server:", error);
  process.exit(1);
});
