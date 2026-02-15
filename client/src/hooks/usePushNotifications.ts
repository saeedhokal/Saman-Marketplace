import { useEffect, useCallback, useRef } from 'react';
import { Capacitor } from '@capacitor/core';
import { PushNotifications, Token, ActionPerformed, PushNotificationSchema } from '@capacitor/push-notifications';
import { apiRequest } from '@/lib/queryClient';
import { useAuth } from '@/hooks/use-auth';
import { showInAppNotification } from '@/components/InAppNotificationBanner';

const TOKEN_KEY = 'saman_push_token';
const PENDING_TOKEN_KEY = 'saman_pending_push_token';

function navigateTo(path: string) {
  window.location.href = path;
}

export function usePushNotifications() {
  const { user } = useAuth();
  const userRef = useRef(user);
  const hasRegisteredRef = useRef(false);

  // Keep userRef in sync with user
  useEffect(() => {
    userRef.current = user;
  }, [user]);

  const registerTokenToServer = useCallback(async (token: string) => {
    try {
      console.log('[Push] Registering token with server...');
      console.log('[Push] Token (first 40 chars):', token.substring(0, 40));
      
      const response = await apiRequest('POST', '/api/device-token', {
        fcmToken: token,
        deviceOs: Capacitor.getPlatform(),
        deviceName: `${Capacitor.getPlatform()} device`,
      });
      
      console.log('[Push] Server response:', response);
      localStorage.setItem(TOKEN_KEY, token);
      localStorage.removeItem(PENDING_TOKEN_KEY);
      hasRegisteredRef.current = true;
      console.log('[Push] Token registered successfully!');
      return true;
    } catch (error: any) {
      console.error('[Push] Failed to register token:', error?.message || error);
      return false;
    }
  }, []);

  const handleToken = useCallback(async (token: string) => {
    console.log('[Push] handleToken called');
    console.log('[Push] Current user:', userRef.current?.id || 'null');
    console.log('[Push] hasRegistered:', hasRegisteredRef.current);
    
    // If already registered this session, skip
    if (hasRegisteredRef.current) {
      console.log('[Push] Already registered this session, skipping');
      return;
    }

    // If user is logged in, register immediately
    if (userRef.current) {
      console.log('[Push] User logged in, registering token now');
      await registerTokenToServer(token);
    } else {
      // Save for later when user logs in
      console.log('[Push] User not logged in, saving token for later');
      localStorage.setItem(PENDING_TOKEN_KEY, token);
    }
  }, [registerTokenToServer]);

  const unregisterToken = useCallback(async () => {
    const storedToken = localStorage.getItem(TOKEN_KEY);
    if (!storedToken) return;
    
    try {
      await apiRequest('DELETE', '/api/device-token', { fcmToken: storedToken });
      localStorage.removeItem(TOKEN_KEY);
      hasRegisteredRef.current = false;
      console.log('[Push] Token unregistered');
    } catch (error) {
      console.error('[Push] Failed to unregister token:', error);
    }
  }, []);

  // When user logs in, register any pending token
  useEffect(() => {
    if (!user) return;
    
    console.log('[Push] User logged in, checking for pending token...');
    
    const pendingToken = localStorage.getItem(PENDING_TOKEN_KEY);
    if (pendingToken && !hasRegisteredRef.current) {
      console.log('[Push] Found pending token, registering now...');
      registerTokenToServer(pendingToken);
    }
    
    // Also check if we have a stored token that might not have been sent
    const storedToken = localStorage.getItem(TOKEN_KEY);
    if (storedToken && !hasRegisteredRef.current) {
      console.log('[Push] Found stored token, re-registering to ensure server has it...');
      registerTokenToServer(storedToken);
    }
  }, [user, registerTokenToServer]);

  // Setup push notifications when on native platform
  useEffect(() => {
    const isNative = Capacitor.isNativePlatform();
    const platform = Capacitor.getPlatform();
    
    console.log('[Push] Init - Platform:', platform, 'Native:', isNative);
    
    if (!isNative) {
      console.log('[Push] Not on native platform, skipping setup');
      return;
    }

    console.log('[Push] Setting up push notification listeners...');

    const setupPush = async () => {
      // Set up listeners first
      await PushNotifications.addListener('registration', async (token: Token) => {
        console.log('[Push] Registration event received');
        console.log('[Push] Token value exists:', !!token.value);
        
        if (token.value) {
          // Small delay to ensure user state is loaded
          setTimeout(() => {
            handleToken(token.value);
          }, 500);
        } else {
          console.error('[Push] Token is empty!');
          showInAppNotification('Push Error', 'Could not get notification token');
        }
      });

      await PushNotifications.addListener('registrationError', (error: any) => {
        console.error('[Push] Registration error:', JSON.stringify(error));
        showInAppNotification('Push Error', 'Registration failed');
      });

      await PushNotifications.addListener('pushNotificationReceived', (notification: PushNotificationSchema) => {
        console.log('[Push] Notification received:', notification.title);
        showInAppNotification(
          notification.title || 'Saman Marketplace',
          notification.body || ''
        );
      });

      await PushNotifications.addListener('pushNotificationActionPerformed', (notification: ActionPerformed) => {
        console.log('[Push] Notification action performed');
        const data = notification.notification.data;
        if (data?.type === 'listing_approved' || data?.type === 'listing_rejected') {
          navigateTo('/my-listings');
        } else if (data?.type === 'new_listing') {
          navigateTo('/admin');
        } else if (data?.type === 'credits_added') {
          navigateTo('/profile');
        }
      });

      // Check and request permissions
      let permStatus = await PushNotifications.checkPermissions();
      console.log('[Push] Current permission:', permStatus.receive);

      if (permStatus.receive === 'prompt') {
        console.log('[Push] Requesting permission...');
        permStatus = await PushNotifications.requestPermissions();
        console.log('[Push] Permission result:', permStatus.receive);
      }

      if (permStatus.receive !== 'granted') {
        console.log('[Push] Permission not granted');
        showInAppNotification('Notifications Blocked', 'Enable in Settings');
        return;
      }

      // Register for push
      console.log('[Push] Calling PushNotifications.register()...');
      await PushNotifications.register();
      console.log('[Push] Register call completed');
    };

    setupPush().catch(err => {
      console.error('[Push] Setup error:', err);
    });

    return () => {
      PushNotifications.removeAllListeners();
    };
  }, [handleToken]);

  return {
    unregisterToken,
  };
}
