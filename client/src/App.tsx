import { Switch, Route, useLocation } from "wouter";
import { useEffect } from "react";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BottomNav } from "@/components/BottomNav";
import { LanguageProvider, useLanguage } from "@/hooks/use-language";
import { PushNotificationProvider } from "@/components/PushNotificationProvider";
import { InAppNotificationBanner } from "@/components/InAppNotificationBanner";
import { App as CapApp } from "@capacitor/app";
import { Capacitor } from "@capacitor/core";

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
import NotFound from "@/pages/not-found";

function ScrollToTop() {
  const [location] = useLocation();
  
  useEffect(() => {
    const el = document.getElementById('main-scroll-container');
    if (el) {
      el.scrollTo(0, 0);
    } else {
      window.scrollTo(0, 0);
    }
  }, [location]);
  
  return null;
}

function Router() {
  return (
    <div className="flex flex-col bg-[#0f1318] h-full">
      <ScrollToTop />
      <div id="main-scroll-container" className="flex-1 overflow-y-auto overflow-x-hidden overscroll-none" style={{ WebkitOverflowScrolling: 'touch' } as React.CSSProperties}>
        <Switch>
          <Route path="/" component={Landing} />
          <Route path="/categories" component={Categories} />
          <Route path="/product/:id" component={ProductDetail} />
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
          <Route path="/refund" component={Refund} />
          <Route path="/help" component={Help} />
          <Route path="/payment/success" component={PaymentSuccess} />
          <Route path="/payment/cancelled" component={PaymentCancelled} />
          <Route path="/payment/declined" component={PaymentDeclined} />
          <Route path="/downloads" component={Downloads} />
          <Route component={NotFound} />
        </Switch>
      </div>
      <BottomNavWrapper />
    </div>
  );
}

function BottomNavWrapper() {
  const [location] = useLocation();
  const hideBottomNav = location === '/downloads';
  
  if (hideBottomNav) return null;
  return <BottomNav />;
}

function DeepLinkHandler() {
  const [, setLocation] = useLocation();
  
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;
    
    // Handle deep links when app is opened via URL
    const handleAppUrlOpen = (event: { url: string }) => {
      const url = event.url;
      console.log("[DeepLink] Received URL:", url);
      
      // Parse saman:// URLs
      if (url.startsWith("saman://")) {
        const path = url.replace("saman://", "/");
        console.log("[DeepLink] Navigating to:", path);
        setLocation(path);
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
  
  if (!hasSelectedLanguage) {
    return <LanguageSelect />;
  }
  
  return (
    <PushNotificationProvider>
      <DeepLinkHandler />
      <Router />
    </PushNotificationProvider>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <LanguageProvider>
          <InAppNotificationBanner />
          <Toaster />
          <AppContent />
        </LanguageProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
