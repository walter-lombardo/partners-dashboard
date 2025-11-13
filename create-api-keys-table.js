import { neon } from "@neondatabase/serverless";
import dotenv from "dotenv";

dotenv.config();

const sql = neon(process.env.DATABASE_URL);

async function createApiKeysTable() {
  try {
    console.log("Creating api_keys table...");

    await sql`
      CREATE TABLE IF NOT EXISTS "api_keys" (
        "id" varchar PRIMARY KEY DEFAULT gen_random_uuid(),
        "project_id" varchar NOT NULL,
        "name" text NOT NULL,
        "key" text NOT NULL UNIQUE,
        "status" text DEFAULT 'active' NOT NULL,
        "created_at" timestamp DEFAULT now() NOT NULL
      )
    `;

    console.log("✓ api_keys table created");

    await sql`
      CREATE INDEX IF NOT EXISTS "api_keys_project_id_idx" ON "api_keys" ("project_id")
    `;

    console.log("✓ Index created");
    console.log("Done! API keys table is ready.");

  } catch (error) {
    console.error("Error creating table:", error);
  }
}

createApiKeysTable();
