import { useCallback, useState, useEffect, useRef } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useLanguage } from "@/hooks/use-language";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Search, Bell, ChevronRight, Car, Wrench, Globe, Moon, Sun, ArrowRight } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getInitial } from "@/lib/utils";
import { ProductCard } from "@/components/ProductCard";
import { ListingViewSwitcher } from "@/components/ListingViewSwitcher";
import { DownloadAppButton, ActionsDropdown } from "@/components/WebChromeActions";
import { DesktopLanding } from "@/components/DesktopLanding";
import { useListingView } from "@/hooks/use-listing-view";
import { PullToRefresh } from "@/components/PullToRefresh";
import { queryClient } from "@/lib/queryClient";
import type { Product } from "@shared/schema";
import dubaiNightSkyline from "@/assets/images/dubai-night-skyline.png";

let landingSavedScrollY: number = 0;

export default function Landing() {
  const { user } = useAuth();
  const { t, isRTL, language, setLanguage } = useLanguage();
  const [, navigate] = useLocation();
  const { density, gridClasses, isNative } = useListingView();

  useEffect(() => {
    const container = document.getElementById('main-scroll-container');
    if (!container) return;
    const handleScroll = () => { landingSavedScrollY = container.scrollTop; };
    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => container.removeEventListener('scroll', handleScroll);
  }, []);

  const [darkMode, setDarkMode] = useState(() => {
    return document.documentElement.classList.contains('dark');
  });

  const toggleDarkMode = useCallback(() => {
    const root = document.documentElement;
    const isDark = root.classList.contains('dark');
    if (isDark) {
      root.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    } else {
      root.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    }
    setDarkMode(!isDark);
  }, []);

  const { data: recentProducts = [], refetch: refetchRecent, isLoading: isLoadingRecent } = useQuery<Product[]>({
    queryKey: ["/api/products/recent?limit=12"],
    refetchOnWindowFocus: true,
    staleTime: 30000,
  });

  const { data: recommendedProducts = [], refetch: refetchRecommended, isLoading: isLoadingRecommended } = useQuery<Product[]>({
    queryKey: ["/api/products/recommended?limit=12"],
    refetchOnWindowFocus: true,
    staleTime: 30000,
  });

  const hasRestoredScroll = useRef(false);
  useEffect(() => {
    if (!isLoadingRecent && recentProducts.length > 0 && landingSavedScrollY > 0 && !hasRestoredScroll.current) {
      hasRestoredScroll.current = true;
      const container = document.getElementById('main-scroll-container');
      if (!container) return;
      const tryRestore = (attempts: number) => {
        if (attempts <= 0) return;
        requestAnimationFrame(() => {
          if (container.scrollHeight > landingSavedScrollY) {
            container.scrollTop = landingSavedScrollY;
          } else {
            setTimeout(() => tryRestore(attempts - 1), 50);
          }
        });
      };
      tryRestore(20);
    }
  }, [isLoadingRecent, recentProducts]);

  // Skeleton card component for loading state
  const SkeletonCard = () => (
    <div className="rounded-xl overflow-hidden bg-gray-100 dark:bg-white/10 backdrop-blur-md border border-gray-200 dark:border-white/20 animate-pulse">
      <div className="aspect-square bg-gray-200 dark:bg-white/5" />
      <div className="p-3 space-y-2">
        <div className="h-4 bg-gray-200 dark:bg-white/10 rounded w-3/4" />
        <div className="h-3 bg-gray-200 dark:bg-white/10 rounded w-1/2" />
        <div className="h-4 bg-orange-200 dark:bg-orange-500/20 rounded w-1/3" />
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
    <div className="relative" style={{ minHeight: 'var(--app-height)' }}>
      {/* Layer 0: Solid base page background */}
      <div
        className="fixed inset-0 pointer-events-none transition-colors duration-500 bg-gray-50 dark:bg-[#0a0d14] -z-10"
        style={{ pointerEvents: 'none' }}
      />

      {/* Layer 1: Atmospheric Dubai skyline behind the top hero area (dark mode only) */}
      <div
        className="absolute top-0 left-0 right-0 pointer-events-none hidden dark:block overflow-hidden"
        style={{ height: '560px', zIndex: 0 }}
        aria-hidden="true"
      >
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `url(${dubaiNightSkyline})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center 55%',
            filter: 'blur(2px) saturate(1.05) brightness(0.85)',
            transform: 'scale(1.05)',
            WebkitMaskImage: 'linear-gradient(180deg, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.9) 55%, rgba(0,0,0,0.5) 80%, rgba(0,0,0,0) 100%)',
            maskImage: 'linear-gradient(180deg, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.9) 55%, rgba(0,0,0,0.5) 80%, rgba(0,0,0,0) 100%)',
          }}
        />
        {/* Subtle darkening scrim for header readability */}
        <div className="absolute inset-0 bg-black/25" />
      </div>
      
      {/* Desktop-only redesigned landing — hidden on small screens and inside the native app */}
      {!isNative && (
        <div className="hidden md:block relative z-10">
          <DesktopLanding recentProducts={recentProducts} isLoadingRecent={isLoadingRecent} />
        </div>
      )}

      <PullToRefresh onRefresh={handleRefresh} className={`relative z-10 ${!isNative ? "md:hidden" : ""}`}>
        <div className="container mx-auto px-4 pt-2">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-gray-500 dark:text-white/70 text-sm">
                {user ? `${t('hey')}, ${user.firstName || 'there'}` : `${t('hey')}, ${t('guest')}`}
              </p>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">{t('welcome')}</h1>
            </div>
            <div className="flex items-center gap-3">
              <button 
                onClick={toggleDarkMode}
                className="p-2.5 rounded-full bg-gray-100 dark:bg-white/10 backdrop-blur-md border border-gray-200 dark:border-white/20 hover:bg-gray-200 dark:hover:bg-white/20 transition-colors"
                data-testid="button-theme-toggle"
              >
                {darkMode ? (
                  <Sun className="h-5 w-5 text-yellow-500" />
                ) : (
                  <Moon className="h-5 w-5 text-gray-600" />
                )}
              </button>
              <button 
                onClick={() => setLanguage(language === 'en' ? 'ar' : 'en')}
                className="relative p-2.5 rounded-full bg-gray-100 dark:bg-white/10 backdrop-blur-md border border-gray-200 dark:border-white/20 hover:bg-gray-200 dark:hover:bg-white/20 transition-colors"
                data-testid="button-language-toggle"
              >
                <Globe className="h-5 w-5 text-gray-600 dark:text-white" />
                <span className="absolute -bottom-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-[#f97316] text-white text-[9px] font-bold px-0.5">
                  {language === 'en' ? 'ع' : 'EN'}
                </span>
              </button>
              <button 
                onClick={() => navigate(user ? "/inbox" : "/auth")}
                className="relative p-2.5 rounded-full bg-gray-100 dark:bg-white/10 backdrop-blur-md border border-gray-200 dark:border-white/20 hover:bg-gray-200 dark:hover:bg-white/20 transition-colors" 
                data-testid="button-notifications"
              >
                <Bell className="h-5 w-5 text-gray-600 dark:text-white" />
                {unreadData && unreadData.count > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-[#f97316] text-white text-xs font-medium px-1">
                    {unreadData.count > 99 ? '99+' : unreadData.count}
                  </span>
                )}
              </button>
              <DownloadAppButton variant="compact" />
              <ActionsDropdown />
              <Link href="/profile">
                <Avatar className="h-9 w-9 border-2 border-gray-200 dark:border-white/30">
                  <AvatarImage src={user?.profileImageUrl || undefined} />
                  <AvatarFallback className="bg-gray-100 dark:bg-white/20 text-gray-700 dark:text-white text-sm backdrop-blur-md">
                    {getInitial((user as any)?.displayName, user?.firstName, user?.lastName, user?.email) || 'G'}
                  </AvatarFallback>
                </Avatar>
              </Link>
            </div>
          </div>

          {/* Hero Banner - Frosted glass over page skyline */}
          <div className="mb-6">
            <div
              className="relative rounded-3xl overflow-hidden shadow-xl shadow-black/20 dark:shadow-black/50"
              style={{
                minHeight: '230px',
                WebkitMaskImage: `linear-gradient(${isRTL ? '270deg' : '90deg'}, rgba(0,0,0,1) 0%, rgba(0,0,0,1) 55%, rgba(0,0,0,0.6) 80%, rgba(0,0,0,0) 100%)`,
                maskImage: `linear-gradient(${isRTL ? '270deg' : '90deg'}, rgba(0,0,0,1) 0%, rgba(0,0,0,1) 55%, rgba(0,0,0,0.6) 80%, rgba(0,0,0,0) 100%)`,
              }}
              data-testid="hero-card"
            >
              {/* Light mode: card-local skyline (no page-level skyline in light mode) */}
              <div
                className="absolute inset-0 dark:hidden"
                style={{
                  backgroundImage: `url(${dubaiNightSkyline})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center 55%',
                }}
              />
              {/* Dark mode: translucent frosted glass that reveals the page skyline behind */}
              <div
                className="absolute inset-0 hidden dark:block"
                style={{
                  background: 'rgba(255,255,255,0.03)',
                  backdropFilter: 'blur(8px) saturate(1.1)',
                  WebkitBackdropFilter: 'blur(8px) saturate(1.1)',
                }}
              />
              {/* Left-to-right dark fade for text readability (both modes) */}
              <div
                className="absolute inset-0"
                style={{
                  background: `linear-gradient(${isRTL ? '270deg' : '90deg'}, rgba(0,0,0,0.65) 0%, rgba(0,0,0,0.35) 50%, rgba(0,0,0,0.05) 100%)`,
                }}
              />
              {/* Content */}
              <div className="relative z-10 p-6 flex flex-col justify-between items-start" style={{ minHeight: '230px' }} dir={isRTL ? 'rtl' : 'ltr'}>
                <div className={isRTL ? 'text-right w-full' : ''}>
                  <p className="text-orange-400 text-[11px] font-bold uppercase tracking-[0.18em]">
                    {t('uaeMarketplace')}
                  </p>
                  <h2 className={`mt-2.5 text-white text-2xl sm:text-3xl font-extrabold leading-[1.15] tracking-tight ${isRTL ? 'max-w-[72%] ml-auto' : 'max-w-[62%]'}`}>
                    {t('yourNextRide')} {t('startsHere')}
                  </h2>
                  <p className={`mt-2 text-[13px] leading-snug text-gray-200/90 ${isRTL ? 'max-w-[72%] ml-auto' : 'max-w-[62%]'}`}>
                    {t('heroSubtitle')}
                  </p>
                </div>
                <Link href="/sell">
                  <button
                    className="mt-4 inline-flex items-center gap-2.5 rounded-full px-5 py-3 font-bold text-sm text-white shadow-lg shadow-orange-500/40"
                    style={{ background: 'linear-gradient(180deg, #f97316 0%, #ea580c 100%)' }}
                    data-testid="banner-cta-sell"
                  >
                    {t('startSelling')}
                    <span className="inline-flex items-center justify-center w-[22px] h-[22px] rounded-full bg-white/20">
                      <ArrowRight className={`h-3 w-3 ${isRTL ? 'rotate-180' : ''}`} strokeWidth={2.5} />
                    </span>
                  </button>
                </Link>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-semibold text-gray-900 dark:text-white">{t('categories')}</h2>
            <Link href="/categories">
              <span className="text-orange-500 dark:text-orange-400 text-sm font-medium inline-flex items-center gap-1" data-testid="link-view-all-categories">
                {t('viewAll')}
                <ChevronRight className={`h-4 w-4 ${isRTL ? 'rotate-180' : ''}`} />
              </span>
            </Link>
          </div>

          {/* Category Cards */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            <Link href="/categories?tab=automotive">
              <div
                className={`relative h-32 rounded-2xl overflow-hidden cursor-pointer p-4 flex flex-col justify-between bg-white dark:bg-slate-800/60 backdrop-blur-md border border-gray-200 dark:border-white/10 shadow-sm dark:shadow-none transition-all active:scale-[0.98] ${isRTL ? 'text-right' : ''}`}
                data-testid="card-automotive"
              >
                <div className="w-10 h-10 rounded-full flex items-center justify-center border border-orange-400/40 bg-orange-500/10">
                  <Car className="h-5 w-5 text-orange-500" />
                </div>
                <div className="flex items-end justify-between gap-2">
                  <div className={isRTL ? 'text-right' : ''}>
                    <div className="text-gray-900 dark:text-white font-bold text-[15px] leading-tight">{t('automotive')}</div>
                    <div className="text-gray-500 dark:text-gray-400 text-[11px] mt-0.5">{t('automotiveSubtitle')}</div>
                  </div>
                  <div className="w-7 h-7 rounded-full bg-gray-100 dark:bg-white/10 border border-gray-200 dark:border-white/10 flex items-center justify-center shrink-0">
                    <ArrowRight className={`h-3.5 w-3.5 text-gray-600 dark:text-white/80 ${isRTL ? 'rotate-180' : ''}`} />
                  </div>
                </div>
              </div>
            </Link>

            <Link href="/categories?tab=spare-parts">
              <div
                className={`relative h-32 rounded-2xl overflow-hidden cursor-pointer p-4 flex flex-col justify-between border border-orange-400/60 shadow-lg shadow-orange-500/25 transition-all active:scale-[0.98] ${isRTL ? 'text-right' : ''}`}
                style={{
                  background: 'linear-gradient(135deg, rgba(249,115,22,0.18) 0%, rgba(234,88,12,0.10) 100%), rgba(20,24,30,0.6)',
                }}
                data-testid="card-spare-parts"
              >
                <div className="w-10 h-10 rounded-full flex items-center justify-center border border-orange-400/60 bg-orange-500/20">
                  <Wrench className="h-5 w-5 text-orange-400" />
                </div>
                <div className="flex items-end justify-between gap-2">
                  <div className={isRTL ? 'text-right' : ''}>
                    <div className="text-gray-900 dark:text-white font-bold text-[15px] leading-tight">{t('spareParts')}</div>
                    <div className="text-gray-600 dark:text-gray-300 text-[11px] mt-0.5">{t('sparePartsSubtitle')}</div>
                  </div>
                  <div className="w-7 h-7 rounded-full bg-white/20 dark:bg-white/15 border border-white/20 flex items-center justify-center shrink-0">
                    <ArrowRight className={`h-3.5 w-3.5 text-gray-800 dark:text-white ${isRTL ? 'rotate-180' : ''}`} />
                  </div>
                </div>
              </div>
            </Link>
          </div>

        {/* Recent Posts Section - horizontal scroll */}
        {(isLoadingRecent || recentProducts.length > 0) && (
          <div className="mb-4 -mx-4 px-4 py-4 bg-gray-100/80 dark:bg-black/30 backdrop-blur-sm">
            <div className="flex items-center justify-between mb-3 gap-2 px-0">
              <h2 className="text-base font-bold text-gray-900 dark:text-white">{t('recentPosts')}</h2>
              <Link href="/categories">
                <span className="text-orange-500 dark:text-orange-400 text-sm font-medium inline-flex items-center gap-1" data-testid="link-view-all-recent">
                  {t('viewAll')}
                  <ChevronRight className={`h-4 w-4 ${isRTL ? 'rotate-180' : ''}`} />
                </span>
              </Link>
            </div>
            <div
              className="flex gap-3 overflow-x-auto -mx-4 px-4 pb-1 snap-x snap-mandatory"
              style={{ scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' }}
              data-testid="scroll-recent-posts"
            >
              {isLoadingRecent ? (
                <>
                  {[0,1,2,3].map((i) => (
                    <div key={i} className="shrink-0 w-[180px] snap-start"><SkeletonCard /></div>
                  ))}
                </>
              ) : (
                recentProducts.slice(0, 12).map((product) => (
                  <div key={product.id} className="shrink-0 w-[180px] snap-start">
                    <ProductCard 
                      product={product}
                      sellerImageUrl={(product as any).sellerProfileImageUrl}
                      sellerFirstName={(product as any).sellerFirstName}
                      sellerLastName={(product as any).sellerLastName}
                      sellerDisplayName={(product as any).sellerDisplayName}
                      showDate
                      density="compact"
                    />
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* For You Section */}
        {(isLoadingRecommended || recommendedProducts.length > 0) && (
          <div className="mb-0 -mx-4 px-4 py-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-bold text-gray-900 dark:text-white">{t('forYou')}</h2>
              <Link href="/categories">
                <span className="text-orange-500 dark:text-orange-400 text-sm font-medium" data-testid="link-view-all-recommended">{t('viewAll')}</span>
              </Link>
            </div>
            <div className={gridClasses}>
              {isLoadingRecommended ? (
                <>
                  <SkeletonCard />
                  <SkeletonCard />
                  <SkeletonCard />
                  <SkeletonCard />
                  <div className="hidden md:block"><SkeletonCard /></div>
                  <div className="hidden md:block"><SkeletonCard /></div>
                  <div className="hidden md:block"><SkeletonCard /></div>
                  <div className="hidden md:block"><SkeletonCard /></div>
                </>
              ) : (
                recommendedProducts.slice(0, 12).map((product) => (
                  <ProductCard 
                    key={product.id} 
                    product={product}
                    sellerImageUrl={(product as any).sellerProfileImageUrl}
                    sellerFirstName={(product as any).sellerFirstName}
                    sellerLastName={(product as any).sellerLastName}
                    sellerDisplayName={(product as any).sellerDisplayName}
                    showDate
                    density={density}
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
