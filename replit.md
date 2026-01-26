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