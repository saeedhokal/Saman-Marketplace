import { Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Package, Car, Loader2, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

interface CreditsInfo {
  sparePartsCredits: number;
  automotiveCredits: number;
  isAdmin: boolean;
  subscriptionEnabled: boolean;
}

export default function Subscription() {
  const { user } = useAuth();
  const { toast } = useToast();

  const { data: creditsInfo, isLoading } = useQuery<CreditsInfo>({
    queryKey: ["/api/user/credits"],
    enabled: !!user,
  });

  const purchaseCredits = useMutation({
    mutationFn: async ({ category, amount }: { category: "spare_parts" | "automotive"; amount: number }) => {
      const res = await apiRequest("POST", "/api/user/credits/purchase", { category, amount });
      return res.json();
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/user/credits"] });
      const categoryName = variables.category === "spare_parts" ? "Spare Parts" : "Automotive";
      toast({
        title: "Credits Purchased!",
        description: `You now have ${variables.amount} more ${categoryName} credit(s).`,
      });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Purchase Failed",
        description: error.message || "Failed to purchase credits",
      });
    },
  });

  if (!user) {
    return (
      <div className="min-h-screen bg-background pb-20 flex items-center justify-center">
        <div className="text-center px-4">
          <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h2 className="text-lg font-semibold mb-2">Sign in to purchase credits</h2>
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

  if (!creditsInfo?.subscriptionEnabled) {
    return (
      <div className="min-h-screen bg-background pb-20">
        <div className="sticky top-0 z-40 bg-background border-b border-border">
          <div className="container mx-auto px-4">
            <div className="flex items-center h-14">
              <Link href="/profile">
                <button className="p-2 -ml-2 rounded-lg hover:bg-secondary transition-colors" data-testid="button-back">
                  <ArrowLeft className="h-5 w-5" />
                </button>
              </Link>
              <h1 className="flex-1 text-center font-semibold text-lg pr-8">Purchase Credits</h1>
            </div>
          </div>
        </div>
        <div className="container mx-auto px-4 py-8 text-center">
          <Check className="h-16 w-16 mx-auto text-green-500 mb-4" />
          <h2 className="text-xl font-semibold mb-2">Free Posting Enabled</h2>
          <p className="text-muted-foreground">
            Credits are not currently required to post listings. You can post for free!
          </p>
          <Link href="/sell">
            <Button className="mt-6">Post a Listing</Button>
          </Link>
        </div>
      </div>
    );
  }

  const creditPackages = [
    { amount: 1, price: 10 },
    { amount: 5, price: 45 },
    { amount: 10, price: 80 },
  ];

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="sticky top-0 z-40 bg-background border-b border-border">
        <div className="container mx-auto px-4">
          <div className="flex items-center h-14">
            <Link href="/profile">
              <button className="p-2 -ml-2 rounded-lg hover:bg-secondary transition-colors" data-testid="button-back">
                <ArrowLeft className="h-5 w-5" />
              </button>
            </Link>
            <h1 className="flex-1 text-center font-semibold text-lg pr-8">Purchase Credits</h1>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <Card className="border-accent/30 bg-accent/5">
            <CardContent className="pt-4 text-center">
              <Package className="h-8 w-8 mx-auto text-accent mb-2" />
              <p className="text-2xl font-bold">{creditsInfo?.sparePartsCredits || 0}</p>
              <p className="text-xs text-muted-foreground">Spare Parts Credits</p>
            </CardContent>
          </Card>
          <Card className="border-accent/30 bg-accent/5">
            <CardContent className="pt-4 text-center">
              <Car className="h-8 w-8 mx-auto text-accent mb-2" />
              <p className="text-2xl font-bold">{creditsInfo?.automotiveCredits || 0}</p>
              <p className="text-xs text-muted-foreground">Automotive Credits</p>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <h2 className="font-semibold">Spare Parts Credits</h2>
          <div className="grid gap-3">
            {creditPackages.map((pkg) => (
              <Card key={`spare-${pkg.amount}`} className="overflow-hidden">
                <CardContent className="p-4 flex items-center justify-between">
                  <div>
                    <p className="font-semibold">{pkg.amount} Credit{pkg.amount > 1 ? "s" : ""}</p>
                    <p className="text-sm text-muted-foreground">AED {pkg.price}</p>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => purchaseCredits.mutate({ category: "spare_parts", amount: pkg.amount })}
                    disabled={purchaseCredits.isPending}
                    data-testid={`button-buy-spare-${pkg.amount}`}
                  >
                    {purchaseCredits.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Buy"}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="font-semibold">Automotive Credits</h2>
          <div className="grid gap-3">
            {creditPackages.map((pkg) => (
              <Card key={`auto-${pkg.amount}`} className="overflow-hidden">
                <CardContent className="p-4 flex items-center justify-between">
                  <div>
                    <p className="font-semibold">{pkg.amount} Credit{pkg.amount > 1 ? "s" : ""}</p>
                    <p className="text-sm text-muted-foreground">AED {pkg.price}</p>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => purchaseCredits.mutate({ category: "automotive", amount: pkg.amount })}
                    disabled={purchaseCredits.isPending}
                    data-testid={`button-buy-auto-${pkg.amount}`}
                  >
                    {purchaseCredits.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Buy"}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        <p className="text-xs text-center text-muted-foreground pt-4">
          Credits are used to post listings. Each listing requires 1 credit from the matching category.
          Credits can be purchased multiple times and are added to your balance.
        </p>
      </div>
    </div>
  );
}
