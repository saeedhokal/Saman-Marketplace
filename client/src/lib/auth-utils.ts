export function isUnauthorizedError(error: Error): boolean {
  return /^401: .*Unauthorized/.test(error.message);
}

// Redirect to login with a toast notification
export function redirectToLogin(toast?: (options: { title: string; description: string; variant: string }) => void) {
  if (toast) {
    toast({
      title: "Unauthorized",
      description: "You are logged out. Logging in again...",
      variant: "destructive",
    });
  }
  setTimeout(() => {
    const currentPath = window.location.pathname + window.location.search;
    const returnTo = currentPath.startsWith("/") && !currentPath.startsWith("//") ? currentPath : "/";
    window.location.href = `/auth?returnTo=${encodeURIComponent(returnTo)}`;
  }, 500);
}
