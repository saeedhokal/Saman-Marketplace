import { useState } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Home, Search, Plus, Package, User, AlertCircle, LayoutGrid } from "lucide-react";
import { useLanguage } from "@/hooks/use-language";
import { useAuth } from "@/hooks/use-auth";
import type { TranslationKey } from "@/lib/translations";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
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

export function DesktopNavMenu() {
  const [location, setLocation] = useLocation();
  const { t, isRTL } = useLanguage();
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

  const handlePost = () => {
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

  const items: { href: string; icon: typeof Home; labelKey: TranslationKey; onClick?: () => void }[] = [
    { href: "/", icon: Home, labelKey: "home" },
    { href: "/categories", icon: Search, labelKey: "search" },
    { href: "/sell", icon: Plus, labelKey: "sellItem", onClick: handlePost },
    { href: "/my-listings", icon: Package, labelKey: "myListings" },
    { href: "/profile", icon: User, labelKey: "profile" },
  ];

  return (
    <>
      <div
        className={`hidden md:block fixed top-4 z-[60] ${isRTL ? "left-4" : "right-4"}`}
        data-testid="desktop-nav-menu"
      >
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="flex items-center gap-2 rounded-full bg-accent text-white px-4 h-11 shadow-lg shadow-accent/30 hover:bg-accent/90 transition-colors font-medium"
              data-testid="button-desktop-shortcuts"
            >
              <LayoutGrid className="h-5 w-5" />
              <span className="text-sm">{t("menu") || "Menu"}</span>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align={isRTL ? "start" : "end"} sideOffset={8} className="w-56">
            <DropdownMenuLabel>{t("menu") || "Menu"}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {items.map((item) => {
              const isActive = location === item.href;
              const Icon = item.icon;
              return (
                <DropdownMenuItem
                  key={item.href}
                  onClick={() => {
                    if (item.onClick) item.onClick();
                    else setLocation(item.href);
                  }}
                  className={`cursor-pointer ${isActive ? "text-accent font-semibold" : ""}`}
                  data-testid={`desktop-nav-${item.labelKey.toLowerCase()}`}
                >
                  <Icon className={`${isRTL ? "ml-2" : "mr-2"} h-4 w-4`} />
                  <span>{t(item.labelKey)}</span>
                </DropdownMenuItem>
              );
            })}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <AlertDialog open={showNoCreditsDialog} onOpenChange={setShowNoCreditsDialog}>
        <AlertDialogContent className="max-w-sm mx-4">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-accent" />
              {t("noCreditsAvailable")}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-left">
              {t("noCreditsMessage")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex flex-col gap-2 sm:flex-col">
            <AlertDialogAction
              onClick={() => setLocation("/profile/subscription")}
              className="w-full bg-accent hover:bg-accent/90"
            >
              {t("purchaseCredits")}
            </AlertDialogAction>
            <AlertDialogCancel className="w-full mt-0">{t("cancel")}</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
