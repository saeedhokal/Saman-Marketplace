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

## Agent Work Guidelines
- **BE THOROUGH:** When debugging or making changes, search ALL relevant files (build configs, yaml, json, plist, project files) - not just the obvious ones. Use broad grep searches first.
- **Check build pipelines first:** codemagic.yaml overrides local project settings during builds. Always check it when version/build issues occur.
- **Don't rush:** Take time to find the root cause rather than making quick fixes that miss the actual problem.

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

**NEW FINDING (Feb 5, 2026 - from Telr screenshots):**
- DECLINED transactions: Integration = **"Payment Page"** → Status 90 even after 3D Secure succeeds
- SUCCESSFUL transaction: Integration = **"Admin"** → Works fine with Auth Code
- MPI shows "Authentication succeeded" and "Successful" but still declines!
- This suggests Payment Page integration has DIFFERENT fraud rules than Admin integration
- Telr needs to check their Payment Page integration settings for Store 32400

**CRITICAL PROOF (Feb 5, 2026 - from successful transaction screenshot):**
- Sale 030066820400 - **AUTHORISED** on Feb 4 at 17:30 GST
- Integration: **Payment Page** (SAME as failing ones!)
- Auth Code: 858669
- Card ending 3705 (same card that later failed)
- Amount: AED 30.00

**Timeline proving issue started AFTER working:**
- Feb 4, 17:30 → Payment Page → **SUCCESS** ✅ (Auth Code 858669)
- Feb 5, 01:40 → Payment Page → **Status 90** ❌
- Feb 5, 05:26 → Payment Page → **Status 90** ❌

**CODE COMPARISON RESULT:**
Compared current code to working commit 2bb7edf - Telr request data is **IDENTICAL**:
- Same store ID: 32400
- Same authkey: 3SWWK@m9Mz-5GNtS
- Same framed: 0
- Same order structure, return URLs, customer data

**CONCLUSION: Issue is NOT in our code.**
1. Same Payment Page integration worked Feb 4 17:30
2. Same code, same card started failing Feb 5
3. Telr portal shows "matched to previous transaction" = velocity checks
4. 3D Secure succeeds (MPI Level 2, Status 1), then Telr blocks anyway
5. This is Telr's fraud/velocity detection - they need to adjust Store 32400 settings

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

## Comprehensive A-Z Issue List (Feb 5, 2026)

### CRITICAL ISSUES

**1. iOS capacitor.config.json has WRONG server URL** ✅ FIXED (Feb 5, 2026)
- WAS: `https://saman-market-fixer--saeedhokal.replit.app`
- NOW: `https://thesamanapp.com`
- Also synced all iOS config settings with capacitor.config.ts

**2. `limitsNavigationsToAppBoundDomains: true` without `WKAppBoundDomains`** ✅ FIXED (Feb 5, 2026)
- Added `WKAppBoundDomains` to Info.plist with:
  - `thesamanapp.com`
  - `secure.telr.com`
  - `www.telr.com`
- iOS WebView can now properly navigate to payment pages

**3. PaymentSuccess.tsx race condition**
- Tries deep link AND immediately calls `/api/payment/verify` in parallel
- Safari doesn't have session cookies, so verification fails there
- No `return` statement after deep link attempt, so both execute

### MEDIUM ISSUES

**4. Two checkout endpoints with DIFFERENT formats**
- `/api/checkout-redirect` uses JSON format: `method: "create"`
- `/api/checkout` uses URL-encoded: `ivp_method: "create"`
- Different return URL key names: `authorised` vs `return_auth`

**5. POST `/api/checkout` endpoint is NEVER CALLED**
- `purchaseMutation` is defined in Checkout.tsx but never invoked
- Dead code that could cause confusion

**6. Hardcoded auth keys vs environment variables inconsistency**
- Lines 1115, 1215, 1280: Hardcoded `3SWWK@m9Mz-5GNtS`
- POST /api/checkout uses `process.env.TELR_AUTH_KEY`
- Same value, but inconsistent approach

**7. Third auth key `TELR_REMOTE_AUTH_KEY` exists but unexplained**
- `TELR_REMOTE_AUTH_KEY=DdkLr~C8Nph^cpfK` in env vars
- Not documented - different from the two known keys
- Apple Pay fallback chain includes it

### MINOR ISSUES

**8. Phone number format inconsistency**
- Original code: `+971` prefix
- Current code: `971` without +
- Telr may expect specific format

**9. Capacitor configs out of sync**
- `ios/App/App/capacitor.config.json` differs from `capacitor.config.ts`
- iOS config missing `limitsNavigationsToAppBoundDomains`
- Different `backgroundColor`, `contentInset` values

**10. Test endpoints vs production endpoints**
- Test endpoints use `test: 1`
- Production endpoints use `test: 0`
- Verify iOS always hits production endpoint

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