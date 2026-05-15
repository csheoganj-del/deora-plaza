-- DEORA Plaza - Comprehensive Database Schema
-- This migration creates all required tables for the complete system

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =============================================
-- AUDIT LOGS TABLE (Enhanced)
-- =============================================
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    level TEXT NOT NULL DEFAULT 'info' CHECK (level IN ('info', 'warn', 'error', 'critical')),
    action TEXT NOT NULL,
    user_id UUID,
    username TEXT,
    role TEXT,
    business_unit TEXT,
    resource TEXT,
    resource_id TEXT,
    details JSONB DEFAULT '{}',
    ip_address INET,
    user_agent TEXT,
    success BOOLEAN NOT NULL DEFAULT true,
    error_message TEXT,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for audit logs
CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON audit_logs(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource ON audit_logs(resource);
CREATE INDEX IF NOT EXISTS idx_audit_logs_success ON audit_logs(success);

-- =============================================
-- GST CONFIGURATION TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS gst_config (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_unit TEXT NOT NULL,
    gst_number TEXT,
    cgst_rate DECIMAL(5,2) NOT NULL DEFAULT 9.00,
    sgst_rate DECIMAL(5,2) NOT NULL DEFAULT 9.00,
    igst_rate DECIMAL(5,2) NOT NULL DEFAULT 0.00,
    total_gst_rate DECIMAL(5,2) NOT NULL DEFAULT 18.00,
    exempt_items TEXT[] DEFAULT '{}',
    is_active BOOLEAN NOT NULL DEFAULT true,
    effective_from TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    effective_to TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for GST config
CREATE INDEX IF NOT EXISTS idx_gst_config_business_unit ON gst_config(business_unit);
CREATE INDEX IF NOT EXISTS idx_gst_config_active ON gst_config(is_active);
CREATE INDEX IF NOT EXISTS idx_gst_config_effective ON gst_config(effective_from, effective_to);

-- =============================================
-- GST REPORTS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS gst_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    period TEXT NOT NULL,
    business_unit TEXT NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    total_sales DECIMAL(12,2) NOT NULL DEFAULT 0,
    taxable_sales DECIMAL(12,2) NOT NULL DEFAULT 0,
    exempt_sales DECIMAL(12,2) NOT NULL DEFAULT 0,
    cgst_collected DECIMAL(12,2) NOT NULL DEFAULT 0,
    sgst_collected DECIMAL(12,2) NOT NULL DEFAULT 0,
    igst_collected DECIMAL(12,2) NOT NULL DEFAULT 0,
    total_gst_collected DECIMAL(12,2) NOT NULL DEFAULT 0,
    gst_liability DECIMAL(12,2) NOT NULL DEFAULT 0,
    transaction_count INTEGER NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'filed')),
    generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    generated_by UUID NOT NULL,
    filed_at TIMESTAMPTZ,
    filed_by UUID
);

-- Indexes for GST reports
CREATE INDEX IF NOT EXISTS idx_gst_reports_period ON gst_reports(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_gst_reports_business_unit ON gst_reports(business_unit);
CREATE INDEX IF NOT EXISTS idx_gst_reports_status ON gst_reports(status);

-- =============================================
-- SETTLEMENTS TABLE (Enhanced)
-- =============================================
CREATE TABLE IF NOT EXISTS settlements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    date TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('daily', 'weekly', 'monthly', 'inter_departmental')),
    status TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'verified')),
    departments JSONB NOT NULL DEFAULT '{}',
    total_revenue DECIMAL(12,2) NOT NULL DEFAULT 0,
    total_gst DECIMAL(12,2) NOT NULL DEFAULT 0,
    total_discounts DECIMAL(12,2) NOT NULL DEFAULT 0,
    net_revenue DECIMAL(12,2) NOT NULL DEFAULT 0,
    created_by UUID NOT NULL,
    verified_by UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    verified_at TIMESTAMPTZ,
    notes TEXT
);

-- Indexes for settlements
CREATE INDEX IF NOT EXISTS idx_settlements_date ON settlements(date);
CREATE INDEX IF NOT EXISTS idx_settlements_type ON settlements(type);
CREATE INDEX IF NOT EXISTS idx_settlements_status ON settlements(status);
CREATE INDEX IF NOT EXISTS idx_settlements_created_at ON settlements(created_at DESC);

-- =============================================
-- INVENTORY TABLE (Enhanced)
-- =============================================
CREATE TABLE IF NOT EXISTS inventory (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    business_unit TEXT NOT NULL,
    sku TEXT NOT NULL,
    current_stock DECIMAL(10,3) NOT NULL DEFAULT 0,
    min_stock DECIMAL(10,3) NOT NULL DEFAULT 0,
    max_stock DECIMAL(10,3) NOT NULL DEFAULT 0,
    unit TEXT NOT NULL DEFAULT 'pieces',
    cost_price DECIMAL(10,2) NOT NULL DEFAULT 0,
    selling_price DECIMAL(10,2) NOT NULL DEFAULT 0,
    supplier TEXT,
    supplier_contact TEXT,
    last_restocked TIMESTAMPTZ,
    expiry_date DATE,
    location TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Unique constraint for SKU per business unit
ALTER TABLE inventory ADD CONSTRAINT unique_sku_per_business_unit 
    UNIQUE (sku, business_unit);

-- Indexes for inventory
CREATE INDEX IF NOT EXISTS idx_inventory_business_unit ON inventory(business_unit);
CREATE INDEX IF NOT EXISTS idx_inventory_category ON inventory(category);
CREATE INDEX IF NOT EXISTS idx_inventory_sku ON inventory(sku);
CREATE INDEX IF NOT EXISTS idx_inventory_stock_levels ON inventory(current_stock, min_stock);
CREATE INDEX IF NOT EXISTS idx_inventory_active ON inventory(is_active);

-- =============================================
-- STOCK MOVEMENTS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS stock_movements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    item_id UUID NOT NULL REFERENCES inventory(id) ON DELETE CASCADE,
    item_name TEXT NOT NULL,
    business_unit TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('in', 'out', 'adjustment', 'waste', 'transfer')),
    quantity DECIMAL(10,3) NOT NULL,
    previous_stock DECIMAL(10,3) NOT NULL,
    new_stock DECIMAL(10,3) NOT NULL,
    reason TEXT NOT NULL,
    reference TEXT,
    performed_by UUID NOT NULL,
    performed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    cost DECIMAL(10,2),
    notes TEXT
);

-- Indexes for stock movements
CREATE INDEX IF NOT EXISTS idx_stock_movements_item_id ON stock_movements(item_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_business_unit ON stock_movements(business_unit);
CREATE INDEX IF NOT EXISTS idx_stock_movements_type ON stock_movements(type);
CREATE INDEX IF NOT EXISTS idx_stock_movements_performed_at ON stock_movements(performed_at DESC);

-- =============================================
-- LOW STOCK ALERTS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS low_stock_alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    item_id UUID NOT NULL REFERENCES inventory(id) ON DELETE CASCADE,
    item_name TEXT NOT NULL,
    business_unit TEXT NOT NULL,
    current_stock DECIMAL(10,3) NOT NULL,
    min_stock DECIMAL(10,3) NOT NULL,
    severity TEXT NOT NULL CHECK (severity IN ('low', 'critical', 'out_of_stock')),
    alert_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    is_resolved BOOLEAN NOT NULL DEFAULT false,
    resolved_at TIMESTAMPTZ,
    resolved_by UUID
);

-- Indexes for low stock alerts
CREATE INDEX IF NOT EXISTS idx_low_stock_alerts_item_id ON low_stock_alerts(item_id);
CREATE INDEX IF NOT EXISTS idx_low_stock_alerts_business_unit ON low_stock_alerts(business_unit);
CREATE INDEX IF NOT EXISTS idx_low_stock_alerts_severity ON low_stock_alerts(severity);
CREATE INDEX IF NOT EXISTS idx_low_stock_alerts_resolved ON low_stock_alerts(is_resolved);

-- =============================================
-- ENHANCED BILLS TABLE (Add missing columns)
-- =============================================
-- Add missing columns to existing bills table
ALTER TABLE bills ADD COLUMN IF NOT EXISTS cgst_amount DECIMAL(10,2) DEFAULT 0;
ALTER TABLE bills ADD COLUMN IF NOT EXISTS sgst_amount DECIMAL(10,2) DEFAULT 0;
ALTER TABLE bills ADD COLUMN IF NOT EXISTS igst_amount DECIMAL(10,2) DEFAULT 0;
ALTER TABLE bills ADD COLUMN IF NOT EXISTS customer_gstin TEXT;
ALTER TABLE bills ADD COLUMN IF NOT EXISTS is_gst_exempt BOOLEAN DEFAULT false;
ALTER TABLE bills ADD COLUMN IF NOT EXISTS exempt_reason TEXT;
ALTER TABLE bills ADD COLUMN IF NOT EXISTS is_settled BOOLEAN DEFAULT false;
ALTER TABLE bills ADD COLUMN IF NOT EXISTS settlement_id UUID REFERENCES settlements(id);
ALTER TABLE bills ADD COLUMN IF NOT EXISTS settled_at TIMESTAMPTZ;

-- Indexes for enhanced bills
CREATE INDEX IF NOT EXISTS idx_bills_settlement ON bills(settlement_id);
CREATE INDEX IF NOT EXISTS idx_bills_settled ON bills(is_settled);
CREATE INDEX IF NOT EXISTS idx_bills_gst_exempt ON bills(is_gst_exempt);

-- =============================================
-- ENHANCED ORDERS TABLE (Add missing columns)
-- =============================================
-- Add missing columns to existing orders table
ALTER TABLE orders ADD COLUMN IF NOT EXISTS timeline JSONB DEFAULT '[]';
ALTER TABLE orders ADD COLUMN IF NOT EXISTS pending_at TIMESTAMPTZ;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS preparing_at TIMESTAMPTZ;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS ready_at TIMESTAMPTZ;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS served_at TIMESTAMPTZ;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS is_paid BOOLEAN DEFAULT false;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS bill_id UUID REFERENCES bills(id);

-- Indexes for enhanced orders
CREATE INDEX IF NOT EXISTS idx_orders_bill_id ON orders(bill_id);
CREATE INDEX IF NOT EXISTS idx_orders_is_paid ON orders(is_paid);
CREATE INDEX IF NOT EXISTS idx_orders_status_timestamps ON orders(status, pending_at, preparing_at, ready_at);

-- =============================================
-- ENHANCED TABLES TABLE (Add missing columns)
-- =============================================
-- Add missing columns to existing tables table
ALTER TABLE tables ADD COLUMN IF NOT EXISTS customer_count INTEGER DEFAULT 0;
ALTER TABLE tables ADD COLUMN IF NOT EXISTS current_order_id UUID REFERENCES orders(id);

-- Indexes for enhanced tables
CREATE INDEX IF NOT EXISTS idx_tables_current_order ON tables(current_order_id);
CREATE INDEX IF NOT EXISTS idx_tables_customer_count ON tables(customer_count);

-- =============================================
-- NOTIFICATIONS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    type TEXT NOT NULL CHECK (type IN ('order_ready', 'low_stock', 'payment_received', 'booking_confirmed', 'system_alert')),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    recipient_id UUID,
    recipient_role TEXT,
    business_unit TEXT,
    is_read BOOLEAN NOT NULL DEFAULT false,
    priority TEXT NOT NULL DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
    data JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    read_at TIMESTAMPTZ
);

-- Indexes for notifications
CREATE INDEX IF NOT EXISTS idx_notifications_recipient ON notifications(recipient_id);
CREATE INDEX IF NOT EXISTS idx_notifications_role ON notifications(recipient_role);
CREATE INDEX IF NOT EXISTS idx_notifications_business_unit ON notifications(business_unit);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON notifications(is_read, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_priority ON notifications(priority);

-- =============================================
-- SYSTEM SETTINGS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS system_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    key TEXT NOT NULL UNIQUE,
    value JSONB NOT NULL,
    description TEXT,
    category TEXT NOT NULL DEFAULT 'general',
    is_public BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for system settings
CREATE INDEX IF NOT EXISTS idx_system_settings_category ON system_settings(category);
CREATE INDEX IF NOT EXISTS idx_system_settings_public ON system_settings(is_public);

-- =============================================
-- USER SESSIONS TABLE (for enhanced security)
-- =============================================
CREATE TABLE IF NOT EXISTS user_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    session_token TEXT NOT NULL UNIQUE,
    ip_address INET,
    user_agent TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    last_activity TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for user sessions
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_token ON user_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_user_sessions_active ON user_sessions(is_active, expires_at);

-- =============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =============================================

-- Enable RLS on all tables
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE gst_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE gst_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE settlements ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE low_stock_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (basic - can be enhanced based on requirements)

-- Audit logs: Only super admins can view all, users can view their own
CREATE POLICY "audit_logs_select_policy" ON audit_logs
    FOR SELECT USING (
        auth.jwt() ->> 'role' = 'super_admin' OR 
        user_id = (auth.jwt() ->> 'userId')::UUID
    );

-- GST config: Financial access required
CREATE POLICY "gst_config_select_policy" ON gst_config
    FOR SELECT USING (
        auth.jwt() ->> 'role' IN ('super_admin', 'owner', 'manager', 'cafe_manager', 'bar_manager', 'hotel_manager', 'garden_manager')
    );

-- Settlements: Financial access required
CREATE POLICY "settlements_select_policy" ON settlements
    FOR SELECT USING (
        auth.jwt() ->> 'role' IN ('super_admin', 'owner', 'manager', 'cafe_manager', 'bar_manager', 'hotel_manager', 'garden_manager')
    );

-- Inventory: Business unit access
CREATE POLICY "inventory_select_policy" ON inventory
    FOR SELECT USING (
        auth.jwt() ->> 'role' = 'super_admin' OR
        auth.jwt() ->> 'businessUnit' = 'all' OR
        business_unit = auth.jwt() ->> 'businessUnit'
    );

-- Notifications: User-specific or role-based
CREATE POLICY "notifications_select_policy" ON notifications
    FOR SELECT USING (
        recipient_id = (auth.jwt() ->> 'userId')::UUID OR
        recipient_role = auth.jwt() ->> 'role' OR
        (business_unit = auth.jwt() ->> 'businessUnit' AND recipient_role IS NULL)
    );

-- System settings: Public settings for all, private for admins
CREATE POLICY "system_settings_select_policy" ON system_settings
    FOR SELECT USING (
        is_public = true OR
        auth.jwt() ->> 'role' IN ('super_admin', 'owner')
    );

-- =============================================
-- FUNCTIONS AND TRIGGERS
-- =============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add updated_at triggers to relevant tables
CREATE TRIGGER update_gst_config_updated_at BEFORE UPDATE ON gst_config
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_inventory_updated_at BEFORE UPDATE ON inventory
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_system_settings_updated_at BEFORE UPDATE ON system_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to automatically create low stock alerts
CREATE OR REPLACE FUNCTION check_low_stock()
RETURNS TRIGGER AS $$
BEGIN
    -- Check if stock is below minimum
    IF NEW.current_stock <= NEW.min_stock THEN
        -- Insert or update low stock alert
        INSERT INTO low_stock_alerts (
            item_id, item_name, business_unit, current_stock, min_stock,
            severity, alert_date, is_resolved
        ) VALUES (
            NEW.id, NEW.name, NEW.business_unit, NEW.current_stock, NEW.min_stock,
            CASE 
                WHEN NEW.current_stock = 0 THEN 'out_of_stock'
                WHEN NEW.current_stock <= NEW.min_stock * 0.5 THEN 'critical'
                ELSE 'low'
            END,
            NOW(), false
        )
        ON CONFLICT (item_id) WHERE is_resolved = false
        DO UPDATE SET
            current_stock = NEW.current_stock,
            severity = CASE 
                WHEN NEW.current_stock = 0 THEN 'out_of_stock'
                WHEN NEW.current_stock <= NEW.min_stock * 0.5 THEN 'critical'
                ELSE 'low'
            END,
            alert_date = NOW();
    ELSE
        -- Resolve existing alerts if stock is above minimum
        UPDATE low_stock_alerts 
        SET is_resolved = true, resolved_at = NOW()
        WHERE item_id = NEW.id AND is_resolved = false;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for automatic low stock alerts
CREATE TRIGGER inventory_low_stock_check
    AFTER UPDATE OF current_stock ON inventory
    FOR EACH ROW
    EXECUTE FUNCTION check_low_stock();

-- =============================================
-- INSERT DEFAULT DATA
-- =============================================

-- Insert default system settings
-- Note: Default system settings should be configured through admin panel
-- No sample data inserted here

-- Note: Default GST configurations should be set up through admin panel
-- No sample data inserted here

-- =============================================
-- VIEWS FOR REPORTING
-- =============================================

-- View for inventory summary by business unit
CREATE OR REPLACE VIEW inventory_summary AS
SELECT 
    business_unit,
    category,
    COUNT(*) as total_items,
    SUM(current_stock * cost_price) as total_value,
    COUNT(*) FILTER (WHERE current_stock <= min_stock AND current_stock > 0) as low_stock_items,
    COUNT(*) FILTER (WHERE current_stock = 0) as out_of_stock_items
FROM inventory 
WHERE is_active = true
GROUP BY business_unit, category;

-- View for daily revenue summary
CREATE OR REPLACE VIEW daily_revenue_summary AS
SELECT 
    DATE(created_at) as date,
    business_unit,
    COUNT(*) as total_orders,
    SUM(grand_total) as total_revenue,
    SUM(gst_amount) as total_gst,
    SUM(discount_amount) as total_discounts,
    AVG(grand_total) as average_order_value
FROM bills 
WHERE payment_status = 'paid'
GROUP BY DATE(created_at), business_unit
ORDER BY date DESC, business_unit;

-- View for unresolved alerts
CREATE OR REPLACE VIEW unresolved_alerts AS
SELECT 
    'low_stock' as alert_type,
    business_unit,
    item_name as subject,
    severity as priority,
    alert_date as created_at
FROM low_stock_alerts 
WHERE is_resolved = false
UNION ALL
SELECT 
    'notification' as alert_type,
    business_unit,
    title as subject,
    priority,
    created_at
FROM notifications 
WHERE is_read = false AND priority IN ('high', 'urgent')
ORDER BY created_at DESC;

-- =============================================
-- COMPLETION MESSAGE
-- =============================================

-- Log the completion of schema setup
INSERT INTO audit_logs (action, details, success, level) VALUES (
    'SCHEMA_SETUP_COMPLETE',
    '{"message": "Comprehensive database schema setup completed successfully", "tables_created": ["audit_logs", "gst_config", "gst_reports", "settlements", "inventory", "stock_movements", "low_stock_alerts", "notifications", "system_settings", "user_sessions"], "views_created": ["inventory_summary", "daily_revenue_summary", "unresolved_alerts"]}',
    true,
    'info'
);

COMMIT;