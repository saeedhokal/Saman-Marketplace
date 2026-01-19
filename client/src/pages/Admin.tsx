import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Check, X, Trash2, Clock, CheckCircle, XCircle, Settings, List, Image } from "lucide-react";
import type { Product, AppSettings } from "@shared/schema";
import { Link } from "wouter";

export default function Admin() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

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

  const [settingsForm, setSettingsForm] = useState({
    bannerTitle: "",
    bannerSubtitle: "",
    bannerImageUrl: "",
    introVideoUrl: "",
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
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="container mx-auto max-w-6xl">
        <div className="flex items-center justify-between mb-8">
          <h1 className="font-display text-3xl font-bold">Admin Panel</h1>
          <Link href="/">
            <Button variant="outline">Back to App</Button>
          </Link>
        </div>

        <Tabs defaultValue="pending" className="space-y-6">
          <TabsList className="grid grid-cols-3 w-full max-w-md">
            <TabsTrigger value="pending" className="gap-2">
              <Clock className="h-4 w-4" />
              Pending ({pendingListings?.length || 0})
            </TabsTrigger>
            <TabsTrigger value="all" className="gap-2">
              <List className="h-4 w-4" />
              All Listings
            </TabsTrigger>
            <TabsTrigger value="settings" className="gap-2">
              <Settings className="h-4 w-4" />
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

          <TabsContent value="settings" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Image className="h-5 w-5" />
                  Banner & Intro Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Banner Title</label>
                  <Input
                    placeholder="e.g. UAE's Marketplace for Parts & Vehicles"
                    value={settingsForm.bannerTitle || settings?.bannerTitle || ""}
                    onChange={(e) => setSettingsForm({ ...settingsForm, bannerTitle: e.target.value })}
                    data-testid="input-banner-title"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Banner Subtitle</label>
                  <Input
                    placeholder="e.g. Find spare parts and vehicles from trusted sellers"
                    value={settingsForm.bannerSubtitle || settings?.bannerSubtitle || ""}
                    onChange={(e) => setSettingsForm({ ...settingsForm, bannerSubtitle: e.target.value })}
                    data-testid="input-banner-subtitle"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Banner Image URL</label>
                  <Input
                    placeholder="https://..."
                    value={settingsForm.bannerImageUrl || settings?.bannerImageUrl || ""}
                    onChange={(e) => setSettingsForm({ ...settingsForm, bannerImageUrl: e.target.value })}
                    data-testid="input-banner-image"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Intro Video URL</label>
                  <Input
                    placeholder="https://youtube.com/..."
                    value={settingsForm.introVideoUrl || settings?.introVideoUrl || ""}
                    onChange={(e) => setSettingsForm({ ...settingsForm, introVideoUrl: e.target.value })}
                    data-testid="input-intro-video"
                  />
                </div>
                <Button
                  onClick={() => updateSettingsMutation.mutate(settingsForm)}
                  disabled={updateSettingsMutation.isPending}
                  data-testid="button-save-settings"
                >
                  Save Settings
                </Button>
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
                <p className="text-lg font-bold text-accent mt-1">
                  AED {(listing.price / 100).toLocaleString()}
                </p>
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
