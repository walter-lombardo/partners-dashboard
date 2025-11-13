import { neon } from "@neondatabase/serverless";
import * as dotenv from "dotenv";

dotenv.config();

async function checkDefaults() {
  if (!process.env.DATABASE_URL) {
    console.error("❌ DATABASE_URL not found");
    process.exit(1);
  }

  const sql = neon(process.env.DATABASE_URL);

  console.log("🔍 Checking column defaults...\n");

  try {
    const usersColumns = await sql`
      SELECT
        column_name,
        data_type,
        is_nullable,
        column_default
      FROM information_schema.columns
      WHERE table_name = 'users'
      ORDER BY ordinal_position;
    `;

    console.log("📋 Users table columns with defaults:");
    console.log("─".repeat(80));
    usersColumns.forEach(col => {
      console.log(`  ${col.column_name.padEnd(15)} ${col.data_type.padEnd(20)} ${(col.is_nullable === 'NO' ? 'NOT NULL' : 'NULLABLE').padEnd(10)} ${col.column_default || '(no default)'}`);
    });

  } catch (error: any) {
    console.error("❌ Check failed:", error.message);
    process.exit(1);
  }
}

checkDefaults();
