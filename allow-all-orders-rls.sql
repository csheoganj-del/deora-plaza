
-- Enable RLS on orders table if not already enabled (good practice)
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Allow authenticated to read orders" ON public.orders;
DROP POLICY IF EXISTS "Allow authenticated to insert orders" ON public.orders;
DROP POLICY IF EXISTS "Allow authenticated to update orders" ON public.orders;

-- Create comprehensive policies for authenticated users
CREATE POLICY "Allow authenticated to read orders" 
ON public.orders FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "Allow authenticated to insert orders" 
ON public.orders FOR INSERT 
TO authenticated 
WITH CHECK (true);

CREATE POLICY "Allow authenticated to update orders" 
ON public.orders FOR UPDATE 
TO authenticated 
USING (true);

-- Allow service role full access (usually default, but good to be explicit/fail-safe)
-- CREATE POLICY "Service role full access" ON public.orders FOR ALL TO service_role USING (true) WITH CHECK (true);
