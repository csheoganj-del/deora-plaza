-- Create businessSettings table with all required columns
CREATE TABLE IF NOT EXISTS public."businessSettings" (
    "id" TEXT PRIMARY KEY DEFAULT 'default',
    "name" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "mobile" TEXT NOT NULL,
    "waiterlessMode" BOOLEAN DEFAULT false,
    "enablePasswordProtection" BOOLEAN DEFAULT true,
    "gstEnabled" BOOLEAN DEFAULT false,
    "gstNumber" TEXT DEFAULT '',
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add comments for clarity
COMMENT ON TABLE public."businessSettings" IS 'Business configuration settings';
COMMENT ON COLUMN public."businessSettings"."waiterlessMode" IS 'Enable direct billing without kitchen flow';
COMMENT ON COLUMN public."businessSettings"."gstEnabled" IS 'Enable GST tax calculation';
COMMENT ON COLUMN public."businessSettings"."gstNumber" IS 'Business GST registration number';

-- Insert default record if it doesn't exist
INSERT INTO public."businessSettings" ("id", "name", "address", "mobile", "waiterlessMode", "gstEnabled", "gstNumber", "createdAt", "updatedAt")
VALUES (
    'default',
    'Deora Plaza',
    '123 Hospitality Street, City, State 12345',
    '+1234567890',
    false,
    false,
    '',
    NOW(),
    NOW()
)
ON CONFLICT ("id") DO NOTHING;

-- Grant permissions
GRANT ALL ON TABLE public."businessSettings" TO anon;
GRANT ALL ON TABLE public."businessSettings" TO authenticated;
GRANT ALL ON TABLE public."businessSettings" TO service_role;