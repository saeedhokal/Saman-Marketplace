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
      <div className="container mx-auto px-4 pt-6">
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
          <div className="relative rounded-2xl overflow-hidden" style={{ background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 50%, #3d3d3d 100%)' }}>
            <div className="relative h-44 sm:h-52">
              {/* Dubai Skyline Silhouette */}
              <svg 
                viewBox="0 0 800 200" 
                className="absolute bottom-0 left-0 w-full h-24 sm:h-28"
                preserveAspectRatio="xMidYMax slice"
              >
                <defs>
                  <linearGradient id="skylineGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#f97316" stopOpacity="0.8"/>
                    <stop offset="100%" stopColor="#f97316" stopOpacity="0.3"/>
                  </linearGradient>
                </defs>
                {/* Burj Khalifa and Dubai Skyline */}
                <path 
                  d="M0,200 L0,180 L30,180 L30,160 L35,160 L35,180 L60,180 L60,150 L70,150 L70,140 L75,140 L75,130 L80,130 L80,120 L85,120 L85,110 L90,110 L90,120 L95,120 L95,130 L100,130 L100,140 L105,140 L105,150 L115,150 L115,180 L140,180 L140,130 L150,130 L150,120 L160,120 L160,130 L170,130 L170,180 L200,180 L200,100 L210,100 L210,90 L220,90 L220,80 L230,80 L230,70 L235,70 L235,50 L238,50 L238,30 L240,30 L240,20 L242,20 L242,10 L244,10 L244,5 L246,5 L246,10 L248,10 L248,20 L250,20 L250,30 L252,30 L252,50 L255,50 L255,70 L260,70 L260,80 L270,80 L270,90 L280,90 L280,100 L290,100 L290,180 L320,180 L320,140 L330,140 L330,130 L340,130 L340,140 L345,140 L345,120 L350,120 L350,110 L355,110 L355,120 L360,120 L360,140 L370,140 L370,180 L400,180 L400,160 L410,160 L410,140 L420,140 L420,130 L425,130 L425,110 L430,110 L430,100 L435,100 L435,90 L440,90 L440,100 L445,100 L445,110 L450,110 L450,130 L455,130 L455,140 L465,140 L465,160 L475,160 L475,180 L510,180 L510,150 L520,150 L520,140 L530,140 L530,150 L540,150 L540,180 L570,180 L570,160 L580,160 L580,150 L590,150 L590,160 L600,160 L600,180 L630,180 L630,140 L640,140 L640,130 L645,130 L645,110 L650,110 L650,130 L655,130 L655,140 L665,140 L665,180 L700,180 L700,150 L710,150 L710,140 L720,140 L720,150 L730,150 L730,180 L770,180 L770,160 L780,160 L780,180 L800,180 L800,200 Z"
                  fill="url(#skylineGradient)"
                />
              </svg>
              
              {/* Content */}
              <div className={`relative z-10 p-6 h-full flex items-center ${isRTL ? 'justify-end' : 'justify-start'}`}>
                <div className={`flex flex-col justify-center ${isRTL ? 'items-end text-right' : ''}`}>
                  <p className="text-white/60 text-xs uppercase tracking-wider mb-1">{t('uaeMarketplace')}</p>
                  <h2 className="text-white text-xl sm:text-2xl font-bold mb-1">{t('buyAndSell')}</h2>
                  <p className="text-[#f97316] font-semibold text-base sm:text-lg">{t('sparePartsAndCars')}</p>
                  <Link href="/sell">
                    <Button 
                      size="sm" 
                      className="mt-3 bg-[#f97316] hover:bg-[#ea580c] text-white rounded-full px-5"
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
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-foreground">{t('forYou')}</h2>
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
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-foreground">{t('recentPosts')}</h2>
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
