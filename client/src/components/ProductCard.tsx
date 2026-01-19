import { Link } from "wouter";
import { type Product } from "@shared/schema";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { motion } from "framer-motion";

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  // Format price from cents to dollars
  const formattedPrice = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(product.price / 100);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Link href={`/product/${product.id}`}>
        <Card className="group h-full overflow-hidden border-border/50 bg-card hover:border-accent/30 hover:shadow-lg hover:shadow-accent/5 transition-all duration-300 cursor-pointer rounded-2xl">
          {/* Image Container */}
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
            
            <div className="absolute top-3 right-3">
              <Badge variant="secondary" className="bg-white/90 backdrop-blur-sm text-foreground font-semibold shadow-sm border-0">
                {product.condition}
              </Badge>
            </div>
          </div>

          <CardContent className="p-5">
            <div className="mb-2 flex items-center justify-between">
              <Badge variant="outline" className="text-xs font-medium text-muted-foreground border-border/60">
                {product.category}
              </Badge>
            </div>
            <h3 className="font-display text-lg font-bold leading-tight text-foreground line-clamp-2 group-hover:text-accent transition-colors">
              {product.title}
            </h3>
          </CardContent>

          <CardFooter className="p-5 pt-0 mt-auto">
            <p className="font-display text-xl font-bold text-primary">
              {formattedPrice}
            </p>
          </CardFooter>
        </Card>
      </Link>
    </motion.div>
  );
}
