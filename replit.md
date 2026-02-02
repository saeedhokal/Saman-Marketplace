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
- **Package Name:** com.saeed.saman
- **App Name:** Saman Marketplace
- **Push Notifications:** Firebase Cloud Messaging (FCM)
- **Build Process:** GitHub → Codemagic → Google Play / APK

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
- **Production User ID:** aaf09421-ec24-4799-8ae2-4bb88af00aaf
- **Development User ID:** a899957f-130f-45a4-a5b0-e4c0ef1f809c
- **Admin:** Yes
- **Spare Parts Credits:** 10
- **Automotive Credits:** 10

---

## Current Status (February 2, 2026)

### What's WORKING
- User login/registration (phone + OTP)
- Product listings (create, view, edit, delete)
- Image uploads to Google Cloud Storage
- Push notifications (APNs for iOS, FCM for Android)
- **Native iOS Apple Pay** - FULLY WORKING!
- Admin panel (moderation, credits, broadcast)
- Favorites/saved items
- Notification inbox
- Domain thesamanapp.com connected
- Skeleton loading cards on Landing page
- Desktop-optimized Subscription page layout

### App Store Submissions Status

#### iOS App - In Review
- **Status:** Submitted to App Store, in 48-hour review period
- **Version:** 2.0.0
- **Bundle ID:** com.saeed.saman

#### Android App - Pending Upload Key Reset
- **Status:** Upload key reset requested on February 2, 2026
- **Google Play Version:** 1.1.1 (live with 25 installs)
- **New Version Ready:** 1.1.2 (versionCode 13)
- **Package Name:** com.saeed.saman

**Android Upload Key Details:**
- **New upload keystore:** `android/app/upload-key.keystore`
- **Alias:** upload
- **Password:** saman2024
- **New SHA1:** `E0:94:63:3C:74:75:5F:7B:D9:56:0B:F4:14:01:6E:E6:7F:2A:E1:8A`
- **PEM file:** `android/app/upload_certificate.pem` (uploaded to Google Play)
- **Expected approval:** 2-3 business days from February 2, 2026

**After Google approves upload key reset:**
1. Push code to GitHub from Replit
2. Go to Codemagic → Start new build → Select "android-release"
3. Download signed AAB from artifacts
4. Upload AAB to Google Play Console → Create new release

### KNOWN ISSUE - Credit Card Payments (Status 90)
Credit card payments fail with Status 90 (Telr merchant configuration issue). This is NOT a code issue - Telr needs to fix their merchant configuration. Apple Pay works fine.

### Previous 3D Secure Issue (Resolved)
Production user email was missing. Added admin endpoint to update email:
```javascript
fetch('/api/admin/user/aaf09421-ec24-4799-8ae2-4bb88af00aaf/email', {
  method: 'POST',
  headers: {'Content-Type': 'application/json'},
  body: JSON.stringify({email: 'saeed.hokal@hotmail.com'})
}).then(r => r.json()).then(console.log)
```

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