import { Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, TrendingUp, Package, CreditCard } from "lucide-react";
import type { Transaction } from "@shared/schema";

export default function CreditHistory() {
  const { user } = useAuth();

  const { data: transactions, isLoading } = useQuery<Transaction[]>({
    queryKey: ["/api/user/transactions"],
    enabled: !!user,
  });

  const { data: userInfo, isLoading: creditsLoading } = useQuery<{ 
    sparePartsCredits: number; 
    automotiveCredits: number; 
  }>({
    queryKey: ["/api/user/credits"],
    enabled: !!user,
  });

  if (!user) {
    return (
      <div className="min-h-screen bg-background pb-20 flex items-center justify-center">
        <div className="text-center px-4">
          <CreditCard className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h2 className="text-lg font-semibold mb-2">Sign in to view credit history</h2>
          <Link href="/auth">
            <button className="px-4 py-2 bg-accent text-accent-foreground rounded-lg" data-testid="button-signin">
              Sign In
            </button>
          </Link>
        </div>
      </div>
    );
  }

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
            <h1 className="flex-1 text-center font-semibold text-lg pr-8">Credit History</h1>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-secondary/50 rounded-lg p-4" data-testid="card-spare-parts-credits">
            <p className="text-sm text-muted-foreground mb-1">Spare Parts</p>
            {creditsLoading ? (
              <div className="h-8 w-12 bg-secondary rounded animate-pulse" />
            ) : (
              <p className="text-2xl font-bold" data-testid="text-spare-parts-credits">{userInfo?.sparePartsCredits ?? 0}</p>
            )}
            <p className="text-xs text-muted-foreground">credits</p>
          </div>
          <div className="bg-secondary/50 rounded-lg p-4" data-testid="card-automotive-credits">
            <p className="text-sm text-muted-foreground mb-1">Automotive</p>
            {creditsLoading ? (
              <div className="h-8 w-12 bg-secondary rounded animate-pulse" />
            ) : (
              <p className="text-2xl font-bold" data-testid="text-automotive-credits">{userInfo?.automotiveCredits ?? 0}</p>
            )}
            <p className="text-xs text-muted-foreground">credits</p>
          </div>
        </div>

        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-4">
          Transaction History
        </h2>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-secondary/50 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : !transactions || transactions.length === 0 ? (
          <div className="text-center py-12">
            <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No transactions yet</p>
            <p className="text-sm text-muted-foreground mt-1">
              Purchase credits to start listing your items
            </p>
            <Link href="/profile/subscription">
              <button className="mt-4 px-4 py-2 bg-accent text-accent-foreground rounded-lg text-sm" data-testid="button-buy-credits">
                Buy Credits
              </button>
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {transactions.map((transaction) => (
              <div 
                key={transaction.id}
                className="flex items-center gap-4 p-4 bg-secondary/50 rounded-lg"
                data-testid={`transaction-${transaction.id}`}
              >
                <div className="w-10 h-10 rounded-full flex items-center justify-center bg-green-500/10">
                  <TrendingUp className="h-5 w-5 text-green-500" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-sm">Credit Purchase</p>
                  <p className="text-xs text-muted-foreground">
                    {transaction.category} • {transaction.createdAt ? new Date(transaction.createdAt).toLocaleDateString() : 'N/A'}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-green-500">
                    +{transaction.credits} credits
                  </p>
                  {transaction.amount > 0 && (
                    <p className="text-xs text-muted-foreground">
                      AED {(transaction.amount / 100).toFixed(0)}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
