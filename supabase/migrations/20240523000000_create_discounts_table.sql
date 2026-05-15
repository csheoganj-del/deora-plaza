-- Create discounts table with camelCase columns to match application code
CREATE TABLE IF NOT EXISTS discounts (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "code" TEXT NOT NULL UNIQUE,
    "type" TEXT NOT NULL CHECK ("type" IN ('percentage', 'fixed')),
    "value" NUMERIC NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN DEFAULT true,
    "validFrom" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "validUntil" TIMESTAMP WITH TIME ZONE,
    "usageCount" INTEGER DEFAULT 0,
    "maxUsage" INTEGER,
    "minOrderValue" NUMERIC DEFAULT 0,
    "applicableBusinessUnits" TEXT[] DEFAULT '{}',
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Search index for code
CREATE INDEX IF NOT EXISTS discounts_code_idx ON discounts("code");

-- RLS Policies
ALTER TABLE discounts ENABLE ROW LEVEL SECURITY;

-- Admins can do everything
CREATE POLICY "Admins can do everything on discounts" ON discounts
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role IN ('super_admin', 'owner', 'manager')
        )
    );

-- Public (authenticated users) can read active discounts
CREATE POLICY "Users can read active discounts" ON discounts
    FOR SELECT
    USING (
        "isActive" = true 
        AND ("validUntil" IS NULL OR "validUntil" > NOW())
    );
