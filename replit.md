# Saman Marketplace - Spare Parts & Automotive Marketplace

## Overview
Saman Marketplace is an automotive spare parts and vehicles marketplace for the UAE, operating with AED currency. It enables users to buy and sell spare parts and automotive items, featuring listing management, phone authentication, in-app notifications, and payment processing. The platform's core purpose is to provide a comprehensive and user-friendly experience for the automotive market in the UAE.

## User Preferences
- **Communication style:** Simple, everyday language (non-technical)
- **Region:** UAE
- **Currency:** AED (United Arab Emirates Dirham)
- **App Distribution:** App is LIVE on the App Store (not just TestFlight). Users download directly from App Store.
- **Build workflow:** Codemagic for iOS builds, GitHub via Replit Git panel
- **Important:** User does NOT code - all changes must be made by agent
- **IMPORTANT:** User is ALWAYS logged in on their iPhone, using the PUBLISHED URL (not preview), and has notifications enabled. Do not ask about this again.
- **Subscription Packages:** User manages packages via admin panel. NEVER hardcode or auto-create packages.
- **User has NO Mac** and has never used Xcode
- **Tests on physical iPhone** via App Store build
- **Communicates via desktop** while testing on phone
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
- **UI Theme:** Orange (#f97316) accent, dark gradient cards, rounded corners, rounded corners. Support for dark mode.
- **Translation:** Bidirectional Arabic ↔ English translation for listings.
- **Mobile UI/UX:** Adaptive top padding using `safe-area-inset-top`, bottom navigation isolation for cold-start performance, `pointerEvents: 'none'` for landing page overlays, `object-contain` for listing images, `createPortal` for fullscreen image gallery. Dynamic `--vh` CSS variable for consistent viewport height on iOS.

### Backend
- **Framework:** Express.js, TypeScript
- **ORM:** Drizzle ORM with PostgreSQL
- **Sessions:** connect-pg-simple (session-based authentication)
- **Image Storage:** Google Cloud Storage
- **Push Notifications:** Direct APNs for iOS, FCM for Android.
- **Listing Management:** Automated cleanup of rejected and expired listings. Users can renew listings.
- **Price Handling:** All prices stored and displayed in AED as whole numbers.
- **Security:** Rate limiting on key endpoints (auth, listing creation, payments) and Helmet middleware for security headers. Response compression is enabled.
- **Authentication:** Phone + password registration with Firebase OTP verification for new users. Backend accepts both OTP-verified and direct phone registration for backward compatibility. Existing users login with phone and password. Forgot password sends reset link to recovery email via Gmail SMTP (Samanapp.help@gmail.com). Reset links expire in 30 minutes. Tokens stored in-memory. Reset page at `/reset-password`.
- **Email Service:** Gmail SMTP via Samanapp.help@gmail.com with app password. Uses nodemailer with retry mechanism and fresh transporter creation. Reset emails use production URL (thesamanapp.com). Emails may initially go to spam/junk folder.

### Mobile Applications (iOS & Android)
- **Wrapper:** Capacitor v7
- **App Name:** Saman Marketplace
- **iOS Bundle ID:** com.saeed.saman
- **Android Package Name:** com.saman.marketplace
- **Push Notifications:** Direct APNs for iOS, Firebase Cloud Messaging (FCM) for Android.
- **Apple Pay:** Native integration via Capacitor.
- **Build Process:** GitHub → Codemagic → TestFlight (iOS) / Google Play (Android).
- **iOS Splash Screen:** Fullscreen with SAMAN logo + Dubai skyline.

## App Versioning
- **Current Version:** 2.0.2 (OTP verification update)
- **iOS:** Version set in `codemagic.yaml` via `agvtool new-marketing-version`. Also in `ios/App/App.xcodeproj/project.pbxproj` (MARKETING_VERSION). Build number auto-incremented by Codemagic.
- **Android:** Version in `android/app/build.gradle` — `versionName "2.0.2"`, `versionCode 17`.
- **In-app display:** `client/src/pages/Settings.tsx` shows version to users.
- **IMPORTANT:** When bumping versions, update ALL of these files: `codemagic.yaml`, `project.pbxproj` (both Debug and Release), `build.gradle`, `Settings.tsx`.
- **Apple rejects** builds where CFBundleShortVersionString matches a previously approved version — always increment.

## External Dependencies

- **Telr Payment Gateway:** Used for payment processing.
    - Store ID: 32400
    - Auth Key (Hosted Page/Credit Cards): `3SWWK@m9Mz-5GNtS`
    - Wallets Auth Key (Apple Pay Remote API): `spRZ^QWJ5P~MWJpV`
    - Mode: LIVE
    - Domain registered: thesamanapp.com
- **Apple Pay:** Integrated for native in-app payments.
    - Merchant ID: merchant.saeed.saman
    - Plugin: `@jackobo/capacitor-apple-pay@7.0.0`
- **APNs (Apple Push Notification Service):** For iOS push notifications.
    - Method: Direct APNs using `@parse/node-apn`
- **Google Cloud Storage:** For storing image uploads for listings.
- **OpenAI:** For bidirectional Arabic ↔ English translation of user-generated content.
    - Model: gpt-5-mini
- **Firebase:**
    - Project: saman-car-spare-parts
    - Purpose: Firebase Cloud Messaging (FCM) for Android push notifications and Firebase Phone Authentication.
- **Domain:** thesamanapp.com (managed via GoDaddy).

## Firebase OTP Phone Verification (ENABLED in new app version)

**Status:** OTP verification is ACTIVE in the registration flow. Backend accepts BOTH flows for backward compatibility:
- **New app (OTP flow):** User fills form → SMS OTP sent via Firebase → user enters 6-digit code → Firebase token verified on backend → account created
- **Old app (direct flow):** User sends phone directly → account created (for users still on older App Store version)

**Firebase project:** saman-car-spare-parts

**Key files:**
1. `client/src/pages/Auth.tsx` — Registration triggers OTP via `sendOTP()`, shows 6-digit input screen, then calls `verifyOTP()` to get `idToken`, sends to backend
2. `client/src/hooks/use-auth.ts` — `RegisterParams` accepts optional `phone` OR `firebaseIdToken`
3. `server/simpleAuth.ts` — `/api/auth/register` accepts `firebaseIdToken` (verifies via `admin.auth().verifyIdToken()`) OR `phone` (direct, backward compatible)
4. `client/src/lib/firebase.ts` — `sendOTP()` and `verifyOTP()` functions using Firebase JS SDK with invisible reCAPTCHA

**Once old app version is fully phased out:** Remove the direct `phone` path from `/api/auth/register` so only verified OTP registrations are accepted.

## Pending for Next Build (v1.3.3+)

### Deep Linking / Universal Links
- **Purpose:** When users share listing links (e.g. `thesamanapp.com/product/123`), the link should open the app directly instead of the browser (if the app is installed).
- **What's needed:**
  1. **Apple Team ID** — need to ask user for this (found in Apple Developer account under Membership)
  2. **Server side:** Serve `/.well-known/apple-app-site-association` (iOS) and `/.well-known/assetlinks.json` (Android) files from thesamanapp.com
  3. **iOS native:** Add Associated Domains capability (`applinks:thesamanapp.com`) in Xcode/Codemagic entitlements
  4. **Android native:** Add intent filters in `AndroidManifest.xml` for `thesamanapp.com` URLs
  5. **Android signing:** Need SHA-256 fingerprint of the signing key for `assetlinks.json`
- **Requires a new native build** — cannot be done with just a publish

### Image Pinch-to-Zoom
- **Issue:** Capacitor WKWebView blocks pinch-to-zoom by default. CSS `touch-action: pinch-zoom` and custom JS touch handlers both don't work.
- **Fix needed:** Either configure WKWebView to allow zoom or use a Capacitor plugin for native image viewing
- **Requires a new native build**
