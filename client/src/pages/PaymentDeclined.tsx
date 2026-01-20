import { Link } from "wouter";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function PaymentDeclined() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="text-center space-y-6 max-w-md">
        <div className="w-20 h-20 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto">
          <AlertCircle className="h-12 w-12 text-red-600" />
        </div>
        <h1 className="text-2xl font-bold" data-testid="text-payment-declined">Payment Declined</h1>
        <p className="text-muted-foreground">
          Your payment was declined. Please check your card details and try again, or use a different payment method.
        </p>
        
        <div className="space-y-3 pt-4">
          <Link href="/buy-credits">
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
