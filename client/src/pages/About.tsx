import { Link } from "wouter";
import { ArrowLeft } from "lucide-react";

export default function About() {
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
            <h1 className="flex-1 text-center font-semibold text-lg pr-8">About Us</h1>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        <div className="space-y-6">
          <section>
            <h2 className="text-xl font-bold mb-3">Welcome to Saman Marketplace</h2>
            <p className="text-muted-foreground leading-relaxed">
              Saman Marketplace is the UAE's premier platform for buying and selling automotive parts and vehicles. 
              We connect buyers with trusted sellers across the Emirates, making it easy to find the parts you need 
              or sell your automotive products.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-2">Our Mission</h2>
            <p className="text-muted-foreground leading-relaxed">
              To create the most trusted and efficient marketplace for automotive parts and vehicles in the UAE, 
              empowering both buyers and sellers with a seamless, secure platform.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-2">What We Offer</h2>
            <ul className="text-muted-foreground space-y-2">
              <li className="flex items-start gap-2">
                <span className="text-accent font-bold">•</span>
                <span>Wide selection of spare parts from verified sellers</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-accent font-bold">•</span>
                <span>Automotive listings including cars, motorcycles, and more</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-accent font-bold">•</span>
                <span>Secure phone verification for all users</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-accent font-bold">•</span>
                <span>Direct communication with sellers</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-accent font-bold">•</span>
                <span>Admin-verified listings for quality assurance</span>
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-2">Contact Information</h2>
            <div className="text-muted-foreground space-y-1">
              <p>Saman Marketplace</p>
              <p>United Arab Emirates</p>
              <p>Email: support@samanmarketplace.com</p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
