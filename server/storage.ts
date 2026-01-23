import { db } from "./db";
import { products, favorites, users, appSettings, banners, userViews, subscriptionPackages, transactions, notifications, deviceTokens, type Product, type InsertProduct, type Favorite, type InsertFavorite, type User, type AppSettings, type Banner, type InsertBanner, type UserView, type InsertUserView, type SubscriptionPackage, type InsertSubscriptionPackage, type Transaction, type InsertTransaction, type Notification, type InsertNotification } from "@shared/schema";
import { eq, ilike, desc, and, or, lt, sql, asc, gte, lte, sum, inArray } from "drizzle-orm";

export interface IStorage {
  // Products
  getProducts(options?: { search?: string; mainCategory?: string; subCategory?: string }): Promise<Product[]>;
  getProduct(id: number): Promise<Product | undefined>;
  getProductsBySeller(sellerId: string): Promise<Product[]>;
  getMyProducts(sellerId: string): Promise<Product[]>;
  getExpiringProducts(sellerId: string, daysLeft?: number): Promise<Product[]>;
  createProduct(product: InsertProduct & { sellerId: string }): Promise<Product>;
  deleteProduct(id: number): Promise<void>;
  deleteProductsBySeller(sellerIds: string[]): Promise<number>;
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
  
  // Subscription Packages
  getPackages(category?: string): Promise<SubscriptionPackage[]>;
  getActivePackages(category: string): Promise<SubscriptionPackage[]>;
  getPackage(id: number): Promise<SubscriptionPackage | undefined>;
  createPackage(pkg: InsertSubscriptionPackage): Promise<SubscriptionPackage>;
  updatePackage(id: number, data: Partial<SubscriptionPackage>): Promise<SubscriptionPackage | undefined>;
  deletePackage(id: number): Promise<void>;
  
  // Transactions & Revenue
  createTransaction(tx: InsertTransaction): Promise<Transaction>;
  getTransactions(options?: { userId?: string; startDate?: Date; endDate?: Date }): Promise<Transaction[]>;
  getTransactionByReference(reference: string): Promise<Transaction | undefined>;
  updateTransactionStatus(id: number, status: string): Promise<void>;
  updateTransactionReference(id: number, reference: string): Promise<void>;
  getRevenueStats(): Promise<{ totalRevenue: number; sparePartsRevenue: number; automotiveRevenue: number; transactionCount: number }>;
  
  // Account deletion
  deleteUserProducts(userId: string): Promise<void>;
  deleteUserFavorites(userId: string): Promise<void>;
  deleteUserTransactions(userId: string): Promise<void>;
  deleteUserNotifications(userId: string): Promise<void>;
  deleteUserDeviceTokens(userId: string): Promise<void>;
  deleteUser(userId: string): Promise<void>;
  
  // Notifications
  createNotification(notification: InsertNotification): Promise<Notification>;
  getNotifications(userId: string): Promise<Notification[]>;
  getUnreadCount(userId: string): Promise<number>;
  markAsRead(id: number): Promise<void>;
  markAllAsRead(userId: string): Promise<void>;
  deleteNotification(id: number): Promise<void>;
  
  // Admin users
  getAdminUsers(): Promise<{ id: string; phone: string | null }[]>;
  getAllUsers(): Promise<any[]>;
  getUserById(userId: string): Promise<any>;
  getDetailedRevenueStats(period?: 'day' | 'week' | 'month' | 'year' | 'all' | 'custom', startDate?: string, endDate?: string): Promise<{
    totalRevenue: number;
    sparePartsRevenue: number;
    automotiveRevenue: number;
    transactionCount: number;
    periodLabel: string;
  }>;
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

  async deleteProductsBySeller(sellerIds: string[]): Promise<number> {
    const result = await db.delete(products)
      .where(or(...sellerIds.map(id => eq(products.sellerId, id))))
      .returning();
    return result.length;
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
    const [user] = await db.update(users)
      .set(category === "Spare Parts" 
        ? { sparePartsCredits: sql`COALESCE(${users.sparePartsCredits}, 0) + ${amount}` }
        : { automotiveCredits: sql`COALESCE(${users.automotiveCredits}, 0) + ${amount}` })
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
        ? { sparePartsCredits: sql`COALESCE(${users.sparePartsCredits}, 0) - 1` }
        : { automotiveCredits: sql`COALESCE(${users.automotiveCredits}, 0) - 1` })
      .where(eq(users.id, userId));
    return true;
  }

  async refundCredit(userId: string, category: "Spare Parts" | "Automotive"): Promise<boolean> {
    await db.update(users)
      .set(category === "Spare Parts"
        ? { sparePartsCredits: sql`COALESCE(${users.sparePartsCredits}, 0) + 1` }
        : { automotiveCredits: sql`COALESCE(${users.automotiveCredits}, 0) + 1` })
      .where(eq(users.id, userId));
    return true;
  }

  async isSubscriptionEnabled(): Promise<boolean> {
    const settings = await this.getAppSettings();
    // Default to true if no settings exist (subscriptions enabled by default)
    return settings?.subscriptionEnabled ?? true;
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

  // Subscription Packages
  async getPackages(category?: string): Promise<SubscriptionPackage[]> {
    if (category) {
      return await db.select().from(subscriptionPackages)
        .where(eq(subscriptionPackages.category, category))
        .orderBy(asc(subscriptionPackages.sortOrder));
    }
    return await db.select().from(subscriptionPackages)
      .orderBy(asc(subscriptionPackages.sortOrder));
  }

  async getActivePackages(category: string): Promise<SubscriptionPackage[]> {
    return await db.select().from(subscriptionPackages)
      .where(and(
        eq(subscriptionPackages.category, category),
        eq(subscriptionPackages.isActive, true)
      ))
      .orderBy(asc(subscriptionPackages.sortOrder));
  }

  async getPackage(id: number): Promise<SubscriptionPackage | undefined> {
    const [pkg] = await db.select().from(subscriptionPackages)
      .where(eq(subscriptionPackages.id, id));
    return pkg;
  }

  async createPackage(pkg: InsertSubscriptionPackage): Promise<SubscriptionPackage> {
    const [newPkg] = await db.insert(subscriptionPackages).values(pkg).returning();
    return newPkg;
  }

  async updatePackage(id: number, data: Partial<SubscriptionPackage>): Promise<SubscriptionPackage | undefined> {
    const [updated] = await db.update(subscriptionPackages)
      .set(data)
      .where(eq(subscriptionPackages.id, id))
      .returning();
    return updated;
  }

  async deletePackage(id: number): Promise<void> {
    await db.delete(subscriptionPackages).where(eq(subscriptionPackages.id, id));
  }

  // Transactions & Revenue
  async createTransaction(tx: InsertTransaction): Promise<Transaction> {
    const [newTx] = await db.insert(transactions).values(tx).returning();
    return newTx;
  }

  async getTransactions(options?: { userId?: string; startDate?: Date; endDate?: Date }): Promise<Transaction[]> {
    const conditions = [];
    if (options?.userId) {
      conditions.push(eq(transactions.userId, options.userId));
    }
    if (options?.startDate) {
      conditions.push(gte(transactions.createdAt, options.startDate));
    }
    if (options?.endDate) {
      conditions.push(lte(transactions.createdAt, options.endDate));
    }
    
    if (conditions.length > 0) {
      return await db.select().from(transactions)
        .where(and(...conditions))
        .orderBy(desc(transactions.createdAt));
    }
    return await db.select().from(transactions)
      .orderBy(desc(transactions.createdAt));
  }

  async getTransactionByReference(reference: string): Promise<Transaction | undefined> {
    const [tx] = await db.select().from(transactions)
      .where(eq(transactions.paymentReference, reference));
    return tx;
  }

  async updateTransactionStatus(id: number, status: string): Promise<void> {
    await db.update(transactions)
      .set({ status })
      .where(eq(transactions.id, id));
  }

  async updateTransactionReference(id: number, reference: string): Promise<void> {
    await db.update(transactions)
      .set({ paymentReference: reference })
      .where(eq(transactions.id, id));
  }

  async getRevenueStats(): Promise<{ totalRevenue: number; sparePartsRevenue: number; automotiveRevenue: number; transactionCount: number }> {
    const allTx = await db.select().from(transactions)
      .where(eq(transactions.status, "completed"));
    
    const totalRevenue = allTx.reduce((sum, tx) => sum + tx.amount, 0);
    const sparePartsRevenue = allTx.filter(tx => tx.category === "Spare Parts").reduce((sum, tx) => sum + tx.amount, 0);
    const automotiveRevenue = allTx.filter(tx => tx.category === "Automotive").reduce((sum, tx) => sum + tx.amount, 0);
    
    return {
      totalRevenue,
      sparePartsRevenue,
      automotiveRevenue,
      transactionCount: allTx.length,
    };
  }

  async deleteUserProducts(userId: string): Promise<void> {
    await db.delete(products).where(eq(products.sellerId, userId));
  }

  async deleteUserFavorites(userId: string): Promise<void> {
    await db.delete(favorites).where(eq(favorites.userId, userId));
  }

  async deleteUserTransactions(userId: string): Promise<void> {
    await db.delete(transactions).where(eq(transactions.userId, userId));
  }

  async deleteUserNotifications(userId: string): Promise<void> {
    await db.delete(notifications).where(eq(notifications.userId, userId));
  }

  async deleteUserDeviceTokens(userId: string): Promise<void> {
    await db.delete(deviceTokens).where(eq(deviceTokens.userId, userId));
  }

  async deleteUser(userId: string): Promise<void> {
    await db.delete(users).where(eq(users.id, userId));
  }

  // Notifications
  async createNotification(notification: InsertNotification): Promise<Notification> {
    const [created] = await db.insert(notifications).values(notification).returning();
    return created;
  }

  async getNotifications(userId: string): Promise<Notification[]> {
    return db.select().from(notifications)
      .where(eq(notifications.userId, userId))
      .orderBy(desc(notifications.createdAt));
  }

  async getUnreadCount(userId: string): Promise<number> {
    const result = await db.select().from(notifications)
      .where(and(
        eq(notifications.userId, userId),
        eq(notifications.isRead, false)
      ));
    return result.length;
  }

  async markAsRead(id: number): Promise<void> {
    await db.update(notifications)
      .set({ isRead: true })
      .where(eq(notifications.id, id));
  }

  async markAllAsRead(userId: string): Promise<void> {
    await db.update(notifications)
      .set({ isRead: true })
      .where(eq(notifications.userId, userId));
  }

  async deleteNotification(id: number): Promise<void> {
    await db.delete(notifications).where(eq(notifications.id, id));
  }
  
  async getAdminUsers(): Promise<{ id: string; phone: string | null }[]> {
    // Get users with isAdmin=true OR who are in the owner phones list
    const OWNER_PHONES = ["971507242111"];
    const adminUsers = await db.select({
      id: users.id,
      phone: users.phone,
    }).from(users).where(
      or(
        eq(users.isAdmin, true),
        inArray(users.phone, OWNER_PHONES)
      )
    );
    return adminUsers;
  }

  async getAllUsers(): Promise<any[]> {
    const allUsers = await db.select({
      id: users.id,
      phone: users.phone,
      email: users.email,
      firstName: users.firstName,
      lastName: users.lastName,
      sparePartsCredits: users.sparePartsCredits,
      automotiveCredits: users.automotiveCredits,
      isAdmin: users.isAdmin,
      profileImageUrl: users.profileImageUrl,
      createdAt: users.createdAt,
    }).from(users).orderBy(desc(users.createdAt));
    return allUsers;
  }

  async getUserById(userId: string): Promise<any> {
    const [user] = await db.select().from(users).where(eq(users.id, userId));
    return user;
  }

  async getDetailedRevenueStats(period: 'day' | 'week' | 'month' | 'year' | 'all' | 'custom' = 'all', customStartDate?: string, customEndDate?: string): Promise<{
    totalRevenue: number;
    sparePartsRevenue: number;
    automotiveRevenue: number;
    transactionCount: number;
    periodLabel: string;
  }> {
    let startDate: Date | null = null;
    let endDate: Date | null = null;
    let periodLabel = 'All Time';
    const now = new Date();

    switch (period) {
      case 'day':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        periodLabel = 'Today';
        break;
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        periodLabel = 'Last 7 Days';
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        periodLabel = 'This Month';
        break;
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1);
        periodLabel = 'This Year';
        break;
      case 'custom':
        if (customStartDate && customEndDate) {
          startDate = new Date(customStartDate);
          endDate = new Date(customEndDate);
          endDate.setHours(23, 59, 59, 999);
          const startFormatted = startDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
          const endFormatted = endDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
          periodLabel = `${startFormatted} - ${endFormatted}`;
        } else {
          periodLabel = 'Select dates';
        }
        break;
      default:
        periodLabel = 'All Time';
    }

    const conditions = [eq(transactions.status, 'completed')];
    if (startDate) {
      conditions.push(sql`${transactions.createdAt} >= ${startDate}`);
    }
    if (endDate) {
      conditions.push(sql`${transactions.createdAt} <= ${endDate}`);
    }

    const result = await db.select({
      totalRevenue: sql<number>`COALESCE(SUM(${transactions.amount}), 0)`,
      transactionCount: sql<number>`COUNT(*)`,
    }).from(transactions).where(and(...conditions));

    const sparePartsResult = await db.select({
      revenue: sql<number>`COALESCE(SUM(${transactions.amount}), 0)`,
    }).from(transactions).where(and(
      ...conditions,
      eq(transactions.category, 'Spare Parts')
    ));

    const automotiveResult = await db.select({
      revenue: sql<number>`COALESCE(SUM(${transactions.amount}), 0)`,
    }).from(transactions).where(and(
      ...conditions,
      eq(transactions.category, 'Automotive')
    ));

    return {
      totalRevenue: Number(result[0]?.totalRevenue || 0),
      sparePartsRevenue: Number(sparePartsResult[0]?.revenue || 0),
      automotiveRevenue: Number(automotiveResult[0]?.revenue || 0),
      transactionCount: Number(result[0]?.transactionCount || 0),
      periodLabel,
    };
  }
}

export const storage = new DatabaseStorage();
