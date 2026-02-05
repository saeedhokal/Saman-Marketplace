# Saman Marketplace - Spare Parts & Automotive Marketplace

## Overview
Saman Marketplace is an automotive spare parts and vehicles marketplace for the UAE, operating with AED currency. It enables users to buy and sell spare parts and automotive items, featuring listing management, phone authentication, in-app notifications, and payment processing via Telr and Apple Pay. The platform aims to provide a comprehensive and user-friendly experience for the automotive market in the UAE.

## User Preferences
- **Communication style:** Simple, everyday language (non-technical)
- **Region:** UAE
- **Currency:** AED (United Arab Emirates Dirham)
- **Testing:** TestFlight iOS app only
- **Build workflow:** Codemagic for iOS builds, GitHub via Replit Git panel
- **Important:** User does NOT code - all changes must be made by agent
- **IMPORTANT:** User is ALWAYS logged in on their iPhone, using the PUBLISHED URL (not preview), and has notifications enabled. Do not ask about this again.
- **User has NO Mac** and has never used Xcode
- **Tests on physical iPhone** via TestFlight
- **Communicates via desktop** while testing on phone

## System Architecture

### Frontend
- **Framework:** React 18, TypeScript, Vite
- **Data fetching:** TanStack Query v5
- **Styling:** Tailwind CSS, shadcn/ui components
- **Animations:** Framer Motion
- **Routing:** Wouter (client-side)
- **UI Theme:** Orange (#f97316) accent, dark gradient cards, rounded corners
- **Translation:** Bidirectional Arabic ↔ English translation for listings.

### Backend
- **Framework:** Express.js, TypeScript
- **ORM:** Drizzle ORM with PostgreSQL
- **Sessions:** connect-pg-simple (session-based authentication)
- **Image Storage:** Google Cloud Storage
- **Push Notifications:** Direct APNs via @parse/node-apn for iOS, FCM for Android.
- **Listing Management:** Automated cleanup of rejected (7 days) and expired (60 days) listings. Users can renew listings for 1 credit.
- **Price Handling:** All prices stored and displayed in AED as whole numbers.

### iOS Application
- **Wrapper:** Capacitor v7
- **Bundle ID:** com.saeed.saman
- **App Name:** Saman Marketplace
- **Push Notifications:** Direct APNs integration
- **Apple Pay:** Native integration via Capacitor
- **Build Process:** GitHub → Codemagic → TestFlight
- **Splash Screen:** Fullscreen with SAMAN logo + Dubai skyline.

### Android Application
- **Wrapper:** Capacitor v7
- **Package Name:** com.saman.marketplace (Google Play listing)
- **App Name:** Saman Marketplace
- **Push Notifications:** Firebase Cloud Messaging (FCM)
- **Build Process:** GitHub → Codemagic → Google Play / APK
- **NOTE:** Android uses different package name than iOS due to original Google Play listing

## External Dependencies

### Telr Payment Gateway
- **Store ID:** 32400
- **Auth Key:** 3SWWK@m9Mz-5GNtS (for hosted page/credit cards)
- **Wallets Auth Key:** spRZ^QWJ5P~MWJpV (for Apple Pay Remote API)
- **Mode:** LIVE
- **Domain registered:** thesamanapp.com
- **IP Whitelisting:** Disabled

### Apple Pay
- **Merchant ID:** merchant.saeed.saman
- **Plugin:** @jackobo/capacitor-apple-pay@7.0.0 (native Capacitor plugin)
- **Certificates:** merchant_identity.pem, merchant_identity_new.key, apple_pay_key.p12 (password: saman123), apple_pay_new.cer

### APNs (Apple Push Notification Service)
- **Method:** Direct APNs using @parse/node-apn
- **Secret:** APNS_AUTH_KEY (contains .p8 key content)
- **Environment:** Production

### Google Cloud Storage
- **Purpose:** Image uploads for listings
- **Credentials:** FIREBASE_ADMIN_CREDENTIALS secret

### OpenAI
- **Purpose:** Bidirectional Arabic ↔ English translation for user-generated content.
- **Model:** gpt-5-mini

### Firebase
- **Project:** saman-car-spare-parts
- **Purpose:** Firebase Cloud Messaging (FCM) for Android push notifications.

### Domain
- **Name:** thesamanapp.com
- **Registrar:** GoDaddy

---

## User Account Details
- **Phone:** 971507242111 (use 0507242111 or +971507242111 to login)
- **Password:** 1234
- **Email:** saeed.hokal@hotmail.com (IMPORTANT: Must be set in production for 3D Secure!)
- **Production User ID:** 4da27671-5543-481f-8f33-eab5336aae41 (updated Feb 5, 2026)
- **Development User ID:** a899957f-130f-45a4-a5b0-e4c0ef1f809c
- **Admin:** Yes
- **Spare Parts Credits:** 10
- **Automotive Credits:** 10

---

## Current Status (February 5, 2026)

### What's WORKING
- User login/registration (phone + OTP)
- Product listings (create, view, edit, delete)
- Image uploads to Google Cloud Storage
- Push notifications (APNs for iOS, FCM for Android)
- **Native iOS Apple Pay** - FULLY WORKING! (100% success rate)
- **Payment Verification** - Fixed and working (Feb 5, 2026)
- Admin panel (moderation, credits, broadcast)
- Favorites/saved items
- Notification inbox
- Domain thesamanapp.com connected
- Skeleton loading cards on Landing page
- Desktop-optimized Subscription page layout
- Downloads page with SAMAN logo for QR marketing

### What's WAITING (Telr Support)
- **Credit Card Payments** - Status 90 anti-fraud blocks (Telr merchant config issue)
- Email sent to Telr (Rahul) on Feb 5, 2026 requesting fraud settings adjustment

### App Store Submissions Status

#### iOS App - LIVE
- **Status:** Live on App Store
- **Version:** 2.0.0
- **Bundle ID:** com.saeed.saman

#### Android App - In Review
- **Status:** Submitted to Google Play, in review
- **Version:** 1.1.3 (versionCode 14)
- **Package Name:** com.saman.marketplace

**Android Changes (February 4, 2026):**
1. Fixed package name from `com.saeed.saman` to `com.saman.marketplace` (to match Google Play listing)
2. Removed `READ_MEDIA_IMAGES` permission (Google Play policy compliance - uses Photo Picker instead)
3. Updated to version 1.1.3 (versionCode 14)

**Android Upload Key Details:**
- **Upload keystore:** `android/app/upload-key.keystore`
- **Alias:** upload
- **Password:** saman2024
- **SHA1:** `E0:94:63:3C:74:75:5F:7B:D9:56:0B:F4:14:01:6E:E6:7F:2A:E1:8A`
- Google approved upload key reset on February 4, 2026

---

## Payment System Fixes (February 5, 2026)

### ✅ BUG FIXED - Payment Verification After Telr Redirect

**Problem:** Payment completed successfully on Telr's page but failed when returning to the app. Money was charged but credits weren't added.

**Root Cause:** THREE bugs in the payment verification flow:
1. After creating a Telr order, we stored ONLY the Telr `order.ref` in `paymentReference`, OVERWRITING our original `cartId`. When the user returned with `?cart=cartId` in the URL, we couldn't find the transaction anymore.
2. When calling Telr's "check" API, we passed our `cartId` as `order_ref`, but Telr requires their own order reference token.
3. **There were TWO checkout endpoints** (`/api/checkout/redirect` and `/api/checkout`) - only one was fixed initially!

**Fixes Applied (All in server/routes.ts):**

1. **Both checkout endpoints now store combined format:**
   - `/api/checkout/redirect` (line ~1164): `await storage.updateTransactionReference(transaction.id, \`${cartId}::${telrResult.order.ref}\`);`
   - `/api/checkout` (line ~1468): Same fix applied

2. **Updated `getTransactionByReference()` in storage.ts:**
   - Now finds transactions by cartId prefix when paymentReference contains `::`
   - Uses SQL LIKE query: `like(transactions.paymentReference, \`${reference}::%\`)`

3. **Updated `/api/payment/verify` endpoint:**
   - Extracts Telr order.ref from stored `cartId::orderRef` format
   - Uses extracted order.ref for Telr check API call

**Code Example (Verification Flow):**
```javascript
// Extract Telr order reference from paymentReference (format: cartId::orderRef)
let telrOrderRef = cart; // fallback to cart if no :: separator
if (transaction.paymentReference?.includes("::")) {
  telrOrderRef = transaction.paymentReference.split("::")[1];
}
// Use telrOrderRef (not cartId) when calling Telr check API
```

**Telr API Format (IMPORTANT - DO NOT CHANGE):**
- `order.json` endpoint uses JSON format for creating orders
- `check` method requires URL-encoded: `ivp_method=check&ivp_store=32400&ivp_authkey=...&order_ref=TELR_ORDER_REF`
- The "check" method requires `order_ref` = Telr's order reference (from create response), NOT our cartId

---

### ⏳ PENDING - Credit Card Status 90 (Telr Anti-Fraud)

**Problem:** Credit card payments get declined with Status 90 on Telr's payment page. This happens BEFORE verification, so it's not a code issue.

**Email Sent to Telr (Feb 5, 2026):**
| Integration | Auth Key | Telr Source | Result |
|-------------|----------|-------------|--------|
| Apple Pay | Wallets Key | "Admin" | ✅ Works |
| Credit Card | Regular Key | "Payment Page" | ❌ Status 90 |
| Credit Card with Wallets Key | Wallets Key | - | ❌ "Auth key mismatch" |

**Auth Key Separation (DO NOT MIX):**
- `3SWWK@m9Mz-5GNtS` = ONLY for Hosted Payment Page (credit cards)
- `spRZ^QWJ5P~MWJpV` = ONLY for Remote API (Apple Pay, wallets)

**FAILED CODE ATTEMPTS (DO NOT REPEAT):**
1. ❌ Added `tran.type: "sale"` and `tran.class: "ecom"` - Still Status 90
2. ❌ Changed `framed: 0` to `framed: 2` (iframe mode) - Still Status 90
3. ❌ Removed `customer.ip` field entirely - Still Status 90
4. ❌ Removed `tran` object entirely - Still Status 90
5. ❌ Tried using Wallets auth key for Hosted Page - "Authentication key mismatch" error
6. ❌ Verified all auth keys multiple times - Keys are correct
7. ❌ Added/removed customer email - Email not the issue
8. ❌ Trimmed auth keys with `.trim()` - Still Status 90

**CONFIRMED FACTS:**
- Same user, same cart format, same email = different results based on Integration type
- Telr routes transactions to "Admin" or "Payment Page" integration - we cannot control this
- "Admin" integration has looser fraud rules → transactions succeed
- "Payment Page" integration has stricter fraud rules → Status 90 blocks
- Apple Pay uses completely different API (Remote API) → always works
- **This is 100% a Telr merchant configuration issue, NOT a code issue**

**Action Required from Telr (Rahul):**
1. Check why transactions route through "Payment Page" with strict fraud rules
2. Adjust anti-fraud settings for "Payment Page" to match "Admin"
3. Store ID: 32400

---

### ✅ Previous 3D Secure Issue (Resolved - Feb 1, 2026)

**Problem:** Status 47 = 3DSecure authentication rejected

**Solution:** Production user email was missing. Added admin endpoint to update email:
```javascript
fetch('/api/admin/user/aaf09421-ec24-4799-8ae2-4bb88af00aaf/email', {
  method: 'POST',
  headers: {'Content-Type': 'application/json'},
  body: JSON.stringify({email: 'saeed.hokal@hotmail.com'})
}).then(r => r.json()).then(console.log)
```

**Other 3D Secure fixes applied:**
1. Added customer IP to Telr requests (required for 3D Secure 2.0)
2. Fixed customer reference from `"saman_user"` to actual `userId`
3. Improved phone formatting with 971 prefix
4. Removed "Mr" title from customer name

---

## 3D Secure Investigation Details (February 1, 2026)

### Problem
- Status 47 = 3DSecure authentication rejected
- User tested from iPhone app AND laptop Chrome - both failed
- Bank confirmed issue is NOT from their side
- User receives TWO different OTPs (email + phone SMS)

### Changes Made

1. **Added customer IP to Telr requests** - Required for 3D Secure 2.0
   ```javascript
   const forwardedFor = req.headers["x-forwarded-for"];
   const customerIp = typeof forwardedFor === 'string' ? forwardedFor.split(',')[0].trim() : (req.ip || "127.0.0.1");
   ```

2. **Fixed customer reference** - Changed from `"saman_user"` to actual `userId`

3. **Improved phone formatting** - Ensures 971 prefix

4. **Removed "Mr" title** - Banks picky about exact match

5. **Added admin endpoint** - `POST /api/admin/user/:userId/email` to update user email

### Production vs Development Database Issue
- Development database: User has email set (a899957f-130f-45a4-a5b0-e4c0ef1f809c)
- Production database: User has NO email! (aaf09421-ec24-4799-8ae2-4bb88af00aaf)

### Subscription Packages (Production - Fixed)
Deleted 21 duplicates, created 6 correct packages:
- **Spare Parts:** 30/150/600 AED for 5/30/150 credits
- **Automotive:** 75/210/420 AED for 5/15/30 credits

---

## Important Code Locations

- `server/routes.ts` - All API endpoints including checkout, Apple Pay
- `server/storage.ts` - Database operations  
- `client/src/pages/Checkout.tsx` - Payment UI
- `client/src/pages/Subscription.tsx` - Package selection
- `client/src/pages/Admin.tsx` - Admin panel

---

## Telr Payment Gateway Notes

### Status Codes
- `A` = Authorized (success for Remote API/Apple Pay)
- `3` = Captured/Paid (success for Hosted Page)
- `D46` = 3DSecure not available for card
- `D47` = 3DSecure authentication rejected

### API Keys (DO NOT CONFUSE)
- **Regular Auth Key:** `3SWWK@m9Mz-5GNtS` - For hosted page/credit cards
- **Wallets Auth Key:** `spRZ^QWJ5P~MWJpV` - For Apple Pay (note the caret ^, not asterisk)

---

## Build Process
- **Server changes:** Just publish from Replit (no Codemagic needed)
- **iOS app changes:** Push to GitHub → Codemagic builds → TestFlight