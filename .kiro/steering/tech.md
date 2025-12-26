# Technology Stack & Build System

## Core Framework
- **Next.js 16** with App Router (React 19)
- **TypeScript 5** with strict mode enabled
- **Node.js 18+** runtime environment

## Frontend Stack
- **React 19** with Server Components and Server Actions
- **Tailwind CSS 4** with custom design system
- **Radix UI** components for accessibility
- **Framer Motion** for animations
- **Lucide React** for icons
- **shadcn/ui** component library (New York style)

## Backend Architecture
- **Redundant Backend System** with dual-server architecture
- **Supabase** for primary database (PostgreSQL)
- **Redis** for caching with memory fallback
- **Express.js** for custom backend servers
- **Load Balancer** with multiple modes (weighted, round-robin, failover)

## Database & Storage
- **PostgreSQL** (via Supabase) - Primary and only database
- **Redis** - Caching layer
- **Row Level Security (RLS)** for data isolation

## Authentication & Security
- **Supabase Auth** with custom JWT handling
- **bcryptjs** for password hashing
- **JOSE** for JWT operations
- **CSRF protection** and security headers
- **Rate limiting** and request validation
- **Environment-based secrets** (no hardcoded credentials)

## Development Tools
- **ESLint** with Next.js and TypeScript rules
- **tsx** for TypeScript execution
- **ts-node** for Node.js TypeScript support

## Common Commands

### Development
```bash
# Start Next.js development server
npm run dev

# Start redundant backend system
npm run backend:start

# Check backend system health
npm run backend:health

# Generate backend configuration files
npm run backend:config
```

### Production
```bash
# Build for production
npm run build

# Start production server
npm run start

# Lint code
npm run lint
```

### Backend Management
```bash
# Start both primary and secondary servers
npm run backend:start

# Health check all components
npm run backend:health

# Generate/update configuration files
npm run backend:config
```

## Environment Configuration
- Copy `.env.example` to `.env` and configure:
  - Supabase credentials
  - Redis connection (optional)
  - Server ports and load balancer settings
  - JWT secrets and security keys (REQUIRED - no defaults)

## Architecture Patterns
- **Server Actions** for data mutations
- **Server Components** for data fetching
- **Middleware chain** for request processing
- **Queue system** for offline operations
- **Circuit breaker** pattern for resilience
- **Automatic failover** between servers
- **Real-time subscriptions** for live updates

## Performance Features
- **Automatic caching** with Redis + memory fallback
- **Load balancing** across multiple servers
- **Database connection pooling**
- **Optimistic UI updates**
- **Image optimization** with Next.js
- **Bundle optimization** and code splitting