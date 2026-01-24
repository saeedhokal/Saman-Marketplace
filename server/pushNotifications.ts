import apn from '@parse/node-apn';
import admin from 'firebase-admin';
import fs from 'fs';
import path from 'path';
import { db } from './db';
import { deviceTokens, users, notifications } from '@shared/schema';
import { eq, and } from 'drizzle-orm';

let apnProvider: apn.Provider | null = null;
let firebaseInitialized = false;

let apnInitError: string | null = null;

function initializeAPNs(): boolean {
  if (apnProvider) return true;
  
  // Try to read the key from file first (preferred - proper newlines)
  const keyFilePath = path.join(process.cwd(), 'attached_assets', 'AuthKey_GMC5C3M7JF_1769283529392.p8');
  let apnsKey: string | undefined;
  
  try {
    if (fs.existsSync(keyFilePath)) {
      apnsKey = fs.readFileSync(keyFilePath, 'utf8');
      console.log('APNs key loaded from file');
    }
  } catch (err) {
    console.log('Could not read APNs key from file, trying environment variable');
  }
  
  // Fall back to environment variable
  if (!apnsKey) {
    apnsKey = process.env.APNS_AUTH_KEY;
  }
  
  if (!apnsKey) {
    apnInitError = 'APNs key not configured';
    console.log('APNs key not configured - iOS push notifications disabled');
    return false;
  }

  try {
    // Normalize the key - handle various formats
    let normalizedKey = apnsKey.trim();
    
    // Replace literal \n with actual newlines
    if (normalizedKey.includes('\\n')) {
      normalizedKey = normalizedKey.replace(/\\n/g, '\n');
    }
    
    // If no newlines, try to reconstruct proper PEM format
    if (!normalizedKey.includes('\n')) {
      console.log('APNs key has no newlines, attempting to reconstruct PEM format');
      
      // Extract the base64 content between headers
      const beginHeader = '-----BEGIN PRIVATE KEY-----';
      const endHeader = '-----END PRIVATE KEY-----';
      
      let base64Content = normalizedKey;
      if (normalizedKey.includes(beginHeader)) {
        base64Content = normalizedKey
          .replace(beginHeader, '')
          .replace(endHeader, '')
          .replace(/\s/g, ''); // Remove any whitespace
      }
      
      // Reconstruct with proper newlines (64 chars per line)
      const lines = [];
      for (let i = 0; i < base64Content.length; i += 64) {
        lines.push(base64Content.substring(i, i + 64));
      }
      
      normalizedKey = `${beginHeader}\n${lines.join('\n')}\n${endHeader}`;
      console.log('Reconstructed PEM key with proper newlines');
    }
    
    console.log(`APNs key length: ${apnsKey.length}, normalized: ${normalizedKey.length}`);
    console.log(`APNs key has newlines: ${normalizedKey.includes('\n')}`);
    
    const keyBuffer = Buffer.from(normalizedKey, 'utf8');
    
    apnProvider = new apn.Provider({
      token: {
        key: keyBuffer,
        keyId: 'GMC5C3M7JF',
        teamId: 'KQ542Q98H2',
      },
      production: true,
    });
    console.log('APNs provider initialized successfully');
    apnInitError = null;
    return true;
  } catch (error: any) {
    apnInitError = error?.message || 'Unknown initialization error';
    console.error('Failed to initialize APNs provider:', error);
    return false;
  }
}

export function getApnInitError(): string | null {
  return apnInitError;
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
  const result = await sendAPNsNotificationWithError(token, payload, badgeCount);
  return result.success;
}

async function sendAPNsNotificationWithError(
  token: string,
  payload: PushNotificationPayload,
  badgeCount: number = 0
): Promise<{ success: boolean; error?: string }> {
  console.log(`Attempting APNs send to token: ${token.substring(0, 30)}...`);
  
  if (!initializeAPNs() || !apnProvider) {
    console.log('APNs not available - provider not initialized');
    return { success: false, error: 'APNs provider not initialized' };
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
    note.pushType = 'alert';

    console.log(`Sending APNs notification: title="${payload.title}", topic=${note.topic}`);
    const result = await apnProvider.send(note, token);
    
    console.log(`APNs result: sent=${result.sent.length}, failed=${result.failed.length}`);
    
    if (result.failed.length > 0) {
      const failure = result.failed[0];
      const errorInfo = {
        status: failure.status,
        reason: (failure.response as any)?.reason || 'Unknown',
      };
      console.error('APNs send failed:', JSON.stringify(errorInfo));
      return { success: false, error: `${errorInfo.status}: ${errorInfo.reason}` };
    }
    
    console.log(`APNs notification sent successfully to ${token.substring(0, 20)}...`);
    return { success: true };
  } catch (error: any) {
    console.error('APNs send error:', error);
    return { success: false, error: error?.message || 'APNs exception' };
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
): Promise<{ sent: number; failed: number; saved: number; errors: string[] }> {
  console.log('=== BROADCAST START ===');
  console.log('Title:', payload.title);
  console.log('Body:', payload.body);
  
  let saved = 0;

  try {
    console.log('Querying users table...');
    const allUsers = await db.select({ id: users.id }).from(users);
    console.log(`Found ${allUsers.length} users for broadcast`);
    
    if (allUsers.length === 0) {
      console.log('WARNING: No users found in database for broadcast');
      return { sent: 0, failed: 0, saved: 0, errors: ['No users found'] };
    }
    
    console.log('User IDs:', allUsers.map(u => u.id).slice(0, 5).join(', ') + (allUsers.length > 5 ? '...' : ''));
    
    const saveResults = await Promise.all(
      allUsers.map(async (user) => {
        try {
          await db.insert(notifications).values({
            userId: user.id,
            type: 'broadcast',
            title: payload.title,
            message: payload.body,
          });
          return { success: true, userId: user.id };
        } catch (err) {
          console.error(`Failed to save notification for user ${user.id}:`, err);
          return { success: false, userId: user.id };
        }
      })
    );
    
    saved = saveResults.filter(r => r.success).length;
    console.log(`Broadcast saved to ${saved}/${allUsers.length} user inboxes`);
  } catch (error: any) {
    console.error('CRITICAL: Failed to query/save broadcast:', error);
    return { sent: 0, failed: 0, saved: 0, errors: [error?.message || 'Query failed'] };
  }

  let sent = 0;
  let failed = 0;

  try {
    const allTokens = await db.select().from(deviceTokens);
    
    if (allTokens.length === 0) {
      console.log('No device tokens found for broadcast, returning saved count:', saved);
      return { sent: 0, failed: 0, saved, errors: ['No device tokens found'] };
    }

    console.log(`Sending push to ${allTokens.length} devices`);

    const errors: string[] = [];
    const pushResults = await Promise.all(
      allTokens.map(async (token) => {
        if (!token.fcmToken || token.fcmToken.length < 20) {
          errors.push(`Token ${token.id}: too short or missing`);
          return { success: false, tokenId: token.id, reason: 'invalid_token' };
        }

        const isIOS = token.deviceOs === 'ios';
        let success = false;

        if (isIOS) {
          const result = await sendAPNsNotificationWithError(token.fcmToken, payload, 1);
          success = result.success;
          if (!success && result.error) {
            errors.push(`Token ${token.id} (iOS): ${result.error}`);
          }
        } else {
          success = await sendFirebaseNotification(token.fcmToken, payload, 1);
          if (!success) {
            errors.push(`Token ${token.id} (Android): Firebase failed`);
          }
        }

        // DISABLED: Don't auto-delete tokens on failure - keep them for debugging
        // if (!success && token.deviceOs === 'ios') {
        //   await db.delete(deviceTokens).where(eq(deviceTokens.id, token.id));
        // }

        return { success, tokenId: token.id, os: token.deviceOs };
      })
    );

    sent = pushResults.filter(r => r.success).length;
    failed = pushResults.filter(r => !r.success).length;

    console.log(`=== BROADCAST COMPLETE ===`);
    console.log(`Saved: ${saved} inboxes, Sent: ${sent} pushes, Failed: ${failed} pushes`);
    if (errors.length > 0) {
      console.log('Errors:', errors.join('; '));
    }
    
    return { sent, failed, saved, errors };
  } catch (error: any) {
    console.error('Failed to broadcast push notification:', error);
    return { sent: 0, failed: 0, saved, errors: [error?.message || 'Broadcast failed'] };
  }
}
