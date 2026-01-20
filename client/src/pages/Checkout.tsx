import { useState } from "react";
import { useRoute, Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, CreditCard, Loader2, Check, Smartphone } from "lucide-react";
import { SiApplepay } from "react-icons/si";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { SubscriptionPackage } from "@shared/schema";

export default function Checkout() {
  const [, params] = useRoute("/checkout/:id");
  const packageId = params?.id ? parseInt(params.id) : 0;
  const { user } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [paymentMethod, setPaymentMethod] = useState<"apple_pay" | "credit_card">("credit_card");
  const [isProcessing, setIsProcessing] = useState(false);

  const { data: pkg, isLoading } = useQuery<SubscriptionPackage>({
    queryKey: ["/api/packages", packageId],
    queryFn: async () => {
      const res = await fetch(`/api/packages`);
      const packages = await res.json();
      return packages.find((p: SubscriptionPackage) => p.id === packageId);
    },
    enabled: !!packageId,
  });

  const purchaseMutation = useMutation({
    mutationFn: async (data: { packageId: number; paymentMethod: string }) => {
      const res = await apiRequest("POST", "/api/checkout", data);
      return res.json();
    },
    onSuccess: (data) => {
      if (data.paymentUrl) {
        window.location.href = data.paymentUrl;
      } else {
        queryClient.invalidateQueries({ queryKey: ["/api/user/credits"] });
        toast({
          title: "Purchase Successful!",
          description: data.message || "Your credits have been added to your account.",
        });
        setLocation("/profile/subscription");
      }
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Payment Failed",
        description: error.message || "Please try again",
      });
      setIsProcessing(false);
    },
  });

  const handlePayment = async () => {
    if (!pkg) return;
    setIsProcessing(true);
    purchaseMutation.mutate({ packageId: pkg.id, paymentMethod });
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background pb-20 flex items-center justify-center">
        <div className="text-center px-4">
          <CreditCard className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h2 className="text-lg font-semibold mb-2">Sign in to continue</h2>
          <Link href="/auth">
            <Button>Sign In</Button>
          </Link>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background pb-20 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-accent" />
      </div>
    );
  }

  if (!pkg) {
    return (
      <div className="min-h-screen bg-background pb-20 flex items-center justify-center">
        <div className="text-center px-4">
          <h2 className="text-lg font-semibold mb-2">Package not found</h2>
          <Link href="/profile/subscription">
            <Button variant="outline">Back to Packages</Button>
          </Link>
        </div>
      </div>
    );
  }

  const totalCredits = pkg.credits + (pkg.bonusCredits || 0);

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="sticky top-0 z-40 bg-background border-b border-border">
        <div className="container mx-auto px-4">
          <div className="flex items-center h-14">
            <Link href="/profile/subscription">
              <button className="p-2 -ml-2 rounded-lg hover:bg-secondary transition-colors" data-testid="button-back">
                <ArrowLeft className="h-5 w-5" />
              </button>
            </Link>
            <h1 className="flex-1 text-center font-semibold text-lg pr-8">Checkout</h1>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 max-w-md space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Order Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Package</span>
              <span className="font-medium">{pkg.name}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Category</span>
              <span>{pkg.category}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Credits</span>
              <span>
                {pkg.credits}
                {pkg.bonusCredits > 0 && (
                  <span className="text-green-600 ml-1">+{pkg.bonusCredits} free</span>
                )}
              </span>
            </div>
            <div className="border-t pt-3 flex justify-between items-center">
              <span className="font-semibold">Total</span>
              <span className="text-xl font-bold text-accent">AED {pkg.price}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Payment Method</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <button
              onClick={() => setPaymentMethod("apple_pay")}
              className={`w-full p-4 rounded-lg border-2 transition-colors flex items-center gap-3 ${
                paymentMethod === "apple_pay" 
                  ? "border-accent bg-accent/5" 
                  : "border-border hover:border-accent/50"
              }`}
              data-testid="button-apple-pay"
            >
              <div className="w-10 h-10 rounded-lg bg-black flex items-center justify-center">
                <SiApplepay className="h-6 w-6 text-white" />
              </div>
              <div className="flex-1 text-left">
                <p className="font-medium">Apple Pay</p>
                <p className="text-xs text-muted-foreground">Fast and secure</p>
              </div>
              {paymentMethod === "apple_pay" && (
                <Check className="h-5 w-5 text-accent" />
              )}
            </button>

            <button
              onClick={() => setPaymentMethod("credit_card")}
              className={`w-full p-4 rounded-lg border-2 transition-colors flex items-center gap-3 ${
                paymentMethod === "credit_card" 
                  ? "border-accent bg-accent/5" 
                  : "border-border hover:border-accent/50"
              }`}
              data-testid="button-credit-card"
            >
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                <CreditCard className="h-5 w-5 text-white" />
              </div>
              <div className="flex-1 text-left">
                <p className="font-medium">Credit / Debit Card</p>
                <p className="text-xs text-muted-foreground">Visa, Mastercard</p>
              </div>
              {paymentMethod === "credit_card" && (
                <Check className="h-5 w-5 text-accent" />
              )}
            </button>
          </CardContent>
        </Card>

        <Button 
          className="w-full h-12 text-base"
          onClick={handlePayment}
          disabled={isProcessing}
          data-testid="button-pay"
        >
          {isProcessing ? (
            <>
              <Loader2 className="h-5 w-5 mr-2 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              {paymentMethod === "apple_pay" ? (
                <SiApplepay className="h-5 w-5 mr-2" />
              ) : (
                <CreditCard className="h-5 w-5 mr-2" />
              )}
              Pay AED {pkg.price}
            </>
          )}
        </Button>

        <p className="text-xs text-center text-muted-foreground">
          Payments are processed securely via Telr.
          By completing this purchase, you agree to our terms of service.
        </p>
      </div>
    </div>
  );
}
