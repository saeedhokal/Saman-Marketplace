const PUSH_DESTINATIONS: Record<string, string> = {
  new_listing: "/admin",
  listing_approved: "/my-listings",
  listing_rejected: "/my-listings",
  credits_added: "/profile",
};

function isSafeInternalPath(value: unknown): value is string {
  return (
    typeof value === "string" &&
    value.startsWith("/") &&
    !value.startsWith("//") &&
    !/^\/[a-zA-Z][a-zA-Z0-9+\-.]*:/.test(value)
  );
}

export function getPushNotificationPath(data: Record<string, unknown> | undefined): string | null {
  if (!data) return null;
  if (isSafeInternalPath(data.path)) return data.path;
  return typeof data.type === "string" ? PUSH_DESTINATIONS[data.type] ?? null : null;
}