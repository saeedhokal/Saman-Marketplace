import { Link } from "wouter";
import { ArrowLeft } from "lucide-react";

export default function Privacy() {
  return (
    <div className="min-h-screen bg-background pb-28">
      <div className="sticky top-0 z-40 bg-background border-b border-border">
        <div className="container mx-auto px-4">
          <div className="flex items-center h-14">
            <Link href="/profile">
              <button className="p-2 -ml-2 rounded-lg hover:bg-secondary transition-colors" data-testid="button-back">
                <ArrowLeft className="h-5 w-5" />
              </button>
            </Link>
            <h1 className="flex-1 text-center font-semibold text-lg pr-8">Privacy Policy</h1>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        <div className="space-y-6 text-sm">
          <p className="text-muted-foreground">Last updated: January 2025</p>

          <section>
            <h2 className="text-lg font-semibold mb-2">1. Information We Collect</h2>
            <p className="text-muted-foreground leading-relaxed mb-2">
              We collect information you provide directly to us, including:
            </p>
            <ul className="text-muted-foreground space-y-1 ml-4">
              <li>• Phone number for account verification</li>
              <li>• Profile information (name, email, avatar)</li>
              <li>• Listing information and images</li>
              <li>• Transaction history</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-2">2. How We Use Your Information</h2>
            <p className="text-muted-foreground leading-relaxed mb-2">
              We use the information we collect to:
            </p>
            <ul className="text-muted-foreground space-y-1 ml-4">
              <li>• Provide, maintain, and improve our services</li>
              <li>• Process transactions and send related information</li>
              <li>• Send you technical notices and support messages</li>
              <li>• Respond to your comments and questions</li>
              <li>• Verify your identity and prevent fraud</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-2">3. Information Sharing</h2>
            <p className="text-muted-foreground leading-relaxed">
              We do not sell your personal information. We may share your information with third parties 
              only in the following circumstances: with your consent, to comply with laws, to protect 
              rights and safety, or with service providers who assist in our operations.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-2">4. Data Security</h2>
            <p className="text-muted-foreground leading-relaxed">
              We take reasonable measures to help protect your personal information from loss, theft, 
              misuse, unauthorized access, disclosure, alteration, and destruction.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-2">5. Your Rights</h2>
            <p className="text-muted-foreground leading-relaxed">
              You have the right to access, update, or delete your personal information at any time 
              through your account settings. You may also contact us to exercise these rights.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-2">6. Data Retention</h2>
            <p className="text-muted-foreground leading-relaxed">
              We retain your information for as long as your account is active or as needed to provide 
              you services. We will delete your data upon account deletion request, subject to legal 
              retention requirements.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-2">7. Contact Us</h2>
            <p className="text-muted-foreground leading-relaxed">
              If you have questions about this privacy policy, please contact us at 
              privacy@samanmarketplace.com
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
