import { db } from "./db";
import { products, type Product, type InsertProduct } from "@shared/schema";
import { eq, ilike, desc } from "drizzle-orm";

export interface IStorage {
  getProducts(search?: string, category?: string): Promise<Product[]>;
  getProduct(id: number): Promise<Product | undefined>;
  createProduct(product: InsertProduct & { sellerId: string }): Promise<Product>;
  deleteProduct(id: number): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  async getProducts(search?: string, category?: string): Promise<Product[]> {
    let query = db.select().from(products);
    const conditions = [];

    if (search) {
      conditions.push(ilike(products.title, `%${search}%`));
    }
    if (category && category !== "All") {
      conditions.push(eq(products.category, category));
    }

    if (conditions.length > 0) {
      // @ts-ignore
      query = query.where((t) => conditions.reduce((acc, c) => (acc ? and(acc, c) : c), undefined));
    }

    // Sort by newest first
    return await query.orderBy(desc(products.createdAt));
  }

  async getProduct(id: number): Promise<Product | undefined> {
    const [product] = await db.select().from(products).where(eq(products.id, id));
    return product;
  }

  async createProduct(product: InsertProduct & { sellerId: string }): Promise<Product> {
    const [newProduct] = await db.insert(products).values(product).returning();
    return newProduct;
  }

  async deleteProduct(id: number): Promise<void> {
    await db.delete(products).where(eq(products.id, id));
  }
}

export const storage = new DatabaseStorage();
