export function shouldNotifyAdminsForListingEdit(previousStatus: string): boolean {
  return previousStatus !== "pending";
}

export function deduplicateDeviceTokens<T extends { fcmToken: string }>(tokens: T[]): T[] {
  return Array.from(new Map(tokens.map(token => [token.fcmToken, token])).values());
}