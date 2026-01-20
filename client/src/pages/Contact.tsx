import { Link } from "wouter";
import { ArrowLeft, Mail, Phone, MapPin, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Contact() {
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
            <h1 className="flex-1 text-center font-semibold text-lg pr-8">Contact Us</h1>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        <div className="space-y-6">
          <section>
            <h2 className="text-lg font-semibold mb-4">Get in Touch</h2>
            <p className="text-muted-foreground leading-relaxed mb-6">
              Have questions, feedback, or need assistance? We're here to help. 
              Reach out to us through any of the following channels.
            </p>
          </section>

          <div className="space-y-4">
            <a 
              href="mailto:support@samanmarketplace.com"
              className="flex items-center gap-4 p-4 bg-secondary/50 rounded-lg hover:bg-secondary transition-colors"
              data-testid="link-email"
            >
              <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center">
                <Mail className="h-5 w-5 text-accent" />
              </div>
              <div>
                <p className="font-medium">Email</p>
                <p className="text-sm text-muted-foreground">support@samanmarketplace.com</p>
              </div>
            </a>

            <a 
              href="tel:+971000000000"
              className="flex items-center gap-4 p-4 bg-secondary/50 rounded-lg hover:bg-secondary transition-colors"
              data-testid="link-phone"
            >
              <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center">
                <Phone className="h-5 w-5 text-accent" />
              </div>
              <div>
                <p className="font-medium">Phone</p>
                <p className="text-sm text-muted-foreground">+971 XX XXX XXXX</p>
              </div>
            </a>

            <a 
              href="https://wa.me/971000000000"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-4 p-4 bg-secondary/50 rounded-lg hover:bg-secondary transition-colors"
              data-testid="link-whatsapp"
            >
              <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center">
                <MessageCircle className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <p className="font-medium">WhatsApp</p>
                <p className="text-sm text-muted-foreground">Chat with us on WhatsApp</p>
              </div>
            </a>

            <div className="flex items-center gap-4 p-4 bg-secondary/50 rounded-lg">
              <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center">
                <MapPin className="h-5 w-5 text-accent" />
              </div>
              <div>
                <p className="font-medium">Location</p>
                <p className="text-sm text-muted-foreground">United Arab Emirates</p>
              </div>
            </div>
          </div>

          <section className="pt-4">
            <h2 className="text-lg font-semibold mb-3">Business Hours</h2>
            <div className="text-muted-foreground space-y-1">
              <p>Sunday - Thursday: 9:00 AM - 6:00 PM</p>
              <p>Friday - Saturday: Closed</p>
            </div>
          </section>

          <section className="pt-4">
            <h2 className="text-lg font-semibold mb-3">Response Time</h2>
            <p className="text-muted-foreground leading-relaxed">
              We aim to respond to all inquiries within 24-48 business hours. 
              For urgent matters, please contact us via WhatsApp for faster response.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
