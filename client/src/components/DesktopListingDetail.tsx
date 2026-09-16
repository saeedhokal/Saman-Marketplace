import { Heart, Languages, Phone, Share2, Store, ChevronRight, Calendar, Gauge, Tag, Car, Globe } from "lucide-react";
import { SiWhatsapp } from "react-icons/si";
import { Link } from "wouter";
import type { Product, ProductSpec } from "@shared/schema";
import { PRODUCT_SPEC_LABELS_AR } from "@shared/schema";
import { listingPath } from "@shared/listing-slug";
import { ImageGallery } from "@/components/ImageGallery";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { objectImageUrl, bustObjectUrl, retryObjectImg } from "@/lib/bustObjectUrl";
import { getInitial } from "@/lib/utils";
import { useDesktopTheme } from "@/hooks/use-desktop-theme";
import dubaiNightSportsCar from "@/assets/images/dubai-night-sports-car-hero.png";

type SellerInfo = {
  id: string; displayName: string | null; firstName: string | null; lastName: string | null;
  profileImageUrl: string | null; createdAt: string; phone: string | null;
};

type Props = {
  product: Product; id: number; images: string[]; sellerProducts?: Product[]; sellerInfo?: SellerInfo;
  isRTL: boolean; user: unknown; isFavorite?: boolean; formattedPrice: string | null;
  showTranslation: boolean; translatedTitle: string | null; translatedDescription: string | null;
  isTranslating: boolean; translationLabel: string; callHref: string; whatsappHref: string;
  callDisabled: boolean; whatsappDisabled: boolean;
  onBack: () => void; onFavorite: () => void; onShare: () => void; onTranslate: () => void;
  onContact: (event: React.MouseEvent<HTMLAnchorElement>) => void; onSellerLocked: () => void;
};

export function DesktopListingDetail(props: Props) {
  const { product, id, images, sellerProducts, sellerInfo, isRTL, user, isFavorite, formattedPrice } = props;
  const { theme } = useDesktopTheme();
  const sellerName = sellerInfo?.displayName || [sellerInfo?.firstName, sellerInfo?.lastName].filter(Boolean).join(" ") || "Seller";
  const more = (sellerProducts || []).filter((item) => item.id !== id && item.status === "approved");
  const specs = [
    product.year && { icon: Calendar, label: isRTL ? "السنة" : "Year", value: String(product.year) },
    product.mileage != null && { icon: Gauge, label: isRTL ? "المسافة" : "Mileage", value: `${product.mileage.toLocaleString()} ${isRTL ? "كم" : "km"}` },
    product.condition && { icon: Tag, label: isRTL ? "الحالة" : "Condition", value: product.condition },
    product.subCategory && {
      icon: Car,
      label: isRTL ? (product.mainCategory === "Automotive" ? "الماركة" : "الفئة الفرعية") : (product.mainCategory === "Automotive" ? "Make" : "Subcategory"),
      value: product.subCategory,
    },
    product.model && { icon: Car, label: isRTL ? "الموديل" : "Model", value: product.model },
    product.spec && { icon: Globe, label: isRTL ? "المواصفات" : "Spec", value: isRTL ? (PRODUCT_SPEC_LABELS_AR[product.spec as ProductSpec] || product.spec) : product.spec },
  ].filter(Boolean) as { icon: typeof Calendar; label: string; value: string }[];

  return <main className="desktop-listing-detail" dir={isRTL ? "rtl" : "ltr"} style={theme === "nighttime" ? { backgroundImage: `linear-gradient(90deg, rgba(5,10,14,.94), rgba(5,10,14,.55)), url(${dubaiNightSportsCar})`, backgroundPosition: "right center", backgroundSize: "cover" } : undefined}>
    <div className="desktop-listing-detail__crumb">
      <button onClick={props.onBack}>‹ {isRTL ? "العودة إلى التصفح" : "Back to browse"}</button>
    </div>
    <div className="desktop-listing-detail__grid">
      <div className="desktop-listing-left">
        <section className="desktop-listing-gallery">
          {images.length ? <ImageGallery images={images} shareUrl={`https://thesamanapp.com${listingPath(product.title, id)}`} /> :
            <div className="desktop-listing-empty-image">{isRTL ? "لا توجد صور" : "No images available"}</div>}
        </section>
        {more.length > 0 && <section className="desktop-seller-listings">
          <div><h2>{isRTL ? "المزيد من هذا البائع" : "More from this seller"}</h2><Link href={`/seller/${product.sellerId}`}>{isRTL ? "عرض الكل" : "View all"} <ChevronRight size={15} /></Link></div>
          <div className="desktop-seller-listings__grid">{more.slice(0, 4).map((item) => <Link key={item.id} href={listingPath(item.title, item.id)} className="desktop-seller-card">
            <div>{item.imageUrl ? <img src={objectImageUrl(item.imageUrl, 360, 75)} alt={item.title} loading="lazy" decoding="async" onError={retryObjectImg} /> : <Store size={22} />}</div>
            <b>{item.title}</b><span>{item.price ? new Intl.NumberFormat("en-AE", { style: "currency", currency: "AED", maximumFractionDigits: 0 }).format(item.price) : (isRTL ? "السعر عند الطلب" : "Price on request")}</span>
          </Link>)}</div>
        </section>}
      </div>
      <section className="desktop-listing-info">
        <div className="desktop-listing-info__topline">
          <span>{product.status === "sold" ? (isRTL ? "تم البيع" : "Sold") : (isRTL ? "إعلان متاح" : "Available listing")}</span>
          <div>
            <button onClick={props.onShare} aria-label="Share listing"><Share2 size={17} /></button>
            <button onClick={props.onFavorite} aria-label="Save listing" className={isFavorite ? "is-saved" : ""}><Heart size={18} fill={isFavorite ? "currentColor" : "none"} /></button>
          </div>
        </div>
        <h1>{props.showTranslation && props.translatedTitle ? props.translatedTitle : product.title}</h1>
        <div className={`desktop-listing-price ${product.status === "sold" ? "is-sold" : ""}`}>{formattedPrice || (isRTL ? "السعر عند الطلب" : "Price on request")}</div>
        {specs.length > 0 && <div className="desktop-listing-specs">{specs.map((spec) => {
          const Icon = spec.icon;
          return <div key={spec.label}><Icon size={15} /><span><small>{spec.label}</small>{spec.value}</span></div>;
        })}</div>}
        <div className="desktop-listing-description">
          <div><h2>{isRTL ? "الوصف" : "Description"}</h2><Button size="sm" variant="ghost" onClick={props.onTranslate} disabled={props.isTranslating}><Languages size={15} />{props.isTranslating ? (isRTL ? "جارٍ..." : "Translating...") : props.translationLabel}</Button></div>
          <p>{props.showTranslation && props.translatedDescription ? props.translatedDescription : product.description || (isRTL ? "لم يضف البائع وصفاً." : "The seller has not added a description.")}</p>
        </div>
        <div className="desktop-listing-contact">
          <a href={props.callHref} onClick={(event) => { if (props.callDisabled) event.preventDefault(); else props.onContact(event); }} aria-disabled={props.callDisabled}><Phone size={17} />{isRTL ? "اتصل بالبائع" : "Call seller"}</a>
          <a href={props.whatsappHref} target={user && !props.whatsappDisabled ? "_blank" : undefined} rel="noopener noreferrer" onClick={(event) => { if (props.whatsappDisabled) event.preventDefault(); else props.onContact(event); }} aria-disabled={props.whatsappDisabled}><SiWhatsapp size={18} />WhatsApp</a>
        </div>
        <div className="desktop-listing-seller">
          {user ? <Link href={`/seller/${product.sellerId}`} className="desktop-listing-seller__link">
            <Avatar className="desktop-listing-seller-avatar"><AvatarImage src={sellerInfo?.profileImageUrl ? bustObjectUrl(sellerInfo.profileImageUrl) : undefined} onError={retryObjectImg} /><AvatarFallback>{getInitial(sellerName) || <Store size={17} />}</AvatarFallback></Avatar>
            <span><small>{isRTL ? "البائع" : "Seller"}</small><b>{sellerName}</b></span><ChevronRight size={18} />
          </Link> : <button className="desktop-listing-seller__link" onClick={props.onSellerLocked}><Avatar><AvatarFallback><Store size={17} /></AvatarFallback></Avatar><span><small>{isRTL ? "البائع" : "Seller"}</small><b>{isRTL ? "سجّل لعرض البائع" : "Log in to view seller"}</b></span><ChevronRight size={18} /></button>}
        </div>
      </section>
    </div>
  </main>;
}