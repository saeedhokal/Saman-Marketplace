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
34.96.44.175, 34.34.233.232, 34.11.141.31, 34.96.46.88, 34.96.46.223, 34.96.45.214, 34.96.45.45

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