import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BottomNav } from "@/components/BottomNav";
import { LanguageProvider, useLanguage } from "@/hooks/use-language";

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
import CreditHistory from "@/pages/CreditHistory";
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
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <div className="flex flex-col min-h-screen">
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
        <Route path="/profile/credits" component={CreditHistory} />
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
        <Route component={NotFound} />
      </Switch>
      <BottomNav />
    </div>
  );
}

function AppContent() {
  const { hasSelectedLanguage } = useLanguage();
  
  if (!hasSelectedLanguage) {
    return <LanguageSelect />;
  }
  
  return <Router />;
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
