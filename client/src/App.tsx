import { Switch, Route, useLocation } from "wouter";
import { useEffect } from "react";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BottomNav } from "@/components/BottomNav";
import { DesktopNavMenu } from "@/components/DesktopNavMenu";
import { LanguageProvider, useLanguage } from "@/hooks/use-language";
import { PushNotificationProvider } from "@/components/PushNotificationProvider";
import { App as CapApp } from "@capacitor/app";
import { Capacitor } from "@capacitor/core";
import { UpdatePrompt } from "@/components/UpdatePrompt";
import { Heartbeat } from "@/components/Heartbeat";
import { StickyDownloadAppCTA } from "@/components/WebChromeActions";

import Landing from "@/pages/Landing";
import LanguageSelect from "@/pages/LanguageSelect";
import Categories from "@/pages/Categories";
import ProductDetail from "@/pages/ProductDetail";
import Sell from "@/pages/Sell";
import EditListing from "@/pages/EditListing";
import SellerProfile from "@/pages/SellerProfile";
import Favorites from "@/pages/Favorites";
import MyListings from "@/pages/MyListings";
import Profile from "@/pages/Profile";
import Admin from "@/pages/Admin";
import Auth from "@/pages/Auth";
import Subscription from "@/pages/Subscription";
import Checkout from "@/pages/Checkout";
import ProfileDetails from "@/pages/ProfileDetails";
import Notifications from "@/pages/Notifications";
import NotificationInbox from "@/pages/NotificationInbox";
import CreditHistory from "@/pages/CreditHistory";
import Invoices from "@/pages/Invoices";
import Settings from "@/pages/Settings";
import DeleteAccount from "@/pages/DeleteAccount";
import About from "@/pages/About";
import Terms from "@/pages/Terms";
import Privacy from "@/pages/Privacy";
import Cookies from "@/pages/Cookies";
import Contact from "@/pages/Contact";
import Refund from "@/pages/Refund";
import Help from "@/pages/Help";
import PaymentSuccess from "@/pages/PaymentSuccess";
import PaymentCancelled from "@/pages/PaymentCancelled";
import PaymentDeclined from "@/pages/PaymentDeclined";
import Downloads from "@/pages/Downloads";
import ResetPassword from "@/pages/ResetPassword";
import AppOpen from "@/pages/AppOpen";
import { SeoLandingPage } from "@/pages/SeoLanding";
import { SEO_PAGES } from "@shared/seo-pages";
import NotFound from "@/pages/not-found";

// Pages that manage their own scroll restoration on back-navigation.
// Scrolling them to top here would fight their restoration logic.
const SCROLL_RESTORE_PAGES = ['/categories', '/favorites', '/my-listings'];

function ScrollToTop() {
  const [location] = useLocation();

  useEffect(() => {
    const base = location.split('?')[0];
    if (SCROLL_RESTORE_PAGES.some(p => base === p)) return;
    const el = document.getElementById('main-scroll-container');
    if (el) {
      el.scrollTo(0, 0);
    } else {
      window.scrollTo(0, 0);
    }
  }, [location]);

  return null;
}

// Web fallbacks for link shapes that exist in shared/Universal Links
// (/category/:slug, /search) but have no dedicated page — send them to
// the Categories browse screen instead of a 404.
function CategoryRedirect({ slug }: { slug?: string }) {
  const [, setLocation] = useLocation();
  useEffect(() => {
    const tab = slug === "spare-parts" || slug === "automotive" ? `?tab=${slug}` : "";
    setLocation(`/categories${tab}`, { replace: true });
  }, [slug, setLocation]);
  return null;
}

function SearchRedirect() {
  const [, setLocation] = useLocation();
  useEffect(() => {
    setLocation("/categories", { replace: true });
  }, [setLocation]);
  return null;
}

function Router() {
  return (
    <>
      <ScrollToTop />
      <div className="shrink-0 bg-background" style={{ height: 'env(safe-area-inset-top)' }} />
      <div
        id="main-scroll-container"
        className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden"
        style={{
          WebkitOverflowScrolling: 'touch',
          transform: 'translateZ(0)',
          willChange: 'scroll-position',
          contain: 'paint',
        } as React.CSSProperties}
      >
        <Switch>
          <Route path="/" component={Landing} />
          <Route path="/categories" component={Categories} />
          <Route path="/category/:slug?">
            {(params) => <CategoryRedirect slug={params.slug} />}
          </Route>
          <Route path="/search" component={SearchRedirect} />
          <Route path="/product/:slug" component={ProductDetail} />
          <Route path="/sell" component={Sell} />
          <Route path="/edit/:id" component={EditListing} />
          <Route path="/seller/:sellerId" component={SellerProfile} />
          <Route path="/favorites" component={Favorites} />
          <Route path="/my-listings" component={MyListings} />
          <Route path="/profile" component={Profile} />
          <Route path="/profile/details" component={ProfileDetails} />
          <Route path="/profile/subscription" component={Subscription} />
          <Route path="/profile/notifications" component={Notifications} />
          <Route path="/inbox" component={NotificationInbox} />
          <Route path="/profile/credits" component={CreditHistory} />
          <Route path="/profile/invoices" component={Invoices} />
          <Route path="/profile/settings" component={Settings} />
          <Route path="/profile/delete" component={DeleteAccount} />
          <Route path="/checkout/:id" component={Checkout} />
          <Route path="/admin" component={Admin} />
          <Route path="/auth" component={Auth} />
          <Route path="/about" component={About} />
          <Route path="/terms" component={Terms} />
          <Route path="/privacy" component={Privacy} />
          <Route path="/cookies" component={Cookies} />
          <Route path="/contact" component={Contact} />
          <Route path="/en/contact" component={Contact} />
          <Route path="/en/contact/" component={Contact} />
          <Route path="/refund" component={Refund} />
          <Route path="/help" component={Help} />
          <Route path="/payment/success" component={PaymentSuccess} />
          <Route path="/payment/cancelled" component={PaymentCancelled} />
          <Route path="/payment/declined" component={PaymentDeclined} />
          <Route path="/downloads" component={Downloads} />
          <Route path="/reset-password" component={ResetPassword} />
          <Route path="/open" component={AppOpen} />
          {SEO_PAGES.map((page) => (
            <Route key={page.path} path={page.path}>
              <SeoLandingPage page={page} />
            </Route>
          ))}
          <Route component={NotFound} />
        </Switch>
      </div>
    </>
  );
}

function BottomNavWrapper() {
  const [location] = useLocation();
  const hideBottomNav = location === '/downloads' || location.startsWith('/reset-password') || location === '/open';
  
  if (hideBottomNav) return null;
  return <BottomNav />;
}

function DesktopNavMenuWrapper() {
  const [location] = useLocation();
  const hide = location === '/downloads' || location.startsWith('/reset-password') || location.startsWith('/auth') || location === '/open';
  if (hide) return null;
  return <DesktopNavMenu />;
}

function BottomNavWrapperWithSeo() {
  const [location] = useLocation();
  const isSeoLanding = SEO_PAGES.some((p) => p.path === location);
  if (isSeoLanding) return null;
  return <BottomNavWrapper />;
}

// Validate that a deep-link path is a safe internal relative path.
function sanitizeDeepLinkPath(raw: string | null): string {
  if (!raw) return "/";
  if (!raw.startsWith("/") || raw.startsWith("//")) return "/";
  if (/^\/[a-zA-Z][a-zA-Z0-9+\-.]*:/.test(raw)) return "/";
  return raw;
}

// Normalize an incoming deep-link path to a route the app actually has.
// - /open?path=/product/123 (smart share links) -> unwrap to /product/123
// - /category/<slug> and /search?... are declared as Universal Link paths
//   but have no SPA route -> map onto /categories so users don't hit a 404.
function resolveDeepLinkTarget(pathname: string, search: string): string {
  if (pathname === "/open") {
    const inner = sanitizeDeepLinkPath(new URLSearchParams(search).get("path"));
    if (inner !== "/open") {
      const [innerPath, innerSearch = ""] = inner.split("?");
      return resolveDeepLinkTarget(innerPath, innerSearch ? `?${innerSearch}` : "");
    }
    return "/";
  }
  if (pathname === "/category" || pathname.startsWith("/category/")) {
    const slug = pathname.split("/")[2] || "";
    if (slug === "spare-parts" || slug === "automotive") {
      return `/categories?tab=${slug}`;
    }
    return "/categories";
  }
  if (pathname === "/search" || pathname.startsWith("/search/")) {
    return "/categories";
  }
  return pathname + search;
}

function DeepLinkHandler() {
  const [, setLocation] = useLocation();
  
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;
    
    // Handle deep links when app is opened via URL
    const handleAppUrlOpen = (event: { url: string }) => {
      const url = event.url;
      console.log("[DeepLink] Received URL:", url);

      // Custom scheme: saman://product/123 -> /product/123
      if (url.startsWith("saman://")) {
        try {
          // Parse via https so pathname/search split is robust
          const parsed = new URL(url.replace("saman://", "https://thesamanapp.com/"));
          const target = resolveDeepLinkTarget(parsed.pathname, parsed.search);
          console.log("[DeepLink] Navigating to:", target);
          setLocation(target || "/");
        } catch (e) {
          console.error("[DeepLink] Failed to parse scheme URL:", e);
          setLocation("/");
        }
        return;
      }

      // Universal Links / App Links: https://thesamanapp.com/product/123
      // -> extract pathname + search and navigate inside the app.
      if (url.startsWith("https://thesamanapp.com") || url.startsWith("https://www.thesamanapp.com")) {
        try {
          const parsed = new URL(url);
          const target = resolveDeepLinkTarget(parsed.pathname, parsed.search);
          console.log("[DeepLink] Universal link -> navigating to:", target);
          setLocation(target || "/");
        } catch (e) {
          console.error("[DeepLink] Failed to parse URL:", e);
        }
      }
    };
    
    // Listen for deep links
    const listener = CapApp.addListener("appUrlOpen", handleAppUrlOpen);
    
    // Check if app was opened with a URL
    CapApp.getLaunchUrl().then((result: { url?: string } | undefined) => {
      if (result?.url) {
        handleAppUrlOpen({ url: result.url });
      }
    });
    
    return () => {
      listener.then((l: { remove: () => void }) => l.remove());
    };
  }, [setLocation]);
  
  return null;
}

function AppContent() {
  const { hasSelectedLanguage } = useLanguage();

  // Smart link page must work for anyone — skip language gate
  if (window.location.pathname === '/open') {
    return <AppOpen />;
  }
  
  if (!hasSelectedLanguage) {
    return <LanguageSelect />;
  }
  
  return (
    <PushNotificationProvider>
      <DeepLinkHandler />
      <UpdatePrompt />
      <Heartbeat />
      <div className="flex flex-col bg-background" style={{ height: 'var(--app-height)' }}>
        <Router />
        <StickyDownloadAppCTA />
        <DesktopNavMenuWrapper />
        <BottomNavWrapperWithSeo />
      </div>
    </PushNotificationProvider>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <LanguageProvider>
          <Toaster />
          <AppContent />
        </LanguageProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
