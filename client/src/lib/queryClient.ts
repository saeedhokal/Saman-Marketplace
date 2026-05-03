import { QueryClient, QueryFunction } from "@tanstack/react-query";
import { Capacitor } from "@capacitor/core";

const USER_ID_KEY = "saman_user_id";
const AUTH_TOKEN_KEY = "saman_auth_token";

// On native (Capacitor) clients session cookies don't persist; send the
// signed auth token instead. Security-sensitive checks only trust the token.
export function getAuthHeaders(): Record<string, string> {
  const headers: Record<string, string> = {};
  try {
    if (typeof window !== "undefined" && Capacitor.isNativePlatform()) {
      const token = window.localStorage.getItem(AUTH_TOKEN_KEY);
      if (token) headers["x-auth-token"] = token;
      const id = window.localStorage.getItem(USER_ID_KEY);
      if (id) headers["x-user-id"] = id;
    }
  } catch {
    // localStorage may be unavailable; fall through
  }
  return headers;
}

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  const headers: Record<string, string> = { ...getAuthHeaders() };
  if (data) headers["Content-Type"] = "application/json";
  const res = await fetch(url, {
    method,
    headers,
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const res = await fetch(queryKey.join("/") as string, {
      credentials: "include",
      headers: getAuthHeaders(),
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
