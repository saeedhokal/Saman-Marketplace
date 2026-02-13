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
- **Subscription Packages:** User manages packages via admin panel. NEVER hardcode or auto-create packages. Current authoritative packages (production, Feb 9 2026):
  - Spare Parts: Basic (30 AED/1 credit), Standard (135 AED/5 credits), Premium (255 AED/10 credits), Pro (690 AED/30 credits)
  - Automotive: Basic (75 AED/1 credit), Standard (210 AED/3 credits), Premium (390 AED/6 credits), Pro (600 AED/10 credits)
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
- **Dark Mode:** Supported via localStorage theme preference, toggleable from Settings page and landing page header
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

## Recent Changes (Feb 13, 2026)

### UI/UX Improvements
- **Arabic mode banner layout:** Text properly positioned on right side with RTL-aware flex positioning
- **"Start Selling" button:** Alignment in Arabic matches English layout positioning
- **Listing detail images:** Changed from object-cover to object-contain for better photo visibility before fullscreen
- **Fullscreen image gallery:** Portal rendering to document.body ensures nav bar is completely covered; simplified button styling to clean white icons
- **Product card images:** object-position: 50% 60% to frame car body better
- **Day/Night mode toggle:** Added to landing page header next to language globe button

### Car Models Database Expansion (Feb 13, 2026)
- **Mercedes additions:** S 320, S 350d, S 55 AMG, CLE series (200/300/450/53 AMG), R-Class (R 350/R 500/R 63 AMG)
- **BMW additions:** M-performance variants (M340i, M440i, M550i, M850i), Alpina models (B3/B4/B5/B7/XB7), electric variants (i4 eDrive40, i5 M60, i7 M70), Z3 M, Z8
- **11 new brands added with full model lists:**
  - Tesla (Model 3/Y/S/X variants, Cybertruck, Roadster)
  - Volvo (S60/S90/V60/V90/XC40/XC60/XC90/EX/EC series + classics)
  - Lincoln (Navigator/Aviator/Corsair/Nautilus/Continental + heritage)
  - Peugeot (200/300/400/500/3000/5000 series + classics)
  - Renault (Clio/Megane/Scenic/Captur/Arkana + heritage)
  - Acura (ILX/TLX/Integra/MDX/RDX/ZDX/NSX + classics)
  - Mini (Cooper/Countryman/Clubman/Convertible variants)
  - Suzuki (Swift/Vitara/Jimny/Ertiga + heritage)
  - Fiat (500 series/Tipo/Panda/Abarth variants)
  - Citroen (C3/C4/C5/Berlingo/DS series)
  - Jetour (T2/Dashing/X70/X90/T1)

---

## Known Technical Notes
- **iOS cold-start bottom nav:** Brief layout size issue on first open that self-corrects on scroll - acceptable Capacitor WebView timing issue
- **Landing page banner:** Uses RTL-aware justify-start (not justify-end) for proper text positioning in both languages
- **Fullscreen gallery:** Uses createPortal to render at document.body level for true fullscreen over all UI elements
- **Scheduler FK constraint:** deleteExpiredProducts can fail if user_views references the product - needs CASCADE or pre-delete cleanup

---

## Payment System Status (February 5, 2026)

### WORKING
- **Apple Pay** - 100% success rate via Remote API
- **Payment Verification** - Fixed (stores `cartId::orderRef` format)

### RESOLVED - Credit Cards (Status 90)
**Root Cause CONFIRMED by Telr (Feb 5, 2026):**
Telr's velocity/fraud detection blocks the **same credit card within 24 hours**.

**Solution:** Wait 24 hours between tests with the same card, OR use a different card.

**This is NOT a code issue - it's Telr's fraud protection working as designed.**

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

### 3D Secure - Not Working
**Workaround:** User does NOT tick the 3D Secure checkbox on Telr payment page.

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
