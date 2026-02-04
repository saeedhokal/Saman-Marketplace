import { useEffect } from "react";
import { Link } from "wouter";
import { XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Capacitor } from "@capacitor/core";

export default function PaymentCancelled() {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const cart = params.get("cart");
    
    // If we're in a mobile browser (not in the app), try to redirect to the app
    if (!Capacitor.isNativePlatform()) {
      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
      if (isMobile) {
        window.location.href = `saman://payment/cancelled${cart ? `?cart=${cart}` : ''}`;
      }
    }
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="text-center space-y-6 max-w-md">
        <div className="w-20 h-20 bg-yellow-100 dark:bg-yellow-900/30 rounded-full flex items-center justify-center mx-auto">
          <XCircle className="h-12 w-12 text-yellow-600" />
        </div>
        <h1 className="text-2xl font-bold" data-testid="text-payment-cancelled">Payment Cancelled</h1>
        <p className="text-muted-foreground">
          Your payment was cancelled. No charges have been made to your account.
        </p>
        
        <div className="space-y-3 pt-4">
          <Link href="/profile/subscription">
            <Button className="w-full" data-testid="button-try-again">
              Try Again
            </Button>
          </Link>
          <Link href="/">
            <Button variant="outline" className="w-full" data-testid="button-go-home">
              Go to Home
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
