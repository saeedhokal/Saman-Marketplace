import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "wouter";
import QRCode from "qrcode";
import { Apple, Download as DownloadIcon, Upload, MessageCircle, Car, Wrench, Cog, Check, Smartphone, Globe, Moon, Sun, Search, SlidersHorizontal, RotateCcw, ShieldCheck, MapPin } from "lucide-react";
import { SiGoogleplay } from "react-icons/si";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ModelCombobox } from "@/components/ModelCombobox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AUTOMOTIVE_SUBCATEGORIES, CAR_MODELS, SPARE_PARTS_SUBCATEGORIES } from "@shared/schema";
import { ProductCard } from "@/components/ProductCard";
import { useLanguage } from "@/hooks/use-language";
import type { Product } from "@shared/schema";

import samanLogo from "@/assets/images/saman-logo-transparent.png";
import phone1 from "@/assets/phone-screen-2.png";
import phone2 from "@/assets/phone-screen-3.png";
import phone3 from "@/assets/phone-screen-1.png";

const APP_STORE_URL = "https://apps.apple.com/app/id6744526430";
const PLAY_STORE_URL =
  "https://play.google.com/store/apps/details?id=com.saman.marketplace";

interface DesktopLandingProps {
  recentProducts: Product[];
  isLoadingRecent: boolean;
}

export function DesktopLanding({ recentProducts, isLoadingRecent }: DesktopLandingProps) {
  const { isRTL, language, setLanguage } = useLanguage();
  const ar = language === "ar";
  const [qrDataUrl, setQrDataUrl] = useState<string>("");
  const [darkMode, setDarkMode] = useState(() =>
    typeof document !== "undefined" && document.documentElement.classList.contains("dark")
  );
  const [market, setMarket] = useState<"automotive" | "spare-parts">("automotive");
  const [brand, setBrand] = useState("All");
  const [model, setModel] = useState("All");
  const [query, setQuery] = useState("");
  const [priceMax, setPriceMax] = useState("");
  const [yearMin, setYearMin] = useState("");
  const [kmMax, setKmMax] = useState("");
  const [partCondition, setPartCondition] = useState("all");
  const [vehicleCondition, setVehicleCondition] = useState("all");
  const [moreFilters, setMoreFilters] = useState(false);
  const brands = market === "automotive" ? AUTOMOTIVE_SUBCATEGORIES : SPARE_PARTS_SUBCATEGORIES;
  const models = market === "automotive" && brand !== "All" ? (CAR_MODELS[brand] || []) : [];
  const searchUrl = useMemo(() => {
    const params = new URLSearchParams();
    params.set("tab", market);
    if (query) params.set("search", query);
    if (brand !== "All") params.set("subCategory", brand);
    if (model !== "All") params.set("model", model);
    if (priceMax) params.set("priceMax", priceMax);
    if (yearMin) params.set("yearMin", yearMin);
    if (kmMax) params.set("kmMax", kmMax);
    if ((market === "automotive" ? vehicleCondition : partCondition) !== "all") params.set("condition", market === "automotive" ? vehicleCondition : partCondition);
    return `/categories?${params.toString()}`;
  }, [market, query, brand, model, priceMax, yearMin, kmMax, partCondition, vehicleCondition]);
  const resetSearch = () => { setBrand("All"); setModel("All"); setQuery(""); setPriceMax(""); setYearMin(""); setKmMax(""); setPartCondition("all"); setVehicleCondition("all"); setMoreFilters(false); };

  const toggleDarkMode = useCallback(() => {
    const root = document.documentElement;
    const isDark = root.classList.contains("dark");
    if (isDark) {
      root.classList.remove("dark");
      localStorage.setItem("theme", "light");
    } else {
      root.classList.add("dark");
      localStorage.setItem("theme", "dark");
    }
    setDarkMode(!isDark);
  }, []);

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
            <img src={samanLogo} alt="Saman Marketplace" className="h-10 w-10 object-contain" />
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
            <button
              onClick={toggleDarkMode}
              className="p-2.5 rounded-full bg-gray-100 dark:bg-white/10 border border-gray-200 dark:border-white/20 hover:bg-gray-200 dark:hover:bg-white/20 transition-colors"
              data-testid="desktop-nav-theme-toggle"
              aria-label="Toggle theme"
            >
              {darkMode ? (
                <Sun className="h-5 w-5 text-yellow-500" />
              ) : (
                <Moon className="h-5 w-5 text-gray-600" />
              )}
            </button>
            <button
              onClick={() => setLanguage(language === "en" ? "ar" : "en")}
              className="relative p-2.5 rounded-full bg-gray-100 dark:bg-white/10 border border-gray-200 dark:border-white/20 hover:bg-gray-200 dark:hover:bg-white/20 transition-colors"
              data-testid="desktop-nav-language-toggle"
              aria-label="Toggle language"
            >
              <Globe className="h-5 w-5 text-gray-600 dark:text-white" />
              <span className="absolute -bottom-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-[#f97316] text-white text-[9px] font-bold px-0.5">
                {language === "en" ? "ع" : "EN"}
              </span>
            </button>
            <Link href="/downloads" data-testid="desktop-nav-download">
              <Button className="bg-[#f97316] hover:bg-orange-600 text-white rounded-full px-5">
                <DownloadIcon className="h-4 w-4 mr-1.5" />
                {ar ? "حمّل التطبيق" : "Download App"}
              </Button>
            </Link>
          </div>
        </nav>

        {/* ===== Marketplace search ===== */}
        <section className="relative z-40 -mt-1 mb-10 rounded-[1.75rem] border border-gray-200/80 bg-white p-3 shadow-[0_24px_70px_-35px_rgba(15,23,42,.55)] dark:border-white/10 dark:bg-slate-900">
          <div className="rounded-2xl bg-slate-50 p-5 dark:bg-white/[0.04]">
            <div className="mb-4 flex items-end justify-between gap-4">
              <div>
                <p className="mb-1 text-[11px] font-bold uppercase tracking-[.2em] text-orange-500">{ar ? "ابحث في سوق الإمارات" : "Search the UAE marketplace"}</p>
                <h2 className="text-2xl font-black tracking-tight text-gray-900 dark:text-white">{ar ? "ملايين الخيارات. بحث واحد واضح." : "Your next find starts here."}</h2>
              </div>
              <div className="hidden items-center gap-2 text-xs font-semibold text-gray-500 dark:text-white/50 md:flex"><ShieldCheck className="h-4 w-4 text-orange-500" /> {ar ? "إعلانات حقيقية من بائعين محليين" : "Real listings from local sellers"}</div>
            </div>
            <div className="mb-3 flex gap-2">
              <button aria-pressed={market === "automotive"} aria-label={ar ? "اختيار السيارات والمركبات" : "Choose Automotive"} data-testid="desktop-market-automotive" onClick={() => { setMarket("automotive"); setBrand("All"); setModel("All"); }} className={`flex items-center gap-2 rounded-xl border px-5 py-3 text-sm font-bold transition-colors ${market === "automotive" ? "border-orange-500 bg-orange-500 text-white" : "border-gray-200 bg-white text-gray-600 hover:border-orange-300 dark:border-white/10 dark:bg-white/5 dark:text-white/70"}`}><Car className="h-4 w-4" />{ar ? "سيارات ومركبات" : "Automotive"}</button>
              <button aria-pressed={market === "spare-parts"} aria-label={ar ? "اختيار قطع الغيار" : "Choose Spare Parts"} data-testid="desktop-market-spare-parts" onClick={() => { setMarket("spare-parts"); setBrand("All"); setModel("All"); }} className={`flex items-center gap-2 rounded-xl border px-5 py-3 text-sm font-bold transition-colors ${market === "spare-parts" ? "border-orange-500 bg-orange-500 text-white" : "border-gray-200 bg-white text-gray-600 hover:border-orange-300 dark:border-white/10 dark:bg-white/5 dark:text-white/70"}`}><Wrench className="h-4 w-4" />{ar ? "قطع الغيار" : "Spare Parts"}</button>
            </div>
            <div className={`grid gap-2 ${market === "automotive" ? (models.length > 0 ? "lg:grid-cols-[minmax(220px,1.35fr)_minmax(130px,1fr)_minmax(130px,1fr)_minmax(120px,1fr)_minmax(120px,1fr)_minmax(120px,1fr)_minmax(104px,auto)]" : "lg:grid-cols-[minmax(220px,1.5fr)_minmax(130px,1fr)_minmax(130px,1fr)_minmax(120px,1fr)_minmax(120px,1fr)_minmax(104px,auto)]") : "lg:grid-cols-[minmax(220px,1.5fr)_minmax(150px,1fr)_minmax(140px,1fr)_minmax(104px,auto)]"}`}>
              <div className="flex items-center rounded-xl border border-gray-200 bg-white px-3 dark:border-white/10 dark:bg-slate-950"><Search className="mr-2 h-4 w-4 text-orange-500" /><Input aria-label={ar ? "البحث عن سيارة أو قطعة" : "Search cars or parts"} value={query} onChange={(e) => setQuery(e.target.value)} placeholder={ar ? "ابحث عن سيارة، قطعة..." : "Search cars, parts & more"} className="h-11 border-0 bg-transparent p-0 shadow-none focus-visible:ring-0" /></div>
              <Select value={brand} onValueChange={(v) => { setBrand(v); setModel("All"); }}><SelectTrigger aria-label={ar ? "الفئة" : "Category"} className="h-11 min-w-0 border-gray-200 bg-white dark:border-white/10 dark:bg-slate-950"><SelectValue placeholder={ar ? "الفئة" : "Category"} /></SelectTrigger><SelectContent><SelectItem value="All">{ar ? "كل الفئات" : "All categories"}</SelectItem>{brands.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent></Select>
              {market === "automotive" && models.length > 0 && <ModelCombobox models={models} value={model} onValueChange={setModel} emptyValue="All" emptyLabel={ar ? "كل الموديلات" : "All models"} searchPlaceholder={ar ? "ابحث عن موديل..." : "Search models..."} ariaLabel={ar ? "الموديل" : "Model"} className="h-11 min-w-0" />}
              <Input aria-label={ar ? "الحد الأقصى للسعر بالدرهم" : "Maximum price in AED"} value={priceMax} onChange={(e) => setPriceMax(e.target.value)} type="number" placeholder={ar ? "السعر حتى (درهم)" : "Price up to (AED)"} className="h-11 min-w-0 bg-white dark:bg-slate-950" />
              {market === "automotive" && <Input aria-label={ar ? "السنة من" : "Year from"} value={yearMin} onChange={(e) => setYearMin(e.target.value)} type="number" placeholder={ar ? "السنة من" : "Year from"} className="h-11 min-w-0 bg-white dark:bg-slate-950" />}
              {market === "automotive" && <Input aria-label={ar ? "المسافة القصوى بالكيلومتر" : "Maximum mileage in kilometres"} value={kmMax} onChange={(e) => setKmMax(e.target.value)} type="number" placeholder={ar ? "المسافة حتى" : "Mileage up to"} className="h-11 min-w-0 bg-white dark:bg-slate-950" />}
              <Link aria-label={ar ? "بحث في الإعلانات" : "Search listings"} data-testid="desktop-search-submit" href={searchUrl} className="flex h-11 min-w-[104px] items-center justify-center gap-2 rounded-xl bg-orange-500 px-5 text-sm font-semibold text-white transition-colors hover:bg-orange-600"><Search className="h-4 w-4" />{ar ? "بحث" : "Search"}</Link>
            </div>
            <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-xs">
              <button aria-expanded={moreFilters} aria-label={ar ? "عرض الفلاتر الإضافية" : "Show additional filters"} onClick={() => setMoreFilters(!moreFilters)} className="flex items-center gap-2 font-semibold text-gray-600 hover:text-orange-600 dark:text-white/70"><SlidersHorizontal className="h-4 w-4" />{ar ? "فلاتر إضافية" : "More filters"}</button>
              <button aria-label={ar ? "إعادة ضبط البحث" : "Reset search"} onClick={resetSearch} className="flex items-center gap-1 text-gray-500 hover:text-orange-600 dark:text-white/50"><RotateCcw className="h-3.5 w-3.5" />{ar ? "إعادة ضبط" : "Reset"}</button>
            </div>
            {moreFilters && <div className="mt-3 max-w-xs border-t border-gray-200 pt-3 dark:border-white/10"><Select value={market === "automotive" ? vehicleCondition : partCondition} onValueChange={market === "automotive" ? setVehicleCondition : setPartCondition}><SelectTrigger aria-label={ar ? "الحالة" : "Condition"} className="bg-white dark:bg-slate-950"><SelectValue placeholder={ar ? "الحالة" : "Condition"} /></SelectTrigger><SelectContent><SelectItem value="all">{ar ? "كل الحالات" : "Any condition"}</SelectItem><SelectItem value="new">{ar ? "جديد" : "New"}</SelectItem><SelectItem value="used">{ar ? "مستعمل" : "Used"}</SelectItem></SelectContent></Select></div>}
          </div>
        </section>

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
                ? "حمّل التطبيق للتجربة الكاملة، أو انشر إعلانك مباشرة من الموقع — بدون عمولات وبدون وسطاء."
                : "Get the full experience in the app, or post your listing right here from the website — no commissions, no middlemen."}
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/sell" data-testid="hero-cta-sell">
                <Button size="lg" className="bg-[#f97316] hover:bg-orange-600 text-white rounded-full px-7 h-12 text-base font-semibold shadow-lg shadow-orange-500/30">
                  {ar ? "أضف إعلانك مجاناً" : "Post for Free"}
                </Button>
              </Link>
              <Link href="/downloads" data-testid="hero-cta-download">
                <Button size="lg" variant="outline" className="rounded-full px-7 h-12 text-base font-semibold border-2 border-gray-300 dark:border-white/30 dark:text-white">
                  <DownloadIcon className="h-5 w-5 mr-2" />
                  {ar ? "أو حمّل التطبيق" : "Or download the app"}
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
              title={ar ? "حمّل التطبيق أو سجّل دخولك" : "Download the app or log in"}
              desc={ar ? "حمّل من آب ستور أو جوجل بلاي، أو سجّل دخولك من الموقع وانشر إعلانك من جهازك مباشرة." : "Get it on the App Store or Google Play — or just log in here and post straight from your desktop."}
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
        <section className="mx-auto max-w-[1120px] py-16 border-t border-gray-200/60 dark:border-white/10">
          <div className="grid gap-6 lg:grid-cols-[190px_minmax(0,1fr)_190px]">
            <aside className="hidden space-y-4 lg:block">
              <div className="sticky top-6 rounded-2xl border border-orange-500/20 bg-orange-500/[0.07] p-4">
                <p className="text-[10px] font-bold uppercase tracking-[.15em] text-orange-600">{ar ? "على هاتفك" : "Saman on mobile"}</p>
                <p className="mt-2 text-sm font-bold leading-snug text-gray-900 dark:text-white">{ar ? "احفظ بحثك وتواصل أسرع." : "Save searches and message sellers faster."}</p>
                <div className="mt-4 grid gap-2"><a href={APP_STORE_URL} target="_blank" rel="noopener noreferrer" className="rounded-lg bg-black px-2 py-2 text-center text-[11px] font-semibold text-white">App Store</a><a href={PLAY_STORE_URL} target="_blank" rel="noopener noreferrer" className="rounded-lg bg-black px-2 py-2 text-center text-[11px] font-semibold text-white">Google Play</a></div>
              </div>
            </aside>
            <div className="min-w-0">
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
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="aspect-square rounded-2xl bg-gray-200/60 dark:bg-white/5 animate-pulse" />
              ))}
            </div>
          ) : sample.length > 0 ? (
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
              {sample.map((p) => (
                <ProductCard
                  key={p.id}
                  product={p}
                  sellerImageUrl={(p as any).sellerProfileImageUrl}
                  sellerFirstName={(p as any).sellerFirstName}
                  sellerLastName={(p as any).sellerLastName}
                  sellerDisplayName={(p as any).sellerDisplayName}
                  density="compact"
                />
              ))}
            </div>
          ) : (
            <p className="text-gray-500 dark:text-white/60 text-center py-12">
              {ar ? "لا توجد إعلانات حالياً." : "No listings yet — be the first to post."}
            </p>
          )}
            </div>
            <aside className="hidden space-y-4 lg:block">
              <div className="sticky top-6 rounded-2xl border border-gray-200/70 p-4 dark:border-white/10">
                <ShieldCheck className="h-5 w-5 text-orange-500" />
                <p className="mt-3 text-sm font-bold text-gray-900 dark:text-white">{ar ? "سوق واضح وموثوق" : "A clearer way to buy"}</p>
                <p className="mt-1 text-xs leading-relaxed text-gray-600 dark:text-white/60">{ar ? "تواصل مباشر مع بائعين في الإمارات." : "Direct contact with sellers across the UAE."}</p>
                <MapPin className="mt-4 h-4 w-4 text-gray-400" />
              </div>
            </aside>
          </div>
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

        {/* ===== SEO internal links ===== */}
        <section className="py-14 border-t border-gray-200/60 dark:border-white/10">
          <h2 className="text-2xl lg:text-3xl font-extrabold text-gray-900 dark:text-white mb-2 text-center">
            {ar ? "تصفّح حسب الفئة" : "Explore Saman Marketplace"}
          </h2>
          <p className="text-center text-gray-600 dark:text-white/60 mb-8 text-sm">
            {ar
              ? "صفحات مخصّصة لأكثر عمليات البحث شيوعاً في الإمارات"
              : "Dedicated pages for the most-searched needs across the UAE"}
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {(ar
              ? [
                  { href: "/ar/spare-parts-dubai", title: "قطع غيار في دبي", desc: "محركات، هياكل، إضاءة، جنوط" },
                  { href: "/ar/used-car-parts-uae", title: "قطع غيار مستعملة في الإمارات", desc: "إعلانات من كل الإمارات" },
                  { href: "/ar/car-parts-dubai", title: "قطع غيار السيارات دبي", desc: "OEM وبدائل لكل الماركات" },
                  { href: "/ar/sell-car-parts-uae", title: "بيع قطع غيار", desc: "مجاناً، بدون عمولات" },
                  { href: "/ar/used-cars-uae", title: "سيارات مستعملة في الإمارات", desc: "خليجي وغير خليجي" },
                  { href: "/ar/sell-car-dubai", title: "بِع سيارتك في دبي", desc: "تواصل مباشر مع المشتري" },
                ]
              : [
                  { href: "/spare-parts-dubai", title: "Spare parts in Dubai", desc: "Engines, body, lights, rims" },
                  { href: "/used-car-parts-uae", title: "Used car parts in UAE", desc: "Listings from all emirates" },
                  { href: "/car-parts-dubai", title: "Car parts in Dubai", desc: "OEM & aftermarket, every brand" },
                  { href: "/sell-car-parts-uae", title: "Sell car parts in UAE", desc: "Free, zero commissions" },
                  { href: "/used-cars-uae", title: "Used cars in UAE", desc: "GCC & non-GCC, real listings" },
                  { href: "/sell-car-dubai", title: "Sell your car in Dubai", desc: "Direct buyer contact" },
                ]
            ).map((l) => (
              <Link
                key={l.href}
                href={l.href}
                data-testid={`seo-home-link-${l.href}`}
              >
                <div className="group rounded-2xl p-4 bg-white dark:bg-white/5 border border-gray-200/60 dark:border-white/10 hover:border-orange-400/60 hover:shadow-sm transition-colors cursor-pointer flex items-center justify-between gap-3">
                  <div>
                    <div className="font-semibold text-gray-900 dark:text-white text-sm">{l.title}</div>
                    <div className="text-xs text-gray-500 dark:text-white/50 mt-0.5">{l.desc}</div>
                  </div>
                  <span className="text-orange-500 opacity-0 group-hover:opacity-100 transition-opacity text-xl">→</span>
                </div>
              </Link>
            ))}
          </div>

          {!ar && (
            <>
              <h3 className="mt-12 mb-4 text-lg font-bold text-gray-900 dark:text-white text-center">
                Cars for sale across the UAE
              </h3>
              <div className="flex flex-wrap gap-2 justify-center">
                {[
                  { href: "/cars-for-sale-dubai", text: "Cars for sale in Dubai" },
                  { href: "/cars-for-sale-sharjah", text: "Cars for sale in Sharjah" },
                  { href: "/cars-for-sale-abu-dhabi", text: "Cars for sale in Abu Dhabi" },
                  { href: "/cars-for-sale-uae", text: "Cars for sale in UAE" },
                  { href: "/sell-car-online-dubai", text: "Sell car online in Dubai" },
                  { href: "/sell-car-online-uae", text: "Sell car online in UAE" },
                ].map((l) => (
                  <Link
                    key={l.href}
                    href={l.href}
                    data-testid={`seo-home-link-${l.href}`}
                    className="px-4 py-2 rounded-full text-sm bg-gray-100 dark:bg-white/5 text-gray-700 dark:text-white/80 border border-gray-200/60 dark:border-white/10 hover:border-orange-400 hover:text-orange-600 dark:hover:text-orange-400 transition-colors"
                  >
                    {l.text}
                  </Link>
                ))}
              </div>

              <h3 className="mt-10 mb-4 text-lg font-bold text-gray-900 dark:text-white text-center">
                Looking for another UAE marketplace?
              </h3>
              <div className="flex flex-wrap gap-2 justify-center">
                {[
                  { href: "/dubizzle-alternative-uae", text: "Dubizzle alternative — UAE" },
                  { href: "/dubizzle-alternative-dubai", text: "Dubizzle alternative — Dubai" },
                  { href: "/dubicars-alternative-uae", text: "DubiCars alternative — UAE" },
                ].map((l) => (
                  <Link
                    key={l.href}
                    href={l.href}
                    data-testid={`seo-home-link-${l.href}`}
                    className="px-4 py-2 rounded-full text-sm bg-gray-100 dark:bg-white/5 text-gray-700 dark:text-white/80 border border-gray-200/60 dark:border-white/10 hover:border-orange-400 hover:text-orange-600 dark:hover:text-orange-400 transition-colors"
                  >
                    {l.text}
                  </Link>
                ))}
              </div>
            </>
          )}
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
        <img src={src} alt="Saman app screenshot" className="w-full h-full object-cover object-top" />
      </div>
    </div>
  );
}

function StepCard({ num, icon, title, desc }: { num: string; icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div className="relative rounded-3xl p-7 bg-white dark:bg-white/5 border border-gray-200/60 dark:border-white/10 hover:border-orange-400/60 transition-colors cursor-default select-none">
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
