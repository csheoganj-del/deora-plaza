-- Add DELETE policy for orders table
-- This allows authenticated users to delete orders (needed for Clear History functionality)

CREATE POLICY "Allow authenticated to delete orders" 
ON public.orders FOR DELETE 
TO authenticated 
USING (true);
