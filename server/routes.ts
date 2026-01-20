import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { setupSimpleAuth, isAuthenticated, getCurrentUserId } from "./simpleAuth";
import { registerObjectStorageRoutes } from "./replit_integrations/object_storage";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import { MAIN_CATEGORIES, SPARE_PARTS_SUBCATEGORIES, AUTOMOTIVE_SUBCATEGORIES } from "@shared/schema";
import { db } from "./db";
import { users } from "@shared/models/auth";
import { eq } from "drizzle-orm";

// Valid subcategories by main category
const validSubcategories: Record<string, readonly string[]> = {
  "Spare Parts": SPARE_PARTS_SUBCATEGORIES,
  "Automotive": AUTOMOTIVE_SUBCATEGORIES,
};

function isValidCategoryPair(mainCategory: string, subCategory: string): boolean {
  const validSubs = validSubcategories[mainCategory];
  return !!validSubs && (validSubs as readonly string[]).includes(subCategory);
}

// Middleware to check if user is admin
const isAdmin = async (req: Request, res: Response, next: NextFunction) => {
  const userId = getCurrentUserId(req);
  if (!userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  const [user] = await db.select().from(users).where(eq(users.id, userId));
  if (!user?.isAdmin) {
    return res.status(403).json({ message: "Admin access required" });
  }
  next();
};

export async function registerRoutes(httpServer: Server, app: Express): Promise<Server> {
  setupSimpleAuth(app);
  registerObjectStorageRoutes(app);

  // Helper to attach seller profile images to products
  async function attachSellerImages(productsList: any[]) {
    const sellerIds = Array.from(new Set(productsList.map(p => p.sellerId).filter(Boolean)));
    const sellerProfiles = await Promise.all(
      sellerIds.map(async (id) => {
        const [user] = await db.select({ id: users.id, profileImageUrl: users.profileImageUrl })
          .from(users).where(eq(users.id, id));
        return user;
      })
    );
    const sellerMap = new Map(sellerProfiles.filter(Boolean).map(s => [s.id, s.profileImageUrl]));
    return productsList.map(p => ({
      ...p,
      sellerProfileImageUrl: sellerMap.get(p.sellerId) || null
    }));
  }

  // Products API - include seller profile image
  app.get(api.products.list.path, async (req, res) => {
    const search = req.query.search as string | undefined;
    const mainCategory = req.query.mainCategory as string | undefined;
    const subCategory = req.query.subCategory as string | undefined;
    const productsList = await storage.getProducts({ search, mainCategory, subCategory });
    const productsWithSeller = await attachSellerImages(productsList);
    res.json(productsWithSeller);
  });

  // Public: Get recent products (must come before :id route)
  app.get("/api/products/recent", async (req, res) => {
    const limit = Math.min(Number(req.query.limit) || 10, 20);
    const productsList = await storage.getRecentProducts(limit);
    const productsWithSeller = await attachSellerImages(productsList);
    res.json(productsWithSeller);
  });

  // Public: Get recommended products (must come before :id route)
  app.get("/api/products/recommended", async (req, res) => {
    const userId = getCurrentUserId(req);
    const sessionId = req.sessionID;
    const limit = Math.min(Number(req.query.limit) || 10, 20);
    const productsList = await storage.getRecommendedProducts(userId || undefined, sessionId, limit);
    const productsWithSeller = await attachSellerImages(productsList);
    res.json(productsWithSeller);
  });

  app.get(api.products.get.path, async (req, res) => {
    const id = Number(req.params.id);
    const product = await storage.getProduct(id);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }
    res.json(product);
  });

  // Get products by seller (seller profile)
  app.get("/api/sellers/:sellerId/products", async (req, res) => {
    const sellerId = req.params.sellerId;
    
    // Basic validation: sellerId must be a non-empty string and reasonable length
    if (!sellerId || typeof sellerId !== 'string' || sellerId.length > 100) {
      return res.status(400).json({ message: "Invalid seller ID" });
    }
    
    // Verify the seller exists before returning their products
    const [seller] = await db.select().from(users).where(eq(users.id, sellerId));
    if (!seller) {
      return res.status(404).json({ message: "Seller not found" });
    }
    
    const products = await storage.getProductsBySeller(sellerId);
    res.json(products);
  });

  // Get seller profile info
  app.get("/api/sellers/:sellerId", async (req, res) => {
    const sellerId = req.params.sellerId;
    
    if (!sellerId || typeof sellerId !== 'string' || sellerId.length > 100) {
      return res.status(400).json({ message: "Invalid seller ID" });
    }
    
    const [seller] = await db.select({
      id: users.id,
      displayName: users.displayName,
      firstName: users.firstName,
      lastName: users.lastName,
      profileImageUrl: users.profileImageUrl,
      createdAt: users.createdAt,
    }).from(users).where(eq(users.id, sellerId));
    
    if (!seller) {
      return res.status(404).json({ message: "Seller not found" });
    }
    
    res.json(seller);
  });

  app.post(api.products.create.path, isAuthenticated, async (req, res) => {
    try {
      const bodySchema = api.products.create.input.extend({
        price: z.coerce.number().optional(),
        mileage: z.coerce.number().optional(),
        year: z.coerce.number().optional(),
      });
      const input = bodySchema.parse(req.body);
      
      // Validate category/subcategory pair
      if (!isValidCategoryPair(input.mainCategory, input.subCategory)) {
        return res.status(400).json({
          message: `Invalid subcategory "${input.subCategory}" for main category "${input.mainCategory}"`,
          field: 'subCategory',
        });
      }
      
      const sellerId = getCurrentUserId(req)!;

      // Check if subscription is enabled (credit system)
      const subscriptionEnabled = await storage.isSubscriptionEnabled();
      if (subscriptionEnabled) {
        // Check if user has credits for this category
        const credits = await storage.getUserCredits(sellerId);
        const category = input.mainCategory as "Spare Parts" | "Automotive";
        const availableCredits = category === "Spare Parts" 
          ? credits.sparePartsCredits 
          : credits.automotiveCredits;
        
        if (availableCredits < 1) {
          return res.status(402).json({
            message: `You need ${category} credits to post this listing. Please purchase credits to continue.`,
            code: "INSUFFICIENT_CREDITS",
            category,
          });
        }

        // Use 1 credit for this category
        await storage.useCredit(sellerId, category);
      }

      const product = await storage.createProduct({
        ...input,
        sellerId,
      });
      res.status(201).json(product);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      throw err;
    }
  });

  app.delete(api.products.delete.path, isAuthenticated, async (req, res) => {
    const id = Number(req.params.id);
    const product = await storage.getProduct(id);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }
    
    const userId = getCurrentUserId(req)!;
    if (product.sellerId !== userId) {
       return res.status(401).json({ message: "Unauthorized" });
    }

    await storage.deleteProduct(id);
    res.sendStatus(204);
  });

  // Favorites API - include seller profile images
  app.get("/api/favorites", isAuthenticated, async (req, res) => {
    const userId = getCurrentUserId(req)!;
    const favorites = await storage.getFavorites(userId);
    const favoritesWithSeller = await attachSellerImages(favorites);
    res.json(favoritesWithSeller);
  });

  app.post("/api/favorites/:productId", isAuthenticated, async (req, res) => {
    const productId = Number(req.params.productId);
    const userId = getCurrentUserId(req)!;
    
    const product = await storage.getProduct(productId);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    const existing = await storage.isFavorite(userId, productId);
    if (existing) {
      return res.status(400).json({ message: "Already in favorites" });
    }

    const fav = await storage.addFavorite(userId, productId);
    res.status(201).json(fav);
  });

  app.delete("/api/favorites/:productId", isAuthenticated, async (req, res) => {
    const productId = Number(req.params.productId);
    const userId = getCurrentUserId(req)!;
    await storage.removeFavorite(userId, productId);
    res.sendStatus(204);
  });

  app.get("/api/favorites/:productId/check", isAuthenticated, async (req, res) => {
    const productId = Number(req.params.productId);
    const userId = getCurrentUserId(req)!;
    const isFav = await storage.isFavorite(userId, productId);
    res.json({ isFavorite: isFav });
  });

  // User credits API - returns separate credits for each category
  app.get("/api/user/credits", isAuthenticated, async (req, res) => {
    const userId = getCurrentUserId(req)!;
    const credits = await storage.getUserCredits(userId);
    const subscriptionEnabled = await storage.isSubscriptionEnabled();
    const [user] = await db.select().from(users).where(eq(users.id, userId));
    res.json({ 
      sparePartsCredits: credits.sparePartsCredits,
      automotiveCredits: credits.automotiveCredits,
      isAdmin: user?.isAdmin || false, 
      subscriptionEnabled 
    });
  });

  // User profile API
  app.get("/api/user/profile", isAuthenticated, async (req, res) => {
    const userId = getCurrentUserId(req)!;
    const [user] = await db.select({
      id: users.id,
      phone: users.phone,
      email: users.email,
      firstName: users.firstName,
      lastName: users.lastName,
      displayName: users.displayName,
      profileImageUrl: users.profileImageUrl,
    }).from(users).where(eq(users.id, userId));
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json(user);
  });

  // Update user profile
  app.put("/api/user/profile", isAuthenticated, async (req, res) => {
    const userId = getCurrentUserId(req)!;
    const { displayName, firstName, lastName, profileImageUrl } = req.body;
    
    const updateData: Record<string, any> = { updatedAt: new Date() };
    
    if (displayName !== undefined) updateData.displayName = displayName || null;
    if (firstName !== undefined) updateData.firstName = firstName || null;
    if (lastName !== undefined) updateData.lastName = lastName || null;
    if (profileImageUrl !== undefined) updateData.profileImageUrl = profileImageUrl || null;
    
    await db.update(users)
      .set(updateData)
      .where(eq(users.id, userId));
    
    const [updated] = await db.select({
      id: users.id,
      phone: users.phone,
      email: users.email,
      firstName: users.firstName,
      lastName: users.lastName,
      displayName: users.displayName,
      profileImageUrl: users.profileImageUrl,
    }).from(users).where(eq(users.id, userId));
    
    res.json(updated);
  });

  // Purchase credits - allows adding credits to existing balance
  app.post("/api/user/credits/purchase", isAuthenticated, async (req, res) => {
    const userId = getCurrentUserId(req)!;
    const { category, amount } = req.body;
    
    if (!category || !["spare_parts", "automotive"].includes(category)) {
      return res.status(400).json({ message: "Invalid category" });
    }
    if (!amount || amount < 1 || amount > 100) {
      return res.status(400).json({ message: "Invalid amount" });
    }

    // Add credits to the user's balance
    const categoryName = category === "spare_parts" ? "Spare Parts" : "Automotive";
    await storage.addCredits(userId, categoryName as "Spare Parts" | "Automotive", amount);
    
    const newCredits = await storage.getUserCredits(userId);
    res.json({ 
      success: true,
      sparePartsCredits: newCredits.sparePartsCredits,
      automotiveCredits: newCredits.automotiveCredits,
    });
  });

  // Checkout - process package purchase
  app.post("/api/checkout", isAuthenticated, async (req, res) => {
    const userId = getCurrentUserId(req)!;
    const { packageId, paymentMethod } = req.body;
    
    if (!packageId) {
      return res.status(400).json({ message: "Package ID is required" });
    }

    const pkg = await storage.getPackage(packageId);
    if (!pkg || !pkg.isActive) {
      return res.status(404).json({ message: "Package not found or inactive" });
    }

    // TODO: Integrate with Telr payment gateway when keys are provided
    // For now, we'll process the payment directly (development mode)
    const telrStoreId = process.env.TELR_STORE_ID;
    const telrAuthKey = process.env.TELR_AUTH_KEY;
    
    if (!telrStoreId || !telrAuthKey) {
      // Development mode - process directly without payment gateway
      console.log(`[DEV] Processing payment for package ${pkg.id}: AED ${pkg.price}`);
    } else {
      // Production mode - would integrate with Telr here
      // For now, just log that we would process via Telr
      console.log(`[TELR] Would process payment via Telr: AED ${pkg.price}`);
    }

    // Add credits to user
    const totalCredits = pkg.credits + (pkg.bonusCredits || 0);
    const category = pkg.category as "Spare Parts" | "Automotive";
    await storage.addCredits(userId, category, totalCredits);

    // Record transaction
    await storage.createTransaction({
      userId,
      packageId: pkg.id,
      amount: pkg.price,
      credits: totalCredits,
      category: pkg.category,
      paymentMethod: paymentMethod || "credit_card",
      paymentReference: `DEV-${Date.now()}`,
      status: "completed",
    });

    const newCredits = await storage.getUserCredits(userId);
    res.json({ 
      success: true,
      message: `${totalCredits} ${category} credits added to your account`,
      sparePartsCredits: newCredits.sparePartsCredits,
      automotiveCredits: newCredits.automotiveCredits,
    });
  });

  // User's own listings (all statuses)
  app.get("/api/user/listings", isAuthenticated, async (req, res) => {
    const userId = getCurrentUserId(req)!;
    const listings = await storage.getMyProducts(userId);
    res.json(listings);
  });

  // Get expiring listings for the user (within 5 days of expiration)
  app.get("/api/user/listings/expiring", isAuthenticated, async (req, res) => {
    const userId = getCurrentUserId(req)!;
    const daysLeft = Number(req.query.days) || 5;
    const listings = await storage.getExpiringProducts(userId, daysLeft);
    res.json(listings);
  });

  // Repost a listing (requires credit if subscription enabled)
  app.post("/api/user/listings/:id/repost", isAuthenticated, async (req, res) => {
    const id = Number(req.params.id);
    const userId = getCurrentUserId(req)!;
    
    const product = await storage.getProduct(id);
    if (!product) {
      return res.status(404).json({ message: "Listing not found" });
    }
    if (product.sellerId !== userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // Check if subscription is enabled
    const subscriptionEnabled = await storage.isSubscriptionEnabled();
    if (subscriptionEnabled) {
      const credits = await storage.getUserCredits(userId);
      const category = product.mainCategory as "Spare Parts" | "Automotive";
      const availableCredits = category === "Spare Parts" 
        ? credits.sparePartsCredits 
        : credits.automotiveCredits;
      
      if (availableCredits < 1) {
        return res.status(402).json({
          message: `You need ${category} credits to repost this listing.`,
          code: "INSUFFICIENT_CREDITS",
          category,
        });
      }
      await storage.useCredit(userId, category);
    }

    const reposted = await storage.repostProduct(id);
    res.json(reposted);
  });

  // Mark listing as sold (removes it)
  app.post("/api/user/listings/:id/sold", isAuthenticated, async (req, res) => {
    const id = Number(req.params.id);
    const userId = getCurrentUserId(req)!;
    
    const product = await storage.getProduct(id);
    if (!product) {
      return res.status(404).json({ message: "Listing not found" });
    }
    if (product.sellerId !== userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    await storage.markAsSold(id);
    res.json({ message: "Listing marked as sold and removed" });
  });

  // App settings (public)
  app.get("/api/settings", async (req, res) => {
    const settings = await storage.getAppSettings();
    res.json(settings || {});
  });

  // ========== ADMIN ROUTES ==========
  
  // Get all pending listings
  app.get("/api/admin/listings/pending", isAuthenticated, isAdmin, async (req, res) => {
    const listings = await storage.getPendingProducts();
    res.json(listings);
  });

  // Get all listings
  app.get("/api/admin/listings", isAuthenticated, isAdmin, async (req, res) => {
    const listings = await storage.getAllProducts();
    res.json(listings);
  });

  // Approve a listing
  app.post("/api/admin/listings/:id/approve", isAuthenticated, isAdmin, async (req, res) => {
    const id = Number(req.params.id);
    const product = await storage.approveProduct(id);
    if (!product) {
      return res.status(404).json({ message: "Listing not found" });
    }
    res.json(product);
  });

  // Reject a listing and refund credit
  app.post("/api/admin/listings/:id/reject", isAuthenticated, isAdmin, async (req, res) => {
    const id = Number(req.params.id);
    const { reason } = req.body;
    
    // Get the product first to get seller ID and category
    const existingProduct = await storage.getProduct(id);
    if (!existingProduct) {
      return res.status(404).json({ message: "Listing not found" });
    }
    
    const product = await storage.rejectProduct(id, reason || "Rejected by admin");
    
    // Refund credit to seller if subscription is enabled
    const subscriptionEnabled = await storage.isSubscriptionEnabled();
    if (subscriptionEnabled && existingProduct.sellerId) {
      const category = existingProduct.mainCategory as "Spare Parts" | "Automotive";
      await storage.refundCredit(existingProduct.sellerId, category);
    }
    
    res.json(product);
  });

  // Delete a listing (admin)
  app.delete("/api/admin/listings/:id", isAuthenticated, isAdmin, async (req, res) => {
    const id = Number(req.params.id);
    await storage.deleteProduct(id);
    res.sendStatus(204);
  });

  // Update app settings
  app.put("/api/admin/settings", isAuthenticated, isAdmin, async (req, res) => {
    const settings = await storage.updateAppSettings(req.body);
    res.json(settings);
  });

  // Add credits to user (admin) - category-specific
  app.post("/api/admin/users/:userId/credits", isAuthenticated, isAdmin, async (req, res) => {
    const userId = req.params.userId as string;
    const { amount, category } = req.body;
    if (!amount || amount < 1) {
      return res.status(400).json({ message: "Invalid amount" });
    }
    if (!category || (category !== "Spare Parts" && category !== "Automotive")) {
      return res.status(400).json({ message: "Invalid category. Must be 'Spare Parts' or 'Automotive'" });
    }
    const user = await storage.addCredits(userId, category, amount);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json(user);
  });

  // Cleanup expired listings (can be called periodically)
  app.post("/api/admin/cleanup-expired", isAuthenticated, isAdmin, async (req, res) => {
    const count = await storage.deleteExpiredProducts();
    res.json({ deletedCount: count });
  });

  // ========== BANNER ROUTES ==========
  
  // Public: Get active banners
  app.get("/api/banners", async (req, res) => {
    const banners = await storage.getActiveBanners();
    res.json(banners);
  });

  // Record product view for recommendations
  app.post("/api/products/:id/view", async (req, res) => {
    const productId = Number(req.params.id);
    const product = await storage.getProduct(productId);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    const userId = getCurrentUserId(req);
    await storage.recordView({
      userId: userId || null,
      sessionId: req.sessionID,
      productId,
      mainCategory: product.mainCategory,
      subCategory: product.subCategory,
    });
    res.json({ recorded: true });
  });

  // Admin: Get all banners
  app.get("/api/admin/banners", isAuthenticated, isAdmin, async (req, res) => {
    const banners = await storage.getAllBanners();
    res.json(banners);
  });

  // Admin: Create banner
  app.post("/api/admin/banners", isAuthenticated, isAdmin, async (req, res) => {
    const banner = await storage.createBanner(req.body);
    res.status(201).json(banner);
  });

  // Admin: Update banner
  app.put("/api/admin/banners/:id", isAuthenticated, isAdmin, async (req, res) => {
    const id = Number(req.params.id);
    const banner = await storage.updateBanner(id, req.body);
    if (!banner) {
      return res.status(404).json({ message: "Banner not found" });
    }
    res.json(banner);
  });

  // Admin: Delete banner
  app.delete("/api/admin/banners/:id", isAuthenticated, isAdmin, async (req, res) => {
    const id = Number(req.params.id);
    await storage.deleteBanner(id);
    res.sendStatus(204);
  });

  // ========== SUBSCRIPTION PACKAGE ROUTES ==========
  
  // Public: Get active packages for a category
  app.get("/api/packages", async (req, res) => {
    const category = req.query.category as string;
    if (category) {
      const packages = await storage.getActivePackages(category);
      res.json(packages);
    } else {
      const packages = await storage.getPackages();
      res.json(packages);
    }
  });

  // Admin: Get all packages
  app.get("/api/admin/packages", isAuthenticated, isAdmin, async (req, res) => {
    const category = req.query.category as string | undefined;
    const packages = await storage.getPackages(category);
    res.json(packages);
  });

  // Admin: Create package
  app.post("/api/admin/packages", isAuthenticated, isAdmin, async (req, res) => {
    const pkg = await storage.createPackage(req.body);
    res.status(201).json(pkg);
  });

  // Admin: Update package
  app.put("/api/admin/packages/:id", isAuthenticated, isAdmin, async (req, res) => {
    const id = Number(req.params.id);
    const pkg = await storage.updatePackage(id, req.body);
    if (!pkg) {
      return res.status(404).json({ message: "Package not found" });
    }
    res.json(pkg);
  });

  // Admin: Delete package
  app.delete("/api/admin/packages/:id", isAuthenticated, isAdmin, async (req, res) => {
    const id = Number(req.params.id);
    await storage.deletePackage(id);
    res.sendStatus(204);
  });

  // ========== REVENUE & TRANSACTIONS ==========
  
  // Admin: Get revenue stats
  app.get("/api/admin/revenue", isAuthenticated, isAdmin, async (req, res) => {
    const stats = await storage.getRevenueStats();
    res.json(stats);
  });

  // Admin: Get transactions
  app.get("/api/admin/transactions", isAuthenticated, isAdmin, async (req, res) => {
    const transactions = await storage.getTransactions();
    res.json(transactions);
  });

  return httpServer;
}
