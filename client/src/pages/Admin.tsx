import { useState, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { PullToRefresh } from "@/components/PullToRefresh";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Check, X, Trash2, Clock, CheckCircle, XCircle, Settings, Image, Plus, ArrowLeft, Package, Car, DollarSign, TrendingUp, Edit2, CheckSquare, Square, Bell, Send, Users, Search, Calendar } from "lucide-react";
import type { Product, AppSettings, Banner, SubscriptionPackage } from "@shared/schema";
import { Link } from "wouter";

interface RevenueStats {
  totalRevenue: number;
  sparePartsRevenue: number;
  automotiveRevenue: number;
  transactionCount: number;
}

export default function Admin() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [pendingCategory, setPendingCategory] = useState<"all" | "Spare Parts" | "Automotive">("all");
  const [packageCategory, setPackageCategory] = useState<"Spare Parts" | "Automotive">("Spare Parts");
  const [editingPackage, setEditingPackage] = useState<SubscriptionPackage | null>(null);
  const [selectedListings, setSelectedListings] = useState<Set<number>>(new Set());
  const [newPackage, setNewPackage] = useState({
    name: "",
    price: 0,
    credits: 1,
    bonusCredits: 0,
    category: "Spare Parts",
    isActive: true,
    sortOrder: 0,
  });
  const [newBanner, setNewBanner] = useState({
    title: "",
    subtitle: "",
    imageUrl: "",
    linkUrl: "",
    buttonText: "",
    isActive: true,
    sortOrder: 0,
  });
  const [broadcastNotification, setBroadcastNotification] = useState({
    title: "",
    body: "",
    scheduleType: "now" as "now" | "delay" | "scheduled",
    delayMinutes: 30,
    scheduledDate: "",
    scheduledTime: "",
  });
  const [userSearch, setUserSearch] = useState("");
  const [revenuePeriod, setRevenuePeriod] = useState<'day' | 'week' | 'month' | 'year' | 'all' | 'custom'>('all');
  const [customDateRange, setCustomDateRange] = useState({
    startDate: '',
    endDate: '',
  });

  const { data: userInfo } = useQuery<{ credits: number; isAdmin: boolean }>({
    queryKey: ["/api/user/credits"],
  });

  const { data: pendingListings, isLoading: pendingLoading } = useQuery<Product[]>({
    queryKey: ["/api/admin/listings/pending"],
    enabled: !!userInfo?.isAdmin,
    refetchOnWindowFocus: true,
    staleTime: 15000,
  });

  const { data: allListings, isLoading: allLoading } = useQuery<Product[]>({
    queryKey: ["/api/admin/listings"],
    enabled: !!userInfo?.isAdmin,
    refetchOnWindowFocus: true,
    staleTime: 30000,
  });

  const { data: settings } = useQuery<AppSettings>({
    queryKey: ["/api/settings"],
    enabled: !!userInfo?.isAdmin,
  });

  const { data: banners = [] } = useQuery<Banner[]>({
    queryKey: ["/api/admin/banners"],
    enabled: !!userInfo?.isAdmin,
  });

  const { data: packages = [] } = useQuery<SubscriptionPackage[]>({
    queryKey: ["/api/admin/packages"],
    enabled: !!userInfo?.isAdmin,
  });

  const { data: revenueStats } = useQuery<RevenueStats>({
    queryKey: ["/api/admin/revenue"],
    enabled: !!userInfo?.isAdmin,
  });

  interface DetailedRevenueStats extends RevenueStats {
    periodLabel: string;
  }

  const { data: detailedRevenueStats } = useQuery<DetailedRevenueStats>({
    queryKey: ["/api/admin/revenue/detailed", revenuePeriod, customDateRange.startDate, customDateRange.endDate],
    queryFn: async () => {
      let url = `/api/admin/revenue/detailed?period=${revenuePeriod}`;
      if (revenuePeriod === 'custom' && customDateRange.startDate && customDateRange.endDate) {
        url += `&startDate=${customDateRange.startDate}&endDate=${customDateRange.endDate}`;
      }
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch revenue");
      return res.json();
    },
    enabled: !!userInfo?.isAdmin,
  });

  interface UserData {
    id: string;
    phone: string | null;
    email: string | null;
    firstName: string | null;
    lastName: string | null;
    sparePartsCredits: number;
    automotiveCredits: number;
    isAdmin: boolean;
    profileImageUrl: string | null;
    createdAt: string;
  }

  const { data: allUsers = [] } = useQuery<UserData[]>({
    queryKey: ["/api/admin/users"],
    enabled: !!userInfo?.isAdmin,
  });

  const deleteUserMutation = useMutation({
    mutationFn: (userId: string) => apiRequest("DELETE", `/api/admin/users/${userId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({ title: "User deleted", description: "The account has been removed." });
    },
    onError: (error: any) => {
      toast({ 
        title: "Failed to delete", 
        description: error.message || "Could not delete the user",
        variant: "destructive"
      });
    },
  });

  const approveMutation = useMutation({
    mutationFn: (id: number) => apiRequest("POST", `/api/admin/listings/${id}/approve`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/listings"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/listings/pending"] });
      toast({ title: "Listing approved", description: "The listing is now visible to users." });
    },
  });

  const bulkApproveMutation = useMutation({
    mutationFn: async (ids: number[]) => {
      await Promise.all(ids.map(id => apiRequest("POST", `/api/admin/listings/${id}/approve`)));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/listings"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/listings/pending"] });
      setSelectedListings(new Set());
      toast({ title: "Listings approved", description: `${selectedListings.size} listings approved successfully.` });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }: { id: number; reason: string }) =>
      apiRequest("POST", `/api/admin/listings/${id}/reject`, { reason }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/listings"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/listings/pending"] });
      toast({ title: "Listing rejected", description: "The seller has been notified." });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/admin/listings/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/listings"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/listings/pending"] });
      toast({ title: "Listing deleted" });
    },
  });

  const updateSettingsMutation = useMutation({
    mutationFn: (data: Partial<AppSettings>) => apiRequest("PUT", "/api/admin/settings", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/settings"] });
      toast({ title: "Settings updated" });
    },
  });

  const createBannerMutation = useMutation({
    mutationFn: (data: typeof newBanner) => apiRequest("POST", "/api/admin/banners", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/banners"] });
      queryClient.invalidateQueries({ queryKey: ["/api/banners"] });
      setNewBanner({ title: "", subtitle: "", imageUrl: "", linkUrl: "", buttonText: "", isActive: true, sortOrder: 0 });
      toast({ title: "Banner created" });
    },
  });

  const updateBannerMutation = useMutation({
    mutationFn: ({ id, ...data }: Partial<Banner> & { id: number }) => 
      apiRequest("PUT", `/api/admin/banners/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/banners"] });
      queryClient.invalidateQueries({ queryKey: ["/api/banners"] });
      toast({ title: "Banner updated" });
    },
  });

  const deleteBannerMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/admin/banners/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/banners"] });
      queryClient.invalidateQueries({ queryKey: ["/api/banners"] });
      toast({ title: "Banner deleted" });
    },
  });

  const broadcastMutation = useMutation({
    mutationFn: (data: { title: string; body: string; scheduleType?: string; delayMinutes?: number; scheduledDate?: string; scheduledTime?: string }) => 
      apiRequest("POST", "/api/admin/broadcast", data),
    onSuccess: (data: any) => {
      setBroadcastNotification({ title: "", body: "", scheduleType: "now", delayMinutes: 30, scheduledDate: "", scheduledTime: "" });
      toast({ 
        title: data.scheduled ? "Notification scheduled" : "Notification sent", 
        description: `${data.message || `Saved to ${data.savedCount || 0} inboxes, sent to ${data.sent || 0} devices`}${data.version ? ` (${data.version})` : ''}`
      });
    },
    onError: () => {
      toast({ 
        title: "Failed to send", 
        description: "Could not send the notification",
        variant: "destructive"
      });
    },
  });

  const createPackageMutation = useMutation({
    mutationFn: (data: typeof newPackage) => apiRequest("POST", "/api/admin/packages", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/packages"] });
      setNewPackage({ name: "", price: 0, credits: 1, bonusCredits: 0, category: packageCategory, isActive: true, sortOrder: 0 });
      toast({ title: "Package created" });
    },
  });

  const updatePackageMutation = useMutation({
    mutationFn: ({ id, ...data }: Partial<SubscriptionPackage> & { id: number }) => 
      apiRequest("PUT", `/api/admin/packages/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/packages"] });
      setEditingPackage(null);
      toast({ title: "Package updated" });
    },
    onError: (error: any) => {
      toast({ title: "Failed to update package", description: error?.message || "Unknown error", variant: "destructive" });
    },
  });

  const deletePackageMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/admin/packages/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/packages"] });
      toast({ title: "Package deleted" });
    },
  });

  const seedDemoMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/admin/seed-demo"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      queryClient.invalidateQueries({ queryKey: ["/api/products/recent"] });
      queryClient.invalidateQueries({ queryKey: ["/api/products/recommended"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/listings"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/packages"] });
      toast({ title: "Demo content added", description: "10 listings and 8 subscription packages have been added." });
    },
    onError: () => {
      toast({ title: "Failed to add demo content", variant: "destructive" });
    },
  });

  const clearDemoMutation = useMutation({
    mutationFn: () => apiRequest("DELETE", "/api/admin/clear-demo"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      queryClient.invalidateQueries({ queryKey: ["/api/products/recent"] });
      queryClient.invalidateQueries({ queryKey: ["/api/products/recommended"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/listings"] });
      toast({ title: "Demo listings removed", description: "All demo listings have been cleared." });
    },
    onError: () => {
      toast({ title: "Failed to clear demo listings", variant: "destructive" });
    },
  });

  if (!userInfo?.isAdmin) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <XCircle className="h-12 w-12 mx-auto text-destructive mb-4" />
            <h2 className="text-xl font-bold mb-2">Access Denied</h2>
            <p className="text-muted-foreground mb-4">You don't have admin access.</p>
            <Link href="/">
              <Button>Back to Home</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="outline" className="bg-yellow-500/10 text-yellow-600 whitespace-nowrap flex-shrink-0"><Clock className="h-3 w-3 mr-1" /> Pending</Badge>;
      case "approved":
        return <Badge variant="outline" className="bg-green-500/10 text-green-600 whitespace-nowrap flex-shrink-0"><CheckCircle className="h-3 w-3 mr-1" /> Approved</Badge>;
      case "rejected":
        return <Badge variant="outline" className="bg-red-500/10 text-red-600 whitespace-nowrap flex-shrink-0"><XCircle className="h-3 w-3 mr-1" /> Rejected</Badge>;
      default:
        return <Badge variant="outline" className="whitespace-nowrap flex-shrink-0">{status}</Badge>;
    }
  };

  const filteredPending = pendingListings?.filter(l => 
    pendingCategory === "all" || l.mainCategory === pendingCategory
  ) || [];

  const sparePartsPending = pendingListings?.filter(l => l.mainCategory === "Spare Parts").length || 0;
  const automotivePending = pendingListings?.filter(l => l.mainCategory === "Automotive").length || 0;

  const filteredPackages = packages.filter(p => p.category === packageCategory);

  const toggleListingSelection = (id: number) => {
    setSelectedListings(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const selectAllFiltered = () => {
    const allIds = filteredPending.map(l => l.id);
    setSelectedListings(new Set(allIds));
  };

  const deselectAll = () => {
    setSelectedListings(new Set());
  };

  const isAllSelected = filteredPending.length > 0 && filteredPending.every(l => selectedListings.has(l.id));
  const hasSelections = selectedListings.size > 0;

  const handleRefresh = useCallback(async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["/api/admin/listings/pending"] }),
      queryClient.invalidateQueries({ queryKey: ["/api/admin/listings"] }),
      queryClient.invalidateQueries({ queryKey: ["/api/admin/banners"] }),
      queryClient.invalidateQueries({ queryKey: ["/api/admin/packages"] }),
      queryClient.invalidateQueries({ queryKey: ["/api/admin/revenue"] }),
    ]);
  }, [queryClient]);

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
            <h1 className="flex-1 text-center font-semibold text-lg pr-8">Admin Panel</h1>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 pt-4 max-w-6xl">
        <Tabs defaultValue="pending" className="space-y-4">
          <TabsList className="grid grid-cols-6 w-full">
            <TabsTrigger value="pending" className="text-xs">
              Pending ({pendingListings?.length || 0})
            </TabsTrigger>
            <TabsTrigger value="all" className="text-xs">
              All
            </TabsTrigger>
            <TabsTrigger value="packages" className="text-xs">
              Packages
            </TabsTrigger>
            <TabsTrigger value="revenue" className="text-xs">
              Revenue
            </TabsTrigger>
            <TabsTrigger value="users" className="text-xs">
              Users
            </TabsTrigger>
            <TabsTrigger value="settings" className="text-xs">
              Settings
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pending" className="space-y-4">
            <div className="flex gap-2 p-1 bg-secondary rounded-lg">
              <button
                onClick={() => setPendingCategory("all")}
                className={`flex-1 py-2 px-3 rounded-md text-xs font-medium transition-colors ${
                  pendingCategory === "all" ? "bg-background shadow-sm" : "text-muted-foreground"
                }`}
              >
                All ({pendingListings?.length || 0})
              </button>
              <button
                onClick={() => setPendingCategory("Spare Parts")}
                className={`flex-1 py-2 px-3 rounded-md text-xs font-medium transition-colors ${
                  pendingCategory === "Spare Parts" ? "bg-background shadow-sm" : "text-muted-foreground"
                }`}
              >
                <Package className="h-3 w-3 inline mr-1" />
                Parts ({sparePartsPending})
              </button>
              <button
                onClick={() => setPendingCategory("Automotive")}
                className={`flex-1 py-2 px-3 rounded-md text-xs font-medium transition-colors ${
                  pendingCategory === "Automotive" ? "bg-background shadow-sm" : "text-muted-foreground"
                }`}
              >
                <Car className="h-3 w-3 inline mr-1" />
                Auto ({automotivePending})
              </button>
            </div>

            {filteredPending.length > 0 && (
              <div className="flex items-center justify-between gap-2 p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={isAllSelected ? deselectAll : selectAllFiltered}
                    data-testid="button-select-all"
                  >
                    {isAllSelected ? (
                      <>
                        <Square className="h-4 w-4 mr-2" />
                        Deselect All
                      </>
                    ) : (
                      <>
                        <CheckSquare className="h-4 w-4 mr-2" />
                        Select All ({filteredPending.length})
                      </>
                    )}
                  </Button>
                  {hasSelections && (
                    <span className="text-sm text-muted-foreground">
                      {selectedListings.size} selected
                    </span>
                  )}
                </div>
                {hasSelections && (
                  <Button
                    size="sm"
                    onClick={() => bulkApproveMutation.mutate(Array.from(selectedListings))}
                    disabled={bulkApproveMutation.isPending}
                    data-testid="button-bulk-approve"
                  >
                    <Check className="h-4 w-4 mr-2" />
                    {bulkApproveMutation.isPending ? "Approving..." : `Approve ${selectedListings.size}`}
                  </Button>
                )}
              </div>
            )}

            {pendingLoading ? (
              <div className="text-center py-10 text-muted-foreground">Loading...</div>
            ) : !filteredPending.length ? (
              <Card>
                <CardContent className="py-10 text-center text-muted-foreground">
                  <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-500" />
                  <p>No pending listings to review</p>
                </CardContent>
              </Card>
            ) : (
              filteredPending.map((listing) => (
                <ListingCard
                  key={listing.id}
                  listing={listing}
                  onApprove={() => approveMutation.mutate(listing.id)}
                  onReject={(reason) => rejectMutation.mutate({ id: listing.id, reason })}
                  onDelete={() => deleteMutation.mutate(listing.id)}
                  showActions
                  getStatusBadge={getStatusBadge}
                  isSelected={selectedListings.has(listing.id)}
                  onToggleSelect={() => toggleListingSelection(listing.id)}
                  showCheckbox
                />
              ))
            )}
          </TabsContent>

          <TabsContent value="all" className="space-y-4">
            {allLoading ? (
              <div className="text-center py-10 text-muted-foreground">Loading...</div>
            ) : !allListings?.length ? (
              <Card>
                <CardContent className="py-10 text-center text-muted-foreground">
                  <p>No listings yet</p>
                </CardContent>
              </Card>
            ) : (
              allListings.map((listing) => (
                <ListingCard
                  key={listing.id}
                  listing={listing}
                  onApprove={() => approveMutation.mutate(listing.id)}
                  onReject={(reason) => rejectMutation.mutate({ id: listing.id, reason })}
                  onDelete={() => deleteMutation.mutate(listing.id)}
                  showActions={listing.status === "pending"}
                  getStatusBadge={getStatusBadge}
                />
              ))
            )}
          </TabsContent>

          <TabsContent value="packages" className="space-y-4">
            <div className="flex gap-2 p-1 bg-secondary rounded-lg">
              <button
                onClick={() => setPackageCategory("Spare Parts")}
                className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                  packageCategory === "Spare Parts" ? "bg-background shadow-sm" : "text-muted-foreground"
                }`}
              >
                <Package className="h-4 w-4 inline mr-1" />
                Spare Parts
              </button>
              <button
                onClick={() => setPackageCategory("Automotive")}
                className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                  packageCategory === "Automotive" ? "bg-background shadow-sm" : "text-muted-foreground"
                }`}
              >
                <Car className="h-4 w-4 inline mr-1" />
                Automotive
              </button>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Add New {packageCategory} Package
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium mb-1 block">Package Name</label>
                    <Input
                      placeholder="e.g. Basic Plan"
                      value={newPackage.name}
                      onChange={(e) => setNewPackage({ ...newPackage, name: e.target.value })}
                      className="h-9"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium mb-1 block">Price (AED)</label>
                    <Input
                      type="number"
                      placeholder="75"
                      value={newPackage.price || ""}
                      onChange={(e) => setNewPackage({ ...newPackage, price: parseInt(e.target.value) || 0 })}
                      className="h-9"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-xs font-medium mb-1 block">Credits</label>
                    <Input
                      type="number"
                      value={newPackage.credits}
                      onChange={(e) => setNewPackage({ ...newPackage, credits: parseInt(e.target.value) || 1 })}
                      className="h-9"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium mb-1 block">Bonus Credits</label>
                    <Input
                      type="number"
                      value={newPackage.bonusCredits}
                      onChange={(e) => setNewPackage({ ...newPackage, bonusCredits: parseInt(e.target.value) || 0 })}
                      className="h-9"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium mb-1 block">Sort Order</label>
                    <Input
                      type="number"
                      value={newPackage.sortOrder}
                      onChange={(e) => setNewPackage({ ...newPackage, sortOrder: parseInt(e.target.value) || 0 })}
                      className="h-9"
                    />
                  </div>
                </div>
                <Button 
                  size="sm"
                  onClick={() => createPackageMutation.mutate({ ...newPackage, category: packageCategory })}
                  disabled={!newPackage.name || !newPackage.price || createPackageMutation.isPending}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Create Package
                </Button>
              </CardContent>
            </Card>

            <div className="space-y-3">
              <h3 className="font-semibold">Existing {packageCategory} Packages ({filteredPackages.length})</h3>
              {filteredPackages.length === 0 ? (
                <Card>
                  <CardContent className="py-8 text-center text-muted-foreground">
                    <Package className="h-10 w-10 mx-auto mb-3 opacity-50" />
                    <p>No packages yet for {packageCategory}</p>
                  </CardContent>
                </Card>
              ) : (
                filteredPackages.map((pkg) => (
                  <Card key={pkg.id}>
                    <CardContent className="p-4">
                      {editingPackage?.id === pkg.id ? (
                        <div className="space-y-3">
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="text-xs text-muted-foreground">Name</label>
                              <Input
                                value={editingPackage.name}
                                onChange={(e) => setEditingPackage({ ...editingPackage, name: e.target.value })}
                                className="h-8"
                              />
                            </div>
                            <div>
                              <label className="text-xs text-muted-foreground">Price (AED)</label>
                              <Input
                                type="number"
                                step="0.01"
                                value={(editingPackage.price / 100).toFixed(2)}
                                onChange={(e) => setEditingPackage({ ...editingPackage, price: Math.round(parseFloat(e.target.value) * 100) || 0 })}
                                className="h-8"
                                placeholder="e.g. 10.00"
                              />
                            </div>
                          </div>
                          <div className="grid grid-cols-3 gap-3">
                            <div>
                              <label className="text-xs text-muted-foreground">Credits</label>
                              <Input
                                type="number"
                                value={editingPackage.credits}
                                onChange={(e) => setEditingPackage({ ...editingPackage, credits: parseInt(e.target.value) || 1 })}
                                className="h-8"
                              />
                            </div>
                            <div>
                              <label className="text-xs text-muted-foreground">Bonus</label>
                              <Input
                                type="number"
                                value={editingPackage.bonusCredits}
                                onChange={(e) => setEditingPackage({ ...editingPackage, bonusCredits: parseInt(e.target.value) || 0 })}
                                className="h-8"
                              />
                            </div>
                            <div>
                              <label className="text-xs text-muted-foreground">Order</label>
                              <Input
                                type="number"
                                value={editingPackage.sortOrder}
                                onChange={(e) => setEditingPackage({ ...editingPackage, sortOrder: parseInt(e.target.value) || 0 })}
                                className="h-8"
                              />
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button size="sm" onClick={() => updatePackageMutation.mutate({
                              id: editingPackage.id,
                              name: editingPackage.name,
                              price: editingPackage.price,
                              credits: editingPackage.credits,
                              bonusCredits: editingPackage.bonusCredits,
                              sortOrder: editingPackage.sortOrder,
                              isActive: editingPackage.isActive,
                              category: editingPackage.category,
                            })} disabled={updatePackageMutation.isPending}>
                              {updatePackageMutation.isPending ? "Saving..." : "Save"}
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => setEditingPackage(null)}>Cancel</Button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="font-semibold">{pkg.name}</h4>
                              <Badge variant={pkg.isActive ? "default" : "secondary"} className="text-xs">
                                {pkg.isActive ? "Active" : "Inactive"}
                              </Badge>
                            </div>
                            <div className="text-sm text-muted-foreground mt-1">
                              <span className="font-medium text-accent">{(pkg.price / 100).toFixed(2)} AED</span>
                              {" - "}
                              {pkg.credits} credit{pkg.credits > 1 ? "s" : ""}
                              {pkg.bonusCredits > 0 && <span className="text-green-600"> +{pkg.bonusCredits} free</span>}
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button size="icon" variant="ghost" onClick={() => setEditingPackage(pkg)}>
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            <Button size="icon" variant="ghost" onClick={() => updatePackageMutation.mutate({ id: pkg.id, isActive: !pkg.isActive })}>
                              {pkg.isActive ? <XCircle className="h-4 w-4" /> : <CheckCircle className="h-4 w-4" />}
                            </Button>
                            <Button size="icon" variant="ghost" className="text-destructive" onClick={() => deletePackageMutation.mutate(pkg.id)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="revenue" className="space-y-4">
            <div className="flex gap-2 p-1 bg-secondary rounded-lg flex-wrap">
              {(['day', 'week', 'month', 'year', 'all', 'custom'] as const).map((period) => (
                <button
                  key={period}
                  onClick={() => setRevenuePeriod(period)}
                  className={`flex-1 py-2 px-2 rounded-md text-xs font-medium transition-colors min-w-[60px] ${
                    revenuePeriod === period ? "bg-background shadow-sm" : "text-muted-foreground"
                  }`}
                  data-testid={`button-revenue-${period}`}
                >
                  {period === 'day' ? 'Today' : period === 'week' ? 'Week' : period === 'month' ? 'Month' : period === 'year' ? 'Year' : period === 'all' ? 'All' : 'Custom'}
                </button>
              ))}
            </div>

            {revenuePeriod === 'custom' && (
              <div className="flex gap-2 items-center">
                <div className="flex-1">
                  <label className="text-xs text-muted-foreground mb-1 block">From</label>
                  <Input
                    type="date"
                    value={customDateRange.startDate}
                    onChange={(e) => setCustomDateRange(prev => ({ ...prev, startDate: e.target.value }))}
                    className="text-sm"
                    data-testid="input-revenue-start-date"
                  />
                </div>
                <div className="flex-1">
                  <label className="text-xs text-muted-foreground mb-1 block">To</label>
                  <Input
                    type="date"
                    value={customDateRange.endDate}
                    onChange={(e) => setCustomDateRange(prev => ({ ...prev, endDate: e.target.value }))}
                    className="text-sm"
                    data-testid="input-revenue-end-date"
                  />
                </div>
              </div>
            )}

            <p className="text-center text-sm text-muted-foreground">
              {detailedRevenueStats?.periodLabel || 'All Time'}
            </p>

            <div className="grid grid-cols-2 gap-3">
              <Card className="bg-green-500/10 border-green-500/30">
                <CardContent className="p-4 text-center">
                  <DollarSign className="h-8 w-8 mx-auto text-green-600 mb-2" />
                  <p className="text-2xl font-bold text-green-600">AED {detailedRevenueStats?.totalRevenue || 0}</p>
                  <p className="text-xs text-muted-foreground">Total Revenue</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <TrendingUp className="h-8 w-8 mx-auto text-accent mb-2" />
                  <p className="text-2xl font-bold">{detailedRevenueStats?.transactionCount || 0}</p>
                  <p className="text-xs text-muted-foreground">Transactions</p>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
                      <Package className="h-5 w-5 text-accent" />
                    </div>
                    <div>
                      <p className="text-lg font-bold">AED {detailedRevenueStats?.sparePartsRevenue || 0}</p>
                      <p className="text-xs text-muted-foreground">Spare Parts</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
                      <Car className="h-5 w-5 text-accent" />
                    </div>
                    <div>
                      <p className="text-lg font-bold">AED {detailedRevenueStats?.automotiveRevenue || 0}</p>
                      <p className="text-xs text-muted-foreground">Automotive</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">All-Time Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Total Revenue (All Time)</span>
                  <span className="font-medium">AED {revenueStats?.totalRevenue || 0}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Total Transactions</span>
                  <span className="font-medium">{revenueStats?.transactionCount || 0}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Spare Parts Revenue</span>
                  <span className="font-medium">AED {revenueStats?.sparePartsRevenue || 0}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Automotive Revenue</span>
                  <span className="font-medium">AED {revenueStats?.automotiveRevenue || 0}</span>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="users" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Users className="h-4 w-4" />
                  User Management ({allUsers.length} total)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by name, phone, or email..."
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    className="pl-9 h-9"
                    data-testid="input-user-search"
                  />
                </div>
                
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {allUsers
                    .filter((user) => {
                      if (!userSearch) return true;
                      const search = userSearch.toLowerCase();
                      return (
                        user.firstName?.toLowerCase().includes(search) ||
                        user.lastName?.toLowerCase().includes(search) ||
                        user.phone?.includes(search) ||
                        user.email?.toLowerCase().includes(search)
                      );
                    })
                    .map((user) => (
                      <div 
                        key={user.id} 
                        className="flex items-center justify-between p-3 border rounded-lg"
                        data-testid={`user-row-${user.id}`}
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-sm truncate">
                              {user.firstName || ""} {user.lastName || ""}
                              {!user.firstName && !user.lastName && <span className="text-muted-foreground">No name</span>}
                            </p>
                            {user.isAdmin && (
                              <Badge variant="secondary" className="text-xs">Admin</Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground truncate">
                            {user.phone || user.email || "No contact info"}
                          </p>
                          <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                            <span>Parts: {user.sparePartsCredits} credits</span>
                            <span>Auto: {user.automotiveCredits} credits</span>
                            {user.createdAt && (
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {new Date(user.createdAt).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                        </div>
                        {!user.isAdmin && (
                          <Button
                            size="icon"
                            variant="ghost"
                            className="text-destructive"
                            onClick={() => {
                              if (confirm(`Are you sure you want to delete ${user.firstName || "this user"}'s account? This cannot be undone.`)) {
                                deleteUserMutation.mutate(user.id);
                              }
                            }}
                            data-testid={`button-delete-user-${user.id}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                  {allUsers.length === 0 && (
                    <p className="text-center text-sm text-muted-foreground py-4">
                      No registered users yet
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Settings className="h-4 w-4" />
                  Subscription Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between py-3 border-b">
                  <div>
                    <p className="font-medium text-sm">Credit System</p>
                    <p className="text-xs text-muted-foreground">
                      When enabled, users need credits to post
                    </p>
                  </div>
                  <Switch
                    checked={settings?.subscriptionEnabled || false}
                    onCheckedChange={(checked) => updateSettingsMutation.mutate({ subscriptionEnabled: checked })}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  {settings?.subscriptionEnabled 
                    ? "Users need to purchase credits to post listings (1 credit per listing)"
                    : "Posting is free for all users"}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Package className="h-4 w-4" />
                  Demo Content
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Add or remove sample listings to showcase the marketplace to reviewers.
                </p>
                <div className="flex gap-2">
                  <Button 
                    onClick={() => seedDemoMutation.mutate()}
                    disabled={seedDemoMutation.isPending || clearDemoMutation.isPending}
                    data-testid="button-seed-demo"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    {seedDemoMutation.isPending ? "Adding..." : "Add Demo Content"}
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => clearDemoMutation.mutate()}
                    disabled={seedDemoMutation.isPending || clearDemoMutation.isPending}
                    data-testid="button-clear-demo"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    {clearDemoMutation.isPending ? "Removing..." : "Clear Demo"}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Database Status Check */}
            <div className="rounded-2xl overflow-hidden bg-gradient-to-br from-[#1e293b] to-[#0f172a] p-5 shadow-xl">
              <div className="flex items-center justify-between gap-3 mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-500 flex items-center justify-center">
                    <Settings className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-white font-bold text-lg">Database Status</h3>
                    <p className="text-white/60 text-xs">Check production database connection</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={async () => {
                      try {
                        const res: any = await apiRequest("GET", "/api/admin/db-status");
                        toast({
                          title: `DB Status (${res.version || 'unknown'})`,
                          description: `Users: ${res.users}, Tokens: ${res.deviceTokens}, Notifications: ${res.notifications}`
                        });
                      } catch (err) {
                        toast({ title: "Error", description: "Failed to check DB status", variant: "destructive" });
                      }
                    }}
                    className="bg-blue-500 hover:bg-blue-600 text-white"
                    data-testid="button-check-db-status"
                  >
                    Check Status
                  </Button>
                  <Button
                    onClick={async () => {
                      try {
                        const res: any = await apiRequest("POST", "/api/admin/test-token");
                        toast({
                          title: res.success ? "Test Token Created" : "Failed",
                          description: `Total tokens: ${res.tokenCount}`
                        });
                      } catch (err) {
                        toast({ title: "Error", description: "Failed to create test token", variant: "destructive" });
                      }
                    }}
                    className="bg-green-500 hover:bg-green-600 text-white"
                    data-testid="button-create-test-token"
                  >
                    Create Test Token
                  </Button>
                </div>
              </div>
            </div>

            {/* Broadcast Notification - Modern Styled Card */}
            <div className="rounded-2xl overflow-hidden bg-gradient-to-br from-[#1e293b] to-[#0f172a] p-5 shadow-xl">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-[#f97316] flex items-center justify-center">
                  <Bell className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="text-white font-bold text-lg">Broadcast Notification</h3>
                  <p className="text-white/60 text-xs">Send push notifications to all users</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-white/70 text-xs font-medium mb-1.5 block">Title</label>
                  <Input
                    placeholder="Enter notification title..."
                    value={broadcastNotification.title}
                    onChange={(e) => setBroadcastNotification({ ...broadcastNotification, title: e.target.value })}
                    className="h-11 bg-white/10 border-white/20 text-white placeholder:text-white/40 rounded-xl focus:border-[#f97316] focus:ring-[#f97316]"
                    data-testid="input-broadcast-title"
                  />
                </div>
                
                <div>
                  <label className="text-white/70 text-xs font-medium mb-1.5 block">Message</label>
                  <Textarea
                    placeholder="Write your message here..."
                    value={broadcastNotification.body}
                    onChange={(e) => setBroadcastNotification({ ...broadcastNotification, body: e.target.value })}
                    className="min-h-[100px] bg-white/10 border-white/20 text-white placeholder:text-white/40 rounded-xl focus:border-[#f97316] focus:ring-[#f97316] resize-none"
                    data-testid="input-broadcast-body"
                  />
                </div>

                <div>
                  <label className="text-white/70 text-xs font-medium mb-2 block">When to Send</label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setBroadcastNotification({ ...broadcastNotification, scheduleType: "now" })}
                      className={`py-2.5 px-3 rounded-xl text-sm font-medium transition-all ${
                        broadcastNotification.scheduleType === "now"
                          ? "bg-[#f97316] text-white"
                          : "bg-white/10 text-white/70 hover:bg-white/20"
                      }`}
                      data-testid="button-schedule-now"
                    >
                      Send Now
                    </button>
                    <button
                      type="button"
                      onClick={() => setBroadcastNotification({ ...broadcastNotification, scheduleType: "delay" })}
                      className={`py-2.5 px-3 rounded-xl text-sm font-medium transition-all ${
                        broadcastNotification.scheduleType === "delay"
                          ? "bg-[#f97316] text-white"
                          : "bg-white/10 text-white/70 hover:bg-white/20"
                      }`}
                      data-testid="button-schedule-delay"
                    >
                      Delay
                    </button>
                    <button
                      type="button"
                      onClick={() => setBroadcastNotification({ ...broadcastNotification, scheduleType: "scheduled" })}
                      className={`py-2.5 px-3 rounded-xl text-sm font-medium transition-all ${
                        broadcastNotification.scheduleType === "scheduled"
                          ? "bg-[#f97316] text-white"
                          : "bg-white/10 text-white/70 hover:bg-white/20"
                      }`}
                      data-testid="button-schedule-date"
                    >
                      Schedule
                    </button>
                  </div>
                </div>

                {broadcastNotification.scheduleType === "delay" && (
                  <div className="bg-white/5 rounded-xl p-3">
                    <label className="text-white/70 text-xs font-medium mb-2 block">Delay (minutes)</label>
                    <div className="flex items-center gap-3">
                      <input
                        type="range"
                        min="5"
                        max="120"
                        step="5"
                        value={broadcastNotification.delayMinutes}
                        onChange={(e) => setBroadcastNotification({ ...broadcastNotification, delayMinutes: parseInt(e.target.value) })}
                        className="flex-1 accent-[#f97316]"
                        data-testid="input-delay-minutes"
                      />
                      <span className="text-white font-medium min-w-[60px] text-right">
                        {broadcastNotification.delayMinutes} min
                      </span>
                    </div>
                  </div>
                )}

                {broadcastNotification.scheduleType === "scheduled" && (
                  <div className="bg-white/5 rounded-xl p-3 space-y-3">
                    <div>
                      <label className="text-white/70 text-xs font-medium mb-1.5 block">Date</label>
                      <Input
                        type="date"
                        value={broadcastNotification.scheduledDate}
                        onChange={(e) => setBroadcastNotification({ ...broadcastNotification, scheduledDate: e.target.value })}
                        className="h-10 bg-white/10 border-white/20 text-white rounded-xl"
                        data-testid="input-schedule-date"
                      />
                    </div>
                    <div>
                      <label className="text-white/70 text-xs font-medium mb-1.5 block">Time</label>
                      <Input
                        type="time"
                        value={broadcastNotification.scheduledTime}
                        onChange={(e) => setBroadcastNotification({ ...broadcastNotification, scheduledTime: e.target.value })}
                        className="h-10 bg-white/10 border-white/20 text-white rounded-xl"
                        data-testid="input-schedule-time"
                      />
                    </div>
                  </div>
                )}

                <Button 
                  onClick={() => broadcastMutation.mutate(broadcastNotification)}
                  disabled={!broadcastNotification.title || !broadcastNotification.body || broadcastMutation.isPending}
                  className="w-full h-12 bg-[#f97316] hover:bg-[#ea580c] text-white font-semibold rounded-xl shadow-lg shadow-orange-500/25"
                  data-testid="button-send-broadcast"
                >
                  <Send className="h-4 w-4 mr-2" />
                  {broadcastMutation.isPending 
                    ? "Sending..." 
                    : broadcastNotification.scheduleType === "now" 
                      ? "Send to All Users" 
                      : broadcastNotification.scheduleType === "delay"
                        ? `Send in ${broadcastNotification.delayMinutes} minutes`
                        : "Schedule Notification"
                  }
                </Button>
              </div>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Image className="h-4 w-4" />
                  Banners
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <Input
                    placeholder="Banner Title"
                    value={newBanner.title}
                    onChange={(e) => setNewBanner({ ...newBanner, title: e.target.value })}
                    className="h-9"
                  />
                  <Input
                    placeholder="Subtitle"
                    value={newBanner.subtitle}
                    onChange={(e) => setNewBanner({ ...newBanner, subtitle: e.target.value })}
                    className="h-9"
                  />
                </div>
                <Input
                  placeholder="Image URL (https://...)"
                  value={newBanner.imageUrl}
                  onChange={(e) => setNewBanner({ ...newBanner, imageUrl: e.target.value })}
                  className="h-9"
                />
                <div className="grid grid-cols-2 gap-3">
                  <Input
                    placeholder="Button Text"
                    value={newBanner.buttonText}
                    onChange={(e) => setNewBanner({ ...newBanner, buttonText: e.target.value })}
                    className="h-9"
                  />
                  <Input
                    placeholder="Link URL"
                    value={newBanner.linkUrl}
                    onChange={(e) => setNewBanner({ ...newBanner, linkUrl: e.target.value })}
                    className="h-9"
                  />
                </div>
                <Button 
                  size="sm"
                  onClick={() => createBannerMutation.mutate(newBanner)}
                  disabled={!newBanner.title || !newBanner.imageUrl || createBannerMutation.isPending}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add Banner
                </Button>

                {banners.length > 0 && (
                  <div className="space-y-2 pt-4 border-t">
                    <h4 className="text-sm font-medium">Existing Banners ({banners.length})</h4>
                    {banners.map((banner) => (
                      <div key={banner.id} className="flex items-center gap-3 p-2 bg-secondary/50 rounded-lg">
                        <img src={banner.imageUrl} alt={banner.title} className="w-16 h-10 object-cover rounded" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{banner.title}</p>
                          <Badge variant={banner.isActive ? "default" : "secondary"} className="text-xs">
                            {banner.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </div>
                        <div className="flex gap-1">
                          <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => updateBannerMutation.mutate({ id: banner.id, isActive: !banner.isActive })}>
                            {banner.isActive ? <XCircle className="h-3 w-3" /> : <CheckCircle className="h-3 w-3" />}
                          </Button>
                          <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => deleteBannerMutation.mutate(banner.id)}>
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </PullToRefresh>
  );
}

function ListingCard({
  listing,
  onApprove,
  onReject,
  onDelete,
  showActions,
  getStatusBadge,
  isSelected = false,
  onToggleSelect,
  showCheckbox = false,
}: {
  listing: Product;
  onApprove: () => void;
  onReject: (reason: string) => void;
  onDelete: () => void;
  showActions: boolean;
  getStatusBadge: (status: string) => JSX.Element;
  isSelected?: boolean;
  onToggleSelect?: () => void;
  showCheckbox?: boolean;
}) {
  const [rejectReason, setRejectReason] = useState("");
  const [showRejectForm, setShowRejectForm] = useState(false);

  return (
    <Card className={isSelected ? "ring-2 ring-primary" : ""}>
      <CardContent className="p-4">
        <div className="flex gap-3">
          {showCheckbox && (
            <div className="flex items-center">
              <Checkbox
                checked={isSelected}
                onCheckedChange={onToggleSelect}
                data-testid={`checkbox-listing-${listing.id}`}
              />
            </div>
          )}
          <img
            src={listing.imageUrl}
            alt={listing.title}
            className="w-20 h-20 object-cover rounded-lg flex-shrink-0"
          />
          <div className="flex-1 min-w-0 overflow-hidden">
            <div className="flex items-start gap-2">
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-sm truncate">{listing.title}</h3>
                <p className="text-xs text-muted-foreground">
                  {listing.mainCategory} / {listing.subCategory}
                </p>
                {listing.price && (
                  <p className="text-sm font-bold text-accent mt-0.5">
                    AED {(listing.price / 100).toLocaleString()}
                  </p>
                )}
              </div>
              {getStatusBadge(listing.status)}
            </div>
            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{listing.description}</p>

            {showActions && (
              <div className="flex gap-2 mt-3">
                <Button size="sm" className="h-7 text-xs" onClick={onApprove}>
                  <Check className="h-3 w-3 mr-1" /> Approve
                </Button>
                <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => setShowRejectForm(!showRejectForm)}>
                  <X className="h-3 w-3 mr-1" /> Reject
                </Button>
                <Button size="sm" variant="destructive" className="h-7 text-xs" onClick={onDelete}>
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            )}

            {showRejectForm && (
              <div className="mt-3 flex gap-2">
                <Textarea
                  placeholder="Reason for rejection..."
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  className="h-16 text-xs"
                />
                <Button
                  size="sm"
                  variant="destructive"
                  className="h-16"
                  onClick={() => {
                    onReject(rejectReason);
                    setShowRejectForm(false);
                    setRejectReason("");
                  }}
                >
                  OK
                </Button>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
