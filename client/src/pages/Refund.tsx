import { Link } from "wouter";
import { ArrowLeft } from "lucide-react";

export default function Refund() {
  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 z-40 bg-background border-b border-border">
        <div className="container mx-auto px-4">
          <div className="flex items-center h-14">
            <Link href="/profile">
              <button className="p-2 -ml-2 rounded-lg hover:bg-secondary transition-colors" data-testid="button-back">
                <ArrowLeft className="h-5 w-5" />
              </button>
            </Link>
            <h1 className="flex-1 text-center font-semibold text-lg pr-8">Return, Refund & Cancellation Policy</h1>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        <h2 className="text-xl font-bold mb-6">Return, Refund & Cancellation Policy</h2>
        
        <div className="space-y-6">
          <p className="font-medium text-foreground">
            "All purchases on the platform are final. We do not offer refunds or cancellations for listing packages or promotional services."
          </p>

          <div>
            <h3 className="font-bold mb-2">Payment Confirmation</h3>
            <p className="text-muted-foreground">
              After successful payment, a confirmation email will be sent to the customer within 24 hours of receipt.
            </p>
          </div>

          <div>
            <h3 className="font-bold mb-2">Pricing and Description Disclaimer</h3>
            <p className="text-muted-foreground">
              All advertising and promotion packages are clearly described and priced on the app. Prices are subject to change prior to checkout. We do not support payments from or to sanctioned countries or currencies.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
