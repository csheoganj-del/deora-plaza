-- FIX: Drop the broken trigger identified in diagnostic
-- This trigger 'rooms_updated_at' calls 'set_updated_at()' which uses the wrong column name 'updated_at'
-- resulting in the error: record "new" has no field "updated_at"

DROP TRIGGER IF EXISTS rooms_updated_at ON public.rooms;

-- Also verify if we should drop the function to keep things clean (optional but good practice)
DROP FUNCTION IF EXISTS public.set_updated_at();

-- Note: We keep 'handle_updated_at' trigger which uses the correct 'handle_updated_at_camel()' function
