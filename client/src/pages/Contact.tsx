import { useState } from "react";
import { Link } from "wouter";
import { ArrowLeft, Send, Mail, Phone, MapPin, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

export default function Contact() {
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !message.trim()) {
      toast({ variant: "destructive", title: "Error", description: "Please fill in all required fields." });
      return;
    }
    setSending(true);
    try {
      await apiRequest("POST", "/api/contact", { name, email, subject, message });
      setSent(true);
      toast({ title: "Message Sent", description: "We'll get back to you as soon as possible." });
    } catch (err: any) {
      toast({ variant: "destructive", title: "Error", description: err.message || "Failed to send message. Please try again." });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 z-40 bg-background border-b border-border">
        <div className="container mx-auto px-4">
          <div className="flex items-center h-14">
            <Link href="/">
              <button className="p-2 -ml-2 rounded-lg hover:bg-secondary transition-colors" data-testid="button-back">
                <ArrowLeft className="h-5 w-5" />
              </button>
            </Link>
            <h1 className="flex-1 text-center font-semibold text-lg pr-8">Contact Us</h1>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 max-w-2xl">
        <div className="space-y-6">
          <section>
            <h2 className="text-xl font-bold mb-2">Get in Touch</h2>
            <p className="text-muted-foreground leading-relaxed">
              Have a question, feedback, or need help? Send us a message and our team will get back to you as soon as possible.
            </p>
          </section>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="flex items-center gap-3 p-4 rounded-xl bg-secondary/50">
              <Mail className="h-5 w-5 text-orange-500 shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">Email</p>
                <p className="text-sm font-medium">samanhelp@outlook.com</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 rounded-xl bg-secondary/50">
              <MapPin className="h-5 w-5 text-orange-500 shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">Location</p>
                <p className="text-sm font-medium">Dubai, UAE</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 rounded-xl bg-secondary/50">
              <Phone className="h-5 w-5 text-orange-500 shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">Phone</p>
                <p className="text-sm font-medium">+971507242111</p>
              </div>
            </div>
          </div>

          {sent ? (
            <div className="flex flex-col items-center justify-center py-12 text-center space-y-4">
              <CheckCircle className="h-16 w-16 text-green-500" />
              <h3 className="text-xl font-bold">Message Sent!</h3>
              <p className="text-muted-foreground max-w-sm">
                Thank you for reaching out. We'll review your message and get back to you as soon as possible.
              </p>
              <Button
                variant="outline"
                onClick={() => { setSent(false); setName(""); setEmail(""); setSubject(""); setMessage(""); }}
                data-testid="button-send-another"
              >
                Send Another Message
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Name *</label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name"
                  className="h-12"
                  required
                  data-testid="input-contact-name"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Email *</label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Your email address"
                  className="h-12"
                  required
                  data-testid="input-contact-email"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Subject</label>
                <Input
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="What is this about?"
                  className="h-12"
                  data-testid="input-contact-subject"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Message *</label>
                <Textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Tell us how we can help..."
                  rows={5}
                  required
                  data-testid="input-contact-message"
                />
              </div>

              <Button
                type="submit"
                className="w-full h-12 bg-orange-500 hover:bg-orange-600 text-white font-semibold"
                disabled={sending}
                data-testid="button-send-message"
              >
                {sending ? (
                  <span className="flex items-center gap-2">
                    <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                    Sending...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Send className="h-4 w-4" />
                    Send Message
                  </span>
                )}
              </Button>
            </form>
          )}

          <section className="border-t border-border pt-6">
            <p className="text-sm text-muted-foreground text-center">
              By contacting us, you agree to our{" "}
              <Link href="/privacy" className="text-orange-500 underline">Privacy Policy</Link>
              {" "}and{" "}
              <Link href="/terms" className="text-orange-500 underline">Terms of Service</Link>.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
