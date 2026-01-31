import { useEffect, useMemo, useState } from "react";
import { useProduct } from "@/hooks/use-products";
import { useAuth } from "@/hooks/use-auth";
import { useIsFavorite, useAddFavorite, useRemoveFavorite } from "@/hooks/use-favorites";
import { useRoute, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Phone, Heart, MapPin, Store, ChevronRight, Languages, Loader2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { SiWhatsapp } from "react-icons/si";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useQuery } from "@tanstack/react-query";
import { type Product } from "@shared/schema";
import { Card } from "@/components/ui/card";
import { ImageGallery } from "@/components/ImageGallery";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useTranslation } from "@/hooks/useTranslation";

export default function ProductDetail() {
  const [, params] = useRoute("/product/:id");
  const id = params?.id ? parseInt(params.id) : 0;
  const { data: product, isLoading, error } = useProduct(id);
  const { user } = useAuth();
  const { data: isFavorite } = useIsFavorite(id);
  const addFavorite = useAddFavorite();
  const removeFavorite = useRemoveFavorite();
  const { toast } = useToast();
  
  // Translation state
  const [showTranslation, setShowTranslation] = useState(false);
  const [translatedTitle, setTranslatedTitle] = useState<string | null>(null);
  const [translatedDescription, setTranslatedDescription] = useState<string | null>(null);
  const { isTranslating, error: translationError, translateListing, detectLanguage, getTargetLanguage } = useTranslation();
  
  // Reset translation state when product changes
  useEffect(() => {
    setShowTranslation(false);
    setTranslatedTitle(null);
    setTranslatedDescription(null);
  }, [id]);

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

  // Handle translation toggle
  const handleTranslate = async () => {
    if (!product) return;
    
    if (showTranslation) {
      // Toggle back to original
      setShowTranslation(false);
      return;
    }
    
    // Check if already translated
    if (translatedTitle) {
      setShowTranslation(true);
      return;
    }
    
    // Translate
    const targetLang = getTargetLanguage(product.title);
    const result = await translateListing(
      product.title,
      product.description || "",
      targetLang
    );
    
    // Check if translation actually happened (content changed or API succeeded)
    if (result.isTranslated && (result.translatedTitle !== product.title || result.translatedDescription !== (product.description || ""))) {
      setTranslatedTitle(result.translatedTitle);
      setTranslatedDescription(result.translatedDescription);
      setShowTranslation(true);
    } else if (!result.isTranslated) {
      toast({ 
        variant: "destructive", 
        title: "Translation failed", 
        description: "Please try again later" 
      });
    } else {
      // Translation returned same text (possibly already in target language or unsupported content)
      toast({ 
        title: "No translation needed", 
        description: "The content is already in the selected language or cannot be translated" 
      });
    }
  };
  
  // Get the language label for the button
  const getTranslationButtonLabel = () => {
    if (!product) return "";
    const sourceLang = detectLanguage(product.title);
    if (showTranslation) {
      return sourceLang === "arabic" ? "Show Arabic" : "Show English";
    }
    return sourceLang === "arabic" ? "Translate to English" : "ترجم للعربية";
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
      }).format(product.price)
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
                {showTranslation && translatedTitle ? translatedTitle : product.title}
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

            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-muted-foreground">Description</span>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={handleTranslate}
                  disabled={isTranslating}
                  className="h-8 px-3"
                  data-testid="button-translate"
                >
                  {isTranslating ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <Languages className="h-4 w-4 mr-1.5" />
                      <span className="text-sm font-medium">{getTranslationButtonLabel()}</span>
                    </>
                  )}
                </Button>
              </div>
              <p className="text-sm leading-relaxed whitespace-pre-wrap text-muted-foreground">
                {showTranslation && translatedDescription ? translatedDescription : product.description}
              </p>
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
                  }).format(p.price || 0);
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
