import { db } from "./db";
import { products, favorites, users, appSettings, type Product, type InsertProduct, type Favorite, type InsertFavorite, type User, type AppSettings } from "@shared/schema";
import { eq, ilike, desc, and, or, lt, sql } from "drizzle-orm";

export interface IStorage {
  // Products
  getProducts(options?: { search?: string; mainCategory?: string; subCategory?: string }): Promise<Product[]>;
  getProduct(id: number): Promise<Product | undefined>;
  getProductsBySeller(sellerId: string): Promise<Product[]>;
  getMyProducts(sellerId: string): Promise<Product[]>;
  getExpiringProducts(sellerId: string, daysLeft?: number): Promise<Product[]>;
  createProduct(product: InsertProduct & { sellerId: string }): Promise<Product>;
  deleteProduct(id: number): Promise<void>;
  repostProduct(id: number): Promise<Product | undefined>;
  markAsSold(id: number): Promise<void>;
  
  // Admin - Listings
  getPendingProducts(): Promise<Product[]>;
  getAllProducts(): Promise<Product[]>;
  approveProduct(id: number): Promise<Product | undefined>;
  rejectProduct(id: number, reason: string): Promise<Product | undefined>;
  updateProduct(id: number, data: Partial<Product>): Promise<Product | undefined>;
  deleteExpiredProducts(): Promise<number>;
  
  // Credits
  getUserCredits(userId: string): Promise<number>;
  addCredits(userId: string, amount: number): Promise<User | undefined>;
  useCredit(userId: string): Promise<boolean>;
  isSubscriptionEnabled(): Promise<boolean>;
  
  // App Settings
  getAppSettings(): Promise<AppSettings | undefined>;
  updateAppSettings(settings: Partial<AppSettings>): Promise<AppSettings>;
  
  // Favorites
  getFavorites(userId: string): Promise<Product[]>;
  addFavorite(userId: string, productId: number): Promise<Favorite>;
  removeFavorite(userId: string, productId: number): Promise<void>;
  isFavorite(userId: string, productId: number): Promise<boolean>;
}

export class DatabaseStorage implements IStorage {
  // Only show approved, non-expired products to public
  async getProducts(options?: { search?: string; mainCategory?: string; subCategory?: string }): Promise<Product[]> {
    const conditions = [
      eq(products.status, "approved"),
      or(
        eq(products.expiresAt, sql`NULL`),
        sql`${products.expiresAt} > NOW()`
      )
    ];

    if (options?.search) {
      conditions.push(
        or(
          ilike(products.title, `%${options.search}%`),
          ilike(products.description, `%${options.search}%`)
        )
      );
    }
    if (options?.mainCategory && options.mainCategory !== "All") {
      conditions.push(eq(products.mainCategory, options.mainCategory));
    }
    if (options?.subCategory && options.subCategory !== "All") {
      conditions.push(eq(products.subCategory, options.subCategory));
    }

    return await db.select().from(products)
      .where(and(...conditions))
      .orderBy(desc(products.createdAt));
  }

  async getProduct(id: number): Promise<Product | undefined> {
    const [product] = await db.select().from(products).where(eq(products.id, id));
    return product;
  }

  async getProductsBySeller(sellerId: string): Promise<Product[]> {
    return await db.select().from(products)
      .where(and(
        eq(products.sellerId, sellerId),
        eq(products.status, "approved")
      ))
      .orderBy(desc(products.createdAt));
  }

  async getMyProducts(sellerId: string): Promise<Product[]> {
    return await db.select().from(products)
      .where(eq(products.sellerId, sellerId))
      .orderBy(desc(products.createdAt));
  }

  async getExpiringProducts(sellerId: string, daysLeft: number = 5): Promise<Product[]> {
    const now = new Date();
    const warningDate = new Date();
    warningDate.setDate(warningDate.getDate() + daysLeft);
    
    return await db.select().from(products)
      .where(and(
        eq(products.sellerId, sellerId),
        eq(products.status, "approved"),
        sql`${products.expiresAt} IS NOT NULL`,
        sql`${products.expiresAt} > ${now}`,
        sql`${products.expiresAt} <= ${warningDate}`
      ))
      .orderBy(products.expiresAt);
  }

  async repostProduct(id: number): Promise<Product | undefined> {
    const [product] = await db.update(products)
      .set({ 
        status: "pending", 
        expiresAt: null,
        rejectionReason: null 
      })
      .where(eq(products.id, id))
      .returning();
    return product;
  }

  async markAsSold(id: number): Promise<void> {
    await db.delete(products).where(eq(products.id, id));
  }

  async createProduct(product: InsertProduct & { sellerId: string }): Promise<Product> {
    const [newProduct] = await db.insert(products).values({
      ...product,
      status: "pending",
    }).returning();
    return newProduct;
  }

  async deleteProduct(id: number): Promise<void> {
    await db.delete(products).where(eq(products.id, id));
  }

  // Admin methods
  async getPendingProducts(): Promise<Product[]> {
    return await db.select().from(products)
      .where(eq(products.status, "pending"))
      .orderBy(desc(products.createdAt));
  }

  async getAllProducts(): Promise<Product[]> {
    return await db.select().from(products)
      .orderBy(desc(products.createdAt));
  }

  async approveProduct(id: number): Promise<Product | undefined> {
    const expiresAt = new Date();
    expiresAt.setMonth(expiresAt.getMonth() + 1); // 1 month from now
    
    const [product] = await db.update(products)
      .set({ status: "approved", expiresAt, rejectionReason: null })
      .where(eq(products.id, id))
      .returning();
    return product;
  }

  async rejectProduct(id: number, reason: string): Promise<Product | undefined> {
    const [product] = await db.update(products)
      .set({ status: "rejected", rejectionReason: reason })
      .where(eq(products.id, id))
      .returning();
    return product;
  }

  async updateProduct(id: number, data: Partial<Product>): Promise<Product | undefined> {
    const [product] = await db.update(products)
      .set(data)
      .where(eq(products.id, id))
      .returning();
    return product;
  }

  async deleteExpiredProducts(): Promise<number> {
    const result = await db.delete(products)
      .where(and(
        sql`${products.expiresAt} IS NOT NULL`,
        lt(products.expiresAt, new Date())
      ))
      .returning();
    return result.length;
  }

  // Credit methods
  async getUserCredits(userId: string): Promise<number> {
    const [user] = await db.select({ credits: users.credits })
      .from(users)
      .where(eq(users.id, userId));
    return user?.credits ?? 0;
  }

  async addCredits(userId: string, amount: number): Promise<User | undefined> {
    const [user] = await db.update(users)
      .set({ credits: sql`${users.credits} + ${amount}` })
      .where(eq(users.id, userId))
      .returning();
    return user;
  }

  async useCredit(userId: string): Promise<boolean> {
    const credits = await this.getUserCredits(userId);
    if (credits < 1) return false;
    
    await db.update(users)
      .set({ credits: sql`${users.credits} - 1` })
      .where(eq(users.id, userId));
    return true;
  }

  async isSubscriptionEnabled(): Promise<boolean> {
    const settings = await this.getAppSettings();
    return settings?.subscriptionEnabled ?? false;
  }

  // App Settings
  async getAppSettings(): Promise<AppSettings | undefined> {
    const [settings] = await db.select().from(appSettings).where(eq(appSettings.id, "main"));
    return settings;
  }

  async updateAppSettings(settings: Partial<AppSettings>): Promise<AppSettings> {
    const existing = await this.getAppSettings();
    if (existing) {
      const [updated] = await db.update(appSettings)
        .set({ ...settings, updatedAt: new Date() })
        .where(eq(appSettings.id, "main"))
        .returning();
      return updated;
    } else {
      const [created] = await db.insert(appSettings)
        .values({ id: "main", ...settings })
        .returning();
      return created;
    }
  }

  // Favorites
  async getFavorites(userId: string): Promise<Product[]> {
    const result = await db
      .select({ product: products })
      .from(favorites)
      .innerJoin(products, eq(favorites.productId, products.id))
      .where(eq(favorites.userId, userId))
      .orderBy(desc(favorites.createdAt));
    return result.map(r => r.product);
  }

  async addFavorite(userId: string, productId: number): Promise<Favorite> {
    const [fav] = await db.insert(favorites).values({ userId, productId }).returning();
    return fav;
  }

  async removeFavorite(userId: string, productId: number): Promise<void> {
    await db.delete(favorites).where(
      and(eq(favorites.userId, userId), eq(favorites.productId, productId))
    );
  }

  async isFavorite(userId: string, productId: number): Promise<boolean> {
    const [fav] = await db.select().from(favorites).where(
      and(eq(favorites.userId, userId), eq(favorites.productId, productId))
    );
    return !!fav;
  }
}

export const storage = new DatabaseStorage();
