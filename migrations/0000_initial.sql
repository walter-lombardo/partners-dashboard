-- Create users table
CREATE TABLE IF NOT EXISTS "users" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid(),
	"email" text NOT NULL UNIQUE,
	"password" text NOT NULL,
	"role" text DEFAULT 'PARTNER' NOT NULL,
	"project_id" varchar
);

-- Create projects table
CREATE TABLE IF NOT EXISTS "projects" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid(),
	"name" text NOT NULL,
	"logo_url" text,
	"dapp_url" text,
	"btc_address" text,
	"thor_name" text,
	"maya_name" text,
	"chainflip_address" text
);

-- Create metric_points table
CREATE TABLE IF NOT EXISTS "metric_points" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid(),
	"project_id" varchar NOT NULL,
	"t" timestamp NOT NULL,
	"volume_usd" real NOT NULL,
	"fees_usd" real NOT NULL,
	"trades" integer NOT NULL
);

-- Create transactions table
CREATE TABLE IF NOT EXISTS "transactions" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid(),
	"project_id" varchar NOT NULL,
	"ts" timestamp NOT NULL,
	"asset_from" text NOT NULL,
	"asset_to" text NOT NULL,
	"amount_in" text NOT NULL,
	"amount_out" text NOT NULL,
	"route" text NOT NULL,
	"usd_notional" real NOT NULL,
	"fee_usd" real NOT NULL,
	"status" text NOT NULL,
	"tx_hash" text NOT NULL,
	"chain" text NOT NULL
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS "idx_users_email" ON "users" ("email");
CREATE INDEX IF NOT EXISTS "idx_metric_points_project_id" ON "metric_points" ("project_id");
CREATE INDEX IF NOT EXISTS "idx_metric_points_t" ON "metric_points" ("t");
CREATE INDEX IF NOT EXISTS "idx_transactions_project_id" ON "transactions" ("project_id");
CREATE INDEX IF NOT EXISTS "idx_transactions_ts" ON "transactions" ("ts");
