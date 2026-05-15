-- Create table for storing latest user locations
CREATE TABLE IF NOT EXISTS user_locations (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Create table for activity logging with location history
CREATE TABLE IF NOT EXISTS activity_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    activity_type VARCHAR(50) NOT NULL, -- 'login', 'booking_created', 'order_placed', 'check_in', etc.
    description TEXT,
    location_id UUID REFERENCES user_locations(user_id), -- Optional link to snapshot
    latitude DECIMAL(10, 8), -- Snapshot of location at time of activity
    longitude DECIMAL(11, 8),
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Enable RLS
ALTER TABLE user_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Public read access to user_locations" ON user_locations FOR SELECT USING (true);
CREATE POLICY "Users can update own location" ON user_locations FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own location update" ON user_locations FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all activities" ON activity_logs FOR SELECT USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('super_admin', 'owner', 'manager'))
);
CREATE POLICY "Users can insert activities" ON activity_logs FOR INSERT WITH CHECK (auth.uid() = user_id);
