import { type User, type InsertUser, type Project, type InsertProject, type MetricPoint, type Transaction, type ApiKey, type InsertApiKey } from "../shared/schema.js";
import { users, projects, metricPoints, transactions, apiKeys } from "../shared/schema.js";
import { randomUUID } from "crypto";
import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import { eq, and, gte, lte, desc } from "drizzle-orm";

export interface IStorage {
  // User methods
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser, projectId: string): Promise<User>;

  // Project methods
  getProject(id: string): Promise<Project | undefined>;
  createProject(project: InsertProject): Promise<Project>;
  updateProject(id: string, updates: Partial<InsertProject> & { setupCompleted?: string }): Promise<Project | undefined>;

  // Metrics methods
  getMetrics(projectId: string, fromDate?: Date, toDate?: Date): Promise<MetricPoint[]>;

  // Transaction methods
  getTransactions(projectId: string, limit?: number): Promise<Transaction[]>;

  // API Key methods
  getApiKeys(projectId: string): Promise<ApiKey[]>;
  createApiKey(projectId: string, name: string): Promise<ApiKey>;
  deleteApiKey(id: string, projectId: string): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private projects: Map<string, Project>;
  private metrics: Map<string, MetricPoint>;
  private transactions: Map<string, Transaction>;
  private apiKeys: Map<string, ApiKey>;

  constructor() {
    this.users = new Map();
    this.projects = new Map();
    this.metrics = new Map();
    this.transactions = new Map();
    this.apiKeys = new Map();

    this.seedMockData();
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.email === email,
    );
  }

  async createUser(insertUser: InsertUser, projectId: string): Promise<User> {
    const id = randomUUID();
    const now = new Date();
    const user: User = {
      id,
      name: insertUser.name,
      email: insertUser.email,
      password: insertUser.password,
      role: "PARTNER",
      projectId,
      googleId: null,
      avatarUrl: null,
      createdAt: now,
      updatedAt: now,
    };
    this.users.set(id, user);
    return user;
  }

  async getProject(id: string): Promise<Project | undefined> {
    return this.projects.get(id);
  }

  async createProject(insertProject: InsertProject): Promise<Project> {
    const id = randomUUID();
    const project: Project = {
      id,
      name: insertProject.name || null,
      logoUrl: insertProject.logoUrl || null,
      dappUrl: insertProject.dappUrl || null,
      btcAddress: insertProject.btcAddress || null,
      thorName: insertProject.thorName || null,
      mayaName: insertProject.mayaName || null,
      chainflipAddress: insertProject.chainflipAddress || null,
      setupCompleted: "false",
    };
    this.projects.set(id, project);
    this.seedProjectMetrics(id);
    this.seedProjectTransactions(id);
    return project;
  }

  async updateProject(id: string, updates: Partial<InsertProject> & { setupCompleted?: string }): Promise<Project | undefined> {
    const project = this.projects.get(id);
    if (!project) return undefined;

    const updated: Project = {
      ...project,
      name: updates.name !== undefined ? updates.name || null : project.name,
      logoUrl: updates.logoUrl !== undefined ? updates.logoUrl || null : project.logoUrl,
      dappUrl: updates.dappUrl !== undefined ? updates.dappUrl || null : project.dappUrl,
      btcAddress: updates.btcAddress !== undefined ? updates.btcAddress || null : project.btcAddress,
      thorName: updates.thorName !== undefined ? updates.thorName || null : project.thorName,
      mayaName: updates.mayaName !== undefined ? updates.mayaName || null : project.mayaName,
      chainflipAddress: updates.chainflipAddress !== undefined ? updates.chainflipAddress || null : project.chainflipAddress,
      setupCompleted: updates.setupCompleted !== undefined ? updates.setupCompleted : project.setupCompleted,
    };

    this.projects.set(id, updated);
    return updated;
  }

  async getMetrics(projectId: string, fromDate?: Date, toDate?: Date): Promise<MetricPoint[]> {
    const allMetrics = Array.from(this.metrics.values()).filter(
      (m) => m.projectId === projectId
    );

    if (!fromDate && !toDate) {
      return allMetrics.sort((a, b) => new Date(a.t).getTime() - new Date(b.t).getTime());
    }

    return allMetrics
      .filter((m) => {
        const time = new Date(m.t).getTime();
        const after = fromDate ? time >= fromDate.getTime() : true;
        const before = toDate ? time <= toDate.getTime() : true;
        return after && before;
      })
      .sort((a, b) => new Date(a.t).getTime() - new Date(b.t).getTime());
  }

  async getTransactions(projectId: string, limit = 25): Promise<Transaction[]> {
    return Array.from(this.transactions.values())
      .filter((t) => t.projectId === projectId)
      .sort((a, b) => new Date(b.ts).getTime() - new Date(a.ts).getTime())
      .slice(0, limit);
  }

  async getApiKeys(projectId: string): Promise<ApiKey[]> {
    return Array.from(this.apiKeys.values())
      .filter((k) => k.projectId === projectId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async createApiKey(projectId: string, name: string): Promise<ApiKey> {
    const id = randomUUID();
    const key = `dk_${randomUUID().replace(/-/g, '')}`;
    const apiKey: ApiKey = {
      id,
      projectId,
      name,
      key,
      status: "active",
      createdAt: new Date(),
    };
    this.apiKeys.set(id, apiKey);
    return apiKey;
  }

  async deleteApiKey(id: string, projectId: string): Promise<boolean> {
    const apiKey = this.apiKeys.get(id);
    if (!apiKey || apiKey.projectId !== projectId) {
      return false;
    }
    return this.apiKeys.delete(id);
  }

  private seedMockData() {
    // This will be called on initialization but won't create any data
    // Data will be created per project when projects are created
  }

  private seedProjectMetrics(projectId: string) {
    const now = new Date();
    const daysToGenerate = 30;

    for (let i = daysToGenerate - 1; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      
      // Generate 24 hourly data points for each day
      for (let hour = 0; hour < 24; hour++) {
        const pointDate = new Date(date);
        pointDate.setHours(hour, 0, 0, 0);

        const baseVolume = 10000 + Math.random() * 15000;
        const baseFees = baseVolume * (0.003 + Math.random() * 0.002);
        const trades = Math.floor(20 + Math.random() * 40);

        const metric: MetricPoint = {
          id: randomUUID(),
          projectId,
          t: pointDate,
          volumeUsd: baseVolume,
          feesUsd: baseFees,
          trades,
        };

        this.metrics.set(metric.id, metric);
      }
    }
  }

  private seedProjectTransactions(projectId: string) {
    const swapPairs = [
      { from: "BTC", to: "ETH", route: "BTC→ETH" },
      { from: "ETH", to: "USDC", route: "ETH→USDC" },
      { from: "USDC", to: "BTC", route: "USDC→BTC" },
      { from: "ETH", to: "BTC", route: "ETH→BTC" },
      { from: "BTC", to: "USDT", route: "BTC→USDT" },
      { from: "SOL", to: "ETH", route: "SOL→ETH" },
      { from: "RUNE", to: "BTC", route: "RUNE→BTC" },
    ];
    const chains = ["THOR", "MAYA", "CHAINFLIP"];
    const statuses = ["Completed", "Running", "Refunded"];
    
    const transactionCount = 8 + Math.floor(Math.random() * 4);

    for (let i = 0; i < transactionCount; i++) {
      const hoursAgo = i * 2 + Math.random() * 2;
      const ts = new Date(Date.now() - hoursAgo * 60 * 60 * 1000);
      
      const pair = swapPairs[Math.floor(Math.random() * swapPairs.length)];
      const chain = chains[Math.floor(Math.random() * chains.length)];
      const status = i === 0 ? "Running" : i === 1 ? "Refunded" : statuses[Math.floor(Math.random() * statuses.length)];
      
      const usdNotional = 1000 + Math.random() * 5000;
      const feeUsd = usdNotional * 0.003;

      // Generate realistic amounts
      const amountIn = (Math.random() * 5 + 0.1).toFixed(4);
      const amountOut = (parseFloat(amountIn) * (0.95 + Math.random() * 0.04)).toFixed(4);

      const transaction: Transaction = {
        id: randomUUID(),
        projectId,
        ts,
        assetFrom: pair.from,
        assetTo: pair.to,
        amountIn: `${amountIn} ${pair.from}`,
        amountOut: `${amountOut} ${pair.to}`,
        route: pair.route,
        usdNotional,
        feeUsd,
        status,
        txHash: `0x${randomUUID().replace(/-/g, '')}`,
        chain,
      };

      this.transactions.set(transaction.id, transaction);
    }
  }
}

export class DbStorage implements IStorage {
  private db;

  constructor() {
    if (!process.env.DATABASE_URL) {
      throw new Error("DATABASE_URL is not set");
    }
    
    const sql = neon(process.env.DATABASE_URL);
    this.db = drizzle(sql);
  }

  async getUser(id: string): Promise<User | undefined> {
    const result = await this.db.select().from(users).where(eq(users.id, id));
    return result[0];
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const result = await this.db.select().from(users).where(eq(users.email, email));
    return result[0];
  }

  async createUser(insertUser: InsertUser, projectId: string): Promise<User> {
    const result = await this.db.insert(users).values({
      name: insertUser.name,
      email: insertUser.email,
      password: insertUser.password,
      role: "PARTNER",
      projectId,
    }).returning();
    return result[0];
  }

  async getProject(id: string): Promise<Project | undefined> {
    const result = await this.db.select().from(projects).where(eq(projects.id, id));
    return result[0];
  }

  async createProject(insertProject: InsertProject): Promise<Project> {
    const result = await this.db.insert(projects).values({
      name: insertProject.name || null,
      logoUrl: insertProject.logoUrl || null,
      dappUrl: insertProject.dappUrl || null,
      btcAddress: insertProject.btcAddress || null,
      thorName: insertProject.thorName || null,
      mayaName: insertProject.mayaName || null,
      chainflipAddress: insertProject.chainflipAddress || null,
      setupCompleted: "false",
    }).returning();

    const project = result[0];

    await this.seedProjectMetrics(project.id);
    await this.seedProjectTransactions(project.id);

    return project;
  }

  async updateProject(id: string, updates: Partial<InsertProject> & { setupCompleted?: string }): Promise<Project | undefined> {
    const result = await this.db.update(projects)
      .set({
        name: updates.name !== undefined ? updates.name || null : undefined,
        logoUrl: updates.logoUrl !== undefined ? updates.logoUrl || null : undefined,
        dappUrl: updates.dappUrl !== undefined ? updates.dappUrl || null : undefined,
        btcAddress: updates.btcAddress !== undefined ? updates.btcAddress || null : undefined,
        thorName: updates.thorName !== undefined ? updates.thorName || null : undefined,
        mayaName: updates.mayaName !== undefined ? updates.mayaName || null : undefined,
        chainflipAddress: updates.chainflipAddress !== undefined ? updates.chainflipAddress || null : undefined,
        setupCompleted: updates.setupCompleted !== undefined ? updates.setupCompleted : undefined,
      })
      .where(eq(projects.id, id))
      .returning();

    return result[0];
  }

  async getMetrics(projectId: string, fromDate?: Date, toDate?: Date): Promise<MetricPoint[]> {
    const conditions = [eq(metricPoints.projectId, projectId)];
    
    if (fromDate) {
      conditions.push(gte(metricPoints.t, fromDate));
    }
    if (toDate) {
      conditions.push(lte(metricPoints.t, toDate));
    }

    const result = await this.db
      .select()
      .from(metricPoints)
      .where(and(...conditions))
      .orderBy(metricPoints.t);
    
    return result;
  }

  async getTransactions(projectId: string, limit = 25): Promise<Transaction[]> {
    const result = await this.db
      .select()
      .from(transactions)
      .where(eq(transactions.projectId, projectId))
      .orderBy(desc(transactions.ts))
      .limit(limit);

    return result;
  }

  async getApiKeys(projectId: string): Promise<ApiKey[]> {
    const result = await this.db
      .select()
      .from(apiKeys)
      .where(eq(apiKeys.projectId, projectId))
      .orderBy(desc(apiKeys.createdAt));

    return result;
  }

  async createApiKey(projectId: string, name: string): Promise<ApiKey> {
    const key = `dk_${randomUUID().replace(/-/g, '')}`;
    const result = await this.db.insert(apiKeys).values({
      projectId,
      name,
      key,
      status: "active",
    }).returning();

    return result[0];
  }

  async deleteApiKey(id: string, projectId: string): Promise<boolean> {
    const result = await this.db
      .delete(apiKeys)
      .where(and(eq(apiKeys.id, id), eq(apiKeys.projectId, projectId)))
      .returning();

    return result.length > 0;
  }

  private async seedProjectMetrics(projectId: string) {
    const now = new Date();
    const daysToGenerate = 30;
    const metricsToInsert: (typeof metricPoints.$inferInsert)[] = [];

    for (let i = daysToGenerate - 1; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      
      for (let hour = 0; hour < 24; hour++) {
        const pointDate = new Date(date);
        pointDate.setHours(hour, 0, 0, 0);

        const baseVolume = 10000 + Math.random() * 15000;
        const baseFees = baseVolume * (0.003 + Math.random() * 0.002);
        const trades = Math.floor(20 + Math.random() * 40);

        metricsToInsert.push({
          projectId,
          t: pointDate,
          volumeUsd: baseVolume,
          feesUsd: baseFees,
          trades,
        });
      }
    }

    await this.db.insert(metricPoints).values(metricsToInsert);
  }

  private async seedProjectTransactions(projectId: string) {
    const swapPairs = [
      { from: "BTC", to: "ETH", route: "BTC→ETH" },
      { from: "ETH", to: "USDC", route: "ETH→USDC" },
      { from: "USDC", to: "BTC", route: "USDC→BTC" },
      { from: "ETH", to: "BTC", route: "ETH→BTC" },
      { from: "BTC", to: "USDT", route: "BTC→USDT" },
      { from: "SOL", to: "ETH", route: "SOL→ETH" },
      { from: "RUNE", to: "BTC", route: "RUNE→BTC" },
    ];
    const chains = ["THOR", "MAYA", "CHAINFLIP"];
    const statuses = ["Completed", "Running", "Refunded"];
    
    const transactionCount = 8 + Math.floor(Math.random() * 4);
    const transactionsToInsert: (typeof transactions.$inferInsert)[] = [];

    for (let i = 0; i < transactionCount; i++) {
      const hoursAgo = i * 2 + Math.random() * 2;
      const ts = new Date(Date.now() - hoursAgo * 60 * 60 * 1000);
      
      const pair = swapPairs[Math.floor(Math.random() * swapPairs.length)];
      const chain = chains[Math.floor(Math.random() * chains.length)];
      const status = i === 0 ? "Running" : i === 1 ? "Refunded" : statuses[Math.floor(Math.random() * statuses.length)];
      
      const usdNotional = 1000 + Math.random() * 5000;
      const feeUsd = usdNotional * 0.003;

      // Generate realistic amounts
      const amountIn = (Math.random() * 5 + 0.1).toFixed(4);
      const amountOut = (parseFloat(amountIn) * (0.95 + Math.random() * 0.04)).toFixed(4);

      transactionsToInsert.push({
        projectId,
        ts,
        assetFrom: pair.from,
        assetTo: pair.to,
        amountIn: `${amountIn} ${pair.from}`,
        amountOut: `${amountOut} ${pair.to}`,
        route: pair.route,
        usdNotional,
        feeUsd,
        status,
        txHash: `0x${randomUUID().replace(/-/g, '')}`,
        chain,
      });
    }

    await this.db.insert(transactions).values(transactionsToInsert);
  }
}

// Using DbStorage for production with Neon database
// export const storage = new MemStorage(); // Use this for local testing without database
export const storage = new DbStorage();
