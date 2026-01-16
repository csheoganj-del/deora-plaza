-- FIX FOR ROOM STATUS UPDATE ERROR
-- The error 'record "new" has no field "updated_at"' is caused by a trigger trying to update a non-existent column.
-- The rooms table uses "updatedAt" (camelCase), but the trigger expects updated_at (snake_case).

-- 1. Create a function that uses the correct column name "updatedAt"
CREATE OR REPLACE FUNCTION public.handle_updated_at_camel()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if column exists or just set it (will fail if column missing, but we know it's "updatedAt")
  NEW."updatedAt" = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. Drop the old broken trigger(s). We try common names.
DROP TRIGGER IF EXISTS handle_updated_at ON public.rooms;
DROP TRIGGER IF EXISTS on_update_rooms ON public.rooms;
DROP TRIGGER IF EXISTS set_updated_at ON public.rooms;
DROP TRIGGER IF EXISTS update_rooms_modtime ON public.rooms;

-- 3. Attach the NEW correct trigger to the rooms table
-- This will run before every update and update the timestamp correctly
CREATE TRIGGER handle_updated_at
BEFORE UPDATE ON public.rooms
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at_camel();

-- 4. Verify the fix by selecting a room (optional)
SELECT id, number, status, "updatedAt" FROM public.rooms LIMIT 5;
