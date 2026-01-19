import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BottomNav } from "@/components/BottomNav";

import Landing from "@/pages/Landing";
import Categories from "@/pages/Categories";
import ProductDetail from "@/pages/ProductDetail";
import Sell from "@/pages/Sell";
import SellerProfile from "@/pages/SellerProfile";
import Favorites from "@/pages/Favorites";
import MyListings from "@/pages/MyListings";
import Profile from "@/pages/Profile";
import Admin from "@/pages/Admin";
import Auth from "@/pages/Auth";
import Subscription from "@/pages/Subscription";
import Checkout from "@/pages/Checkout";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <div className="flex flex-col min-h-screen">
      <Switch>
        <Route path="/" component={Landing} />
        <Route path="/categories" component={Categories} />
        <Route path="/product/:id" component={ProductDetail} />
        <Route path="/sell" component={Sell} />
        <Route path="/seller/:sellerId" component={SellerProfile} />
        <Route path="/favorites" component={Favorites} />
        <Route path="/my-listings" component={MyListings} />
        <Route path="/profile" component={Profile} />
        <Route path="/profile/subscription" component={Subscription} />
        <Route path="/checkout/:id" component={Checkout} />
        <Route path="/admin" component={Admin} />
        <Route path="/auth" component={Auth} />
        <Route component={NotFound} />
      </Switch>
      <BottomNav />
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
