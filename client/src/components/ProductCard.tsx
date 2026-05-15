import { useEffect, useRef, useState } from "react";
import { Link } from "wouter";
import { type Product } from "@shared/schema";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { motion } from "framer-motion";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Store, ImageOff } from "lucide-react";
import { format } from "date-fns";

interface ProductCardProps {
  product: Product;
  sellerImageUrl?: string | null;
  showDate?: boolean;
}

export function ProductCard({ product, sellerImageUrl, showDate }: ProductCardProps) {
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const imgRef = useRef<HTMLImageElement | null>(null);

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
          <div className="relative aspect-[4/3] md:aspect-square overflow-hidden rounded-xl bg-gray-100 dark:bg-slate-700/30">
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
                  src={product.imageUrl}
                  alt={product.title}
                  loading="lazy"
                  decoding="async"
                  className={`h-full w-full object-cover object-center transition-all duration-500 group-hover:scale-110 ${isSold ? 'blur-[2px] brightness-75' : ''} ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
                  style={{ objectPosition: '50% 60%' }}
                  onLoad={() => setImageLoaded(true)}
                  onError={() => setImageError(true)}
                />
              </>
            ) : (
              <div className="flex h-full w-full items-center justify-center text-muted-foreground bg-secondary">
                <ImageOff className="h-8 w-8" />
              </div>
            )}

            {isSold && (
              <div className="absolute inset-0 flex items-center justify-center z-20">
                <span className="text-red-600 font-black text-4xl tracking-widest uppercase -rotate-12" style={{ WebkitTextStroke: '1.5px white' }}>SOLD</span>
              </div>
            )}
            
            {sellerImageUrl && (
              <div className="absolute top-2 left-2 z-10">
                <Avatar className="h-8 w-8 border-2 border-white shadow-md">
                  <AvatarImage 
                    src={sellerImageUrl.replace('/svg?', '/png?')} 
                    alt="Seller"
                  />
                  <AvatarFallback className="bg-accent/20">
                    <Store className="h-3 w-3 text-accent" />
                  </AvatarFallback>
                </Avatar>
              </div>
            )}
            
            {/* Date temporarily hidden */}
          </div>

          <CardContent className="p-3 sm:p-4">
            <h3 className={`font-display text-sm sm:text-base font-bold leading-tight line-clamp-2 min-h-[2.5rem] sm:min-h-[2.75rem] transition-colors ${isSold ? 'text-muted-foreground' : 'text-foreground group-hover:text-accent'}`}>
              {product.title}
            </h3>
          </CardContent>

          <CardFooter className="p-3 sm:p-4 pt-0 mt-auto">
            <p className={`font-display text-base sm:text-lg font-bold ${isSold ? 'text-muted-foreground line-through' : 'text-orange-600 dark:text-orange-700'}`}>
              {formattedPrice}
            </p>
          </CardFooter>
        </Card>
      </Link>
    </motion.div>
  );
}
