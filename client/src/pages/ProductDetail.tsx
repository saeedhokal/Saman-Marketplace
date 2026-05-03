import { useEffect, useMemo, useState, useRef, useCallback } from "react";
import { useProduct } from "@/hooks/use-products";
import { useAuth } from "@/hooks/use-auth";
import { useIsFavorite, useAddFavorite, useRemoveFavorite } from "@/hooks/use-favorites";
import { useRoute, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Phone, Heart, MapPin, Store, ChevronRight, Languages, Loader2, Share2, Eye, Calendar, Gauge, Tag, Car } from "lucide-react";
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
import { useLanguage } from "@/hooks/use-language";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export default function ProductDetail() {
  const [, params] = useRoute("/product/:id");
  const id = params?.id ? parseInt(params.id) : 0;
  const { data: product, isLoading, error } = useProduct(id);
  const { user } = useAuth();
  const { data: isFavorite } = useIsFavorite(id);
  const addFavorite = useAddFavorite();
  const removeFavorite = useRemoveFavorite();
  const { toast } = useToast();
  const { isRTL, language } = useLanguage();
  
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

  const [showAuthPrompt, setShowAuthPrompt] = useState(false);

  const goToAuth = (mode: "login" | "signup" = "signup") => {
    const returnTo = `/product/${id}`;
    const modeParam = mode === "signup" ? "&mode=signup" : "";
    window.location.href = `/auth?returnTo=${encodeURIComponent(returnTo)}${modeParam}`;
  };

  const handleContactClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (!user) {
      e.preventDefault();
      setShowAuthPrompt(true);
    }
  };

  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);
  const pageRef = useRef<HTMLDivElement>(null);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest('[data-testid="image-gallery-main"]') || target.closest('[data-testid="fullscreen-gallery"]')) {
      return;
    }
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  }, []);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (touchStartX.current === null || touchStartY.current === null) return;
    const deltaX = e.changedTouches[0].clientX - touchStartX.current;
    const deltaY = Math.abs(e.changedTouches[0].clientY - touchStartY.current);
    touchStartX.current = null;
    touchStartY.current = null;
    if (deltaX > 80 && deltaY < 100) {
      window.history.back();
    }
  }, []);

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
    phone: string | null;
  };

  const { data: sellerInfo } = useQuery<SellerInfo>({
    queryKey: ['/api/sellers', product?.sellerId],
    enabled: !!product?.sellerId,
  });

  const callNumber = product?.phoneNumber || sellerInfo?.phone || "";
  const whatsappNumber = product?.whatsappNumber || sellerInfo?.phone || "";
  const hasCallNumber = callNumber.replace(/[^0-9]/g, "").length > 0;
  const hasWhatsappNumber = whatsappNumber.replace(/[^0-9]/g, "").length > 0;

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

  const formatPhoneForCall = (num: string) => {
    const digits = num.replace(/[^0-9]/g, '');
    if (digits.startsWith('971')) return `+${digits}`;
    if (digits.startsWith('0')) return `+971${digits.slice(1)}`;
    return `+971${digits}`;
  };

  const formatWhatsAppNumber = (num: string) => {
    return num.replace(/[^0-9]/g, '');
  };

  const handleShare = async () => {
    const shareUrl = `https://thesamanapp.com/product/${id}`;
    const shareTitle = product?.title || "Check out this listing on Saman Marketplace";
    const shareText = product?.price 
      ? `${shareTitle} - AED ${Number(product.price).toLocaleString()}`
      : shareTitle;

    if (navigator.share) {
      try {
        await navigator.share({ title: shareTitle, text: shareText, url: shareUrl });
      } catch (err: any) {
        if (err.name !== "AbortError") {
          console.error("Share failed:", err);
        }
      }
    } else {
      try {
        await navigator.clipboard.writeText(shareUrl);
        toast({ title: "Link Copied", description: "Listing link copied to clipboard." });
      } catch {
        toast({ variant: "destructive", title: "Error", description: "Could not copy link." });
      }
    }
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
    
    // Translate to the user's current app language
    const targetLang: "arabic" | "english" = language === "ar" ? "arabic" : "english";
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
    if (showTranslation) {
      return language === "ar" ? "عرض الأصلي" : "Show original";
    }
    return language === "ar" ? "ترجم للعربية" : "Translate to English";
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
        <Button variant="ghost" className="mt-4" onClick={() => window.history.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back
        </Button>
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
    <div className="min-h-screen bg-background" ref={pageRef} onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
      <div className="container mx-auto px-4 py-6">
        <Button variant="ghost" className={`${isRTL ? 'pr-0' : 'pl-0'} hover:bg-transparent hover:text-accent text-base`} data-testid="button-back" onClick={() => window.history.back()}>
          <ArrowLeft className={`h-5 w-5 ${isRTL ? 'ml-2 rotate-180' : 'mr-2'}`} strokeWidth={2.5} /> {isRTL ? 'رجوع' : 'Back'}
        </Button>
      </div>

      <div className="container mx-auto px-4 max-w-7xl">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16">
          <div className="relative">
            {allImages.length > 0 ? (
              <ImageGallery images={allImages} />
            ) : (
              <div className="aspect-square rounded-2xl overflow-hidden bg-secondary border border-border/50 flex items-center justify-center text-muted-foreground">
                No Image Available
              </div>
            )}

            {product.status === "sold" && (
              <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none">
                <span className="text-red-600 font-black text-6xl tracking-widest uppercase -rotate-12" style={{ WebkitTextStroke: '2px white' }}>SOLD</span>
              </div>
            )}
            
            <div className="absolute top-4 right-4 flex flex-col gap-2 z-10">
              <Button
                size="icon"
                variant="secondary"
                className={`h-10 w-10 rounded-full shadow-lg border ${isFavorite ? 'bg-red-50 text-red-500 border-red-200' : 'bg-white text-gray-700 border-gray-200'}`}
                onClick={handleToggleFavorite}
                data-testid="button-favorite"
              >
                <Heart className={`h-5 w-5 ${isFavorite ? 'fill-current' : ''}`} />
              </Button>
              <Button
                size="icon"
                variant="secondary"
                className="h-10 w-10 rounded-full shadow-lg border bg-white text-gray-700 border-gray-200"
                onClick={handleShare}
                data-testid="button-share"
              >
                <Share2 className="h-5 w-5" />
              </Button>
            </div>
          </div>

          <div className="flex flex-col justify-center">
            <div className="space-y-3 mb-6">
              <h1 className="font-display text-2xl sm:text-3xl font-bold text-foreground leading-tight">
                {showTranslation && translatedTitle ? translatedTitle : product.title}
              </h1>

              <div className="flex items-center gap-3">
                <span className={`font-display text-3xl font-bold ${product.status === "sold" ? 'text-muted-foreground line-through' : 'text-orange-700'}`}>
                  {formattedPrice}
                </span>
                {product.status === "sold" && (
                  <span className="text-sm font-semibold px-3 py-1 rounded-full bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
                    SOLD
                  </span>
                )}
              </div>

              {user?.isAdmin && (
                <div className="flex items-center gap-1.5 text-muted-foreground text-sm" data-testid="text-view-count">
                  <Eye className="w-4 h-4" />
                  <span>{(product as any).views || 0} views</span>
                </div>
              )}

              {product.location && (
                <div className="flex items-center gap-2 text-muted-foreground text-sm">
                  <MapPin className="h-4 w-4" />
                  <span>{product.location}</span>
                </div>
              )}
            </div>

            {(product.year || product.mileage || product.condition || product.model) && (
              <div className="mb-6 grid grid-cols-2 gap-2" data-testid="product-specs">
                {product.year && (
                  <div className="flex items-center gap-2 rounded-xl bg-secondary/40 px-3 py-2.5" data-testid="spec-year">
                    <Calendar className="h-4 w-4 text-accent shrink-0" />
                    <div className="min-w-0">
                      <div className="text-[11px] uppercase tracking-wide text-muted-foreground">{isRTL ? 'السنة' : 'Year'}</div>
                      <div className="text-sm font-semibold truncate">{product.year}</div>
                    </div>
                  </div>
                )}
                {product.mileage != null && (
                  <div className="flex items-center gap-2 rounded-xl bg-secondary/40 px-3 py-2.5" data-testid="spec-mileage">
                    <Gauge className="h-4 w-4 text-accent shrink-0" />
                    <div className="min-w-0">
                      <div className="text-[11px] uppercase tracking-wide text-muted-foreground">{isRTL ? 'المسافة' : 'Mileage'}</div>
                      <div className="text-sm font-semibold truncate">{product.mileage.toLocaleString()} {isRTL ? 'كم' : 'km'}</div>
                    </div>
                  </div>
                )}
                {product.condition && (
                  <div className="flex items-center gap-2 rounded-xl bg-secondary/40 px-3 py-2.5" data-testid="spec-condition">
                    <Tag className="h-4 w-4 text-accent shrink-0" />
                    <div className="min-w-0">
                      <div className="text-[11px] uppercase tracking-wide text-muted-foreground">{isRTL ? 'الحالة' : 'Condition'}</div>
                      <div className="text-sm font-semibold truncate">{product.condition}</div>
                    </div>
                  </div>
                )}
                {product.model && (
                  <div className="flex items-center gap-2 rounded-xl bg-secondary/40 px-3 py-2.5" data-testid="spec-model">
                    <Car className="h-4 w-4 text-accent shrink-0" />
                    <div className="min-w-0">
                      <div className="text-[11px] uppercase tracking-wide text-muted-foreground">{isRTL ? 'الموديل' : 'Model'}</div>
                      <div className="text-sm font-semibold truncate">{product.model}</div>
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-muted-foreground">{isRTL ? 'الوصف' : 'Description'}</span>
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
              <p className="text-sm leading-relaxed whitespace-pre-wrap text-foreground/80">
                {showTranslation && translatedDescription ? translatedDescription : product.description}
              </p>
            </div>

            <div className="flex items-center gap-3 mb-6">
              <a
                href={user && hasCallNumber ? `tel:${formatPhoneForCall(callNumber)}` : '#'}
                className="flex-1"
                aria-disabled={user && !hasCallNumber ? true : undefined}
                onClick={(e) => {
                  if (user && !hasCallNumber) { e.preventDefault(); return; }
                  handleContactClick(e);
                }}
              >
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full"
                  disabled={user ? !hasCallNumber : false}
                  data-testid="button-call"
                >
                  <Phone className="mr-2 h-4 w-4" /> Call
                </Button>
              </a>

              <a
                href={user && hasWhatsappNumber ? `https://wa.me/${formatWhatsAppNumber(whatsappNumber)}` : '#'}
                target={user && hasWhatsappNumber ? "_blank" : undefined}
                rel={user && hasWhatsappNumber ? "noopener noreferrer" : undefined}
                className="flex-1"
                aria-disabled={user && !hasWhatsappNumber ? true : undefined}
                onClick={(e) => {
                  if (user && !hasWhatsappNumber) { e.preventDefault(); return; }
                  handleContactClick(e);
                }}
              >
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full text-green-600 border-green-600 hover:bg-green-50"
                  disabled={user ? !hasWhatsappNumber : false}
                  data-testid="button-whatsapp"
                >
                  <SiWhatsapp className="mr-2 h-4 w-4" /> WhatsApp
                </Button>
              </a>
            </div>

            <Dialog open={showAuthPrompt} onOpenChange={setShowAuthPrompt}>
              <DialogContent data-testid="dialog-auth-prompt">
                <DialogHeader>
                  <DialogTitle data-testid="text-auth-prompt-title">
                    {isRTL ? 'سجّل للتواصل مع البائع' : 'Sign up to contact the seller'}
                  </DialogTitle>
                  <DialogDescription data-testid="text-auth-prompt-description">
                    {isRTL
                      ? 'أنشئ حسابًا أو سجّل دخولك للاتصال بالبائع أو إرسال رسالة عبر واتساب.'
                      : 'Create an account or log in to call the seller or message them on WhatsApp.'}
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter className="gap-2 sm:gap-2">
                  <Button
                    variant="outline"
                    onClick={() => goToAuth("login")}
                    data-testid="button-auth-prompt-login"
                  >
                    {isRTL ? 'تسجيل الدخول' : 'Log in'}
                  </Button>
                  <Button
                    onClick={() => goToAuth("signup")}
                    data-testid="button-auth-prompt-signup"
                  >
                    {isRTL ? 'إنشاء حساب' : 'Sign up'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Seller Info Section */}
        {product?.sellerId && (
          <div className="mt-12">
            {user ? (
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
            ) : (
              <Card
                className="p-4 hover-elevate cursor-pointer"
                onClick={() => setShowAuthPrompt(true)}
                data-testid="card-seller-locked"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-12 w-12">
                      <AvatarFallback className="bg-primary/10 text-primary">
                        <Store className="h-5 w-5" />
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-semibold text-foreground" data-testid="text-seller-locked">
                        {isRTL ? 'سجّل لعرض البائع' : 'Log in to view seller'}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {isRTL
                          ? 'أنشئ حسابًا لعرض ملف البائع وقوائمه الأخرى.'
                          : 'Create an account to see the seller and their other listings.'}
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground" />
                </div>
              </Card>
            )}
          </div>
        )}

        {/* More from this seller — registered users only */}
        {user && sellerProducts && sellerProducts.filter(p => p.id !== id).length > 0 && (
          <div className="mt-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-xl font-bold text-foreground">{isRTL ? 'المزيد من هذا البائع' : 'More from this seller'}</h2>
              <Link href={`/seller/${product?.sellerId}`}>
                <Button variant="ghost" size="sm" data-testid="button-view-all-seller">
                  {isRTL ? 'عرض الكل' : 'View All'} <ChevronRight className={`h-4 w-4 ${isRTL ? 'mr-1 rotate-180' : 'ml-1'}`} />
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
                          <p className="text-sm font-bold text-orange-700">{price}</p>
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
