import { useProduct } from "@/hooks/use-products";
import { useRoute, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Mail, ShieldCheck, Truck, Clock } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function ProductDetail() {
  const [, params] = useRoute("/product/:id");
  const id = params?.id ? parseInt(params.id) : 0;
  const { data: product, isLoading, error } = useProduct(id);

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-12 max-w-7xl">
        <Skeleton className="h-8 w-32 mb-8" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          <Skeleton className="h-[500px] w-full rounded-3xl" />
          <div className="space-y-6">
            <Skeleton className="h-12 w-3/4" />
            <Skeleton className="h-8 w-1/3" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-14 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <h2 className="text-2xl font-bold text-foreground">Product not found</h2>
        <Link href="/">
          <Button variant="link" className="mt-4">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Browse
          </Button>
        </Link>
      </div>
    );
  }

  const formattedPrice = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(product.price / 100);

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Breadcrumb / Back */}
      <div className="container mx-auto px-4 py-6">
        <Link href="/">
          <Button variant="ghost" className="pl-0 hover:bg-transparent hover:text-accent">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Browse
          </Button>
        </Link>
      </div>

      <div className="container mx-auto px-4 max-w-7xl">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20">
          {/* Image Section */}
          <div className="relative group">
            <div className="aspect-[4/3] rounded-3xl overflow-hidden bg-secondary border border-border/50 shadow-xl shadow-black/5">
              {product.imageUrl ? (
                <img
                  src={product.imageUrl}
                  alt={product.title}
                  className="w-full h-full object-cover object-center"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                  No Image Available
                </div>
              )}
            </div>
          </div>

          {/* Info Section */}
          <div className="flex flex-col justify-center">
            <div className="space-y-4 mb-8">
              <div className="flex items-center gap-3">
                <Badge variant="secondary" className="px-3 py-1 text-sm font-medium">
                  {product.category}
                </Badge>
                <Badge variant="outline" className={`px-3 py-1 text-sm font-medium ${
                  product.condition === 'New' ? 'text-green-600 border-green-200 bg-green-50' : 
                  product.condition === 'Used' ? 'text-amber-600 border-amber-200 bg-amber-50' : 
                  'text-blue-600 border-blue-200 bg-blue-50'
                }`}>
                  {product.condition}
                </Badge>
              </div>

              <h1 className="font-display text-4xl sm:text-5xl font-bold text-foreground leading-tight">
                {product.title}
              </h1>

              <div className="font-display text-4xl font-bold text-primary">
                {formattedPrice}
              </div>
            </div>

            <div className="prose prose-slate max-w-none text-muted-foreground mb-10">
              <p className="text-lg leading-relaxed">{product.description}</p>
            </div>

            {/* Action Card */}
            <div className="bg-card border border-border/60 rounded-2xl p-6 shadow-lg shadow-black/5 space-y-6">
              <div className="grid grid-cols-3 gap-4 pb-6 border-b border-border/50">
                <div className="text-center space-y-2">
                  <div className="w-10 h-10 mx-auto rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <p className="text-xs font-medium text-muted-foreground">Verified Seller</p>
                </div>
                <div className="text-center space-y-2">
                  <div className="w-10 h-10 mx-auto rounded-full bg-green-50 text-green-600 flex items-center justify-center">
                    <Truck className="w-5 h-5" />
                  </div>
                  <p className="text-xs font-medium text-muted-foreground">Fast Shipping</p>
                </div>
                <div className="text-center space-y-2">
                  <div className="w-10 h-10 mx-auto rounded-full bg-purple-50 text-purple-600 flex items-center justify-center">
                    <Clock className="w-5 h-5" />
                  </div>
                  <p className="text-xs font-medium text-muted-foreground">Quick Response</p>
                </div>
              </div>

              <Button size="lg" className="w-full h-14 text-lg bg-accent hover:bg-accent/90 shadow-lg shadow-accent/20">
                <Mail className="mr-2 h-5 w-5" /> Contact Seller
              </Button>
              
              <p className="text-center text-xs text-muted-foreground">
                Typically responds within 2 hours
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
