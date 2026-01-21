import { Link } from "wouter";
import { ArrowLeft } from "lucide-react";
import { SiVisa, SiMastercard, SiAmericanexpress } from "react-icons/si";

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
            <h1 className="flex-1 text-center font-semibold text-lg pr-8">Terms and Conditions</h1>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        <h2 className="text-xl font-bold mb-6">TERMS & CONDITIONS</h2>
        
        <div className="space-y-4 text-sm">
          <p>
            <span className="font-bold">SamanParts Portal</span> maintains the Mobile Application - <span className="font-bold">Saman Marketplace</span> ("App").
          </p>

          <ol className="list-decimal list-outside ml-5 space-y-3 text-muted-foreground">
            <li>United Arab Emirates is our country of domicile and governing law is UAE law.</li>
            <li>Any dispute or claim arising out of or in connection with this App shall be governed and construed in accordance with UAE law.</li>
            <li>Visa or MasterCard debit and credit cards in AED are accepted for payment (if applicable in the future).</li>
            <li>
              <span>The displayed price and currency at checkout will match the transaction receipt and the amount charged will be reflected in the cardholder's currency</span>
              <div className="flex items-center gap-4 mt-3 mb-3">
                {/* Visa */}
                <SiVisa className="h-8 w-12 text-[#1A1F71]" />
                {/* Mastercard - two overlapping circles */}
                <svg className="h-8 w-12" viewBox="0 0 48 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="18" cy="16" r="12" fill="#EB001B"/>
                  <circle cx="30" cy="16" r="12" fill="#F79E1B"/>
                  <path d="M24 6.8a12 12 0 000 18.4 12 12 0 000-18.4z" fill="#FF5F00"/>
                </svg>
                {/* UnionPay */}
                <svg className="h-8 w-12" viewBox="0 0 60 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect width="60" height="40" rx="4" fill="#fff" stroke="#ddd"/>
                  <rect x="4" y="8" width="12" height="24" rx="2" fill="#E21836"/>
                  <rect x="18" y="8" width="12" height="24" rx="2" fill="#00447C"/>
                  <rect x="32" y="8" width="12" height="24" rx="2" fill="#007B84"/>
                  <rect x="46" y="8" width="10" height="24" rx="2" fill="#01798A"/>
                </svg>
                {/* American Express */}
                <SiAmericanexpress className="h-8 w-10 text-[#006FCF]" />
              </div>
            </li>
            <li>We do not trade with or provide services to OFAC and sanctioned countries.</li>
            <li>Users who are minors (under 18) are not allowed to register or transact on this platform.</li>
            <li>Cardholders must retain a copy of transaction records and relevant app policies and rules.</li>
            <li>Users are responsible for maintaining the confidentiality of their account credentials.</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
