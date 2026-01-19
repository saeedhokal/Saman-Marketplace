import { db } from "./db";
import { products, favorites, users, appSettings, banners, userViews, type Product, type InsertProduct, type Favorite, type InsertFavorite, type User, type AppSettings, type Banner, type InsertBanner, type UserView, type InsertUserView } from "@shared/schema";
import { eq, ilike, desc, and, or, lt, sql, asc } from "drizzle-orm";

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
  
  // Credits (category-specific)
  getUserCredits(userId: string): Promise<{ sparePartsCredits: number; automotiveCredits: number }>;
  addCredits(userId: string, category: "Spare Parts" | "Automotive", amount: number): Promise<User | undefined>;
  useCredit(userId: string, category: "Spare Parts" | "Automotive"): Promise<boolean>;
  refundCredit(userId: string, category: "Spare Parts" | "Automotive"): Promise<boolean>;
  isSubscriptionEnabled(): Promise<boolean>;
  
  // App Settings
  getAppSettings(): Promise<AppSettings | undefined>;
  updateAppSettings(settings: Partial<AppSettings>): Promise<AppSettings>;
  
  // Favorites
  getFavorites(userId: string): Promise<Product[]>;
  addFavorite(userId: string, productId: number): Promise<Favorite>;
  removeFavorite(userId: string, productId: number): Promise<void>;
  isFavorite(userId: string, productId: number): Promise<boolean>;
  
  // Banners
  getActiveBanners(): Promise<Banner[]>;
  getAllBanners(): Promise<Banner[]>;
  createBanner(banner: InsertBanner): Promise<Banner>;
  updateBanner(id: number, data: Partial<Banner>): Promise<Banner | undefined>;
  deleteBanner(id: number): Promise<void>;
  
  // User Views & Recommendations
  recordView(view: InsertUserView): Promise<void>;
  getRecentProducts(limit?: number): Promise<Product[]>;
  getRecommendedProducts(userId?: string, sessionId?: string, limit?: number): Promise<Product[]>;
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

  // Credit methods (category-specific)
  async getUserCredits(userId: string): Promise<{ sparePartsCredits: number; automotiveCredits: number }> {
    const [user] = await db.select({ 
      sparePartsCredits: users.sparePartsCredits,
      automotiveCredits: users.automotiveCredits 
    })
      .from(users)
      .where(eq(users.id, userId));
    return {
      sparePartsCredits: user?.sparePartsCredits ?? 0,
      automotiveCredits: user?.automotiveCredits ?? 0
    };
  }

  async addCredits(userId: string, category: "Spare Parts" | "Automotive", amount: number): Promise<User | undefined> {
    const field = category === "Spare Parts" ? users.sparePartsCredits : users.automotiveCredits;
    const [user] = await db.update(users)
      .set(category === "Spare Parts" 
        ? { sparePartsCredits: sql`${users.sparePartsCredits} + ${amount}` }
        : { automotiveCredits: sql`${users.automotiveCredits} + ${amount}` })
      .where(eq(users.id, userId))
      .returning();
    return user;
  }

  async useCredit(userId: string, category: "Spare Parts" | "Automotive"): Promise<boolean> {
    const credits = await this.getUserCredits(userId);
    const available = category === "Spare Parts" ? credits.sparePartsCredits : credits.automotiveCredits;
    if (available < 1) return false;
    
    await db.update(users)
      .set(category === "Spare Parts"
        ? { sparePartsCredits: sql`${users.sparePartsCredits} - 1` }
        : { automotiveCredits: sql`${users.automotiveCredits} - 1` })
      .where(eq(users.id, userId));
    return true;
  }

  async refundCredit(userId: string, category: "Spare Parts" | "Automotive"): Promise<boolean> {
    await db.update(users)
      .set(category === "Spare Parts"
        ? { sparePartsCredits: sql`${users.sparePartsCredits} + 1` }
        : { automotiveCredits: sql`${users.automotiveCredits} + 1` })
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

  // Banner methods
  async getActiveBanners(): Promise<Banner[]> {
    return await db.select().from(banners)
      .where(eq(banners.isActive, true))
      .orderBy(asc(banners.sortOrder));
  }

  async getAllBanners(): Promise<Banner[]> {
    return await db.select().from(banners)
      .orderBy(asc(banners.sortOrder));
  }

  async createBanner(banner: InsertBanner): Promise<Banner> {
    const [newBanner] = await db.insert(banners).values(banner).returning();
    return newBanner;
  }

  async updateBanner(id: number, data: Partial<Banner>): Promise<Banner | undefined> {
    const [updated] = await db.update(banners)
      .set(data)
      .where(eq(banners.id, id))
      .returning();
    return updated;
  }

  async deleteBanner(id: number): Promise<void> {
    await db.delete(banners).where(eq(banners.id, id));
  }

  // User Views & Recommendations
  async recordView(view: InsertUserView): Promise<void> {
    await db.insert(userViews).values(view);
  }

  async getRecentProducts(limit: number = 10): Promise<Product[]> {
    return await db.select().from(products)
      .where(and(
        eq(products.status, "approved"),
        or(
          sql`${products.expiresAt} IS NULL`,
          sql`${products.expiresAt} > NOW()`
        )
      ))
      .orderBy(desc(products.createdAt))
      .limit(limit);
  }

  async getRecommendedProducts(userId?: string, sessionId?: string, limit: number = 10): Promise<Product[]> {
    // Get categories the user has viewed
    const viewConditions = userId 
      ? eq(userViews.userId, userId)
      : sessionId 
        ? eq(userViews.sessionId, sessionId)
        : sql`1=0`;

    const viewedCategories = await db.select({
      mainCategory: userViews.mainCategory,
      subCategory: userViews.subCategory,
    })
      .from(userViews)
      .where(viewConditions)
      .orderBy(desc(userViews.viewedAt))
      .limit(20);

    if (viewedCategories.length === 0) {
      // No view history, return recent products
      return this.getRecentProducts(limit);
    }

    // Get products from viewed categories
    const categoryConditions = viewedCategories
      .filter(v => v.subCategory)
      .map(v => eq(products.subCategory, v.subCategory!));

    if (categoryConditions.length === 0) {
      return this.getRecentProducts(limit);
    }

    return await db.select().from(products)
      .where(and(
        eq(products.status, "approved"),
        or(
          sql`${products.expiresAt} IS NULL`,
          sql`${products.expiresAt} > NOW()`
        ),
        or(...categoryConditions)
      ))
      .orderBy(desc(products.createdAt))
      .limit(limit);
  }
}

export const storage = new DatabaseStorage();
