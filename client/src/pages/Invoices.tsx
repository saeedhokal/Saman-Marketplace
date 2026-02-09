import { useState } from "react";
import { Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { useLanguage } from "@/hooks/use-language";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, FileText, ChevronRight, X, CreditCard, Loader2 } from "lucide-react";

interface Invoice {
  id: number;
  invoiceNumber: string;
  date: string;
  packageName: string;
  category: string;
  credits: number;
  paymentMethod: string;
  baseAmount: number;
  vatAmount: number;
  totalAmount: number;
  status: string;
}

export default function Invoices() {
  const { user } = useAuth();
  const { t, isRTL } = useLanguage();
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

  const { data: invoices, isLoading } = useQuery<Invoice[]>({
    queryKey: ["/api/user/invoices"],
    enabled: !!user,
  });

  const formatPrice = (val: number) => {
    const formatted = val % 1 === 0 ? val.toFixed(2) : val.toFixed(2);
    return isRTL ? `${formatted} د.إ` : `${formatted} AED`;
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString(isRTL ? "ar-AE" : "en-AE", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatPaymentMethod = (method: string) => {
    if (method === "apple_pay") return "Apple Pay";
    if (method === "credit_card") return isRTL ? "بطاقة ائتمان" : "Credit Card";
    return method;
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background pb-28 flex items-center justify-center">
        <div className="text-center px-4">
          <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h2 className="text-lg font-semibold mb-2">{t("pleaseSignIn")}</h2>
          <Link href="/auth">
            <Button data-testid="button-signin">{t("signIn")}</Button>
          </Link>
        </div>
      </div>
    );
  }

  if (selectedInvoice) {
    return (
      <div className="min-h-screen bg-background pb-28" dir={isRTL ? "rtl" : "ltr"}>
        <div className="sticky top-0 z-40 bg-background border-b border-border">
          <div className="container mx-auto px-4">
            <div className="flex items-center h-14">
              <button
                onClick={() => setSelectedInvoice(null)}
                className={`p-2 ${isRTL ? '-mr-2' : '-ml-2'} rounded-lg hover:bg-secondary transition-colors`}
                data-testid="button-back-invoices"
              >
                <ArrowLeft className={`h-5 w-5 ${isRTL ? 'rotate-180' : ''}`} />
              </button>
              <h1 className={`flex-1 text-center font-semibold text-lg ${isRTL ? 'pl-8' : 'pr-8'}`}>{t("invoiceDetails")}</h1>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 py-6 max-w-md space-y-4">
          <Card>
            <CardContent className="pt-6 space-y-4">
              <div className="text-center pb-4 border-b">
                <h2 className="text-xl font-bold">SAMAN</h2>
                <p className="text-xs text-muted-foreground mt-1">Saman Marketplace</p>
                <p className="text-xs text-muted-foreground">United Arab Emirates</p>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center gap-2">
                  <span className="text-sm text-muted-foreground">{t("invoiceNumber")}</span>
                  <span className="text-sm font-medium" data-testid="text-invoice-number">{selectedInvoice.invoiceNumber}</span>
                </div>
                <div className="flex justify-between items-center gap-2">
                  <span className="text-sm text-muted-foreground">{isRTL ? "التاريخ" : "Date"}</span>
                  <span className="text-sm">{formatDate(selectedInvoice.date)}</span>
                </div>
                <div className="flex justify-between items-center gap-2">
                  <span className="text-sm text-muted-foreground">{isRTL ? "طريقة الدفع" : "Payment"}</span>
                  <span className="text-sm">{formatPaymentMethod(selectedInvoice.paymentMethod)}</span>
                </div>
              </div>

              <div className="border-t pt-4 space-y-3">
                <div className="flex justify-between items-start gap-2">
                  <div className="flex-1">
                    <p className="text-sm font-medium">{selectedInvoice.packageName}</p>
                    <p className="text-xs text-muted-foreground">
                      {selectedInvoice.category === "Spare Parts" ? t("spareParts") : t("automotive")} - {selectedInvoice.credits} {t("credits")}
                    </p>
                  </div>
                  <span className="text-sm">{formatPrice(selectedInvoice.baseAmount)}</span>
                </div>
              </div>

              <div className="border-t pt-3 space-y-2">
                <div className="flex justify-between items-center gap-2">
                  <span className="text-sm text-muted-foreground">{t("subtotal")}</span>
                  <span className="text-sm">{formatPrice(selectedInvoice.baseAmount)}</span>
                </div>
                <div className="flex justify-between items-center gap-2">
                  <span className="text-sm text-muted-foreground">{t("vat")}</span>
                  <span className="text-sm">{formatPrice(selectedInvoice.vatAmount)}</span>
                </div>
                <div className="flex justify-between items-center gap-2 pt-2 border-t">
                  <span className="font-semibold">{t("total")}</span>
                  <span className="text-lg font-bold text-accent" data-testid="text-invoice-total">{formatPrice(selectedInvoice.totalAmount)}</span>
                </div>
              </div>

              <div className="border-t pt-3">
                <p className="text-[10px] text-muted-foreground text-center">
                  {isRTL ? "جميع الأسعار بالدرهم الإماراتي. ضريبة القيمة المضافة ٥٪ حسب قوانين دولة الإمارات." : "All prices in AED. VAT 5% as per UAE Federal Tax Authority regulations."}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-28" dir={isRTL ? "rtl" : "ltr"}>
      <div className="sticky top-0 z-40 bg-background border-b border-border">
        <div className="container mx-auto px-4">
          <div className="flex items-center h-14">
            <Link href="/profile">
              <button className={`p-2 ${isRTL ? '-mr-2' : '-ml-2'} rounded-lg hover:bg-secondary transition-colors`} data-testid="button-back">
                <ArrowLeft className={`h-5 w-5 ${isRTL ? 'rotate-180' : ''}`} />
              </button>
            </Link>
            <h1 className={`flex-1 text-center font-semibold text-lg ${isRTL ? 'pl-8' : 'pr-8'}`}>{t("invoices")}</h1>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 max-w-md">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-accent" />
          </div>
        ) : !invoices || invoices.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">{t("noInvoices")}</p>
            <p className="text-sm text-muted-foreground mt-1">{t("noInvoicesDesc")}</p>
            <Link href="/profile/subscription">
              <Button className="mt-4" data-testid="button-buy-credits">
                {t("purchaseSubscription")}
              </Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {invoices.map((invoice) => (
              <Card
                key={invoice.id}
                className="hover-elevate cursor-pointer"
                onClick={() => setSelectedInvoice(invoice)}
                data-testid={`card-invoice-${invoice.id}`}
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center flex-shrink-0">
                      <FileText className="h-5 w-5 text-accent" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-medium text-sm truncate">{invoice.packageName}</p>
                        <span className="text-sm font-semibold text-accent flex-shrink-0" data-testid={`text-invoice-amount-${invoice.id}`}>
                          {formatPrice(invoice.totalAmount)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-2 mt-1">
                        <p className="text-xs text-muted-foreground">{invoice.invoiceNumber}</p>
                        <p className="text-xs text-muted-foreground">{formatDate(invoice.date)}</p>
                      </div>
                      <p className="text-[10px] text-muted-foreground mt-0.5">{t("inclVat")}</p>
                    </div>
                    <ChevronRight className={`h-4 w-4 text-muted-foreground flex-shrink-0 ${isRTL ? 'rotate-180' : ''}`} />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
