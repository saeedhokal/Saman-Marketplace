import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./replit_integrations/auth";
import { registerAuthRoutes, isAuthenticated } from "./replit_integrations/auth";
import { registerObjectStorageRoutes } from "./replit_integrations/object_storage";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import { and, ilike, eq } from "drizzle-orm"; // Import for storage query construction if needed there

export async function registerRoutes(httpServer: Server, app: Express): Promise<Server> {
  // Setup Auth first
  await setupAuth(app);
  registerAuthRoutes(app);
  registerObjectStorageRoutes(app);

  // Products API
  app.get(api.products.list.path, async (req, res) => {
    const search = req.query.search as string | undefined;
    const category = req.query.category as string | undefined;
    const products = await storage.getProducts(search, category);
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

  app.post(api.products.create.path, isAuthenticated, async (req, res) => {
    try {
      const bodySchema = api.products.create.input.extend({
        price: z.coerce.number(),
        isVehicle: z.coerce.boolean().optional(),
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
    // Check ownership? For now, allow deletion.
    // Ideally we check if product.sellerId === req.user.sub
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

  return httpServer;
}
