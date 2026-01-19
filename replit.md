# SamanMarket - Spare Parts Marketplace

## Overview

SamanMarket is a full-stack marketplace application for buying and selling spare parts. It features a React frontend with a modern industrial design aesthetic, an Express.js backend with PostgreSQL database, and integrates with Replit's authentication and object storage services.

The application allows users to browse parts by category, search for specific items, view detailed product listings, and authenticated users can create their own listings with image uploads.

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
- **Authentication**: Replit Auth (OpenID Connect)
- **Session Storage**: PostgreSQL-backed sessions via connect-pg-simple
- **File Uploads**: Google Cloud Storage with presigned URLs via Uppy

The backend uses a modular structure:
- `server/routes.ts` - API route definitions
- `server/storage.ts` - Database access layer (repository pattern)
- `server/db.ts` - Database connection pool
- `server/replit_integrations/` - Auth and object storage integrations

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
- **Replit Auth**: OpenID Connect authentication via Replit's identity provider
- Requires `REPL_ID`, `ISSUER_URL`, and `SESSION_SECRET` environment variables

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