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