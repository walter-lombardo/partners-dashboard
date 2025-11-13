import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, real, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users table
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: text("email").notNull().unique(),
  password: text("password"),
  name: text("name").notNull(),
  role: text("role").notNull().default(sql`'PARTNER'`),
  projectId: varchar("project_id"),
  googleId: text("google_id"),
  avatarUrl: text("avatar_url"),
  createdAt: timestamp("created_at", { mode: 'date' }).notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at", { mode: 'date' }).notNull().default(sql`now()`),
});

// Projects table
export const projects = pgTable("projects", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name"),
  logoUrl: text("logo_url"),
  dappUrl: text("dapp_url"),
  btcAddress: text("btc_address"),
  thorName: text("thor_name"),
  mayaName: text("maya_name"),
  chainflipAddress: text("chainflip_address"),
  setupCompleted: text("setup_completed").notNull().default("false"),
});

// Metric points (time-series data)
export const metricPoints = pgTable("metric_points", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  projectId: varchar("project_id").notNull(),
  t: timestamp("t").notNull(),
  volumeUsd: real("volume_usd").notNull(),
  feesUsd: real("fees_usd").notNull(),
  trades: integer("trades").notNull(),
});

// Transactions
export const transactions = pgTable("transactions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  projectId: varchar("project_id").notNull(),
  ts: timestamp("ts").notNull(),
  assetFrom: text("asset_from").notNull(),
  assetTo: text("asset_to").notNull(),
  amountIn: text("amount_in").notNull(),
  amountOut: text("amount_out").notNull(),
  route: text("route").notNull(),
  usdNotional: real("usd_notional").notNull(),
  feeUsd: real("fee_usd").notNull(),
  status: text("status").notNull(),
  txHash: text("tx_hash").notNull(),
  chain: text("chain").notNull(),
});

// API Keys
export const apiKeys = pgTable("api_keys", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  projectId: varchar("project_id").notNull(),
  name: text("name").notNull(),
  key: text("key").notNull().unique(),
  status: text("status").notNull().default("active"),
  createdAt: timestamp("created_at", { mode: 'date' }).notNull().default(sql`now()`),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).pick({
  name: true,
  email: true,
  password: true,
}).extend({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const insertProjectSchema = createInsertSchema(projects).omit({
  id: true,
  setupCompleted: true,
}).extend({
  name: z.string().min(1, "Project name is required").optional(),
  logoUrl: z.string().optional(),
  dappUrl: z.string().optional().refine((val) => !val || (val.startsWith("https://") && z.string().url().safeParse(val).success), {
    message: "Must be a valid HTTPS URL or empty"
  }),
  btcAddress: z.string().optional().refine((val) => !val || /^(1|3|bc1)[a-zA-Z0-9]{25,62}$/.test(val), {
    message: "Invalid Bitcoin address"
  }),
  thorName: z.string().optional().refine((val) => !val || /^[a-z0-9-]{1,32}$/.test(val), {
    message: "THORName must be lowercase letters, digits, and dashes only (1-32 chars)"
  }),
  mayaName: z.string().optional().refine((val) => !val || /^[a-z0-9-]{1,32}$/.test(val), {
    message: "MayaName must be lowercase letters, digits, and dashes only (1-32 chars)"
  }),
  chainflipAddress: z.string().optional(),
});

export const insertApiKeySchema = createInsertSchema(apiKeys).pick({
  name: true,
}).extend({
  name: z.string().min(1, "API key name is required"),
});

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertProject = z.infer<typeof insertProjectSchema>;
export type Project = typeof projects.$inferSelect;

export type MetricPoint = typeof metricPoints.$inferSelect;
export type Transaction = typeof transactions.$inferSelect;

export type InsertApiKey = z.infer<typeof insertApiKeySchema>;
export type ApiKey = typeof apiKeys.$inferSelect;

// API response types
export interface MeResponse {
  user: User;
  project: Project;
}

export interface MetricsResponse {
  series: Array<{
    t: string;
    volumeUsd: number;
    feesUsd: number;
    trades: number;
  }>;
  totals: {
    volumeUsd: number;
    feesUsd: number;
    trades: number;
    change24h: number;
    btcEquivalent: number;
  };
}

export interface TopRoute {
  asset: string;
  icon: string;
  amount: number;
  change: number;
}
