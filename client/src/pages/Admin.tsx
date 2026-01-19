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
import { Check, X, Trash2, Clock, CheckCircle, XCircle, Settings, List, Image, Plus, GripVertical, ArrowLeft } from "lucide-react";
import type { Product, AppSettings, Banner } from "@shared/schema";
import { Link } from "wouter";

export default function Admin() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
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
        return <Badge variant="outline" className="bg-yellow-500/10 text-yellow-600"><Clock className="h-3 w-3 mr-1" /> Pending</Badge>;
      case "approved":
        return <Badge variant="outline" className="bg-green-500/10 text-green-600"><CheckCircle className="h-3 w-3 mr-1" /> Approved</Badge>;
      case "rejected":
        return <Badge variant="outline" className="bg-red-500/10 text-red-600"><XCircle className="h-3 w-3 mr-1" /> Rejected</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

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
        <Tabs defaultValue="pending" className="space-y-6">
          <TabsList className="grid grid-cols-4 w-full">
            <TabsTrigger value="pending" className="text-xs sm:text-sm">
              Pending ({pendingListings?.length || 0})
            </TabsTrigger>
            <TabsTrigger value="all" className="text-xs sm:text-sm">
              All
            </TabsTrigger>
            <TabsTrigger value="banners" className="text-xs sm:text-sm">
              Banners
            </TabsTrigger>
            <TabsTrigger value="settings" className="text-xs sm:text-sm">
              Settings
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pending" className="space-y-4">
            {pendingLoading ? (
              <div className="text-center py-10 text-muted-foreground">Loading...</div>
            ) : !pendingListings?.length ? (
              <Card>
                <CardContent className="py-10 text-center text-muted-foreground">
                  <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-500" />
                  <p>No pending listings to review</p>
                </CardContent>
              </Card>
            ) : (
              pendingListings.map((listing) => (
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

          <TabsContent value="banners" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plus className="h-5 w-5" />
                  Add New Banner
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Title *</label>
                    <Input
                      placeholder="e.g. Sell your Spare Parts"
                      value={newBanner.title}
                      onChange={(e) => setNewBanner({ ...newBanner, title: e.target.value })}
                      data-testid="input-new-banner-title"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">Subtitle</label>
                    <Input
                      placeholder="e.g. Easy and quick today!"
                      value={newBanner.subtitle}
                      onChange={(e) => setNewBanner({ ...newBanner, subtitle: e.target.value })}
                      data-testid="input-new-banner-subtitle"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Image URL *</label>
                  <Input
                    placeholder="https://..."
                    value={newBanner.imageUrl}
                    onChange={(e) => setNewBanner({ ...newBanner, imageUrl: e.target.value })}
                    data-testid="input-new-banner-image"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Button Text</label>
                    <Input
                      placeholder="e.g. View Offers"
                      value={newBanner.buttonText}
                      onChange={(e) => setNewBanner({ ...newBanner, buttonText: e.target.value })}
                      data-testid="input-new-banner-button"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">Link URL</label>
                    <Input
                      placeholder="/categories or https://..."
                      value={newBanner.linkUrl}
                      onChange={(e) => setNewBanner({ ...newBanner, linkUrl: e.target.value })}
                      data-testid="input-new-banner-link"
                    />
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Sort Order</label>
                    <Input
                      type="number"
                      value={newBanner.sortOrder}
                      onChange={(e) => setNewBanner({ ...newBanner, sortOrder: parseInt(e.target.value) || 0 })}
                      className="w-24"
                      data-testid="input-new-banner-order"
                    />
                  </div>
                  <div className="flex items-center gap-2 mt-6">
                    <Switch
                      checked={newBanner.isActive}
                      onCheckedChange={(checked) => setNewBanner({ ...newBanner, isActive: checked })}
                      data-testid="switch-new-banner-active"
                    />
                    <span className="text-sm">Active</span>
                  </div>
                </div>
                <Button 
                  onClick={() => createBannerMutation.mutate(newBanner)}
                  disabled={!newBanner.title || !newBanner.imageUrl || createBannerMutation.isPending}
                  data-testid="button-create-banner"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create Banner
                </Button>
              </CardContent>
            </Card>

            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Existing Banners ({banners.length})</h3>
              {banners.length === 0 ? (
                <Card>
                  <CardContent className="py-10 text-center text-muted-foreground">
                    <Image className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No banners yet. Create your first banner above.</p>
                  </CardContent>
                </Card>
              ) : (
                banners.map((banner) => (
                  <Card key={banner.id}>
                    <CardContent className="pt-4">
                      <div className="flex gap-4">
                        <div className="w-32 h-20 rounded-lg overflow-hidden bg-secondary flex-shrink-0">
                          {banner.imageUrl && (
                            <img src={banner.imageUrl} alt={banner.title} className="w-full h-full object-cover" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <h4 className="font-semibold">{banner.title}</h4>
                              {banner.subtitle && <p className="text-sm text-muted-foreground">{banner.subtitle}</p>}
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant={banner.isActive ? "default" : "secondary"}>
                                {banner.isActive ? "Active" : "Inactive"}
                              </Badge>
                              <span className="text-xs text-muted-foreground">Order: {banner.sortOrder}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 mt-3">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => updateBannerMutation.mutate({ id: banner.id, isActive: !banner.isActive })}
                              data-testid={`toggle-banner-${banner.id}`}
                            >
                              {banner.isActive ? "Disable" : "Enable"}
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => deleteBannerMutation.mutate(banner.id)}
                              data-testid={`delete-banner-${banner.id}`}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="settings" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Subscription Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between py-4 border-b">
                  <div>
                    <p className="font-medium">Credit System</p>
                    <p className="text-sm text-muted-foreground">
                      When enabled, users need credits to post listings
                    </p>
                  </div>
                  <Switch
                    checked={settings?.subscriptionEnabled || false}
                    onCheckedChange={(checked) => updateSettingsMutation.mutate({ subscriptionEnabled: checked })}
                    data-testid="switch-subscription"
                  />
                </div>
                <p className="text-sm text-muted-foreground">
                  {settings?.subscriptionEnabled 
                    ? "Users need to purchase credits to post listings (1 credit per listing)"
                    : "Posting is free for all users"}
                </p>
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
      <CardContent className="pt-6">
        <div className="flex gap-4">
          <img
            src={listing.imageUrl}
            alt={listing.title}
            className="w-24 h-24 object-cover rounded-lg flex-shrink-0"
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="font-semibold truncate">{listing.title}</h3>
                <p className="text-sm text-muted-foreground">
                  {listing.mainCategory} / {listing.subCategory}
                </p>
                {listing.price && (
                  <p className="text-lg font-bold text-accent mt-1">
                    AED {(listing.price / 100).toLocaleString()}
                  </p>
                )}
              </div>
              {getStatusBadge(listing.status)}
            </div>
            <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{listing.description}</p>
            
            {listing.phoneNumber && (
              <p className="text-xs text-muted-foreground mt-1">Phone: {listing.phoneNumber}</p>
            )}

            {showActions && (
              <div className="flex gap-2 mt-4">
                <Button size="sm" onClick={onApprove} data-testid={`button-approve-${listing.id}`}>
                  <Check className="h-4 w-4 mr-1" /> Approve
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowRejectForm(!showRejectForm)}
                  data-testid={`button-reject-${listing.id}`}
                >
                  <X className="h-4 w-4 mr-1" /> Reject
                </Button>
                <Button size="sm" variant="destructive" onClick={onDelete} data-testid={`button-delete-${listing.id}`}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            )}

            {showRejectForm && (
              <div className="mt-4 flex gap-2">
                <Textarea
                  placeholder="Reason for rejection..."
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  className="h-20"
                  data-testid={`input-reject-reason-${listing.id}`}
                />
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => {
                    onReject(rejectReason);
                    setShowRejectForm(false);
                    setRejectReason("");
                  }}
                  data-testid={`button-confirm-reject-${listing.id}`}
                >
                  Confirm
                </Button>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
