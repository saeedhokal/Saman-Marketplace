import { pgTable, text, serial, integer, boolean, timestamp, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { users } from "./models/auth";
export * from "./models/auth";

// Main categories
export const MAIN_CATEGORIES = ["Spare Parts", "Automotive"] as const;
export type MainCategory = typeof MAIN_CATEGORIES[number];

// Sub-categories for Spare Parts (car manufacturers + universal)
export const SPARE_PARTS_SUBCATEGORIES = [
  "Toyota", "Honda", "Nissan", "Ford", "Chevrolet", "BMW", "Mercedes", "Audi",
  "Volkswagen", "Hyundai", "Kia", "Mazda", "Mitsubishi", "Lexus", "Infiniti",
  "Land Rover", "Jeep", "Dodge", "GMC", "Porsche", "Ferrari", "Lamborghini",
  "Turbos & Superchargers", "Tires", "Brakes", "Suspension", "Exhaust", "Engine Parts",
  "Transmission", "Electrical", "Body Parts", "Interior", "Lights", "Other"
] as const;

// Sub-categories for Automotive (vehicles for sale)
export const AUTOMOTIVE_SUBCATEGORIES = [
  "Toyota", "Honda", "Nissan", "Ford", "Chevrolet", "BMW", "Mercedes", "Audi",
  "Volkswagen", "Hyundai", "Kia", "Mazda", "Mitsubishi", "Lexus", "Infiniti",
  "Land Rover", "Jeep", "Dodge", "GMC", "Porsche", "Ferrari", "Lamborghini",
  "Offroad", "Motorcycles", "Other"
] as const;

// Listing status for moderation
export const LISTING_STATUS = ["pending", "approved", "rejected"] as const;
export type ListingStatus = typeof LISTING_STATUS[number];

export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  price: integer("price").notNull(), // in cents
  imageUrl: text("image_url").notNull(),
  mainCategory: text("main_category").notNull(), // "Spare Parts" or "Automotive"
  subCategory: text("sub_category").notNull(), // Toyota, Honda, Turbos, Motorcycles, etc.
  condition: text("condition").notNull(), // New, Used, Refurbished
  sellerId: varchar("seller_id").notNull().references(() => users.id),
  location: text("location"),
  phoneNumber: text("phone_number"),
  whatsappNumber: text("whatsapp_number"),
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

export const insertProductSchema = createInsertSchema(products).omit({
  id: true,
  createdAt: true,
  sellerId: true, // Derived from auth
  status: true, // Set by system
  rejectionReason: true, // Set by admin
  expiresAt: true, // Set when approved
});

export const insertFavoriteSchema = createInsertSchema(favorites).omit({
  id: true,
  createdAt: true,
  userId: true, // Derived from auth
});

export type Product = typeof products.$inferSelect;
export type InsertProduct = z.infer<typeof insertProductSchema>;
export type Favorite = typeof favorites.$inferSelect;
export type InsertFavorite = z.infer<typeof insertFavoriteSchema>;
export type AppSettings = typeof appSettings.$inferSelect;
