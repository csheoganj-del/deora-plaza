-- Create user_locations table
CREATE TABLE IF NOT EXISTS user_locations (
    "user_id" UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    "latitude" NUMERIC,
    "longitude" NUMERIC,
    "timestamp" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "metadata" JSONB DEFAULT '{}'::jsonb
);

-- Create activity_logs table
CREATE TABLE IF NOT EXISTS activity_logs (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "user_id" UUID REFERENCES users(id) ON DELETE SET NULL,
    "activity_type" TEXT NOT NULL,
    "description" TEXT,
    "latitude" NUMERIC,
    "longitude" NUMERIC,
    "timestamp" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "metadata" JSONB DEFAULT '{}'::jsonb
);

-- Enable RLS
ALTER TABLE user_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

-- user_locations policies
CREATE POLICY "Users can manage their own location" ON user_locations
    FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all locations" ON user_locations
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role IN ('super_admin', 'owner', 'manager')
        )
    );

CREATE POLICY "Public read for tracking" ON user_locations
    FOR SELECT
    USING (true); -- Or restrict to authenticated?

-- activity_logs policies
CREATE POLICY "Users can insert activities" ON activity_logs
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all activities" ON activity_logs
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role IN ('super_admin', 'owner', 'manager')
        )
    );
