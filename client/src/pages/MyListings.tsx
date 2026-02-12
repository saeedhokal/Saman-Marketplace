import { useState, useCallback, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { PullToRefresh } from "@/components/PullToRefresh";
import { Link, useLocation } from "wouter";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { 
  Search, ArrowLeft, Loader2, Package, Plus, MoreVertical,
  Pencil, Trash2, CheckCircle, Clock, Timer, RefreshCw
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useLanguage } from "@/hooks/use-language";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { differenceInDays } from "date-fns";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import type { Product } from "@shared/schema";

type ListingWithStatus = Product & { status: string; expiresAt?: string | null };

export default function MyListings() {
  const { user, isLoading: isAuthLoading } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { t, isRTL } = useLanguage();
  const [search, setSearch] = useState("");
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [renewId, setRenewId] = useState<number | null>(null);
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);

  const handleEdit = useCallback((id: number) => {
    // Close the menu first, then navigate after a brief delay for iOS
    setOpenMenuId(null);
    setTimeout(() => {
      setLocation(`/edit/${id}`);
    }, 100);
  }, [setLocation]);

  const { data: listings, isLoading, refetch } = useQuery<ListingWithStatus[]>({
    queryKey: ["/api/user/listings"],
    enabled: !!user,
    refetchOnWindowFocus: true,
    staleTime: 30000,
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/products/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user/listings"] });
      toast({ title: t('listingDeleted') });
      setDeleteId(null);
    },
    onError: () => {
      toast({ variant: "destructive", title: t('failedToDelete') });
    },
  });

  const markSoldMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("POST", `/api/user/listings/${id}/sold`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user/listings"] });
      toast({ title: t('markedAsSold') });
    },
    onError: () => {
      toast({ variant: "destructive", title: t('failedToUpdate') });
    },
  });

  const renewMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest("POST", `/api/listings/${id}/renew`);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user/listings"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      toast({ title: t('listingRenewed') });
      setRenewId(null);
    },
    onError: (error: any) => {
      setRenewId(null);
      if (error?.message?.includes("credit") || error?.message?.includes("insufficient")) {
        toast({ 
          variant: "destructive", 
          title: t('notEnoughCredits'),
          description: t('needCreditToRenew'),
          action: <Button size="sm" variant="outline" onClick={() => setLocation("/subscription")}>{t('buyCredits')}</Button>
        });
      } else {
        toast({ variant: "destructive", title: error?.message || t('failedToUpdate') });
      }
    },
  });

  if (!user && !isAuthLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h2 className="text-lg font-semibold mb-2">{t('signInToViewListings')}</h2>
          <Link href="/auth">
            <Button>{t('signIn')}</Button>
          </Link>
        </div>
      </div>
    );
  }

  const filteredListings = listings?.filter(listing =>
    listing.title.toLowerCase().includes(search.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">{t('active')}</span>;
      case "pending":
        return <span className="text-xs px-2 py-1 rounded-full bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400">{t('pending')}</span>;
      case "rejected":
        return <span className="text-xs px-2 py-1 rounded-full bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">{t('rejected')}</span>;
      case "sold":
        return <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400">{t('sold')}</span>;
      default:
        return null;
    }
  };

  const getExpirationBadge = (listing: ListingWithStatus) => {
    if (listing.status !== "approved" || !listing.expiresAt) return null;
    
    const expiresAt = new Date(listing.expiresAt);
    const daysLeft = differenceInDays(expiresAt, new Date());
    
    if (daysLeft < 0) {
      return <span className="text-xs px-2 py-1 rounded-full bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 flex items-center gap-1"><Timer className="h-3 w-3" />{t('expired')}</span>;
    } else if (daysLeft <= 7) {
      return <span className="text-xs px-2 py-1 rounded-full bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 flex items-center gap-1"><Timer className="h-3 w-3" />{daysLeft} {daysLeft !== 1 ? t('daysLeft') : t('dayLeft')}</span>;
    } else {
      return <span className="text-xs text-muted-foreground flex items-center gap-1"><Timer className="h-3 w-3" />{daysLeft} {t('daysLeft')}</span>;
    }
  };

  const canRenew = (listing: ListingWithStatus) => {
    if (listing.status !== "approved" || !listing.expiresAt) return false;
    const expiresAt = new Date(listing.expiresAt);
    const daysLeft = differenceInDays(expiresAt, new Date());
    return daysLeft <= 7 && daysLeft >= -7;
  };

  const handleRefresh = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: ["/api/user/listings"] });
  }, []);

  return (
    <>
    <PullToRefresh onRefresh={handleRefresh} className="min-h-screen bg-background">
      <div className="sticky top-0 z-40 bg-background border-b border-border">
        <div className="container mx-auto px-4">
          <div className="relative flex items-center justify-center h-14">
            <Link href="/" className={`absolute ${isRTL ? 'right-0' : 'left-0'}`}>
              <button className="p-2 rounded-lg hover:bg-secondary transition-colors" data-testid="button-back">
                <ArrowLeft className={`h-5 w-5 ${isRTL ? 'rotate-180' : ''}`} />
              </button>
            </Link>
            <h1 className="font-semibold text-lg">{t('myListings')}</h1>
          </div>
        </div>
      </div>

      <div className={`container mx-auto px-4 pt-4 ${isRTL ? 'text-right' : ''}`} dir={isRTL ? 'rtl' : 'ltr'}>
        <div className={`flex items-center border border-border rounded-full px-4 py-2 mb-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
          <Search className={`h-5 w-5 text-muted-foreground ${isRTL ? 'ml-3' : 'mr-3'}`} />
          <Input
            type="text"
            placeholder={t('search')}
            className={`border-0 shadow-none focus-visible:ring-0 text-base h-8 bg-transparent p-0 ${isRTL ? 'text-right' : ''}`}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            data-testid="input-search-listings"
          />
        </div>

        {isLoading || isAuthLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-accent" />
          </div>
        ) : filteredListings && filteredListings.length > 0 ? (
          <div className="space-y-3">
            {filteredListings.map((listing) => (
              <div
                key={listing.id}
                className="flex gap-3 p-3 bg-card border border-border rounded-xl"
                data-testid={`listing-${listing.id}`}
              >
                <div className="relative w-20 h-20 rounded-lg overflow-hidden flex-shrink-0">
                  <img
                    src={listing.imageUrl}
                    alt={listing.title}
                    className={`w-full h-full object-cover ${listing.status === "sold" ? 'blur-[1px] brightness-75' : ''}`}
                  />
                  {listing.status === "sold" && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-red-600 font-black text-base tracking-widest uppercase -rotate-12" style={{ WebkitTextStroke: '0.75px white' }}>SOLD</span>
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-medium text-sm truncate">{listing.title}</h3>
                    <DropdownMenu 
                      open={openMenuId === listing.id} 
                      onOpenChange={(open) => setOpenMenuId(open ? listing.id : null)}
                      modal={false}
                    >
                      <DropdownMenuTrigger asChild>
                        <button 
                          className="p-3 -m-1 rounded-lg hover:bg-secondary active:bg-secondary/80 touch-manipulation" 
                          data-testid={`menu-${listing.id}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            setOpenMenuId(openMenuId === listing.id ? null : listing.id);
                          }}
                        >
                          <MoreVertical className="h-5 w-5 text-muted-foreground" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="min-w-[180px] z-[100]" sideOffset={8}>
                        {listing.status !== "sold" && (
                          <DropdownMenuItem 
                            onClick={() => handleEdit(listing.id)}
                            className={`py-3 text-base cursor-pointer touch-manipulation ${isRTL ? 'flex-row-reverse' : ''}`}
                          >
                            <Pencil className={`h-5 w-5 ${isRTL ? 'ml-3' : 'mr-3'}`} />
                            {t('edit')}
                          </DropdownMenuItem>
                        )}
                        {canRenew(listing) && (
                          <DropdownMenuItem 
                            onClick={() => {
                              setOpenMenuId(null);
                              setRenewId(listing.id);
                            }}
                            className={`py-3 text-base cursor-pointer touch-manipulation text-orange-600 dark:text-orange-400 ${isRTL ? 'flex-row-reverse' : ''}`}
                          >
                            <RefreshCw className={`h-5 w-5 ${isRTL ? 'ml-3' : 'mr-3'}`} />
                            {t('renewListing')}
                          </DropdownMenuItem>
                        )}
                        {listing.status !== "sold" && (
                          <DropdownMenuItem 
                            onClick={() => {
                              setOpenMenuId(null);
                              markSoldMutation.mutate(listing.id);
                            }}
                            className={`py-3 text-base cursor-pointer touch-manipulation ${isRTL ? 'flex-row-reverse' : ''}`}
                          >
                            <CheckCircle className={`h-5 w-5 ${isRTL ? 'ml-3' : 'mr-3'}`} />
                            {t('markAsSold')}
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem 
                          onClick={() => {
                            setOpenMenuId(null);
                            setDeleteId(listing.id);
                          }}
                          className={`text-destructive py-3 text-base cursor-pointer touch-manipulation ${isRTL ? 'flex-row-reverse' : ''}`}
                        >
                          <Trash2 className={`h-5 w-5 ${isRTL ? 'ml-3' : 'mr-3'}`} />
                          {t('deleteListing')}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{listing.subCategory}</p>
                  <div className="flex items-center flex-wrap gap-2 mt-2">
                    {getStatusBadge(listing.status)}
                    {getExpirationBadge(listing)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-accent/10 flex items-center justify-center">
              <Package className="h-8 w-8 text-accent/50" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">{t('noListingsYetTitle')}</h3>
            <p className="text-muted-foreground text-sm mb-4">
              {t('startSellingFirst')}
            </p>
          </div>
        )}
      </div>
    </PullToRefresh>

      {/* Fixed button outside PullToRefresh to prevent jumping */}
      <div className="fixed left-0 right-0 p-4 pointer-events-none z-50" style={{ bottom: 'calc(80px + env(safe-area-inset-bottom, 0px))' }}>
        <Link href="/sell" className="pointer-events-auto">
          <Button className="w-full h-12 bg-accent hover:bg-accent/90 text-white font-medium rounded-full shadow-lg" data-testid="button-add-listing">
            {t('addListing')}
          </Button>
        </Link>
      </div>

      <AlertDialog open={deleteId !== null} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent dir={isRTL ? 'rtl' : 'ltr'}>
          <AlertDialogHeader>
            <AlertDialogTitle className={isRTL ? 'text-right' : ''}>{t('deleteListingTitle')}</AlertDialogTitle>
            <AlertDialogDescription className={isRTL ? 'text-right' : ''}>
              {t('deleteListingDesc')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className={isRTL ? 'flex-row-reverse gap-2' : ''}>
            <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteId && deleteMutation.mutate(deleteId)}
              className="bg-destructive text-destructive-foreground"
            >
              {t('delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={renewId !== null} onOpenChange={() => setRenewId(null)}>
        <AlertDialogContent dir={isRTL ? 'rtl' : 'ltr'}>
          <AlertDialogHeader>
            <AlertDialogTitle className={isRTL ? 'text-right' : ''}>{t('renewListingTitle')}</AlertDialogTitle>
            <AlertDialogDescription className={isRTL ? 'text-right' : ''}>
              {t('renewListingDesc')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className={isRTL ? 'flex-row-reverse gap-2' : ''}>
            <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => renewId && renewMutation.mutate(renewId)}
              className="bg-accent text-white"
              disabled={renewMutation.isPending}
            >
              {renewMutation.isPending ? (
                <>
                  <Loader2 className={`h-4 w-4 animate-spin ${isRTL ? 'ml-2' : 'mr-2'}`} />
                  {t('renewing')}
                </>
              ) : (
                t('renewOneCredit')
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
