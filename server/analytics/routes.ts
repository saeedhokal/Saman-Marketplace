import type { Express, Request, Response, NextFunction } from "express";
import rateLimit from "express-rate-limit";
import { eq } from "drizzle-orm";
import { analyticsActivitySchema, analyticsEventSchema } from "../../shared/analytics";
import { users } from "../../shared/schema";
import { db } from "../db";
import { getVerifiedUserId } from "../simpleAuth";
import { AnalyticsInputError, analyticsStore } from "./store";
import { registerReportingRoutes } from "./reporting/routes";

export async function verifiedAdmin(req: Request, res: Response, next: NextFunction) {
  try {
    const id = getVerifiedUserId(req);
    if (!id) return res.status(401).json({ message: "Authentication required" });
    const [user] = await db.select({ admin: users.isAdmin }).from(users).where(eq(users.id, id));
    if (!user?.admin) return res.status(403).json({ message: "Admin access required" });
    next();
  } catch { res.status(503).json({ message: "Unable to verify admin access" }); }
}

export function registerAnalyticsRoutes(app: Express) {
  registerReportingRoutes(app, verifiedAdmin);
  const limiter = rateLimit({ windowMs: 60000, max: 120, standardHeaders: true, legacyHeaders: false });
  app.use("/api/analytics", limiter);
  for (const kind of ["events", "activity"] as const) {
    app.post(`/api/analytics/${kind}`, async (req, res) => {
      res.set("Cache-Control", "no-store");
      if (JSON.stringify(req.body ?? {}).length > 4096)
        return res.status(413).json({ message: "Analytics payload too large" });
      const parsed = (kind === "events" ? analyticsEventSchema : analyticsActivitySchema).safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ message: "Invalid analytics payload" });
      try {
        const result = await analyticsStore.collect(parsed.data, getVerifiedUserId(req),
          kind === "events" ? analyticsEventSchema.parse(parsed.data) : undefined);
        res.json({ ok: true, ...result });
      } catch (error) {
        if (error instanceof AnalyticsInputError) return res.status(400).json({ message: error.message });
        console.error("[analytics] Collection failed", error instanceof Error ? error.name : "unknown");
        res.status(503).json({ message: "Analytics temporarily unavailable" });
      }
    });
  }
  app.get("/api/admin/analytics/verification", verifiedAdmin, async (_req, res) => {
    res.set("Cache-Control", "no-store");
    try { res.json(await analyticsStore.summary()); }
    catch { res.status(503).json({ message: "Analytics verification temporarily unavailable" }); }
  });
}
