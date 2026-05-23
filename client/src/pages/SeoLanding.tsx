import { useEffect, useState } from "react";
import { Link } from "wouter";
import QRCode from "qrcode";
import { ChevronRight, Download as DownloadIcon, Plus, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { SeoPage } from "@shared/seo-pages";
import samanLogo from "@/assets/images/saman-logo-transparent.png";

const APP_STORE_URL = "https://apps.apple.com/app/id6744526430";
const PLAY_STORE_URL =
  "https://play.google.com/store/apps/details?id=com.saman.marketplace";

export function SeoLandingPage({ page }: { page: SeoPage }) {
  const ar = page.lang === "ar";
  const [qrDataUrl, setQrDataUrl] = useState<string>("");

  // Replace any server-rendered seo-prerender div + set <title>/<meta> on
  // client navigation (e.g. user clicks a related link).
  useEffect(() => {
    const stale = document.getElementById("seo-prerender");
    if (stale) stale.remove();

    document.title = page.title;
    setMeta("description", page.metaDescription);
    setLinkRel("canonical", `https://thesamanapp.com${page.path}`);

    const url = `${window.location.origin}/downloads`;
    QRCode.toDataURL(url, {
      width: 220,
      margin: 1,
      color: { dark: "#0f172a", light: "#ffffff" },
    })
      .then(setQrDataUrl)
      .catch(() => setQrDataUrl(""));
  }, [page]);

  return (
    <div className="min-h-full bg-background text-foreground" dir={ar ? "rtl" : "ltr"} data-testid={`seo-landing-${page.slug}`}>
      <div className="mx-auto max-w-[1100px] px-5 md:px-10">
        {/* Top bar */}
        <header className="flex items-center justify-between py-6">
          <Link href="/" className="flex items-center gap-3">
            <img src={samanLogo} alt="Saman Marketplace" className="h-9 w-9 object-contain" />
            <span className="text-lg font-extrabold tracking-tight">Saman Marketplace</span>
          </Link>
          <div className="hidden md:flex items-center gap-3">
            <Link href={page.altLangPath}>
              <Button variant="ghost" size="sm" data-testid="seo-lang-switch">
                {ar ? "English" : "العربية"}
              </Button>
            </Link>
            <Link href="/downloads">
              <Button className="bg-[#f97316] hover:bg-orange-600 text-white rounded-full px-5 h-10" data-testid="seo-cta-download">
                <DownloadIcon className="h-4 w-4 mr-1.5" />
                {ar ? "حمّل التطبيق" : "Download App"}
              </Button>
            </Link>
          </div>
        </header>

        {/* Hero */}
        <section className="grid lg:grid-cols-[1.4fr_1fr] gap-10 items-center py-8">
          <div>
            <p className="text-orange-500 text-xs uppercase tracking-[0.25em] font-semibold mb-3">
              {ar ? "سوق السيارات في الإمارات" : "UAE Automotive Marketplace"}
            </p>
            <h1 className="text-3xl md:text-5xl font-extrabold leading-tight">{page.h1}</h1>
            <p className="mt-5 text-base md:text-lg text-muted-foreground leading-relaxed">{page.intro}</p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link href={page.primaryCta.href} data-testid="seo-primary-cta">
                <Button size="lg" className="bg-[#f97316] hover:bg-orange-600 text-white rounded-full px-6 h-12 text-base font-semibold shadow-lg shadow-orange-500/30">
                  <Plus className="h-5 w-5 mr-1.5" />
                  {page.primaryCta.text}
                </Button>
              </Link>
              <Link href={page.secondaryCta.href} data-testid="seo-secondary-cta">
                <Button size="lg" variant="outline" className="rounded-full px-6 h-12 text-base font-semibold border-2">
                  {page.secondaryCta.text}
                </Button>
              </Link>
            </div>
          </div>

          {/* QR / download box — desktop only */}
          <div className="hidden lg:flex flex-col items-center justify-center bg-white dark:bg-white/5 border border-border rounded-3xl p-7 shadow-sm">
            {qrDataUrl ? (
              <img src={qrDataUrl} alt="Download Saman app" className="w-44 h-44" />
            ) : (
              <div className="w-44 h-44 bg-muted rounded-xl flex items-center justify-center">
                <Smartphone className="h-10 w-10 text-muted-foreground" />
              </div>
            )}
            <p className="mt-4 text-sm font-semibold text-center">
              {ar ? "امسح للحصول على التطبيق" : "Scan to get the app"}
            </p>
            <div className="mt-3 flex gap-2">
              <a href={APP_STORE_URL} target="_blank" rel="noopener noreferrer" className="text-xs underline">App Store</a>
              <span className="text-muted-foreground">·</span>
              <a href={PLAY_STORE_URL} target="_blank" rel="noopener noreferrer" className="text-xs underline">Play Store</a>
            </div>
          </div>
        </section>

        {/* Content sections */}
        <section className="grid md:grid-cols-2 gap-6 py-10">
          {page.sections.map((s) => (
            <article
              key={s.heading}
              className="rounded-3xl p-6 bg-white dark:bg-white/5 border border-border"
              data-testid={`seo-section-${s.heading.replace(/\s+/g, "-").toLowerCase()}`}
            >
              <h2 className="text-xl font-bold mb-2">{s.heading}</h2>
              <p className="text-muted-foreground leading-relaxed">{s.body}</p>
            </article>
          ))}
        </section>

        {/* FAQ */}
        <section className="py-10">
          <h2 className="text-2xl font-extrabold mb-5">
            {ar ? "أسئلة شائعة" : "Frequently asked questions"}
          </h2>
          <div className="space-y-3">
            {page.faqs.map((f, i) => (
              <details
                key={i}
                className="group rounded-2xl bg-white dark:bg-white/5 border border-border p-5 cursor-pointer"
                data-testid={`seo-faq-${i}`}
              >
                <summary className="font-semibold text-base list-none flex items-center justify-between">
                  <span>{f.q}</span>
                  <ChevronRight className="h-4 w-4 text-muted-foreground transition-transform group-open:rotate-90" />
                </summary>
                <p className="mt-3 text-muted-foreground leading-relaxed">{f.a}</p>
              </details>
            ))}
          </div>
        </section>

        {/* Related */}
        <section className="py-10 border-t border-border">
          <h2 className="text-xl font-bold mb-4">{ar ? "روابط مرتبطة" : "Explore more"}</h2>
          <div className="flex flex-wrap gap-2">
            {page.related.map((r) => (
              <Link key={r.href} href={r.href}>
                <Button variant="outline" className="rounded-full" data-testid={`seo-related-${r.href}`}>
                  {r.text}
                </Button>
              </Link>
            ))}
          </div>
        </section>

        {/* Bottom CTA */}
        <section className="my-10 rounded-3xl bg-gradient-to-br from-[#f97316] to-orange-600 text-white p-8 md:p-12 text-center">
          <h2 className="text-2xl md:text-3xl font-extrabold mb-3">
            {ar ? "حمّل سامان وابدأ الآن" : "Get Saman and start now"}
          </h2>
          <p className="text-white/90 max-w-xl mx-auto">
            {ar
              ? "تطبيق سامان متاح على متجر آبل وغوغل بلاي. مجاني وسهل الاستخدام."
              : "Saman is available on the App Store and Google Play. Free and easy to use."}
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <a href={APP_STORE_URL} target="_blank" rel="noopener noreferrer">
              <Button size="lg" variant="secondary" className="rounded-full px-6 h-12 text-base bg-white text-orange-600 hover:bg-white/90">
                {ar ? "متجر آبل" : "App Store"}
              </Button>
            </a>
            <a href={PLAY_STORE_URL} target="_blank" rel="noopener noreferrer">
              <Button size="lg" variant="secondary" className="rounded-full px-6 h-12 text-base bg-white text-orange-600 hover:bg-white/90">
                {ar ? "غوغل بلاي" : "Google Play"}
              </Button>
            </a>
            <Link href={page.primaryCta.href}>
              <Button size="lg" className="rounded-full px-6 h-12 text-base bg-black hover:bg-black/80 text-white">
                {page.primaryCta.text}
              </Button>
            </Link>
          </div>
        </section>

        <footer className="py-10 text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} Saman Marketplace — {ar ? "صنع في الإمارات" : "Made in the UAE"}
        </footer>
      </div>
    </div>
  );
}

function setMeta(name: string, content: string) {
  let el = document.querySelector(`meta[name="${name}"]`) as HTMLMetaElement | null;
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute("name", name);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

function setLinkRel(rel: string, href: string) {
  let el = document.querySelector(`link[rel="${rel}"]`) as HTMLLinkElement | null;
  if (!el) {
    el = document.createElement("link");
    el.setAttribute("rel", rel);
    document.head.appendChild(el);
  }
  el.setAttribute("href", href);
}

export default SeoLandingPage;
