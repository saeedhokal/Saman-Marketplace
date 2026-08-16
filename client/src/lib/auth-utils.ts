export function isUnauthorizedError(error: Error): boolean {
  return /^401: .*Unauthorized/.test(error.message);
}

/**
 * Validate a return-to path against the current origin.
 * Uses the URL constructor so that protocol-relative (//host) and
 * backslash (/\host) variants are correctly rejected alongside
 * absolute URLs — the simple startsWith check misses these.
 */
function sanitizeReturnTo(path: string): string {
  if (!path.startsWith("/")) return "/";
  try {
    const url = new URL(path, window.location.origin);
    if (url.origin === window.location.origin) return path;
  } catch {
    // Malformed URL
  }
  return "/";
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
    const returnTo = sanitizeReturnTo(currentPath);
    window.location.href = `/auth?returnTo=${encodeURIComponent(returnTo)}`;
  }, 500);
}
