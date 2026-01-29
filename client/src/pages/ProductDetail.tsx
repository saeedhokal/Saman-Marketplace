import { useEffect, useMemo } from "react";
import { useProduct } from "@/hooks/use-products";
import { useAuth } from "@/hooks/use-auth";
import { useIsFavorite, useAddFavorite, useRemoveFavorite } from "@/hooks/use-favorites";
import { useRoute, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Phone, Heart, MapPin, Store, ChevronRight } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { SiWhatsapp } from "react-icons/si";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useQuery } from "@tanstack/react-query";
import { type Product } from "@shared/schema";
import { Card } from "@/components/ui/card";
import { ImageGallery } from "@/components/ImageGallery";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

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

  type SellerInfo = {
    id: string;
    displayName: string | null;
    firstName: string | null;
    lastName: string | null;
    profileImageUrl: string | null;
    createdAt: string;
  };

  const { data: sellerInfo } = useQuery<SellerInfo>({
    queryKey: ['/api/sellers', product?.sellerId],
    enabled: !!product?.sellerId,
  });

  const getSellerDisplayName = () => {
    if (sellerInfo?.displayName) return sellerInfo.displayName;
    if (sellerInfo?.firstName || sellerInfo?.lastName) {
      return `${sellerInfo.firstName || ''} ${sellerInfo.lastName || ''}`.trim();
    }
    return 'Seller';
  };

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

  const allImages = useMemo(() => {
    if (!product) return [];
    const images: string[] = [];
    if (product.imageUrl) images.push(product.imageUrl);
    if (product.imageUrls && Array.isArray(product.imageUrls)) {
      product.imageUrls.forEach((url) => {
        if (url && !images.includes(url)) images.push(url);
      });
    }
    return images;
  }, [product]);

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
    <div className="min-h-screen bg-background pb-20 safe-area-top">
      <div className="container mx-auto px-4 py-6">
        <Link href="/">
          <Button variant="ghost" className="pl-0 hover:bg-transparent hover:text-accent" data-testid="button-back">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Browse
          </Button>
        </Link>
      </div>

      <div className="container mx-auto px-4 max-w-7xl">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16">
          <div className="relative">
            {allImages.length > 0 ? (
              <ImageGallery images={allImages} />
            ) : (
              <div className="aspect-square rounded-xl overflow-hidden bg-secondary border border-border/50 flex items-center justify-center text-muted-foreground">
                No Image Available
              </div>
            )}
            
            <Button
              size="icon"
              variant="secondary"
              className={`absolute top-4 right-4 h-10 w-10 rounded-full shadow-lg z-10 ${isFavorite ? 'bg-red-50 text-red-500 hover:bg-red-100' : 'bg-white/90 hover:bg-white'}`}
              onClick={handleToggleFavorite}
              data-testid="button-favorite"
            >
              <Heart className={`h-5 w-5 ${isFavorite ? 'fill-current' : ''}`} />
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

        {/* Seller Info Section */}
        {product?.sellerId && (
          <div className="mt-12">
            <Link href={`/seller/${product.sellerId}`}>
              <Card className="p-4 hover-elevate cursor-pointer" data-testid="link-seller-profile">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-12 w-12">
                      {sellerInfo?.profileImageUrl ? (
                        <AvatarImage src={sellerInfo.profileImageUrl} alt={getSellerDisplayName()} />
                      ) : null}
                      <AvatarFallback className="bg-primary/10 text-primary">
                        <Store className="h-5 w-5" />
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-semibold text-foreground" data-testid="text-seller-name">
                        {getSellerDisplayName()}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {sellerProducts ? `${sellerProducts.length} listing${sellerProducts.length !== 1 ? 's' : ''}` : 'View all listings'}
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground" />
                </div>
              </Card>
            </Link>
          </div>
        )}

        {/* More from this seller */}
        {sellerProducts && sellerProducts.filter(p => p.id !== id).length > 0 && (
          <div className="mt-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-xl font-bold text-foreground">More from this seller</h2>
              <Link href={`/seller/${product?.sellerId}`}>
                <Button variant="ghost" size="sm" data-testid="button-view-all-seller">
                  View All <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </Link>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
              {sellerProducts
                .filter(p => p.id !== id)
                .slice(0, 5)
                .map(p => {
                  const price = new Intl.NumberFormat("en-AE", {
                    style: "currency",
                    currency: "AED",
                    maximumFractionDigits: 0,
                  }).format((p.price || 0) / 100);
                  return (
                    <Link key={p.id} href={`/product/${p.id}`}>
                      <Card className="overflow-hidden cursor-pointer hover:shadow-md transition-shadow rounded-xl" data-testid={`card-product-${p.id}`}>
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
