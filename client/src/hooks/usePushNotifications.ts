import { useEffect, useCallback } from 'react';
import { Capacitor } from '@capacitor/core';
import { PushNotifications, Token, ActionPerformed, PushNotificationSchema } from '@capacitor/push-notifications';
import { apiRequest } from '@/lib/queryClient';
import { useAuth } from '@/hooks/use-auth';

const FCM_TOKEN_KEY = 'saman_fcm_token';

export function usePushNotifications() {
  const { user } = useAuth();

  const registerToken = useCallback(async (token: string) => {
    if (!user) return;
    
    try {
      await apiRequest('POST', '/api/device-token', {
        fcmToken: token,
        deviceOs: Capacitor.getPlatform(),
        deviceName: `${Capacitor.getPlatform()} device`,
      });
      localStorage.setItem(FCM_TOKEN_KEY, token);
      console.log('Push notification token registered successfully');
    } catch (error) {
      console.error('Failed to register push notification token:', error);
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
    if (!Capacitor.isNativePlatform()) {
      console.log('Push notifications not available on web');
      return;
    }

    try {
      let permStatus = await PushNotifications.checkPermissions();

      if (permStatus.receive === 'prompt') {
        permStatus = await PushNotifications.requestPermissions();
      }

      if (permStatus.receive !== 'granted') {
        console.log('Push notification permission not granted');
        return;
      }

      await PushNotifications.register();
    } catch (error) {
      console.error('Error initializing push notifications:', error);
    }
  }, []);

  useEffect(() => {
    if (!Capacitor.isNativePlatform() || !user) return;

    const setupListeners = async () => {
      await PushNotifications.addListener('registration', (token: Token) => {
        console.log('Push registration success, token:', token.value);
        registerToken(token.value);
      });

      await PushNotifications.addListener('registrationError', (error: any) => {
        console.error('Push registration error:', error);
      });

      await PushNotifications.addListener('pushNotificationReceived', (notification: PushNotificationSchema) => {
        console.log('Push notification received:', notification);
      });

      await PushNotifications.addListener('pushNotificationActionPerformed', (notification: ActionPerformed) => {
        console.log('Push notification action performed:', notification);
        const data = notification.notification.data;
        if (data?.type === 'listing_approved' || data?.type === 'listing_rejected') {
          window.location.href = '/my-listings';
        } else if (data?.type === 'new_listing') {
          window.location.href = '/admin';
        } else if (data?.type === 'credits_added') {
          window.location.href = '/profile';
        }
      });

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
