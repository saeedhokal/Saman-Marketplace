import { sql } from "drizzle-orm";
import { index, jsonb, pgTable, timestamp, varchar, integer, boolean, text } from "drizzle-orm/pg-core";

// Session storage table.
// (IMPORTANT) This table is mandatory for Replit Auth, don't drop it.
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)]
);

// User storage table.
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  phone: varchar("phone"),
  password: varchar("password"), // Simple hashed password, no complexity requirements
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  displayName: varchar("display_name"), // Shop name, dealer name, or personal brand
  profileImageUrl: varchar("profile_image_url"),
  credits: integer("credits").default(0).notNull(), // Legacy - kept for compatibility
  sparePartsCredits: integer("spare_parts_credits").default(0).notNull(),
  automotiveCredits: integer("automotive_credits").default(0).notNull(),
  isAdmin: boolean("is_admin").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// App settings table for banner, intro video, etc.
export const appSettings = pgTable("app_settings", {
  id: varchar("id").primaryKey().default("main"),
  bannerImageUrl: text("banner_image_url"),
  introVideoUrl: text("intro_video_url"),
  bannerTitle: text("banner_title"),
  bannerSubtitle: text("banner_subtitle"),
  subscriptionEnabled: boolean("subscription_enabled").default(false).notNull(), // Toggle for credit requirement
  updatedAt: timestamp("updated_at").defaultNow(),
});

// OTP codes table for phone authentication
export const otpCodes = pgTable("otp_codes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  phone: varchar("phone").notNull(),
  code: varchar("code").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  verified: boolean("verified").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
export type OtpCode = typeof otpCodes.$inferSelect;
