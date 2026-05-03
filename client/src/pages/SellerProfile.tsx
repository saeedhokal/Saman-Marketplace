import { useRoute } from "wouter";
import { useSellerProducts } from "@/hooks/use-products";
import { ProductCard } from "@/components/ProductCard";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Store, Calendar, Lock } from "lucide-react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { useAuth } from "@/hooks/use-auth";
import { useLanguage } from "@/hooks/use-language";

type SellerInfo = {
  id: string;
  displayName: string | null;
  firstName: string | null;
  lastName: string | null;
  profileImageUrl: string | null;
  createdAt: string;
};

export default function SellerProfile() {
  const [, params] = useRoute("/seller/:sellerId");
  const sellerId = params?.sellerId || "";
  const { user, isLoading: authLoading } = useAuth();
  const { isRTL } = useLanguage();

  const { data: products, isLoading, error } = useSellerProducts(sellerId);

  const { data: sellerInfo, isLoading: sellerLoading } = useQuery<SellerInfo>({
    queryKey: ['/api/sellers', sellerId],
    enabled: !!sellerId && !!user,
  });

  if (!authLoading && !user) {
    return (
      <div className="min-h-screen bg-background py-8 px-4">
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
            <ArrowLeft className="h-4 w-4 mr-2" /> {isRTL ? 'رجوع' : 'Back'}
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
    return 'Seller';
  };

  const getMemberSince = () => {
    if (!sellerInfo?.createdAt) return null;
    try {
      return format(new Date(sellerInfo.createdAt), 'MMMM yyyy');
    } catch {
      return null;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background py-8 px-4">
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
      <div className="min-h-screen bg-background py-8 px-4">
        <div className="container mx-auto max-w-6xl text-center py-20">
          <h2 className="text-xl font-bold text-destructive">Unable to load seller profile</h2>
          <Button variant="outline" className="mt-4" onClick={() => window.history.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" /> Back
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="container mx-auto max-w-6xl">
        <Button variant="ghost" className="mb-6" data-testid="button-back" onClick={() => window.history.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Back
        </Button>

        <div className="flex items-center gap-4 mb-8 p-6 bg-card rounded-2xl border border-border">
          <Avatar className="h-16 w-16">
            {sellerInfo?.profileImageUrl ? (
              <AvatarImage src={sellerInfo.profileImageUrl} alt={getSellerDisplayName()} />
            ) : null}
            <AvatarFallback className="bg-primary/10 text-primary text-xl">
              <Store className="h-8 w-8" />
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <h1 className="font-display text-2xl font-bold text-foreground" data-testid="text-seller-name">
              {getSellerDisplayName()}
            </h1>
            <p className="text-muted-foreground">
              {products.length} {products.length === 1 ? "listing" : "listings"} available
            </p>
            {getMemberSince() && (
              <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                <Calendar className="h-3 w-3" />
                <span>Member since {getMemberSince()}</span>
              </div>
            )}
          </div>
        </div>

        {products.length === 0 ? (
          <div className="text-center py-20 bg-secondary/30 rounded-2xl">
            <Store className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-bold">No listings yet</h3>
            <p className="text-muted-foreground mt-2">
              This seller hasn't posted any listings.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-6">
            {products.map((product) => (
              <ProductCard 
                key={product.id} 
                product={product} 
                sellerImageUrl={sellerInfo?.profileImageUrl}
                showDate
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
