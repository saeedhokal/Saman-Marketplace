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
- **Authentication:** Direct phone + password registration (no OTP currently). Existing users login with phone and password. Forgot password sends reset link to recovery email via Gmail SMTP (Samanapp.help@gmail.com). Reset links expire in 30 minutes. Tokens stored in-memory. Reset page at `/reset-password`.
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

## Future Feature: Firebase OTP Phone Verification (DISABLED - Re-enable when ready)

**Status:** Code removed from registration flow. Re-add when new app version is released on App Store.

**What it does:** New users must verify their phone number via SMS OTP before account creation (prevents bots/fake accounts).

**Firebase project:** saman-car-spare-parts

**Files to modify when re-enabling:**
1. `client/src/pages/Auth.tsx` — Add back OTP step between form submit and account creation:
   - Import `sendOTP`, `verifyOTP` from `@/lib/firebase`
   - Add states: `otpStep`, `otpCode`, `otpDigits`, `isSendingOTP`, `isVerifyingOTP`, `pendingFormData`, `otpInputRefs`
   - On register submit: call `sendOTP(phone)` → show OTP input screen → on verify call `verifyOTP(code)` → get `idToken` → send to backend
   - Add `<div id="recaptcha-container"></div>` at bottom of page (required by Firebase)
   - Import `ShieldCheck` from lucide-react for the OTP screen icon
2. `client/src/hooks/use-auth.ts` — Change `RegisterParams.phone` back to `RegisterParams.firebaseIdToken` (string)
3. `server/simpleAuth.ts` — In `/api/auth/register` endpoint:
   - Accept `firebaseIdToken` instead of `phone`
   - Use `admin.auth().verifyIdToken(firebaseIdToken)` to extract phone number
   - Normalize the phone from the decoded token
4. `client/src/lib/firebase.ts` — Already exists with `sendOTP()` and `verifyOTP()` functions using Firebase JS SDK

**Firebase config (already in client/src/lib/firebase.ts):**
- API Key, Auth Domain, Project ID etc. for saman-car-spare-parts
- Uses `RecaptchaVerifier` (invisible) for bot protection
- `signInWithPhoneNumber()` for sending OTP
- `confirm()` on the confirmation result to verify code and get `idToken`

**Backend Firebase Admin SDK (already in server/simpleAuth.ts):**
- Uses `FIREBASE_ADMIN_CREDENTIALS` secret for service account
- `admin.auth().verifyIdToken()` to validate the Firebase ID token from frontend