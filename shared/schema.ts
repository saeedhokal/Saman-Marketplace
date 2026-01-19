import { pgTable, text, serial, integer, boolean, timestamp, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { users, appSettings } from "./models/auth";
export * from "./models/auth";

// Main categories
export const MAIN_CATEGORIES = ["Spare Parts", "Automotive"] as const;
export type MainCategory = typeof MAIN_CATEGORIES[number];

// Sub-categories for Spare Parts (car brands - no Chinese + universal parts)
export const SPARE_PARTS_SUBCATEGORIES = [
  // Car brands (no Chinese)
  "Toyota", "Honda", "Nissan", "Ford", "Chevrolet", "BMW", "Mercedes", "Audi",
  "Volkswagen", "Hyundai", "Kia", "Mazda", "Mitsubishi", "Lexus", "Infiniti",
  "Land Rover", "Jeep", "Dodge", "GMC", "Porsche", "Ferrari", "Lamborghini",
  // Universal categories
  "Rims", "Tires", "Turbos & Superchargers", "Lights", "Other"
] as const;

// Sub-categories for Automotive (vehicles for sale - includes Chinese brands)
export const AUTOMOTIVE_SUBCATEGORIES = [
  // Japanese brands
  "Toyota", "Honda", "Nissan", "Mazda", "Mitsubishi", "Lexus", "Infiniti", "Subaru",
  // American brands
  "Ford", "Chevrolet", "Dodge", "Jeep", "GMC", "Cadillac",
  // German brands
  "BMW", "Mercedes", "Audi", "Volkswagen", "Porsche",
  // Korean brands
  "Hyundai", "Kia", "Genesis",
  // British brands
  "Land Rover", "Jaguar", "Bentley", "Rolls Royce",
  // Italian brands
  "Ferrari", "Lamborghini", "Maserati", "Alfa Romeo",
  // Chinese brands
  "BYD", "Chery", "Geely", "Great Wall", "MG", "NIO", "XPeng", "Li Auto", "Haval",
  // Other
  "Motorcycles", "Other"
] as const;

// Listing status for moderation
export const LISTING_STATUS = ["pending", "approved", "rejected"] as const;
export type ListingStatus = typeof LISTING_STATUS[number];

export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  price: integer("price"), // in cents - optional now
  imageUrl: text("image_url").notNull(),
  mainCategory: text("main_category").notNull(), // "Spare Parts" or "Automotive"
  subCategory: text("sub_category").notNull(), // Toyota, Honda, Turbos, Motorcycles, etc.
  condition: text("condition"), // New, Used, Refurbished - optional
  sellerId: varchar("seller_id").notNull().references(() => users.id),
  location: text("location"),
  phoneNumber: text("phone_number"),
  whatsappNumber: text("whatsapp_number"),
  // Automotive-specific fields
  mileage: integer("mileage"), // in kilometers
  year: integer("year"), // manufacture year
  status: text("status").default("pending").notNull(), // pending, approved, rejected
  rejectionReason: text("rejection_reason"),
  expiresAt: timestamp("expires_at"), // Set to 1 month after approval
  createdAt: timestamp("created_at").defaultNow(),
});

// Favorites table for saved items
export const favorites = pgTable("favorites", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  productId: integer("product_id").notNull().references(() => products.id),
  createdAt: timestamp("created_at").defaultNow(),
});

// Banners for homepage carousel (admin-controlled)
export const banners = pgTable("banners", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  subtitle: text("subtitle"),
  imageUrl: text("image_url").notNull(),
  linkUrl: text("link_url"), // Optional link when clicked
  buttonText: text("button_text"), // e.g. "View Offers"
  isActive: boolean("is_active").default(true).notNull(),
  sortOrder: integer("sort_order").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Track user views for "For You" recommendations
export const userViews = pgTable("user_views", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id), // Can be null for anonymous
  sessionId: text("session_id"), // For anonymous users
  productId: integer("product_id").notNull().references(() => products.id),
  mainCategory: text("main_category"),
  subCategory: text("sub_category"),
  viewedAt: timestamp("viewed_at").defaultNow(),
});

export const insertProductSchema = createInsertSchema(products).omit({
  id: true,
  createdAt: true,
  sellerId: true, // Derived from auth
  status: true, // Set by system
  rejectionReason: true, // Set by admin
  expiresAt: true, // Set when approved
}).extend({
  mileage: z.number().optional(),
  year: z.number().optional(),
});

export const insertFavoriteSchema = createInsertSchema(favorites).omit({
  id: true,
  createdAt: true,
  userId: true, // Derived from auth
});

export const insertBannerSchema = createInsertSchema(banners).omit({
  id: true,
  createdAt: true,
});

export const insertUserViewSchema = createInsertSchema(userViews).omit({
  id: true,
  viewedAt: true,
});

export type Product = typeof products.$inferSelect;
export type InsertProduct = z.infer<typeof insertProductSchema>;
export type Favorite = typeof favorites.$inferSelect;
export type InsertFavorite = z.infer<typeof insertFavoriteSchema>;
export type Banner = typeof banners.$inferSelect;
export type InsertBanner = z.infer<typeof insertBannerSchema>;
export type UserView = typeof userViews.$inferSelect;
export type InsertUserView = z.infer<typeof insertUserViewSchema>;
export type AppSettings = typeof appSettings.$inferSelect;
export type { OtpCode } from "./models/auth";
export { otpCodes } from "./models/auth";
