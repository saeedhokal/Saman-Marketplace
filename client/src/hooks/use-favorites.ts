import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { Product } from "@shared/schema";

export function useFavorites() {
  return useQuery<Product[]>({
    queryKey: ["/api/favorites"],
    queryFn: async () => {
      const res = await fetch("/api/favorites", { credentials: "include" });
      if (res.status === 401) return [];
      if (!res.ok) throw new Error("Failed to fetch favorites");
      return res.json();
    },
  });
}

export function useIsFavorite(productId: number) {
  return useQuery<boolean>({
    queryKey: ["/api/favorites", productId, "check"],
    queryFn: async () => {
      const res = await fetch(`/api/favorites/${productId}/check`, { credentials: "include" });
      if (res.status === 401) return false;
      if (!res.ok) throw new Error("Failed to check favorite");
      const data = await res.json();
      return data.isFavorite;
    },
    enabled: !!productId,
  });
}

export function useAddFavorite() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (productId: number) => {
      const res = await fetch(`/api/favorites/${productId}`, {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to add to favorites");
      return res.json();
    },
    onSuccess: (_, productId) => {
      queryClient.invalidateQueries({ queryKey: ["/api/favorites"] });
      queryClient.invalidateQueries({ queryKey: ["/api/favorites", productId, "check"] });
    },
  });
}

export function useRemoveFavorite() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (productId: number) => {
      const res = await fetch(`/api/favorites/${productId}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to remove from favorites");
    },
    onSuccess: (_, productId) => {
      queryClient.invalidateQueries({ queryKey: ["/api/favorites"] });
      queryClient.invalidateQueries({ queryKey: ["/api/favorites", productId, "check"] });
    },
  });
}
