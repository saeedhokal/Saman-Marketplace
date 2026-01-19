import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl, type InsertProduct } from "@shared/routes";
import type { Product } from "@shared/schema";

// GET /api/products
export function useProducts(filters?: { search?: string; mainCategory?: string; subCategory?: string }) {
  const queryKey = [api.products.list.path, filters];
  return useQuery({
    queryKey,
    queryFn: async () => {
      const url = new URL(api.products.list.path, window.location.origin);
      if (filters?.search) url.searchParams.append("search", filters.search);
      if (filters?.mainCategory && filters.mainCategory !== "All") {
        url.searchParams.append("mainCategory", filters.mainCategory);
      }
      if (filters?.subCategory && filters.subCategory !== "All") {
        url.searchParams.append("subCategory", filters.subCategory);
      }
      
      const res = await fetch(url.toString(), { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch products");
      return api.products.list.responses[200].parse(await res.json());
    },
  });
}

// GET /api/products/:id
export function useProduct(id: number) {
  return useQuery({
    queryKey: [api.products.get.path, id],
    queryFn: async () => {
      const url = buildUrl(api.products.get.path, { id });
      const res = await fetch(url, { credentials: "include" });
      if (res.status === 404) return null;
      if (!res.ok) throw new Error("Failed to fetch product");
      return api.products.get.responses[200].parse(await res.json());
    },
    enabled: !!id,
  });
}

// GET /api/sellers/:sellerId/products
export function useSellerProducts(sellerId: string) {
  return useQuery<Product[]>({
    queryKey: ["/api/sellers", sellerId, "products"],
    queryFn: async () => {
      const res = await fetch(`/api/sellers/${sellerId}/products`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch seller products");
      return res.json();
    },
    enabled: !!sellerId,
  });
}

// POST /api/products
export function useCreateProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: InsertProduct) => {
      const res = await fetch(api.products.create.path, {
        method: api.products.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      
      if (!res.ok) {
        if (res.status === 400) {
          const error = api.products.create.responses[400].parse(await res.json());
          throw new Error(error.message);
        }
        throw new Error("Failed to create product");
      }
      return api.products.create.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.products.list.path] });
    },
  });
}

// DELETE /api/products/:id
export function useDeleteProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const url = buildUrl(api.products.delete.path, { id });
      const res = await fetch(url, { 
        method: api.products.delete.method, 
        credentials: "include" 
      });
      
      if (res.status === 404) throw new Error("Product not found");
      if (!res.ok) throw new Error("Failed to delete product");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.products.list.path] });
    },
  });
}
