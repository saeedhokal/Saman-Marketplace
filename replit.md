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
- **Translation:** Bidirectional Arabic ↔ English translation for listings using OpenAI.

### Backend
- **Framework:** Express.js, TypeScript
- **ORM:** Drizzle ORM with PostgreSQL
- **Sessions:** connect-pg-simple (session-based authentication)
- **Image Storage:** Google Cloud Storage
- **Push Notifications:** Direct APNs for iOS, FCM for Android.
- **Listing Management:** Automated cleanup of rejected (7 days) and expired (60 days) listings. Users can renew listings for 1 credit.
- **Price Handling:** All prices stored and displayed in AED as whole numbers.

### Mobile Applications (iOS & Android)
- **Wrapper:** Capacitor v7
- **iOS Bundle ID:** com.saeed.saman
- **Android Package Name:** com.saman.marketplace
- **App Name:** Saman Marketplace
- **iOS Push Notifications:** Direct APNs integration
- **Android Push Notifications:** Firebase Cloud Messaging (FCM)
- **Apple Pay:** Native integration via Capacitor
- **Build Process:** GitHub → Codemagic → TestFlight (iOS) / Google Play (Android)
- **Splash Screen (iOS):** Fullscreen with SAMAN logo + Dubai skyline.

## External Dependencies

- **Telr Payment Gateway:**
    - Store ID: 32400
    - Auth Key (Hosted Page/Credit Cards): `3SWWK@m9Mz-5GNtS`
    - Wallets Auth Key (Apple Pay Remote API): `spRZ^QWJ5P~MWJpV`
    - Mode: LIVE
    - Domain registered: thesamanapp.com
    - IP Whitelisting: Disabled

- **Apple Pay:**
    - Merchant ID: merchant.saeed.saman
    - Plugin: `@jackobo/capacitor-apple-pay@7.0.0` (native Capacitor plugin)
    - Certificates: merchant_identity.pem, merchant_identity_new.key, apple_pay_key.p12, apple_pay_new.cer

- **APNs (Apple Push Notification Service):**
    - Method: Direct APNs using `@parse/node-apn`
    - Secret: `APNS_AUTH_KEY` (contains .p8 key content)
    - Environment: Production

- **Google Cloud Storage:**
    - Purpose: Image uploads for listings
    - Credentials: `FIREBASE_ADMIN_CREDENTIALS` secret

- **OpenAI:**
    - Purpose: Bidirectional Arabic ↔ English translation for user-generated content.
    - Model: gpt-5-mini

- **Firebase:**
    - Project: saman-car-spare-parts
    - Purpose: Firebase Cloud Messaging (FCM) for Android push notifications.

- **Domain:**
    - Name: thesamanapp.com
    - Registrar: GoDaddy

---

## User Account Details
- **Phone:** 971507242111 (use 0507242111 or +971507242111 to login)
- **Password:** 1234
- **Email:** saeed.hokal@hotmail.com
- **Production User ID:** 4da27671-5543-481f-8f33-eab5336aae41
- **Development User ID:** a899957f-130f-45a4-a5b0-e4c0ef1f809c
- **Admin:** Yes

---

## Payment System Status (February 5, 2026)

### ✅ WORKING
- **Apple Pay** - 100% success rate via Remote API
- **Payment Verification** - Fixed (stores `cartId::orderRef` format)

### ❌ NOT WORKING - Credit Cards (Status 90)
**Problem:** Bank approves payment, but Telr blocks it AFTER bank approval with Status 90.

**CONFIRMED:** Tested with DIFFERENT phone, DIFFERENT card, DIFFERENT user → SAME result. This rules out duplicate detection. **Issue is on OUR side.**

**Suspected:** Something in redirect flow between Safari and iOS app after payment. Data mismatch somewhere.

**INVESTIGATION RESULT (Feb 5, 2026):**
- Compared original working code (commit 2bb7edf) to current - Telr request data is IDENTICAL
- Only changes were: phone format (+971 vs 971), and what we store AFTER Telr responds
- The Status 90 happens DURING payment on Telr's page, BEFORE our verification code runs
- This means the decline happens on TELR'S SIDE after bank approval
- Telr portal shows "matched to previous transaction" - possibly velocity checks on repeated 5 AED test purchases

**Email sent to Telr (Rahul) - waiting for response.**

**Payment Verification Fix Applied:**
1. Both checkout endpoints now store `cartId::orderRef` format
2. `getTransactionByReference()` finds transactions by cartId prefix
3. `/api/payment/verify` extracts Telr order.ref for check API

**Auth Keys (DO NOT MIX):**
- `3SWWK@m9Mz-5GNtS` = Hosted Payment Page (credit cards)
- `spRZ^QWJ5P~MWJpV` = Remote API (Apple Pay)

**ALREADY TRIED (DO NOT REPEAT):**
- Added `tran.type: "sale"` and `tran.class: "ecom"` - Still Status 90
- Changed `framed: 0` to `framed: 2` (iframe mode) - Still Status 90
- Removed `customer.ip` field - Still Status 90
- Removed `tran` object - Still Status 90
- Tried Wallets auth key for Hosted Page - "Auth key mismatch"
- Added/changed phone formatting (with/without + prefix) - Still Status 90
- Added/removed customer email - Still Status 90

### ⚠️ 3D Secure - Not Working
**Workaround:** User does NOT tick the 3D Secure checkbox on Telr payment page.

**ALREADY TRIED (DO NOT REPEAT):**
- Added customer IP - didn't fix
- Changed customer reference - didn't fix
- Phone formatting changes - didn't fix
- Removed "Mr" title - didn't fix
- Added production user email - didn't fix

---

## App Store Status

### iOS - LIVE
- Version 2.0.0
- Bundle ID: com.saeed.saman
- App Store ID: id6744526430

### Android - In Review
- Version 1.1.3 (versionCode 14)
- Package Name: com.saman.marketplace

---

## Build Process
- **Server changes:** Just publish from Replit
- **iOS/Android app changes:** Push to GitHub → Codemagic builds → TestFlight/Play Store