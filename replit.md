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