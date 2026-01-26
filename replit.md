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