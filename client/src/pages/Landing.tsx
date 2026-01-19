import { Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Input } from "@/components/ui/input";
import { Search, Bell, ChevronRight } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function Landing() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="container mx-auto px-4 pt-6">
        <div className="flex items-center justify-between mb-6">
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

        <div className="flex items-center border border-border rounded-full px-4 py-2 mb-6">
          <Search className="h-5 w-5 text-muted-foreground mr-3" />
          <Input
            type="text"
            placeholder="Search"
            className="border-0 shadow-none focus-visible:ring-0 text-base h-8 bg-transparent p-0"
            data-testid="input-search-home"
          />
        </div>

        <h2 className="text-base font-semibold text-foreground mb-4">Categories</h2>

        <div className="grid grid-cols-2 gap-4">
          <Link href="/categories?tab=automotive">
            <div className="relative aspect-[4/3] rounded-xl overflow-hidden group cursor-pointer" data-testid="card-automotive">
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
            <div className="relative aspect-[4/3] rounded-xl overflow-hidden group cursor-pointer" data-testid="card-spare-parts">
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
      </div>
    </div>
  );
}
