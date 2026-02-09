import { Link } from "wouter";
import { ArrowLeft, ChevronRight, HelpCircle, ShoppingBag, CreditCard, User, Shield, MessageCircle } from "lucide-react";

export default function Help() {
  const faqs = [
    {
      category: "Getting Started",
      icon: User,
      questions: [
        {
          q: "How do I create an account?",
          a: "Simply enter your phone number and verify it with the OTP code we send you. No password required!"
        },
        {
          q: "How do I edit my profile?",
          a: "Go to Profile > My Profile to update your name, email, and profile picture."
        }
      ]
    },
    {
      category: "Buying",
      icon: ShoppingBag,
      questions: [
        {
          q: "How do I contact a seller?",
          a: "On any listing, tap the Call or WhatsApp button to contact the seller directly."
        },
        {
          q: "How do I save listings?",
          a: "Tap the heart icon on any listing to save it to your Favorites. View saved items from your Profile."
        }
      ]
    },
    {
      category: "Selling",
      icon: CreditCard,
      questions: [
        {
          q: "How do I post a listing?",
          a: "Tap the + button at the bottom of the screen, fill in your item details, add photos, and submit for review."
        },
        {
          q: "Why does my listing need approval?",
          a: "All listings are reviewed by our team to ensure quality and prevent fraud. This usually takes 24-48 hours."
        },
        {
          q: "What are credits?",
          a: "Credits are used to post listings. Spare Parts Credits are for parts, Automotive Credits are for vehicles. Each credit allows one listing."
        },
        {
          q: "What happens if my listing is rejected?",
          a: "Don't worry! Your credit will be automatically refunded to your account. Review the rejection reason and submit again."
        },
        {
          q: "How long do listings stay active?",
          a: "Approved listings remain active for 1 month. You can repost them when they're about to expire."
        }
      ]
    },
    {
      category: "Account & Security",
      icon: Shield,
      questions: [
        {
          q: "How do I log out?",
          a: "Go to Profile and tap 'Log Out' at the bottom of the menu."
        },
        {
          q: "How do I delete my account?",
          a: "Go to Profile > Delete Account. Note that this action is permanent and cannot be undone."
        },
        {
          q: "Is my phone number safe?",
          a: "Yes, we only use your phone number for verification and to allow buyers to contact you about your listings."
        }
      ]
    }
  ];

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
            <h1 className="flex-1 text-center font-semibold text-lg pr-8">Help & Support</h1>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        <div className="space-y-6">
          <section>
            <h2 className="text-lg font-semibold mb-2">Frequently Asked Questions</h2>
            <p className="text-muted-foreground text-sm">
              Find answers to common questions about using Saman Marketplace.
            </p>
          </section>

          {faqs.map((category) => (
            <section key={category.category}>
              <div className="flex items-center gap-2 mb-3">
                <category.icon className="h-5 w-5 text-accent" />
                <h3 className="font-semibold">{category.category}</h3>
              </div>
              <div className="space-y-3">
                {category.questions.map((faq, index) => (
                  <details 
                    key={index} 
                    className="group bg-secondary/50 rounded-lg"
                  >
                    <summary className="flex items-center justify-between p-4 cursor-pointer list-none">
                      <span className="font-medium text-sm pr-4">{faq.q}</span>
                      <ChevronRight className="h-4 w-4 text-muted-foreground transition-transform group-open:rotate-90 flex-shrink-0" />
                    </summary>
                    <div className="px-4 pb-4">
                      <p className="text-sm text-muted-foreground">{faq.a}</p>
                    </div>
                  </details>
                ))}
              </div>
            </section>
          ))}

          <section className="pt-4 border-t border-border">
            <h2 className="text-lg font-semibold mb-3">Still Need Help?</h2>
            <p className="text-muted-foreground text-sm mb-4">
              Can't find what you're looking for? Contact our support team.
            </p>
            <Link href="/contact">
              <button 
                className="w-full flex items-center justify-center gap-2 p-4 bg-accent text-accent-foreground rounded-lg font-medium"
                data-testid="button-contact-support"
              >
                <MessageCircle className="h-5 w-5" />
                Contact Support
              </button>
            </Link>
          </section>
        </div>
      </div>
    </div>
  );
}
