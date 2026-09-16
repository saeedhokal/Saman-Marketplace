import { useEffect, useState } from "react";
import { Link } from "wouter";
import { Apple, Globe, UserRound } from "lucide-react";
import { SiGoogleplay } from "react-icons/si";
import { Capacitor } from "@capacitor/core";
import QRCode from "qrcode";
import { useLanguage } from "@/hooks/use-language";
import samanLogo from "@/assets/images/saman-logo-transparent.png";
import phone1 from "@/assets/phone-screen-2.png";

const APP_STORE_URL = "https://apps.apple.com/app/id6744526430";
const PLAY_STORE_URL = "https://play.google.com/store/apps/details?id=com.saman.marketplace";

/** The deliberately light desktop-only marketplace frame. Native keeps its own chrome. */
export function DesktopMarketplaceChrome() {
  const { language, setLanguage } = useLanguage();
  const ar = language === "ar";
  const [railOpen, setRailOpen] = useState(true);
  const [qrDataUrl, setQrDataUrl] = useState("");
  useEffect(() => {
    QRCode.toDataURL(`${window.location.origin}/downloads`, { width: 132, margin: 1, color: { dark: "#101820", light: "#ffffff" } })
      .then(setQrDataUrl).catch(() => setQrDataUrl(""));
  }, []);
  if (Capacitor.isNativePlatform()) return null;

  return (
    <>
      <header className="saman-desktop-header" dir={ar ? "rtl" : "ltr"}>
        <div className="saman-desktop-header__inner">
          <Link href="/" className="saman-desktop-logo" aria-label="Saman Marketplace home">
            <img src={samanLogo} alt="Saman" />
          </Link>
          <nav>
            <Link href="/categories?tab=automotive">{ar ? "السيارات" : "Automotive"}</Link>
            <Link href="/categories?tab=spare-parts">{ar ? "قطع الغيار" : "Spare Parts"}</Link>
            <Link href="/categories">{ar ? "تصفح الإعلانات" : "Browse listings"}</Link>
            <Link href="/sell">{ar ? "بيع" : "Sell"}</Link>
          </nav>
          <div className="saman-desktop-header__actions">
            <button onClick={() => setLanguage(ar ? "en" : "ar")}><Globe size={15} />{ar ? "EN" : "عربي"}</button>
            <Link href="/profile"><UserRound size={15} />{ar ? "حسابي" : "My account"}</Link>
            <Link href="/sell" className="saman-post-listing">{ar ? "أضف إعلاناً" : "+ Post Listing"}</Link>
          </div>
        </div>
      </header>
      {railOpen ? (
        <aside className="saman-app-rail" dir={ar ? "rtl" : "ltr"}>
          <button className="saman-app-rail__dismiss" onClick={() => setRailOpen(false)} aria-label={ar ? "إخفاء" : "Hide"}>×</button>
          <p className="saman-app-rail__title">{ar ? <>سامان<br />معك</> : <>Saman<br />On the go</>}</p>
           <p>{ar ? <>تصفح أسرع.<br />تواصل فوراً.</> : <>Browse faster.<br />Chat instantly.</>}</p>
          <img src={phone1} alt="" />
          {qrDataUrl && <img className="saman-app-rail__qr" src={qrDataUrl} alt={ar ? "رمز تحميل التطبيق" : "App download QR code"} />}
          <strong>{ar ? "حمّل التطبيق" : "Get the app"}</strong>
          <a href={APP_STORE_URL} target="_blank" rel="noopener noreferrer"><Apple size={12} />App Store</a>
          <a href={PLAY_STORE_URL} target="_blank" rel="noopener noreferrer"><SiGoogleplay size={12} />Google Play</a>
        </aside>
       ) : <button className="saman-app-rail__reopen" dir={ar ? "rtl" : "ltr"} onClick={() => setRailOpen(true)}>{ar ? "التطبيق" : "App"}</button>}
    </>
  );
}