import { Link, useLocation } from "wouter";
import { Home, Search, Plus, Package, User } from "lucide-react";
import { useLanguage } from "@/hooks/use-language";
import type { TranslationKey } from "@/lib/translations";

export function BottomNav() {
  const [location] = useLocation();
  const { t } = useLanguage();

  const navItems: { href: string; icon: typeof Home; labelKey: TranslationKey; isCenter?: boolean }[] = [
    { href: "/", icon: Home, labelKey: "home" },
    { href: "/categories", icon: Search, labelKey: "search" },
    { href: "/sell", icon: Plus, labelKey: "sellItem", isCenter: true },
    { href: "/my-listings", icon: Package, labelKey: "myListings" },
    { href: "/profile", icon: User, labelKey: "profile" },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-border safe-area-bottom">
      <div className="flex items-center justify-around h-16 px-2">
        {navItems.map((item) => {
          const isActive = location === item.href;
          
          if (item.isCenter) {
            return (
              <Link key={item.href} href={item.href}>
                <button 
                  className="flex items-center justify-center w-14 h-14 -mt-6 rounded-full bg-accent text-white shadow-lg shadow-accent/30 hover:bg-accent/90 transition-colors"
                  data-testid="button-post"
                >
                  <Plus className="h-7 w-7" />
                </button>
              </Link>
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
  );
}
