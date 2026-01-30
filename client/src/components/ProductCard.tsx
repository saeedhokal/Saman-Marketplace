import { useState } from "react";
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
    >
      <Link href={`/product/${product.id}`}>
        <Card className="group h-full overflow-hidden glass-card hover:border-accent/40 hover:shadow-lg hover:shadow-accent/10 transition-all duration-300 cursor-pointer rounded-2xl">
          <div className="relative aspect-[4/3] md:aspect-square overflow-hidden bg-slate-700/30">
            {product.imageUrl && !imageError ? (
              <img
                src={product.imageUrl}
                alt={product.title}
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                onError={() => setImageError(true)}
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-muted-foreground bg-secondary">
                <ImageOff className="h-8 w-8" />
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
            
            {showDate && formattedDate && (
              <div className="absolute bottom-2 right-2 z-10 px-2 py-0.5 bg-black/60 rounded text-white text-xs">
                {formattedDate}
              </div>
            )}
          </div>

          <CardContent className="p-3 sm:p-4">
            <h3 className="font-display text-sm sm:text-base font-bold leading-tight text-foreground line-clamp-2 group-hover:text-accent transition-colors">
              {product.title}
            </h3>
          </CardContent>

          <CardFooter className="p-3 sm:p-4 pt-0 mt-auto">
            <p className="font-display text-base sm:text-lg font-bold text-orange-500">
              {formattedPrice}
            </p>
          </CardFooter>
        </Card>
      </Link>
    </motion.div>
  );
}
