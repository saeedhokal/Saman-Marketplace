import admin from 'firebase-admin';
import { db } from './db';
import { deviceTokens, users, notifications } from '@shared/schema';
import { eq, and } from 'drizzle-orm';

let firebaseInitialized = false;

function initializeFirebase() {
  if (firebaseInitialized) return true;
  
  const firebaseCredentials = process.env.FIREBASE_ADMIN_CREDENTIALS;
  if (!firebaseCredentials) {
    console.log('Firebase credentials not configured - push notifications disabled');
    return false;
  }
  
  try {
    const serviceAccount = JSON.parse(firebaseCredentials);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
    firebaseInitialized = true;
    console.log('Firebase Admin SDK initialized successfully');
    return true;
  } catch (error) {
    console.error('Failed to initialize Firebase Admin SDK:', error);
    return false;
  }
}

export interface PushNotificationPayload {
  title: string;
  body: string;
  data?: Record<string, string>;
  imageUrl?: string;
}

export async function registerDeviceToken(
  userId: string,
  fcmToken: string,
  deviceOs?: string,
  deviceName?: string
): Promise<boolean> {
  try {
    const existingToken = await db.select()
      .from(deviceTokens)
      .where(and(
        eq(deviceTokens.userId, userId),
        eq(deviceTokens.fcmToken, fcmToken)
      ))
      .limit(1);

    if (existingToken.length > 0) {
      await db.update(deviceTokens)
        .set({ 
          updatedAt: new Date(),
          deviceOs: deviceOs || existingToken[0].deviceOs,
          deviceName: deviceName || existingToken[0].deviceName,
        })
        .where(eq(deviceTokens.id, existingToken[0].id));
    } else {
      await db.delete(deviceTokens)
        .where(and(
          eq(deviceTokens.userId, userId),
          eq(deviceTokens.fcmToken, fcmToken)
        ));

      await db.insert(deviceTokens).values({
        userId,
        fcmToken,
        deviceOs,
        deviceName,
      });
    }
    
    console.log(`Device token registered for user ${userId}`);
    return true;
  } catch (error) {
    console.error('Failed to register device token:', error);
    return false;
  }
}

export async function unregisterDeviceToken(
  userId: string,
  fcmToken: string
): Promise<boolean> {
  try {
    await db.delete(deviceTokens)
      .where(and(
        eq(deviceTokens.userId, userId),
        eq(deviceTokens.fcmToken, fcmToken)
      ));
    console.log(`Device token unregistered for user ${userId}`);
    return true;
  } catch (error) {
    console.error('Failed to unregister device token:', error);
    return false;
  }
}

export async function sendPushNotification(
  userId: string,
  payload: PushNotificationPayload
): Promise<boolean> {
  if (!initializeFirebase()) {
    console.log('Push notifications not available - Firebase not initialized');
    return false;
  }

  try {
    const userTokens = await db.select()
      .from(deviceTokens)
      .where(eq(deviceTokens.userId, userId));

    if (userTokens.length === 0) {
      console.log(`No device tokens found for user ${userId}`);
      return false;
    }

    const unreadCount = await db.select()
      .from(notifications)
      .where(and(
        eq(notifications.userId, userId),
        eq(notifications.isRead, false)
      ));
    const badgeCount = unreadCount.length;

    const results = await Promise.all(
      userTokens.map(async (token) => {
        if (!token.fcmToken || token.fcmToken.length < 20) {
          console.log(`Invalid FCM token for device ${token.id}`);
          return false;
        }

        const message: admin.messaging.Message = {
          token: token.fcmToken,
          notification: {
            title: payload.title,
            body: payload.body,
          },
          data: {
            ...payload.data,
            count: String(badgeCount),
          },
          apns: {
            payload: {
              aps: {
                badge: badgeCount,
                sound: 'default',
                mutableContent: true,
                category: 'SamanNotification',
              },
            },
            fcmOptions: payload.imageUrl ? { imageUrl: payload.imageUrl } : undefined,
          },
          android: {
            priority: 'high',
            ttl: 60 * 60 * 24 * 1000,
            notification: {
              title: payload.title,
              body: payload.body,
              sound: 'default',
              defaultSound: true,
              defaultLightSettings: true,
              notificationCount: badgeCount,
              visibility: 'public',
              imageUrl: payload.imageUrl,
            },
          },
        };

        try {
          const response = await admin.messaging().send(message);
          console.log(`Push notification sent to ${token.fcmToken.substring(0, 20)}...: ${response}`);
          return true;
        } catch (error: any) {
          console.error(`Failed to send push notification to device ${token.id}:`, error);
          if (error.code === 'messaging/registration-token-not-registered' ||
              error.code === 'messaging/invalid-registration-token') {
            await db.delete(deviceTokens).where(eq(deviceTokens.id, token.id));
            console.log(`Removed invalid token for device ${token.id}`);
          }
          return false;
        }
      })
    );

    return results.some(r => r);
  } catch (error) {
    console.error('Failed to send push notification:', error);
    return false;
  }
}

export async function sendPushToAdmins(
  payload: PushNotificationPayload
): Promise<void> {
  try {
    const adminUsers = await db.select()
      .from(users)
      .where(eq(users.isAdmin, true));

    await Promise.all(
      adminUsers.map(admin => sendPushNotification(admin.id, payload))
    );
  } catch (error) {
    console.error('Failed to send push to admins:', error);
  }
}

export async function notifyNewListing(
  productTitle: string,
  sellerName: string
): Promise<void> {
  await sendPushToAdmins({
    title: 'New Listing Submitted',
    body: `${sellerName} submitted "${productTitle}" for review`,
    data: {
      type: 'new_listing',
    },
  });
}

export async function notifyListingApproved(
  userId: string,
  productTitle: string
): Promise<void> {
  await sendPushNotification(userId, {
    title: 'Listing Approved',
    body: `Your listing "${productTitle}" has been approved and is now live!`,
    data: {
      type: 'listing_approved',
    },
  });
}

export async function notifyListingRejected(
  userId: string,
  productTitle: string,
  reason?: string
): Promise<void> {
  await sendPushNotification(userId, {
    title: 'Listing Rejected',
    body: reason 
      ? `Your listing "${productTitle}" was rejected: ${reason}` 
      : `Your listing "${productTitle}" was rejected. Credit refunded.`,
    data: {
      type: 'listing_rejected',
    },
  });
}

export async function notifyCreditsAdded(
  userId: string,
  credits: number,
  category: string
): Promise<void> {
  await sendPushNotification(userId, {
    title: 'Credits Added',
    body: `${credits} ${category} credits have been added to your account!`,
    data: {
      type: 'credits_added',
    },
  });
}

export async function broadcastPushNotification(
  payload: PushNotificationPayload
): Promise<{ sent: number; failed: number }> {
  if (!initializeFirebase()) {
    console.log('Push notifications not available - Firebase not initialized');
    return { sent: 0, failed: 0 };
  }

  try {
    const allTokens = await db.select().from(deviceTokens);
    
    if (allTokens.length === 0) {
      console.log('No device tokens found for broadcast');
      return { sent: 0, failed: 0 };
    }

    let sent = 0;
    let failed = 0;

    await Promise.all(
      allTokens.map(async (token) => {
        if (!token.fcmToken || token.fcmToken.length < 20) {
          failed++;
          return;
        }

        const message: admin.messaging.Message = {
          token: token.fcmToken,
          notification: {
            title: payload.title,
            body: payload.body,
          },
          data: {
            ...payload.data,
            type: 'broadcast',
          },
          apns: {
            payload: {
              aps: {
                sound: 'default',
                mutableContent: true,
              },
            },
          },
          android: {
            priority: 'high',
            notification: {
              title: payload.title,
              body: payload.body,
              sound: 'default',
            },
          },
        };

        try {
          await admin.messaging().send(message);
          sent++;
        } catch (error: any) {
          failed++;
          if (error.code === 'messaging/registration-token-not-registered' ||
              error.code === 'messaging/invalid-registration-token') {
            await db.delete(deviceTokens).where(eq(deviceTokens.id, token.id));
          }
        }
      })
    );

    console.log(`Broadcast complete: ${sent} sent, ${failed} failed`);
    return { sent, failed };
  } catch (error) {
    console.error('Failed to broadcast push notification:', error);
    return { sent: 0, failed: 0 };
  }
}
