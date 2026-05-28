import { useEffect, useRef, useState } from "react";
import { Link } from "wouter";
import { type Product } from "@shared/schema";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { motion } from "framer-motion";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Store, ImageOff, Car } from "lucide-react";
import { format } from "date-fns";
import { bustObjectUrl, retryObjectImg } from "@/lib/bustObjectUrl";
import type { Density } from "@/hooks/use-listing-view";
import { cn, getInitial } from "@/lib/utils";
import { useLanguage } from "@/hooks/use-language";

interface ProductCardProps {
  product: Product;
  sellerImageUrl?: string | null;
  sellerFirstName?: string | null;
  sellerLastName?: string | null;
  sellerDisplayName?: string | null;
  showDate?: boolean;
  density?: Density;
}

const DENSITY_STYLES: Record<Density, {
  image: string;
  title: string;
  price: string;
  padding: string;
  titleMin: string;
  avatar: string;
  soldText: string;
}> = {
  large: {
    image: "aspect-[16/10] bg-gray-50 dark:bg-slate-800/40",
    title: "text-base sm:text-lg line-clamp-2",
    price: "text-lg sm:text-xl",
    padding: "p-4 sm:p-5",
    titleMin: "min-h-[2.75rem] sm:min-h-[3rem]",
    avatar: "h-9 w-9",
    soldText: "text-5xl",
  },
  default: {
    image: "aspect-[4/3] bg-gray-50 dark:bg-slate-800/40",
    title: "text-[15px] truncate",
    price: "text-[15px] font-bold",
    padding: "p-2.5",
    titleMin: "min-h-[1.25rem]",
    avatar: "h-7 w-7",
    soldText: "text-4xl",
  },
  compact: {
    image: "aspect-[4/3] bg-gray-50 dark:bg-slate-800/40",
    title: "text-sm leading-tight truncate",
    price: "text-base font-bold",
    padding: "p-2.5",
    titleMin: "min-h-[1.25rem]",
    avatar: "h-6 w-6",
    soldText: "text-2xl",
  },
  single: {
    image: "aspect-[16/10] bg-gray-50 dark:bg-slate-800/40",
    title: "text-base line-clamp-2",
    price: "text-lg",
    padding: "p-4",
    titleMin: "min-h-[2.5rem]",
    avatar: "h-9 w-9",
    soldText: "text-5xl",
  },
};

export function ProductCard({
  product,
  sellerImageUrl,
  sellerFirstName,
  sellerLastName,
  sellerDisplayName,
  showDate,
  density = "default",
}: ProductCardProps) {
  const { language, isRTL } = useLanguage();
  const sellerInitial = getInitial(sellerDisplayName, sellerFirstName, sellerLastName);
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  // Always show the full photo (contain) so cars are never cropped.
  // Users prefer letterbox bars over cut-off subjects.
  const useCoverFit = true;
  const imgRef = useRef<HTMLImageElement | null>(null);
  const styles = DENSITY_STYLES[density] ?? DENSITY_STYLES.default;

  // If the image is already cached, the browser may finish loading it before
  // React attaches the onLoad handler. Check `complete` after mount so we
  // don't get stuck showing the skeleton forever.
  useEffect(() => {
    if (imgRef.current && imgRef.current.complete && imgRef.current.naturalWidth > 0) {
      setImageLoaded(true);
    }
  }, [product.imageUrl]);
  const isSold = product.status === "sold";
  const formattedPrice = new Intl.NumberFormat("en-AE", {
    style: "currency",
    currency: "AED",
    maximumFractionDigits: 0,
  }).format(product.price || 0);

  const formattedDate = product.createdAt 
    ? format(new Date(product.createdAt), 'MMM d')
    : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="h-full"
    >
      <Link href={`/product/${product.id}`} className="block h-full">
        <Card className={`group h-full flex flex-col overflow-hidden glass-card hover:border-accent/40 hover:shadow-lg hover:shadow-accent/10 transition-all duration-300 cursor-pointer rounded-2xl ${isSold ? 'opacity-80' : ''}`}>
          <div className={cn("relative overflow-hidden rounded-xl bg-gray-100 dark:bg-slate-700/30", styles.image)}>
            {product.imageUrl && !imageError ? (
              <>
                {!imageLoaded && (
                  <div
                    className="absolute inset-0 animate-pulse bg-gradient-to-br from-slate-200 via-slate-100 to-slate-200 dark:from-slate-700/40 dark:via-slate-800/40 dark:to-slate-700/40"
                    aria-hidden="true"
                    data-testid={`skeleton-image-${product.id}`}
                  />
                )}
                <img
                  ref={imgRef}
                  src={bustObjectUrl(product.imageUrl)}
                  alt={product.title}
                  loading="lazy"
                  decoding="async"
                  className={`h-full w-full transition-all duration-500 group-hover:scale-110 ${isSold ? 'blur-[2px] brightness-75' : ''} ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
                  style={
                    useCoverFit
                      ? { objectFit: 'cover', objectPosition: 'center' }
                      : { objectFit: 'contain', objectPosition: 'center' }
                  }
                  onLoad={() => {
                    setImageLoaded(true);
                  }}
                  onError={(e) => {
                    if (e.currentTarget.dataset.retried === "1") {
                      setImageError(true);
                    } else {
                      retryObjectImg(e);
                    }
                  }}
                />
              </>
            ) : (
              <div className="flex h-full w-full items-center justify-center text-muted-foreground bg-secondary">
                <ImageOff className="h-8 w-8" />
              </div>
            )}

            {isSold && (
              <div className="absolute inset-0 flex items-center justify-center z-20">
                <span className={cn("text-red-600 font-black tracking-widest uppercase -rotate-12", styles.soldText)} style={{ WebkitTextStroke: '1.5px white' }}>SOLD</span>
              </div>
            )}
            
            <div className="absolute top-2 left-2 z-10">
              <Avatar className={cn("border-2 border-white shadow-md", styles.avatar)}>
                {sellerImageUrl ? (
                  <AvatarImage
                    src={sellerImageUrl.replace('/svg?', '/png?')}
                    alt={sellerDisplayName || sellerFirstName || "Seller"}
                  />
                ) : null}
                <AvatarFallback className="bg-[#f97316] text-white text-xs font-semibold">
                  {sellerInitial || <Store className="h-3 w-3" />}
                </AvatarFallback>
              </Avatar>
            </div>
            
            {/* Date temporarily hidden */}
          </div>

          <CardContent className={styles.padding}>
            <h3 className={cn(
              "font-display font-bold leading-tight transition-colors",
              styles.title,
              styles.titleMin,
              isSold ? 'text-muted-foreground' : 'text-foreground group-hover:text-accent'
            )}>
              {product.title}
            </h3>
            {product.mainCategory === "Automotive" && (product.year || product.mileage) && (
              <div className={`flex items-center gap-2 mt-2 flex-wrap ${isRTL ? 'flex-row-reverse justify-end' : ''}`} data-testid={`pills-${product.id}`}>
                {product.year ? (
                  <span
                    dir="ltr"
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-medium text-foreground/90 bg-white/5 dark:bg-white/[0.04] border border-border dark:border-white/10"
                    data-testid={`pill-year-${product.id}`}
                  >
                    <Car className="h-3 w-3 text-orange-500" strokeWidth={2.25} />
                    {product.year}
                  </span>
                ) : null}
                {product.mileage ? (
                  <span
                    dir={isRTL ? 'rtl' : 'ltr'}
                    className="inline-flex items-center px-2.5 py-1 rounded-lg text-[11px] font-medium text-foreground/90 bg-white/5 dark:bg-white/[0.04] border border-border dark:border-white/10"
                    data-testid={`pill-km-${product.id}`}
                  >
                    {new Intl.NumberFormat(language === 'ar' ? 'ar-AE' : 'en-US').format(product.mileage)} {language === 'ar' ? 'كم' : 'km'}
                  </span>
                ) : null}
              </div>
            )}
          </CardContent>

          <CardFooter className={cn(styles.padding, "pt-0 mt-auto")}>
            <p className={cn(
              "font-display font-bold",
              styles.price,
              isSold ? 'text-muted-foreground line-through' : 'text-orange-600 dark:text-orange-700'
            )}>
              {formattedPrice}
            </p>
          </CardFooter>
        </Card>
      </Link>
    </motion.div>
  );
}
