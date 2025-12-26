# Supabase Environment Variable Setup

This document explains how to properly configure Supabase environment variables for the DEORA Plaza application.

## Required Environment Variables

The following environment variables are required for Supabase integration:

### Client-side Variables (Public)
These variables are safe to expose to the client-side:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
```

### Server-side Variables (Private)
These variables should be kept secret and only used on the server-side:

```env
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

## File Locations

Environment variables should be configured in the following files:

1. `.env` - Main environment file (committed to version control)
2. `.env.local` - Local environment overrides (NOT committed to version control)

## Configuration Steps

1. **Copy the example file:**
   ```bash
   cp .env.example .env.local
   ```

2. **Update the values in `.env.local`:**
   - Get your Supabase URL and keys from your Supabase project dashboard
   - Project Settings > API

3. **Verify your configuration:**
   ```bash
   node debug-env-vars.js
   ```

## Unified Configuration Approach

We've implemented a unified configuration approach in `src/lib/supabase/config.ts` that:

1. Loads environment variables using dotenv
2. Provides centralized configuration constants
3. Includes validation functions for both client and server configurations
4. Offers helper functions for error handling

### Usage in Client-side Code

```typescript
import { getSupabase } from '@/lib/supabase/client';

const supabase = getSupabase();
```

### Usage in Server-side Code

```typescript
import { getSupabaseServer } from '@/lib/supabase/server';

const supabase = getSupabaseServer();
```

## Troubleshooting

### Missing Environment Variables

If you see errors about missing environment variables:

1. Check that your `.env.local` file exists
2. Verify that all required variables are set
3. Ensure there are no typos in the variable names
4. Restart your development server

### Connection Issues

If you're having connection issues:

1. Verify your Supabase project URL is correct
2. Check that your API keys are valid
3. Ensure your Supabase project is not paused or disabled
4. Confirm network connectivity to Supabase

## Security Best Practices

1. **Never commit sensitive keys** to version control
2. **Use `.env.local`** for sensitive values
3. **Rotate keys regularly** through the Supabase dashboard
4. **Use service role keys sparingly** - only when necessary for server operations
5. **Monitor Supabase logs** for unauthorized access attempts

## Environment Variable Loading Order

The application loads environment variables in this order:

1. `.env` - Base configuration
2. `.env.local` - Local overrides (highest priority)

This ensures that local settings override base settings while maintaining a consistent configuration structure.