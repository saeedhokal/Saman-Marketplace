import { useCallback } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useLanguage } from "@/hooks/use-language";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Search, Bell, ChevronRight, Car, Wrench, Globe } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ProductCard } from "@/components/ProductCard";
import { PullToRefresh } from "@/components/PullToRefresh";
import { queryClient } from "@/lib/queryClient";
import type { Product } from "@shared/schema";
import dubaiSkylineBg from "@/assets/images/dubai-skyline-bg.png";

export default function Landing() {
  const { user } = useAuth();
  const { t, isRTL, language, setLanguage } = useLanguage();
  const [, navigate] = useLocation();

  const { data: recentProducts = [], refetch: refetchRecent, isLoading: isLoadingRecent } = useQuery<Product[]>({
    queryKey: ["/api/products/recent"],
    refetchOnWindowFocus: true,
    staleTime: 30000,
  });

  const { data: recommendedProducts = [], refetch: refetchRecommended, isLoading: isLoadingRecommended } = useQuery<Product[]>({
    queryKey: ["/api/products/recommended"],
    refetchOnWindowFocus: true,
    staleTime: 30000,
  });

  // Skeleton card component for loading state
  const SkeletonCard = () => (
    <div className="rounded-xl overflow-hidden bg-white/10 backdrop-blur-md border border-white/20 animate-pulse">
      <div className="aspect-square bg-white/5" />
      <div className="p-3 space-y-2">
        <div className="h-4 bg-white/10 rounded w-3/4" />
        <div className="h-3 bg-white/10 rounded w-1/2" />
        <div className="h-4 bg-orange-500/20 rounded w-1/3" />
      </div>
    </div>
  );

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
    <div className="min-h-screen relative -mt-0">
      {/* Full-page Dubai Skyline Background */}
      <div 
        className="fixed inset-0 bg-cover bg-center bg-no-repeat pointer-events-none"
        style={{ backgroundImage: `url(${dubaiSkylineBg})` }}
      />
      {/* Dark overlay for readability */}
      <div className="fixed inset-0 bg-gradient-to-b from-black/50 via-black/30 to-black/60 pointer-events-none" />
      
      <PullToRefresh onRefresh={handleRefresh} className="relative z-10">
        <div className="container mx-auto px-4 pt-2">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-white/70 text-sm">
                {user ? `${t('hey')}, ${user.firstName || 'there'}` : `${t('hey')}, ${t('guest')}`}
              </p>
              <h1 className="text-xl font-bold text-white">{t('welcome')}</h1>
            </div>
            <div className="flex items-center gap-3">
              <button 
                onClick={() => setLanguage(language === 'en' ? 'ar' : 'en')}
                className="relative p-2.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 hover:bg-white/20 transition-colors"
                data-testid="button-language-toggle"
              >
                <Globe className="h-5 w-5 text-white" />
                <span className="absolute -bottom-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-[#f97316] text-white text-[9px] font-bold px-0.5">
                  {language === 'en' ? 'ع' : 'EN'}
                </span>
              </button>
              <button 
                onClick={() => navigate(user ? "/inbox" : "/auth")}
                className="relative p-2.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 hover:bg-white/20 transition-colors" 
                data-testid="button-notifications"
              >
                <Bell className="h-5 w-5 text-white" />
                {unreadData && unreadData.count > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-[#f97316] text-white text-xs font-medium px-1">
                    {unreadData.count > 99 ? '99+' : unreadData.count}
                  </span>
                )}
              </button>
              <Link href="/profile">
                <Avatar className="h-9 w-9 border-2 border-white/30">
                  <AvatarImage src={user?.profileImageUrl || undefined} />
                  <AvatarFallback className="bg-white/20 text-white text-sm backdrop-blur-md">
                    {user?.firstName?.charAt(0) || 'G'}
                  </AvatarFallback>
                </Avatar>
              </Link>
            </div>
          </div>

          {/* Glass Hero Banner - semi-transparent so skyline shows through */}
          <div className="mb-6">
            <div className="relative rounded-2xl overflow-hidden">
              <div className="absolute inset-0 border border-white/20 rounded-2xl" style={{ maskImage: `linear-gradient(to ${isRTL ? 'left' : 'right'}, black 0%, black 25%, transparent 75%)`, WebkitMaskImage: `linear-gradient(to ${isRTL ? 'left' : 'right'}, black 0%, black 25%, transparent 75%)` }} />
              <div className="absolute inset-0" style={{ background: `linear-gradient(to ${isRTL ? 'left' : 'right'}, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0.08) 30%, rgba(255,255,255,0.02) 55%, transparent 100%)`, backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)', maskImage: `linear-gradient(to ${isRTL ? 'left' : 'right'}, black 0%, black 20%, transparent 75%)`, WebkitMaskImage: `linear-gradient(to ${isRTL ? 'left' : 'right'}, black 0%, black 20%, transparent 75%)` }} />
              <div className="absolute inset-0" style={{ background: `linear-gradient(to ${isRTL ? 'left' : 'right'}, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0.03) 30%, transparent 75%)` }} />
              {/* Content */}
              <div className="relative h-40 sm:h-48">
                <div className="relative z-10 p-6 h-full flex items-center justify-start">
                  <div className={`flex flex-col justify-center ${isRTL ? 'items-start text-right' : ''}`}>
                    <p className="text-orange-400 text-xs uppercase tracking-widest mb-2 font-medium">{t('uaeMarketplace')}</p>
                    <h2 className="text-white text-2xl sm:text-3xl font-bold leading-tight">{t('yourNextRide')}</h2>
                    <p className="text-white text-2xl sm:text-3xl font-bold leading-tight">{t('startsHere')}</p>
                    <Link href="/sell">
                      <Button 
                        size="sm" 
                        className="mt-4 bg-[#f97316] hover:bg-[#ea580c] text-white rounded-full px-6 py-2 font-semibold shadow-lg shadow-orange-500/30"
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

          <h2 className="text-base font-semibold text-white mb-3">{t('categories')}</h2>

          {/* Glass Category Cards - semi-transparent */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            <Link href="/categories?tab=automotive">
              <div 
                className="relative h-24 rounded-2xl overflow-hidden group cursor-pointer flex flex-col items-center justify-center p-4 bg-slate-800/60 backdrop-blur-md border border-slate-500/40 hover:border-slate-400/60 transition-all"
                data-testid="card-automotive"
              >
                <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-2 bg-orange-500">
                  <Car className="h-5 w-5 text-white" />
                </div>
                <span className="text-white font-bold text-sm">{t('automotive')}</span>
              </div>
            </Link>

            <Link href="/categories?tab=spare-parts">
              <div 
                className="relative h-24 rounded-2xl overflow-hidden group cursor-pointer flex flex-col items-center justify-center p-4 border border-orange-400/50 hover:border-orange-300/70 transition-all shadow-lg shadow-orange-500/20"
                style={{ background: 'linear-gradient(135deg, rgba(249,115,22,0.85) 0%, rgba(234,88,12,0.9) 50%, rgba(251,146,60,0.85) 100%)' }}
                data-testid="card-spare-parts"
              >
                <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-2 bg-white/25 backdrop-blur-sm">
                  <Wrench className="h-5 w-5 text-white" />
                </div>
                <span className="text-white font-bold text-sm">{t('spareParts')}</span>
              </div>
            </Link>
          </div>

        {/* For You Section - show skeleton while loading */}
        {(isLoadingRecommended || recommendedProducts.length > 0) && (
          <div className="mb-4 -mx-4 px-4 py-4 bg-black/30 backdrop-blur-sm">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-bold text-white">{t('forYou')}</h2>
              <Link href="/categories">
                <span className="text-orange-400 text-sm font-medium" data-testid="link-view-all-recommended">{t('viewAll')}</span>
              </Link>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
              {isLoadingRecommended ? (
                <>
                  <SkeletonCard />
                  <SkeletonCard />
                  <SkeletonCard />
                  <SkeletonCard />
                </>
              ) : (
                recommendedProducts.slice(0, 6).map((product) => (
                  <ProductCard 
                    key={product.id} 
                    product={product}
                    sellerImageUrl={(product as any).sellerProfileImageUrl}
                    showDate
                  />
                ))
              )}
            </div>
          </div>
        )}

        {/* Recent Posts Section - show skeleton while loading */}
        {(isLoadingRecent || recentProducts.length > 0) && (
          <div className="mb-0 -mx-4 px-4 py-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-bold text-white">{t('recentPosts')}</h2>
              <Link href="/categories">
                <span className="text-orange-400 text-sm font-medium" data-testid="link-view-all-recent">{t('viewAll')}</span>
              </Link>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
              {isLoadingRecent ? (
                <>
                  <SkeletonCard />
                  <SkeletonCard />
                  <SkeletonCard />
                  <SkeletonCard />
                </>
              ) : (
                recentProducts.slice(0, 6).map((product) => (
                  <ProductCard 
                    key={product.id} 
                    product={product}
                    sellerImageUrl={(product as any).sellerProfileImageUrl}
                    showDate
                  />
                ))
              )}
            </div>
          </div>
        )}

        </div>
      </PullToRefresh>
    </div>
  );
}
