import { Link } from "wouter";
import { ArrowLeft } from "lucide-react";

export default function Cookies() {
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
            <h1 className="flex-1 text-center font-semibold text-lg pr-8">Cookie Policy</h1>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        <div className="space-y-6 text-sm">
          <p className="text-muted-foreground">Last updated: January 2025</p>

          <section>
            <h2 className="text-lg font-semibold mb-2">What Are Cookies</h2>
            <p className="text-muted-foreground leading-relaxed">
              Cookies are small text files that are stored on your device when you visit a website. 
              They are widely used to make websites work more efficiently and provide information to 
              the owners of the site.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-2">How We Use Cookies</h2>
            <p className="text-muted-foreground leading-relaxed mb-2">
              We use cookies for the following purposes:
            </p>
            <ul className="text-muted-foreground space-y-2 ml-4">
              <li>
                <strong className="text-foreground">Essential Cookies:</strong> Required for the 
                operation of our platform. They include session cookies that keep you logged in.
              </li>
              <li>
                <strong className="text-foreground">Functionality Cookies:</strong> Allow us to 
                remember your preferences and provide enhanced features.
              </li>
              <li>
                <strong className="text-foreground">Analytics Cookies:</strong> Help us understand 
                how visitors interact with our platform to improve our services.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-2">Managing Cookies</h2>
            <p className="text-muted-foreground leading-relaxed">
              Most web browsers allow you to control cookies through their settings. You can set your 
              browser to refuse cookies or delete certain cookies. However, if you block or delete 
              cookies, some features of our platform may not function properly.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-2">Third-Party Cookies</h2>
            <p className="text-muted-foreground leading-relaxed">
              We may use third-party services that set their own cookies. These cookies are governed 
              by the respective third parties' privacy policies.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-2">Contact Us</h2>
            <p className="text-muted-foreground leading-relaxed">
              If you have questions about our use of cookies, please contact us at 
              support@samanmarketplace.com
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
