import { Link } from "wouter";
import { ArrowLeft } from "lucide-react";
import { SiVisa, SiMastercard, SiAmericanexpress } from "react-icons/si";

export default function Terms() {
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
              <div className="flex items-center gap-4 mt-3 mb-3 flex-wrap">
                {/* Visa */}
                <SiVisa className="h-10 w-14 text-[#1A1F71]" />
                {/* Mastercard */}
                <svg className="h-10 w-16" viewBox="0 0 80 50" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="28" cy="22" r="14" fill="#EB001B"/>
                  <circle cx="52" cy="22" r="14" fill="#F79E1B"/>
                  <path d="M40 10a14 14 0 000 24 14 14 0 000-24z" fill="#FF5F00"/>
                  <text x="40" y="46" textAnchor="middle" fill="#1A1F71" fontSize="8" fontWeight="bold" fontFamily="Arial, sans-serif">mastercard</text>
                </svg>
                {/* UnionPay */}
                <svg className="h-10 w-16" viewBox="0 0 80 50" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect x="2" y="2" width="76" height="46" rx="4" fill="#fff" stroke="#ddd"/>
                  <rect x="8" y="8" width="14" height="26" rx="2" fill="#E21836"/>
                  <rect x="24" y="8" width="14" height="26" rx="2" fill="#00447C"/>
                  <rect x="40" y="8" width="14" height="26" rx="2" fill="#007B84"/>
                  <rect x="56" y="8" width="14" height="26" rx="2" fill="#01798A"/>
                  <text x="40" y="44" textAnchor="middle" fill="#1A1F71" fontSize="7" fontWeight="bold" fontFamily="Arial, sans-serif">UnionPay</text>
                </svg>
                {/* American Express */}
                <SiAmericanexpress className="h-10 w-12 text-[#006FCF]" />
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
