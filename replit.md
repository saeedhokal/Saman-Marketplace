# Saman Marketplace - Spare Parts & Automotive Marketplace

## Overview

Saman Marketplace is a full-stack marketplace application for buying and selling spare parts and automotive in the UAE. It features a React frontend with a modern industrial design aesthetic, an Express.js backend with PostgreSQL database, and object storage for images.

The application allows users to browse parts by category, search for specific items, view detailed product listings, and authenticated users can create their own listings with image uploads. Key features include:
- **Phone + OTP Authentication**: Users log in with phone number and 6-digit OTP code
- **Category-specific credits**: Spare Parts Credits and Automotive Credits are separate and cannot be used across categories
- **Subscription packages**: Admin-configurable packages with pricing tiers (e.g., Basic 1 credit AED 30, Premium 10+2 credits AED 250)
- **Payment processing**: Checkout flow with Apple Pay and Credit Card options via Telr gateway
- **Revenue tracking**: Admin dashboard shows total revenue, breakdown by category, and transaction count
- **Credit refund on rejection**: When listings are rejected, users get their category-specific credit back
- **Admin moderation**: All listings require admin approval before going live
- **1-month expiration**: Approved listings remain active for 1 month
- **Expiration notifications**: Users can see listings about to expire and repost them
- **Two-tier categories**: Spare Parts and Automotive with subcategories
- **Seller profiles**: View all listings from a specific seller
- **Favorites**: Save listings for later

## Pending Integrations

- **Stripe Payment**: User dismissed the Stripe integration setup. When ready to implement credit purchases, the user will need to set up the Stripe connector or provide API keys manually.
- **Telr Payment**: User has Telr payment gateway. API keys (TELR_STORE_ID, TELR_AUTH_KEY) need to be provided when ready to implement.
- **SMS Provider (Twilio)**: User dismissed Twilio integration. OTP codes are currently logged to console in development. When ready for production SMS, the user will need to set up Twilio or another SMS provider.

## User Preferences

Preferred communication style: Simple, everyday language.
Region: UAE (phone-based auth is preferred over email)
Currency: AED

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter (lightweight React router)
- **State Management**: TanStack Query (React Query) for server state
- **Styling**: Tailwind CSS with shadcn/ui component library
- **Animations**: Framer Motion for page transitions and micro-interactions
- **Form Handling**: React Hook Form with Zod validation
- **Build Tool**: Vite

The frontend follows a component-based architecture with:
- Pages in `client/src/pages/` (Home, ProductDetail, Sell, Auth, not-found)
- Reusable components in `client/src/components/`
- Custom hooks in `client/src/hooks/` for auth, products, uploads, and toasts
- UI primitives from shadcn/ui in `client/src/components/ui/`

### Backend Architecture
- **Framework**: Express.js with TypeScript
- **Database ORM**: Drizzle ORM with PostgreSQL
- **Authentication**: Phone + OTP authentication (no password required)
- **Session Storage**: PostgreSQL-backed sessions via connect-pg-simple
- **File Uploads**: Google Cloud Storage with presigned URLs via Uppy

The backend uses a modular structure:
- `server/routes.ts` - API route definitions
- `server/storage.ts` - Database access layer (repository pattern)
- `server/simpleAuth.ts` - Phone + OTP authentication
- `server/db.ts` - Database connection pool
- `server/replit_integrations/` - Object storage integration

### API Design
Routes are defined in `shared/routes.ts` with Zod schemas for type-safe API contracts:
- `GET /api/products` - List products with optional search/category filters
- `GET /api/products/:id` - Get single product
- `POST /api/products` - Create product (authenticated)
- `DELETE /api/products/:id` - Delete product (authenticated)
- `POST /api/auth/request-otp` - Request OTP for phone number
- `POST /api/auth/verify-otp` - Verify OTP and login/register
- `GET /api/user/listings` - Get user's own listings (all statuses)
- `GET /api/user/listings/expiring` - Get listings about to expire
- `POST /api/user/listings/:id/repost` - Repost a listing
- `POST /api/user/listings/:id/sold` - Mark listing as sold
- `GET /api/packages` - Get active subscription packages
- `POST /api/checkout` - Process package purchase
- `GET /api/admin/packages` - List all packages (admin)
- `POST /api/admin/packages` - Create package (admin)
- `PUT /api/admin/packages/:id` - Update package (admin)
- `DELETE /api/admin/packages/:id` - Delete package (admin)
- `GET /api/admin/revenue` - Get revenue statistics (admin)

### Database Schema
Defined in `shared/schema.ts` using Drizzle ORM:
- `products` - Product listings with title, description, price (cents), category, condition, seller reference, image URL, status, expiration
- `users` - User accounts with phone, email, credits, isAdmin flag
- `sessions` - Session storage for authentication
- `otp_codes` - OTP codes for phone authentication
- `favorites` - User's saved listings
- `app_settings` - App settings including subscriptionEnabled toggle
- `subscription_packages` - Credit packages with name, price, credits, bonusCredits, category
- `transactions` - Payment transactions for revenue tracking

### Build System
- Development: `tsx` for TypeScript execution with Vite dev server
- Production: Custom build script using esbuild for server bundling and Vite for client

## External Dependencies

### Database
- **PostgreSQL**: Primary database via `DATABASE_URL` environment variable
- **Drizzle Kit**: Database migrations with `npm run db:push`

### Authentication
- **Phone + OTP**: Users authenticate with phone number and 6-digit OTP
- OTP codes expire after 5 minutes
- In development, OTP codes are logged to console and returned in API response
- Session-based authentication via express-session
- Requires `SESSION_SECRET` environment variable

### File Storage
- **Google Cloud Storage**: Object storage for product images via Replit's sidecar service
- Uses presigned URLs for direct browser uploads
- Uppy library handles the upload UI and flow

### Key NPM Packages
- `@tanstack/react-query` - Server state management
- `drizzle-orm` / `drizzle-zod` - Type-safe database queries
- `@uppy/core` / `@uppy/dashboard` - File upload handling
- `framer-motion` - Animations
- `input-otp` - OTP input component
- Full shadcn/ui component suite via Radix primitives
