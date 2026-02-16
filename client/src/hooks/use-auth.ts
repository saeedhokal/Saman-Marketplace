import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Capacitor } from '@capacitor/core';
import type { User } from "@shared/models/auth";

const FCM_TOKEN_KEY = 'saman_fcm_token';
const USER_ID_KEY = 'saman_user_id';

// Store user ID in localStorage for iOS compatibility (session cookies don't work in Capacitor)
function storeUserId(userId: string | null): void {
  if (userId) {
    localStorage.setItem(USER_ID_KEY, userId);
  } else {
    localStorage.removeItem(USER_ID_KEY);
  }
}

// Get stored user ID from localStorage
export function getStoredUserId(): string | null {
  return localStorage.getItem(USER_ID_KEY);
}

async function unregisterPushToken(): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;
  
  const storedToken = localStorage.getItem(FCM_TOKEN_KEY);
  if (!storedToken) return;
  
  try {
    await fetch('/api/device-token', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ fcmToken: storedToken }),
    });
    localStorage.removeItem(FCM_TOKEN_KEY);
  } catch (error) {
    console.error('Failed to unregister push token:', error);
  }
}

async function fetchUser(): Promise<User | null> {
  const response = await fetch("/api/auth/user", {
    credentials: "include",
  });

  if (response.status === 401) {
    // Don't clear stored user ID on 401 - iOS Capacitor has cookie issues
    // The stored ID is still valid even if cookies aren't sent
    return null;
  }

  if (!response.ok) {
    throw new Error(`${response.status}: ${response.statusText}`);
  }

  const user = await response.json();
  // Store user ID for iOS compatibility
  storeUserId(user?.id || null);
  return user;
}

async function logoutFn(): Promise<void> {
  await unregisterPushToken();
  storeUserId(null); // Clear stored user ID
  await fetch("/api/auth/logout", {
    method: "POST",
    credentials: "include",
  });
}

interface LoginParams {
  phone: string;
  password: string;
}

interface RegisterParams {
  phone: string;
  password: string;
  firstName: string;
  lastName: string;
  email?: string;
}

async function loginFn(params: LoginParams): Promise<User> {
  const response = await fetch("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(params),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Login failed");
  }
  
  const user = await response.json();
  storeUserId(user?.id || null);
  return user;
}

async function registerFn(params: RegisterParams): Promise<User> {
  const response = await fetch("/api/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(params),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Registration failed");
  }
  
  const user = await response.json();
  storeUserId(user?.id || null);
  return user;
}

export function useAuth() {
  const queryClient = useQueryClient();
  const { data: user, isLoading, isFetching, status, fetchStatus } = useQuery<User | null>({
    queryKey: ["/api/auth/user"],
    queryFn: fetchUser,
    retry: false,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
  
  // Consider loading if: 
  // 1. Initial load (isLoading)
  // 2. Query is pending and we have no cached data yet
  // 3. Actively fetching with no user data established
  const isAuthLoading = isLoading || (status === 'pending') || (fetchStatus === 'fetching' && user === undefined);

  const logoutMutation = useMutation({
    mutationFn: logoutFn,
    onSuccess: () => {
      queryClient.setQueryData(["/api/auth/user"], null);
      queryClient.invalidateQueries({ queryKey: ["/api/user/credits"] });
    },
  });

  const loginMutation = useMutation({
    mutationFn: loginFn,
    onSuccess: (user) => {
      queryClient.setQueryData(["/api/auth/user"], user);
      queryClient.invalidateQueries({ queryKey: ["/api/user/credits"] });
    },
  });

  const registerMutation = useMutation({
    mutationFn: registerFn,
    onSuccess: (user) => {
      queryClient.setQueryData(["/api/auth/user"], user);
      queryClient.invalidateQueries({ queryKey: ["/api/user/credits"] });
    },
  });

  return {
    user,
    isLoading: isAuthLoading,
    isAuthenticated: !!user,
    logout: logoutMutation.mutate,
    isLoggingOut: logoutMutation.isPending,
    login: loginMutation.mutateAsync,
    isLoggingIn: loginMutation.isPending,
    register: registerMutation.mutateAsync,
    isRegistering: registerMutation.isPending,
  };
}
