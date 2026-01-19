import { useEffect } from "react";
import { useProduct } from "@/hooks/use-products";
import { useAuth } from "@/hooks/use-auth";
import { useIsFavorite, useAddFavorite, useRemoveFavorite } from "@/hooks/use-favorites";
import { useRoute, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Phone, Heart, MapPin } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { SiWhatsapp } from "react-icons/si";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useQuery } from "@tanstack/react-query";
import { type Product } from "@shared/schema";
import { Card } from "@/components/ui/card";

export default function ProductDetail() {
  const [, params] = useRoute("/product/:id");
  const id = params?.id ? parseInt(params.id) : 0;
  const { data: product, isLoading, error } = useProduct(id);
  const { user } = useAuth();
  const { data: isFavorite } = useIsFavorite(id);
  const addFavorite = useAddFavorite();
  const removeFavorite = useRemoveFavorite();
  const { toast } = useToast();

  const { data: sellerProducts } = useQuery<Product[]>({
    queryKey: ['/api/sellers', product?.sellerId, 'products'],
    enabled: !!product?.sellerId,
  });

  useEffect(() => {
    if (id && product) {
      apiRequest("POST", `/api/products/${id}/view`).catch(() => {});
    }
  }, [id, product]);

  const handleToggleFavorite = async () => {
    if (!user) {
      window.location.href = "/api/login";
      return;
    }
    
    try {
      if (isFavorite) {
        await removeFavorite.mutateAsync(id);
        toast({ title: "Removed from favorites" });
      } else {
        await addFavorite.mutateAsync(id);
        toast({ title: "Added to favorites" });
      }
    } catch (err) {
      toast({ variant: "destructive", title: "Error updating favorites" });
    }
  };

  const formatWhatsAppNumber = (num: string) => {
    return num.replace(/[^0-9]/g, '');
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-12 max-w-7xl">
        <Skeleton className="h-8 w-32 mb-8" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          <Skeleton className="h-[500px] w-full rounded-3xl" />
          <div className="space-y-6">
            <Skeleton className="h-12 w-3/4" />
            <Skeleton className="h-8 w-1/3" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-14 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <h2 className="text-2xl font-bold text-foreground">Listing not found</h2>
        <Link href="/">
          <Button variant="ghost" className="mt-4">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Browse
          </Button>
        </Link>
      </div>
    );
  }

  const formattedPrice = product.price 
    ? new Intl.NumberFormat("en-AE", {
        style: "currency",
        currency: "AED",
        maximumFractionDigits: 0,
      }).format(product.price / 100)
    : null;

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="container mx-auto px-4 py-6">
        <Link href="/">
          <Button variant="ghost" className="pl-0 hover:bg-transparent hover:text-accent" data-testid="button-back">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Browse
          </Button>
        </Link>
      </div>

      <div className="container mx-auto px-4 max-w-7xl">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16">
          <div className="relative group">
            <div className="aspect-[4/3] rounded-3xl overflow-hidden bg-secondary border border-border/50 shadow-xl shadow-black/5">
              {product.imageUrl ? (
                <img
                  src={product.imageUrl}
                  alt={product.title}
                  className="w-full h-full object-cover object-center"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                  No Image Available
                </div>
              )}
            </div>
            
            <Button
              size="icon"
              variant="secondary"
              className={`absolute top-4 right-4 h-12 w-12 rounded-full shadow-lg ${isFavorite ? 'bg-red-50 text-red-500 hover:bg-red-100' : 'bg-white/90 hover:bg-white'}`}
              onClick={handleToggleFavorite}
              data-testid="button-favorite"
            >
              <Heart className={`h-6 w-6 ${isFavorite ? 'fill-current' : ''}`} />
            </Button>
          </div>

          <div className="flex flex-col justify-center">
            <div className="space-y-3 mb-6">
              <h1 className="font-display text-2xl sm:text-3xl font-bold text-foreground leading-tight">
                {product.title}
              </h1>

              <div className="font-display text-3xl font-bold text-primary">
                {formattedPrice}
              </div>

              {product.location && (
                <div className="flex items-center gap-2 text-muted-foreground text-sm">
                  <MapPin className="h-4 w-4" />
                  <span>{product.location}</span>
                </div>
              )}
            </div>

            <div className="prose prose-slate max-w-none text-muted-foreground mb-6">
              <p className="text-sm leading-relaxed whitespace-pre-wrap">{product.description}</p>
            </div>

            <div className="flex items-center gap-3 mb-6">
              <a 
                href={`tel:${product.phoneNumber || '+971501234567'}`}
                className="flex-1"
              >
                <Button 
                  size="sm" 
                  variant="outline"
                  className="w-full"
                  data-testid="button-call"
                >
                  <Phone className="mr-2 h-4 w-4" /> Call
                </Button>
              </a>
              
              <a 
                href={`https://wa.me/${formatWhatsAppNumber(product.whatsappNumber || '+971501234567')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1"
              >
                <Button 
                  size="sm" 
                  variant="outline"
                  className="w-full text-green-600 border-green-600 hover:bg-green-50"
                  data-testid="button-whatsapp"
                >
                  <SiWhatsapp className="mr-2 h-4 w-4" /> WhatsApp
                </Button>
              </a>
            </div>
          </div>
        </div>

        {/* More from this seller */}
        {sellerProducts && sellerProducts.filter(p => p.id !== id).length > 0 && (
          <div className="mt-12">
            <h2 className="font-display text-xl font-bold text-foreground mb-4">More from this seller</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {sellerProducts
                .filter(p => p.id !== id)
                .slice(0, 4)
                .map(p => {
                  const price = new Intl.NumberFormat("en-AE", {
                    style: "currency",
                    currency: "AED",
                    maximumFractionDigits: 0,
                  }).format((p.price || 0) / 100);
                  return (
                    <Link key={p.id} href={`/product/${p.id}`}>
                      <Card className="overflow-hidden cursor-pointer hover:shadow-md transition-shadow rounded-xl">
                        <div className="aspect-square overflow-hidden bg-secondary/30">
                          {p.imageUrl ? (
                            <img src={p.imageUrl} alt={p.title} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">No Image</div>
                          )}
                        </div>
                        <div className="p-3">
                          <p className="text-sm font-medium line-clamp-1">{p.title}</p>
                          <p className="text-sm font-bold text-primary">{price}</p>
                        </div>
                      </Card>
                    </Link>
                  );
                })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
