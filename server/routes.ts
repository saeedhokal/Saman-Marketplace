import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { setupSimpleAuth, isAuthenticated, getCurrentUserId } from "./simpleAuth";
import { registerObjectStorageRoutes } from "./replit_integrations/object_storage";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import { MAIN_CATEGORIES, SPARE_PARTS_SUBCATEGORIES, AUTOMOTIVE_SUBCATEGORIES, products, deviceTokens, notifications, transactions, favorites, users, userViews } from "@shared/schema";
import { db } from "./db";
import { eq, sql } from "drizzle-orm";
import path from "path";
import fs from "fs";
import bcrypt from "bcryptjs";
import { translateText, translateListing, detectLanguage, containsArabic } from "./translation";

// Server version for deployment verification
const SERVER_VERSION = "v3.0.2";

// Simple checkout tokens for iOS compatibility (short-lived, single-use)
const checkoutTokens = new Map<string, { userId: string; packageId: number; expires: number }>();

function generateCheckoutToken(userId: string, packageId: number): string {
  const token = `CHK-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
  // Token expires in 5 minutes
  checkoutTokens.set(token, { userId, packageId, expires: Date.now() + 5 * 60 * 1000 });
  return token;
}

function validateAndConsumeCheckoutToken(token: string): { userId: string; packageId: number } | null {
  const data = checkoutTokens.get(token);
  if (!data) return null;
  if (Date.now() > data.expires) {
    checkoutTokens.delete(token);
    return null;
  }
  checkoutTokens.delete(token); // Single use
  return { userId: data.userId, packageId: data.packageId };
}
import {
  registerDeviceToken,
  unregisterDeviceToken,
  notifyNewListing,
  notifyListingApproved,
  notifyListingRejected,
  notifyCreditsAdded,
  sendPushToAdmins,
  sendPushNotification,
  broadcastPushNotification,
} from "./pushNotifications";

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

  // Public health check endpoint (no auth required) for deployment verification
  // In-memory log for Apple Pay session debugging (stores last 10 attempts)
  const applePaySessionLogs: Array<{timestamp: string, step: string, data: any}> = [];
  function logApplePaySession(step: string, data: any) {
    applePaySessionLogs.push({ timestamp: new Date().toISOString(), step, data });
    if (applePaySessionLogs.length > 50) applePaySessionLogs.shift();
  }
  
  // Debug endpoint to check Apple Pay config (no auth required - just checks presence not values)
  app.get("/api/debug/applepay-config", (req, res) => {
    const certBase64 = process.env.APPLE_PAY_CERT;
    const keyBase64 = process.env.APPLE_PAY_KEY;
    const merchantId = process.env.APPLE_PAY_MERCHANT_ID;
    
    res.json({
      merchantId: merchantId || "NOT SET",
      certExists: !!certBase64,
      certLength: certBase64?.length || 0,
      keyExists: !!keyBase64,
      keyLength: keyBase64?.length || 0,
      certStart: certBase64 ? Buffer.from(certBase64, 'base64').toString('utf-8').substring(0, 27) : "N/A",
      keyStart: keyBase64 ? Buffer.from(keyBase64, 'base64').toString('utf-8').substring(0, 27) : "N/A",
    });
  });
  
  // Debug endpoint to view Apple Pay session logs
  app.get("/api/debug/applepay-logs", (req, res) => {
    res.json({
      count: applePaySessionLogs.length,
      logs: applePaySessionLogs.slice(-20)
    });
  });
  
  // Endpoint for client to report Apple Pay status (for debugging iOS app)
  app.post("/api/debug/applepay-client-log", (req, res) => {
    logApplePaySession("CLIENT_LOG", req.body);
    res.json({ ok: true });
  });

  app.get("/api/health", async (req, res) => {
    try {
      const userCount = await db.select({ count: sql`count(*)` }).from(users);
      const tokenCount = await db.select({ count: sql`count(*)` }).from(deviceTokens);
      res.json({
        status: "ok",
        version: SERVER_VERSION,
        users: Number(userCount[0]?.count || 0),
        tokens: Number(tokenCount[0]?.count || 0),
        timestamp: new Date().toISOString()
      });
    } catch (error: any) {
      res.json({
        status: "error",
        version: SERVER_VERSION,
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
  });

  // One-time fix endpoint to reset user 971507242111
  app.get("/api/fix-user-saeed", async (req, res) => {
    try {
      const phone = '971507242111';
      const phonesToDelete = [phone, phone + '_old', phone + '_alt'];
      
      // Get user IDs to clean up
      const usersToDelete = await db.select({ id: users.id }).from(users)
        .where(sql`${users.phone} IN (${sql.raw(phonesToDelete.map(p => `'${p}'`).join(','))})`);
      
      const userIds = usersToDelete.map(u => u.id);
      
      if (userIds.length > 0) {
        // Clean up all foreign key references using raw SQL
        for (const userId of userIds) {
          await db.execute(sql`DELETE FROM transactions WHERE user_id = ${userId}`);
          await db.execute(sql`DELETE FROM user_views WHERE user_id = ${userId}`);
          await db.execute(sql`DELETE FROM device_tokens WHERE user_id = ${userId}`);
          await db.execute(sql`DELETE FROM notifications WHERE user_id = ${userId}`);
          await db.execute(sql`DELETE FROM favorites WHERE user_id = ${userId}`);
          await db.execute(sql`UPDATE products SET seller_id = 'demo_seller_1' WHERE seller_id = ${userId}`);
        }
        
        // Now delete users
        for (const p of phonesToDelete) {
          await db.delete(users).where(eq(users.phone, p));
        }
      }
      
      // Create fresh admin user with password "1234"
      const hashedPassword = await bcrypt.hash('1234', 10);
      const [newUser] = await db.insert(users).values({
        id: crypto.randomUUID(),
        phone: phone,
        firstName: 'Saeed',
        lastName: 'Hokal',
        password: hashedPassword,
        isAdmin: true,
        sparePartsCredits: 10,
        automotiveCredits: 10,
      }).returning();
      
      res.json({
        success: true,
        message: 'User reset successfully',
        user: {
          id: newUser.id,
          phone: newUser.phone,
          isAdmin: newUser.isAdmin,
          sparePartsCredits: newUser.sparePartsCredits,
          automotiveCredits: newUser.automotiveCredits,
        }
      });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // One-time endpoint to add missing credit from failed redirect
  app.get("/api/add-missing-credit-jan27", async (req, res) => {
    try {
      const phone = '971507242111';
      const result = await db.execute(sql`
        UPDATE users 
        SET spare_parts_credits = spare_parts_credits + 1 
        WHERE phone = ${phone}
        RETURNING id, phone, spare_parts_credits, automotive_credits
      `);
      
      if (result.rows && result.rows.length > 0) {
        res.json({
          success: true,
          message: 'Added 1 Spare Parts credit for failed payment redirect on Jan 27',
          user: result.rows[0]
        });
      } else {
        res.status(404).json({ success: false, error: 'User not found' });
      }
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // Debug endpoint to check APNs configuration
  app.get("/api/debug-apns", async (req, res) => {
    const apnsKey = process.env.APNS_AUTH_KEY;
    const hasKey = !!apnsKey;
    const keyLength = apnsKey?.length || 0;
    const keyStart = apnsKey?.substring(0, 30) || 'N/A';
    const keyEnd = apnsKey?.substring(apnsKey.length - 20) || 'N/A';
    const hasBeginMarker = apnsKey?.includes('BEGIN PRIVATE KEY') || false;
    const hasEndMarker = apnsKey?.includes('END PRIVATE KEY') || false;
    const hasLiteralNewlines = apnsKey?.includes('\\n') || false;
    const hasRealNewlines = apnsKey?.includes('\n') || false;
    
    // Try to initialize and get error
    const { getApnInitError } = await import('./pushNotifications');
    const initError = getApnInitError();
    
    // Try a test send to trigger initialization
    try {
      const { broadcastPushNotification } = await import('./pushNotifications');
      // Don't actually send, just trigger init by checking
    } catch (e) {}
    
    res.json({
      hasKey,
      keyLength,
      keyStart: hasKey ? keyStart + '...' : 'N/A',
      keyEnd: hasKey ? '...' + keyEnd : 'N/A',
      hasBeginMarker,
      hasEndMarker,
      hasLiteralNewlines,
      hasRealNewlines,
      initError,
      keyId: '6CM9536S2R',
      teamId: 'KQ542Q98H2',
      bundleId: 'com.saeed.saman'
    });
  });

  // Quick test endpoint to send broadcast notification (for debugging)
  app.get("/api/test-push", async (req, res) => {
    try {
      console.log('[TEST-PUSH] Sending test broadcast notification');
      const result = await broadcastPushNotification({
        title: 'Test Notification',
        body: 'Push notifications are working!',
      });
      console.log('[TEST-PUSH] Result:', result);
      res.json({ 
        success: true, 
        sent: result.sent, 
        failed: result.failed,
        saved: result.saved,
        errors: result.errors || [],
        message: `Test sent to ${result.sent} devices`
      });
    } catch (error: any) {
      console.error('[TEST-PUSH] Error:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  });
  
  // Test token registration endpoint (for debugging)
  app.post("/api/admin/test-token", isAuthenticated, isAdmin, async (req, res) => {
    const userId = getCurrentUserId(req)!;
    const testToken = `test_token_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
    
    try {
      console.log(`[Token Test] Creating test token for admin user ${userId}`);
      
      // Insert a test token
      await db.insert(deviceTokens).values({
        userId,
        fcmToken: testToken,
        deviceOs: 'ios',
        deviceName: 'Test Device',
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      
      // Count tokens
      const tokenCount = await db.select({ count: sql`count(*)` }).from(deviceTokens);
      
      res.json({
        success: true,
        message: "Test token created",
        tokenCount: Number(tokenCount[0]?.count || 0),
        testTokenPrefix: testToken.substring(0, 30)
      });
    } catch (error: any) {
      console.error('[Token Test] Error:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // Apple Pay domain verification is handled in server/index.ts with embedded content

  // Download endpoints for Apple Pay PEM files (for Telr)
  app.get("/download/certPem.pem", (req, res) => {
    const filePath = path.resolve(process.cwd(), "certs", "certPem.pem");
    if (fs.existsSync(filePath)) {
      res.download(filePath, "certPem.pem");
    } else {
      res.status(404).send("Certificate not found");
    }
  });

  app.get("/download/privatePem.pem", (req, res) => {
    const filePath = path.resolve(process.cwd(), "certs", "privatePem.pem");
    if (fs.existsSync(filePath)) {
      res.download(filePath, "privatePem.pem");
    } else {
      res.status(404).send("Private key not found");
    }
  });

  // PKCS8 format private key (alternative format some processors need)
  app.get("/download/privatePem_pkcs8.pem", (req, res) => {
    const filePath = path.resolve(process.cwd(), "certs", "privatePem_pkcs8.pem");
    if (fs.existsSync(filePath)) {
      res.download(filePath, "privatePem_pkcs8.pem");
    } else {
      res.status(404).send("Private key not found");
    }
  });

  // Original .p12 file (contains both cert and key)
  app.get("/download/apple_pay_key.p12", (req, res) => {
    const filePath = path.resolve(process.cwd(), "certs", "apple_pay_key.p12");
    if (fs.existsSync(filePath)) {
      res.download(filePath, "apple_pay_key.p12");
    } else {
      res.status(404).send("P12 file not found");
    }
  });

  // Helper to add cache-busting timestamp to profile image URLs
  function addCacheBuster(url: string | null): string | null {
    if (!url) return null;
    const separator = url.includes('?') ? '&' : '?';
    return `${url}${separator}_t=${Date.now()}`;
  }

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
    const sellerMap = new Map(sellerProfiles.filter(Boolean).map(s => [s.id, addCacheBuster(s.profileImageUrl)]));
    return productsList.map(p => ({
      ...p,
      sellerProfileImageUrl: sellerMap.get(p.sellerId) || null
    }));
  }

  // Products API - include seller profile image
  app.get(api.products.list.path, async (req, res) => {
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate');
    const search = req.query.search as string | undefined;
    const mainCategory = req.query.mainCategory as string | undefined;
    const subCategory = req.query.subCategory as string | undefined;
    const productsList = await storage.getProducts({ search, mainCategory, subCategory });
    const productsWithSeller = await attachSellerImages(productsList);
    res.json(productsWithSeller);
  });

  // Public: Get recent products (must come before :id route)
  app.get("/api/products/recent", async (req, res) => {
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate');
    const limit = Math.min(Number(req.query.limit) || 10, 20);
    const productsList = await storage.getRecentProducts(limit);
    const productsWithSeller = await attachSellerImages(productsList);
    res.json(productsWithSeller);
  });

  // Public: Get recommended products (must come before :id route)
  app.get("/api/products/recommended", async (req, res) => {
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate');
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
    
    // Attach seller profile image with cache-busting
    let sellerProfileImageUrl = null;
    if (product.sellerId) {
      const [seller] = await db.select({ profileImageUrl: users.profileImageUrl })
        .from(users).where(eq(users.id, product.sellerId));
      sellerProfileImageUrl = addCacheBuster(seller?.profileImageUrl || null);
    }
    
    res.json({ ...product, sellerProfileImageUrl });
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

  // ========================
  // TRANSLATION API ENDPOINTS
  // ========================
  
  // Simple rate limiter for translation (IP-based, 30 requests per minute)
  const translationRateLimiter = new Map<string, { count: number; resetTime: number }>();
  const TRANSLATION_RATE_LIMIT = 30; // requests per minute
  const TRANSLATION_RATE_WINDOW = 60 * 1000; // 1 minute
  
  function checkTranslationRateLimit(ip: string): boolean {
    const now = Date.now();
    const entry = translationRateLimiter.get(ip);
    
    if (!entry || now > entry.resetTime) {
      translationRateLimiter.set(ip, { count: 1, resetTime: now + TRANSLATION_RATE_WINDOW });
      return true;
    }
    
    if (entry.count >= TRANSLATION_RATE_LIMIT) {
      return false;
    }
    
    entry.count++;
    return true;
  }
  
  // Translate a single text field (rate limited)
  app.post("/api/translate", async (req, res) => {
    try {
      const ip = req.ip || req.socket.remoteAddress || 'unknown';
      if (!checkTranslationRateLimit(ip)) {
        return res.status(429).json({ message: "Too many translation requests. Please wait a minute." });
      }
      
      const { text, targetLanguage } = req.body;
      
      if (!text || !targetLanguage) {
        return res.status(400).json({ message: "Text and targetLanguage are required" });
      }
      
      if (targetLanguage !== "arabic" && targetLanguage !== "english") {
        return res.status(400).json({ message: "targetLanguage must be 'arabic' or 'english'" });
      }
      
      // Limit text length to prevent abuse
      if (text.length > 5000) {
        return res.status(400).json({ message: "Text too long. Maximum 5000 characters." });
      }
      
      const translatedText = await translateText(text, targetLanguage);
      res.json({ 
        original: text, 
        translated: translatedText,
        targetLanguage 
      });
    } catch (error) {
      console.error("Translation error:", error);
      res.status(500).json({ message: "Translation failed" });
    }
  });
  
  // Translate a listing (title + description) - rate limited
  app.post("/api/translate/listing", async (req, res) => {
    try {
      const ip = req.ip || req.socket.remoteAddress || 'unknown';
      if (!checkTranslationRateLimit(ip)) {
        return res.status(429).json({ message: "Too many translation requests. Please wait a minute." });
      }
      
      const { title, description, targetLanguage } = req.body;
      
      if (!title || !targetLanguage) {
        return res.status(400).json({ message: "Title and targetLanguage are required" });
      }
      
      if (targetLanguage !== "arabic" && targetLanguage !== "english") {
        return res.status(400).json({ message: "targetLanguage must be 'arabic' or 'english'" });
      }
      
      // Limit text length
      if (title.length > 500 || (description && description.length > 5000)) {
        return res.status(400).json({ message: "Text too long. Title max 500, description max 5000 characters." });
      }
      
      const result = await translateListing(
        title, 
        description || "", 
        targetLanguage
      );
      
      res.json({
        originalTitle: title,
        originalDescription: description || "",
        translatedTitle: result.title,
        translatedDescription: result.description,
        targetLanguage
      });
    } catch (error) {
      console.error("Listing translation error:", error);
      res.status(500).json({ message: "Translation failed" });
    }
  });
  
  // Get product with translation - rate limited
  app.get("/api/products/:id/translated", async (req, res) => {
    try {
      const ip = req.ip || req.socket.remoteAddress || 'unknown';
      if (!checkTranslationRateLimit(ip)) {
        return res.status(429).json({ message: "Too many translation requests. Please wait a minute." });
      }
      
      const id = Number(req.params.id);
      const targetLanguage = req.query.lang as "arabic" | "english";
      
      if (!targetLanguage || (targetLanguage !== "arabic" && targetLanguage !== "english")) {
        return res.status(400).json({ message: "Query param 'lang' must be 'arabic' or 'english'" });
      }
      
      const product = await storage.getProduct(id);
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }
      
      // Check if translation is needed
      const sourceLanguage = detectLanguage(product.title);
      if (
        (sourceLanguage === "arabic" && targetLanguage === "arabic") ||
        (sourceLanguage === "english" && targetLanguage === "english")
      ) {
        // Already in target language
        return res.json({
          ...product,
          translatedTitle: product.title,
          translatedDescription: product.description,
          isTranslated: false
        });
      }
      
      // Translate
      const translation = await translateListing(
        product.title,
        product.description || "",
        targetLanguage
      );
      
      res.json({
        ...product,
        translatedTitle: translation.title,
        translatedDescription: translation.description,
        isTranslated: true
      });
    } catch (error) {
      console.error("Product translation error:", error);
      res.status(500).json({ message: "Translation failed" });
    }
  });
  
  // Detect language of text (no rate limit - just local processing)
  app.post("/api/detect-language", async (req, res) => {
    try {
      const { text } = req.body;
      if (!text) {
        return res.status(400).json({ message: "Text is required" });
      }
      
      const language = detectLanguage(text);
      const hasArabic = containsArabic(text);
      
      res.json({ language, hasArabic });
    } catch (error) {
      console.error("Language detection error:", error);
      res.status(500).json({ message: "Detection failed" });
    }
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
      
      // Notify all admin users about the new listing request
      try {
        const adminUsers = await storage.getAdminUsers();
        for (const admin of adminUsers) {
          await storage.createNotification({
            userId: admin.id,
            type: "new_listing_request",
            title: "New Listing Request",
            message: `A new listing "${product.title}" needs your approval.`,
            relatedId: product.id,
          });
        }
        
        // Get seller name for push notification
        const [seller] = await db.select({ firstName: users.firstName, lastName: users.lastName })
          .from(users).where(eq(users.id, sellerId));
        const sellerName = seller ? `${seller.firstName || ''} ${seller.lastName || ''}`.trim() || 'A user' : 'A user';
        
        // Send push notification to admins
        await notifyNewListing(product.title, sellerName);
      } catch (notifyErr) {
        console.error("Failed to notify admins about new listing:", notifyErr);
      }
      
      res.status(201).json({
        ...product,
        pendingApproval: true,
        message: "Your listing has been submitted and is pending approval. You can check the status in My Listings.",
      });
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

  app.put("/api/products/:id", isAuthenticated, async (req, res) => {
    const id = Number(req.params.id);
    const product = await storage.getProduct(id);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }
    
    const userId = getCurrentUserId(req)!;
    if (product.sellerId !== userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // Validate required fields
    if (!req.body.title || req.body.title.length < 3) {
      return res.status(400).json({ message: "Title must be at least 3 characters" });
    }
    if (!req.body.description || req.body.description.length < 10) {
      return res.status(400).json({ message: "Description must be at least 10 characters" });
    }
    if (!req.body.mainCategory || !req.body.subCategory) {
      return res.status(400).json({ message: "Category is required" });
    }
    if (!req.body.imageUrl) {
      return res.status(400).json({ message: "At least one photo is required" });
    }
    
    // Validate category-subcategory combination
    if (!isValidCategoryPair(req.body.mainCategory, req.body.subCategory)) {
      return res.status(400).json({ message: "Invalid category-subcategory combination" });
    }

    const updates = {
      title: req.body.title,
      description: req.body.description,
      mainCategory: req.body.mainCategory,
      subCategory: req.body.subCategory,
      model: req.body.model || null,
      imageUrl: req.body.imageUrl,
      imageUrls: req.body.imageUrls || null,
      mileage: req.body.mileage || null,
      year: req.body.year || null,
      price: req.body.price || null,
      location: req.body.location || product.location,
      phoneNumber: req.body.phoneNumber || product.phoneNumber,
      whatsappNumber: req.body.whatsappNumber || product.whatsappNumber,
      status: "pending" as const,
    };

    const updated = await storage.updateProduct(id, updates);
    
    // Attach seller profile image with cache-busting
    const [seller] = await db.select({ profileImageUrl: users.profileImageUrl })
      .from(users).where(eq(users.id, userId));
    
    res.json({
      ...updated,
      sellerProfileImageUrl: addCacheBuster(seller?.profileImageUrl || null)
    });
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
    const { displayName, firstName, lastName, profileImageUrl, email } = req.body;
    
    const updateData: Record<string, any> = { updatedAt: new Date() };
    
    if (displayName !== undefined) updateData.displayName = displayName || null;
    if (firstName !== undefined) updateData.firstName = firstName || null;
    if (lastName !== undefined) updateData.lastName = lastName || null;
    if (profileImageUrl !== undefined) updateData.profileImageUrl = profileImageUrl || null;
    if (email !== undefined) updateData.email = email || null;
    
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

  // Simple payment test page - access from Safari to test
  app.get("/test-payment", async (req, res) => {
    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>Payment Test</title>
        <style>
          body { font-family: -apple-system, sans-serif; padding: 20px; background: #1a1a2e; color: white; }
          button { padding: 15px 30px; font-size: 16px; background: #f97316; color: white; border: none; border-radius: 8px; margin: 8px 0; width: 100%; }
          .result { background: #333; padding: 15px; margin: 10px 0; border-radius: 8px; word-break: break-all; white-space: pre-wrap; font-size: 12px; }
          .success { border-left: 4px solid #22c55e; }
          .error { border-left: 4px solid #ef4444; }
          .info { border-left: 4px solid #3b82f6; }
        </style>
      </head>
      <body>
        <h2>Payment Test Page</h2>
        
        <button onclick="testTelrDirect()">1. Test Telr API (Direct)</button>
        <button onclick="testCheckoutNoAuth()">2. Test Checkout (No Login Required)</button>
        <button onclick="checkLoginStatus()">3. Check Login Status</button>
        
        <div id="result"></div>
        
        <script>
          async function testTelrDirect() {
            document.getElementById('result').innerHTML = '<div class="result info">Testing Telr API...</div>';
            try {
              const res = await fetch('/api/test-telr');
              const data = await res.json();
              if (data.success) {
                document.getElementById('result').innerHTML = '<div class="result success">TELR API WORKS!\\n\\nPayment URL: ' + data.paymentUrl + '</div>';
              } else {
                document.getElementById('result').innerHTML = '<div class="result error">TELR FAILED: ' + JSON.stringify(data) + '</div>';
              }
            } catch (err) {
              document.getElementById('result').innerHTML = '<div class="result error">ERROR: ' + err.message + '</div>';
            }
          }
          
          async function testCheckoutNoAuth() {
            document.getElementById('result').innerHTML = '<div class="result info">Testing Checkout (bypasses login)...</div>';
            try {
              const res = await fetch('/api/test-checkout-full');
              const data = await res.json();
              if (data.success) {
                document.getElementById('result').innerHTML = '<div class="result success">CHECKOUT WORKS!\\n\\nPayment URL: ' + data.paymentUrl + '\\n\\nYou can click this link to test payment.</div>';
              } else {
                document.getElementById('result').innerHTML = '<div class="result error">CHECKOUT FAILED: ' + JSON.stringify(data, null, 2) + '</div>';
              }
            } catch (err) {
              document.getElementById('result').innerHTML = '<div class="result error">ERROR: ' + err.message + '</div>';
            }
          }
          
          async function checkLoginStatus() {
            document.getElementById('result').innerHTML = '<div class="result info">Checking login status...</div>';
            try {
              const res = await fetch('/api/auth/user', { credentials: 'include' });
              if (res.ok) {
                const user = await res.json();
                document.getElementById('result').innerHTML = '<div class="result success">LOGGED IN as: ' + (user.firstName || user.email || user.id) + '</div>';
              } else {
                document.getElementById('result').innerHTML = '<div class="result error">NOT LOGGED IN (this is expected in Safari - you are logged in via the iOS app)</div>';
              }
            } catch (err) {
              document.getElementById('result').innerHTML = '<div class="result error">ERROR: ' + err.message + '</div>';
            }
          }
        </script>
      </body>
      </html>
    `);
  });
  
  // Generate checkout token (accepts userId directly for iOS compatibility)
  app.post("/api/checkout-token", async (req, res) => {
    // Try session first, then fall back to userId from body (for iOS)
    let userId = getCurrentUserId(req);
    const { packageId, userId: bodyUserId } = req.body;
    
    // If no session, use userId from request body (iOS compatibility)
    if (!userId && bodyUserId) {
      userId = bodyUserId;
      console.log(`[CHECKOUT-TOKEN] Using userId from body (iOS mode): ${userId}`);
    }
    
    console.log(`[CHECKOUT-TOKEN] Generating token for user ${userId}, package ${packageId}`);
    
    if (!userId) {
      return res.status(401).json({ success: false, message: "Not authenticated" });
    }
    
    if (!packageId) {
      return res.status(400).json({ success: false, message: "Missing packageId" });
    }
    
    // Verify user exists
    const [user] = await db.select().from(users).where(eq(users.id, userId));
    if (!user) {
      return res.status(401).json({ success: false, message: "User not found" });
    }
    
    const token = generateCheckoutToken(userId, packageId);
    console.log(`[CHECKOUT-TOKEN] Generated token: ${token}`);
    
    res.json({ success: true, token });
  });

  // Checkout redirect - uses token for iOS compatibility (no session required)
  app.get("/api/checkout-redirect", async (req, res) => {
    console.log("[CHECKOUT-REDIRECT] Starting...");
    
    const token = req.query.token as string;
    const packageIdDirect = req.query.packageId ? parseInt(req.query.packageId as string) : null;
    
    let userId: string;
    let packageId: number;
    
    // Try token-based auth first (for iOS)
    if (token) {
      const tokenData = validateAndConsumeCheckoutToken(token);
      if (!tokenData) {
        console.log("[CHECKOUT-REDIRECT] Invalid or expired token");
        return res.redirect("/profile/subscription?error=invalid_token");
      }
      userId = tokenData.userId;
      packageId = tokenData.packageId;
      console.log(`[CHECKOUT-REDIRECT] Token valid for user ${userId}, package ${packageId}`);
    } 
    // Fall back to session auth (for browser)
    else if (packageIdDirect && getCurrentUserId(req)) {
      userId = getCurrentUserId(req)!;
      packageId = packageIdDirect;
    } 
    else {
      console.log("[CHECKOUT-REDIRECT] No valid auth method");
      return res.redirect("/profile/subscription?error=not_authenticated");
    }
    
    try {
      const pkg = await storage.getPackage(packageId);
      if (!pkg || !pkg.isActive) {
        return res.redirect("/profile/subscription?error=package_not_found");
      }
      
      const [user] = await db.select().from(users).where(eq(users.id, userId));
      
      const cartId = `SAMAN-${userId}-${packageId}-${Date.now()}`;
      const totalCredits = pkg.credits + (pkg.bonusCredits || 0);
      const amountInAED = pkg.price.toString(); // Price is already in AED
      const baseUrl = "https://thesamanapp.com";
      
      console.log(`[CHECKOUT-REDIRECT] Creating payment: ${amountInAED} AED for ${pkg.name}`);
      
      // Create pending transaction
      const transaction = await storage.createTransaction({
        userId,
        packageId: pkg.id,
        amount: pkg.price,
        credits: totalCredits,
        category: pkg.category,
        paymentMethod: "credit_card",
        paymentReference: cartId,
        status: "pending",
      });
      
      // Get customer IP for 3D Secure
      const forwardedFor = req.headers["x-forwarded-for"];
      const customerIp = typeof forwardedFor === 'string' ? forwardedFor.split(',')[0].trim() : (req.ip || "127.0.0.1");
      
      // Format phone number for Telr (remove leading zero if present)
      let customerPhone = user?.phone || "971500000000";
      if (customerPhone.startsWith("0")) {
        customerPhone = "971" + customerPhone.substring(1);
      }
      
      const telrData = {
        method: "create",
        store: 32400,
        authkey: "3SWWK@m9Mz-5GNtS",
        framed: 0,
        order: {
          cartid: cartId,
          test: 0,
          amount: amountInAED,
          currency: "AED",
          description: `Saman Marketplace - ${pkg.name}`,
        },
        return: {
          authorised: `${baseUrl}/payment/success?cart=${cartId}`,
          declined: `${baseUrl}/payment/declined?cart=${cartId}`,
          cancelled: `${baseUrl}/payment/cancelled?cart=${cartId}`,
        },
        customer: {
          ref: userId,
          email: user?.email || "customer@saman.ae",
          name: {
            title: "",
            forenames: user?.firstName || "Customer",
            surname: user?.lastName || "User",
          },
          address: {
            line1: "Dubai",
            city: "Dubai",
            state: "Dubai",
            country: "AE",
            areacode: "00000",
          },
          phone: customerPhone,
          ip: customerIp,
        },
      };

      const telrResponse = await fetch("https://secure.telr.com/gateway/order.json", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(telrData),
      });

      const telrResult = await telrResponse.json();
      console.log("[CHECKOUT-REDIRECT] Telr response:", JSON.stringify(telrResult));

      if (telrResult.order?.url) {
        await storage.updateTransactionReference(transaction.id, telrResult.order.ref);
        // Redirect directly to Telr payment page
        return res.redirect(telrResult.order.url);
      } else {
        console.error("[CHECKOUT-REDIRECT] Telr failed:", telrResult.error);
        await storage.updateTransactionStatus(transaction.id, "failed");
        return res.redirect("/profile/subscription?error=payment_failed");
      }
    } catch (error: any) {
      console.error("[CHECKOUT-REDIRECT] Error:", error);
      return res.redirect("/profile/subscription?error=server_error");
    }
  });

  // Debug endpoint to see what the iOS app sends
  app.post("/api/debug-checkout", async (req, res) => {
    console.log("=== DEBUG CHECKOUT REQUEST ===");
    console.log("Headers:", JSON.stringify(req.headers, null, 2));
    console.log("Body:", JSON.stringify(req.body, null, 2));
    console.log("Cookies:", req.headers.cookie);
    console.log("Session:", req.session);
    console.log("================================");
    
    res.json({
      received: true,
      body: req.body,
      hasCookie: !!req.headers.cookie,
      hasSession: !!(req.session as any)?.passport?.user,
      timestamp: new Date().toISOString(),
    });
  });

  // Test checkout without authentication - for debugging only
  app.get("/api/test-checkout-full", async (req, res) => {
    console.log("[TEST-CHECKOUT] Testing full checkout flow without auth...");
    
    try {
      // Get first active package
      const pkg = await storage.getPackages();
      const activePkg = pkg.find(p => p.isActive);
      
      if (!activePkg) {
        return res.status(400).json({ success: false, message: "No active packages found" });
      }
      
      const cartId = `TEST-${Date.now()}`;
      const amountInAED = activePkg.price.toString(); // Price is already in AED
      const baseUrl = "https://thesamanapp.com";
      
      console.log(`[TEST-CHECKOUT] Package: ${activePkg.name}, Amount: ${amountInAED} AED`);
      
      const telrData = {
        method: "create",
        store: 32400,
        authkey: "3SWWK@m9Mz-5GNtS",
        framed: 0,
        order: {
          cartid: cartId,
          test: 1, // Test mode for this endpoint
          amount: amountInAED,
          currency: "AED",
          description: `Test: ${activePkg.name}`,
        },
        return: {
          authorised: `${baseUrl}/payment/success?cart=${cartId}`,
          declined: `${baseUrl}/payment/declined?cart=${cartId}`,
          cancelled: `${baseUrl}/payment/cancelled?cart=${cartId}`,
        },
        customer: {
          ref: "test_user",
          email: "test@saman.ae",
          name: { title: "Mr", forenames: "Test", surname: "User" },
          address: { line1: "Dubai", city: "Dubai", state: "Dubai", country: "AE", areacode: "00000" },
          phone: "971500000000",
        },
      };

      console.log("[TEST-CHECKOUT] Sending to Telr...");
      const telrResponse = await fetch("https://secure.telr.com/gateway/order.json", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(telrData),
      });

      const telrResult = await telrResponse.json();
      console.log("[TEST-CHECKOUT] Telr response:", JSON.stringify(telrResult));

      if (telrResult.order?.url) {
        res.json({
          success: true,
          message: "Checkout works! Payment page ready.",
          paymentUrl: telrResult.order.url,
          package: activePkg.name,
          amount: amountInAED + " AED",
        });
      } else {
        res.status(400).json({
          success: false,
          message: "Telr rejected the request",
          error: telrResult.error || telrResult,
        });
      }
    } catch (error: any) {
      console.error("[TEST-CHECKOUT] Error:", error);
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  });

  // Test Telr API directly - for debugging
  app.get("/api/test-telr", async (req, res) => {
    console.log("[TEST-TELR] Starting Telr API test...");
    
    try {
      const telrData = {
        method: "create",
        store: 32400,
        authkey: "3SWWK@m9Mz-5GNtS",
        framed: 0,
        order: {
          cartid: `test_${Date.now()}`,
          test: 1, // Test mode
          amount: "1.00",
          currency: "AED",
          description: "API Test Order",
        },
        return: {
          authorised: "https://thesamanapp.com/payment/success",
          declined: "https://thesamanapp.com/payment/declined",
          cancelled: "https://thesamanapp.com/payment/cancelled",
        },
        customer: {
          ref: "test_user",
          email: "test@saman.ae",
          name: { title: "Mr", forenames: "Test", surname: "User" },
          address: { line1: "Dubai", city: "Dubai", state: "Dubai", country: "AE", areacode: "00000" },
          phone: "971500000000",
        },
      };

      console.log("[TEST-TELR] Sending request to Telr...");
      const telrResponse = await fetch("https://secure.telr.com/gateway/order.json", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(telrData),
      });

      const telrResult = await telrResponse.json();
      console.log("[TEST-TELR] Response:", JSON.stringify(telrResult));

      if (telrResult.order?.url) {
        res.json({
          success: true,
          message: "Telr API is working!",
          paymentUrl: telrResult.order.url,
          orderRef: telrResult.order.ref,
        });
      } else {
        res.status(400).json({
          success: false,
          message: "Telr API failed",
          error: telrResult.error || telrResult,
        });
      }
    } catch (error: any) {
      console.error("[TEST-TELR] Error:", error);
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  });

  // Checkout - create Telr payment session
  app.post("/api/checkout", isAuthenticated, async (req, res) => {
    console.log("[CHECKOUT] ========== NEW CHECKOUT REQUEST ==========");
    console.log("[CHECKOUT] Body:", JSON.stringify(req.body));
    console.log("[CHECKOUT] User-Agent:", req.headers["user-agent"]);
    
    const userId = getCurrentUserId(req)!;
    console.log("[CHECKOUT] User ID:", userId);
    
    const { packageId, paymentMethod } = req.body;
    
    if (!packageId) {
      console.log("[CHECKOUT] ERROR: No packageId provided");
      return res.status(400).json({ message: "Package ID is required" });
    }

    const pkg = await storage.getPackage(packageId);
    if (!pkg || !pkg.isActive) {
      return res.status(404).json({ message: "Package not found or inactive" });
    }

    const telrStoreId = process.env.TELR_STORE_ID;
    const telrAuthKey = process.env.TELR_AUTH_KEY;
    
    // Get user info for billing
    const [user] = await db.select().from(users).where(eq(users.id, userId));
    
    if (!telrStoreId || !telrAuthKey) {
      // Development mode - process directly without payment gateway
      console.log(`[DEV] Processing payment for package ${pkg.id}: AED ${pkg.price}`);
      
      const totalCredits = pkg.credits + (pkg.bonusCredits || 0);
      const category = pkg.category as "Spare Parts" | "Automotive";
      await storage.addCredits(userId, category, totalCredits);

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
      return res.json({ 
        success: true,
        message: `${totalCredits} ${category} credits added to your account`,
        sparePartsCredits: newCredits.sparePartsCredits,
        automotiveCredits: newCredits.automotiveCredits,
      });
    }

    // Production mode - create Telr payment session
    const cartId = `SAMAN-${userId}-${packageId}-${Date.now()}`;
    const totalCredits = pkg.credits + (pkg.bonusCredits || 0);
    // Use the published URL for payment callbacks - this is the iOS app's domain
    const baseUrl = "https://thesamanapp.com";
    
    // Create pending transaction
    const transaction = await storage.createTransaction({
      userId,
      packageId: pkg.id,
      amount: pkg.price,
      credits: totalCredits,
      category: pkg.category,
      paymentMethod: paymentMethod || "credit_card",
      paymentReference: cartId,
      status: "pending",
    });

    try {
      // Use Telr JSON format (same as old working app)
      const amountInAED = pkg.price.toString(); // Price is already in AED
      console.log(`[TELR] Creating order: cart=${cartId}, amount=${amountInAED} AED, store=${telrStoreId}`);
      
      // Get customer IP for 3D Secure
      const forwardedFor = req.headers["x-forwarded-for"];
      const customerIp = typeof forwardedFor === 'string' ? forwardedFor.split(',')[0].trim() : (req.ip || "127.0.0.1");
      
      // Format phone number for Telr (remove leading zero if present)
      let customerPhone = user?.phone || "971500000000";
      if (customerPhone.startsWith("0")) {
        customerPhone = "971" + customerPhone.substring(1);
      }
      
      // JSON format matching the old working app EXACTLY
      const telrData = {
        method: "create",
        store: 32400,
        authkey: "3SWWK@m9Mz-5GNtS",
        framed: 0,
        order: {
          cartid: cartId,
          test: 0,
          amount: amountInAED,
          currency: "AED",
          description: `Saman Marketplace - ${pkg.name}`,
        },
        return: {
          authorised: `${baseUrl}/payment/success?cart=${cartId}`,
          declined: `${baseUrl}/payment/declined?cart=${cartId}`,
          cancelled: `${baseUrl}/payment/cancelled?cart=${cartId}`,
        },
        customer: {
          ref: userId,
          email: user?.email || "customer@saman.ae",
          name: {
            title: "",
            forenames: user?.firstName || "Customer",
            surname: user?.lastName || "User",
          },
          address: {
            line1: "Dubai",
            city: "Dubai",
            state: "Dubai",
            country: "AE",
            areacode: "00000",
          },
          phone: customerPhone,
          ip: customerIp,
        },
      };

      console.log("[TELR] Sending JSON request:", JSON.stringify(telrData));

      const telrResponse = await fetch("https://secure.telr.com/gateway/order.json", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(telrData),
      });

      const telrResult = await telrResponse.json();
      console.log("[TELR] Order response:", JSON.stringify(telrResult));

      if (telrResult.order?.url) {
        // Update transaction with Telr order reference
        await storage.updateTransactionReference(transaction.id, telrResult.order.ref);
        
        return res.json({
          success: true,
          paymentUrl: telrResult.order.url,
          orderRef: telrResult.order.ref,
          cartId,
        });
      } else {
        console.error("[TELR] Order creation failed:", telrResult.error);
        await storage.updateTransactionStatus(transaction.id, "failed");
        return res.status(400).json({
          success: false,
          message: telrResult.error?.message || "Payment creation failed",
        });
      }
    } catch (error) {
      console.error("[TELR] API error:", error);
      await storage.updateTransactionStatus(transaction.id, "failed");
      return res.status(500).json({
        success: false,
        message: "Payment service unavailable",
      });
    }
  });

  // Apple Pay: Validate merchant session with Apple using TLS client certificates
  app.post("/api/applepay/session", isAuthenticated, async (req, res) => {
    logApplePaySession("REQUEST_RECEIVED", { 
      userId: req.session?.userId, 
      headers: { 'x-user-id': req.headers['x-user-id'] },
      body: req.body 
    });
    console.log("[ApplePay Session] === REQUEST RECEIVED ===");
    console.log("[ApplePay Session] User ID:", req.session?.userId);
    console.log("[ApplePay Session] Body:", JSON.stringify(req.body));
    
    const { validationURL } = req.body;
    
    if (!validationURL) {
      logApplePaySession("ERROR_NO_URL", { message: "No validation URL" });
      console.log("[ApplePay Session] ERROR: No validation URL");
      return res.status(400).json({ message: "Validation URL is required" });
    }

    // SECURITY: Whitelist only Apple Pay validation domains to prevent SSRF
    const allowedDomains = [
      "apple-pay-gateway.apple.com",
      "apple-pay-gateway-nc-pod1.apple.com",
      "apple-pay-gateway-nc-pod2.apple.com",
      "apple-pay-gateway-nc-pod3.apple.com",
      "apple-pay-gateway-nc-pod4.apple.com",
      "apple-pay-gateway-nc-pod5.apple.com",
      "apple-pay-gateway-pr-pod1.apple.com",
      "apple-pay-gateway-pr-pod2.apple.com",
      "apple-pay-gateway-pr-pod3.apple.com",
      "apple-pay-gateway-pr-pod4.apple.com",
      "apple-pay-gateway-pr-pod5.apple.com",
      "apple-pay-gateway-cert.apple.com",
      "cn-apple-pay-gateway.apple.com",
      "cn-apple-pay-gateway-sh-pod1.apple.com",
      "cn-apple-pay-gateway-sh-pod2.apple.com",
      "cn-apple-pay-gateway-sh-pod3.apple.com",
      "cn-apple-pay-gateway-tj-pod1.apple.com",
      "cn-apple-pay-gateway-tj-pod2.apple.com",
      "cn-apple-pay-gateway-tj-pod3.apple.com",
    ];
    
    let parsedUrl: URL;
    try {
      parsedUrl = new URL(validationURL);
      if (!allowedDomains.includes(parsedUrl.hostname)) {
        console.error("[ApplePay] Invalid validation domain:", parsedUrl.hostname);
        return res.status(400).json({ message: "Invalid Apple Pay validation URL" });
      }
    } catch {
      return res.status(400).json({ message: "Invalid validation URL format" });
    }

    const merchantId = process.env.APPLE_PAY_MERCHANT_ID || "merchant.saeed.saman";
    const certBase64 = process.env.APPLE_PAY_CERT;
    const keyBase64 = process.env.APPLE_PAY_KEY;
    // Always use thesamanapp.com - this is the domain registered with Apple Pay
    const domain = "thesamanapp.com";
    
    if (!certBase64 || !keyBase64) {
      logApplePaySession("ERROR_MISSING_CONFIG", { merchantId: !!merchantId, cert: !!certBase64, key: !!keyBase64 });
      console.error("[ApplePay] Missing configuration:", { merchantId: !!merchantId, cert: !!certBase64, key: !!keyBase64 });
      return res.status(400).json({ 
        message: "Apple Pay not fully configured. Certificate and key required.",
        setupRequired: true
      });
    }

    // Handle both base64-encoded and raw PEM formats
    // Also fix newlines that may have been converted to spaces
    let cert = certBase64;
    let key = keyBase64;
    
    // Detect if cert is base64 encoded (doesn't start with -----BEGIN)
    if (!cert.startsWith('-----BEGIN')) {
      try {
        cert = Buffer.from(cert, 'base64').toString('utf-8');
      } catch (e) {
        console.error("[ApplePay] Failed to decode cert from base64:", e);
      }
    }
    
    // Detect if key is base64 encoded (doesn't start with -----BEGIN)
    if (!key.startsWith('-----BEGIN')) {
      try {
        key = Buffer.from(key, 'base64').toString('utf-8');
      } catch (e) {
        console.error("[ApplePay] Failed to decode key from base64:", e);
      }
    }
    
    // Fix newlines: sometimes spaces get inserted instead of newlines
    // The PEM format requires proper line breaks
    cert = cert.replace(/-----BEGIN CERTIFICATE----- /g, '-----BEGIN CERTIFICATE-----\n')
               .replace(/ -----END CERTIFICATE-----/g, '\n-----END CERTIFICATE-----')
               .replace(/([A-Za-z0-9+/=]{64}) /g, '$1\n');
    key = key.replace(/-----BEGIN PRIVATE KEY----- /g, '-----BEGIN PRIVATE KEY-----\n')
             .replace(/ -----END PRIVATE KEY-----/g, '\n-----END PRIVATE KEY-----')
             .replace(/([A-Za-z0-9+/=]{64}) /g, '$1\n');
    
    // Log request details for debugging
    logApplePaySession("SENDING_TO_APPLE", { 
      merchantId,
      domain,
      validationHost: parsedUrl.hostname,
      certLength: cert.length,
      keyLength: key.length
    });
    
    console.log("[ApplePay Session] Cert loaded, starts with:", cert.substring(0, 30));
    console.log("[ApplePay Session] Key loaded, starts with:", key.substring(0, 30));
    console.log("[ApplePay Session] Merchant ID:", merchantId);
    console.log("[ApplePay Session] Domain:", domain);
    console.log("[ApplePay Session] Validation URL host:", parsedUrl.hostname);
    
    const requestBody = JSON.stringify({
      merchantIdentifier: merchantId,
      displayName: "Saman Marketplace",
      initiative: "web",
      initiativeContext: domain,
    });

    // Use https module for TLS client certificate authentication
    const https = await import('https');
    
    const options = {
      hostname: parsedUrl.hostname,
      port: 443,
      path: parsedUrl.pathname,
      method: 'POST',
      cert: cert,
      key: key,
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(requestBody),
      },
    };

    try {
      const merchantSession = await new Promise<any>((resolve, reject) => {
        const request = https.request(options, (response) => {
          let data = '';
          response.on('data', (chunk) => { data += chunk; });
          response.on('end', () => {
            console.log("[ApplePay Session] Apple response status:", response.statusCode);
            console.log("[ApplePay Session] Apple response data length:", data.length);
            if (response.statusCode === 200) {
              try {
                resolve(JSON.parse(data));
              } catch (e) {
                reject(new Error('Invalid JSON response from Apple'));
              }
            } else {
              console.error("[ApplePay] Apple response status:", response.statusCode);
              console.error("[ApplePay] Apple response body:", data);
              reject(new Error(`Apple validation failed: ${response.statusCode} - ${data}`));
            }
          });
        });
        
        request.on('error', (error) => {
          console.error("[ApplePay] Request error:", error);
          reject(error);
        });
        
        request.write(requestBody);
        request.end();
      });

      logApplePaySession("SUCCESS", { sessionKeys: Object.keys(merchantSession) });
      console.log("[ApplePay] Session validated successfully");
      res.json(merchantSession);
    } catch (error: any) {
      logApplePaySession("ERROR_APPLE_VALIDATION", { message: error.message });
      console.error("[ApplePay] Session error:", error.message);
      res.status(500).json({ 
        message: "Apple Pay session validation failed: " + error.message,
      });
    }
  });

  // Apple Pay: Process payment with Telr Remote API
  app.post("/api/applepay/process", isAuthenticated, async (req, res) => {
    const userId = getCurrentUserId(req)!;
    const { packageId, applePayToken, billingContact } = req.body;
    
    if (!packageId || !applePayToken) {
      return res.status(400).json({ message: "Package ID and Apple Pay token are required" });
    }

    const pkg = await storage.getPackage(packageId);
    if (!pkg || !pkg.isActive) {
      return res.status(404).json({ message: "Package not found or inactive" });
    }

    const telrStoreId = process.env.TELR_STORE_ID;
    // Apple Pay (Wallets) uses a DIFFERENT auth key than Hosted Page or Remote API
    const telrAuthKey = process.env.TELR_WALLETS_AUTH_KEY || process.env.TELR_REMOTE_AUTH_KEY || process.env.TELR_AUTH_KEY;
    
    if (!telrStoreId || !telrAuthKey) {
      return res.status(400).json({ message: "Payment gateway not configured" });
    }
    
    console.log("[ApplePay] Using Remote API auth key:", telrAuthKey ? "SET" : "MISSING");

    const [user] = await db.select().from(users).where(eq(users.id, userId));
    const cartId = `SAMAN-AP-${userId}-${packageId}-${Date.now()}`;
    const totalCredits = pkg.credits + (pkg.bonusCredits || 0);

    // Create pending transaction
    const transaction = await storage.createTransaction({
      userId,
      packageId: pkg.id,
      amount: pkg.price,
      credits: totalCredits,
      category: pkg.category,
      paymentMethod: "apple_pay",
      paymentReference: cartId,
      status: "pending",
    });

    try {
      // COMPREHENSIVE DEBUG: Log the FULL token structure to understand what Apple Pay is sending
      console.log("[ApplePay] === COMPLETE TOKEN ANALYSIS ===");
      console.log("[ApplePay] Raw token type:", typeof applePayToken);
      console.log("[ApplePay] FULL token received:", JSON.stringify(applePayToken, null, 2));
      console.log("[ApplePay] Token top-level keys:", JSON.stringify(Object.keys(applePayToken || {})));
      
      // Handle paymentData - it might be a string (UTF-8 serialized JSON) or an object
      let paymentData = applePayToken.paymentData;
      if (typeof paymentData === 'string') {
        console.log("[ApplePay] paymentData is a STRING - parsing it");
        try {
          paymentData = JSON.parse(paymentData);
        } catch (e) {
          console.log("[ApplePay] Failed to parse paymentData string:", e);
        }
      }
      
      if (paymentData) {
        console.log("[ApplePay] PaymentData type:", typeof paymentData);
        console.log("[ApplePay] PaymentData keys:", JSON.stringify(Object.keys(paymentData)));
        console.log("[ApplePay] PaymentData.version:", paymentData.version);
        console.log("[ApplePay] PaymentData.data (first 50 chars):", paymentData.data?.substring?.(0, 50));
        console.log("[ApplePay] PaymentData.signature exists:", !!paymentData.signature);
        if (paymentData.header) {
          console.log("[ApplePay] PaymentData.header keys:", JSON.stringify(Object.keys(paymentData.header)));
          console.log("[ApplePay] Header.ephemeralPublicKey exists:", !!paymentData.header.ephemeralPublicKey);
          console.log("[ApplePay] Header.publicKeyHash exists:", !!paymentData.header.publicKeyHash);
          console.log("[ApplePay] Header.transactionId exists:", !!paymentData.header.transactionId);
        }
      } else {
        console.log("[ApplePay] WARNING: paymentData is EMPTY or UNDEFINED!");
      }
      
      if (applePayToken.paymentMethod) {
        console.log("[ApplePay] PaymentMethod:", JSON.stringify(applePayToken.paymentMethod));
      } else {
        console.log("[ApplePay] WARNING: paymentMethod is EMPTY or UNDEFINED!");
      }
      console.log("[ApplePay] TransactionIdentifier:", applePayToken.transactionIdentifier);
      console.log("[ApplePay] === END TOKEN ANALYSIS ===");
      
      // Validate required fields before sending to Telr
      if (!paymentData || !paymentData.version || !paymentData.data) {
        console.log("[ApplePay] ERROR: Missing required paymentData fields");
        console.log("[ApplePay] paymentData:", JSON.stringify(paymentData));
        return res.status(400).json({
          success: false,
          message: "Invalid Apple Pay token: missing paymentData fields",
          debug: {
            hasPaymentData: !!paymentData,
            hasVersion: !!paymentData?.version,
            hasData: !!paymentData?.data,
          }
        });
      }
      
      // Telr Remote API for Apple Pay
      // Based on exception report format: applepay/token/paymentData/version, etc.
      // The token structure should be the FULL Apple Pay token from the device
      const telrRequest = {
        store: parseInt(telrStoreId),
        authkey: telrAuthKey,
        tran: {
          id: cartId, // Telr requires "id" for Cart ID in Remote API
          class: "ecom",
          type: "sale",
          method: "applepay",
          cartid: cartId,
          amount: pkg.price.toString(), // Price is already in AED
          currency: "AED",
          description: `${pkg.name} - ${totalCredits} ${pkg.category} Credits`,
          test: 0, // Live production mode
        },
        applepay: {
          // Token contains the complete Apple Pay payment token
          token: {
            // paymentData contains: version, data, signature, header
            paymentData: paymentData,
            // paymentMethod contains: displayName, network, type
            paymentMethod: applePayToken.paymentMethod,
            // Transaction identifier from Apple
            transactionIdentifier: applePayToken.transactionIdentifier,
          },
        },
        customer: {
          name: {
            forenames: billingContact?.givenName || user?.firstName || "Customer",
            surname: billingContact?.familyName || user?.lastName || "",
          },
          address: {
            line1: billingContact?.addressLines?.[0] || "Dubai",
            city: billingContact?.locality || "Dubai",
            region: billingContact?.administrativeArea || "Dubai",
            country: billingContact?.countryCode || "AE",
            areacode: billingContact?.postalCode || "00000",
          },
          email: billingContact?.emailAddress || user?.email || "customer@example.com",
        },
      };

      // Log what we're about to send (redacted for security)
      console.log("[ApplePay] === TELR REQUEST STRUCTURE ===");
      console.log("[ApplePay] store:", telrRequest.store);
      console.log("[ApplePay] authkey (first 4 chars):", telrAuthKey?.substring(0, 4) + "...");
      console.log("[ApplePay] tran:", JSON.stringify(telrRequest.tran));
      console.log("[ApplePay] applepay.token.paymentData.version:", paymentData.version);
      console.log("[ApplePay] applepay.token.paymentData.data length:", paymentData.data?.length);
      console.log("[ApplePay] applepay.token.paymentData.signature exists:", !!paymentData.signature);
      console.log("[ApplePay] applepay.token.paymentData.header:", paymentData.header ? JSON.stringify(Object.keys(paymentData.header)) : "MISSING");
      console.log("[ApplePay] applepay.token.paymentMethod:", JSON.stringify(applePayToken.paymentMethod));
      console.log("[ApplePay] applepay.token.transactionIdentifier:", applePayToken.transactionIdentifier ? "[SET]" : "[MISSING]");
      console.log("[ApplePay] customer:", JSON.stringify(telrRequest.customer));
      console.log("[ApplePay] === END TELR REQUEST ===");
      
      const telrResponse = await fetch("https://secure.telr.com/gateway/remote.json", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Accept": "application/json",
        },
        body: JSON.stringify(telrRequest),
      });

      const telrData = await telrResponse.json();
      console.log("[ApplePay] Telr response:", JSON.stringify(telrData));
      
      // Store last Telr response for debugging
      (global as any).lastTelrApplePayResponse = {
        timestamp: new Date().toISOString(),
        request: { ...telrRequest, applepay: { token: "[REDACTED for security]" } },
        response: telrData,
        tokenKeys: Object.keys(applePayToken || {}),
        paymentDataKeys: applePayToken?.paymentData ? Object.keys(applePayToken.paymentData) : [],
        hasPaymentMethod: !!applePayToken?.paymentMethod,
        hasTransactionId: !!applePayToken?.transactionIdentifier,
      };

      // Telr Remote API v2 returns different format than Hosted Page
      // Remote API: transaction.status = "A" (Authorised), transaction.ref = "xxx"
      // Hosted Page: order.status.code = "3", order.ref = "xxx"
      const transactionStatus = telrData.transaction?.status;
      const transactionRef = telrData.transaction?.ref;
      const transactionMessage = telrData.transaction?.message;
      
      // Also check old format for backwards compatibility
      const orderStatusCode = telrData.order?.status?.code;
      const orderRef = telrData.order?.ref;
      
      console.log("[ApplePay] Telr response - transaction.status:", transactionStatus, 
                  "transaction.ref:", transactionRef, "transaction.message:", transactionMessage,
                  "order.status.code:", orderStatusCode, "order.ref:", orderRef);

      // Check for success: Remote API v2 uses transaction.status = "A" for Authorised
      const isAuthorised = transactionStatus === "A" || 
                           transactionMessage === "Authorised" ||
                           orderStatusCode === "3" || 
                           orderStatusCode === 3;
      
      const finalRef = transactionRef || orderRef;

      if (isAuthorised && finalRef) {
        // Payment successful - add credits
        const category = pkg.category as "Spare Parts" | "Automotive";
        await storage.addCredits(userId, category, totalCredits);
        await storage.updateTransactionReference(transaction.id, finalRef);
        await storage.updateTransactionStatus(transaction.id, "completed");

        const newCredits = await storage.getUserCredits(userId);
        console.log("[ApplePay] Payment successful, credits added:", totalCredits, category, "ref:", finalRef);
        return res.json({
          success: true,
          message: `${totalCredits} ${category} credits added to your account!`,
          sparePartsCredits: newCredits.sparePartsCredits,
          automotiveCredits: newCredits.automotiveCredits,
        });
      } else if (orderStatusCode === "2" || orderStatusCode === 2) {
        // Payment pending (hosted page format)
        console.log("[ApplePay] Payment pending, not adding credits yet");
        if (finalRef) {
          await storage.updateTransactionReference(transaction.id, finalRef);
        }
        return res.json({
          success: false,
          pending: true,
          message: "Payment is being processed. Credits will be added once confirmed.",
          orderRef: finalRef,
        });
      } else {
        // Payment failed or declined
        console.error("[ApplePay] Payment failed - transaction:", JSON.stringify(telrData.transaction), 
                      "order:", JSON.stringify(telrData.order), "error:", telrData.error);
        await storage.updateTransactionStatus(transaction.id, "failed");
        
        // Build detailed error message for debugging
        let errorDetail = "";
        if (telrData.error?.message) {
          errorDetail = telrData.error.message;
        } else if (telrData.error?.note) {
          errorDetail = telrData.error.note;
        } else if (transactionMessage) {
          errorDetail = transactionMessage;
        } else if (telrData.message) {
          errorDetail = telrData.message;
        } else {
          errorDetail = `Apple Pay failed (status: ${transactionStatus || orderStatusCode || 'unknown'})`;
        }
        
        return res.status(400).json({
          success: false,
          message: errorDetail,
          debug: { transactionStatus, transactionRef, orderStatusCode, orderRef, error: telrData.error },
        });
      }
    } catch (error) {
      console.error("[ApplePay] Processing error:", error);
      await storage.updateTransactionStatus(transaction.id, "failed");
      return res.status(500).json({
        success: false,
        message: "Payment processing failed",
      });
    }
  });

  // Telr payment verification endpoint
  app.get("/api/payment/verify", isAuthenticated, async (req, res) => {
    const { cart } = req.query;
    const userId = getCurrentUserId(req)!;
    
    if (!cart || typeof cart !== "string") {
      return res.status(400).json({ message: "Cart ID is required" });
    }

    const telrStoreId = process.env.TELR_STORE_ID;
    const telrAuthKey = process.env.TELR_AUTH_KEY;
    
    if (!telrStoreId || !telrAuthKey) {
      return res.status(400).json({ message: "Payment not configured" });
    }

    try {
      // Check order status with Telr
      const telrParams = new URLSearchParams({
        ivp_method: "check",
        ivp_store: telrStoreId,
        ivp_authkey: telrAuthKey,
        order_ref: cart,
      });

      const telrResponse = await fetch("https://secure.telr.com/gateway/order.json", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: telrParams.toString(),
      });

      const telrData = await telrResponse.json();
      console.log("[TELR] Check response:", JSON.stringify(telrData));

      // Find the pending transaction
      const transaction = await storage.getTransactionByReference(cart);
      if (!transaction) {
        return res.status(404).json({ message: "Transaction not found" });
      }

      if (transaction.userId !== userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      // Check if payment was successful (status code 3 = authorized/captured)
      if (telrData.order?.status?.code === "3" || telrData.order?.status?.code === 3) {
        // Payment successful - add credits
        if (transaction.status !== "completed") {
          const pkg = await storage.getPackage(transaction.packageId!);
          if (pkg) {
            const totalCredits = pkg.credits + (pkg.bonusCredits || 0);
            const category = pkg.category as "Spare Parts" | "Automotive";
            await storage.addCredits(userId, category, totalCredits);
            await storage.updateTransactionStatus(transaction.id, "completed");
          }
        }

        const newCredits = await storage.getUserCredits(userId);
        return res.json({
          success: true,
          status: "completed",
          message: "Payment successful! Credits added to your account.",
          sparePartsCredits: newCredits.sparePartsCredits,
          automotiveCredits: newCredits.automotiveCredits,
        });
      } else if (telrData.order?.status?.code === "2" || telrData.order?.status?.code === 2) {
        return res.json({
          success: false,
          status: "pending",
          message: "Payment is still processing...",
        });
      } else {
        await storage.updateTransactionStatus(transaction.id, "failed");
        return res.json({
          success: false,
          status: "failed",
          message: telrData.order?.status?.text || "Payment was not successful",
        });
      }
    } catch (error) {
      console.error("[TELR] Verify error:", error);
      return res.status(500).json({
        success: false,
        message: "Unable to verify payment",
      });
    }
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

  // Get user's transaction history
  app.get("/api/user/transactions", isAuthenticated, async (req, res) => {
    const userId = getCurrentUserId(req)!;
    const transactions = await storage.getTransactions({ userId });
    res.json(transactions);
  });

  // Delete user account
  app.delete("/api/user/account", isAuthenticated, async (req, res) => {
    const userId = getCurrentUserId(req)!;
    
    try {
      // Delete all user's products first
      await storage.deleteUserProducts(userId);
      
      // Delete user favorites
      await storage.deleteUserFavorites(userId);
      
      // Delete user's transactions
      await storage.deleteUserTransactions(userId);
      
      // Delete the user account
      await storage.deleteUser(userId);
      
      // Destroy session
      req.session.destroy((err) => {
        if (err) {
          console.error("Error destroying session:", err);
        }
      });
      
      res.json({ message: "Account deleted successfully" });
    } catch (error) {
      console.error("Error deleting account:", error);
      res.status(500).json({ message: "Failed to delete account" });
    }
  });

  // App settings (public)
  app.get("/api/settings", async (req, res) => {
    const settings = await storage.getAppSettings();
    res.json(settings || {});
  });

  // ========== PUSH NOTIFICATION ROUTES ==========

  // Register device token for push notifications
  app.post("/api/device-token", isAuthenticated, async (req, res) => {
    const userId = getCurrentUserId(req)!;
    const { fcmToken, deviceOs, deviceName } = req.body;
    
    console.log(`[Token] Registering token - userId: ${userId}, os: ${deviceOs || 'unknown'}, tokenLength: ${fcmToken?.length || 0}`);
    
    if (!fcmToken || typeof fcmToken !== 'string' || fcmToken.length < 20) {
      console.log(`[Token] Invalid token - length: ${fcmToken?.length || 0}`);
      return res.status(400).json({ message: "Invalid FCM token" });
    }
    
    const success = await registerDeviceToken(userId, fcmToken, deviceOs, deviceName);
    if (success) {
      console.log(`[Token] Token registered successfully for user ${userId}`);
      res.json({ message: "Device token registered" });
    } else {
      console.log(`[Token] Failed to register token for user ${userId}`);
      res.status(500).json({ message: "Failed to register device token" });
    }
  });

  // Unregister device token (for logout)
  app.delete("/api/device-token", isAuthenticated, async (req, res) => {
    const userId = getCurrentUserId(req)!;
    const { fcmToken } = req.body;
    
    if (!fcmToken) {
      return res.status(400).json({ message: "FCM token required" });
    }
    
    await unregisterDeviceToken(userId, fcmToken);
    res.json({ message: "Device token unregistered" });
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
    
    // Get product before approval to get seller info
    const existingProduct = await storage.getProduct(id);
    if (!existingProduct) {
      return res.status(404).json({ message: "Listing not found" });
    }
    
    const product = await storage.approveProduct(id);
    if (!product) {
      return res.status(404).json({ message: "Listing not found" });
    }
    
    // Create in-app notification for the seller
    if (existingProduct.sellerId) {
      try {
        await storage.createNotification({
          userId: existingProduct.sellerId,
          type: "listing_approved",
          title: "Listing Approved",
          message: `Your listing "${existingProduct.title}" has been approved and is now live!`,
          relatedId: id,
        });
        
        // Send push notification
        await notifyListingApproved(existingProduct.sellerId, existingProduct.title);
        console.log(`[Notification] Sent approval notification for listing ${id}`);
      } catch (notifError) {
        console.error("[Notification] Failed to send approval notification:", notifError);
      }
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
    
    // Create notification for the seller
    if (existingProduct.sellerId) {
      try {
        await storage.createNotification({
          userId: existingProduct.sellerId,
          type: "listing_rejected",
          title: "Listing Rejected",
          message: `Your listing "${existingProduct.title}" has been rejected. Reason: ${reason || "Does not meet our guidelines"}. Your credit has been refunded.`,
          relatedId: id,
        });
        
        // Send push notification
        await notifyListingRejected(existingProduct.sellerId, existingProduct.title, reason);
        console.log(`[Notification] Sent rejection notification for user ${existingProduct.sellerId}`);
      } catch (notifError) {
        console.error("[Notification] Failed to send notification:", notifError);
      }
    }
    
    res.json(product);
  });

  // Delete a listing (admin)
  app.delete("/api/admin/listings/:id", isAuthenticated, isAdmin, async (req, res) => {
    const id = Number(req.params.id);
    const { reason } = req.body || {};
    
    console.log(`[Admin] Delete listing request for id: ${id}, reason: ${reason}`);
    
    // Get the product first to notify the seller
    const product = await storage.getProduct(id);
    console.log(`[Admin] Product found:`, product ? `${product.title} (seller: ${product.sellerId})` : 'NOT FOUND');
    if (product) {
      // Delete the product
      await storage.deleteProduct(id);
      
      // Send notification to the seller
      const message = reason 
        ? `Your listing "${product.title}" has been removed. Reason: ${reason}`
        : `Your listing "${product.title}" has been removed by admin.`;
      
      await storage.createNotification({
        userId: product.sellerId,
        title: "Listing Removed",
        message,
        type: "listing_removed",
      });
      
      // Also send push notification
      try {
        await notifyListingRejected(product.sellerId, product.title, reason || "Removed by admin");
      } catch (e) {
        console.log("Push notification failed:", e);
      }
    }
    
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
    
    // Create notification and send push
    try {
      await storage.createNotification({
        userId,
        type: "credits_added",
        title: "Credits Added",
        message: `${amount} ${category} credits have been added to your account!`,
      });
      await notifyCreditsAdded(userId, amount, category);
    } catch (err) {
      console.error("Failed to send credits notification:", err);
    }
    
    res.json(user);
  });

  // Admin: Update user email (for fixing 3D Secure issues)
  app.post("/api/admin/user/:userId/email", isAuthenticated, isAdmin, async (req, res) => {
    const targetUserId = req.params.userId as string;
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }
    
    await db.update(users)
      .set({ email, updatedAt: new Date() })
      .where(sql`id = ${targetUserId}`);
    
    const [updated] = await db.select({
      id: users.id,
      phone: users.phone,
      email: users.email,
      firstName: users.firstName,
      lastName: users.lastName,
    }).from(users).where(sql`id = ${targetUserId}`);
    
    if (!updated) {
      return res.status(404).json({ message: "User not found" });
    }
    
    res.json({ message: "Email updated", user: updated });
  });

  // Bootstrap: Clean up and delete all accounts with owner phone number
  app.delete("/api/bootstrap/cleanup-owner-accounts", async (req, res) => {
    const ownerPhone = "971507242111";
    
    // Find all accounts with this phone (any format)
    const accounts = await db.select().from(users).where(
      sql`phone LIKE ${'%' + ownerPhone}`
    );
    
    if (accounts.length === 0) {
      return res.json({ message: "No accounts found to delete" });
    }
    
    const deletedIds: string[] = [];
    
    for (const account of accounts) {
      // Delete all related data
      await db.delete(deviceTokens).where(sql`user_id = ${account.id}`);
      await db.delete(notifications).where(sql`user_id = ${account.id}`);
      await db.delete(favorites).where(sql`user_id = ${account.id}`);
      await db.delete(userViews).where(sql`user_id = ${account.id}`);
      await db.delete(transactions).where(sql`user_id = ${account.id}`);
      await db.delete(products).where(sql`seller_id = ${account.id}`);
      await db.delete(users).where(sql`id = ${account.id}`);
      deletedIds.push(account.id);
    }
    
    res.json({ 
      message: `Deleted ${accounts.length} account(s)`, 
      deletedIds,
      phones: accounts.map(a => a.phone)
    });
  });

  // Bootstrap: Make the owner admin (one-time use for setup)
  app.post("/api/bootstrap/make-owner-admin", async (req, res) => {
    const ownerPhone = "971507242111";
    
    const [user] = await db.select().from(users).where(sql`phone = ${ownerPhone} OR phone = ${'+' + ownerPhone}`);
    
    if (!user) {
      return res.status(404).json({ message: "Owner account not found" });
    }
    
    await db.update(users)
      .set({ isAdmin: true, updatedAt: new Date() })
      .where(sql`id = ${user.id}`);
    
    res.json({ message: "Owner is now admin", userId: user.id, phone: user.phone });
  });

  // Admin: Make a user admin
  app.post("/api/admin/user/:userId/make-admin", isAuthenticated, isAdmin, async (req, res) => {
    const targetUserId = req.params.userId as string;
    
    await db.update(users)
      .set({ isAdmin: true, updatedAt: new Date() })
      .where(sql`id = ${targetUserId}`);
    
    const [updated] = await db.select({
      id: users.id,
      phone: users.phone,
      firstName: users.firstName,
      isAdmin: users.isAdmin,
    }).from(users).where(sql`id = ${targetUserId}`);
    
    if (!updated) {
      return res.status(404).json({ message: "User not found" });
    }
    
    res.json({ message: "User is now admin", user: updated });
  });

  // Admin: Reset user account (delete user and all related data for fresh start)
  app.delete("/api/admin/user/:userId/reset", isAuthenticated, isAdmin, async (req, res) => {
    const targetUserId = req.params.userId as string;
    
    try {
      // Get user info before deletion
      const [userToDelete] = await db.select().from(users).where(sql`id = ${targetUserId}`);
      if (!userToDelete) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Delete in order (respecting foreign key constraints)
      // 1. Delete device tokens
      await db.delete(deviceTokens).where(sql`user_id = ${targetUserId}`);
      
      // 2. Delete notifications
      await db.delete(notifications).where(sql`user_id = ${targetUserId}`);
      
      // 3. Delete favorites
      await db.delete(favorites).where(sql`user_id = ${targetUserId}`);
      
      // 4. Delete user views
      await db.delete(userViews).where(sql`user_id = ${targetUserId}`);
      
      // 5. Delete transactions
      await db.delete(transactions).where(sql`user_id = ${targetUserId}`);
      
      // 6. Delete user's products
      await db.delete(products).where(sql`seller_id = ${targetUserId}`);
      
      // 7. Delete the user
      await db.delete(users).where(sql`id = ${targetUserId}`);
      
      res.json({ 
        message: "User account reset successfully", 
        deletedUser: {
          id: userToDelete.id,
          phone: userToDelete.phone,
          email: userToDelete.email,
        }
      });
    } catch (error) {
      console.error("[Admin] Error resetting user:", error);
      res.status(500).json({ message: "Failed to reset user account" });
    }
  });

  // Cleanup expired listings (can be called periodically)
  app.post("/api/admin/cleanup-expired", isAuthenticated, isAdmin, async (req, res) => {
    const count = await storage.deleteExpiredProducts();
    res.json({ deletedCount: count });
  });

  // Admin: Apple Pay debug endpoint
  app.get("/api/admin/applepay-debug", isAuthenticated, isAdmin, async (req, res) => {
    res.json({
      lastResponse: (global as any).lastTelrApplePayResponse || "No Apple Pay attempts yet",
      telrConfigured: !!(process.env.TELR_STORE_ID && process.env.TELR_AUTH_KEY),
    });
  });

  // TEMPORARY: Public Apple Pay debug endpoint for troubleshooting
  // This will be removed after Apple Pay is working
  app.get("/api/applepay-debug-public", (req, res) => {
    const lastResponse = (global as any).lastTelrApplePayResponse;
    res.json({
      timestamp: new Date().toISOString(),
      hasAttempt: !!lastResponse,
      lastAttempt: lastResponse || "No Apple Pay attempts recorded on this server instance",
      serverUptime: process.uptime(),
    });
  });

  // TEMPORARY: Force sync subscription packages (for fixing production duplicates)
  app.get("/api/fix-packages", async (req, res) => {
    try {
      console.log("[FIX-PACKAGES] Manually triggered package sync...");
      
      // Define the correct packages
      const correctPackages = [
        { name: "Spare Part Basic", price: 30, credits: 1, bonusCredits: 0, category: "Spare Parts", sortOrder: 1 },
        { name: "Spare Part Standard", price: 150, credits: 5, bonusCredits: 1, category: "Spare Parts", sortOrder: 2 },
        { name: "Spare Part Advanced", price: 600, credits: 20, bonusCredits: 7, category: "Spare Parts", sortOrder: 3 },
        { name: "Automotive Basic", price: 75, credits: 1, bonusCredits: 0, category: "Automotive", sortOrder: 4 },
        { name: "Automotive Standard", price: 210, credits: 3, bonusCredits: 0, category: "Automotive", sortOrder: 5 },
        { name: "Automotive Premium", price: 420, credits: 6, bonusCredits: 2, category: "Automotive", sortOrder: 6 },
      ];
      
      // Get current packages
      const currentPackages = await storage.getPackages();
      console.log(`[FIX-PACKAGES] Found ${currentPackages.length} existing packages`);
      
      // First, unlink all transactions from packages (set package_id to null)
      await db.update(transactions).set({ packageId: null });
      console.log("[FIX-PACKAGES] Unlinked transactions from packages");
      
      // Delete all existing packages
      for (const pkg of currentPackages) {
        await storage.deletePackage(pkg.id);
      }
      console.log("[FIX-PACKAGES] Deleted all existing packages");
      
      // Create the correct packages
      for (const pkg of correctPackages) {
        await storage.createPackage({
          ...pkg,
          isActive: true,
        });
      }
      console.log("[FIX-PACKAGES] Created 6 correct packages");
      
      // Verify
      const newPackages = await storage.getPackages();
      
      res.json({
        success: true,
        message: `Fixed! Deleted ${currentPackages.length} old packages, created ${newPackages.length} correct packages`,
        packages: newPackages.map(p => ({ name: p.name, price: p.price, category: p.category })),
      });
    } catch (error) {
      console.error("[FIX-PACKAGES] Error:", error);
      res.status(500).json({ error: String(error) });
    }
  });

  // Admin: Database diagnostic endpoint
  app.get("/api/admin/db-status", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const userCount = await db.select({ count: sql`count(*)` }).from(users);
      const tokenCount = await db.select({ count: sql`count(*)` }).from(deviceTokens);
      const notifCount = await db.select({ count: sql`count(*)` }).from(notifications);
      
      // Get token details
      const tokens = await db.select({
        id: deviceTokens.id,
        deviceOs: deviceTokens.deviceOs,
        tokenPrefix: sql`substring(${deviceTokens.fcmToken}, 1, 30)`,
      }).from(deviceTokens);
      
      // Get user IDs for debugging
      const userIds = await db.select({ id: users.id }).from(users).limit(10);
      
      res.json({
        version: SERVER_VERSION,
        users: Number(userCount[0]?.count || 0),
        userIds: userIds.map(u => u.id.substring(0, 8) + '...'),
        deviceTokens: Number(tokenCount[0]?.count || 0),
        notifications: Number(notifCount[0]?.count || 0),
        tokenDetails: tokens,
        apnsKeyConfigured: !!process.env.APNS_AUTH_KEY,
        apnsKeyLength: process.env.APNS_AUTH_KEY?.length || 0,
        databaseUrl: process.env.DATABASE_URL ? 'configured' : 'missing',
        databaseConnected: true,
        timestamp: new Date().toISOString()
      });
    } catch (error: any) {
      res.json({
        version: SERVER_VERSION,
        databaseConnected: false,
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
  });

  // Admin: Broadcast push notification to all users
  app.post("/api/admin/broadcast", isAuthenticated, isAdmin, async (req, res) => {
    const { title, body, scheduleType, delayMinutes, scheduledDate, scheduledTime } = req.body;
    
    if (!title || !body) {
      return res.status(400).json({ message: "Title and body are required" });
    }
    
    try {
      // Calculate delay in milliseconds based on schedule type
      let delayMs = 0;
      let scheduledFor: Date | null = null;
      
      if (scheduleType === "delay" && delayMinutes > 0) {
        delayMs = delayMinutes * 60 * 1000;
        scheduledFor = new Date(Date.now() + delayMs);
        console.log(`[BROADCAST] Scheduling with ${delayMinutes} minute delay, will send at:`, scheduledFor);
      } else if (scheduleType === "scheduled" && scheduledDate && scheduledTime) {
        const scheduledDateTime = new Date(`${scheduledDate}T${scheduledTime}`);
        delayMs = scheduledDateTime.getTime() - Date.now();
        if (delayMs < 0) {
          return res.status(400).json({ message: "Scheduled time must be in the future" });
        }
        scheduledFor = scheduledDateTime;
        console.log(`[BROADCAST] Scheduling for specific time:`, scheduledFor);
      }
      
      if (delayMs > 0) {
        // Schedule the broadcast for later
        setTimeout(async () => {
          try {
            console.log('[BROADCAST] Executing scheduled broadcast:', { title, body });
            const result = await broadcastPushNotification({ title, body });
            console.log('[BROADCAST] Scheduled broadcast result:', result);
          } catch (error) {
            console.error('[BROADCAST] Scheduled broadcast error:', error);
          }
        }, delayMs);
        
        res.json({ 
          success: true, 
          scheduled: true,
          scheduledFor: scheduledFor?.toISOString(),
          message: `Notification scheduled for ${scheduledFor?.toLocaleString()}`,
          version: SERVER_VERSION
        });
      } else {
        // Send immediately
        console.log('[BROADCAST] Starting broadcast:', { title, body });
        const result = await broadcastPushNotification({ title, body });
        console.log('[BROADCAST] Result:', result);
        
        res.json({ 
          success: true, 
          sent: result.sent, 
          failed: result.failed,
          savedCount: result.saved,
          message: `Saved to ${result.saved} inboxes, sent to ${result.sent} devices`,
          version: SERVER_VERSION
        });
      }
    } catch (error) {
      console.error('[BROADCAST] Error:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Broadcast failed: ' + (error instanceof Error ? error.message : 'Unknown error'),
        version: SERVER_VERSION
      });
    }
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

  // ========== USER MANAGEMENT ==========

  // Admin: Get all users
  app.get("/api/admin/users", isAuthenticated, isAdmin, async (req, res) => {
    const allUsers = await storage.getAllUsers();
    res.json(allUsers);
  });

  // Admin: Get user by ID
  app.get("/api/admin/users/:id", isAuthenticated, isAdmin, async (req, res) => {
    const userId = String(req.params.id);
    const user = await storage.getUserById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json(user);
  });

  // Admin: Delete user account
  app.delete("/api/admin/users/:id", isAuthenticated, isAdmin, async (req, res) => {
    const userId = String(req.params.id);
    const user = await storage.getUserById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    // Don't allow deleting admin accounts
    if (user.isAdmin) {
      return res.status(403).json({ message: "Cannot delete admin accounts" });
    }
    
    // Delete user's data first (cascade delete all related data)
    await storage.deleteUserProducts(userId);
    await storage.deleteUserFavorites(userId);
    await storage.deleteUserTransactions(userId);
    await storage.deleteUserNotifications(userId);
    await storage.deleteUserDeviceTokens(userId);
    await storage.deleteUser(userId);
    
    res.json({ message: "User account deleted successfully" });
  });

  // ========== REVENUE & TRANSACTIONS ==========
  
  // Admin: Get revenue stats
  app.get("/api/admin/revenue", isAuthenticated, isAdmin, async (req, res) => {
    const stats = await storage.getRevenueStats();
    res.json(stats);
  });

  // Admin: Get detailed revenue stats with time period filter
  app.get("/api/admin/revenue/detailed", isAuthenticated, isAdmin, async (req, res) => {
    const period = (req.query.period as 'day' | 'week' | 'month' | 'year' | 'all' | 'custom') || 'all';
    const startDate = req.query.startDate as string | undefined;
    const endDate = req.query.endDate as string | undefined;
    const stats = await storage.getDetailedRevenueStats(period, startDate, endDate);
    res.json(stats);
  });

  // Admin: Get transactions
  app.get("/api/admin/transactions", isAuthenticated, isAdmin, async (req, res) => {
    const transactions = await storage.getTransactions();
    res.json(transactions);
  });

  // Admin: Reset all transactions (clear revenue data)
  app.delete("/api/admin/transactions/reset", isAuthenticated, isAdmin, async (req, res) => {
    try {
      await db.execute(sql`DELETE FROM transactions`);
      res.json({ message: "All transactions have been reset", success: true });
    } catch (error) {
      console.error("Error resetting transactions:", error);
      res.status(500).json({ message: "Failed to reset transactions" });
    }
  });

  // Admin: Seed demo listings for production review
  app.post("/api/admin/seed-demo", isAuthenticated, isAdmin, async (req, res) => {
    try {
      // First, create demo seller users (ignore if they already exist)
      const demoUsers = [
        { id: "demo_seller_1", phone: "+971500000001", firstName: "Ahmed", lastName: "Auto Parts", isAdmin: false },
        { id: "demo_seller_2", phone: "+971500000002", firstName: "Gulf", lastName: "Motors", isAdmin: false },
        { id: "demo_seller_3", phone: "+971500000003", firstName: "Emirates", lastName: "Cars", isAdmin: false },
      ];
      
      for (const user of demoUsers) {
        try {
          await db.insert(users).values(user).onConflictDoNothing();
        } catch (e) {
          // User might already exist, continue
        }
      }

      const demoListings = [
        {
          title: "BMW E46 Headlight Assembly - Original",
          description: "Genuine BMW headlight assembly for E46 3-series (1999-2006). Left side, in excellent working condition. Crystal clear lens, no cracks or yellowing. Plug and play installation.",
          price: 85000, // AED 850
          imageUrl: "https://images.unsplash.com/photo-1489824904134-891ab64532f1?w=800",
          mainCategory: "Spare Parts",
          subCategory: "Body Parts",
          condition: "used",
          sellerId: "demo_seller_1",
          status: "approved",
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
        {
          title: "Mercedes W204 Front Bumper - Genuine",
          description: "Original Mercedes-Benz front bumper for C-Class W204 (2007-2014). Minor scratches, ready for paint. Includes all mounting brackets and hardware. AMG Sport package compatible.",
          price: 120000, // AED 1,200
          imageUrl: "https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=800",
          mainCategory: "Spare Parts",
          subCategory: "Body Parts",
          condition: "used",
          sellerId: "demo_seller_1",
          status: "approved",
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
        {
          title: "Toyota Camry 2020 Engine - Low Mileage",
          description: "2.5L 4-cylinder engine from 2020 Camry. Only 45,000 km, fully tested and inspected. Complete with all sensors and accessories. Perfect for engine swap or replacement.",
          price: 850000, // AED 8,500
          imageUrl: "https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=800",
          mainCategory: "Spare Parts",
          subCategory: "Engine Parts",
          condition: "used",
          sellerId: "demo_seller_2",
          status: "approved",
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
        {
          title: "Nissan Patrol Y62 Transmission - Excellent",
          description: "Automatic transmission for 2019 Nissan Patrol Y62. Only 50,000 km, excellent condition. Smooth shifting, no issues. Includes torque converter and transfer case.",
          price: 650000, // AED 6,500
          imageUrl: "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=800",
          mainCategory: "Spare Parts",
          subCategory: "Transmission",
          condition: "used",
          sellerId: "demo_seller_2",
          status: "approved",
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
        {
          title: "2022 Toyota Land Cruiser LC300 - Full Option",
          description: "Brand new Toyota Land Cruiser LC300, white exterior with beige leather interior. GXR trim with full options including sunroof, 360 camera, JBL premium audio. GCC specs with warranty.",
          price: 32000000, // AED 320,000
          imageUrl: "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=800",
          mainCategory: "Automotive",
          subCategory: "SUVs",
          condition: "new",
          sellerId: "demo_seller_3",
          status: "approved",
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
        {
          title: "2021 Mercedes G63 AMG - Night Package",
          description: "Stunning Mercedes-Benz G63 AMG in obsidian black. Low mileage (25,000 km), full service history at authorized dealer. Night package, Burmester audio, heated/cooled seats.",
          price: 75000000, // AED 750,000
          imageUrl: "https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=800",
          mainCategory: "Automotive",
          subCategory: "SUVs",
          condition: "used",
          sellerId: "demo_seller_3",
          status: "approved",
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
        {
          title: "Honda Accord Brake Pads Set - Genuine",
          description: "Genuine Honda brake pads for Accord 2018-2022. Front and rear set included. Brand new in original packaging. Direct fit, no modifications needed.",
          price: 45000, // AED 450
          imageUrl: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800",
          mainCategory: "Spare Parts",
          subCategory: "Brakes",
          condition: "new",
          sellerId: "demo_seller_1",
          status: "approved",
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
        {
          title: "2020 Ford Mustang GT - V8 Manual",
          description: "Ford Mustang GT 5.0L V8 in race red with black racing stripes. Manual 6-speed transmission, only 25,000 km. Borla exhaust, cold air intake, lowered suspension.",
          price: 18500000, // AED 185,000
          imageUrl: "https://images.unsplash.com/photo-1544636331-e26879cd4d9b?w=800",
          mainCategory: "Automotive",
          subCategory: "Sports Cars",
          condition: "used",
          sellerId: "demo_seller_2",
          status: "approved",
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
        {
          title: "Lexus LX570 Grille - Chrome",
          description: "OEM Lexus LX570 front grille (2016-2021). Chrome finish, perfect condition. Complete with Lexus emblem and all mounting hardware.",
          price: 95000, // AED 950
          imageUrl: "https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=800",
          mainCategory: "Spare Parts",
          subCategory: "Body Parts",
          condition: "used",
          sellerId: "demo_seller_1",
          status: "approved",
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
        {
          title: "2023 Range Rover Sport - First Edition",
          description: "Brand new Range Rover Sport First Edition in Santorini Black. Full spec with Meridian Signature audio, panoramic roof, air suspension. Under manufacturer warranty.",
          price: 58000000, // AED 580,000
          imageUrl: "https://images.unsplash.com/photo-1606664466188-e99f0e5f0235?w=800",
          mainCategory: "Automotive",
          subCategory: "SUVs",
          condition: "new",
          sellerId: "demo_seller_3",
          status: "approved",
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
      ];

      // Insert demo listings directly (bypasses status override)
      for (const listing of demoListings) {
        await db.insert(products).values(listing as any);
      }

      // Seed subscription packages for both categories
      const demoPackages = [
        // Spare Parts packages
        { name: "Basic", price: 30, credits: 1, bonusCredits: 0, category: "Spare Parts", isActive: true, sortOrder: 1 },
        { name: "Standard", price: 75, credits: 3, bonusCredits: 0, category: "Spare Parts", isActive: true, sortOrder: 2 },
        { name: "Premium", price: 250, credits: 10, bonusCredits: 2, category: "Spare Parts", isActive: true, sortOrder: 3 },
        { name: "Pro", price: 450, credits: 20, bonusCredits: 5, category: "Spare Parts", isActive: true, sortOrder: 4 },
        // Automotive packages
        { name: "Basic", price: 50, credits: 1, bonusCredits: 0, category: "Automotive", isActive: true, sortOrder: 1 },
        { name: "Standard", price: 120, credits: 3, bonusCredits: 0, category: "Automotive", isActive: true, sortOrder: 2 },
        { name: "Premium", price: 350, credits: 10, bonusCredits: 2, category: "Automotive", isActive: true, sortOrder: 3 },
        { name: "Pro", price: 600, credits: 20, bonusCredits: 5, category: "Automotive", isActive: true, sortOrder: 4 },
      ];

      for (const pkg of demoPackages) {
        await storage.createPackage(pkg);
      }

      res.json({ message: `Successfully added ${demoListings.length} demo listings and ${demoPackages.length} subscription packages` });
    } catch (error) {
      console.error("Error seeding demo listings:", error);
      res.status(500).json({ message: "Failed to seed demo listings" });
    }
  });

  // Admin: Clear demo listings
  app.delete("/api/admin/clear-demo", isAuthenticated, isAdmin, async (req, res) => {
    try {
      // Delete all listings from demo sellers
      const deletedCount = await storage.deleteProductsBySeller(["demo_seller_1", "demo_seller_2", "demo_seller_3"]);
      res.json({ message: `Removed ${deletedCount} demo listings` });
    } catch (error) {
      console.error("Error clearing demo listings:", error);
      res.status(500).json({ message: "Failed to clear demo listings" });
    }
  });

  // ==================== NOTIFICATIONS ====================
  
  // Get all notifications for current user
  app.get("/api/notifications", isAuthenticated, async (req, res) => {
    const userId = getCurrentUserId(req);
    if (!userId) return res.status(401).json({ message: "Not authenticated" });
    const notifs = await storage.getNotifications(userId);
    res.json(notifs);
  });

  // Get unread notification count
  app.get("/api/notifications/unread-count", isAuthenticated, async (req, res) => {
    const userId = getCurrentUserId(req);
    if (!userId) return res.status(401).json({ message: "Not authenticated" });
    const count = await storage.getUnreadCount(userId);
    res.json({ count });
  });

  // Mark single notification as read
  app.post("/api/notifications/:id/read", isAuthenticated, async (req, res) => {
    const id = Number(req.params.id);
    await storage.markAsRead(id);
    res.sendStatus(200);
  });

  // Mark all notifications as read
  app.post("/api/notifications/mark-all-read", isAuthenticated, async (req, res) => {
    const userId = getCurrentUserId(req);
    if (!userId) return res.status(401).json({ message: "Not authenticated" });
    await storage.markAllAsRead(userId);
    res.sendStatus(200);
  });

  // Delete a notification
  app.delete("/api/notifications/:id", isAuthenticated, async (req, res) => {
    const id = Number(req.params.id);
    await storage.deleteNotification(id);
    res.sendStatus(204);
  });

  // Clear all notifications for user
  app.delete("/api/notifications", isAuthenticated, async (req, res) => {
    const userId = getCurrentUserId(req);
    if (!userId) return res.status(401).json({ message: "Not authenticated" });
    await storage.deleteUserNotifications(userId);
    res.sendStatus(204);
  });

  // ==================== REPOST/RENEW LISTING ====================
  
  // Renew an expiring listing (uses 1 credit)
  app.post("/api/listings/:id/renew", isAuthenticated, async (req, res) => {
    const userId = getCurrentUserId(req);
    if (!userId) return res.status(401).json({ message: "Not authenticated" });
    
    const listingId = Number(req.params.id);
    
    // Get the product to check ownership and category
    const product = await storage.getProduct(listingId);
    if (!product) {
      return res.status(404).json({ message: "Listing not found" });
    }
    
    // Check ownership
    if (product.sellerId !== userId) {
      return res.status(403).json({ message: "You can only renew your own listings" });
    }
    
    // Check if subscription is enabled
    const subscriptionEnabled = await storage.isSubscriptionEnabled();
    if (subscriptionEnabled) {
      const category = product.mainCategory as "Spare Parts" | "Automotive";
      
      // Try to use a credit
      const creditUsed = await storage.useCredit(userId, category);
      if (!creditUsed) {
        return res.status(402).json({ 
          message: "Insufficient credits", 
          needsCredits: true,
          category 
        });
      }
    }
    
    // Renew the product (extend by 30 days)
    const renewedProduct = await storage.renewProduct(listingId);
    
    res.json({ 
      message: "Listing renewed for 30 days", 
      product: renewedProduct 
    });
  });

  // ==================== SYNC SUBSCRIPTION PACKAGES ====================
  
  // Ensure correct subscription packages exist (runs on startup)
  async function syncSubscriptionPackages() {
    try {
      console.log("[SYNC] Checking subscription packages...");
      
      // Define the correct packages
      const correctPackages = [
        { name: "Spare Part Basic", price: 30, credits: 1, bonusCredits: 0, category: "Spare Parts", sortOrder: 1 },
        { name: "Spare Part Standard", price: 150, credits: 5, bonusCredits: 1, category: "Spare Parts", sortOrder: 2 },
        { name: "Spare Part Advanced", price: 600, credits: 20, bonusCredits: 7, category: "Spare Parts", sortOrder: 3 },
        { name: "Automotive Basic", price: 75, credits: 1, bonusCredits: 0, category: "Automotive", sortOrder: 4 },
        { name: "Automotive Standard", price: 210, credits: 3, bonusCredits: 0, category: "Automotive", sortOrder: 5 },
        { name: "Automotive Premium", price: 420, credits: 6, bonusCredits: 2, category: "Automotive", sortOrder: 6 },
      ];
      
      // Get current packages
      const currentPackages = await storage.getPackages();
      
      // Check if packages need to be reset (more than 6 or incorrect pricing)
      const needsReset = currentPackages.length !== 6 || 
        !currentPackages.some(p => p.name === "Spare Part Basic" && p.price === 30) ||
        !currentPackages.some(p => p.name === "Automotive Basic" && p.price === 75);
      
      if (needsReset) {
        console.log(`[SYNC] Found ${currentPackages.length} packages, resetting to correct 6 packages...`);
        
        // Delete all existing packages
        for (const pkg of currentPackages) {
          await storage.deletePackage(pkg.id);
        }
        
        // Create the correct packages
        for (const pkg of correctPackages) {
          await storage.createPackage({
            ...pkg,
            isActive: true,
          });
        }
        
        console.log("[SYNC] Subscription packages reset successfully");
      } else {
        console.log("[SYNC] Subscription packages are correct");
      }
    } catch (error) {
      console.error("[SYNC] Error syncing subscription packages:", error);
    }
  }
  
  // Run package sync on startup
  syncSubscriptionPackages();

  // ==================== SCHEDULED TASKS ====================
  
  // Run cleanup and notification tasks
  async function runScheduledTasks() {
    try {
      console.log("[SCHEDULER] Running scheduled tasks...");
      
      // 1. Delete rejected posts older than 7 days
      const deletedRejected = await storage.deleteOldRejectedProducts();
      if (deletedRejected > 0) {
        console.log(`[SCHEDULER] Deleted ${deletedRejected} old rejected listings`);
      }
      
      // 2. Delete expired posts
      const deletedExpired = await storage.deleteExpiredProducts();
      if (deletedExpired > 0) {
        console.log(`[SCHEDULER] Deleted ${deletedExpired} expired listings`);
      }
      
      // 3. Send expiration notifications (1 day before)
      const expiringProducts = await storage.getProductsExpiringTomorrow();
      for (const product of expiringProducts) {
        // Send in-app notification
        await storage.createNotification({
          userId: product.sellerId,
          title: "Listing Expiring Soon",
          message: `Your listing "${product.title}" expires tomorrow. Tap to renew it for another 30 days (uses 1 credit).`,
          type: "listing_expiring",
          relatedId: product.id,
        });
        
        // Mark as notified
        await storage.markExpirationNotified(product.id);
        
        // Send push notification
        try {
          const tokens = await db.select().from(deviceTokens).where(eq(deviceTokens.userId, product.sellerId));
          for (const tokenRecord of tokens) {
            await sendPushNotification(tokenRecord.fcmToken, {
              title: "Listing Expiring Tomorrow",
              body: `"${product.title}" expires tomorrow. Renew to keep it active!`,
              data: { type: "listing_expiring", listingId: String(product.id) }
            });
          }
        } catch (e) {
          console.log("[SCHEDULER] Push notification failed:", e);
        }
        
        console.log(`[SCHEDULER] Sent expiration notification for listing ${product.id}`);
      }
      
      console.log("[SCHEDULER] Scheduled tasks completed");
    } catch (error) {
      console.error("[SCHEDULER] Error running scheduled tasks:", error);
    }
  }
  
  // Run tasks on startup and every hour
  runScheduledTasks();
  setInterval(runScheduledTasks, 60 * 60 * 1000); // Run every hour

  return httpServer;
}
