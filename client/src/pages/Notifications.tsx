import { Link } from "wouter";
import { ArrowLeft } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { useState } from "react";

export default function Notifications() {
  const [pushEnabled, setPushEnabled] = useState(true);
  const [listingUpdates, setListingUpdates] = useState(true);
  const [messages, setMessages] = useState(true);
  const [promotions, setPromotions] = useState(false);

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="sticky top-0 z-40 bg-background border-b border-border">
        <div className="container mx-auto px-4">
          <div className="relative flex items-center justify-center h-14">
            <Link href="/profile" className="absolute left-0">
              <button className="p-2 rounded-lg hover:bg-secondary transition-colors" data-testid="button-back">
                <ArrowLeft className="h-5 w-5" />
              </button>
            </Link>
            <h1 className="font-semibold text-lg">Notifications</h1>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        <div className="space-y-6">
          <section>
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-4">
              Push Notifications
            </h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between py-2">
                <div>
                  <p className="font-medium">Enable Notifications</p>
                  <p className="text-sm text-muted-foreground">Receive push notifications on your device</p>
                </div>
                <Switch 
                  checked={pushEnabled} 
                  onCheckedChange={setPushEnabled}
                  data-testid="switch-push-notifications"
                />
              </div>
            </div>
          </section>

          <div className="h-px bg-border" />

          <section>
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-4">
              Notification Types
            </h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between py-2">
                <div>
                  <p className="font-medium">Listing Updates</p>
                  <p className="text-sm text-muted-foreground">When your listings are approved, rejected, or expiring</p>
                </div>
                <Switch 
                  checked={listingUpdates} 
                  onCheckedChange={setListingUpdates}
                  disabled={!pushEnabled}
                  data-testid="switch-listing-updates"
                />
              </div>

              <div className="flex items-center justify-between py-2">
                <div>
                  <p className="font-medium">Messages</p>
                  <p className="text-sm text-muted-foreground">When someone contacts you about a listing</p>
                </div>
                <Switch 
                  checked={messages} 
                  onCheckedChange={setMessages}
                  disabled={!pushEnabled}
                  data-testid="switch-messages"
                />
              </div>

              <div className="flex items-center justify-between py-2">
                <div>
                  <p className="font-medium">Promotions</p>
                  <p className="text-sm text-muted-foreground">Special offers and discounts on credits</p>
                </div>
                <Switch 
                  checked={promotions} 
                  onCheckedChange={setPromotions}
                  disabled={!pushEnabled}
                  data-testid="switch-promotions"
                />
              </div>
            </div>
          </section>

          <div className="pt-4 text-center text-sm text-muted-foreground">
            <p>Notification settings are stored locally on this device.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
