import { neon } from "@neondatabase/serverless";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import * as dotenv from "dotenv";

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function runMigration() {
  if (!process.env.DATABASE_URL) {
    console.error("❌ DATABASE_URL not found in environment variables");
    process.exit(1);
  }

  console.log("🔄 Starting database migration...\n");

  try {
    const sql = neon(process.env.DATABASE_URL);

    // Read the migration file
    const migrationPath = join(__dirname, "../migrations/0001_add_name_and_setup_completed.sql");
    const migrationSQL = readFileSync(migrationPath, "utf-8");

    console.log("📄 Executing migration: 0001_add_name_and_setup_completed.sql");
    console.log("─".repeat(60));

    // Split the SQL file into individual statements and execute them
    const lines = migrationSQL.split("\n");
    const statements: string[] = [];
    let currentStatement = "";

    for (const line of lines) {
      const trimmedLine = line.trim();
      // Skip empty lines and comments
      if (trimmedLine === "" || trimmedLine.startsWith("--")) {
        continue;
      }
      currentStatement += line + "\n";
      if (trimmedLine.endsWith(";")) {
        statements.push(currentStatement.trim());
        currentStatement = "";
      }
    }

    for (const statement of statements) {
      if (statement) {
        const preview = statement.replace(/\s+/g, " ").substring(0, 60);
        console.log(`Executing: ${preview}...`);
        await sql(statement);
        console.log("  ✓ Success");
      }
    }

    console.log("─".repeat(60));
    console.log("✅ Migration completed successfully!\n");
    console.log("Changes applied:");
    console.log("  • Added 'name' column to users table");
    console.log("  • Made projects.name nullable");
    console.log("  • Added 'setup_completed' column to projects table");

  } catch (error: any) {
    console.error("❌ Migration failed:", error.message);
    console.error("\nFull error:", error);
    process.exit(1);
  }
}

runMigration();
