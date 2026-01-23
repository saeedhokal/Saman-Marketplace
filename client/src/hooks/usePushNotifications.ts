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
  const hasRegistered = useRef(false);
  const debugShown = useRef(false);

  const registerToken = useCallback(async (token: string) => {
    if (!user) {
      console.log('User not logged in, saving token for later registration');
      localStorage.setItem(PENDING_TOKEN_KEY, token);
      return;
    }
    
    try {
      console.log('Registering push token with server...');
      await apiRequest('POST', '/api/device-token', {
        fcmToken: token,
        deviceOs: Capacitor.getPlatform(),
        deviceName: `${Capacitor.getPlatform()} device`,
      });
      localStorage.setItem(TOKEN_KEY, token);
      localStorage.removeItem(PENDING_TOKEN_KEY);
      hasRegistered.current = true;
      console.log('Push token registered successfully!');
      showInAppNotification('Push Enabled', 'You will receive notifications');
    } catch (error) {
      console.error('Failed to register push token:', error);
      showInAppNotification('Push Error', 'Failed to enable notifications');
    }
  }, [user]);

  const unregisterToken = useCallback(async () => {
    const storedToken = localStorage.getItem(TOKEN_KEY);
    if (!storedToken) return;
    
    try {
      await apiRequest('DELETE', '/api/device-token', { fcmToken: storedToken });
      localStorage.removeItem(TOKEN_KEY);
      console.log('Push token unregistered');
    } catch (error) {
      console.error('Failed to unregister push token:', error);
    }
  }, []);

  const initializePushNotifications = useCallback(async () => {
    if (!Capacitor.isNativePlatform()) {
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
        showInAppNotification('Notifications Blocked', 'Enable in Settings to receive updates');
        return;
      }

      console.log('Registering for push notifications...');
      await PushNotifications.register();
    } catch (error) {
      console.error('Error initializing push notifications:', error);
      showInAppNotification('Push Error', 'Could not set up notifications');
    }
  }, []);

  // Initialize push on first load
  useEffect(() => {
    if (debugShown.current) return;
    debugShown.current = true;
    
    const platform = Capacitor.getPlatform();
    const isNative = Capacitor.isNativePlatform();
    
    console.log('Push init - Platform:', platform, 'Native:', isNative);
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

  // Setup push notifications when on native platform
  useEffect(() => {
    const isNative = Capacitor.isNativePlatform();
    
    if (!isNative) {
      console.log('Not on native platform, skipping push notification setup');
      return;
    }

    console.log('Setting up push notification listeners...');

    const setupListeners = async () => {
      // Listen for push registration success
      await PushNotifications.addListener('registration', async (token: Token) => {
        console.log('Push registration success, token:', token.value?.substring(0, 30) + '...');
        
        if (token.value) {
          registerToken(token.value);
        } else {
          console.error('Push token is empty');
          showInAppNotification('Push Error', 'Could not get notification token');
        }
      });

      await PushNotifications.addListener('registrationError', (error: any) => {
        console.error('Push registration error:', JSON.stringify(error));
        showInAppNotification('Push Error', 'Registration failed');
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
  }, [registerToken, initializePushNotifications]);

  return {
    initializePushNotifications,
    unregisterToken,
  };
}
