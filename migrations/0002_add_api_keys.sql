-- Create api_keys table
CREATE TABLE IF NOT EXISTS "api_keys" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  "project_id" varchar NOT NULL,
  "name" text NOT NULL,
  "key" text NOT NULL UNIQUE,
  "status" text DEFAULT 'active' NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL
);

-- Create index on project_id for faster queries
CREATE INDEX IF NOT EXISTS "api_keys_project_id_idx" ON "api_keys" ("project_id");
