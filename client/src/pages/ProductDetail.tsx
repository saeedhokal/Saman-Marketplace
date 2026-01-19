import { useProduct } from "@/hooks/use-products";
import { useAuth } from "@/hooks/use-auth";
import { useIsFavorite, useAddFavorite, useRemoveFavorite } from "@/hooks/use-favorites";
import { useRoute, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Phone, Heart, MapPin, Store, MessageCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { SiWhatsapp } from "react-icons/si";
import { useToast } from "@/hooks/use-toast";

export default function ProductDetail() {
  const [, params] = useRoute("/product/:id");
  const id = params?.id ? parseInt(params.id) : 0;
  const { data: product, isLoading, error } = useProduct(id);
  const { user } = useAuth();
  const { data: isFavorite } = useIsFavorite(id);
  const addFavorite = useAddFavorite();
  const removeFavorite = useRemoveFavorite();
  const { toast } = useToast();

  const handleToggleFavorite = async () => {
    if (!user) {
      window.location.href = "/api/login";
      return;
    }
    
    try {
      if (isFavorite) {
        await removeFavorite.mutateAsync(id);
        toast({ title: "Removed from favorites" });
      } else {
        await addFavorite.mutateAsync(id);
        toast({ title: "Added to favorites" });
      }
    } catch (err) {
      toast({ variant: "destructive", title: "Error updating favorites" });
    }
  };

  const formatWhatsAppNumber = (num: string) => {
    return num.replace(/[^0-9]/g, '');
  };

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
        <h2 className="text-2xl font-bold text-foreground">Listing not found</h2>
        <Link href="/">
          <Button variant="ghost" className="mt-4">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Browse
          </Button>
        </Link>
      </div>
    );
  }

  const formattedPrice = new Intl.NumberFormat("en-AE", {
    style: "currency",
    currency: "AED",
    maximumFractionDigits: 0,
  }).format(product.price / 100);

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="container mx-auto px-4 py-6">
        <Link href="/">
          <Button variant="ghost" className="pl-0 hover:bg-transparent hover:text-accent" data-testid="button-back">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Browse
          </Button>
        </Link>
      </div>

      <div className="container mx-auto px-4 max-w-7xl">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16">
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
            
            <Button
              size="icon"
              variant="secondary"
              className={`absolute top-4 right-4 h-12 w-12 rounded-full shadow-lg ${isFavorite ? 'bg-red-50 text-red-500 hover:bg-red-100' : 'bg-white/90 hover:bg-white'}`}
              onClick={handleToggleFavorite}
              data-testid="button-favorite"
            >
              <Heart className={`h-6 w-6 ${isFavorite ? 'fill-current' : ''}`} />
            </Button>
          </div>

          <div className="flex flex-col justify-center">
            <div className="space-y-4 mb-6">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="secondary" className="px-3 py-1 text-sm font-medium">
                  {product.mainCategory}
                </Badge>
                <Badge variant="outline" className="px-3 py-1 text-sm font-medium">
                  {product.subCategory}
                </Badge>
                <Badge variant="outline" className={`px-3 py-1 text-sm font-medium ${
                  product.condition === 'New' ? 'text-green-600 border-green-200 bg-green-50' : 
                  product.condition === 'Used' ? 'text-amber-600 border-amber-200 bg-amber-50' : 
                  'text-blue-600 border-blue-200 bg-blue-50'
                }`}>
                  {product.condition}
                </Badge>
              </div>

              <h1 className="font-display text-3xl sm:text-4xl font-bold text-foreground leading-tight">
                {product.title}
              </h1>

              <div className="font-display text-4xl font-bold text-primary">
                {formattedPrice}
              </div>

              {product.location && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  <span>{product.location}</span>
                </div>
              )}
            </div>

            <div className="prose prose-slate max-w-none text-muted-foreground mb-8">
              <p className="text-base leading-relaxed whitespace-pre-wrap">{product.description}</p>
            </div>

            <div className="bg-card border border-border/60 rounded-2xl p-6 shadow-lg shadow-black/5 space-y-4">
              <h3 className="font-semibold text-foreground mb-4">Contact Seller</h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {product.phoneNumber && (
                  <a 
                    href={`tel:${product.phoneNumber}`}
                    className="w-full"
                  >
                    <Button 
                      size="lg" 
                      variant="outline"
                      className="w-full h-14 text-base"
                      data-testid="button-call"
                    >
                      <Phone className="mr-2 h-5 w-5" /> Call Seller
                    </Button>
                  </a>
                )}
                
                {product.whatsappNumber && (
                  <a 
                    href={`https://wa.me/${formatWhatsAppNumber(product.whatsappNumber)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full"
                  >
                    <Button 
                      size="lg" 
                      className="w-full h-14 text-base bg-green-600 hover:bg-green-700 text-white"
                      data-testid="button-whatsapp"
                    >
                      <SiWhatsapp className="mr-2 h-5 w-5" /> WhatsApp
                    </Button>
                  </a>
                )}
              </div>

              {!product.phoneNumber && !product.whatsappNumber && (
                <p className="text-center text-muted-foreground py-4">
                  <MessageCircle className="h-6 w-6 mx-auto mb-2 opacity-50" />
                  Contact information not provided
                </p>
              )}

              <Link href={`/seller/${product.sellerId}`}>
                <Button 
                  variant="ghost" 
                  className="w-full mt-2"
                  data-testid="button-view-seller"
                >
                  <Store className="mr-2 h-4 w-4" /> View All Seller Listings
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
