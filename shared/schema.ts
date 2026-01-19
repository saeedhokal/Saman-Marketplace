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

// Car models by brand (for Automotive filtering)
export const CAR_MODELS: Record<string, string[]> = {
  "Toyota": ["Camry", "Corolla", "Land Cruiser", "Prado", "RAV4", "Hilux", "Yaris", "Supra", "Fortuner", "Avalon"],
  "Honda": ["Civic", "Accord", "CR-V", "HR-V", "Pilot", "Odyssey", "City", "Jazz"],
  "Nissan": ["Altima", "Maxima", "Patrol", "X-Trail", "Sentra", "370Z", "GT-R", "Pathfinder", "Kicks"],
  "Mazda": ["3", "6", "CX-3", "CX-5", "CX-9", "MX-5", "CX-30"],
  "Mitsubishi": ["Pajero", "Outlander", "Lancer", "Eclipse Cross", "ASX", "Montero"],
  "Lexus": ["ES", "GS", "IS", "LS", "LX", "RX", "NX", "GX", "LC", "RC"],
  "Infiniti": ["Q50", "Q60", "Q70", "QX50", "QX60", "QX80"],
  "Subaru": ["Impreza", "WRX", "Outback", "Forester", "Legacy", "BRZ", "Crosstrek"],
  "Ford": ["Mustang", "F-150", "Explorer", "Expedition", "Edge", "Escape", "Ranger", "Bronco"],
  "Chevrolet": ["Camaro", "Corvette", "Tahoe", "Suburban", "Silverado", "Traverse", "Equinox"],
  "Dodge": ["Challenger", "Charger", "Durango", "Ram"],
  "Jeep": ["Wrangler", "Grand Cherokee", "Cherokee", "Compass", "Renegade", "Gladiator"],
  "GMC": ["Sierra", "Yukon", "Terrain", "Acadia", "Canyon"],
  "Cadillac": ["Escalade", "CT5", "CT4", "XT5", "XT6"],
  "BMW": ["1 Series", "2 Series", "3 Series", "4 Series", "5 Series", "6 Series", "7 Series", "8 Series", "X1", "X3", "X5", "X6", "X7", "M3", "M4", "M5"],
  "Mercedes": ["A-Class", "C-Class", "E-Class", "S-Class", "GLA", "GLC", "GLE", "GLS", "G-Class", "AMG GT"],
  "Audi": ["A1", "A3", "A4", "A5", "A6", "A7", "A8", "Q3", "Q5", "Q7", "Q8", "RS3", "RS5", "RS6", "RS7", "R8", "e-tron"],
  "Volkswagen": ["Golf", "Passat", "Jetta", "Tiguan", "Touareg", "Atlas", "Arteon", "ID.4"],
  "Porsche": ["911", "Cayenne", "Macan", "Panamera", "Taycan", "718 Boxster", "718 Cayman"],
  "Hyundai": ["Elantra", "Sonata", "Tucson", "Santa Fe", "Palisade", "Kona", "Venue", "Ioniq"],
  "Kia": ["Forte", "K5", "Sportage", "Sorento", "Telluride", "Soul", "Seltos", "Stinger", "EV6"],
  "Genesis": ["G70", "G80", "G90", "GV70", "GV80"],
  "Land Rover": ["Range Rover", "Range Rover Sport", "Range Rover Velar", "Range Rover Evoque", "Discovery", "Defender"],
  "Jaguar": ["F-Type", "XE", "XF", "F-Pace", "E-Pace", "I-Pace"],
  "Bentley": ["Continental GT", "Flying Spur", "Bentayga"],
  "Rolls Royce": ["Phantom", "Ghost", "Wraith", "Dawn", "Cullinan"],
  "Ferrari": ["488", "F8 Tributo", "Roma", "Portofino", "SF90", "812"],
  "Lamborghini": ["Huracan", "Aventador", "Urus"],
  "Maserati": ["Ghibli", "Quattroporte", "Levante", "MC20"],
  "Alfa Romeo": ["Giulia", "Stelvio", "Tonale"],
  "BYD": ["Tang", "Han", "Seal", "Dolphin", "Atto 3"],
  "Chery": ["Tiggo 7", "Tiggo 8", "Arrizo 6"],
  "Geely": ["Coolray", "Azkarra", "Emgrand"],
  "Great Wall": ["Haval H6", "Haval H9", "Poer"],
  "MG": ["ZS", "HS", "MG5", "MG6"],
  "NIO": ["ES6", "ES8", "ET5", "ET7"],
  "XPeng": ["P7", "G3", "P5"],
  "Li Auto": ["L9", "L7", "L8"],
  "Haval": ["H6", "H9", "Jolion"],
};

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
