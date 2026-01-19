import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./replit_integrations/auth";
import { registerAuthRoutes, isAuthenticated } from "./replit_integrations/auth";
import { registerObjectStorageRoutes } from "./replit_integrations/object_storage";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";

export async function registerRoutes(httpServer: Server, app: Express): Promise<Server> {
  await setupAuth(app);
  registerAuthRoutes(app);
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
    const products = await storage.getProductsBySeller(sellerId);
    res.json(products);
  });

  app.post(api.products.create.path, isAuthenticated, async (req, res) => {
    try {
      const bodySchema = api.products.create.input.extend({
        price: z.coerce.number(),
      });
      const input = bodySchema.parse(req.body);
      // @ts-ignore
      const sellerId = req.user.claims.sub;

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
    
    // @ts-ignore
    const userId = req.user.claims.sub;
    if (product.sellerId !== userId) {
       return res.status(401).json({ message: "Unauthorized" });
    }

    await storage.deleteProduct(id);
    res.sendStatus(204);
  });

  // Favorites API
  app.get("/api/favorites", isAuthenticated, async (req, res) => {
    // @ts-ignore
    const userId = req.user.claims.sub;
    const favorites = await storage.getFavorites(userId);
    res.json(favorites);
  });

  app.post("/api/favorites/:productId", isAuthenticated, async (req, res) => {
    const productId = Number(req.params.productId);
    // @ts-ignore
    const userId = req.user.claims.sub;
    
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
    // @ts-ignore
    const userId = req.user.claims.sub;
    await storage.removeFavorite(userId, productId);
    res.sendStatus(204);
  });

  app.get("/api/favorites/:productId/check", isAuthenticated, async (req, res) => {
    const productId = Number(req.params.productId);
    // @ts-ignore
    const userId = req.user.claims.sub;
    const isFav = await storage.isFavorite(userId, productId);
    res.json({ isFavorite: isFav });
  });

  return httpServer;
}
