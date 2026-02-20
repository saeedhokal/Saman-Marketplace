import session from "express-session";
import connectPg from "connect-pg-simple";
import type { Express, Request, Response, NextFunction } from "express";
import { db } from "./db";
import { users, otpCodes } from "@shared/models/auth";
import { eq, and, gt, desc, sql } from "drizzle-orm";
import bcrypt from "bcryptjs";
import nodemailer from "nodemailer";
import crypto from "crypto";
import admin from "firebase-admin";

declare module "express-session" {
  interface SessionData {
    userId?: string;
  }
}

function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function normalizePhone(phone: string): string {
  // Remove all non-numeric characters except +
  let cleaned = phone.replace(/[^0-9+]/g, "");
  
  // UAE phone number normalization
  // Convert local format (0507242111) to international format (971507242111)
  // Convert +971507242111 to 971507242111 (remove + for consistent storage)
  
  // Remove leading + if present
  if (cleaned.startsWith("+")) {
    cleaned = cleaned.slice(1);
  }
  
  // If starts with 0 (UAE local format), replace with 971
  if (cleaned.startsWith("0") && cleaned.length >= 9 && cleaned.length <= 10) {
    cleaned = "971" + cleaned.slice(1);
  }
  
  return cleaned;
}

// Simple in-memory rate limiter for OTP endpoints
const otpAttempts = new Map<string, { count: number; lastAttempt: number }>();
const OTP_MAX_ATTEMPTS = 5;
const OTP_LOCKOUT_MINUTES = 15;

function checkRateLimit(key: string): { allowed: boolean; minutesLeft?: number } {
  const now = Date.now();
  const record = otpAttempts.get(key);
  
  if (!record) {
    return { allowed: true };
  }
  
  const lockoutMs = OTP_LOCKOUT_MINUTES * 60 * 1000;
  const timeSinceFirst = now - record.lastAttempt;
  
  // Reset if lockout period has passed
  if (timeSinceFirst > lockoutMs) {
    otpAttempts.delete(key);
    return { allowed: true };
  }
  
  if (record.count >= OTP_MAX_ATTEMPTS) {
    const minutesLeft = Math.ceil((lockoutMs - timeSinceFirst) / 60000);
    return { allowed: false, minutesLeft };
  }
  
  return { allowed: true };
}

function recordAttempt(key: string, success: boolean): void {
  if (success) {
    otpAttempts.delete(key);
    return;
  }
  
  const now = Date.now();
  const record = otpAttempts.get(key);
  
  if (record) {
    record.count++;
    record.lastAttempt = now;
  } else {
    otpAttempts.set(key, { count: 1, lastAttempt: now });
  }
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

  // Trust proxy in production (required for secure cookies behind reverse proxy)
  if (isProduction) {
    app.set("trust proxy", 1);
  }

  app.use(
    session({
      store: sessionStore,
      secret: process.env.SESSION_SECRET,
      resave: false,
      saveUninitialized: false,
      cookie: {
        httpOnly: true,
        secure: isProduction,
        // Use "none" for iOS Capacitor compatibility (allows cross-origin cookie sending)
        // This requires secure: true in production
        sameSite: isProduction ? "none" : "lax",
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
      
      // Rate limiting check
      const rateLimitKey = `verify:${normalizedPhone}`;
      const rateCheck = checkRateLimit(rateLimitKey);
      if (!rateCheck.allowed) {
        return res.status(429).json({ 
          message: `Too many attempts. Please try again in ${rateCheck.minutesLeft} minutes.` 
        });
      }

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
        recordAttempt(rateLimitKey, false);
        return res.status(401).json({ message: "Invalid or expired OTP" });
      }
      
      // Success - clear rate limit
      recordAttempt(rateLimitKey, true);

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
        // Generate default profile image using name or phone as seed
        const seed = firstName || normalizedPhone;
        const defaultProfileImage = `https://api.dicebear.com/7.x/initials/png?seed=${encodeURIComponent(seed)}&backgroundColor=f97316`;
        
        // Create new user
        [user] = await db
          .insert(users)
          .values({
            phone: normalizedPhone,
            firstName: firstName || null,
            lastName: lastName || null,
            credits: 0,
            isAdmin: false,
            profileImageUrl: defaultProfileImage,
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

  // Login with phone + password
  app.post("/api/auth/login", async (req: Request, res: Response) => {
    try {
      const { phone, password } = req.body;

      if (!phone || !password) {
        return res.status(400).json({ message: "Phone and password are required" });
      }

      const normalizedPhone = normalizePhone(phone);

      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.phone, normalizedPhone));

      if (!user) {
        return res.status(401).json({ message: "User not found" });
      }

      if (!user.password) {
        return res.status(401).json({ message: "Please register first" });
      }

      const validPassword = await bcrypt.compare(password, user.password);
      if (!validPassword) {
        return res.status(401).json({ message: "Invalid password" });
      }

      req.session.userId = user.id;

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
      console.error("Login error:", error);
      res.status(500).json({ message: "Login failed" });
    }
  });

  // Forgot password - rate limiting (max 3 requests per phone per hour)
  const forgotPasswordAttempts = new Map<string, { count: number; resetTime: number }>();
  const FORGOT_PW_MAX_ATTEMPTS = 3;
  const FORGOT_PW_WINDOW = 60 * 60 * 1000; // 1 hour

  const passwordResetTokens = new Map<string, { userId: string; expires: number }>();

  function generateResetToken(userId: string): string {
    const token = crypto.randomBytes(32).toString('hex');
    passwordResetTokens.set(token, { userId, expires: Date.now() + 30 * 60 * 1000 });
    return token;
  }

  function getBaseUrl(req: Request): string {
    const proto = req.headers['x-forwarded-proto'] || req.protocol || 'https';
    const host = req.headers['x-forwarded-host'] || req.headers.host || 'thesamanapp.com';
    return `${proto}://${host}`;
  }

  function createEmailTransporter() {
    return nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: "Samanapp.help@gmail.com",
        pass: process.env.SAMAN_EMAIL_PASSWORD,
      },
      connectionTimeout: 15000,
      greetingTimeout: 15000,
      socketTimeout: 20000,
    });
  }

  async function sendEmailWithRetry(mailOptions: any, retries = 2): Promise<void> {
    for (let attempt = 1; attempt <= retries; attempt++) {
      const transporter = createEmailTransporter();
      try {
        await transporter.sendMail(mailOptions);
        transporter.close();
        return;
      } catch (err: any) {
        transporter.close();
        console.error(`Email attempt ${attempt}/${retries} failed:`, err?.message || err);
        if (attempt === retries) throw err;
        await new Promise(r => setTimeout(r, 2000));
      }
    }
  }

  app.post("/api/auth/forgot-password", async (req: Request, res: Response) => {
    try {
      const { phone } = req.body;

      if (!phone) {
        return res.status(400).json({ message: "Phone number is required" });
      }

      const normalizedPhone = normalizePhone(phone);

      const now = Date.now();
      const attempts = forgotPasswordAttempts.get(normalizedPhone);
      if (attempts && now < attempts.resetTime) {
        if (attempts.count >= FORGOT_PW_MAX_ATTEMPTS) {
          return res.status(429).json({ message: "Too many reset attempts. Please try again later." });
        }
        attempts.count++;
      } else {
        forgotPasswordAttempts.set(normalizedPhone, { count: 1, resetTime: now + FORGOT_PW_WINDOW });
      }

      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.phone, normalizedPhone));

      if (!user) {
        return res.json({ message: "If an account with a recovery email exists for this number, a reset link has been sent." });
      }

      if (!user.email) {
        return res.status(400).json({ message: "No recovery email is set on this account. Please contact SamanHelp@outlook.com for assistance." });
      }

      const resetToken = generateResetToken(user.id);
      const baseUrl = getBaseUrl(req);
      const resetLink = `${baseUrl}/reset-password?token=${resetToken}`;

      await sendEmailWithRetry({
        from: '"Saman Marketplace" <Samanapp.help@gmail.com>',
        to: user.email,
        subject: "Saman Marketplace - Reset Your Password",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px;">
            <div style="text-align: center; margin-bottom: 20px;">
              <h1 style="color: #f97316; margin: 0;">Saman Marketplace</h1>
              <p style="color: #888; margin: 5px 0 0;">UAE Spare Parts and Cars Marketplace</p>
            </div>
            <h2 style="color: #333;">Reset Your Password</h2>
            <p>Hello ${user.firstName || ''},</p>
            <p>We received a request to reset your password. Click the button below to set a new password:</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetLink}" style="background-color: #f97316; color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-size: 16px; font-weight: bold; display: inline-block;">Reset Password</a>
            </div>
            <p style="color: #666; font-size: 14px;">This link will expire in <strong>30 minutes</strong>.</p>
            <p style="color: #666; font-size: 14px;">If the button doesn't work, copy and paste this link into your browser:</p>
            <p style="color: #f97316; font-size: 12px; word-break: break-all;">${resetLink}</p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
            <p style="color: #888; font-size: 12px;">If you did not request this, you can safely ignore this email. Your password will not be changed.</p>
          </div>
        `,
      });

      const maskedEmail = user.email.replace(/(.{2})(.*)(@.*)/, "$1***$3");
      res.json({ message: `A password reset link has been sent to ${maskedEmail}` });
    } catch (error: any) {
      console.error("Forgot password error:", error?.code, error?.message || error);
      res.status(500).json({ message: "Failed to send reset email. Please try again later." });
    }
  });

  app.get("/api/auth/reset-password/verify", (req: Request, res: Response) => {
    const { token } = req.query;
    if (!token || typeof token !== 'string') {
      return res.status(400).json({ valid: false, message: "Invalid reset link" });
    }
    const data = passwordResetTokens.get(token);
    if (!data || Date.now() > data.expires) {
      if (data) passwordResetTokens.delete(token);
      return res.status(400).json({ valid: false, message: "This reset link has expired. Please request a new one." });
    }
    res.json({ valid: true });
  });

  app.post("/api/auth/reset-password", async (req: Request, res: Response) => {
    try {
      const { token, newPassword } = req.body;

      if (!token || !newPassword) {
        return res.status(400).json({ message: "Token and new password are required" });
      }

      if (newPassword.length < 4) {
        return res.status(400).json({ message: "Password must be at least 4 characters" });
      }

      const data = passwordResetTokens.get(token);
      if (!data || Date.now() > data.expires) {
        if (data) passwordResetTokens.delete(token);
        return res.status(400).json({ message: "This reset link has expired. Please request a new one." });
      }

      const hashedPassword = await bcrypt.hash(newPassword, 10);
      await db
        .update(users)
        .set({ password: hashedPassword, updatedAt: new Date() })
        .where(eq(users.id, data.userId));

      passwordResetTokens.delete(token);

      res.json({ message: "Your password has been reset successfully. You can now log in with your new password." });
    } catch (error) {
      console.error("Reset password error:", error);
      res.status(500).json({ message: "Failed to reset password. Please try again." });
    }
  });

  // Register with phone + password (requires Firebase phone verification token)
  app.post("/api/auth/register", async (req: Request, res: Response) => {
    try {
      const { firebaseIdToken, password, firstName, lastName, email } = req.body;

      if (!firebaseIdToken || !password || !firstName || !lastName) {
        return res.status(400).json({ message: "Phone verification, password, first name, and last name are required" });
      }

      if (!admin.apps.length) {
        console.error("Firebase Admin SDK not initialized - cannot verify phone token");
        return res.status(500).json({ message: "Phone verification service unavailable. Please try again later." });
      }

      let normalizedPhone: string;
      try {
        const decodedToken = await admin.auth().verifyIdToken(firebaseIdToken);
        const phoneNumber = decodedToken.phone_number;
        if (!phoneNumber) {
          return res.status(400).json({ message: "No phone number found in verification token" });
        }
        normalizedPhone = normalizePhone(phoneNumber);
      } catch (tokenError: any) {
        console.error("Firebase token verification error:", tokenError);
        return res.status(401).json({ message: "Phone verification failed. Please try again." });
      }

      // Check if user already exists
      const [existingUser] = await db
        .select()
        .from(users)
        .where(eq(users.phone, normalizedPhone));

      if (existingUser) {
        return res.status(400).json({ message: "Phone number already registered" });
      }

      // Hash password (no complexity requirements)
      const hashedPassword = await bcrypt.hash(password, 10);

      // Generate default profile image using name as seed
      const defaultProfileImage = `https://api.dicebear.com/7.x/initials/png?seed=${encodeURIComponent(firstName + ' ' + lastName)}&backgroundColor=f97316`;

      // Create new user
      const [user] = await db
        .insert(users)
        .values({
          phone: normalizedPhone,
          password: hashedPassword,
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          email: email?.trim() || null,
          credits: 0,
          isAdmin: false,
          profileImageUrl: defaultProfileImage,
        })
        .returning();

      req.session.userId = user.id;

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
      console.error("Register error:", error);
      res.status(500).json({ message: "Registration failed" });
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
// Supports both session cookies and X-User-ID header (for iOS Capacitor fallback)
export function isAuthenticated(req: Request, res: Response, next: NextFunction) {
  const userId = req.session.userId || req.headers['x-user-id'] as string;
  if (!userId) {
    return res.status(401).json({ message: "Authentication required" });
  }
  // Store in session for consistency
  if (!req.session.userId && userId) {
    req.session.userId = userId;
  }
  next();
}

// Helper to get current user ID from session or header
export function getCurrentUserId(req: Request): string | undefined {
  return req.session.userId || req.headers['x-user-id'] as string;
}
