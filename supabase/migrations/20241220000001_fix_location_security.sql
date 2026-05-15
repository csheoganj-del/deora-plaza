-- Fix Location Security Policies and Add Privacy Controls
-- This migration addresses security issues identified in the location features analysis

-- =============================================
-- 1. CREATE LOCATION PERMISSIONS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS location_permissions (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    can_track BOOLEAN NOT NULL DEFAULT false,
    can_view BOOLEAN NOT NULL DEFAULT false,
    can_export BOOLEAN NOT NULL DEFAULT false,
    consent_given BOOLEAN NOT NULL DEFAULT false,
    consent_date TIMESTAMPTZ,
    retention_days INTEGER NOT NULL DEFAULT 90,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS on location permissions
ALTER TABLE location_permissions ENABLE ROW LEVEL SECURITY;

-- Users can manage their own permissions
CREATE POLICY "Users can manage own location permissions" ON location_permissions
    FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Admins can view all permissions
CREATE POLICY "Admins can view location permissions" ON location_permissions
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role IN ('super_admin', 'owner', 'manager')
        )
    );

-- =============================================
-- 2. CREATE GEOFENCES TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS geofences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('work_zone', 'delivery_zone', 'restricted_zone')),
    coordinates JSONB NOT NULL, -- Array of {latitude, longitude} objects
    radius NUMERIC NOT NULL DEFAULT 100, -- in meters
    business_unit TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    actions JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS on geofences
ALTER TABLE geofences ENABLE ROW LEVEL SECURITY;

-- Only admins can manage geofences
CREATE POLICY "Admins can manage geofences" ON geofences
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role IN ('super_admin', 'owner', 'manager')
        )
    );

-- =============================================
-- 3. CREATE LOCATION EVENTS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS location_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    event_type TEXT NOT NULL CHECK (event_type IN ('entry', 'exit', 'check_in', 'check_out', 'order_placed')),
    location_id UUID,
    latitude NUMERIC,
    longitude NUMERIC,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Enable RLS on location events
ALTER TABLE location_events ENABLE ROW LEVEL SECURITY;

-- Users can insert their own events
CREATE POLICY "Users can insert location events" ON location_events
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Users can view their own events
CREATE POLICY "Users can view own location events" ON location_events
    FOR SELECT
    USING (auth.uid() = user_id);

-- Admins can view all events
CREATE POLICY "Admins can view all location events" ON location_events
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role IN ('super_admin', 'owner', 'manager')
        )
    );

-- =============================================
-- 4. FIX EXISTING LOCATION TABLES SECURITY
-- =============================================

-- Drop the insecure public read policy
DROP POLICY IF EXISTS "Public read for tracking" ON user_locations;

-- Create secure policies for user_locations
CREATE POLICY "Users can manage own location" ON user_locations
    FOR ALL
    USING (
        auth.uid() = user_id AND
        EXISTS (
            SELECT 1 FROM location_permissions
            WHERE location_permissions.user_id = auth.uid()
            AND location_permissions.can_track = true
        )
    )
    WITH CHECK (
        auth.uid() = user_id AND
        EXISTS (
            SELECT 1 FROM location_permissions
            WHERE location_permissions.user_id = auth.uid()
            AND location_permissions.can_track = true
        )
    );

-- Admins can view locations (but only if user has granted permission)
CREATE POLICY "Admins can view permitted locations" ON user_locations
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role IN ('super_admin', 'owner', 'manager')
        ) AND
        EXISTS (
            SELECT 1 FROM location_permissions
            WHERE location_permissions.user_id = user_locations.user_id
            AND location_permissions.can_view = true
        )
    );

-- Update activity_logs policies to respect permissions
DROP POLICY IF EXISTS "Users can insert activities" ON activity_logs;
DROP POLICY IF EXISTS "Admins can view all activities" ON activity_logs;

CREATE POLICY "Users can insert permitted activities" ON activity_logs
    FOR INSERT
    WITH CHECK (
        auth.uid() = user_id AND
        EXISTS (
            SELECT 1 FROM location_permissions
            WHERE location_permissions.user_id = auth.uid()
            AND location_permissions.can_track = true
        )
    );

CREATE POLICY "Users can view own activities" ON activity_logs
    FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Admins can view permitted activities" ON activity_logs
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role IN ('super_admin', 'owner', 'manager')
        ) AND
        EXISTS (
            SELECT 1 FROM location_permissions
            WHERE location_permissions.user_id = activity_logs.user_id
            AND location_permissions.can_view = true
        )
    );

-- =============================================
-- 5. DATA RETENTION FUNCTION
-- =============================================
CREATE OR REPLACE FUNCTION cleanup_old_location_data()
RETURNS void AS $$
DECLARE
    user_record RECORD;
    cutoff_date TIMESTAMPTZ;
BEGIN
    -- Clean up data based on each user's retention preference
    FOR user_record IN 
        SELECT user_id, retention_days 
        FROM location_permissions 
        WHERE consent_given = true
    LOOP
        cutoff_date := NOW() - (user_record.retention_days || ' days')::INTERVAL;
        
        -- Delete old activity logs
        DELETE FROM activity_logs 
        WHERE user_id = user_record.user_id 
        AND timestamp < cutoff_date;
        
        -- Delete old location events
        DELETE FROM location_events 
        WHERE user_id = user_record.user_id 
        AND timestamp < cutoff_date;
    END LOOP;
    
    -- Clean up data for users who have revoked consent
    DELETE FROM activity_logs 
    WHERE user_id IN (
        SELECT user_id FROM location_permissions 
        WHERE consent_given = false
    );
    
    DELETE FROM location_events 
    WHERE user_id IN (
        SELECT user_id FROM location_permissions 
        WHERE consent_given = false
    );
    
    DELETE FROM user_locations 
    WHERE user_id IN (
        SELECT user_id FROM location_permissions 
        WHERE consent_given = false
    );
    
    RAISE NOTICE 'Location data cleanup completed';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- 6. CREATE INDEXES FOR PERFORMANCE
-- =============================================
CREATE INDEX IF NOT EXISTS idx_location_permissions_user_id ON location_permissions(user_id);
CREATE INDEX IF NOT EXISTS idx_location_permissions_consent ON location_permissions(consent_given);

CREATE INDEX IF NOT EXISTS idx_geofences_business_unit ON geofences(business_unit);
CREATE INDEX IF NOT EXISTS idx_geofences_active ON geofences(is_active);

CREATE INDEX IF NOT EXISTS idx_location_events_user_id ON location_events(user_id);
CREATE INDEX IF NOT EXISTS idx_location_events_timestamp ON location_events(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_location_events_type ON location_events(event_type);

-- =============================================
-- 7. CREATE TRIGGER FOR UPDATED_AT
-- =============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_location_permissions_updated_at
    BEFORE UPDATE ON location_permissions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_geofences_updated_at
    BEFORE UPDATE ON geofences
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- 8. GRANT NECESSARY PERMISSIONS
-- =============================================
-- Grant execute permission on cleanup function to authenticated users
GRANT EXECUTE ON FUNCTION cleanup_old_location_data() TO authenticated;

-- =============================================
-- 9. INSERT DEFAULT GEOFENCES (EXAMPLE)
-- =============================================
-- Insert example work zones for each business unit
INSERT INTO geofences (name, type, coordinates, radius, business_unit, is_active, actions)
VALUES 
    (
        'Main Cafe Work Zone',
        'work_zone',
        '[{"latitude": 40.7128, "longitude": -74.0060}]'::jsonb,
        50,
        'cafe',
        true,
        '[{"type": "log", "target": "work_attendance", "parameters": {}}]'::jsonb
    ),
    (
        'Restaurant Work Zone',
        'work_zone',
        '[{"latitude": 40.7130, "longitude": -74.0065}]'::jsonb,
        50,
        'restaurant',
        true,
        '[{"type": "log", "target": "work_attendance", "parameters": {}}]'::jsonb
    ),
    (
        'Bar Work Zone',
        'work_zone',
        '[{"latitude": 40.7132, "longitude": -74.0070}]'::jsonb,
        50,
        'bar',
        true,
        '[{"type": "log", "target": "work_attendance", "parameters": {}}]'::jsonb
    ),
    (
        'Hotel Work Zone',
        'work_zone',
        '[{"latitude": 40.7134, "longitude": -74.0075}]'::jsonb,
        100,
        'hotel',
        true,
        '[{"type": "log", "target": "work_attendance", "parameters": {}}]'::jsonb
    ),
    (
        'Garden Work Zone',
        'work_zone',
        '[{"latitude": 40.7150, "longitude": -74.0100}]'::jsonb,
        200,
        'garden',
        true,
        '[{"type": "log", "target": "work_attendance", "parameters": {}}]'::jsonb
    )
ON CONFLICT DO NOTHING;

-- =============================================
-- 10. COMMENTS FOR DOCUMENTATION
-- =============================================
COMMENT ON TABLE location_permissions IS 'Stores user consent and preferences for location tracking';
COMMENT ON TABLE geofences IS 'Defines geographic zones for work areas, delivery zones, etc.';
COMMENT ON TABLE location_events IS 'Logs location-based events like check-ins, orders, etc.';
COMMENT ON FUNCTION cleanup_old_location_data() IS 'Cleans up old location data based on user retention preferences';

-- Migration completed successfully
SELECT 'Location security migration completed successfully' as status;