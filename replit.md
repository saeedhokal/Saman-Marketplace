# Saman Marketplace - Spare Parts & Automotive Marketplace

## Overview
Saman Marketplace is an automotive spare parts and vehicles marketplace for the UAE, operating with AED currency. It enables users to buy and sell spare parts and automotive items, offering features like listing management, phone authentication, in-app notifications, and payment processing via Telr and Apple Pay. The project aims to be the leading platform for automotive classifieds in the UAE.

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

### General
- **Project Type:** Automotive spare parts and vehicles marketplace.
- **UI Theme:** Orange (#f97316) accent, dark gradient cards, rounded corners.
- **iOS Application:** Wrapped with Capacitor v7, supporting safe areas and direct APNs integration.

### Frontend
- **Framework:** React 18, TypeScript, Vite
- **Data fetching:** TanStack Query v5
- **Styling:** Tailwind CSS, shadcn/ui components
- **Animations:** Framer Motion
- **Routing:** Wouter (client-side)

### Backend
- **Framework:** Express.js, TypeScript
- **ORM:** Drizzle ORM with PostgreSQL
- **Sessions:** connect-pg-simple (session-based authentication)
- **Image Storage:** Google Cloud Storage
- **Push Notifications:** Direct APNs via @parse/node-apn (not Firebase)

### Database Schema
- **Key Tables:** `users`, `products`, `favorites`, `banners`, `subscriptionPackages`, `transactions`, `userViews`, `notifications`, `deviceTokens`, `otpCodes`, `appSettings`.
- **Main Categories:** "Spare Parts" and "Automotive", with various subcategories for specific brands and types.

### Key Features
- **Phone Authentication:** OTP-based login/registration.
- **Product Listings:** Create, view, edit, delete listings with image uploads.
- **Credit System:** Users purchase credits to create listings, categorized for 'Spare Parts' or 'Automotive'.
- **Payment Processing:** Integration with Telr for credit card payments and Apple Pay.
- **Push Notifications:** Direct APNs for timely updates and admin broadcasts.
- **Admin Panel:** Tools for listing moderation, credit management, and user notifications.
- **Favorites:** Users can save preferred listings.
- **In-app Notifications:** An inbox for user notifications.
- **Listing Expiration:** Listings expire after one month but can be reposted.

## External Dependencies

- **Telr Payment Gateway:** For credit card and hosted Apple Pay transactions.
  - **Store ID:** 32400
  - **Auth Key:** 3SWWK@m9Mz-5GNtS
  - **Mode:** LIVE
- **Apple Pay:** Native integration via Capacitor for iOS, requiring specific merchant ID and certificates for processing.
  - **Merchant ID:** merchant.saeed.saman
  - **Private Key Password:** saman123
- **APNs (Apple Push Notification service):** Direct integration using `@parse/node-apn` for push notifications.
  - **Secret:** `APNS_AUTH_KEY` (contains .p8 key content)
- **Google Cloud Storage:** Used for storing product images.
  - **Credentials:** `FIREBASE_ADMIN_CREDENTIALS` secret
- **Codemagic:** CI/CD for iOS builds and TestFlight deployment.
- **PostgreSQL:** Primary database.
- **GoDaddy:** Domain registrar for `thesamanapp.com`.