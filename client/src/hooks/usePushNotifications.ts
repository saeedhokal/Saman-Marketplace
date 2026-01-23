import { useEffect, useCallback, useRef } from 'react';
import { Capacitor } from '@capacitor/core';
import { PushNotifications, Token, ActionPerformed, PushNotificationSchema } from '@capacitor/push-notifications';
import { apiRequest } from '@/lib/queryClient';
import { useAuth } from '@/hooks/use-auth';
import { showInAppNotification } from '@/components/InAppNotificationBanner';

const FCM_TOKEN_KEY = 'saman_fcm_token';
const PENDING_TOKEN_KEY = 'saman_pending_fcm_token';

function navigateTo(path: string) {
  window.location.href = path;
}

// Initialize push notifications immediately when module loads
// This runs before any React components mount
const platform = Capacitor.getPlatform();
const isNative = Capacitor.isNativePlatform();

// Log to help debug
console.log('=== PUSH NOTIFICATION INIT ===');
console.log('Platform:', platform);
console.log('Is Native:', isNative);

// Show debug banner after page loads (only once per session)
if (typeof window !== 'undefined') {
  const debugKey = 'push_debug_v2';
  if (!sessionStorage.getItem(debugKey)) {
    sessionStorage.setItem(debugKey, 'true');
    setTimeout(() => {
      showInAppNotification(
        'Platform Check',
        `${platform} | Native: ${isNative}`
      );
    }, 3000);
  }
}

export function usePushNotifications() {
  const { user } = useAuth();
  const hasRegistered = useRef(false);

  const registerToken = useCallback(async (token: string) => {
    // Save token for later if not logged in
    if (!user) {
      console.log('User not logged in, saving token for later registration');
      localStorage.setItem(PENDING_TOKEN_KEY, token);
      showInAppNotification('Push Token', 'Saved, will register on login');
      return;
    }
    
    try {
      console.log('Registering push notification token with server...');
      await apiRequest('POST', '/api/device-token', {
        fcmToken: token,
        deviceOs: platform,
        deviceName: `${platform} device`,
      });
      localStorage.setItem(FCM_TOKEN_KEY, token);
      localStorage.removeItem(PENDING_TOKEN_KEY);
      hasRegistered.current = true;
      console.log('Push notification token registered successfully!');
      showInAppNotification('Push Enabled', 'You will receive push notifications');
    } catch (error) {
      console.error('Failed to register push notification token:', error);
      showInAppNotification('Push Error', 'Failed to register for notifications');
    }
  }, [user]);

  const unregisterToken = useCallback(async () => {
    const storedToken = localStorage.getItem(FCM_TOKEN_KEY);
    if (!storedToken) return;
    
    try {
      await apiRequest('DELETE', '/api/device-token', { fcmToken: storedToken });
      localStorage.removeItem(FCM_TOKEN_KEY);
      console.log('Push notification token unregistered');
    } catch (error) {
      console.error('Failed to unregister push notification token:', error);
    }
  }, []);

  const initializePushNotifications = useCallback(async () => {
    if (!isNative) {
      console.log('Push notifications not available on web');
      return;
    }

    try {
      let permStatus = await PushNotifications.checkPermissions();
      console.log('Push permission status:', permStatus.receive);

      if (permStatus.receive === 'prompt') {
        permStatus = await PushNotifications.requestPermissions();
      }

      if (permStatus.receive !== 'granted') {
        console.log('Push notification permission not granted');
        showInAppNotification('Push Blocked', 'Please enable notifications in Settings');
        return;
      }

      console.log('Registering for push notifications...');
      await PushNotifications.register();
    } catch (error) {
      console.error('Error initializing push notifications:', error);
      showInAppNotification('Push Error', String(error));
    }
  }, []);

  // When user logs in, check for any pending token to register
  useEffect(() => {
    if (!user || hasRegistered.current) return;
    
    const pendingToken = localStorage.getItem(PENDING_TOKEN_KEY);
    if (pendingToken) {
      console.log('Found pending push token, registering now...');
      registerToken(pendingToken);
    }
  }, [user, registerToken]);

  // Setup push notifications when on native platform and logged in
  useEffect(() => {
    if (!isNative) {
      console.log('Not on native platform, skipping push notification setup');
      return;
    }
    
    if (!user) {
      // Even if not logged in, still set up listeners and get the token
      console.log('User not logged in, but will still get push token...');
    }

    console.log('Setting up push notification listeners...');

    const setupListeners = async () => {
      await PushNotifications.addListener('registration', (token: Token) => {
        console.log('Push registration success, token:', token.value?.substring(0, 20) + '...');
        registerToken(token.value);
      });

      await PushNotifications.addListener('registrationError', (error: any) => {
        console.error('Push registration error:', JSON.stringify(error));
        showInAppNotification('Push Reg Error', JSON.stringify(error).substring(0, 50));
      });

      await PushNotifications.addListener('pushNotificationReceived', (notification: PushNotificationSchema) => {
        console.log('Push notification received:', notification.title);
        showInAppNotification(
          notification.title || 'Saman Marketplace',
          notification.body || ''
        );
      });

      await PushNotifications.addListener('pushNotificationActionPerformed', (notification: ActionPerformed) => {
        console.log('Push notification action performed:', notification);
        const data = notification.notification.data;
        if (data?.type === 'listing_approved' || data?.type === 'listing_rejected') {
          navigateTo('/my-listings');
        } else if (data?.type === 'new_listing') {
          navigateTo('/admin');
        } else if (data?.type === 'credits_added') {
          navigateTo('/profile');
        }
      });

      console.log('Initializing push notifications...');
      await initializePushNotifications();
    };

    setupListeners();

    return () => {
      PushNotifications.removeAllListeners();
    };
  }, [user, registerToken, initializePushNotifications]);

  return {
    initializePushNotifications,
    unregisterToken,
  };
}
