import { Link } from "wouter";
import { type Product } from "@shared/schema";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { motion } from "framer-motion";

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const formattedPrice = new Intl.NumberFormat("en-AE", {
    style: "currency",
    currency: "AED",
    maximumFractionDigits: 0,
  }).format((product.price || 0) / 100);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Link href={`/product/${product.id}`}>
        <Card className="group h-full overflow-hidden border-border/50 bg-card hover:border-accent/30 hover:shadow-lg hover:shadow-accent/5 transition-all duration-300 cursor-pointer rounded-2xl">
          <div className="relative aspect-[4/3] overflow-hidden bg-secondary/30">
            {product.imageUrl ? (
              <img
                src={product.imageUrl}
                alt={product.title}
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-muted-foreground bg-secondary">
                No Image
              </div>
            )}
          </div>

          <CardContent className="p-4">
            <h3 className="font-display text-base font-bold leading-tight text-foreground line-clamp-2 group-hover:text-accent transition-colors">
              {product.title}
            </h3>
          </CardContent>

          <CardFooter className="p-4 pt-0 mt-auto">
            <p className="font-display text-lg font-bold text-primary">
              {formattedPrice}
            </p>
          </CardFooter>
        </Card>
      </Link>
    </motion.div>
  );
}
