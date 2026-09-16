import { useEffect, useMemo, useState } from "react";
import { Link } from "wouter";
import QRCode from "qrcode";
import {
  Apple, Car, ChevronRight, Cog, Globe, Menu, Search,
  SlidersHorizontal, UserRound, Wrench, X,
} from "lucide-react";
import { SiBmw, SiFord, SiGoogleplay, SiHonda, SiMercedes, SiNissan, SiToyota } from "react-icons/si";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ModelCombobox } from "@/components/ModelCombobox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AUTOMOTIVE_SUBCATEGORIES, CAR_MODELS, SPARE_PARTS_SUBCATEGORIES } from "@shared/schema";
import { ProductCard } from "@/components/ProductCard";
import { useLanguage } from "@/hooks/use-language";
import { useAuth } from "@/hooks/use-auth";
import { DesktopThemeToggle } from "@/components/DesktopThemeToggle";
import { useDesktopTheme } from "@/hooks/use-desktop-theme";
import type { Product } from "@shared/schema";
import samanLogo from "@/assets/images/saman-logo-transparent.png";
import dubaiSkyline from "@/assets/images/dubai-night-skyline.png";
import dubaiNightSportsCar from "@/assets/images/nighttime-home-detailed.webp";
import phone1 from "@/assets/phone-screen-2.png";
import phone2 from "@/assets/phone-screen-3.png";

const APP_STORE_URL = "https://apps.apple.com/app/id6744526430";
const PLAY_STORE_URL = "https://play.google.com/store/apps/details?id=com.saman.marketplace";

interface DesktopLandingProps {
  recentProducts: Product[];
  isLoadingRecent: boolean;
}

export function DesktopLanding({ recentProducts, isLoadingRecent }: DesktopLandingProps) {
  const { isRTL, language, setLanguage } = useLanguage();
  const { user } = useAuth();
  const { theme } = useDesktopTheme();
  const accountHref = user ? "/profile" : "/auth";
  const accountLabel = user ? (isRTL ? "حسابي" : "My account") : (isRTL ? "تسجيل الدخول" : "Sign In");
  const ar = language === "ar";
  const [qrDataUrl, setQrDataUrl] = useState("");
  const [market, setMarket] = useState<"automotive" | "spare-parts">("automotive");
  const [brand, setBrand] = useState("All");
  const [model, setModel] = useState("All");
  const [query, setQuery] = useState("");
  const [priceMax, setPriceMax] = useState("");
  const [yearMin, setYearMin] = useState("");
  const [kmMax, setKmMax] = useState("");
  const [condition, setCondition] = useState("all");
  const [moreFilters, setMoreFilters] = useState(false);
  const [mobileMenu, setMobileMenu] = useState(false);
  const brands = market === "automotive" ? AUTOMOTIVE_SUBCATEGORIES : SPARE_PARTS_SUBCATEGORIES;
  const models = market === "automotive" && brand !== "All" ? (CAR_MODELS[brand] || []) : [];
  const searchUrl = useMemo(() => {
    const params = new URLSearchParams({ tab: market });
    if (query) params.set("search", query);
    if (brand !== "All") params.set("subCategory", brand);
    if (model !== "All") params.set("model", model);
    if (priceMax) params.set("priceMax", priceMax);
    if (yearMin) params.set("yearMin", yearMin);
    if (kmMax) params.set("kmMax", kmMax);
    if (condition !== "all") params.set("condition", condition);
    return `/categories?${params.toString()}`;
  }, [market, query, brand, model, priceMax, yearMin, kmMax, condition]);

  useEffect(() => {
    QRCode.toDataURL(`${window.location.origin}/downloads`, { width: 190, margin: 1, color: { dark: "#101820", light: "#fff" } })
      .then(setQrDataUrl).catch(() => setQrDataUrl(""));
  }, []);

  const resetSearch = () => {
    setBrand("All"); setModel("All"); setQuery(""); setPriceMax(""); setYearMin(""); setKmMax(""); setCondition("all"); setMoreFilters(false);
  };
  const popular = [
    { value: "Toyota", label: "Toyota", Icon: SiToyota },
    { value: "Nissan", label: "Nissan", Icon: SiNissan },
    { value: "BMW", label: "BMW", Icon: SiBmw },
    { value: "Mercedes", label: "Mercedes", Icon: SiMercedes },
    { value: "Honda", label: "Honda", Icon: SiHonda },
    { value: "Ford", label: "Ford", Icon: SiFord },
  ].filter((make) => AUTOMOTIVE_SUBCATEGORIES.includes(make.value as typeof AUTOMOTIVE_SUBCATEGORIES[number]));
  const sample = recentProducts.slice(0, 6);
  const carImage = recentProducts.find((p) => p.mainCategory === "Automotive")?.imageUrl;
  const partImage = recentProducts.find((p) => p.mainCategory !== "Automotive")?.imageUrl;

  return (
    <div className="desktop-saman min-h-[100dvh] bg-[#f4f6f7] text-[#101820]" dir={isRTL ? "rtl" : "ltr"} data-testid="desktop-landing">
      <header className="sticky top-0 z-50 border-b border-[#dfe3e5] bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-[68px] max-w-[1440px] items-center gap-7 px-5 lg:px-8">
          <Link href="/" className="relative h-[56px] w-[128px] shrink-0 overflow-hidden" aria-label="Saman Marketplace home">
            <img src={samanLogo} alt="" className="absolute left-[-6px] top-[-72px] h-[210px] w-[140px] max-w-none object-contain" />
          </Link>
          <nav className="hidden items-center gap-6 text-[13px] font-semibold lg:flex">
            <Link href="/categories?tab=automotive" className="hover:text-orange-600">{ar ? "السيارات" : "Automotive"} <span className="text-[10px]">⌄</span></Link>
            <Link href="/categories?tab=spare-parts" className="hover:text-orange-600">{ar ? "قطع الغيار" : "Spare Parts"} <span className="text-[10px]">⌄</span></Link>
            <Link href="/categories" className="hover:text-orange-600">{ar ? "المتاجر" : "Shops"}</Link>
            <Link href="/sell" className="hover:text-orange-600">{ar ? "بيع" : "Sell"}</Link>
          </nav>
          <div className="hidden items-center gap-4 text-[12px] font-semibold lg:flex" style={{ marginInlineStart: "auto" }}>
            <DesktopThemeToggle />
            <span className="flex items-center gap-1">● {ar ? "الإمارات" : "UAE"} <span className="text-[10px]">⌄</span></span>
            <button onClick={() => setLanguage(ar ? "en" : "ar")} className="flex items-center gap-1" data-testid="desktop-nav-language-toggle"><Globe className="h-4 w-4" /> {ar ? "EN" : "عربي"}</button>
            <Link href={accountHref} className="flex items-center gap-1" data-testid="desktop-nav-sign-in"><UserRound className="h-4 w-4" /> {accountLabel}</Link>
            <Link href="/sell" className="rounded-lg bg-[#f45b27] px-5 py-3 text-white shadow-sm hover:bg-[#df4818]" data-testid="desktop-nav-post">{ar ? "أضف إعلاناً" : "+ Post Listing"}</Link>
          </div>
          <button className="lg:hidden" onClick={() => setMobileMenu(!mobileMenu)} aria-label={ar ? "القائمة" : "Menu"}><Menu /></button>
        </div>
        {mobileMenu && <div className="border-t bg-white px-5 py-4 lg:hidden"><div className="flex flex-col gap-4 text-sm font-semibold"><Link href="/categories?tab=automotive">{ar ? "السيارات" : "Automotive"}</Link><Link href="/categories?tab=spare-parts">{ar ? "قطع الغيار" : "Spare Parts"}</Link><Link href="/categories">{ar ? "المتاجر" : "Shops"}</Link><Link href="/sell">{ar ? "بيع" : "Sell"}</Link><Link href={accountHref}>{accountLabel}</Link></div></div>}
      </header>

      <main className="mx-auto grid max-w-[1440px] grid-cols-1 gap-4 px-3 py-3 sm:px-5 lg:grid-cols-[130px_minmax(0,1fr)] lg:gap-4 lg:px-6">
          <aside className="desktop-home-rail hidden rounded-lg border border-[#e2e5e7] bg-white p-3 lg:block">
          <div className="sticky top-[84px] text-center">
            <p className="text-[20px] font-black leading-[.95] tracking-tight">{ar ? <>سامان<br />معك</> : <>Saman<br />On The Go</>}</p>
            <p className="mt-3 text-[10px] leading-snug text-[#5f6b72]">
              {ar ? <>تصفح أسرع.<br />تواصل فوراً.<br />لا تفوّت أي صفقة.</> : <>Browse faster.<br />Chat instantly.<br />Never miss a deal.</>}
            </p>
            <img src={phone1} alt="Saman mobile app" className="mx-auto mt-4 h-[168px] w-[90px] rounded-[13px] object-cover object-top shadow-md" />
            {qrDataUrl && <img src={qrDataUrl} alt="Scan to download Saman" className="mx-auto mt-4 h-[82px] w-[82px]" data-testid="desktop-qr" />}
            <p className="mt-1 text-[9px] font-bold">{ar ? "حمّل التطبيق" : "Download the app"}</p>
            <a href={APP_STORE_URL} target="_blank" rel="noopener noreferrer" className="mt-3 flex items-center justify-center gap-1 rounded-md bg-[#111] px-1 py-1.5 text-[8px] text-white"><Apple className="h-3 w-3" /> App Store</a>
            <a href={PLAY_STORE_URL} target="_blank" rel="noopener noreferrer" className="mt-1 flex items-center justify-center gap-1 rounded-md bg-[#111] px-1 py-1.5 text-[8px] text-white"><SiGoogleplay className="h-3 w-3" /> Google Play</a>
            <p className="mt-5 text-[8px] leading-snug text-[#778087]">{ar ? <>سوق سامان.<br />إمكانيات أكثر.</> : <>Saman Marketplace.<br />More possibilities.</>}</p>
          </div>
        </aside>

        <div className="min-w-0">
          <section className="desktop-home-hero relative h-[245px] overflow-visible rounded-lg bg-[#f9c08c] shadow-sm sm:h-[265px]" style={{ backgroundImage: theme === "nighttime" ? `linear-gradient(${isRTL ? "270deg" : "90deg"}, rgba(5,10,14,.38) 0%, rgba(7,13,17,.15) 43%, transparent 76%), url(${dubaiNightSportsCar})` : `linear-gradient(${isRTL ? "270deg" : "90deg"}, rgba(255,218,178,.95) 0%, rgba(255,197,141,.55) 48%, rgba(15,33,47,.08)), url(${dubaiSkyline})`, backgroundSize: "cover", backgroundPosition: "center" }}>
            <div className="relative z-10 max-w-[490px] px-6 pt-7 sm:px-10 sm:pt-10">
              <p className="text-[11px] font-bold uppercase tracking-[.13em] text-[#e95220]">{ar ? "سوق الإمارات الموثوق" : "The UAE's trusted automotive marketplace"}</p>
              <h1 className="mt-2 text-[31px] font-black leading-[.98] tracking-[-.04em] text-[#101820] sm:text-[42px]">{ar ? "سيارات. قطع. أشخاص. كلهم على سامان." : <>Cars. Parts. People.<br />All on <span className="desktop-home-brand-word">Saman.</span></>}</h1>
              <p className="mt-3 text-[13px] font-medium text-[#27323a]">{ar ? "اكتشف صفقات حقيقية من بائعين محليين." : "Find your next car, part, or buyer — all in one place."}</p>
            </div>
            <div className={`absolute top-7 hidden rotate-[-8deg] text-[13px] font-black uppercase leading-[.9] tracking-widest text-[#27323a]/75 sm:block ${isRTL ? "left-7 text-left" : "right-7 text-right"}`}>{ar ? <>اصنع<br /><span className="text-[19px]">قصتك القادمة</span></> : <>Drive your<br /><span className="text-[19px]">next story</span></>}</div>
            <SearchPanel {...{ ar, market, setMarket, brand, setBrand, model, setModel, query, setQuery, priceMax, setPriceMax, yearMin, setYearMin, kmMax, setKmMax, condition, setCondition, brands, models, searchUrl, moreFilters, setMoreFilters, resetSearch }} />
          </section>

          <section className={moreFilters ? "mt-[166px] sm:mt-[148px]" : "mt-[112px] sm:mt-[94px]"}>
            <div className="mb-2 flex items-center justify-between"><h2 className="text-[15px] font-extrabold">{ar ? "تصفح حسب الفئة" : "Browse by category"}</h2><Link href="/categories" className="text-[11px] font-semibold text-[#68737a]">{ar ? "كل الفئات ←" : "Popular categories in the UAE →"}</Link></div>
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-7">
              {popular.map((make) => <Link key={make.value} href={`/categories?tab=automotive&subCategory=${encodeURIComponent(make.value)}`} className="desktop-brand-tile flex h-[59px] flex-col items-center justify-center gap-1 rounded-md border border-[#e0e4e6] bg-white text-[10px] font-bold transition hover:border-orange-400 hover:text-orange-600"><span className="desktop-brand-mark flex h-7 w-9 items-center justify-center text-[20px]"><make.Icon aria-hidden="true" /></span>{make.label}</Link>)}
              <Link href="/categories" className="flex h-[59px] flex-col items-center justify-center gap-1 rounded-md border border-[#e0e4e6] bg-white text-[10px] font-bold hover:border-orange-400"><span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#f1f3f3]"><SlidersHorizontal className="h-4 w-4" /></span>{ar ? "كل الفئات" : "All Categories"}</Link>
            </div>
          </section>

          <section className="mt-3 grid gap-3 sm:grid-cols-2">
            <PromoCard ar={ar} href="/categories?tab=automotive" image={carImage || dubaiSkyline} icon={<Car className="h-5 w-5" />} title={ar ? "تبحث عن سيارة؟" : "Looking for a car?"} body={ar ? "سيارات جديدة ومستعملة من بائعين موثوقين." : "New & used cars from trusted sellers across the UAE."} action={ar ? "تصفح السيارات" : "Browse Cars"} />
            <PromoCard ar={ar} href="/categories?tab=spare-parts" image={partImage || phone2} icon={<Cog className="h-5 w-5" />} title={ar ? "تحتاج قطع غيار؟" : "Need spare parts?"} body={ar ? "قطع أصلية وبدائل من متاجر موثوقة." : "Find genuine and aftermarket parts from trusted shops."} action={ar ? "تصفح القطع" : "Browse Parts"} />
          </section>

          <section className="mt-5">
            <div className="mb-2 flex items-end justify-between"><div><h2 className="text-[17px] font-extrabold">{ar ? "أحدث الإعلانات" : "Latest Listings"}</h2><p className="text-[11px] text-[#7b858b]">{ar ? "إعلانات حقيقية من الإمارات" : "Millions of listings. Real people. Real deals."}</p></div><Link href="/categories" className="text-[11px] font-bold text-[#e95220]" data-testid="desktop-view-all">{ar ? "عرض الكل ←" : "View All Listings →"}</Link></div>
            {isLoadingRecent ? <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-6">{Array.from({ length: 6 }).map((_, i) => <div key={i} className="aspect-[4/3] animate-pulse rounded-lg bg-[#e2e6e7]" />)}</div> : sample.length > 0 ? <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-6">{sample.map((p) => <ProductCard key={p.id} product={p} sellerImageUrl={(p as any).sellerProfileImageUrl} sellerFirstName={(p as any).sellerFirstName} sellerLastName={(p as any).sellerLastName} sellerDisplayName={(p as any).sellerDisplayName} density="compact" />)}</div> : <div className="rounded-lg bg-white py-10 text-center text-sm text-[#778087]">{ar ? "لا توجد إعلانات حالياً." : "No listings yet — be the first to post."}</div>}
          </section>

          <section className="mt-8 border-t border-[#dfe3e5] py-5 text-center">
            <div className="flex flex-wrap justify-center gap-x-5 gap-y-2 text-[11px] text-[#6d777d]">
              {(ar ? ["قطع غيار في دبي", "سيارات مستعملة في الإمارات", "بيع قطع غيار في الإمارات", "سيارات للبيع في دبي", "سيارات للبيع في أبوظبي"] : ["Spare parts in Dubai", "Used cars in UAE", "Sell car parts in UAE", "Cars for sale in Dubai", "Cars for sale in Abu Dhabi"]).map((label, index) => <Link key={label} href={index < 3 ? "/spare-parts-dubai" : "/used-cars-uae"} className="hover:text-orange-600">{label}</Link>)}
            </div>
          </section>
          <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-[#dfe3e5] py-4 text-[11px] text-[#7b858b]"><span>© {new Date().getFullYear()} Saman Marketplace — {ar ? "صنع في الإمارات" : "Made in the UAE"}</span><div className="flex gap-4"><Link href="/about">{ar ? "حول" : "About"}</Link><Link href="/terms">{ar ? "الشروط" : "Terms"}</Link><Link href="/privacy">{ar ? "الخصوصية" : "Privacy"}</Link><Link href="/contact">{ar ? "تواصل" : "Contact"}</Link></div></footer>
        </div>
      </main>
    </div>
  );
}

type SearchPanelProps = {
  ar: boolean; market: "automotive" | "spare-parts"; setMarket: (v: "automotive" | "spare-parts") => void; brand: string; setBrand: (v: string) => void; model: string; setModel: (v: string) => void; query: string; setQuery: (v: string) => void; priceMax: string; setPriceMax: (v: string) => void; yearMin: string; setYearMin: (v: string) => void; kmMax: string; setKmMax: (v: string) => void; condition: string; setCondition: (v: string) => void; brands: readonly string[]; models: string[]; searchUrl: string; moreFilters: boolean; setMoreFilters: (v: boolean) => void; resetSearch: () => void;
};
function SearchPanel(p: SearchPanelProps) {
  const labels = p.ar
    ? {
        search: "ابحث عن سيارة أو قطعة...",
        searchAria: "البحث عن سيارة أو قطعة",
        category: "الفئة",
        allMakes: "كل الماركات",
        allCategories: "كل الفئات",
        allModels: "كل الموديلات",
        modelSearch: "ابحث عن موديل...",
        modelAria: "الموديل",
        price: "السعر حتى (درهم)",
        priceAria: "الحد الأقصى للسعر بالدرهم",
        year: "السنة من",
        mileage: "المسافة حتى",
        mileageAria: "الحد الأقصى للمسافة بالكيلومتر",
        condition: "الحالة",
        anyCondition: "كل الحالات",
        newCondition: "جديد",
        usedCondition: "مستعمل",
        advanced: "فلاتر إضافية",
        reset: "إعادة ضبط",
      }
    : {
        search: "Search cars, parts & more",
        searchAria: "Search cars or parts",
        category: "Category",
        allMakes: "All Makes",
        allCategories: "All Categories",
        allModels: "All Models",
        modelSearch: "Search models...",
        modelAria: "Model",
        price: "Price up to (AED)",
        priceAria: "Maximum price in AED",
        year: "Year from",
        mileage: "Mileage up to",
        mileageAria: "Maximum mileage in kilometres",
        condition: "Condition",
        anyCondition: "Any condition",
        newCondition: "New",
        usedCondition: "Used",
        advanced: "Advanced Filters",
        reset: "Reset",
      };
  return <div data-expanded={p.moreFilters} className="desktop-home-search absolute inset-x-4 -bottom-[87px] z-20 rounded-lg border border-[#d9dddf] bg-white p-2.5 shadow-[0_12px_30px_rgba(32,48,58,.18)] sm:inset-x-10">
    <div className="flex gap-1 border-b border-[#edf0f1] pb-2">{[["automotive", <Car className="h-3.5 w-3.5" />, p.ar ? "سيارات" : "Automotive"], ["spare-parts", <Wrench className="h-3.5 w-3.5" />, p.ar ? "قطع الغيار" : "Spare Parts"]].map(([value, icon, label]) => <button key={String(value)} aria-pressed={p.market === value} onClick={() => { p.setMarket(value as any); p.setBrand("All"); p.setModel("All"); }} className={`flex items-center gap-1.5 rounded-md px-4 py-2 text-[11px] font-bold ${p.market === value ? "bg-[#f45b27] text-white" : "text-[#5c686f] hover:bg-[#f6f7f7]"}`} data-testid={`desktop-market-${value}`}>{icon}{label}</button>)}<span className="hidden self-center text-[10px] text-[#879197] sm:block" style={{ marginInlineStart: "auto" }}>{p.ar ? "إعلانات حقيقية من بائعين محليين" : "Millions of listings. Real people. Real deals."}</span></div>
    <div className="mt-2 desktop-home-search__main">
      <div className="flex items-center rounded-md border border-[#dfe3e5] px-2"><Search className="h-3.5 w-3.5 text-[#f45b27]" /><Input value={p.query} onChange={(e) => p.setQuery(e.target.value)} placeholder={labels.search} aria-label={labels.searchAria} className="h-8 border-0 bg-transparent text-[11px] shadow-none focus-visible:ring-0" /></div>
      <div className="mt-1.5 flex gap-1.5 desktop-home-search__secondary">
        <div className="min-w-0 flex-1"><Select value={p.brand} onValueChange={(v) => { p.setBrand(v); p.setModel("All"); }}><SelectTrigger className="h-8 border-[#dfe3e5] bg-white text-[11px] text-[#101820]" aria-label={labels.category}><SelectValue placeholder={labels.category} /></SelectTrigger><SelectContent><SelectItem value="All">{p.market === "automotive" ? labels.allMakes : labels.allCategories}</SelectItem>{p.brands.map((b) => <SelectItem key={b} value={b}>{b}</SelectItem>)}</SelectContent></Select></div>
        {p.market === "automotive" && p.models.length > 0 && <div className="min-w-0 flex-1"><ModelCombobox models={p.models} value={p.model} onValueChange={p.setModel} emptyValue="All" emptyLabel={labels.allModels} searchPlaceholder={labels.modelSearch} ariaLabel={labels.modelAria} className="h-8 text-[11px]" /></div>}
        <Link href={p.searchUrl} data-testid="desktop-search-submit" className="flex h-8 shrink-0 items-center justify-center gap-1 rounded-md bg-[#f45b27] px-6 text-[11px] font-bold text-white hover:bg-[#df4818]"><Search className="h-3.5 w-3.5" />{p.ar ? "بحث" : "Search"}</Link>
      </div>
    </div>
    <div className="mt-2 flex items-center justify-between"><button onClick={() => p.setMoreFilters(!p.moreFilters)} className="flex items-center gap-1 text-[10px] font-semibold text-[#657178]"><SlidersHorizontal className="h-3 w-3" />{labels.advanced}</button><button onClick={p.resetSearch} className="text-[10px] text-[#879197]"><X className={p.ar ? "ml-1 inline h-3 w-3" : "mr-1 inline h-3 w-3"} />{labels.reset}</button></div>
    {p.moreFilters && <div className="mt-2 grid grid-cols-2 gap-1.5 border-t pt-2 sm:grid-cols-4"><Input value={p.priceMax} onChange={(e) => p.setPriceMax(e.target.value)} type="number" placeholder={labels.price} aria-label={labels.priceAria} className="h-8 text-[11px]" />{p.market === "automotive" && <><Input value={p.yearMin} onChange={(e) => p.setYearMin(e.target.value)} type="number" placeholder={labels.year} aria-label={labels.year} className="h-8 text-[11px]" /><Input value={p.kmMax} onChange={(e) => p.setKmMax(e.target.value)} type="number" placeholder={labels.mileage} aria-label={labels.mileageAria} className="h-8 text-[11px]" /></>}<Select value={p.condition} onValueChange={p.setCondition}><SelectTrigger className="h-8 text-[11px]" aria-label={labels.condition}><SelectValue placeholder={labels.condition} /></SelectTrigger><SelectContent><SelectItem value="all">{labels.anyCondition}</SelectItem><SelectItem value="new">{labels.newCondition}</SelectItem><SelectItem value="used">{labels.usedCondition}</SelectItem></SelectContent></Select></div>}
  </div>;
}

function PromoCard({ ar, href, image, icon, title, body, action }: { ar: boolean; href: string; image: string; icon: React.ReactNode; title: string; body: string; action: string }) {
  return <Link href={href} className="desktop-home-promo group relative flex h-[78px] overflow-hidden rounded-lg border border-[#e9d9cb] bg-[#fff8f2]"><div className="w-[31%] shrink-0 bg-cover bg-center" style={{ backgroundImage: `url(${image})` }} /><div className="min-w-0 flex-1 px-3 py-2"><div className="flex items-center gap-1.5 text-[13px] font-extrabold">{icon}{title}</div><p className="mt-1 max-w-[250px] truncate text-[10px] text-[#68737a]">{body}</p></div><span className={`my-auto rounded-md bg-[#f45b27] px-3 py-2 text-[10px] font-bold text-white group-hover:bg-[#df4818] ${ar ? "ml-3" : "mr-3"}`}>{action} <ChevronRight className={`inline h-3 w-3 ${ar ? "rotate-180" : ""}`} /></span></Link>;
}