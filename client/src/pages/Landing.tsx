import { Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Search, Bell, ChevronRight } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ProductCard } from "@/components/ProductCard";
import type { Product } from "@shared/schema";

export default function Landing() {
  const { user } = useAuth();

  const { data: recentProducts = [] } = useQuery<Product[]>({
    queryKey: ["/api/products/recent"],
  });

  const { data: recommendedProducts = [] } = useQuery<Product[]>({
    queryKey: ["/api/products/recommended"],
  });

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="container mx-auto px-4 pt-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-muted-foreground text-sm">
              {user ? `Hey, ${user.firstName || 'there'}` : 'Hey, Guest'}
            </p>
            <h1 className="text-xl font-bold text-foreground">Welcome To Saman</h1>
          </div>
          <div className="flex items-center gap-3">
            <button className="p-2 rounded-full hover:bg-secondary transition-colors" data-testid="button-notifications">
              <Bell className="h-5 w-5 text-muted-foreground" />
            </button>
            <Link href="/profile">
              <Avatar className="h-9 w-9 border-2 border-border">
                <AvatarImage src={user?.profileImageUrl || undefined} />
                <AvatarFallback className="bg-primary/10 text-primary text-sm">
                  {user?.firstName?.charAt(0) || 'G'}
                </AvatarFallback>
              </Avatar>
            </Link>
          </div>
        </div>

        <Link href="/categories">
          <div className="flex items-center border border-border rounded-full px-4 py-2 mb-4 hover:bg-secondary/50 transition-colors">
            <Search className="h-5 w-5 text-muted-foreground mr-3" />
            <span className="text-muted-foreground">Search</span>
          </div>
        </Link>

        {/* Dubai Skyline Hero Banner */}
        <div className="mb-6">
          <div className="relative rounded-2xl overflow-hidden" style={{ background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 50%, #3d3d3d 100%)' }}>
            <div className="relative h-44 sm:h-52">
              {/* Dubai Skyline Silhouette */}
              <svg 
                viewBox="0 0 800 200" 
                className="absolute bottom-0 left-0 w-full h-24 sm:h-28"
                preserveAspectRatio="xMidYMax slice"
              >
                <defs>
                  <linearGradient id="skylineGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#f97316" stopOpacity="0.8"/>
                    <stop offset="100%" stopColor="#f97316" stopOpacity="0.3"/>
                  </linearGradient>
                </defs>
                {/* Burj Khalifa and Dubai Skyline */}
                <path 
                  d="M0,200 L0,180 L30,180 L30,160 L35,160 L35,180 L60,180 L60,150 L70,150 L70,140 L75,140 L75,130 L80,130 L80,120 L85,120 L85,110 L90,110 L90,120 L95,120 L95,130 L100,130 L100,140 L105,140 L105,150 L115,150 L115,180 L140,180 L140,130 L150,130 L150,120 L160,120 L160,130 L170,130 L170,180 L200,180 L200,100 L210,100 L210,90 L220,90 L220,80 L230,80 L230,70 L235,70 L235,50 L238,50 L238,30 L240,30 L240,20 L242,20 L242,10 L244,10 L244,5 L246,5 L246,10 L248,10 L248,20 L250,20 L250,30 L252,30 L252,50 L255,50 L255,70 L260,70 L260,80 L270,80 L270,90 L280,90 L280,100 L290,100 L290,180 L320,180 L320,140 L330,140 L330,130 L340,130 L340,140 L345,140 L345,120 L350,120 L350,110 L355,110 L355,120 L360,120 L360,140 L370,140 L370,180 L400,180 L400,160 L410,160 L410,140 L420,140 L420,130 L425,130 L425,110 L430,110 L430,100 L435,100 L435,90 L440,90 L440,100 L445,100 L445,110 L450,110 L450,130 L455,130 L455,140 L465,140 L465,160 L475,160 L475,180 L510,180 L510,150 L520,150 L520,140 L530,140 L530,150 L540,150 L540,180 L570,180 L570,160 L580,160 L580,150 L590,150 L590,160 L600,160 L600,180 L630,180 L630,140 L640,140 L640,130 L645,130 L645,110 L650,110 L650,130 L655,130 L655,140 L665,140 L665,180 L700,180 L700,150 L710,150 L710,140 L720,140 L720,150 L730,150 L730,180 L770,180 L770,160 L780,160 L780,180 L800,180 L800,200 Z"
                  fill="url(#skylineGradient)"
                />
              </svg>
              
              {/* Content */}
              <div className="relative z-10 p-6 h-full flex flex-col justify-center">
                <p className="text-white/60 text-xs uppercase tracking-wider mb-1">UAE's Marketplace</p>
                <h2 className="text-white text-2xl font-bold mb-1">Buy & Sell</h2>
                <p className="text-[#f97316] font-semibold text-lg">Spare Parts & Cars</p>
                <Link href="/sell">
                  <Button 
                    size="sm" 
                    className="mt-3 bg-[#f97316] hover:bg-[#ea580c] text-white rounded-full px-5"
                    data-testid="banner-cta-sell"
                  >
                    Start Selling
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>

        <h2 className="text-base font-semibold text-foreground mb-4">Categories</h2>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <Link href="/categories?tab=automotive">
            <div className="relative aspect-[4/3] rounded-xl overflow-hidden group cursor-pointer border border-border" data-testid="card-automotive">
              <img 
                src="https://images.unsplash.com/photo-1555215695-3004980ad54e?w=400&h=300&fit=crop"
                alt="Automotive"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
              <div className="absolute bottom-3 left-3">
                <span className="text-white font-semibold text-base">Automotive</span>
              </div>
            </div>
          </Link>

          <Link href="/categories?tab=spare-parts">
            <div className="relative aspect-[4/3] rounded-xl overflow-hidden group cursor-pointer border border-border" data-testid="card-spare-parts">
              <img 
                src="https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=400&h=300&fit=crop"
                alt="Spare Parts"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
              <div className="absolute bottom-3 left-3">
                <span className="text-white font-semibold text-base">Spare Parts</span>
              </div>
            </div>
          </Link>
        </div>

        {recommendedProducts.length > 0 && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-foreground">For you</h2>
              <Link href="/categories">
                <span className="text-accent text-sm font-medium" data-testid="link-view-all-recommended">View All</span>
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {recommendedProducts.slice(0, 6).map((product) => (
                <ProductCard 
                  key={product.id} 
                  product={product}
                  sellerImageUrl={(product as any).sellerProfileImageUrl}
                  showDate
                />
              ))}
            </div>
          </div>
        )}

        {recentProducts.length > 0 && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-foreground">Recent Posts</h2>
              <Link href="/categories">
                <span className="text-accent text-sm font-medium" data-testid="link-view-all-recent">View All</span>
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {recentProducts.slice(0, 6).map((product) => (
                <ProductCard 
                  key={product.id} 
                  product={product}
                  sellerImageUrl={(product as any).sellerProfileImageUrl}
                  showDate
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
