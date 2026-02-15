import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Home, Search, Plus, Package, User, AlertCircle } from "lucide-react";
import { useLanguage } from "@/hooks/use-language";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import type { TranslationKey } from "@/lib/translations";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export function BottomNav() {
  const [location, setLocation] = useLocation();
  const { t } = useLanguage();
  const { user } = useAuth();
  const [showNoCreditsDialog, setShowNoCreditsDialog] = useState(false);

  const { data: userInfo } = useQuery<{
    sparePartsCredits: number;
    automotiveCredits: number;
    subscriptionEnabled: boolean;
  }>({
    queryKey: ["/api/user/credits"],
    enabled: !!user,
  });

  const handlePostClick = () => {
    if (!user) {
      setLocation("/auth");
      return;
    }
    
    if (userInfo?.subscriptionEnabled) {
      const hasAnyCredits = (userInfo?.sparePartsCredits || 0) > 0 || (userInfo?.automotiveCredits || 0) > 0;
      if (!hasAnyCredits) {
        setShowNoCreditsDialog(true);
        return;
      }
    }
    
    setLocation("/sell");
  };

  const navItems: { href: string; icon: typeof Home; labelKey: TranslationKey; isCenter?: boolean }[] = [
    { href: "/", icon: Home, labelKey: "home" },
    { href: "/categories", icon: Search, labelKey: "search" },
    { href: "/sell", icon: Plus, labelKey: "sellItem", isCenter: true },
    { href: "/my-listings", icon: Package, labelKey: "myListings" },
    { href: "/profile", icon: User, labelKey: "profile" },
  ];

  return (
    <>
      <div className="shrink-0 relative bg-background" style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
        <div className="absolute left-1/2 -translate-x-1/2 -top-3 z-10">
          <button 
            onClick={handlePostClick}
            className="flex items-center justify-center w-14 h-14 rounded-full bg-accent text-white shadow-lg shadow-accent/30 hover:bg-accent/90 transition-colors"
            data-testid="button-post"
          >
            <Plus className="h-7 w-7" />
          </button>
        </div>
        <nav className="border-t border-border">
        <div className="flex items-center justify-around h-16 px-2">
          {navItems.map((item) => {
            const isActive = location === item.href;
            
            if (item.isCenter) {
              return (
                <div key={item.href} className="w-14" />
              );
            }

            return (
              <Link key={item.href} href={item.href}>
                <button
                  className={`flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-lg transition-colors ${
                    isActive 
                      ? "text-accent" 
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                  data-testid={`nav-${item.labelKey.toLowerCase()}`}
                >
                  <item.icon className={`h-5 w-5 ${isActive ? "stroke-[2.5]" : ""}`} />
                  <span className="text-xs font-medium">{t(item.labelKey)}</span>
                </button>
              </Link>
            );
          })}
        </div>
        </nav>
      </div>

      <AlertDialog open={showNoCreditsDialog} onOpenChange={setShowNoCreditsDialog}>
        <AlertDialogContent className="max-w-sm mx-4">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-accent" />
              {t('noCreditsAvailable')}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-left">
              {t('noCreditsMessage')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex flex-col gap-2 sm:flex-col">
            <AlertDialogAction
              onClick={() => setLocation("/profile/subscription")}
              className="w-full bg-accent hover:bg-accent/90"
            >
              {t('purchaseCredits')}
            </AlertDialogAction>
            <AlertDialogCancel className="w-full mt-0">
              {t('cancel')}
            </AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
