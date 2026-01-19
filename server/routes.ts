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

  // Products API
  app.get(api.products.list.path, async (req, res) => {
    const search = req.query.search as string | undefined;
    const mainCategory = req.query.mainCategory as string | undefined;
    const subCategory = req.query.subCategory as string | undefined;
    const products = await storage.getProducts({ search, mainCategory, subCategory });
    res.json(products);
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
        // Check if user has credits
        const credits = await storage.getUserCredits(sellerId);
        if (credits < 1) {
          return res.status(402).json({
            message: "You need credits to post a listing. Please purchase credits to continue.",
            code: "INSUFFICIENT_CREDITS",
          });
        }

        // Use 1 credit
        await storage.useCredit(sellerId);
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

  // Favorites API
  app.get("/api/favorites", isAuthenticated, async (req, res) => {
    const userId = getCurrentUserId(req)!;
    const favorites = await storage.getFavorites(userId);
    res.json(favorites);
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

  // User credits API
  app.get("/api/user/credits", isAuthenticated, async (req, res) => {
    const userId = getCurrentUserId(req)!;
    const credits = await storage.getUserCredits(userId);
    const subscriptionEnabled = await storage.isSubscriptionEnabled();
    const [user] = await db.select().from(users).where(eq(users.id, userId));
    res.json({ credits, isAdmin: user?.isAdmin || false, subscriptionEnabled });
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
      if (credits < 1) {
        return res.status(402).json({
          message: "You need credits to repost a listing.",
          code: "INSUFFICIENT_CREDITS",
        });
      }
      await storage.useCredit(userId);
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

  // Reject a listing
  app.post("/api/admin/listings/:id/reject", isAuthenticated, isAdmin, async (req, res) => {
    const id = Number(req.params.id);
    const { reason } = req.body;
    const product = await storage.rejectProduct(id, reason || "Rejected by admin");
    if (!product) {
      return res.status(404).json({ message: "Listing not found" });
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

  // Add credits to user (admin)
  app.post("/api/admin/users/:userId/credits", isAuthenticated, isAdmin, async (req, res) => {
    const userId = req.params.userId as string;
    const { amount } = req.body;
    if (!amount || amount < 1) {
      return res.status(400).json({ message: "Invalid amount" });
    }
    const user = await storage.addCredits(userId, amount);
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

  // Public: Get recent products
  app.get("/api/products/recent", async (req, res) => {
    const limit = Math.min(Number(req.query.limit) || 10, 20);
    const products = await storage.getRecentProducts(limit);
    res.json(products);
  });

  // Public: Get recommended products (For You)
  app.get("/api/products/recommended", async (req, res) => {
    const userId = getCurrentUserId(req);
    const sessionId = req.sessionID;
    const limit = Math.min(Number(req.query.limit) || 10, 20);
    const products = await storage.getRecommendedProducts(userId || undefined, sessionId, limit);
    res.json(products);
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

  return httpServer;
}
