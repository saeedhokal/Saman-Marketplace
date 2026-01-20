import { Link } from "wouter";
import { ArrowLeft } from "lucide-react";

export default function Terms() {
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
            <h1 className="flex-1 text-center font-semibold text-lg pr-8">Terms & Conditions</h1>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        <div className="space-y-6 text-sm">
          <p className="text-muted-foreground">Last updated: January 2025</p>

          <section>
            <h2 className="text-lg font-semibold mb-2">1. Acceptance of Terms</h2>
            <p className="text-muted-foreground leading-relaxed">
              By accessing and using Saman Marketplace, you accept and agree to be bound by the terms and 
              provisions of this agreement. If you do not agree to abide by these terms, please do not use this service.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-2">2. Use of Service</h2>
            <p className="text-muted-foreground leading-relaxed">
              Saman Marketplace provides a platform for users to list and browse automotive parts and vehicles. 
              Users must be at least 18 years old to use this service. You agree to provide accurate information 
              when creating listings and to conduct all transactions honestly.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-2">3. User Accounts</h2>
            <p className="text-muted-foreground leading-relaxed">
              You are responsible for maintaining the confidentiality of your account and phone number. 
              You agree to accept responsibility for all activities that occur under your account.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-2">4. Listings and Content</h2>
            <p className="text-muted-foreground leading-relaxed">
              All listings are subject to admin approval before being published. We reserve the right to 
              remove any listing that violates our policies or contains inappropriate content. Users are 
              solely responsible for the accuracy of their listings.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-2">5. Credits and Subscriptions</h2>
            <p className="text-muted-foreground leading-relaxed">
              Credits are category-specific and non-transferable. Spare Parts Credits can only be used for 
              spare parts listings, and Automotive Credits can only be used for automotive listings. 
              Credits are refunded if a listing is rejected by admin.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-2">6. Transactions</h2>
            <p className="text-muted-foreground leading-relaxed">
              Saman Marketplace is a platform that connects buyers and sellers. We are not a party to any 
              transaction between users. All transactions are conducted directly between buyers and sellers.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-2">7. Limitation of Liability</h2>
            <p className="text-muted-foreground leading-relaxed">
              Saman Marketplace shall not be liable for any indirect, incidental, special, consequential, 
              or punitive damages resulting from your use of the service.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-2">8. Changes to Terms</h2>
            <p className="text-muted-foreground leading-relaxed">
              We reserve the right to modify these terms at any time. Changes will be effective immediately 
              upon posting to the platform. Your continued use of the service constitutes acceptance of 
              the modified terms.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-2">9. Contact</h2>
            <p className="text-muted-foreground leading-relaxed">
              For questions about these terms, please contact us at support@samanmarketplace.com
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
