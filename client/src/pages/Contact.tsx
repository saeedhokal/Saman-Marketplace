import { Link } from "wouter";
import { ArrowLeft, Mail, Phone, MapPin } from "lucide-react";

export default function Contact() {
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
            <h1 className="flex-1 text-center font-semibold text-lg pr-8">Contact Us</h1>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        <h2 className="text-xl font-bold mb-6">Contact Us</h2>
        
        <div className="space-y-4">
          <p className="font-medium">SamanParts Portal</p>

          <div className="flex items-start gap-3">
            <MapPin className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
            <div>
              <span className="font-medium">Location:</span> Alkhawaneej 2, Dubai, United Arab Emirates
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Mail className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
            <div>
              <span className="font-medium">Email:</span>{" "}
              <a href="mailto:Saeed.hokal@hotmail.com" className="text-accent hover:underline">
                Saeed.hokal@hotmail.com
              </a>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Phone className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
            <div>
              <span className="font-medium">Phone:</span>{" "}
              <a href="tel:+971507242111" className="text-accent hover:underline">
                +971507242111
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
