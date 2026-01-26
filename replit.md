# Saman Marketplace - Spare Parts & Automotive Marketplace

## Overview

Saman Marketplace is an automotive spare parts and vehicles marketplace focusing on the UAE region, utilizing AED currency. The project aims to provide a platform for users to buy and sell spare parts and automotive items. Key capabilities include listing management, user authentication, in-app notifications, and payment processing. The current development focus is on stabilizing and enhancing the push notification system for iOS devices, ensuring reliable delivery of notifications to users.

## User Preferences

- **Communication style:** Simple, everyday language (non-technical)
- **Region:** UAE
- **Currency:** AED
- **Testing:** TestFlight iOS app (no Mac available, never used Xcode)
- **Build workflow:** Codemagic for iOS builds, GitHub via Replit Git panel
- **Important:** User does NOT code - all changes must be made by agent
- **IMPORTANT:** User is ALWAYS logged in on their iPhone, using the PUBLISHED URL (not preview), and has notifications enabled. Do not ask about this again.

## System Architecture

The Saman Marketplace employs a modern web and mobile application architecture.

**Frontend:**
- Developed with React 18 and TypeScript, utilizing Vite for fast builds.
- Data fetching is handled by TanStack Query, and styling is managed with Tailwind CSS and shadcn/ui components.
- Animations are implemented using Framer Motion, and Wouter is used for client-side routing.
- UI elements feature an orange (#f97316) primary accent color, dark gradient cards (from-[#1e293b] to-[#0f172a]), and rounded corners with subtle shadows.
- iOS safe area handling is critical, with `padding-top: env(safe-area-inset-top)` for the body and specific positioning for toast notifications to appear below the status bar (`top: max(env(safe-area-inset-top, 20px), 20px)`).

**Backend:**
- Built using Express.js with TypeScript.
- Drizzle ORM manages database interactions with PostgreSQL.
- Session-based authentication is provided by `connect-pg-simple`.
- Google Cloud Storage is used for image storage.
- Push notifications for iOS are handled directly via Apple Push Notification service (APNs) using `@parse/node-apn`, bypassing Firebase for iOS devices.

**iOS Application:**
- The mobile application is wrapped using Capacitor v7, enabling native functionality.
- Direct APNs integration is used for push notifications, configured with specific entitlements (`aps-environment = production`) and background modes (`remote-notification`).
- Native Apple Pay integration is implemented.
- The build workflow involves pushing changes to GitHub, triggering Codemagic builds, and distributing via TestFlight.

**Core Features:**
- **Admin Panel:** Includes broadcast notification capabilities (immediate, delayed, or scheduled), listing moderation (approval/rejection), and revenue tracking with various filters.
- **Push Notifications:** The system registers device tokens, stores them in the database, and sends notifications via APNs for iOS. A diagnostic endpoint `/api/admin/db-status` is available to monitor the status of users, device tokens, and notifications.

## External Dependencies

- **PostgreSQL:** Primary database for storing user data, product listings, device tokens, and notifications.
- **Google Cloud Storage:** Used for storing images associated with product listings.
- **Apple Push Notification service (APNs):** For direct push notification delivery to iOS devices. Configured with `APNS_AUTH_KEY` (p.8 key), `keyId`, `teamId`, and `bundleId`.
- **Telr Payment Gateway:** For credit card processing, requiring `TELR_STORE_ID` and `TELR_AUTH_KEY` secrets.
- **Apple Pay:** Native payment integration using `merchant.saeed.saman` and associated `APPLE_PAY_CERT`, `APPLE_PAY_KEY` secrets.
- **Codemagic:** CI/CD platform for automating iOS builds and deployment to TestFlight.
- **GitHub:** Version control system where the codebase is hosted.
- **Firebase:** (Note: Used for Android push notifications, but specifically bypassed for iOS in this project).
- **Twilio:** (Pending setup) Intended for SMS services, such as OTP codes.

## Recent Changes (January 24, 2026)

### APNs Push Notification Configuration Fix - COMPLETED

**Problem Identified:** Push notifications were not being delivered to iOS devices due to APNs Key ID mismatch.

**Root Cause:** The code was using the wrong Key ID (`GMC5C3M7JF`) that didn't match the .p8 key file.

**Fix Applied:**
1. Updated Key ID from `GMC5C3M7JF` to `6CM9536S2R` in:
   - `server/pushNotifications.ts` (APNs provider configuration)
   - `server/routes.ts` (debug endpoint)
2. Updated key file path to: `attached_assets/AuthKey_6CM9536S2R_1769284994277.p8`

**Current APNs Configuration (CORRECT):**
- **Key ID:** `6CM9536S2R`
- **Team ID:** `KQ542Q98H2`
- **Bundle ID:** `com.saeed.saman`
- **Key File:** `attached_assets/AuthKey_6CM9536S2R_1769284994277.p8`
- **Mode:** Production (not sandbox)

**How It Works:**
1. iOS app registers device token via AppDelegate.swift
2. Token is sent to backend via `/api/register-device-token`
3. Tokens stored in `device_tokens` table in PostgreSQL
4. When sending notifications, server uses `@parse/node-apn` library
5. Server reads .p8 key file directly (preserves proper newlines)
6. APNs provider sends to Apple's production servers

**Important Files:**
- `server/pushNotifications.ts` - APNs provider setup and notification sending
- `server/routes.ts` - API endpoints including `/api/test-push` for testing
- `ios/App/App/AppDelegate.swift` - iOS token registration
- `attached_assets/AuthKey_6CM9536S2R_1769284994277.p8` - The actual APNs key file

**Testing Endpoints:**
- `GET /api/test-push` - Sends broadcast test notification to all registered devices
- `GET /api/debug-apns` - Shows APNs configuration status
- `GET /api/admin/db-status` - Shows user count, token count, notification count

**Published Version:** v3.0.1 (commit 3ee3d57)

## January 26, 2026 - Payment Configuration

### Telr & Apple Pay Connected to Bank Account

**Configuration Added:**
- **Telr Store ID:** 32400 (from user's existing merchant account)
- **Telr Auth Key:** Already configured
- **Apple Pay Merchant ID:** merchant.saeed.saman
- **Apple Pay Certificates:** APPLE_PAY_CERT and APPLE_PAY_KEY secrets configured

**How Payments Work:**
1. **Apple Pay:** Native iOS payment using merchant.saeed.saman, validated with TLS certificates, processed via Telr
2. **Credit Card:** Telr hosted payment page handles card entry, 3D Secure, and processing
3. Both methods deposit to the same bank account as user's old app

**Payment Flow:**
1. User selects package → Checkout page
2. Apple Pay available? Shows Apple Pay option (preferred)
3. Credit card option always available
4. Successful payment → Credits added to user account
5. Transaction recorded in database

**Testing:**
- Small test purchase recommended after configuration changes
- Check Telr dashboard for transaction records

**IMPORTANT - Live Mode Enabled (Jan 26, 2026):**
- Payments now go through in LIVE mode (not test mode)
- Credit card payments: `ivp_test: "0"` in checkout endpoint
- Apple Pay payments: `test: 0` in applepay/process endpoint
- All transactions will be real charges and deposited to bank account

## January 26, 2026 - Payment Issues & Admin Fixes

### Payment Issues Identified

**Telr Error "94 - Terminal limits":**
- Credit card payment attempt with 0.30 AED failed
- Telr has a minimum transaction amount requirement (likely 1.00 AED)
- Solution: Update package prices to at least 1.00 AED minimum

**Apple Pay Status:**
- Apple Pay shows "Disabled" in Telr Wallets settings (not clickable)
- User's old app had working Apple Pay with same Telr account
- **Action Required:** Contact Telr support to enable Apple Pay in Wallets section

### Admin Package Editing - FIXED

**Problems Fixed:**
1. Prices now display correctly in AED format (e.g., "10.00 AED" instead of raw "1000")
2. Edit form has clear labels: Name, Price (AED), Credits, Bonus, Order
3. Price input accepts decimal values (e.g., 1.00) and converts to fils internally
4. Fixed "toISOString is not a function" error when saving packages
5. Save button shows loading state and error messages

**Technical Details:**
- Prices stored in fils (cents) in database - divide by 100 for display
- Package update now sends only editable fields (not the entire object with dates)
- Error handling added to show failure messages

**Current Package Structure:**
- `price`: Stored in fils (30 = 0.30 AED, 100 = 1.00 AED)
- `credits`: Number of listings allowed
- `bonusCredits`: Free bonus listings (e.g., "8+2 free")
- `category`: "Spare Parts" or "Automotive"
- `sortOrder`: Display order in UI

**Published Version:** e498d5a (commit with package editing fixes)

### Telr Configuration Reference

**Telr Dashboard Settings Required:**
1. **Hosted Payment Page:** Enable and whitelist ALL IPs:
   - 34.96.44.175
   - 34.34.233.232
   - 34.11.141.31
   - 34.96.46.88 (added Jan 26, 2026)
2. **Wallets:** Apple Pay needs to be enabled (contact Telr support)
3. **Store ID:** 32400
4. **Minimum Amount:** Likely 1.00 AED (test with 1.00+ to confirm)

**Note:** Replit's outbound IP can change. If you see "Connection from unauthorised IP" errors, add the new IP to Telr's whitelist.

**Payment Endpoints:**
- `POST /api/checkout/telr` - Creates Telr hosted payment page session
- `POST /api/applepay/validate` - Validates Apple Pay merchant session
- `POST /api/applepay/process` - Processes Apple Pay token via Telr
- `GET /api/checkout/return` - Handles Telr payment return callback

### Next Steps
1. Update Basic package price to at least 1.00 AED
2. Contact Telr support to enable Apple Pay in Wallets
3. Test credit card payment with 1.00+ AED package

## January 26, 2026 - Payment Debugging Session (Ongoing)

### Problem: "E01:Invalid request" Error from Telr

**User reports:** Payment fails with error `400: {"success":false,"message":"E01:Invalid request"}`

### What Has Been Verified:

1. **Telr API works from server:**
   - Direct curl test to `https://secure.telr.com/gateway/order.json` SUCCEEDS
   - Both test mode (test:1) and live mode (test:0) work
   - Credentials are correct: Store ID 32400, Auth Key "3SWWK@m9Mz-5GNtS"
   - Current IP (34.11.141.31) is in the whitelist

2. **Code matches old working app:**
   - JSON format with nested objects (method, store, authkey, order, return, customer)
   - Same endpoint: `https://secure.telr.com/gateway/order.json`
   - Same Content-Type: `application/json`

3. **Payment endpoint exists:** `POST /api/checkout` in server/routes.ts line 593

### What's Unknown:

1. **Cannot see payment requests in server logs** - User's requests may not be reaching the server, OR the published deployment has separate logging
2. **iOS app behavior** - The TestFlight app might have cached old code or there's a network issue

### Key Files:
- `server/routes.ts` - Line 593-738: Checkout endpoint with Telr integration
- `client/src/pages/Checkout.tsx` - Frontend checkout page
- `attached_assets/payment_1769450727822.js` - Old app's working payment code for reference

### Test Endpoints:
- `GET /api/test-telr` - Direct Telr API test (to be added)
- `GET /api/debug-checkout` - Shows current checkout configuration

### Hardcoded Values (for debugging):
```javascript
store: 32400,
authkey: "3SWWK@m9Mz-5GNtS",
```

### Key Finding (Jan 26, 2026):
- **Telr API works** when tested directly via `/api/test-telr` endpoint (confirmed in Safari)
- The issue is likely in how the iOS app's checkout page sends the request, not the server-to-Telr communication
- Need to investigate client-side request flow

### Git Issue Fixed (Jan 26, 2026):
- Large file `saman_berepo_1769450727824.zip` (128MB) was blocking Git push
- Added to .gitignore and removed from tracking
- Successfully pushed to GitHub

### Test Page Added (Jan 26, 2026):
- Created `/test-payment` page for debugging payment issues
- Accessible via Safari on iPhone: `https://saman-market-fixer--saeedhokal.replit.app/test-payment`
- Contains two test buttons:
  1. "Test Telr API" - Tests direct server-to-Telr communication
  2. "Test Checkout API" - Tests the actual /api/checkout endpoint
- This helps identify whether issues are in iOS app vs server

### Debugging Status:
- No checkout requests appearing in server logs when user taps Pay in iOS app
- This suggests the iOS app might not be reaching the server
- Need to compare test page results to isolate the issue