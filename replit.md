# Saman Marketplace - Spare Parts & Automotive Marketplace

## Overview

Saman Marketplace is a full-stack marketplace application for buying and selling spare parts and automotive in the UAE. It features a React frontend with a modern industrial design aesthetic, an Express.js backend with PostgreSQL database, and object storage for images.

The application allows users to browse parts by category, search for specific items, view detailed product listings, and authenticated users can create their own listings with image uploads. Key features include:
- **Phone + OTP Authentication**: Users log in with phone number and 6-digit OTP code
- **Category-specific credits**: Spare Parts Credits and Automotive Credits are separate and cannot be used across categories
- **Subscription packages**: Admin-configurable packages with pricing tiers (e.g., Basic 1 credit AED 30, Premium 10+2 credits AED 250)
- **Payment processing**: Checkout flow with Apple Pay and Credit Card options via Telr gateway
- **Revenue tracking**: Admin dashboard shows total revenue, breakdown by category, transaction count, with time-based filtering (Today, Week, Month, Year, All Time, Custom date range)
- **User management**: Admin can view all users, search by name/phone/email, and delete accounts (with cascade delete of all related data)
- **Broadcast notifications**: Admin can send push notifications to all app users
- **Credit refund on rejection**: When listings are rejected, users get their category-specific credit back
- **Admin moderation**: All listings require admin approval before going live
- **1-month expiration**: Approved listings remain active for 1 month
- **Expiration notifications**: Users can see listings about to expire and repost them
- **Two-tier categories**: Spare Parts and Automotive with subcategories
- **Seller profiles**: View all listings from a specific seller
- **Favorites**: Save listings for later

## Pending Integrations

- **Telr Payment**: Configured with TELR_STORE_ID and TELR_AUTH_KEY. Supports Hosted Payment Page for credit cards.
- **Native Apple Pay**: Code is ready for native Apple Pay (shows payment sheet directly, no redirect). Requires:
  1. Apple Developer account with Merchant ID (e.g., `merchant.com.saeed.saman`)
  2. Payment Processing Certificate (.cer) from Apple
  3. Share certificate with Telr support
  4. Set `APPLE_PAY_MERCHANT_ID` environment variable
  - Endpoints: `/api/applepay/session` (merchant validation), `/api/applepay/process` (token processing)
- **SMS Provider (Twilio)**: User dismissed Twilio integration. OTP codes are currently logged to console in development. When ready for production SMS, the user will need to set up Twilio or another SMS provider.

## iOS App (Capacitor)

The project is configured with Capacitor for building a native iOS app:

- **App ID**: com.saeed.saman
- **App Name**: Saman Marketplace
- **iOS Project**: Located in `/ios` directory
- **Apple Developer Team ID**: KQ542Q98H2

### Apple Pay Configuration (iOS)
- **Merchant ID**: merchant.saeed.saman
- **Payment Processing Certificate**: Configured (APPLE_PAY_CERT, APPLE_PAY_KEY env vars)
- **Registered Domains**: xer--saeedhokal.replit.app
- **Web Apple Pay**: Uses Apple Pay JS API with TLS client certificate authentication
- **Native iOS Apple Pay**: For App Store version, will use PassKit framework directly

### Push Notifications (Firebase Cloud Messaging)
Native push notifications that work when the app is closed:

**Firebase Project**: `saman-car-spare-parts`
**Bundle ID**: `com.saeed.saman`

**Configuration Files**:
- `ios/App/App/GoogleService-Info.plist` - Firebase iOS config
- APNs Key ID: `GMC5C3M7JF` (primary) or `6CM9536S2R` (backup)

**Environment Variable Required**:
- `FIREBASE_ADMIN_CREDENTIALS` - JSON string of Firebase Admin SDK service account

**Notifications Sent**:
- New listing submitted → Admin notification
- Listing approved → User notification
- Listing rejected → User notification
- Credits added → User notification

**iOS Setup in Codemagic**:
1. Enable Push Notifications capability in Xcode project
2. Ensure APNs key is uploaded to Firebase Console (Project Settings → Cloud Messaging → APNs Authentication Key)
3. Build and test via TestFlight

**API Endpoints**:
- `POST /api/device-token` - Register FCM token for push notifications
- `DELETE /api/device-token` - Unregister FCM token (for logout)

### iOS App Store Preparation Checklist
- [ ] Domain verification complete in Apple Developer
- [ ] Apple Pay working on web (test before iOS)
- [ ] App icons (1024x1024 for App Store, various sizes for app)
- [ ] Launch screens configured
- [ ] Privacy policy URL
- [ ] App Store description and screenshots
- [ ] Age rating questionnaire
- [ ] Export compliance (encryption)
- [ ] Signing certificates and provisioning profiles

### iOS Build Workflow (Codemagic + TestFlight)
**This is the primary workflow for testing iOS changes:**
1. Make changes in Replit
2. Push to GitHub using Git panel in Replit sidebar (click Git icon → Push/Sync)
3. Go to Codemagic and start a new build
4. Download TestFlight build and test on iPhone

**GitHub Repository**: https://github.com/saeedhokal/Saman-Marketplace.git

To build for iOS App Store (alternative - requires Mac):
1. Download project to a Mac
2. Run `npm run build && npx cap sync ios`
3. Open in Xcode: `npx cap open ios`
4. Configure signing, icons, and submit to App Store

See `IOS_APP_STORE_GUIDE.md` for detailed instructions.

## User Preferences

Preferred communication style: Simple, everyday language.
Region: UAE (phone-based auth is preferred over email)
Currency: AED
Testing: Uses TestFlight iOS app as primary testing environment (no Mac available)
Build workflow: Uses Codemagic for iOS builds, pushes to GitHub manually via Replit Git panel

## Admin Configuration

**Admin Phone Numbers**: Defined in `OWNER_PHONES` array in `server/routes.ts` - currently `["971507242111"]`
- Users with these phone numbers automatically get admin privileges
- Admin accounts cannot be deleted to prevent lockout

**Admin Panel Tabs**:
1. **Pending** - Review and approve/reject new listings (with bulk actions)
2. **All Listings** - View all listings with status filters
3. **Packages** - Manage subscription packages (Spare Parts and Automotive credits)
4. **Banners** - Manage homepage promotional banners
5. **Notifications** - Send broadcast push notifications to all app users
6. **Users** - View/search all users, delete accounts (cascade deletes all related data)
7. **Revenue** - Financial tracking with time filters (Today, Week, Month, Year, All Time, Custom date range)

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
- `products` - Product listings with title, description, price (cents), category, subcategory, model (optional), condition, seller reference, image URL, status, expiration
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
