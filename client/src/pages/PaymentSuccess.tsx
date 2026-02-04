import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { CheckCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Capacitor } from "@capacitor/core";

export default function PaymentSuccess() {
  const [, setLocation] = useLocation();
  const [verifying, setVerifying] = useState(true);
  const [result, setResult] = useState<{
    success: boolean;
    message: string;
    sparePartsCredits?: number;
    automotiveCredits?: number;
  } | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const cart = params.get("cart");
    
    if (cart) {
      // First verify the payment and add credits
      fetch(`/api/payment/verify?cart=${cart}`, {
        credentials: "include",
      })
        .then(res => res.json())
        .then(data => {
          setResult(data);
          setVerifying(false);
          if (data.success) {
            toast({
              title: "Payment Successful!",
              description: data.message,
            });
          }
          
          // After verification completes, try to redirect to app (mobile browser only)
          if (!Capacitor.isNativePlatform()) {
            const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
            if (isMobile) {
              // Small delay to ensure user sees the success message
              setTimeout(() => {
                window.location.href = `saman://payment/success?verified=true`;
              }, 1500);
            }
          }
        })
        .catch(() => {
          setResult({
            success: false,
            message: "Unable to verify payment. Please contact support.",
          });
          setVerifying(false);
        });
    } else {
      setResult({
        success: false,
        message: "Invalid payment session",
      });
      setVerifying(false);
    }
  }, [toast]);

  if (verifying) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin text-accent mx-auto" />
          <p className="text-lg text-muted-foreground">Verifying payment...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="text-center space-y-6 max-w-md">
        {result?.success ? (
          <>
            <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle className="h-12 w-12 text-green-600" />
            </div>
            <h1 className="text-2xl font-bold" data-testid="text-payment-success">Payment Successful!</h1>
            <p className="text-muted-foreground">{result.message}</p>
            
            {(result.sparePartsCredits !== undefined || result.automotiveCredits !== undefined) && (
              <div className="bg-secondary/50 rounded-lg p-4 space-y-2">
                <p className="text-sm font-medium">Your Credits</p>
                <div className="flex justify-center gap-6">
                  <div>
                    <p className="text-2xl font-bold text-accent">{result.sparePartsCredits || 0}</p>
                    <p className="text-xs text-muted-foreground">Spare Parts</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-accent">{result.automotiveCredits || 0}</p>
                    <p className="text-xs text-muted-foreground">Automotive</p>
                  </div>
                </div>
              </div>
            )}
          </>
        ) : (
          <>
            <div className="w-20 h-20 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle className="h-12 w-12 text-red-600" />
            </div>
            <h1 className="text-2xl font-bold">Verification Issue</h1>
            <p className="text-muted-foreground">{result?.message}</p>
          </>
        )}
        
        <div className="space-y-3 pt-4">
          <Link href="/sell">
            <Button className="w-full" data-testid="button-create-listing">
              Create a Listing
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
