# Saman Marketplace - Spare Parts & Automotive Marketplace

## Overview
Saman Marketplace is an automotive spare parts and vehicles marketplace for the UAE, operating with AED currency. Users can buy and sell spare parts and automotive items with features including listing management, phone authentication, in-app notifications, and payment processing via Telr and Apple Pay.

**Live URL:** https://thesamanapp.com  
**Replit URL:** https://saman-market-fixer--saeedhokal.replit.app

---

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

---

## User Account Details
- **Phone:** 971507242111 (use 0507242111 or +971507242111 to login)
- **Password:** 1234
- **User ID:** aaf09421-ec24-4799-8ae2-4bb88af00aaf
- **Admin:** Yes
- **Spare Parts Credits:** 12
- **Automotive Credits:** 10

---

## Current Status (January 30, 2026)

### What's WORKING
- User login/registration (phone + OTP)
- Product listings (create, view, edit, delete)
- Image uploads to Google Cloud Storage
- Push notifications (APNs for iOS, FCM for Android)
- Credit card payments (Telr redirect)
- **Native iOS Apple Pay (Face ID + Telr Remote API v2)** - FULLY WORKING!
- Admin panel (moderation, credits, broadcast, listing removal with notification)
- Favorites/saved items
- Notification inbox
- Domain thesamanapp.com connected
- Splash screen (fullscreen, edge-to-edge with SAMAN logo + Dubai skyline)
- All UI features
- **Automatic cleanup system** - Rejected listings deleted after 7 days, expired after 30 days
- **Arabic ↔ English Translation** - Bidirectional translation for all listings (works on web, iOS, Android)
- **Listing renewal** - Users can renew expiring listings for 30 more days (costs 1 credit)
- **Expiration notifications** - Push + in-app notification 1 day before expiry

### What's WAITING
- Nothing currently blocked!

---

## Apple Pay Integration (WORKING)

### Implementation Details
- **Plugin:** @jackobo/capacitor-apple-pay@7.0.0 (native Capacitor plugin)
- **Merchant ID:** merchant.saeed.saman
- **Telr API:** Remote API v2 with Wallets auth key
- **Response Format:** transaction.status = "A" for authorized payments

### Key Files
- `client/src/pages/Checkout.tsx` - Native Apple Pay handler with event listeners
- `server/routes.ts` - /api/applepay/process endpoint with Telr Remote API v2

### Telr Configuration
- **Store ID:** 32400
- **Wallets Auth Key:** spRZ^QWJ5P~MWJpV (note: caret ^ not asterisk)
- **Mode:** LIVE (test: 0)

### Certificate Files (for reference)
- `certs/merchant_identity.pem` - Merchant identity certificate
- `certs/merchant_identity_new.key` - Merchant identity private key
- `certs/apple_pay_key.p12` (password: saman123)

---

## System Architecture

### Frontend
- **Framework:** React 18, TypeScript, Vite
- **Data fetching:** TanStack Query v5
- **Styling:** Tailwind CSS, shadcn/ui components
- **Animations:** Framer Motion
- **Routing:** Wouter (client-side)
- **UI Theme:** Orange (#f97316) accent, dark gradient cards, rounded corners

### Backend
- **Framework:** Express.js, TypeScript
- **ORM:** Drizzle ORM with PostgreSQL
- **Sessions:** connect-pg-simple (session-based auth)
- **Image Storage:** Google Cloud Storage
- **Push Notifications:** Direct APNs via @parse/node-apn (NOT Firebase for iOS)

### iOS Application
- **Wrapper:** Capacitor v7
- **Bundle ID:** com.saeed.saman
- **App Name:** Saman Marketplace
- **Push Notifications:** Direct APNs integration
- **Apple Pay:** Native integration via Capacitor
- **Build Process:** GitHub → Codemagic → TestFlight

### Android Application
- **Wrapper:** Capacitor v7
- **Package Name:** com.saeed.saman
- **App Name:** Saman Marketplace
- **Push Notifications:** Firebase Cloud Messaging (FCM)
- **Firebase Project:** saman-car-spare-parts
- **Config File:** android/app/google-services.json
- **Build Process:** GitHub → Codemagic → Google Play / APK

---

## External Services

### Telr Payment Gateway
- **Store ID:** 32400
- **Auth Key:** 3SWWK@m9Mz-5GNtS
- **Mode:** LIVE (test: 0)
- **Domain registered:** thesamanapp.com
- **IP Whitelisting:** DISABLED (set to "Any")

### Apple Pay
- **Merchant ID:** merchant.saeed.saman
- **Certificate:** Payment Processing (expires 2028)
- **Private Key Password:** saman123
- **Domain verification:** /.well-known/apple-developer-merchantid-domain-association.txt

### APNs (Push Notifications)
- **Method:** Direct APNs (NOT Firebase for iOS)
- **Library:** @parse/node-apn
- **Secret:** APNS_AUTH_KEY (contains the .p8 key content)
- **Environment:** Production
- **Bundle ID:** com.saeed.saman

### Google Cloud Storage
- **Purpose:** Image uploads for listings
- **Credentials:** FIREBASE_ADMIN_CREDENTIALS secret

### Domain: thesamanapp.com
- **Registrar:** GoDaddy
- **A Record:** @ → 34.111.179.208
- **TXT Record:** @ → replit-verify=37beca48-a166-43b6-a409-0c34e0662678
- **Status:** Connected to Replit, DNS propagated

---

## Splash Screen Configuration
- **Image:** SAMAN logo with Dubai skyline
- **Size:** 1290x2796 (iPhone 14 Pro Max)
- **Content Mode:** scaleAspectFill (fills all corners)
- **Background Color:** #454f5f
- **Files:** ios/App/App/Assets.xcassets/Splash.imageset/
- **Storyboard:** ios/App/App/Base.lproj/LaunchScreen.storyboard

---

## Key Files
- `server/routes.ts` - All API endpoints (75+)
- `server/storage.ts` - Database operations
- `client/src/pages/Checkout.tsx` - Payment UI
- `client/src/pages/Subscription.tsx` - Package selection
- `client/src/pages/Admin.tsx` - Admin panel
- `certs/apple_pay_key.p12` - Apple Pay certificate (password: saman123)
- `certs/apple_pay_new.cer` - Apple Pay certificate
- `capacitor.config.ts` - iOS configuration

---

## Database Tables
users, products, favorites, banners, subscriptionPackages, transactions, userViews, notifications, deviceTokens, otpCodes, appSettings

---

## Telr Status Codes
- `2` = Pending (payment processing)
- `3` = Authorized/Captured (payment successful - ONLY grant credits here)
- Other = Failed/Declined

---

## Build Process
- **Server changes:** Just publish from Replit (no Codemagic needed)
- **iOS app changes:** Push to GitHub → Codemagic builds → TestFlight

---

## Important Lessons Learned (January 28, 2026)

### Apple Pay Fix - Critical Details

**Problem:** Apple Pay was processing successfully on Telr but showing "Payment Failed (status: unknown)" in the app.

**Root Causes Found & Fixed:**

1. **Telr Auth Key Typo** - The Wallets auth key had an asterisk (*) but should have a caret (^):
   - WRONG: `spRZ*QWJ5P~MWJpV`
   - CORRECT: `spRZ^QWJ5P~MWJpV`

2. **Telr Response Format Mismatch** - Telr's Remote API v2 returns a different format than the Hosted Page:
   - **Remote API v2 (Apple Pay):** `transaction.status = "A"` means Authorized
   - **Hosted Page:** `order.status.code = "3"` means Authorized
   - The code was only checking for the old format, so successful payments were marked as failed

**How Apple Pay Works Now:**
1. User taps Apple Pay button in iOS app
2. Native Capacitor plugin shows Face ID/Touch ID
3. Apple returns encrypted payment token
4. Server decrypts with merchant certificates (merchant_identity.pem + .key)
5. Server sends to Telr Remote API v2 with Wallets auth key
6. Telr returns `transaction.status = "A"` for success
7. Credits are added, transaction marked complete

**Debug Endpoint:** `/api/applepay-debug-public` shows the last Apple Pay request/response for troubleshooting

### Native vs Web Apple Pay

The app uses **native Apple Pay** (NOT web ApplePaySession):
- **Plugin:** `@jackobo/capacitor-apple-pay@7.0.0`
- **Why native:** Web ApplePaySession doesn't work in WKWebView (Capacitor apps)
- **Event handlers:** Uses `validateMerchant`, `authorizePayment`, `cancel` events
- **iOS entitlements:** Configured with `com.apple.developer.in-app-payments` capability

### Certificate Files Reference
- `certs/merchant_identity.pem` - For merchant validation (decrypting Apple token)
- `certs/merchant_identity_new.key` - Private key for merchant_identity.pem
- `certs/apple_pay_key.p12` - PKCS12 format (password: saman123)
- `certs/apple_pay_new.cer` - Certificate file

### Telr API Keys (DO NOT CONFUSE)
- **Regular Auth Key:** `3SWWK@m9Mz-5GNtS` - For hosted page/credit cards
- **Wallets Auth Key:** `spRZ^QWJ5P~MWJpV` - For Apple Pay Remote API (note the caret ^)

---

## Automatic Cleanup & Listing Renewal System (January 30, 2026)

### Overview
The system automatically manages listing lifecycle including expiration notifications, renewals, and cleanup of old/rejected listings.

### Scheduled Tasks (Runs Every Hour)
Located in `server/routes.ts` at the bottom - runs via `setInterval` on server startup:

1. **Delete Old Rejected Listings** - `deleteOldRejectedProducts()`
   - Listings rejected by admin are deleted after 7 days
   - Uses `rejectedAt` timestamp field

2. **Delete Expired Listings** - `deleteExpiredProducts()`
   - All listings expire 30 days after approval
   - Expired listings deleted 30 days after expiration (60 days total from approval)
   - Uses `expiresAt` timestamp field

3. **Send Expiration Notifications** - `getProductsExpiringTomorrow()`
   - Sends push + in-app notification 1 day before expiry
   - Uses `expirationNotified` boolean to prevent duplicate notifications

### Listing Renewal Feature
**Endpoint:** `POST /api/listings/:id/renew`

- Users can renew listings within 7 days before OR 7 days after expiration
- Costs 1 credit (deducted from appropriate category: spare parts or automotive)
- Extends listing for 30 more days from current date
- Resets `expirationNotified` flag to allow future notifications

**Frontend:** `client/src/pages/MyListings.tsx`
- "Renew Listing" option appears in dropdown menu for expiring listings
- Shows confirmation dialog explaining 1 credit cost
- If insufficient credits, shows toast with "Buy Credits" button linking to subscription page

### Database Schema Additions
In `shared/schema.ts` - products table:
- `rejectedAt` (timestamp) - When listing was rejected by admin
- `expirationNotified` (boolean) - Whether expiration notification was sent
- `expiresAt` (timestamp) - When listing expires (30 days after approval)

### Storage Methods
In `server/storage.ts`:
- `deleteOldRejectedProducts()` - Delete rejected listings older than 7 days
- `deleteExpiredProducts()` - Delete expired listings older than 30 days past expiration
- `getProductsExpiringTomorrow()` - Get listings expiring in 1 day (for notifications)
- `markExpirationNotified(productId)` - Mark listing as notified
- `renewListing(productId)` - Extend listing by 30 days

### Admin Listing Removal
**Endpoint:** `DELETE /api/admin/products/:id`
- Admin can remove listings with optional reason
- If reason provided, seller receives push + in-app notification with reason
- Sets `rejectedAt` timestamp for automatic cleanup after 7 days

---

## Arabic ↔ English Translation System (January 30, 2026)

### Overview
Bidirectional translation for all user-generated content (listings) using Replit AI Integrations (OpenAI). Works on web, iOS, and Android.

### How It Works
1. User views a listing
2. System detects the language (Arabic, English, or mixed)
3. User taps "Translate" button to see translation
4. Toggle back to original with same button

### Key Files
- `server/translation.ts` - Translation service using OpenAI gpt-5-mini
- `client/src/hooks/useTranslation.ts` - Frontend translation hook
- `client/src/pages/ProductDetail.tsx` - Translation button on listing view

### API Endpoints
- `POST /api/translate` - Translate single text
- `POST /api/translate/listing` - Translate title + description together
- `GET /api/products/:id/translated?lang=arabic|english` - Get product with translation
- `POST /api/detect-language` - Detect language of text

### Cost
Uses gpt-5-mini model (most cost-effective for translation):
- ~0.001-0.002 credits per listing translation
- Translations are not cached (on-demand)

### Rate Limiting
- 30 requests per minute per IP address
- Text length limits: Title max 500 chars, description max 5000 chars
- Returns 429 status if rate limit exceeded

### OpenAI API Notes
- Uses `max_completion_tokens` parameter (NOT `max_tokens`)
- gpt-5-mini does NOT support the `temperature` parameter - omit it

---

## Price Display (IMPORTANT)

**All prices are stored and displayed in AED (whole numbers)**
- Prices are stored directly in AED in the database (e.g., 150 = 150 AED)
- NO division by 100 anywhere in the codebase
- Format: `price.toLocaleString() + " AED"` (e.g., "1,500 AED")
