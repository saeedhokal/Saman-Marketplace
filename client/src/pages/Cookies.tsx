import { Link } from "wouter";
import { ArrowLeft } from "lucide-react";

export default function Cookies() {
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
            <h1 className="flex-1 text-center font-semibold text-lg pr-8">Cookie Policy</h1>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        <h2 className="text-xl font-bold mb-6">Cookie Policy</h2>
        
        <p className="text-muted-foreground leading-relaxed">
          We use cookies to enhance your browsing experience. By continuing to visit our site, you agree to our use of cookies. You can modify your cookie preferences in your browser settings.
        </p>
      </div>
    </div>
  );
}
