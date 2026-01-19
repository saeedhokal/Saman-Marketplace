import { db } from "./db";
import { products, favorites, type Product, type InsertProduct, type Favorite, type InsertFavorite } from "@shared/schema";
import { eq, ilike, desc, and, or } from "drizzle-orm";

export interface IStorage {
  getProducts(options?: { search?: string; mainCategory?: string; subCategory?: string }): Promise<Product[]>;
  getProduct(id: number): Promise<Product | undefined>;
  getProductsBySeller(sellerId: string): Promise<Product[]>;
  createProduct(product: InsertProduct & { sellerId: string }): Promise<Product>;
  deleteProduct(id: number): Promise<void>;
  
  getFavorites(userId: string): Promise<Product[]>;
  addFavorite(userId: string, productId: number): Promise<Favorite>;
  removeFavorite(userId: string, productId: number): Promise<void>;
  isFavorite(userId: string, productId: number): Promise<boolean>;
}

export class DatabaseStorage implements IStorage {
  async getProducts(options?: { search?: string; mainCategory?: string; subCategory?: string }): Promise<Product[]> {
    const conditions = [];

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

    if (conditions.length > 0) {
      return await db.select().from(products)
        .where(and(...conditions))
        .orderBy(desc(products.createdAt));
    }

    return await db.select().from(products).orderBy(desc(products.createdAt));
  }

  async getProduct(id: number): Promise<Product | undefined> {
    const [product] = await db.select().from(products).where(eq(products.id, id));
    return product;
  }

  async getProductsBySeller(sellerId: string): Promise<Product[]> {
    return await db.select().from(products)
      .where(eq(products.sellerId, sellerId))
      .orderBy(desc(products.createdAt));
  }

  async createProduct(product: InsertProduct & { sellerId: string }): Promise<Product> {
    const [newProduct] = await db.insert(products).values(product).returning();
    return newProduct;
  }

  async deleteProduct(id: number): Promise<void> {
    await db.delete(products).where(eq(products.id, id));
  }

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
