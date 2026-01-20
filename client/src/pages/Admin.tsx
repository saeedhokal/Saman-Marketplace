import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Check, X, Trash2, Clock, CheckCircle, XCircle, Settings, Image, Plus, ArrowLeft, Package, Car, DollarSign, TrendingUp, Edit2 } from "lucide-react";
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

  const { data: userInfo } = useQuery<{ credits: number; isAdmin: boolean }>({
    queryKey: ["/api/user/credits"],
  });

  const { data: pendingListings, isLoading: pendingLoading } = useQuery<Product[]>({
    queryKey: ["/api/admin/listings/pending"],
    enabled: !!userInfo?.isAdmin,
  });

  const { data: allListings, isLoading: allLoading } = useQuery<Product[]>({
    queryKey: ["/api/admin/listings"],
    enabled: !!userInfo?.isAdmin,
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

  const approveMutation = useMutation({
    mutationFn: (id: number) => apiRequest("POST", `/api/admin/listings/${id}/approve`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/listings"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/listings/pending"] });
      toast({ title: "Listing approved", description: "The listing is now visible to users." });
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
      toast({ title: "Demo listings added", description: "10 sample listings have been added to the marketplace." });
    },
    onError: () => {
      toast({ title: "Failed to add demo listings", variant: "destructive" });
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

  return (
    <div className="min-h-screen bg-background pb-20">
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
          <TabsList className="grid grid-cols-5 w-full">
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
                            <Input
                              value={editingPackage.name}
                              onChange={(e) => setEditingPackage({ ...editingPackage, name: e.target.value })}
                              className="h-8"
                            />
                            <Input
                              type="number"
                              value={editingPackage.price}
                              onChange={(e) => setEditingPackage({ ...editingPackage, price: parseInt(e.target.value) || 0 })}
                              className="h-8"
                            />
                          </div>
                          <div className="grid grid-cols-3 gap-3">
                            <Input
                              type="number"
                              value={editingPackage.credits}
                              onChange={(e) => setEditingPackage({ ...editingPackage, credits: parseInt(e.target.value) || 1 })}
                              className="h-8"
                            />
                            <Input
                              type="number"
                              value={editingPackage.bonusCredits}
                              onChange={(e) => setEditingPackage({ ...editingPackage, bonusCredits: parseInt(e.target.value) || 0 })}
                              className="h-8"
                            />
                            <Input
                              type="number"
                              value={editingPackage.sortOrder}
                              onChange={(e) => setEditingPackage({ ...editingPackage, sortOrder: parseInt(e.target.value) || 0 })}
                              className="h-8"
                            />
                          </div>
                          <div className="flex gap-2">
                            <Button size="sm" onClick={() => updatePackageMutation.mutate(editingPackage)}>Save</Button>
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
                              <span className="font-medium text-accent">AED {pkg.price}</span>
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
            <div className="grid grid-cols-2 gap-3">
              <Card className="bg-green-500/10 border-green-500/30">
                <CardContent className="p-4 text-center">
                  <DollarSign className="h-8 w-8 mx-auto text-green-600 mb-2" />
                  <p className="text-2xl font-bold text-green-600">AED {revenueStats?.totalRevenue || 0}</p>
                  <p className="text-xs text-muted-foreground">Total Revenue</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <TrendingUp className="h-8 w-8 mx-auto text-accent mb-2" />
                  <p className="text-2xl font-bold">{revenueStats?.transactionCount || 0}</p>
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
                      <p className="text-lg font-bold">AED {revenueStats?.sparePartsRevenue || 0}</p>
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
                      <p className="text-lg font-bold">AED {revenueStats?.automotiveRevenue || 0}</p>
                      <p className="text-xs text-muted-foreground">Automotive</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Revenue Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Detailed transaction history and analytics will appear here as users make purchases.
                </p>
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
                  Add sample listings to showcase the marketplace to reviewers.
                </p>
                <Button 
                  onClick={() => seedDemoMutation.mutate()}
                  disabled={seedDemoMutation.isPending}
                  data-testid="button-seed-demo"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  {seedDemoMutation.isPending ? "Adding..." : "Add 10 Demo Listings"}
                </Button>
              </CardContent>
            </Card>

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
    </div>
  );
}

function ListingCard({
  listing,
  onApprove,
  onReject,
  onDelete,
  showActions,
  getStatusBadge,
}: {
  listing: Product;
  onApprove: () => void;
  onReject: (reason: string) => void;
  onDelete: () => void;
  showActions: boolean;
  getStatusBadge: (status: string) => JSX.Element;
}) {
  const [rejectReason, setRejectReason] = useState("");
  const [showRejectForm, setShowRejectForm] = useState(false);

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex gap-3">
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
