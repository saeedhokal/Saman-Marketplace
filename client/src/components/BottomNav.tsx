import { Link, useLocation } from "wouter";
import { Home, LayoutGrid, Plus, Package, User } from "lucide-react";

export function BottomNav() {
  const [location] = useLocation();

  const navItems = [
    { href: "/", icon: Home, label: "Home" },
    { href: "/categories", icon: LayoutGrid, label: "Categories" },
    { href: "/sell", icon: Plus, label: "Post", isCenter: true },
    { href: "/my-listings", icon: Package, label: "Listings" },
    { href: "/profile", icon: User, label: "Profile" },
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
                data-testid={`nav-${item.label.toLowerCase()}`}
              >
                <item.icon className={`h-5 w-5 ${isActive ? "stroke-[2.5]" : ""}`} />
                <span className="text-xs font-medium">{item.label}</span>
              </button>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
