import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { ArrowLeft, AlertTriangle, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
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

export default function DeleteAccount() {
  const { user, logout } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [showConfirm, setShowConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [confirmText, setConfirmText] = useState("");

  const handleDelete = async () => {
    if (confirmText !== "DELETE") {
      toast({
        title: "Confirmation required",
        description: "Please type DELETE to confirm account deletion",
        variant: "destructive",
      });
      return;
    }

    setIsDeleting(true);
    try {
      await apiRequest("DELETE", "/api/user/account");
      await logout();
      toast({
        title: "Account deleted",
        description: "Your account has been permanently deleted",
      });
      setLocation("/");
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete account. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
      setShowConfirm(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background pb-20 flex items-center justify-center">
        <div className="text-center px-4">
          <p className="text-muted-foreground">Please sign in first</p>
          <Link href="/auth">
            <Button className="mt-4" data-testid="button-signin">Sign In</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="sticky top-0 z-40 bg-background border-b border-border">
        <div className="container mx-auto px-4">
          <div className="flex items-center h-14">
            <Link href="/profile">
              <button className="p-2 -ml-2 rounded-lg hover:bg-secondary transition-colors" data-testid="button-back">
                <ArrowLeft className="h-5 w-5" />
              </button>
            </Link>
            <h1 className="flex-1 text-center font-semibold text-lg pr-8">Delete Account</h1>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        <div className="space-y-6">
          <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
              <div>
                <h2 className="font-semibold text-destructive">Warning: This action is permanent</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Deleting your account will permanently remove all your data, including your profile, 
                  listings, credits, and transaction history. This action cannot be undone.
                </p>
              </div>
            </div>
          </div>

          <section>
            <h2 className="font-semibold mb-3">What will be deleted:</h2>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-center gap-2">
                <span className="text-destructive">•</span>
                Your profile and account information
              </li>
              <li className="flex items-center gap-2">
                <span className="text-destructive">•</span>
                All your active and past listings
              </li>
              <li className="flex items-center gap-2">
                <span className="text-destructive">•</span>
                Your remaining credits (non-refundable)
              </li>
              <li className="flex items-center gap-2">
                <span className="text-destructive">•</span>
                Your saved favorites
              </li>
              <li className="flex items-center gap-2">
                <span className="text-destructive">•</span>
                Your transaction and credit history
              </li>
            </ul>
          </section>

          <section>
            <h2 className="font-semibold mb-3">Before you go:</h2>
            <p className="text-sm text-muted-foreground">
              If you're experiencing issues with the app, please consider contacting our support team 
              first. We'd love to help resolve any problems before you delete your account.
            </p>
            <Link href="/contact">
              <Button variant="outline" className="mt-3 w-full">
                Contact Support
              </Button>
            </Link>
          </section>

          <div className="pt-4 border-t border-border">
            <Button 
              variant="destructive" 
              className="w-full"
              onClick={() => setShowConfirm(true)}
              data-testid="button-delete-account"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete My Account
            </Button>
          </div>
        </div>
      </div>

      <AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription className="space-y-4">
              <p>
                This will permanently delete your account and all associated data. 
                This action cannot be undone.
              </p>
              <div>
                <p className="text-sm font-medium text-foreground mb-2">
                  Type DELETE to confirm:
                </p>
                <input
                  type="text"
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value)}
                  placeholder="DELETE"
                  className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground"
                  data-testid="input-confirm-delete"
                />
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting || confirmText !== "DELETE"}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Deleting..." : "Delete Account"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
