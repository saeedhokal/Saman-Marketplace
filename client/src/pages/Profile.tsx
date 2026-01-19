import { Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft, User, Bell, CreditCard, History, Package, Settings,
  FileText, Shield, HelpCircle, Trash2, ChevronRight, LogOut
} from "lucide-react";

export default function Profile() {
  const { user, logout } = useAuth();

  const { data: userInfo } = useQuery<{ 
    sparePartsCredits: number; 
    automotiveCredits: number; 
    isAdmin: boolean;
    subscriptionEnabled: boolean;
  }>({
    queryKey: ["/api/user/credits"],
    enabled: !!user,
  });

  if (!user) {
    return (
      <div className="min-h-screen bg-background pb-20 flex items-center justify-center">
        <div className="text-center px-4">
          <User className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h2 className="text-lg font-semibold mb-2">Sign in to view your profile</h2>
          <Link href="/auth">
            <Button>Sign In</Button>
          </Link>
        </div>
      </div>
    );
  }

  const menuItems = [
    { icon: User, label: "My Profile", href: "/profile/details" },
    { icon: Bell, label: "Notification", href: "/profile/notifications" },
    { icon: CreditCard, label: "Purchase Subscription", href: "/profile/subscription" },
    { icon: History, label: "Credit History", href: "/profile/credits" },
    { icon: Package, label: "Delisting", href: "/my-listings" },
    { icon: Settings, label: "Settings", href: "/profile/settings" },
    { divider: true },
    { icon: FileText, label: "About Us", href: "/about" },
    { icon: FileText, label: "Terms & Conditions", href: "/terms" },
    { icon: Shield, label: "Privacy Policy", href: "/privacy" },
    { icon: FileText, label: "Cookie Policy", href: "/cookies" },
    { icon: FileText, label: "Contact Us", href: "/contact" },
    { icon: FileText, label: "Return, Refund & Cancellation Policy", href: "/refund" },
    { icon: HelpCircle, label: "Help & Support", href: "/help" },
    { divider: true },
    { icon: Trash2, label: "Delete Account", href: "/profile/delete", destructive: true },
  ];

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="sticky top-0 z-40 bg-background border-b border-border">
        <div className="container mx-auto px-4">
          <div className="flex items-center h-14">
            <Link href="/">
              <button className="p-2 -ml-2 rounded-lg hover:bg-secondary transition-colors" data-testid="button-back">
                <ArrowLeft className="h-5 w-5" />
              </button>
            </Link>
            <h1 className="flex-1 text-center font-semibold text-lg pr-8">Account</h1>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 pt-2">
        <div className="divide-y divide-border">
          {menuItems.map((item, index) => {
            if (item.divider) {
              return <div key={index} className="h-2 bg-secondary -mx-4" />;
            }

            const Icon = item.icon!;
            return (
              <Link key={item.label} href={item.href!}>
                <button
                  className={`w-full flex items-center gap-4 py-4 hover:bg-secondary/50 transition-colors ${
                    item.destructive ? "text-destructive" : ""
                  }`}
                  data-testid={`menu-${item.label?.toLowerCase().replace(/\s+/g, '-')}`}
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                    item.destructive ? "bg-destructive/10" : "bg-accent/10"
                  }`}>
                    <Icon className={`h-4 w-4 ${item.destructive ? "text-destructive" : "text-accent"}`} />
                  </div>
                  <span className="flex-1 text-left font-medium text-sm">{item.label}</span>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </button>
              </Link>
            );
          })}
        </div>

        {userInfo?.isAdmin && (
          <div className="mt-4 pt-4 border-t border-border">
            <Link href="/admin">
              <Button variant="outline" className="w-full">
                <Shield className="h-4 w-4 mr-2" />
                Admin Panel
              </Button>
            </Link>
          </div>
        )}

        <div className="mt-4 pt-4">
          <Button 
            variant="outline" 
            className="w-full text-destructive border-destructive/30 hover:bg-destructive/10"
            onClick={() => logout()}
            data-testid="button-logout"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Log Out
          </Button>
        </div>

        {userInfo?.subscriptionEnabled && (
          <div className="text-center text-xs text-muted-foreground mt-6 mb-4 space-y-1">
            <p>Spare Parts Credits: {userInfo?.sparePartsCredits || 0}</p>
            <p>Automotive Credits: {userInfo?.automotiveCredits || 0}</p>
          </div>
        )}
      </div>
    </div>
  );
}
