import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Plus, LogOut, Menu, Heart, Shield, Coins } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

export function Navbar() {
  const { user, logout } = useAuth();
  const [location] = useLocation();
  
  const { data: userInfo } = useQuery<{ credits: number; isAdmin: boolean }>({
    queryKey: ["/api/user/credits"],
    enabled: !!user,
  });

  const navLinks = [
    { href: "/", label: "Browse Parts" },
  ];

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-md supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-8 h-8 rounded-lg bg-primary text-primary-foreground flex items-center justify-center font-bold text-lg group-hover:bg-accent transition-colors duration-300">
            S
          </div>
          <span className="font-display font-bold text-xl tracking-tight text-foreground">
            Saman<span className="text-accent">Market</span>
          </span>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <Link 
              key={link.href} 
              href={link.href}
              className={`text-sm font-medium transition-colors hover:text-accent ${
                location === link.href ? "text-primary" : "text-muted-foreground"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* Desktop Actions */}
        <div className="hidden md:flex items-center gap-4">
          {user ? (
            <>
              <Link href="/favorites">
                <Button variant="ghost" size="icon" className="rounded-full" data-testid="button-favorites">
                  <Heart className="h-5 w-5" />
                </Button>
              </Link>
              <Link href="/sell">
                <Button className="bg-accent hover:bg-accent/90 text-white font-medium rounded-full px-6 shadow-lg shadow-accent/20 transition-all hover:-translate-y-0.5" data-testid="button-sell">
                  <Plus className="w-4 h-4 mr-2" />
                  Sell Part
                </Button>
              </Link>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-10 w-10 rounded-full ring-2 ring-transparent hover:ring-border transition-all">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={user.profileImageUrl || undefined} alt={user.firstName || "User"} />
                      <AvatarFallback className="bg-primary/5 text-primary">
                        {user.firstName?.charAt(0) || "U"}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">{user.firstName} {user.lastName}</p>
                      <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <div className="px-2 py-1.5">
                    <div className="flex items-center gap-2 text-sm">
                      <Coins className="h-4 w-4 text-accent" />
                      <span>{userInfo?.credits || 0} Credits</span>
                    </div>
                  </div>
                  <DropdownMenuSeparator />
                  {userInfo?.isAdmin && (
                    <>
                      <Link href="/admin">
                        <DropdownMenuItem className="cursor-pointer">
                          <Shield className="mr-2 h-4 w-4" />
                          <span>Admin Panel</span>
                        </DropdownMenuItem>
                      </Link>
                      <DropdownMenuSeparator />
                    </>
                  )}
                  <DropdownMenuItem onClick={() => logout()} className="text-destructive focus:text-destructive">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <Link href="/auth">
              <Button 
                className="bg-primary text-primary-foreground hover:bg-primary/90 font-medium px-6"
                data-testid="button-signin"
              >
                Sign In
              </Button>
            </Link>
          )}
        </div>

        {/* Mobile Menu */}
        <div className="md:hidden">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right">
              <div className="flex flex-col h-full pt-10 gap-6">
                {navLinks.map((link) => (
                  <Link 
                    key={link.href} 
                    href={link.href}
                    className="text-lg font-medium text-foreground hover:text-accent"
                  >
                    {link.label}
                  </Link>
                ))}
                
                <div className="mt-auto pb-8 border-t border-border pt-8 flex flex-col gap-4">
                  {user ? (
                    <>
                      <div className="flex items-center gap-3 mb-4">
                        <Avatar>
                          <AvatarImage src={user.profileImageUrl || undefined} />
                          <AvatarFallback>{user.firstName?.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{user.firstName}</p>
                          <p className="text-xs text-muted-foreground">{user.email}</p>
                        </div>
                      </div>
                      <Link href="/sell">
                        <Button className="w-full bg-accent hover:bg-accent/90 text-white">
                          <Plus className="w-4 h-4 mr-2" /> Sell Part
                        </Button>
                      </Link>
                      <Link href="/favorites">
                        <Button variant="outline" className="w-full">
                          <Heart className="mr-2 h-4 w-4" /> Saved Items
                        </Button>
                      </Link>
                      {userInfo?.isAdmin && (
                        <Link href="/admin">
                          <Button variant="outline" className="w-full">
                            <Shield className="mr-2 h-4 w-4" /> Admin Panel
                          </Button>
                        </Link>
                      )}
                      <div className="flex items-center justify-center gap-2 py-2 text-sm text-muted-foreground">
                        <Coins className="h-4 w-4 text-accent" />
                        <span>{userInfo?.credits || 0} Credits</span>
                      </div>
                      <Button variant="outline" onClick={() => logout()} className="w-full">
                        <LogOut className="mr-2 h-4 w-4" /> Log out
                      </Button>
                    </>
                  ) : (
                    <Link href="/auth">
                      <Button className="w-full">
                        Sign In
                      </Button>
                    </Link>
                  )}
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </nav>
  );
}
