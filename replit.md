# SamanMarket - Spare Parts Marketplace

## Overview

SamanMarket is a full-stack marketplace application for buying and selling spare parts in the UAE. It features a React frontend with a modern industrial design aesthetic, an Express.js backend with PostgreSQL database, and object storage for images.

The application allows users to browse parts by category, search for specific items, view detailed product listings, and authenticated users can create their own listings with image uploads. Key features include:
- **Credit-based posting system**: Users need credits to post listings (1 credit per listing)
- **Admin moderation**: All listings require admin approval before going live
- **1-month expiration**: Approved listings remain active for 1 month
- **Two-tier categories**: Spare Parts and Automotive with subcategories
- **Seller profiles**: View all listings from a specific seller
- **Favorites**: Save listings for later

## Pending Integrations

- **Stripe Payment**: User dismissed the Stripe integration setup. When ready to implement credit purchases, the user will need to set up the Stripe connector or provide API keys manually.

## User Preferences

Preferred communication style: Simple, everyday language.

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
- Pages in `client/src/pages/` (Home, ProductDetail, Sell, not-found)
- Reusable components in `client/src/components/`
- Custom hooks in `client/src/hooks/` for auth, products, uploads, and toasts
- UI primitives from shadcn/ui in `client/src/components/ui/`

### Backend Architecture
- **Framework**: Express.js with TypeScript
- **Database ORM**: Drizzle ORM with PostgreSQL
- **Authentication**: Simple email + password auth (no complexity requirements)
- **Session Storage**: PostgreSQL-backed sessions via connect-pg-simple
- **File Uploads**: Google Cloud Storage with presigned URLs via Uppy

The backend uses a modular structure:
- `server/routes.ts` - API route definitions
- `server/storage.ts` - Database access layer (repository pattern)
- `server/simpleAuth.ts` - Simple email/password authentication
- `server/db.ts` - Database connection pool
- `server/replit_integrations/` - Object storage integration

### API Design
Routes are defined in `shared/routes.ts` with Zod schemas for type-safe API contracts:
- `GET /api/products` - List products with optional search/category filters
- `GET /api/products/:id` - Get single product
- `POST /api/products` - Create product (authenticated)
- `DELETE /api/products/:id` - Delete product (authenticated)

### Database Schema
Defined in `shared/schema.ts` using Drizzle ORM:
- `products` - Product listings with title, description, price (cents), category, condition, seller reference, image URL
- `users` - User accounts (managed by Replit Auth)
- `sessions` - Session storage for authentication

### Build System
- Development: `tsx` for TypeScript execution with Vite dev server
- Production: Custom build script using esbuild for server bundling and Vite for client

## External Dependencies

### Database
- **PostgreSQL**: Primary database via `DATABASE_URL` environment variable
- **Drizzle Kit**: Database migrations with `npm run db:push`

### Authentication
- **Simple Auth**: Email + password authentication with bcrypt password hashing
- No password complexity requirements - users can choose any password
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
- `passport` / `openid-client` - Authentication
- `framer-motion` - Animations
- Full shadcn/ui component suite via Radix primitives