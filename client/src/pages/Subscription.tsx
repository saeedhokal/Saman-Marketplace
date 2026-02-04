import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Package, Car, Loader2, Check, Sparkles } from "lucide-react";
import { type SubscriptionPackage } from "@shared/schema";
import { useLanguage } from "@/hooks/use-language";
import { type TranslationKey } from "@/lib/translations";

const packageNameMap: Record<string, TranslationKey> = {
  "Spare Part Basic": "sparePartBasic",
  "Spare Part Standard": "sparePartStandard", 
  "Spare Part Advanced": "sparePartAdvanced",
  "Automotive Basic": "automotiveBasic",
  "Automotive Standard": "automotiveStandard",
  "Automotive Premium": "automotivePremium",
};

interface CreditsInfo {
  sparePartsCredits: number;
  automotiveCredits: number;
  isAdmin: boolean;
  subscriptionEnabled: boolean;
}

export default function Subscription() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState<"Spare Parts" | "Automotive">("Spare Parts");
  const { t, isRTL } = useLanguage();

  const { data: creditsInfo, isLoading: creditsLoading } = useQuery<CreditsInfo>({
    queryKey: ["/api/user/credits"],
    enabled: !!user,
  });

  const { data: packages, isLoading: packagesLoading } = useQuery<SubscriptionPackage[]>({
    queryKey: ["/api/packages", activeTab],
    queryFn: async () => {
      const res = await fetch(`/api/packages?category=${encodeURIComponent(activeTab)}`);
      return res.json();
    },
  });

  if (!user) {
    return (
      <div className="min-h-screen bg-background pb-20 flex items-center justify-center" dir={isRTL ? "rtl" : "ltr"}>
        <div className="text-center px-4">
          <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h2 className="text-lg font-semibold mb-2">{t("signInToPurchase")}</h2>
          <Link href="/auth">
            <Button>{t("signIn")}</Button>
          </Link>
        </div>
      </div>
    );
  }

  const isLoading = creditsLoading || packagesLoading;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background pb-20 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-accent" />
      </div>
    );
  }

  if (!creditsInfo?.subscriptionEnabled) {
    return (
      <div className="min-h-screen bg-background pb-20" dir={isRTL ? "rtl" : "ltr"}>
        <div className="sticky top-0 z-40 bg-background border-b border-border">
          <div className="container mx-auto px-4">
            <div className="flex items-center h-14">
              <Link href="/profile">
                <button className={`p-2 ${isRTL ? '-mr-2' : '-ml-2'} rounded-lg hover:bg-secondary transition-colors`} data-testid="button-back">
                  <ArrowLeft className={`h-5 w-5 ${isRTL ? 'rotate-180' : ''}`} />
                </button>
              </Link>
              <h1 className={`flex-1 text-center font-semibold text-lg ${isRTL ? 'pl-8' : 'pr-8'}`}>{t("purchaseCreditsTitle")}</h1>
            </div>
          </div>
        </div>
        <div className="container mx-auto px-4 py-8 text-center">
          <Check className="h-16 w-16 mx-auto text-green-500 mb-4" />
          <h2 className="text-xl font-semibold mb-2">{t("freePostingEnabled")}</h2>
          <p className="text-muted-foreground">
            {t("creditsNotRequired")}
          </p>
          <Link href="/sell">
            <Button className="mt-6">{t("postAListing")}</Button>
          </Link>
        </div>
      </div>
    );
  }

  const handleSelectPackage = (pkg: SubscriptionPackage) => {
    // Simple client-side navigation
    setLocation(`/checkout/${pkg.id}`);
  };

  const totalCredits = (pkg: SubscriptionPackage) => pkg.credits + (pkg.bonusCredits || 0);
  const pricePerCredit = (pkg: SubscriptionPackage) => (pkg.price / totalCredits(pkg)).toFixed(0);

  const tabLabel = activeTab === "Spare Parts" ? t("spareParts") : t("automotive");

  return (
    <div className="min-h-screen bg-background pb-20" dir={isRTL ? "rtl" : "ltr"}>
      <div className="sticky top-0 z-40 bg-background border-b border-border">
        <div className="container mx-auto px-4">
          <div className="flex items-center h-14">
            <Link href="/profile">
              <button className={`p-2 ${isRTL ? '-mr-2' : '-ml-2'} rounded-lg hover:bg-secondary transition-colors`} data-testid="button-back">
                <ArrowLeft className={`h-5 w-5 ${isRTL ? 'rotate-180' : ''}`} />
              </button>
            </Link>
            <h1 className={`flex-1 text-center font-semibold text-lg ${isRTL ? 'pl-8' : 'pr-8'}`}>{t("purchaseCreditsTitle")}</h1>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-4 space-y-4">
        <div className="lg:max-w-md lg:mx-auto space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <Card className="border-accent/30 bg-accent/5">
            <CardContent className="p-3 text-center">
              <Package className="h-6 w-6 mx-auto text-accent mb-1" />
              <p className="text-xl font-bold">{creditsInfo?.sparePartsCredits || 0}</p>
              <p className="text-xs text-muted-foreground">{t("partsCredits")}</p>
            </CardContent>
          </Card>
          <Card className="border-accent/30 bg-accent/5">
            <CardContent className="p-3 text-center">
              <Car className="h-6 w-6 mx-auto text-accent mb-1" />
              <p className="text-xl font-bold">{creditsInfo?.automotiveCredits || 0}</p>
              <p className="text-xs text-muted-foreground">{t("autoCredits")}</p>
            </CardContent>
          </Card>
        </div>

        <div className="flex gap-2 p-1.5 bg-secondary/80 rounded-xl">
          <button
            onClick={() => setActiveTab("Spare Parts")}
            className={`flex-1 py-3 px-4 rounded-lg text-sm font-semibold transition-all flex items-center justify-center gap-2 ${
              activeTab === "Spare Parts"
                ? "bg-accent text-accent-foreground shadow-md"
                : "text-muted-foreground hover:text-foreground hover:bg-secondary"
            }`}
            data-testid="tab-spare-parts"
          >
            <Package className="h-4 w-4 shrink-0" />
            <span>{t("spareParts")}</span>
          </button>
          <button
            onClick={() => setActiveTab("Automotive")}
            className={`flex-1 py-3 px-4 rounded-lg text-sm font-semibold transition-all flex items-center justify-center gap-2 ${
              activeTab === "Automotive"
                ? "bg-accent text-accent-foreground shadow-md"
                : "text-muted-foreground hover:text-foreground hover:bg-secondary"
            }`}
            data-testid="tab-automotive"
          >
            <Car className="h-4 w-4 shrink-0" />
            <span>{t("automotive")}</span>
          </button>
        </div>

        <div className="space-y-3">
          {packages && packages.length > 0 ? (
            packages.map((pkg, index) => {
              const isPopular = index === Math.floor(packages.length / 2);
              const hasBonusCredits = pkg.bonusCredits > 0;
              
              return (
                <Card 
                  key={pkg.id} 
                  className={`relative overflow-hidden ${isPopular ? 'border-accent border-2' : ''}`}
                >
                  {isPopular && (
                    <div className={`absolute top-0 ${isRTL ? 'left-0 rounded-br-lg' : 'right-0 rounded-bl-lg'} bg-accent text-white text-xs px-3 py-1 font-medium`}>
                      <Sparkles className={`h-3 w-3 inline ${isRTL ? 'ml-1' : 'mr-1'}`} />
                      {t("popular")}
                    </div>
                  )}
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex-1">
                        <h3 className="font-semibold text-base">{packageNameMap[pkg.name] ? t(packageNameMap[pkg.name]) : pkg.name}</h3>
                        <div className="flex items-baseline gap-2 mt-1">
                          <span className="text-2xl font-bold text-accent">{isRTL ? `${pkg.price} د.إ` : `AED ${pkg.price}`}</span>
                        </div>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          <span className="text-sm text-muted-foreground">
                            {pkg.credits} {t("credit")}{pkg.credits > 1 && !isRTL ? 's' : ''}
                            {hasBonusCredits && (
                              <span className={`text-green-600 font-medium ${isRTL ? 'mr-1' : 'ml-1'}`}>
                                +{pkg.bonusCredits} {t("free")}
                              </span>
                            )}
                          </span>
                          {pkg.credits > 1 && (
                            <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                              {isRTL ? `${pricePerCredit(pkg)} د.إ${t("perCredit")}` : `AED ${pricePerCredit(pkg)}${t("perCredit")}`}
                            </span>
                          )}
                        </div>
                      </div>
                      <Button 
                        onClick={() => handleSelectPackage(pkg)}
                        className={isPopular ? '' : 'bg-secondary text-foreground hover:bg-secondary/80'}
                        data-testid={`button-select-package-${pkg.id}`}
                      >
                        {t("select")}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Package className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>{t("noPackagesAvailable")} {tabLabel}</p>
            </div>
          )}
        </div>

        <p className="text-xs text-center text-muted-foreground pt-2">
          {t("creditsUsedToPost")} {tabLabel} {t("categoryText")}
          {t("eachListingRequires")}
        </p>
        </div>
      </div>
    </div>
  );
}
