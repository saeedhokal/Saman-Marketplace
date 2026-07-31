import { useRoute } from "wouter";
import { useSellerProducts } from "@/hooks/use-products";
import { ProductCard } from "@/components/ProductCard";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getInitial } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Store, Calendar, Lock, Share2, Phone } from "lucide-react";
import { SiWhatsapp } from "react-icons/si";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { useAuth } from "@/hooks/use-auth";
import { useLanguage } from "@/hooks/use-language";
import { ListingViewSwitcher } from "@/components/ListingViewSwitcher";
import { DownloadAppButton, ActionsDropdown } from "@/components/WebChromeActions";
import { useListingView } from "@/hooks/use-listing-view";

type SellerInfo = {
  id: string;
  displayName: string | null;
  firstName: string | null;
  lastName: string | null;
  profileImageUrl: string | null;
  createdAt: string;
  phone: string | null;
};

export default function SellerProfile() {
  const [, params] = useRoute("/seller/:sellerId");
  const sellerId = params?.sellerId || "";
  const { user, isLoading: authLoading } = useAuth();
  const { t, isRTL } = useLanguage();
  const { density, gridClasses } = useListingView();
  const { toast } = useToast();
  const [showAuthPrompt, setShowAuthPrompt] = useState(false);

  const goToAuth = (mode: "login" | "signup" = "signup") => {
    const returnTo = `/seller/${sellerId}`;
    const modeParam = mode === "signup" ? "&mode=signup" : "";
    window.location.href = `/auth?returnTo=${encodeURIComponent(returnTo)}${modeParam}`;
  };

  // Contact info requires a signed-in user
  const handleContactClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (!user) {
      e.preventDefault();
      setShowAuthPrompt(true);
    }
  };

  const formatPhoneForCall = (num: string) => {
    let digits = num.replace(/[^0-9]/g, "");
    if (digits.startsWith("00")) digits = digits.slice(2);
    if (digits.startsWith("971")) return `+${digits}`;
    if (digits.startsWith("0")) return `+971${digits.slice(1)}`;
    return `+971${digits}`;
  };

  const formatWhatsAppNumber = (num: string) => {
    return num.replace(/[^0-9]/g, "");
  };

  const handleShare = async () => {
    // Smart link: opens the app if installed, falls back to the website
    const smartUrl = `https://thesamanapp.com/open?path=/seller/${sellerId}`;

    // Pass ONLY url to navigator.share — on iOS, including `text` causes the
    // share sheet's "Copy" button to copy the text instead of the URL.
    if (navigator.share) {
      try {
        await navigator.share({ url: smartUrl });
        return;
      } catch (err: any) {
        if (err.name === "AbortError") return;
        console.error("Share failed:", err);
        // fall through to clipboard fallback
      }
    }
    try {
      await navigator.clipboard.writeText(smartUrl);
      toast({
        title: isRTL ? "تم نسخ الرابط" : "Link Copied",
        description: isRTL ? "تم نسخ رابط ملف البائع." : "Seller profile link copied to clipboard.",
      });
    } catch {
      toast({
        variant: "destructive",
        title: isRTL ? "خطأ" : "Error",
        description: isRTL ? "تعذر نسخ الرابط." : "Could not copy link.",
      });
    }
  };

  const { data: products, isLoading, error } = useSellerProducts(sellerId);

  const { data: sellerInfo, isLoading: sellerLoading } = useQuery<SellerInfo>({
    queryKey: ['/api/sellers', sellerId],
    enabled: !!sellerId && !!user,
  });

  const sellerPhone = sellerInfo?.phone || "";
  const hasPhone = sellerPhone.replace(/[^0-9]/g, "").length > 0;

  if (!authLoading && !user) {
    return (
      <div className="min-h-screen bg-background py-8 px-4" dir={isRTL ? 'rtl' : 'ltr'}>
        <div className="container mx-auto max-w-md text-center py-20">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <Lock className="h-8 w-8 text-primary" />
          </div>
          <h2 className="font-display text-2xl font-bold text-foreground mb-2" data-testid="text-seller-locked-title">
            {isRTL ? 'سجّل لعرض ملف البائع' : 'Log in to view this seller'}
          </h2>
          <p className="text-muted-foreground mb-6" data-testid="text-seller-locked-description">
            {isRTL
              ? 'أنشئ حسابًا أو سجّل دخولك لرؤية ملف البائع وقوائمه الأخرى.'
              : 'Create an account or log in to see the seller and their other listings.'}
          </p>
          <div className="flex items-center justify-center gap-2">
            <Button
              variant="outline"
              onClick={() => { window.location.href = `/auth?returnTo=${encodeURIComponent(`/seller/${sellerId}`)}`; }}
              data-testid="button-seller-locked-login"
            >
              {isRTL ? 'تسجيل الدخول' : 'Log in'}
            </Button>
            <Button
              onClick={() => { window.location.href = `/auth?returnTo=${encodeURIComponent(`/seller/${sellerId}`)}&mode=signup`; }}
              data-testid="button-seller-locked-signup"
            >
              {isRTL ? 'إنشاء حساب' : 'Sign up'}
            </Button>
          </div>
          <Button variant="ghost" className="mt-6" onClick={() => window.history.back()}>
            <ArrowLeft className={`h-4 w-4 ${isRTL ? 'ml-2 rotate-180' : 'mr-2'}`} /> {isRTL ? 'رجوع' : 'Back'}
          </Button>
        </div>
      </div>
    );
  }

  const getSellerDisplayName = () => {
    if (sellerInfo?.displayName) return sellerInfo.displayName;
    if (sellerInfo?.firstName || sellerInfo?.lastName) {
      return `${sellerInfo.firstName || ''} ${sellerInfo.lastName || ''}`.trim();
    }
    return t('seller');
  };

  const getMemberSince = () => {
    if (!sellerInfo?.createdAt) return null;
    try {
      return format(new Date(sellerInfo.createdAt), 'MMMM yyyy', isRTL ? { locale: ar } : undefined);
    } catch {
      return null;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background py-8 px-4" dir={isRTL ? 'rtl' : 'ltr'}>
        <div className="container mx-auto max-w-6xl">
          <div className="flex items-center gap-4 mb-8">
            <Skeleton className="h-16 w-16 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-32" />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-64 rounded-2xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error || !products) {
    return (
      <div className="min-h-screen bg-background py-8 px-4" dir={isRTL ? 'rtl' : 'ltr'}>
        <div className="container mx-auto max-w-6xl text-center py-20">
          <h2 className="text-xl font-bold text-destructive">{t('failedToLoadSeller')}</h2>
          <Button variant="outline" className="mt-4" onClick={() => window.history.back()}>
            <ArrowLeft className={`h-4 w-4 ${isRTL ? 'ml-2 rotate-180' : 'mr-2'}`} /> {t('back')}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-8 px-4" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="container mx-auto max-w-6xl">
        <Button variant="ghost" className="mb-6" data-testid="button-back" onClick={() => window.history.back()}>
          <ArrowLeft className={`h-4 w-4 ${isRTL ? 'ml-2 rotate-180' : 'mr-2'}`} /> {t('back')}
        </Button>

        <div className="flex items-center gap-4 mb-8 p-6 bg-card rounded-2xl border border-border">
          <Avatar className="h-16 w-16">
            {sellerInfo?.profileImageUrl ? (
              <AvatarImage src={sellerInfo.profileImageUrl} alt={getSellerDisplayName()} />
            ) : null}
            <AvatarFallback className="bg-[#f97316] text-white text-xl font-semibold">
              {getInitial(sellerInfo?.displayName, sellerInfo?.firstName, sellerInfo?.lastName) || <Store className="h-8 w-8" />}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <h1 dir="auto" className="font-display text-2xl font-bold text-foreground" data-testid="text-seller-name">
              {getSellerDisplayName()}
            </h1>
            <p className="text-muted-foreground">
              {products.length} {products.length === 1 ? t('listingAvailable') : t('listingsAvailable')}
            </p>
            {getMemberSince() && (
              <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                <Calendar className="h-3 w-3" />
                <span>{t('memberSince')} {getMemberSince()}</span>
              </div>
            )}
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={handleShare}
            aria-label={isRTL ? "مشاركة ملف البائع" : "Share seller profile"}
            data-testid="button-share-seller"
          >
            <Share2 className="h-5 w-5" />
          </Button>
        </div>

        <div className="flex items-center gap-3 mb-8">
          <a
            href={user && hasPhone ? `tel:${formatPhoneForCall(sellerPhone)}` : '#'}
            className="flex-1"
            aria-disabled={user && !hasPhone ? true : undefined}
            onClick={(e) => {
              if (user && !hasPhone) { e.preventDefault(); return; }
              handleContactClick(e);
            }}
          >
            <Button
              size="sm"
              variant="outline"
              className="w-full"
              disabled={user ? !hasPhone : false}
              data-testid="button-call-seller"
            >
              <Phone className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} /> {isRTL ? 'اتصال' : 'Call'}
            </Button>
          </a>

          <a
            href={user && hasPhone ? `https://wa.me/${formatWhatsAppNumber(formatPhoneForCall(sellerPhone))}` : '#'}
            target={user && hasPhone ? "_blank" : undefined}
            rel={user && hasPhone ? "noopener noreferrer" : undefined}
            className="flex-1"
            aria-disabled={user && !hasPhone ? true : undefined}
            onClick={(e) => {
              if (user && !hasPhone) { e.preventDefault(); return; }
              handleContactClick(e);
            }}
          >
            <Button
              size="sm"
              variant="outline"
              className="w-full text-green-600 border-green-600 hover:bg-green-50"
              disabled={user ? !hasPhone : false}
              data-testid="button-whatsapp-seller"
            >
              <SiWhatsapp className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} /> WhatsApp
            </Button>
          </a>
        </div>

        <Dialog open={showAuthPrompt} onOpenChange={setShowAuthPrompt}>
          <DialogContent data-testid="dialog-auth-prompt-seller">
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

        {products.length === 0 ? (
          <div className="text-center py-20 bg-secondary/30 rounded-2xl">
            <Store className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-bold">{t('noListingsYet')}</h3>
            <p className="text-muted-foreground mt-2">
              {t('sellerNoListings')}
            </p>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between gap-2 mb-3">
              <ListingViewSwitcher />
              <div className="flex items-center gap-2">
                <DownloadAppButton variant="compact" />
                <ActionsDropdown />
              </div>
            </div>
            <div className={gridClasses}>
              {products.map((product) => (
                <ProductCard 
                  key={product.id} 
                  product={product} 
                  sellerImageUrl={sellerInfo?.profileImageUrl}
                  sellerFirstName={sellerInfo?.firstName}
                  sellerLastName={sellerInfo?.lastName}
                  sellerDisplayName={(sellerInfo as any)?.displayName}
                  showDate
                  density={density}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
