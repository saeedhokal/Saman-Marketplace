import { Link } from "wouter";
import { ArrowLeft } from "lucide-react";

export default function Refund() {
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
            <h1 className="flex-1 text-center font-semibold text-lg pr-8">Return & Refund Policy</h1>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        <div className="space-y-6 text-sm">
          <p className="text-muted-foreground">Last updated: January 2025</p>

          <section>
            <h2 className="text-lg font-semibold mb-2">Credit Refunds</h2>
            <p className="text-muted-foreground leading-relaxed">
              Credits purchased for listing products are refundable under the following conditions:
            </p>
            <ul className="text-muted-foreground space-y-2 mt-2 ml-4">
              <li>• If your listing is rejected by our admin team, your credit will be automatically refunded to your account.</li>
              <li>• Spare Parts Credits are refunded for rejected spare parts listings.</li>
              <li>• Automotive Credits are refunded for rejected automotive listings.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-2">Non-Refundable Situations</h2>
            <p className="text-muted-foreground leading-relaxed">
              Credits are not refundable in the following cases:
            </p>
            <ul className="text-muted-foreground space-y-2 mt-2 ml-4">
              <li>• Listings that have been approved and published</li>
              <li>• Listings that have expired after the 1-month period</li>
              <li>• Listings that you voluntarily delete or mark as sold</li>
              <li>• Unused credits in your account</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-2">Subscription Cancellation</h2>
            <p className="text-muted-foreground leading-relaxed">
              Credit packages are one-time purchases, not recurring subscriptions. Once purchased, 
              credits remain in your account until used. There is no subscription to cancel.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-2">Transaction Between Users</h2>
            <p className="text-muted-foreground leading-relaxed">
              Saman Marketplace is a platform that connects buyers and sellers. We are not responsible 
              for returns, refunds, or disputes related to transactions between users. All such matters 
              must be resolved directly between the buyer and seller.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-2">Payment Disputes</h2>
            <p className="text-muted-foreground leading-relaxed">
              If you believe there has been an error with your payment, please contact us within 
              7 days of the transaction. We will investigate and resolve the issue as quickly as possible.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-2">Contact for Refund Requests</h2>
            <p className="text-muted-foreground leading-relaxed">
              For refund inquiries or disputes, please contact our support team at 
              support@samanmarketplace.com with your transaction details.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
