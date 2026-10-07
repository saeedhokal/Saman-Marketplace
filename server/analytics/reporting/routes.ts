import type { Express, RequestHandler } from "express";
import rateLimit from "express-rate-limit";
import { reportQuerySchema, resolveReportContext, ReportingInputError, screenQuerySchema } from "./range";
import { reportingService } from "./service";

export function registerReportingRoutes(app: Express, verifiedAdmin: RequestHandler) {
  const limiter = rateLimit({ windowMs: 60000, max: 40, standardHeaders: true, legacyHeaders: false,
    message: { message: "Too many analytics refreshes. Please try again in a minute." } });
  const handler = (screen: boolean): RequestHandler => async (req, res) => {
    res.set("Cache-Control", "private, no-store");
    try {
      const schema = screen ? screenQuerySchema : reportQuerySchema;
      const parsed = schema.safeParse(req.query);
      if (!parsed.success) throw new ReportingInputError("Invalid report parameters: " + parsed.error.issues.map(i => i.message).join("; "));
      const { screen: selected, ...query } = parsed.data as typeof parsed.data & { screen?: string };
      const context = resolveReportContext(query);
      res.json(screen ? await reportingService.screenReport(context, selected!) : await reportingService.report(context));
    } catch (error) {
      if (error instanceof ReportingInputError) return res.status(400).json({ message: error.message });
      console.error("[analytics-reporting] Query failed", error instanceof Error ? error.message : "unknown");
      res.status(503).json({ message: "Reporting is temporarily unavailable. Try a shorter range or refresh again." });
    }
  };
  app.get("/api/admin/analytics/report", verifiedAdmin, limiter, handler(false));
  app.get("/api/admin/analytics/screens/timeseries", verifiedAdmin, limiter, handler(true));
}
