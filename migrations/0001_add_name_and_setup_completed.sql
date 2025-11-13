-- Add name column to users table
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "name" text;

-- Update existing users to have a default name
UPDATE "users" SET "name" = 'User' WHERE "name" IS NULL;

-- Make name column NOT NULL after setting default values
ALTER TABLE "users" ALTER COLUMN "name" SET NOT NULL;

-- Make projects.name nullable (was previously NOT NULL)
ALTER TABLE "projects" ALTER COLUMN "name" DROP NOT NULL;

-- Add setup_completed column to projects table
ALTER TABLE "projects" ADD COLUMN IF NOT EXISTS "setup_completed" text DEFAULT 'false' NOT NULL;
