import { useState, useEffect } from "react";
import { Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Bell, ChevronRight } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ProductCard } from "@/components/ProductCard";
import { apiRequest } from "@/lib/queryClient";
import type { Product, Banner } from "@shared/schema";

export default function Landing() {
  const { user } = useAuth();
  const [currentBanner, setCurrentBanner] = useState(0);

  const { data: banners = [] } = useQuery<Banner[]>({
    queryKey: ["/api/banners"],
  });

  const { data: recentProducts = [] } = useQuery<Product[]>({
    queryKey: ["/api/products/recent"],
  });

  const { data: recommendedProducts = [] } = useQuery<Product[]>({
    queryKey: ["/api/products/recommended"],
  });

  useEffect(() => {
    if (banners.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentBanner((prev) => (prev + 1) % banners.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [banners.length]);

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

        {banners.length > 0 && (
          <div className="mb-6">
            <div className="relative rounded-2xl overflow-hidden bg-[#4a4a4a]">
              <div 
                className="flex transition-transform duration-500 ease-out"
                style={{ transform: `translateX(-${currentBanner * 100}%)` }}
              >
                {banners.map((banner) => (
                  <div 
                    key={banner.id} 
                    className="w-full flex-shrink-0 relative"
                  >
                    <div className="relative h-40 sm:h-48">
                      {banner.imageUrl && (
                        <img 
                          src={banner.imageUrl} 
                          alt={banner.title}
                          className="absolute inset-0 w-full h-full object-cover opacity-30"
                        />
                      )}
                      <div className="relative z-10 p-6 h-full flex flex-col justify-center">
                        <p className="text-white/70 text-sm mb-1">Here</p>
                        <h2 className="text-white text-xl font-bold mb-1">{banner.title}</h2>
                        {banner.subtitle && (
                          <p className="text-accent font-semibold">{banner.subtitle}</p>
                        )}
                        {banner.buttonText && banner.linkUrl && (
                          <Link href={banner.linkUrl}>
                            <Button 
                              size="sm" 
                              className="mt-3 bg-accent hover:bg-accent/90 text-white rounded-full px-4"
                              data-testid={`banner-cta-${banner.id}`}
                            >
                              {banner.buttonText}
                              <ChevronRight className="h-4 w-4 ml-1" />
                            </Button>
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              {banners.length > 1 && (
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                  {banners.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setCurrentBanner(idx)}
                      className={`w-6 h-1 rounded-full transition-colors ${
                        idx === currentBanner ? "bg-accent" : "bg-white/40"
                      }`}
                      data-testid={`banner-dot-${idx}`}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

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
              {recommendedProducts.slice(0, 4).map((product) => (
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
              {recentProducts.slice(0, 4).map((product) => (
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
