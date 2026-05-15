---
description: Repository Information Overview
alwaysApply: true
---

# DEORA Plaza Information

## Summary

DEORA Plaza is a comprehensive Next.js-based restaurant and hotel management system. It provides multi-department dashboards for managing operations including kitchen, bar, billing, inventory, staff, and customer management with real-time order processing and settlement tracking.

## Structure

- **src/app/**: Next.js App Router pages and API routes
  - `dashboard/`: Department-specific dashboards (hotel, kitchen, bar, garden, billing, etc.)
  - `api/`: API routes including authentication and phone verification
  - `login/`: Authentication page
- **src/components/**: Reusable React components
- **src/hooks/**: Custom React hooks
- **src/lib/**: Utility libraries and helper functions
- **src/types/**: TypeScript type definitions
- **src/actions/**: Server actions
- **public/**: Static assets (SVGs, favicon)
- **docs/**: Comprehensive documentation on Firebase migration, deployment, and workflows

## Language & Runtime

**Language**: TypeScript  
**Version**: 5  
**Runtime**: Node.js 20  
**Framework**: Next.js 16.0.3  
**React**: 19.2.0  
**Build System**: Next.js (built-in)  
**Package Manager**: npm

## Dependencies

**Main Dependencies**:
- **react**: 19.2.0 - UI library
- **next**: 16.0.3 - React framework with SSR
- **firebase**: 12.6.0 - Backend services and database
- **firebase-admin**: 13.6.0 - Server-side Firebase operations
- **next-auth**: 4.24.13 - Authentication and authorization
- **@radix-ui**: Component primitives (avatar, dialog, dropdown, select, tabs, etc.)
- **tailwindcss**: CSS framework via @tailwindcss/postcss ^4
- **zod**: 4.1.13 - Schema validation
- **lucide-react**: 0.554.0 - Icon library
- **react-day-picker**: 9.11.1 - Date picker component
- **react-to-print**: 3.2.0 - Print functionality
- **clsx**: 2.1.1 - Utility for conditional class names
- **@hookform/resolvers**: 5.2.2 - Form validation

**Development Dependencies**:
- **typescript**: 5 - Type checking
- **@types/node**: 20 - Node.js type definitions
- **eslint**: Linting
- **ts-node**: 10.9.2 - TypeScript execution for scripts
- **tsx**: TypeScript executor

## Build & Installation

**Installation**:
```bash
npm install
```

**Development**:
```bash
npm run dev
```
Runs development server on `http://localhost:3000`

**Build**:
```bash
npm run build
```

**Production**:
```bash
npm start
```

**Linting**:
```bash
npm run lint
```

**Database Migration**:
```bash
npm run migrate-to-firebase
```
Migrates application data to Firebase backend

## Configuration Files

- **tsconfig.json**: TypeScript configuration with ES2017 target, strict mode enabled
- **next.config.ts**: Next.js configuration
- **postcss.config.mjs**: PostCSS configuration for Tailwind
- **eslint.config.mjs**: ESLint configuration
- **components.json**: shadcn/ui component configuration
- **.env.example**: Environment variable template

## Main Entry Points

**Application Entry**:
- `src/app/page.tsx` - Landing page
- `src/app/login/page.tsx` - Authentication entry
- `src/app/dashboard/page.tsx` - Main dashboard
- `src/middleware.ts` - Authentication and request middleware

**API Routes**:
- `src/app/api/auth/[...nextauth]/route.ts` - NextAuth configuration
- `src/app/api/auth/verify-phone/route.ts` - Phone verification endpoint

## Database

- **SQLite**: Local development database (`dev.db`)
- **Firebase**: Production database with Firestore and Real-time Database capabilities

## Authentication

- **next-auth**: Session-based authentication
- **Phone verification**: Custom phone verification flow via `/api/auth/verify-phone`
- **Firebase Admin**: Server-side authentication and authorization

## Key Features

- Multi-department dashboards (Hotel, Kitchen, Bar, Garden, Billing)
- Order management and real-time processing
- Staff and customer management
- Inventory tracking
- Settlement and billing reports
- User role-based access control
- Print functionality for orders and bills

## Scripts & Utilities

- `check-user.ts` - User verification script
- `create-admin.ts` - Admin user creation utility
- `reset-hotel-password.ts` - Password reset functionality
- `verify-user.ts` - User verification utility

## Deployment

- **Platform**: Vercel (see `vercel-env.txt` for configuration)
- **Build**: Next.js production build
- **Environment**: Firebase backend for data persistence
