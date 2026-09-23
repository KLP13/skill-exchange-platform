import fs from "fs";
import path from "path";
import dotenv from "dotenv";
import pool from "../config/db";

dotenv.config();

/**
 * Migration runner: reads schema.sql and applies it against PostgreSQL
 */
export async function runMigrations(): Promise<void> {
  const possiblePaths = [
    path.join(__dirname, "schema.sql"),
    path.join(__dirname, "..", "src", "db", "schema.sql"),
    path.join(process.cwd(), "src", "db", "schema.sql"),
    path.join(process.cwd(), "dist", "db", "schema.sql"),
  ];
  const schemaPath = possiblePaths.find((p) => fs.existsSync(p));
  console.log(`\n📦  Loading base schema from: ${schemaPath || "Not found"}`);

  if (!schemaPath || !fs.existsSync(schemaPath)) {
    throw new Error(`Schema file not found in paths: ${possiblePaths.join(", ")}`);
  }

  const baseSql = fs.readFileSync(schemaPath, "utf-8");

  console.log("🚀  Applying database schema & migrations...");
  const client = await pool.connect();

  try {
    await client.query("BEGIN");
    await client.query(baseSql);

    // Apply any incremental migrations in migrations/ folder
    const possibleMigrationDirs = [
      path.join(__dirname, "migrations"),
      path.join(process.cwd(), "src", "db", "migrations"),
      path.join(process.cwd(), "dist", "db", "migrations"),
    ];
    const migrationsDir = possibleMigrationDirs.find((d) => fs.existsSync(d));
    if (migrationsDir) {
      const files = fs.readdirSync(migrationsDir).filter((f) => f.endsWith(".sql")).sort();
      for (const file of files) {
        console.log(`   Applying migration: ${file}`);
        const migrationSql = fs.readFileSync(path.join(migrationsDir, file), "utf-8");
        await client.query(migrationSql);
      }
    }

    await client.query("COMMIT");
    console.log("✅  All database schemas and migrations applied successfully!\n");
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("❌  Migration failed:", (error as Error).message);
    throw error;
  } finally {
    client.release();
  }
}

// Allow direct CLI execution: ts-node src/db/migrate.ts
if (require.main === module) {
  runMigrations()
    .then(async () => {
      // Query created tables to provide instant visual verification
      const res = await pool.query<{ table_name: string }>(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        ORDER BY table_name;
      `);
      console.log("📋  Public tables in database:");
      res.rows.forEach((row, i) => {
        console.log(`   ${i + 1}. ${row.table_name}`);
      });
      process.exit(0);
    })
    .catch(() => {
      process.exit(1);
    });
}
