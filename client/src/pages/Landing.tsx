import { useCallback } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useLanguage } from "@/hooks/use-language";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Search, Bell, ChevronRight, Car, Wrench } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ProductCard } from "@/components/ProductCard";
import { PullToRefresh } from "@/components/PullToRefresh";
import { queryClient } from "@/lib/queryClient";
import type { Product } from "@shared/schema";
import dubaiSkylineBanner from "@/assets/images/dubai-skyline-banner.jpg";

export default function Landing() {
  const { user } = useAuth();
  const { t, isRTL } = useLanguage();
  const [, navigate] = useLocation();

  const { data: recentProducts = [], refetch: refetchRecent } = useQuery<Product[]>({
    queryKey: ["/api/products/recent"],
    refetchOnWindowFocus: true,
    staleTime: 30000,
  });

  const { data: recommendedProducts = [], refetch: refetchRecommended } = useQuery<Product[]>({
    queryKey: ["/api/products/recommended"],
    refetchOnWindowFocus: true,
    staleTime: 30000,
  });

  const { data: unreadData } = useQuery<{ count: number }>({
    queryKey: ["/api/notifications/unread-count"],
    enabled: !!user,
    refetchInterval: 30000, // Refetch every 30 seconds for real-time badge updates
    refetchOnWindowFocus: true,
  });

  const handleRefresh = useCallback(async () => {
    await Promise.all([
      refetchRecent(),
      refetchRecommended(),
      queryClient.invalidateQueries({ queryKey: ['/api/products'] }),
      queryClient.invalidateQueries({ queryKey: ['/api/notifications/unread-count'] }),
    ]);
  }, [refetchRecent, refetchRecommended]);

  return (
    <PullToRefresh onRefresh={handleRefresh} className="min-h-screen bg-background pb-20">
      <div className="container mx-auto px-4 pt-3">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-muted-foreground text-sm">
              {user ? `${t('hey')}, ${user.firstName || 'there'}` : `${t('hey')}, ${t('guest')}`}
            </p>
            <h1 className="text-xl font-bold text-foreground">{t('welcome')}</h1>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={() => navigate(user ? "/inbox" : "/auth")}
              className="relative p-2 rounded-full hover:bg-secondary transition-colors" 
              data-testid="button-notifications"
            >
              <Bell className="h-5 w-5 text-muted-foreground" />
              {unreadData && unreadData.count > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-[#FF5722] text-white text-xs font-medium px-1">
                  {unreadData.count > 99 ? '99+' : unreadData.count}
                </span>
              )}
            </button>
            <Link href="/profile">
              <Avatar className="h-9 w-9 border-2 border-border">
                <AvatarImage src={user?.profileImageUrl || undefined} />
                <AvatarFallback className="bg-primary/10 text-primary text-sm">
                  {user?.firstName?.charAt(0) || 'G'}
                </AvatarFallback>
              </Avatar>
            </Link>
          </div>
        </div>

        <Link href="/categories">
          <div className={`flex items-center border border-border rounded-full px-4 py-2 mb-4 hover:bg-secondary/50 transition-colors ${isRTL ? 'flex-row-reverse' : ''}`}>
            <Search className={`h-5 w-5 text-muted-foreground ${isRTL ? 'ml-3' : 'mr-3'}`} />
            <span className="text-muted-foreground">{t('search')}</span>
          </div>
        </Link>

        {/* Dubai Skyline Hero Banner */}
        <div className="mb-6">
          <div className="relative rounded-2xl overflow-hidden">
            {/* Background Image */}
            <img 
              src={dubaiSkylineBanner} 
              alt="Dubai Skyline" 
              className="absolute inset-0 w-full h-full object-cover"
            />
            {/* Dark Overlay */}
            <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/50 to-transparent" />
            
            {/* Content */}
            <div className="relative h-44 sm:h-52">
              <div className={`relative z-10 p-6 h-full flex items-center ${isRTL ? 'justify-end' : 'justify-start'}`}>
                <div className={`flex flex-col justify-center ${isRTL ? 'items-end text-right' : ''}`}>
                  <p className="text-white/70 text-xs uppercase tracking-widest mb-2 font-medium">{t('uaeMarketplace')}</p>
                  <h2 className="text-white text-2xl sm:text-3xl font-bold leading-tight">{t('buyAndSell')}</h2>
                  <p className="text-white text-2xl sm:text-3xl font-bold leading-tight">{t('sparePartsAndCars')}</p>
                  <Link href="/sell">
                    <Button 
                      size="sm" 
                      className="mt-4 bg-[#f97316] hover:bg-[#ea580c] text-white rounded-full px-6 py-2 font-semibold"
                      data-testid="banner-cta-sell"
                    >
                      {t('startSelling')}
                      <ChevronRight className={`h-4 w-4 ${isRTL ? 'mr-1 rotate-180' : 'ml-1'}`} />
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>

        <h2 className="text-base font-semibold text-foreground mb-3">{t('categories')}</h2>

        <div className="grid grid-cols-2 gap-3 mb-6">
          <Link href="/categories?tab=automotive">
            <div 
              className="relative h-28 rounded-xl overflow-hidden group cursor-pointer flex flex-col items-center justify-center p-4"
              style={{ backgroundColor: '#3a4553' }}
              data-testid="card-automotive"
            >
              <div 
                className="w-12 h-12 rounded-full flex items-center justify-center mb-2"
                style={{ backgroundColor: '#f97316' }}
              >
                <Car className="h-6 w-6 text-white" />
              </div>
              <span className="text-white font-bold text-sm">{t('automotive')}</span>
            </div>
          </Link>

          <Link href="/categories?tab=spare-parts">
            <div 
              className="relative h-28 rounded-xl overflow-hidden group cursor-pointer flex flex-col items-center justify-center p-4"
              style={{ backgroundColor: '#f97316' }}
              data-testid="card-spare-parts"
            >
              <div 
                className="w-12 h-12 rounded-full flex items-center justify-center mb-2"
                style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}
              >
                <Wrench className="h-6 w-6 text-white" />
              </div>
              <span className="text-white font-bold text-sm">{t('spareParts')}</span>
            </div>
          </Link>
        </div>

        {recommendedProducts.length > 0 && (
          <div className="mb-4 -mx-4 px-4 py-4 bg-secondary/30">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-bold text-foreground">{t('forYou')}</h2>
              <Link href="/categories">
                <span className="text-accent text-sm font-medium" data-testid="link-view-all-recommended">{t('viewAll')}</span>
              </Link>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
              {recommendedProducts.slice(0, 6).map((product) => (
                <ProductCard 
                  key={product.id} 
                  product={product}
                  sellerImageUrl={(product as any).sellerProfileImageUrl}
                  showDate
                />
              ))}
            </div>
          </div>
        )}

        {recentProducts.length > 0 && (
          <div className="mb-4 -mx-4 px-4 py-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-bold text-foreground">{t('recentPosts')}</h2>
              <Link href="/categories">
                <span className="text-accent text-sm font-medium" data-testid="link-view-all-recent">{t('viewAll')}</span>
              </Link>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
              {recentProducts.slice(0, 6).map((product) => (
                <ProductCard 
                  key={product.id} 
                  product={product}
                  sellerImageUrl={(product as any).sellerProfileImageUrl}
                  showDate
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </PullToRefresh>
  );
}
