import { neon } from "@neondatabase/serverless";
import * as dotenv from "dotenv";

dotenv.config();

async function verifySchema() {
  if (!process.env.DATABASE_URL) {
    console.error("❌ DATABASE_URL not found");
    process.exit(1);
  }

  const sql = neon(process.env.DATABASE_URL);

  console.log("🔍 Verifying database schema...\n");

  try {
    // Check users table columns
    const usersColumns = await sql`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'users'
      ORDER BY ordinal_position;
    `;

    console.log("📋 Users table columns:");
    console.log("─".repeat(60));
    usersColumns.forEach(col => {
      console.log(`  ${col.column_name.padEnd(15)} ${col.data_type.padEnd(20)} ${col.is_nullable === 'NO' ? 'NOT NULL' : 'NULLABLE'}`);
    });

    // Check projects table columns
    const projectsColumns = await sql`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'projects'
      ORDER BY ordinal_position;
    `;

    console.log("\n📋 Projects table columns:");
    console.log("─".repeat(60));
    projectsColumns.forEach(col => {
      console.log(`  ${col.column_name.padEnd(20)} ${col.data_type.padEnd(15)} ${col.is_nullable === 'NO' ? 'NOT NULL' : 'NULLABLE'}`);
    });

    console.log("\n✅ Schema verification complete!");

  } catch (error: any) {
    console.error("❌ Verification failed:", error.message);
    process.exit(1);
  }
}

verifySchema();
