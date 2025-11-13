import type { Express, Request, Response } from "express";
import session from "express-session";
import bcrypt from "bcryptjs";
import { storage } from "./storage.js";
import { insertUserSchema, insertProjectSchema } from "../shared/schema.js";
import { z } from "zod";

declare module "express-session" {
  interface SessionData {
    userId?: string;
  }
}

const authMiddleware = (req: Request, res: Response, next: Function) => {
  if (!req.session.userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  next();
};

export async function registerRoutes(app: Express): Promise<Express> {
  app.use(
    session({
      secret: process.env.SESSION_SECRET || "dkit-partners-secret-key-change-in-production",
      resave: false,
      saveUninitialized: false,
      cookie: {
        secure: process.env.NODE_ENV === "production",
        httpOnly: true,
        sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
        maxAge: 1000 * 60 * 60 * 24 * 7, // 1 week
      },
    })
  );

  // Auth endpoints
  app.post("/api/auth/register", async (req: Request, res: Response) => {
    try {
      console.log("[REGISTER] Request body:", JSON.stringify(req.body, null, 2));

      const { name, email, password, confirmPassword } = req.body;

      const registerSchema = z.object({
        name: z.string().min(1, "Name is required"),
        email: z.string().email("Invalid email address"),
        password: z.string().min(6, "Password must be at least 6 characters"),
        confirmPassword: z.string(),
      }).refine((data) => data.password === data.confirmPassword, {
        message: "Passwords don't match",
        path: ["confirmPassword"],
      });

      const userData = registerSchema.parse({ name, email, password, confirmPassword });
      console.log("[REGISTER] User data validated:", { name: userData.name, email: userData.email });

      const existingUser = await storage.getUserByEmail(userData.email);
      if (existingUser) {
        return res.status(400).json({ message: "User already exists" });
      }

      // Create an empty project
      const newProject = await storage.createProject({});

      const hashedPassword = await bcrypt.hash(userData.password, 10);
      const user = await storage.createUser({
        name: userData.name,
        email: userData.email,
        password: hashedPassword
      }, newProject.id);

      req.session.userId = user.id;

      res.status(201).json({
        user: { ...user, password: undefined },
        project: newProject,
      });
    } catch (error: any) {
      console.log("[REGISTER] Error:", error);
      if (error instanceof z.ZodError) {
        console.log("[REGISTER] Validation errors:", JSON.stringify(error.errors, null, 2));
        return res.status(400).json({ message: error.errors[0].message });
      }
      res.status(500).json({ message: error.message || "Registration failed" });
    }
  });

  app.post("/api/auth/login", async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body;

      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      req.session.userId = user.id;

      const project = user.projectId ? await storage.getProject(user.projectId) : null;

      res.json({ 
        user: { ...user, password: undefined },
        project,
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Login failed" });
    }
  });

  app.post("/api/auth/logout", (req: Request, res: Response) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: "Logout failed" });
      }
      res.json({ message: "Logged out successfully" });
    });
  });

  // Protected endpoints
  app.get("/api/me", authMiddleware, async (req: Request, res: Response) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const project = user.projectId ? await storage.getProject(user.projectId) : null;

      res.json({
        user: { ...user, password: undefined },
        project: project || {
          id: "",
          name: null,
          logoUrl: null,
          dappUrl: null,
          btcAddress: null,
          thorName: null,
          mayaName: null,
          chainflipAddress: null,
          setupCompleted: "false",
        },
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Failed to fetch user data" });
    }
  });

  app.patch("/api/project", authMiddleware, async (req: Request, res: Response) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (!user || !user.projectId) {
        return res.status(404).json({ message: "Project not found" });
      }

      const updateSchema = insertProjectSchema.partial().extend({
        setupCompleted: z.string().optional(),
      });

      const updates = updateSchema.parse(req.body);

      const project = await storage.updateProject(user.projectId, updates);

      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }

      res.json(project);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      res.status(500).json({ message: error.message || "Failed to update project" });
    }
  });

  app.get("/api/metrics", authMiddleware, async (req: Request, res: Response) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (!user || !user.projectId) {
        return res.status(404).json({ message: "Project not found" });
      }

      const { from, to } = req.query;
      const fromDate = from ? new Date(from as string) : undefined;
      const toDate = to ? new Date(to as string) : undefined;

      const metrics = await storage.getMetrics(user.projectId, fromDate, toDate);

      const series = metrics.map((m) => ({
        t: m.t.toISOString(),
        volumeUsd: Math.round(m.volumeUsd * 100) / 100,
        feesUsd: Math.round(m.feesUsd * 100) / 100,
        trades: m.trades,
      }));

      const totalVolume = metrics.reduce((sum, m) => sum + m.volumeUsd, 0);
      const totalFees = metrics.reduce((sum, m) => sum + m.feesUsd, 0);
      const totalTrades = metrics.reduce((sum, m) => sum + m.trades, 0);

      const btcPrice = 80000;
      const btcEquivalent = totalFees / btcPrice;

      const last24h = metrics.filter((m) => {
        const time = new Date(m.t).getTime();
        const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
        return time >= oneDayAgo;
      });

      const prev24h = metrics.filter((m) => {
        const time = new Date(m.t).getTime();
        const twoDaysAgo = Date.now() - 48 * 60 * 60 * 1000;
        const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
        return time >= twoDaysAgo && time < oneDayAgo;
      });

      const last24hFees = last24h.reduce((sum, m) => sum + m.feesUsd, 0);
      const prev24hFees = prev24h.reduce((sum, m) => sum + m.feesUsd, 0);
      const change24h = prev24hFees > 0 ? (last24hFees - prev24hFees) / prev24hFees : 0;

      res.json({
        series,
        totals: {
          volumeUsd: Math.round(totalVolume * 100) / 100,
          feesUsd: Math.round(totalFees * 100) / 100,
          trades: totalTrades,
          change24h: Math.round(change24h * 10000) / 10000,
          btcEquivalent: Math.round(btcEquivalent * 10000) / 10000,
        },
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Failed to fetch metrics" });
    }
  });

  app.get("/api/transactions", authMiddleware, async (req: Request, res: Response) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (!user || !user.projectId) {
        return res.status(404).json({ message: "Project not found" });
      }

      const limit = req.query.limit ? parseInt(req.query.limit as string) : 25;
      const transactions = await storage.getTransactions(user.projectId, limit);

      const formatted = transactions.map((t) => ({
        ...t,
        ts: t.ts.toISOString(),
        usdNotional: Math.round(t.usdNotional * 100) / 100,
        feeUsd: Math.round(t.feeUsd * 100) / 100,
      }));

      res.json(formatted);
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Failed to fetch transactions" });
    }
  });

  // API Keys endpoints
  app.get("/api/keys", authMiddleware, async (req: Request, res: Response) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (!user || !user.projectId) {
        return res.status(404).json({ message: "Project not found" });
      }

      const keys = await storage.getApiKeys(user.projectId);

      const formatted = keys.map((k) => ({
        ...k,
        createdAt: k.createdAt.toISOString(),
      }));

      res.json(formatted);
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Failed to fetch API keys" });
    }
  });

  app.post("/api/keys", authMiddleware, async (req: Request, res: Response) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (!user || !user.projectId) {
        return res.status(404).json({ message: "Project not found" });
      }

      const { name } = req.body;
      if (!name || name.trim() === "") {
        return res.status(400).json({ message: "API key name is required" });
      }

      const apiKey = await storage.createApiKey(user.projectId, name);

      res.status(201).json({
        ...apiKey,
        createdAt: apiKey.createdAt.toISOString(),
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Failed to create API key" });
    }
  });

  app.delete("/api/keys/:id", authMiddleware, async (req: Request, res: Response) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (!user || !user.projectId) {
        return res.status(404).json({ message: "Project not found" });
      }

      const { id } = req.params;
      const success = await storage.deleteApiKey(id, user.projectId);

      if (!success) {
        return res.status(404).json({ message: "API key not found" });
      }

      res.json({ message: "API key deleted successfully" });
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Failed to delete API key" });
    }
  });

  return app;
}
