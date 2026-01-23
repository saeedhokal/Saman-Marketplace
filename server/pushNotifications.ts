import apn from '@parse/node-apn';
import admin from 'firebase-admin';
import { db } from './db';
import { deviceTokens, users, notifications } from '@shared/schema';
import { eq, and } from 'drizzle-orm';

let apnProvider: apn.Provider | null = null;
let firebaseInitialized = false;

function initializeAPNs(): boolean {
  if (apnProvider) return true;
  
  const apnsKey = process.env.APNS_AUTH_KEY;
  if (!apnsKey) {
    console.log('APNs key not configured - iOS push notifications disabled');
    return false;
  }

  try {
    apnProvider = new apn.Provider({
      token: {
        key: apnsKey,
        keyId: 'GMC5C3M7JF',
        teamId: 'KQ542Q98H2',
      },
      production: true,
    });
    console.log('APNs provider initialized successfully');
    return true;
  } catch (error) {
    console.error('Failed to initialize APNs provider:', error);
    return false;
  }
}

function initializeFirebase(): boolean {
  if (firebaseInitialized) return true;
  
  const firebaseCredentials = process.env.FIREBASE_ADMIN_CREDENTIALS;
  if (!firebaseCredentials) {
    console.log('Firebase credentials not configured - Android push notifications disabled');
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
    
    console.log(`Device token registered for user ${userId} (${deviceOs})`);
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

async function sendAPNsNotification(
  token: string,
  payload: PushNotificationPayload,
  badgeCount: number = 0
): Promise<boolean> {
  if (!initializeAPNs() || !apnProvider) {
    console.log('APNs not available');
    return false;
  }

  try {
    const note = new apn.Notification();
    note.expiry = Math.floor(Date.now() / 1000) + 3600;
    note.badge = badgeCount;
    note.sound = 'default';
    note.alert = {
      title: payload.title,
      body: payload.body,
    };
    note.topic = 'com.saeed.saman';
    note.payload = payload.data || {};

    const result = await apnProvider.send(note, token);
    
    if (result.failed.length > 0) {
      console.error('APNs send failed:', result.failed[0].response);
      return false;
    }
    
    console.log(`APNs notification sent to ${token.substring(0, 20)}...`);
    return true;
  } catch (error) {
    console.error('APNs send error:', error);
    return false;
  }
}

async function sendFirebaseNotification(
  token: string,
  payload: PushNotificationPayload,
  badgeCount: number = 0
): Promise<boolean> {
  if (!initializeFirebase()) {
    console.log('Firebase not available');
    return false;
  }

  try {
    const message: admin.messaging.Message = {
      token: token,
      notification: {
        title: payload.title,
        body: payload.body,
      },
      data: {
        ...payload.data,
        count: String(badgeCount),
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

    await admin.messaging().send(message);
    console.log(`Firebase notification sent to ${token.substring(0, 20)}...`);
    return true;
  } catch (error: any) {
    console.error('Firebase send error:', error);
    return false;
  }
}

export async function sendPushNotification(
  userId: string,
  payload: PushNotificationPayload
): Promise<boolean> {
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
          console.log(`Invalid token for device ${token.id}`);
          return false;
        }

        const isIOS = token.deviceOs === 'ios';
        
        if (isIOS) {
          return sendAPNsNotification(token.fcmToken, payload, badgeCount);
        } else {
          return sendFirebaseNotification(token.fcmToken, payload, badgeCount);
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
): Promise<{ sent: number; failed: number; saved: number }> {
  let saved = 0;
  
  console.log('Starting broadcast notification:', payload.title);
  
  try {
    const allUsers = await db.select({ id: users.id }).from(users);
    console.log(`Found ${allUsers.length} users for broadcast`);
    
    if (allUsers.length === 0) {
      console.log('No users found in database for broadcast');
      return { sent: 0, failed: 0, saved: 0 };
    }
    
    await Promise.all(
      allUsers.map(async (user) => {
        try {
          await db.insert(notifications).values({
            userId: user.id,
            type: 'broadcast',
            title: payload.title,
            message: payload.body,
          });
          saved++;
        } catch (err) {
          console.error(`Failed to save broadcast notification for user ${user.id}:`, err);
        }
      })
    );
    console.log(`Broadcast notification saved to ${saved} user inboxes`);
  } catch (error) {
    console.error('Failed to save broadcast notifications to database:', error);
  }

  let sent = 0;
  let failed = 0;

  try {
    const allTokens = await db.select().from(deviceTokens);
    
    if (allTokens.length === 0) {
      console.log('No device tokens found for broadcast');
      return { sent: 0, failed: 0, saved };
    }

    console.log(`Sending push to ${allTokens.length} devices`);

    await Promise.all(
      allTokens.map(async (token) => {
        if (!token.fcmToken || token.fcmToken.length < 20) {
          failed++;
          return;
        }

        const isIOS = token.deviceOs === 'ios';
        let success = false;

        if (isIOS) {
          success = await sendAPNsNotification(token.fcmToken, payload, 1);
        } else {
          success = await sendFirebaseNotification(token.fcmToken, payload, 1);
        }

        if (success) {
          sent++;
        } else {
          failed++;
          if (token.deviceOs === 'ios') {
            await db.delete(deviceTokens).where(eq(deviceTokens.id, token.id));
            console.log(`Removed invalid iOS token ${token.id}`);
          }
        }
      })
    );

    console.log(`Broadcast complete: ${sent} sent, ${failed} failed, ${saved} saved to inbox`);
    return { sent, failed, saved };
  } catch (error) {
    console.error('Failed to broadcast push notification:', error);
    return { sent: 0, failed: 0, saved };
  }
}
