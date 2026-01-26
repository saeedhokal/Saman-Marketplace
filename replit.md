# Saman Marketplace - Spare Parts & Automotive Marketplace

## Overview

Saman Marketplace is an automotive spare parts and vehicles marketplace for the UAE, using AED. It enables users to buy and sell spare parts and automotive items, featuring listing management, user authentication, in-app notifications, and payment processing. The project aims to provide a robust platform for the automotive sector in the region, with a current focus on refining the iOS push notification system.

## User Preferences

- **Communication style:** Simple, everyday language (non-technical)
- **Region:** UAE
- **Currency:** AED
- **Testing:** TestFlight iOS app (no Mac available, never used Xcode)
- **Build workflow:** Codemagic for iOS builds, GitHub via Replit Git panel
- **Important:** User does NOT code - all changes must be made by agent
- **IMPORTANT:** User is ALWAYS logged in on their iPhone, using the PUBLISHED URL (not preview), and has notifications enabled. Do not ask about this again.

## System Architecture

The Saman Marketplace uses a modern web and mobile application architecture.

**Frontend:**
- Built with React 18, TypeScript, and Vite.
- Utilizes TanStack Query for data fetching, Tailwind CSS and shadcn/ui for styling, Framer Motion for animations, and Wouter for client-side routing.
- UI features an orange (#f97316) accent, dark gradient cards, and rounded corners.
- iOS safe area handling is implemented for proper display and notification positioning.

**Backend:**
- Developed with Express.js and TypeScript.
- Drizzle ORM manages PostgreSQL database interactions.
- Session-based authentication is provided by `connect-pg-simple`.
- Google Cloud Storage is used for image assets.
- iOS push notifications are handled directly via Apple Push Notification service (APNs) using `@parse/node-apn`, bypassing Firebase for iOS.

**iOS Application:**
- Wrapped using Capacitor v7 for native functionality.
- Direct APNs integration for push notifications, configured with production entitlements and background modes.
- Native Apple Pay integration is included.
- The build process involves GitHub, Codemagic for builds, and TestFlight for distribution.

**Core Features:**
- **Admin Panel:** Supports broadcast notifications (immediate, delayed, scheduled), listing moderation, and revenue tracking.
- **Push Notifications:** Manages device token registration, storage, and APNs delivery for iOS devices. A diagnostic endpoint (`/api/admin/db-status`) is available.

## External Dependencies

- **PostgreSQL:** Main database for application data.
- **Google Cloud Storage:** For image storage.
- **Apple Push Notification service (APNs):** Direct push notifications to iOS devices, configured with `APNS_AUTH_KEY`, `keyId`, `teamId`, `bundleId`.
- **Telr Payment Gateway:** For credit card processing, requiring `TELR_STORE_ID` and `TELR_AUTH_KEY`.
- **Apple Pay:** Native iOS payment integration using `merchant.saeed.saman` and associated certificates.
- **Codemagic:** CI/CD for iOS builds and TestFlight deployment.
- **GitHub:** Version control hosting.
- **Twilio:** (Pending setup) Intended for SMS services.

## CRITICAL: Infrastructure Differences

### Old App (WORKED on AWS)
- **Hosted on:** AWS (Amazon Web Services)
- **Static IP:** Yes - AWS provides static outbound IPs
- **Telr Integration:** Worked because AWS IP was whitelisted once and never changed

### New App (Replit - CURRENT)
- **Hosted on:** Replit
- **Static IP:** NO - Replit outbound IPs change frequently (every restart/deploy)
- **Telr Integration:** Breaks because IP keeps changing

### Telr IP Whitelisting Issue
**Problem:** Replit doesn't have static outbound IPs. Every deployment or restart can get a different IP address.

**IPs whitelisted so far:**
34.96.44.175, 34.34.233.232, 34.11.141.31, 34.96.46.88, 34.96.46.223, 34.96.45.214, 34.96.45.45, 34.96.45.211, 34.96.47.62

**Long-term Solutions:**
1. Contact Telr support to disable IP whitelisting
2. Ask Telr to whitelist entire 34.0.0.0/8 range
3. Move to hosting with static IPs (like AWS)

## User Account Details
- **Phone:** 971507242111 (use 0507242111 or +971507242111 to login)
- **Password:** 1234
- **User ID:** aaf09421-ec24-4799-8ae2-4bb88af00aaf
- **Admin:** Yes
- **Credits:** 10 Spare Parts / 10 Automotive

## January 27, 2026 - Apple Pay Bug Fix

### CRITICAL BUG FIXED
**Problem:** Apple Pay was granting credits without verifying payment actually completed.

**Root Cause:** Code was checking `if (telrData.order?.ref && !telrData.error)` which is WRONG because having an `order.ref` doesn't mean payment succeeded.

**Fix Applied:** Now checks `status.code === "3"` (authorized/captured) before granting credits.

**Telr Status Codes:**
- `2` = Pending (payment processing)
- `3` = Authorized/Captured (payment successful - ONLY grant credits here)
- Other = Failed/Declined

### Telr Live Mode Configuration
- Store ID: 32400
- Auth Key: 3SWWK@m9Mz-5GNtS
- Mode: LIVE (test: 0)

### IMPORTANT: Telr Apple Pay Was Working
- Apple Pay worked perfectly with the OLD app (on AWS)
- Telr's side is fully configured for Apple Pay - no setup issues there
- The problem is NOT Telr configuration
- The problem is something about how Replit sends the request vs how AWS did

## January 27, 2026 - Current Status & Next Steps

### What Was Fixed Today
1. **Apple Pay bug fixed** - Code was granting credits without verifying payment completed. Now checks `status.code === "3"` before granting credits.
2. **Documentation updated** - All infrastructure differences, IPs, and issues documented.

### Current Blocker: IP Whitelisting
- Replit production IPs keep changing with every request
- Can't keep up with manually whitelisting each new IP
- **Waiting for Telr support response**

### Message Sent to Telr Support
```
Subject: Request to Disable IP Whitelisting or Whitelist IP Range - Store ID 32400

Hi Telr Support,

I'm experiencing issues with my payment integration due to IP whitelisting. My application is hosted on a cloud platform (Replit/Google Cloud) that uses dynamic outbound IP addresses. The IP changes frequently - sometimes between requests - which causes "Connection from unauthorised IP" errors.

I've already whitelisted these IPs, but new ones keep appearing:
- 34.96.44.175, 34.34.233.232, 34.11.141.31, 34.96.46.88, 34.96.46.223, 34.96.45.214, 34.96.45.45, 34.96.45.211, 34.96.47.62

All IPs are in the 34.x.x.x range (Google Cloud).

Could you please either:
1. Disable IP whitelisting for my account (Store ID: 32400), OR
2. Whitelist the entire 34.0.0.0/8 IP range

This would allow my integration to work reliably. My previous app on AWS worked perfectly because it had a static IP.

Thank you,
Saeed Hokal
Store ID: 32400
Phone: +971507242111
```

### When Telr Replies
- If they disable IP whitelisting: Test Apple Pay immediately
- If they whitelist the range: Test Apple Pay immediately
- If they refuse: Consider moving back to AWS or finding another payment provider

### Credit Card Payments via Redirect
- These WORK because the user's browser connects directly to Telr
- Only server-to-server calls (like Apple Pay) are blocked by IP issues

## Important Technical Facts

### Database Architecture
- **Development and Production databases are SEPARATE**
- SQL tool only modifies development database
- To fix production, must deploy code changes and call API endpoints
- Production database URL is different from development

### Fix Endpoints Created
- `/api/fix-user-saeed` - One-time endpoint to reset user account
- Clears all foreign key references and creates fresh admin user
- Used to fix production database issues

### Apple Pay Merchant Configuration
- Merchant ID: `merchant.saeed.saman`
- Certificates stored as secrets: `APPLE_PAY_CERT`, `APPLE_PAY_KEY`
- Domain verification file at `/.well-known/apple-developer-merchantid-domain-association.txt`

### Push Notifications (APNs)
- Using direct APNs (NOT Firebase for iOS)
- Key stored as `APNS_AUTH_KEY`
- Key ID: Check Apple Developer account
- Team ID: Check Apple Developer account  
- Bundle ID: Check Capacitor config
- User is ALWAYS logged in on iPhone with notifications enabled

### Codemagic Build Process
- Push code to GitHub via Replit Git panel
- Codemagic automatically builds iOS app
- Distributes to TestFlight
- User tests on iPhone via TestFlight
- NO Codemagic build needed for server-side changes (just publish from Replit)

### User Testing Setup
- User does NOT code - all changes made by agent
- User has NO Mac and has never used Xcode
- Tests on physical iPhone via TestFlight
- Communicates via desktop while testing on phone
- Uses PUBLISHED URL (production), not preview

### Key Files
- `server/routes.ts` - All API endpoints including Apple Pay
- `server/storage.ts` - Database operations
- `client/src/pages/Checkout.tsx` - Payment UI
- `client/src/pages/Subscription.tsx` - Package selection
- `server/simpleAuth.ts` - Authentication logic

### What Works
- User login/registration
- Product listings
- Push notifications
- Credit card payments (via Telr redirect)
- Admin panel
- All UI features

### What Doesn't Work (Currently)
- Native Apple Pay - blocked by Telr IP whitelisting issue
- Waiting for Telr support to disable IP restriction or whitelist IP range