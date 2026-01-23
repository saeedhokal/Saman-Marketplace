import { useEffect, useCallback, useRef } from 'react';
import { Capacitor } from '@capacitor/core';
import { PushNotifications, Token, ActionPerformed, PushNotificationSchema } from '@capacitor/push-notifications';
import { FCM } from '@capacitor-community/fcm';
import { apiRequest } from '@/lib/queryClient';
import { useAuth } from '@/hooks/use-auth';
import { showInAppNotification } from '@/components/InAppNotificationBanner';

const FCM_TOKEN_KEY = 'saman_fcm_token';
const PENDING_TOKEN_KEY = 'saman_pending_fcm_token';

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
      console.log('Registering FCM token with server...');
      await apiRequest('POST', '/api/device-token', {
        fcmToken: token,
        deviceOs: Capacitor.getPlatform(),
        deviceName: `${Capacitor.getPlatform()} device`,
      });
      localStorage.setItem(FCM_TOKEN_KEY, token);
      localStorage.removeItem(PENDING_TOKEN_KEY);
      hasRegistered.current = true;
      console.log('FCM token registered successfully!');
      showInAppNotification('Push Enabled', 'You will receive notifications');
    } catch (error) {
      console.error('Failed to register FCM token:', error);
      showInAppNotification('Push Error', 'Failed to enable notifications');
    }
  }, [user]);

  const unregisterToken = useCallback(async () => {
    const storedToken = localStorage.getItem(FCM_TOKEN_KEY);
    if (!storedToken) return;
    
    try {
      await apiRequest('DELETE', '/api/device-token', { fcmToken: storedToken });
      localStorage.removeItem(FCM_TOKEN_KEY);
      console.log('FCM token unregistered');
    } catch (error) {
      console.error('Failed to unregister FCM token:', error);
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
      console.log('Found pending FCM token, registering now...');
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
      // Listen for APNs registration success - then get FCM token
      await PushNotifications.addListener('registration', async (token: Token) => {
        console.log('APNs registration success, getting FCM token...');
        try {
          // Use FCM plugin to get the FCM token (converts APNs token to FCM)
          const fcmTokenResult = await FCM.getToken();
          const fcmToken = fcmTokenResult.token;
          console.log('FCM token obtained:', fcmToken?.substring(0, 30) + '...');
          
          if (fcmToken) {
            registerToken(fcmToken);
          } else {
            console.error('FCM token is empty');
            showInAppNotification('Push Error', 'Could not get notification token');
          }
        } catch (fcmError) {
          console.error('Failed to get FCM token:', fcmError);
          showInAppNotification('Push Error', 'Token conversion failed');
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
