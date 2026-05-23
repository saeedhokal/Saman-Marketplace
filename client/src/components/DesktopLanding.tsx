import { useEffect, useState } from "react";
import { Link } from "wouter";
import QRCode from "qrcode";
import { Apple, Download as DownloadIcon, Upload, MessageCircle, Car, Wrench, Cog, Check, Smartphone } from "lucide-react";
import { SiGoogleplay } from "react-icons/si";
import { Button } from "@/components/ui/button";
import { ProductCard } from "@/components/ProductCard";
import { useLanguage } from "@/hooks/use-language";
import type { Product } from "@shared/schema";

import samanLogo from "@/assets/images/saman-logo.jpg";
import phone1 from "@assets/IMG_1429_1771073659044.png";
import phone2 from "@assets/IMG_1430_1771073659044.png";
import phone3 from "@assets/IMG_1433_1771073842661.png";

const APP_STORE_URL = "https://apps.apple.com/app/id6744526430";
const PLAY_STORE_URL =
  "https://play.google.com/store/apps/details?id=com.saman.marketplace";

interface DesktopLandingProps {
  recentProducts: Product[];
  isLoadingRecent: boolean;
}

export function DesktopLanding({ recentProducts, isLoadingRecent }: DesktopLandingProps) {
  const { isRTL, language } = useLanguage();
  const ar = language === "ar";
  const [qrDataUrl, setQrDataUrl] = useState<string>("");

  useEffect(() => {
    const url = typeof window !== "undefined"
      ? `${window.location.origin}/downloads`
      : "https://thesamanapp.com/downloads";
    QRCode.toDataURL(url, {
      width: 260,
      margin: 1,
      color: { dark: "#0f172a", light: "#ffffff" },
    })
      .then(setQrDataUrl)
      .catch(() => setQrDataUrl(""));
  }, []);

  const sample = recentProducts.slice(0, 6);

  return (
    <div className="relative z-10" dir={isRTL ? "rtl" : "ltr"} data-testid="desktop-landing">
      <div className="mx-auto max-w-[1320px] px-8 lg:px-12">
        {/* ===== Top nav (logo + actions) ===== */}
        <nav className="flex items-center justify-between py-6">
          <Link href="/" className="flex items-center gap-3">
            <img src={samanLogo} alt="Saman Marketplace" className="h-10 w-10 rounded-xl object-cover" />
            <span className="text-xl font-extrabold text-gray-900 dark:text-white tracking-tight">
              Saman Marketplace
            </span>
          </Link>
          <div className="flex items-center gap-2">
            <Link href="/categories">
              <Button variant="ghost" className="text-gray-700 dark:text-white/80" data-testid="nav-browse">
                {ar ? "تصفح" : "Browse"}
              </Button>
            </Link>
            <Link href="/sell">
              <Button variant="ghost" className="text-gray-700 dark:text-white/80" data-testid="nav-sell">
                {ar ? "بيع" : "Sell"}
              </Button>
            </Link>
            <a href={APP_STORE_URL} target="_blank" rel="noopener noreferrer">
              <Button className="bg-[#f97316] hover:bg-orange-600 text-white rounded-full px-5">
                <DownloadIcon className="h-4 w-4 mr-1.5" />
                {ar ? "حمّل التطبيق" : "Download App"}
              </Button>
            </a>
          </div>
        </nav>

        {/* ===== Hero ===== */}
        <section className="grid lg:grid-cols-2 gap-12 items-center pt-6 pb-20">
          <div>
            <p className="text-orange-500 dark:text-orange-400 text-xs uppercase tracking-[0.25em] font-semibold mb-4">
              {ar ? "سوق السيارات في الإمارات" : "UAE Automotive Marketplace"}
            </p>
            <h1 className="text-5xl xl:text-6xl font-extrabold leading-[1.05] text-gray-900 dark:text-white">
              {ar
                ? "بِع سيارتك أو قطع غيارك في الإمارات — مجاناً على سامان."
                : "Sell your car or spare parts in the UAE — for free on Saman."}
            </h1>
            <p className="mt-3 text-2xl font-semibold text-gray-700 dark:text-white/80" dir={ar ? "ltr" : "rtl"}>
              {ar
                ? "Sell your car or spare parts in the UAE — for free on Saman."
                : "بِع سيارتك أو قطع غيارك في الإمارات — مجاناً على سامان."}
            </p>
            <p className="mt-6 text-lg text-gray-600 dark:text-white/70 max-w-xl">
              {ar
                ? "تواصل مباشر بين البائعين والمشترين. إعلانات مجانية، بدون عمولات، تجربة سهلة على الهاتف."
                : "Connect directly with buyers and sellers across the UAE. Free listings, no commissions, a clean mobile-first experience."}
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <a href={APP_STORE_URL} target="_blank" rel="noopener noreferrer" data-testid="hero-cta-download">
                <Button size="lg" className="bg-[#f97316] hover:bg-orange-600 text-white rounded-full px-7 h-12 text-base font-semibold shadow-lg shadow-orange-500/30">
                  <DownloadIcon className="h-5 w-5 mr-2" />
                  {ar ? "حمّل التطبيق" : "Download App"}
                </Button>
              </a>
              <Link href="/sell" data-testid="hero-cta-sell">
                <Button size="lg" variant="outline" className="rounded-full px-7 h-12 text-base font-semibold border-2 border-gray-300 dark:border-white/30 dark:text-white">
                  {ar ? "أضف إعلانك مجاناً" : "Post for Free"}
                </Button>
              </Link>
            </div>

            <div className="mt-8 flex items-center gap-6 text-sm text-gray-500 dark:text-white/60">
              <span className="flex items-center gap-2"><Check className="h-4 w-4 text-orange-500" /> {ar ? "مجاني تماماً" : "100% free listings"}</span>
              <span className="flex items-center gap-2"><Check className="h-4 w-4 text-orange-500" /> {ar ? "سوق إماراتي" : "UAE-focused"}</span>
              <span className="flex items-center gap-2"><Check className="h-4 w-4 text-orange-500" /> {ar ? "بدون وسطاء" : "Direct buyer & seller"}</span>
            </div>
          </div>

          {/* Phone mockup */}
          <div className="relative h-[520px] hidden lg:block">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="absolute right-24 top-4 rotate-[8deg] z-10">
                <PhoneFrame src={phone1} />
              </div>
              <div className="absolute left-16 top-16 -rotate-[6deg] z-20">
                <PhoneFrame src={phone2} />
              </div>
              <div className="absolute left-1/2 -translate-x-1/2 top-10 z-30">
                <PhoneFrame src={phone3} highlight />
              </div>
            </div>
            <div className="absolute -inset-10 -z-10 rounded-[40px] bg-gradient-to-br from-orange-500/20 via-orange-500/5 to-transparent blur-2xl" />
          </div>
        </section>

        {/* ===== How it works ===== */}
        <section className="py-16 border-t border-gray-200/60 dark:border-white/10">
          <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white mb-2">
            {ar ? "كيف يعمل سامان؟" : "How Saman works"}
          </h2>
          <p className="text-gray-500 dark:text-white/60 mb-10">
            {ar ? "ثلاث خطوات بسيطة لتبدأ البيع أو الشراء." : "Three simple steps to start buying or selling."}
          </p>
          <div className="grid md:grid-cols-3 gap-6">
            <StepCard
              num="01"
              icon={<DownloadIcon className="h-6 w-6" />}
              title={ar ? "حمّل التطبيق" : "Download the app"}
              desc={ar ? "متاح على آب ستور وجوجل بلاي." : "Available on the App Store and Google Play."}
            />
            <StepCard
              num="02"
              icon={<Upload className="h-6 w-6" />}
              title={ar ? "أنشئ إعلانك" : "Post a listing"}
              desc={ar ? "أضف صور وسعر ووصف خلال دقيقة." : "Photos, price and description in under a minute."}
            />
            <StepCard
              num="03"
              icon={<MessageCircle className="h-6 w-6" />}
              title={ar ? "تواصل مع المشتري" : "Get buyers directly"}
              desc={ar ? "بدون وسطاء أو عمولات." : "Talk to buyers directly — no middlemen, no fees."}
            />
          </div>
        </section>

        {/* ===== Categories ===== */}
        <section className="py-16 border-t border-gray-200/60 dark:border-white/10">
          <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white mb-2">
            {ar ? "تصفح حسب الفئة" : "Browse by category"}
          </h2>
          <p className="text-gray-500 dark:text-white/60 mb-10">
            {ar ? "اختر ما تبحث عنه." : "Pick what you're looking for."}
          </p>
          <div className="grid md:grid-cols-3 gap-6">
            <CategoryCard
              href="/categories?tab=automotive"
              icon={<Car className="h-7 w-7" />}
              title={ar ? "سيارات" : "Cars"}
              desc={ar ? "سيارات جديدة ومستعملة" : "New & used cars"}
              gradient="from-slate-800 to-slate-900"
              testid="desktop-card-cars"
            />
            <CategoryCard
              href="/categories?tab=spare-parts"
              icon={<Wrench className="h-7 w-7" />}
              title={ar ? "قطع غيار" : "Spare Parts"}
              desc={ar ? "كل ما تحتاجه لسيارتك" : "Everything for your vehicle"}
              gradient="from-orange-500 to-orange-700"
              testid="desktop-card-spare-parts"
              accent
            />
            <CategoryCard
              href="/categories?tab=automotive"
              icon={<Cog className="h-7 w-7" />}
              title={ar ? "إكسسوارات سيارات" : "Automotive Items"}
              desc={ar ? "إكسسوارات وأدوات" : "Accessories & tools"}
              gradient="from-blue-800 to-blue-950"
              testid="desktop-card-automotive-items"
            />
          </div>
        </section>

        {/* ===== Sample listings ===== */}
        <section className="py-16 border-t border-gray-200/60 dark:border-white/10">
          <div className="flex items-end justify-between mb-8">
            <div>
              <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white">
                {ar ? "أحدث الإعلانات" : "Fresh on Saman"}
              </h2>
              <p className="text-gray-500 dark:text-white/60 mt-1">
                {ar ? "إعلانات حقيقية من بائعين في الإمارات." : "Real listings from sellers across the UAE."}
              </p>
            </div>
            <Link href="/categories" className="text-orange-500 dark:text-orange-400 font-semibold" data-testid="desktop-view-all">
              {ar ? "عرض الكل ←" : "View all →"}
            </Link>
          </div>
          {isLoadingRecent ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="aspect-square rounded-2xl bg-gray-200/60 dark:bg-white/5 animate-pulse" />
              ))}
            </div>
          ) : sample.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {sample.map((p) => (
                <ProductCard
                  key={p.id}
                  product={p}
                  sellerImageUrl={(p as any).sellerProfileImageUrl}
                  density="compact"
                />
              ))}
            </div>
          ) : (
            <p className="text-gray-500 dark:text-white/60 text-center py-12">
              {ar ? "لا توجد إعلانات حالياً." : "No listings yet — be the first to post."}
            </p>
          )}
        </section>

        {/* ===== QR + download ===== */}
        <section className="py-16 border-t border-gray-200/60 dark:border-white/10">
          <div className="rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-10 lg:p-14 grid md:grid-cols-[auto_1fr] gap-10 items-center">
            <div className="bg-white p-5 rounded-2xl shadow-2xl hidden md:block" data-testid="desktop-qr">
              {qrDataUrl ? (
                <img src={qrDataUrl} alt="Scan to download Saman" className="w-[220px] h-[220px]" />
              ) : (
                <div className="w-[220px] h-[220px] flex items-center justify-center text-gray-400">
                  <Smartphone className="h-12 w-12" />
                </div>
              )}
            </div>
            <div>
              <h2 className="text-3xl lg:text-4xl font-extrabold text-white mb-3">
                {ar ? "امسح الكود لتحميل التطبيق" : "Scan to download"}
              </h2>
              <p className="text-white/70 text-lg mb-6">
                {ar ? "متاح على آيفون وأندرويد." : "Available on iPhone and Android."}
              </p>
              <div className="flex flex-wrap gap-3">
                <a href={APP_STORE_URL} target="_blank" rel="noopener noreferrer" data-testid="qr-link-app-store">
                  <Button size="lg" className="bg-black hover:bg-black/90 text-white rounded-2xl px-6 h-14">
                    <Apple className="h-6 w-6 mr-3" />
                    <div className="flex flex-col leading-tight text-left">
                      <span className="text-[10px] text-white/70">Download on the</span>
                      <span className="text-base font-semibold">App Store</span>
                    </div>
                  </Button>
                </a>
                <a href={PLAY_STORE_URL} target="_blank" rel="noopener noreferrer" data-testid="qr-link-play-store">
                  <Button size="lg" className="bg-black hover:bg-black/90 text-white rounded-2xl px-6 h-14">
                    <SiGoogleplay className="h-6 w-6 mr-3" />
                    <div className="flex flex-col leading-tight text-left">
                      <span className="text-[10px] text-white/70">Get it on</span>
                      <span className="text-base font-semibold">Google Play</span>
                    </div>
                  </Button>
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* ===== Trust strip ===== */}
        <section className="py-12 border-t border-gray-200/60 dark:border-white/10">
          <div className="flex flex-wrap gap-x-10 gap-y-4 justify-center text-sm font-medium text-gray-600 dark:text-white/70">
            <TrustBullet text={ar ? "إعلانات مجانية" : "Free listings"} />
            <TrustBullet text={ar ? "سيارات وقطع غيار" : "Cars and spare parts"} />
            <TrustBullet text={ar ? "سوق إماراتي" : "UAE-focused marketplace"} />
            <TrustBullet text={ar ? "تواصل مباشر" : "Direct buyer & seller"} />
            <TrustBullet text={ar ? "بدون تعقيدات" : "No complicated setup"} />
          </div>
        </section>

        {/* ===== Footer ===== */}
        <footer className="py-10 border-t border-gray-200/60 dark:border-white/10 flex flex-wrap items-center justify-between gap-4 text-sm text-gray-500 dark:text-white/50">
          <div>© {new Date().getFullYear()} Saman Marketplace — {ar ? "صنع في الإمارات" : "Made in the UAE"}</div>
          <div className="flex gap-5">
            <Link href="/about" className="hover:text-orange-500">{ar ? "حول" : "About"}</Link>
            <Link href="/terms" className="hover:text-orange-500">{ar ? "الشروط" : "Terms"}</Link>
            <Link href="/privacy" className="hover:text-orange-500">{ar ? "الخصوصية" : "Privacy"}</Link>
            <Link href="/contact" className="hover:text-orange-500">{ar ? "تواصل" : "Contact"}</Link>
          </div>
        </footer>
      </div>
    </div>
  );
}

function PhoneFrame({ src, highlight }: { src: string; highlight?: boolean }) {
  return (
    <div
      className={
        "w-[210px] h-[430px] rounded-[36px] bg-slate-900 p-2 shadow-2xl " +
        (highlight ? "ring-4 ring-orange-500/40" : "")
      }
    >
      <div className="w-full h-full rounded-[28px] overflow-hidden bg-black relative">
        <img src={src} alt="Saman app screenshot" className="w-full h-full object-cover" />
        <div className="absolute top-1.5 left-1/2 -translate-x-1/2 w-20 h-4 rounded-full bg-black" />
      </div>
    </div>
  );
}

function StepCard({ num, icon, title, desc }: { num: string; icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div className="relative rounded-3xl p-7 bg-white dark:bg-white/5 border border-gray-200/60 dark:border-white/10 hover:border-orange-400/60 transition-colors">
      <span className="absolute top-5 right-5 text-5xl font-black text-gray-100 dark:text-white/5 select-none">{num}</span>
      <div className="w-12 h-12 rounded-2xl bg-orange-500/10 text-orange-500 flex items-center justify-center mb-4">
        {icon}
      </div>
      <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">{title}</h3>
      <p className="text-sm text-gray-600 dark:text-white/60 leading-relaxed">{desc}</p>
    </div>
  );
}

function CategoryCard({
  href, icon, title, desc, gradient, testid, accent,
}: {
  href: string;
  icon: React.ReactNode;
  title: string;
  desc: string;
  gradient: string;
  testid: string;
  accent?: boolean;
}) {
  return (
    <Link href={href}>
      <div
        className={`relative h-44 rounded-3xl overflow-hidden cursor-pointer p-7 flex flex-col justify-between bg-gradient-to-br ${gradient} ${accent ? "shadow-xl shadow-orange-500/20 ring-1 ring-orange-400/30" : "ring-1 ring-white/5"} group transition-transform hover:-translate-y-1`}
        data-testid={testid}
      >
        <div className="w-14 h-14 rounded-2xl bg-white/15 backdrop-blur flex items-center justify-center text-white">
          {icon}
        </div>
        <div>
          <h3 className="text-xl font-bold text-white">{title}</h3>
          <p className="text-sm text-white/70 mt-0.5">{desc}</p>
        </div>
      </div>
    </Link>
  );
}

function TrustBullet({ text }: { text: string }) {
  return (
    <span className="flex items-center gap-2">
      <Check className="h-4 w-4 text-orange-500" />
      {text}
    </span>
  );
}
