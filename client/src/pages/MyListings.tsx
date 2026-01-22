import { useState, useCallback } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { PullToRefresh } from "@/components/PullToRefresh";
import { Link, useLocation } from "wouter";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { 
  Search, ArrowLeft, Loader2, Package, Plus, MoreVertical,
  Pencil, Trash2, CheckCircle, Clock, Timer
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
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
  const [search, setSearch] = useState("");
  const [deleteId, setDeleteId] = useState<number | null>(null);

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
      toast({ title: "Listing deleted" });
      setDeleteId(null);
    },
    onError: () => {
      toast({ variant: "destructive", title: "Failed to delete listing" });
    },
  });

  const markSoldMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("POST", `/api/user/listings/${id}/sold`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user/listings"] });
      toast({ title: "Listing marked as sold" });
    },
    onError: () => {
      toast({ variant: "destructive", title: "Failed to update listing" });
    },
  });

  if (!user && !isAuthLoading) {
    return (
      <div className="min-h-screen bg-background pb-20 flex items-center justify-center">
        <div className="text-center">
          <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h2 className="text-lg font-semibold mb-2">Sign in to view your listings</h2>
          <Link href="/auth">
            <Button>Sign In</Button>
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
        return <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">Active</span>;
      case "pending":
        return <span className="text-xs px-2 py-1 rounded-full bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400">Pending</span>;
      case "rejected":
        return <span className="text-xs px-2 py-1 rounded-full bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">Rejected</span>;
      case "sold":
        return <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400">Sold</span>;
      default:
        return null;
    }
  };

  const getExpirationBadge = (listing: ListingWithStatus) => {
    if (listing.status !== "approved" || !listing.expiresAt) return null;
    
    const expiresAt = new Date(listing.expiresAt);
    const daysLeft = differenceInDays(expiresAt, new Date());
    
    if (daysLeft < 0) {
      return <span className="text-xs px-2 py-1 rounded-full bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 flex items-center gap-1"><Timer className="h-3 w-3" />Expired</span>;
    } else if (daysLeft <= 7) {
      return <span className="text-xs px-2 py-1 rounded-full bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 flex items-center gap-1"><Timer className="h-3 w-3" />{daysLeft} day{daysLeft !== 1 ? 's' : ''} left</span>;
    } else {
      return <span className="text-xs text-muted-foreground flex items-center gap-1"><Timer className="h-3 w-3" />{daysLeft} days left</span>;
    }
  };

  const handleRefresh = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: ["/api/user/listings"] });
  }, []);

  return (
    <PullToRefresh onRefresh={handleRefresh} className="min-h-screen bg-background pb-20">
      <div className="sticky top-0 z-40 bg-background border-b border-border">
        <div className="container mx-auto px-4">
          <div className="flex items-center h-14">
            <Link href="/">
              <button className="p-2 -ml-2 rounded-lg hover:bg-secondary transition-colors" data-testid="button-back">
                <ArrowLeft className="h-5 w-5" />
              </button>
            </Link>
            <h1 className="flex-1 text-center font-semibold text-lg pr-8">My listings</h1>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 pt-4">
        <div className="flex items-center border border-border rounded-full px-4 py-2 mb-4">
          <Search className="h-5 w-5 text-muted-foreground mr-3" />
          <Input
            type="text"
            placeholder="Search"
            className="border-0 shadow-none focus-visible:ring-0 text-base h-8 bg-transparent p-0"
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
          <div className="space-y-3 pb-24">
            {filteredListings.map((listing) => (
              <div
                key={listing.id}
                className="flex gap-3 p-3 bg-card border border-border rounded-xl"
                data-testid={`listing-${listing.id}`}
              >
                <div className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0">
                  <img
                    src={listing.imageUrl}
                    alt={listing.title}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-medium text-sm truncate">{listing.title}</h3>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className="p-1 rounded hover:bg-secondary" data-testid={`menu-${listing.id}`}>
                          <MoreVertical className="h-4 w-4 text-muted-foreground" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setLocation(`/edit/${listing.id}`)}>
                          <Pencil className="h-4 w-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => markSoldMutation.mutate(listing.id)}>
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Mark as Sold
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => setDeleteId(listing.id)}
                          className="text-destructive"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
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
            <h3 className="text-lg font-semibold text-foreground mb-2">No listings yet</h3>
            <p className="text-muted-foreground text-sm mb-4">
              Start selling by adding your first listing
            </p>
          </div>
        )}
      </div>

      <div className="fixed bottom-20 left-0 right-0 p-4 pointer-events-none">
        <Link href="/sell" className="pointer-events-auto">
          <Button className="w-full h-12 bg-accent hover:bg-accent/90 text-white font-medium rounded-full shadow-lg" data-testid="button-add-listing">
            Add Listing
          </Button>
        </Link>
      </div>

      <AlertDialog open={deleteId !== null} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete listing?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete your listing.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteId && deleteMutation.mutate(deleteId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PullToRefresh>
  );
}
