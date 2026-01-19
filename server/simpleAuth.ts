import session from "express-session";
import connectPg from "connect-pg-simple";
import type { Express, Request, Response, NextFunction } from "express";
import { db } from "./db";
import { users, otpCodes } from "@shared/models/auth";
import { eq, and, gt, desc } from "drizzle-orm";

declare module "express-session" {
  interface SessionData {
    userId?: string;
  }
}

function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function normalizePhone(phone: string): string {
  return phone.replace(/[^0-9+]/g, "");
}

export function setupSimpleAuth(app: Express) {
  if (!process.env.SESSION_SECRET) {
    throw new Error("SESSION_SECRET environment variable is required");
  }

  const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week
  const pgStore = connectPg(session);
  const sessionStore = new pgStore({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: true,
    ttl: sessionTtl,
    tableName: "sessions",
  });

  const isProduction = process.env.NODE_ENV === "production";

  app.use(
    session({
      store: sessionStore,
      secret: process.env.SESSION_SECRET,
      resave: false,
      saveUninitialized: false,
      cookie: {
        httpOnly: true,
        secure: isProduction,
        maxAge: sessionTtl,
      },
    })
  );

  // Request OTP - sends code to phone number
  app.post("/api/auth/request-otp", async (req: Request, res: Response) => {
    try {
      const { phone } = req.body;

      if (!phone) {
        return res.status(400).json({ message: "Phone number is required" });
      }

      const normalizedPhone = normalizePhone(phone);
      if (normalizedPhone.length < 9) {
        return res.status(400).json({ message: "Invalid phone number" });
      }

      const code = generateOTP();
      const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

      // Store OTP in database
      await db.insert(otpCodes).values({
        phone: normalizedPhone,
        code,
        expiresAt,
        verified: false,
      });

      // In development, log the OTP. In production, this would integrate with SMS provider
      console.log(`[DEV] OTP for ${normalizedPhone}: ${code}`);

      // Return success (in dev mode, also return the code for testing)
      if (!isProduction) {
        res.json({ 
          message: "OTP sent successfully", 
          phone: normalizedPhone,
          devCode: code // Only in development
        });
      } else {
        res.json({ message: "OTP sent successfully", phone: normalizedPhone });
      }
    } catch (error) {
      console.error("Request OTP error:", error);
      res.status(500).json({ message: "Failed to send OTP" });
    }
  });

  // Verify OTP and login/register
  app.post("/api/auth/verify-otp", async (req: Request, res: Response) => {
    try {
      const { phone, code, firstName, lastName } = req.body;

      if (!phone || !code) {
        return res.status(400).json({ message: "Phone and code are required" });
      }

      const normalizedPhone = normalizePhone(phone);

      // Find valid OTP
      const [validOtp] = await db
        .select()
        .from(otpCodes)
        .where(
          and(
            eq(otpCodes.phone, normalizedPhone),
            eq(otpCodes.code, code),
            eq(otpCodes.verified, false),
            gt(otpCodes.expiresAt, new Date())
          )
        )
        .orderBy(desc(otpCodes.createdAt))
        .limit(1);

      if (!validOtp) {
        return res.status(401).json({ message: "Invalid or expired OTP" });
      }

      // Mark OTP as verified
      await db
        .update(otpCodes)
        .set({ verified: true })
        .where(eq(otpCodes.id, validOtp.id));

      // Find or create user
      let [user] = await db
        .select()
        .from(users)
        .where(eq(users.phone, normalizedPhone));

      if (!user) {
        // Create new user
        [user] = await db
          .insert(users)
          .values({
            phone: normalizedPhone,
            firstName: firstName || null,
            lastName: lastName || null,
            credits: 0,
            isAdmin: false,
          })
          .returning();
      } else if (firstName || lastName) {
        // Update user name if provided and user exists
        [user] = await db
          .update(users)
          .set({
            firstName: firstName || user.firstName,
            lastName: lastName || user.lastName,
            updatedAt: new Date(),
          })
          .where(eq(users.id, user.id))
          .returning();
      }

      // Set session
      req.session.userId = user.id;

      res.json({
        id: user.id,
        phone: user.phone,
        firstName: user.firstName,
        lastName: user.lastName,
        credits: user.credits,
        isAdmin: user.isAdmin,
        isNewUser: !user.createdAt || (Date.now() - new Date(user.createdAt).getTime() < 5000),
      });
    } catch (error) {
      console.error("Verify OTP error:", error);
      res.status(500).json({ message: "Failed to verify OTP" });
    }
  });

  // Logout route
  app.post("/api/auth/logout", (req: Request, res: Response) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: "Logout failed" });
      }
      res.clearCookie("connect.sid");
      res.json({ message: "Logged out successfully" });
    });
  });

  // Get current user
  app.get("/api/auth/user", async (req: Request, res: Response) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const [user] = await db.select().from(users).where(eq(users.id, req.session.userId));
      if (!user) {
        return res.status(401).json({ message: "User not found" });
      }

      res.json({
        id: user.id,
        phone: user.phone,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        credits: user.credits,
        isAdmin: user.isAdmin,
        profileImageUrl: user.profileImageUrl,
      });
    } catch (error) {
      console.error("Get user error:", error);
      res.status(500).json({ message: "Failed to get user" });
    }
  });
}

// Middleware to check if user is authenticated
export function isAuthenticated(req: Request, res: Response, next: NextFunction) {
  if (!req.session.userId) {
    return res.status(401).json({ message: "Authentication required" });
  }
  next();
}

// Helper to get current user ID from session
export function getCurrentUserId(req: Request): string | undefined {
  return req.session.userId;
}
