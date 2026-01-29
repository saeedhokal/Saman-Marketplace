/// <reference types="applepayjs" />
import { useState, useEffect, useRef } from "react";
import { useRoute, Link, useLocation } from "wouter";
import { useAuth, getStoredUserId } from "@/hooks/use-auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, CreditCard, Loader2, Check, AlertCircle } from "lucide-react";
import { SiApplepay } from "react-icons/si";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { SubscriptionPackage } from "@shared/schema";
import { Capacitor } from "@capacitor/core";

// Import the native Apple Pay plugin
let CapacitorApplePay: any = null;
if (Capacitor.isNativePlatform()) {
  import("@jackobo/capacitor-apple-pay").then((module) => {
    CapacitorApplePay = module.CapacitorApplePay;
    console.log("[ApplePay] Native plugin loaded");
  }).catch((err) => {
    console.log("[ApplePay] Native plugin not available:", err);
  });
}

declare global {
  interface Window {
    ApplePaySession: typeof ApplePaySession;
  }
}

export default function Checkout() {
  const [, params] = useRoute("/checkout/:id");
  const packageId = params?.id ? parseInt(params.id) : 0;
  const { user, isLoading: isAuthLoading } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  
  // Use session user first, then fall back to localStorage (for iOS Capacitor)
  const storedUserId = getStoredUserId();
  const effectiveUserId = user?.id || storedUserId;
  const [paymentMethod, setPaymentMethod] = useState<"apple_pay" | "credit_card">("credit_card");
  const [isProcessing, setIsProcessing] = useState(false);
  const [applePayAvailable, setApplePayAvailable] = useState(false);
  const [useNativeApplePay, setUseNativeApplePay] = useState(false);
  const listenersRef = useRef<any[]>([]);

  useEffect(() => {
    const checkApplePay = async () => {
      // Check native Capacitor Apple Pay first (works properly on iOS)
      if (Capacitor.isNativePlatform() && CapacitorApplePay) {
        try {
          const result = await CapacitorApplePay.canMakePayments();
          if (result.canMakePayments) {
            console.log("[ApplePay] Native Apple Pay available");
            setApplePayAvailable(true);
            setUseNativeApplePay(true);
            setPaymentMethod("apple_pay");
            return;
          }
        } catch (err) {
          console.log("[ApplePay] Native check failed:", err);
        }
      }
      
      // Fall back to web API check (for browser testing)
      if (window.ApplePaySession && ApplePaySession.canMakePayments()) {
        console.log("[ApplePay] Web Apple Pay detected (limited functionality in WKWebView)");
        setApplePayAvailable(true);
        setPaymentMethod("apple_pay");
      }
    };
    
    // Small delay to allow dynamic import to complete
    setTimeout(checkApplePay, 100);
  }, []);

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
      console.log("[Checkout] Starting checkout with:", data);
      try {
        const res = await apiRequest("POST", "/api/checkout", data);
        console.log("[Checkout] Response status:", res.status);
        const json = await res.json();
        console.log("[Checkout] Response data:", json);
        return json;
      } catch (err: any) {
        console.error("[Checkout] Error:", err.message);
        throw err;
      }
    },
    onSuccess: (data) => {
      console.log("[Checkout] Success, data:", data);
      if (data.paymentUrl) {
        console.log("[Checkout] Redirecting to:", data.paymentUrl);
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
      console.error("[Checkout] onError:", error);
      toast({
        variant: "destructive",
        title: "Payment Failed",
        description: error.message || "Please try again",
      });
      setIsProcessing(false);
    },
  });

  // Native Capacitor Apple Pay handler (for iOS app)
  const handleNativeApplePay = async () => {
    if (!pkg || !CapacitorApplePay) return;
    
    setIsProcessing(true);
    const totalCredits = pkg.credits + (pkg.bonusCredits || 0);
    const amount = pkg.price.toString(); // Price is already in AED
    
    console.log("[ApplePay Native] Starting native Apple Pay");
    fetch("/api/debug/applepay-client-log", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ step: "NATIVE_APPLEPAY_START", amount, packageId: pkg.id })
    }).catch(() => {});

    try {
      // Remove any existing listeners
      await CapacitorApplePay.removeAllListeners();
      
      // Set up event listeners
      const validateListener = await CapacitorApplePay.addListener(
        'validateMerchant',
        async (event: { validationURL: string }) => {
          console.log("[ApplePay Native] validateMerchant event:", event.validationURL);
          fetch("/api/debug/applepay-client-log", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ step: "NATIVE_VALIDATE_MERCHANT", url: event.validationURL })
          }).catch(() => {});
          
          try {
            const response = await fetch("/api/applepay/session", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              credentials: "include",
              body: JSON.stringify({ validationURL: event.validationURL }),
            });
            
            if (!response.ok) {
              throw new Error("Merchant validation failed");
            }
            
            const merchantSession = await response.json();
            console.log("[ApplePay Native] Got merchant session");
            
            // Complete validation with the native plugin
            await CapacitorApplePay.completeMerchantValidation({
              merchantSession: JSON.stringify(merchantSession)
            });
            
            fetch("/api/debug/applepay-client-log", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ step: "NATIVE_VALIDATION_COMPLETE" })
            }).catch(() => {});
          } catch (err: any) {
            console.error("[ApplePay Native] Validation error:", err);
            await CapacitorApplePay.paymentAuthorizationFail();
            setIsProcessing(false);
            toast({
              variant: "destructive",
              title: "Apple Pay Error",
              description: err.message || "Merchant validation failed",
            });
          }
        }
      );
      
      const authorizeListener = await CapacitorApplePay.addListener(
        'authorizePayment',
        async (event: { payment: any }) => {
          console.log("[ApplePay Native] authorizePayment event - Face ID completed");
          fetch("/api/debug/applepay-client-log", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ 
              step: "NATIVE_PAYMENT_AUTHORIZED",
              hasPayment: !!event.payment,
              paymentKeys: event.payment ? Object.keys(event.payment) : []
            })
          }).catch(() => {});
          
          try {
            // Process payment with Telr
            const response = await fetch("/api/applepay/process", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              credentials: "include",
              body: JSON.stringify({
                packageId: pkg.id,
                applePayToken: event.payment.token,
                billingContact: event.payment.billingContact,
              }),
            });
            
            const result = await response.json();
            
            if (result.success) {
              await CapacitorApplePay.paymentAuthorizationSuccess();
              queryClient.invalidateQueries({ queryKey: ["/api/user/credits"] });
              toast({
                title: "Payment Successful!",
                description: result.message,
              });
              setLocation("/profile/subscription");
            } else {
              await CapacitorApplePay.paymentAuthorizationFail();
              console.error("[ApplePay Native] Payment failed:", result);
              toast({
                variant: "destructive",
                title: "Payment Failed",
                description: result.message || "Please try again",
              });
            }
          } catch (err: any) {
            console.error("[ApplePay Native] Process error:", err);
            await CapacitorApplePay.paymentAuthorizationFail();
            toast({
              variant: "destructive",
              title: "Payment Failed",
              description: "Payment processing failed. Please try again.",
            });
          } finally {
            setIsProcessing(false);
            await CapacitorApplePay.removeAllListeners();
          }
        }
      );
      
      const cancelListener = await CapacitorApplePay.addListener(
        'cancel',
        () => {
          console.log("[ApplePay Native] Payment cancelled by user");
          fetch("/api/debug/applepay-client-log", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ step: "NATIVE_PAYMENT_CANCELLED" })
          }).catch(() => {});
          setIsProcessing(false);
          CapacitorApplePay.removeAllListeners();
        }
      );
      
      // Store listeners for cleanup
      listenersRef.current = [validateListener, authorizeListener, cancelListener];
      
      // Start the payment
      await CapacitorApplePay.startPayment({
        merchantId: "merchant.saeed.saman",
        countryCode: "AE",
        currencyCode: "AED",
        supportedNetworks: ["visa", "masterCard", "amex"] as any,
        merchantCapabilities: ["supports3DS"] as any,
        total: {
          label: `${pkg.name} - ${totalCredits} Credits`,
          amount: amount,
          type: "final",
        },
      });
      
    } catch (err: any) {
      console.error("[ApplePay Native] Error:", err);
      fetch("/api/debug/applepay-client-log", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ step: "NATIVE_ERROR", error: err?.message || String(err) })
      }).catch(() => {});
      setIsProcessing(false);
      toast({
        variant: "destructive",
        title: "Apple Pay Error",
        description: err.message || "Could not start Apple Pay",
      });
    }
  };

  // Web Apple Pay handler (fallback for testing in browser)
  const handleWebApplePay = async () => {
    if (!pkg || !window.ApplePaySession) return;
    
    setIsProcessing(true);
    const totalCredits = pkg.credits + (pkg.bonusCredits || 0);
    const amount = pkg.price.toString(); // Price is already in AED

    const paymentRequest: ApplePayJS.ApplePayPaymentRequest = {
      countryCode: "AE",
      currencyCode: "AED",
      supportedNetworks: ["visa", "masterCard", "amex"],
      merchantCapabilities: ["supports3DS"],
      total: {
        label: `${pkg.name} - ${totalCredits} Credits`,
        amount: amount,
        type: "final",
      },
      requiredBillingContactFields: ["email", "name", "postalAddress"],
    };

    const session = new ApplePaySession(3, paymentRequest);

    session.onvalidatemerchant = async (event) => {
      console.log("[ApplePay Web] onvalidatemerchant called");
      try {
        const response = await fetch("/api/applepay/session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ validationURL: event.validationURL }),
        });

        if (!response.ok) {
          throw new Error("Merchant validation failed");
        }

        const merchantSession = await response.json();
        session.completeMerchantValidation(merchantSession);
        
        fetch("/api/debug/applepay-client-log", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ step: "WEB_VALIDATION_SUCCESS" })
        }).catch(() => {});
      } catch (error: any) {
        console.error("[ApplePay Web] Validation failed:", error);
        session.abort();
        setIsProcessing(false);
        toast({
          variant: "destructive",
          title: "Apple Pay Error",
          description: "Merchant validation failed. Please try card payment.",
        });
      }
    };

    session.onpaymentauthorized = async (event) => {
      console.log("[ApplePay Web] onpaymentauthorized called");
      try {
        const response = await fetch("/api/applepay/process", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            packageId: pkg.id,
            applePayToken: event.payment.token,
            billingContact: event.payment.billingContact,
          }),
        });

        const result = await response.json();

        if (result.success) {
          session.completePayment(ApplePaySession.STATUS_SUCCESS);
          queryClient.invalidateQueries({ queryKey: ["/api/user/credits"] });
          toast({ title: "Payment Successful!", description: result.message });
          setLocation("/profile/subscription");
        } else {
          session.completePayment(ApplePaySession.STATUS_FAILURE);
          toast({
            variant: "destructive",
            title: "Payment Failed",
            description: result.message || "Please try again",
          });
        }
      } catch (error) {
        session.completePayment(ApplePaySession.STATUS_FAILURE);
        toast({
          variant: "destructive",
          title: "Payment Failed",
          description: "Payment processing failed. Please try again.",
        });
      } finally {
        setIsProcessing(false);
      }
    };

    session.oncancel = () => {
      setIsProcessing(false);
    };

    session.begin();
  };

  // Main Apple Pay handler - uses native when available
  const handleApplePay = async () => {
    if (useNativeApplePay && CapacitorApplePay) {
      await handleNativeApplePay();
    } else {
      await handleWebApplePay();
    }
  };

  const handlePayment = async () => {
    if (!pkg) return;
    
    if (paymentMethod === "apple_pay" && applePayAvailable) {
      // Native Apple Pay with Face ID
      handleApplePay();
    } else {
      // Credit Card - get checkout token first, then redirect
      setIsProcessing(true);
      console.log("[Checkout] Starting credit card checkout for package:", pkg.id);
      
      try {
        // Get a checkout token from the server (include user ID for iOS compatibility)
        const tokenRes = await apiRequest("POST", "/api/checkout-token", { 
          packageId: pkg.id,
          userId: effectiveUserId 
        });
        const tokenData = await tokenRes.json();
        
        if (tokenData.success && tokenData.token) {
          console.log("[Checkout] Got token, redirecting...");
          // Redirect with token (no session needed for this redirect)
          window.location.href = `/api/checkout-redirect?token=${tokenData.token}`;
        } else {
          throw new Error(tokenData.message || "Failed to get checkout token");
        }
      } catch (err: any) {
        console.error("[Checkout] Token error:", err);
        toast({
          variant: "destructive",
          title: "Payment Error",
          description: err.message || "Could not start checkout. Please try again.",
        });
        setIsProcessing(false);
      }
    }
  };

  // FIRST: Wait for auth to finish loading before deciding
  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-background pb-20 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-accent" />
      </div>
    );
  }

  // THEN: Check for either session user or localStorage user ID (for iOS compatibility)
  if (!effectiveUserId) {
    return (
      <div className="min-h-screen bg-background pb-20 flex items-center justify-center">
        <div className="text-center px-4">
          <CreditCard className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h2 className="text-lg font-semibold mb-2">Sign in to continue</h2>
          <p className="text-xs text-muted-foreground mb-4">
            Session not found. Please log in again.
          </p>
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
              <span className="text-xl font-bold text-accent">{pkg.price} AED</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Payment Method</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {applePayAvailable ? (
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
                  <p className="text-xs text-muted-foreground">Pay with Face ID or Touch ID</p>
                </div>
                {paymentMethod === "apple_pay" && (
                  <Check className="h-5 w-5 text-accent" />
                )}
              </button>
            ) : (
              <div className="w-full p-4 rounded-lg border-2 border-border bg-muted/50 flex items-center gap-3 opacity-60">
                <div className="w-10 h-10 rounded-lg bg-black/50 flex items-center justify-center">
                  <SiApplepay className="h-6 w-6 text-white/70" />
                </div>
                <div className="flex-1 text-left">
                  <p className="font-medium text-muted-foreground">Apple Pay</p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    Use Safari on iPhone/Mac
                  </p>
                </div>
              </div>
            )}

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
              Pay {pkg.price} AED
            </>
          )}
        </Button>

        <p className="text-xs text-center text-muted-foreground">
          {paymentMethod === "apple_pay" && applePayAvailable
            ? "Use Face ID or Touch ID to confirm payment instantly."
            : "You'll be redirected to our secure payment page."}
          {" "}By completing this purchase, you agree to our terms of service.
        </p>
      </div>
    </div>
  );
}
