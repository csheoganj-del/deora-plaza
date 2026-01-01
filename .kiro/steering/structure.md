# Project Structure & Organization

## Root Directory Structure

### Configuration Files
- `package.json` - Dependencies and scripts
- `next.config.ts` - Next.js configuration with security headers
- `tsconfig.json` - TypeScript configuration with path aliases
- `eslint.config.mjs` - ESLint rules for TypeScript/React
- `components.json` - shadcn/ui configuration
- `.env.example` - Environment variables template

### Source Code (`src/`)
```
src/
├── actions/           # Server Actions for data operations
├── app/              # Next.js App Router pages and API routes
├── backend/          # Redundant backend system
├── components/       # React components organized by feature
├── hooks/            # Custom React hooks
├── lib/              # Utility libraries and configurations
├── middleware.ts     # Next.js middleware
└── types/            # TypeScript type definitions
```

## Key Directories

### Actions (`src/actions/`)
Server Actions organized by business domain:
- `admin.ts` - Administrative operations
- `billing.ts` - Billing and payment processing
- `bookings.ts` - Hotel and garden bookings
- `customers.ts` - Customer management
- `menu.ts` - Menu item management
- `orders.ts` - Order processing and tracking
- `user.ts` - User authentication and management

### App Router (`src/app/`)
```
app/
├── api/              # API routes
├── dashboard/        # Manager dashboards
├── customer/         # Customer-facing pages
├── login/            # Authentication pages
├── qr-order/         # QR code ordering system
├── globals.css       # Global styles and design system
├── layout.tsx        # Root layout component
└── page.tsx          # Home page
```

### Components (`src/components/`)
Feature-based component organization:
- `analytics/` - Charts and reporting components
- `bar/` - Bar-specific components
- `billing/` - Invoice and payment components
- `booking/` - Reservation components
- `dashboard/` - Manager dashboard components
- `hotel/` - Hotel management components
- `kitchen/` - Kitchen display system
- `menu/` - Menu management components
- `orders/` - Order tracking and management
- `ui/` - Reusable UI components (shadcn/ui)

### Backend System (`src/backend/`)
```
backend/
├── cache/            # Redis and memory caching
├── core/             # Core system types and configuration
├── database/         # Database managers (Supabase-only)
├── load-balancer/    # Request distribution logic
├── logger/           # Comprehensive logging system
├── queue/            # Offline operation queue
├── servers/          # Express server management
├── index.ts          # Main backend orchestrator
└── start-servers.ts  # Server startup script
```

### Libraries (`src/lib/`)
Utility libraries and configurations:
- `auth.ts` - Authentication helpers
- `supabase/` - Supabase client configuration
- `utils.ts` - General utility functions
- `validation.ts` - Data validation schemas
- Performance and security utilities

## File Naming Conventions

### Components
- **PascalCase** for component files: `OrderTracker.tsx`
- **kebab-case** for component directories: `order-tracking/`
- **Index files** for barrel exports: `index.ts`

### Actions & Utilities
- **camelCase** for function files: `createOrder.ts`
- **kebab-case** for multi-word files: `user-management.ts`

### Pages & Routes
- **kebab-case** for route segments: `qr-order/`
- **Brackets** for dynamic routes: `[id]/`
- **Parentheses** for route groups: `(dashboard)/`

## Import Path Aliases
Configured in `tsconfig.json`:
```typescript
"@/*": ["./src/*"]           // Main source alias
"@/components": ["./src/components"]
"@/lib": ["./src/lib"]
"@/hooks": ["./src/hooks"]
"@/actions": ["./src/actions"]
```

## Configuration Structure
```
config/
├── cache.json        # Redis and caching configuration
├── database.json     # Database connection settings
├── loadbalancer.json # Load balancer configuration
├── logger.json       # Logging system settings
└── servers.json      # Server configuration
```

## Documentation Structure
- `docs/` - Comprehensive feature documentation
- `*.md` files in root - Implementation summaries and guides
- Inline code documentation with JSDoc comments

## Database Schema Organization
- **Business Units**: Separate collections/tables per unit type
- **Shared Resources**: Users, customers, inventory across units
- **Audit Trails**: Comprehensive logging for all operations
- **RLS Policies**: Row-level security for data isolation

## Component Architecture Patterns

### Server Components (Default)
- Data fetching components
- Static content rendering
- SEO-optimized pages

### Client Components (`"use client"`)
- Interactive UI components
- State management
- Event handlers
- Real-time updates

### Server Actions
- Form submissions
- Database mutations
- Authentication operations
- File uploads

## Testing Structure
- Unit test files alongside source: `component.test.tsx`
- Integration tests in `__tests__/` directories
- End-to-end tests for critical user flows