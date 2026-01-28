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

## Current Status (January 28, 2026)

### What's WORKING
- User login/registration (phone + OTP)
- Product listings (create, view, edit, delete)
- Image uploads to Google Cloud Storage
- Push notifications (APNs)
- Credit card payments (Telr redirect)
- Apple Pay on Telr hosted page
- Admin panel (moderation, credits, broadcast)
- Favorites/saved items
- Notification inbox
- Domain thesamanapp.com connected
- Splash screen (fullscreen, edge-to-edge with SAMAN logo + Dubai skyline)
- All UI features

### What's WAITING
- **Native iOS Apple Pay** - waiting for Telr to update certificates

---

## BLOCKING ISSUE: Native Apple Pay

### Problem
"Authentication key mismatch" error when trying native Apple Pay via Telr Remote API

### Root Cause
- Telr has OLD certificates on their end
- We have NEW certificates (Payment Processing, expires 2028)
- Certificate mismatch causes authentication failure

### Certificate Details
- **New Certificate:** Payment Processing (expires 2028)
- **.p12 File:** `certs/apple_pay_key.p12` (password: saman123)
- **.cer File:** `certs/apple_pay_new.cer`
- **Status:** Sent to Telr, waiting for them to update

### Certificate Download Endpoints (for Telr)
- `/download/apple-pay-cert` - Downloads apple_pay_new.cer
- `/download/apple-pay-p12` - Downloads apple_pay_key.p12

### What Works vs What's Blocked
| Feature | Status |
|---------|--------|
| Apple Pay on Telr Hosted Page | WORKS |
| Credit Card Redirect Payments | WORKS |
| Native iOS Apple Pay (Remote API) | BLOCKED - waiting for Telr |

### Next Steps When Telr Replies
1. Telr updates their system with new certificates
2. Test native Apple Pay immediately
3. Should work once certificates match

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
