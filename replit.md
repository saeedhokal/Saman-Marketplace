# Saman Marketplace - Spare Parts & Automotive Marketplace

## Overview

Saman Marketplace is a full-stack e-commerce platform for buying and selling automotive spare parts and vehicles in the UAE. It aims to provide a modern, user-friendly experience with robust features for both buyers and sellers. The platform includes a React frontend, an Express.js backend with a PostgreSQL database, and object storage for images. Key capabilities include phone + OTP authentication, category-specific credit packages, integrated payment processing (Apple Pay, Credit Card), admin moderation of listings, and comprehensive revenue tracking. The project's ambition is to become the leading marketplace for automotive goods in the UAE.

## User Preferences

Preferred communication style: Simple, everyday language.
Region: UAE (phone-based auth is preferred over email)
Currency: AED
Testing: Uses TestFlight iOS app as primary testing environment (no Mac available)
Build workflow: Uses Codemagic for iOS builds, pushes to GitHub manually via Replit Git panel
User Background:
- Non-technical user - does not code and has never used Xcode
- All iOS builds handled through Codemagic (no Mac access)
- Requires simple, non-technical explanations for all changes

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter
- **State Management**: TanStack Query for server state
- **Styling**: Tailwind CSS with shadcn/ui components
- **Animations**: Framer Motion
- **Form Handling**: React Hook Form with Zod validation
- **Build Tool**: Vite
- **UI/UX**: Modern industrial design aesthetic with a dark gradient card design (from-[#1e293b] to-[#0f172a]) and orange accent color (#f97316) for icons, buttons, and selected states.

### Backend Architecture
- **Framework**: Express.js with TypeScript
- **Database ORM**: Drizzle ORM with PostgreSQL
- **Authentication**: Phone + OTP authentication, session-based via `connect-pg-simple`
- **File Uploads**: Google Cloud Storage with presigned URLs via Uppy
- **Modular Structure**: Routes, storage, authentication, and database logic are separated.

### API Design
API routes are type-safe, defined with Zod schemas for various functionalities including product listings, user authentication, user-specific listings (expiring, repost, sold), subscription package management, checkout processes, and admin functionalities (packages, revenue, broadcast notifications).

### Database Schema
The PostgreSQL database schema, defined using Drizzle ORM, includes tables for products, users, sessions, OTP codes, favorites, app settings, subscription packages, and transactions.

### Build System
- **Development**: `tsx` with Vite dev server.
- **Production**: Custom build script using esbuild for server and Vite for client.

### iOS App (Capacitor)
- The project is configured with Capacitor for native iOS app generation.
- Supports Apple Pay (native and web) and Firebase Cloud Messaging for push notifications.
- Push notifications are sent for new listings, approvals, rejections, credit additions, and admin broadcasts.
- In-app notification banners are positioned below the iOS status bar and feature smooth animations and auto-dismissal.

## External Dependencies

- **PostgreSQL**: Primary database.
- **Telr Payment Gateway**: For credit card processing.
- **Apple Pay**: Integrated for native iOS and web payments (`merchant.saeed.saman`).
- **Google Cloud Storage**: For object storage of product images.
- **Firebase Cloud Messaging (FCM)**: For native push notifications (`saman-car-spare-parts`).
- **NPM Packages**: Key packages include `@tanstack/react-query`, `drizzle-orm`, `@uppy`, `framer-motion`, `input-otp`, and `shadcn/ui`.
- **Twilio (Pending)**: SMS provider for OTP, currently logged to console in development.