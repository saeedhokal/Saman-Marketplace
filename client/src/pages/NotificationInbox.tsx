import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { ArrowLeft, Bell, Check, Trash2, PackageX, CreditCard, Clock, Package, Megaphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { formatDistanceToNow } from "date-fns";
import { useEffect, useRef } from "react";

interface Notification {
  id: number;
  userId: string;
  type: string;
  title: string;
  message: string;
  relatedId: number | null;
  isRead: boolean;
  createdAt: string;
}

export default function NotificationInbox() {
  const [, navigate] = useLocation();
  const hasMarkedAsRead = useRef(false);

  const { data: notifications = [], isLoading } = useQuery<Notification[]>({
    queryKey: ["/api/notifications"],
  });

  // Mark all as read when page opens
  useEffect(() => {
    if (!isLoading && notifications.length > 0 && !hasMarkedAsRead.current) {
      const hasUnread = notifications.some(n => !n.isRead);
      if (hasUnread) {
        hasMarkedAsRead.current = true;
        apiRequest("POST", "/api/notifications/mark-all-read").then(() => {
          queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
          queryClient.invalidateQueries({ queryKey: ["/api/notifications/unread-count"] });
        });
      }
    }
  }, [isLoading, notifications]);

  const markAsReadMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("POST", `/api/notifications/${id}/read`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
      queryClient.invalidateQueries({ queryKey: ["/api/notifications/unread-count"] });
    },
  });

  const clearAllMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("DELETE", "/api/notifications");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
      queryClient.invalidateQueries({ queryKey: ["/api/notifications/unread-count"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/notifications/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
      queryClient.invalidateQueries({ queryKey: ["/api/notifications/unread-count"] });
    },
  });

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.isRead) {
      markAsReadMutation.mutate(notification.id);
    }
    
    if (notification.type === "listing_rejected" && notification.relatedId) {
      navigate(`/my-listings`);
    } else if (notification.type === "listing_approved" && notification.relatedId) {
      navigate(`/product/${notification.relatedId}`);
    } else if (notification.type === "credit_added") {
      navigate(`/profile/credits`);
    } else if (notification.type === "new_listing_request") {
      navigate(`/admin`);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "listing_rejected":
        return (
          <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
            <PackageX className="h-5 w-5 text-red-500" />
          </div>
        );
      case "listing_approved":
        return (
          <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
            <Check className="h-5 w-5 text-green-500" />
          </div>
        );
      case "credit_added":
        return (
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
            <CreditCard className="h-5 w-5 text-primary" />
          </div>
        );
      case "listing_expiring":
        return (
          <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
            <Clock className="h-5 w-5 text-amber-600" />
          </div>
        );
      case "new_listing_request":
        return (
          <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
            <Package className="h-5 w-5 text-blue-500" />
          </div>
        );
      case "broadcast":
        return (
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
            <Megaphone className="h-5 w-5 text-white" />
          </div>
        );
      default:
        return (
          <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
            <Bell className="h-5 w-5 text-primary" />
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-background pb-28">
      <div className="sticky top-0 z-40 bg-background border-b border-border">
        <div className="container mx-auto px-4">
          <div className="flex items-center h-14">
            <button 
              onClick={() => navigate("/")}
              className="p-2 -ml-2 rounded-lg hover-elevate transition-colors" 
              data-testid="button-back"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <h1 className="flex-1 text-center font-semibold text-lg">Notifications</h1>
            {notifications.length > 0 ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => clearAllMutation.mutate()}
                disabled={clearAllMutation.isPending}
                data-testid="button-clear-all"
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Clear All
              </Button>
            ) : (
              <div className="w-20" />
            )}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-4">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="animate-pulse text-muted-foreground">Loading notifications...</div>
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-4">
              <Bell className="h-10 w-10 text-primary" />
            </div>
            <h3 className="text-lg font-semibold mb-2">No Notifications Yet</h3>
            <p className="text-muted-foreground text-sm max-w-xs">
              You'll receive updates about your listings, credits, and account activity here.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                onClick={() => handleNotificationClick(notification)}
                className={`relative flex items-start gap-3 p-4 rounded-lg cursor-pointer hover-elevate transition-all border ${
                  notification.isRead 
                    ? "bg-background border-border" 
                    : "bg-primary/5 border-primary/20"
                }`}
                data-testid={`notification-item-${notification.id}`}
              >
                {!notification.isRead && (
                  <div className="absolute left-2 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-primary" />
                )}
                
                <div className="flex-shrink-0 ml-2">
                  {getNotificationIcon(notification.type)}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <h4 className={`font-semibold text-sm ${!notification.isRead ? "text-foreground" : "text-muted-foreground"}`}>
                        {notification.title}
                      </h4>
                      <p className={`text-sm mt-1 line-clamp-2 ${!notification.isRead ? "text-foreground/80" : "text-muted-foreground"}`}>
                        {notification.message}
                      </p>
                      <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteMutation.mutate(notification.id);
                      }}
                      data-testid={`button-delete-notification-${notification.id}`}
                    >
                      <Trash2 className="h-4 w-4 text-muted-foreground" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
