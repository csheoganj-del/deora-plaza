-- DEORA Plaza - Complete Database Schema for Supabase
-- Run this in your Supabase SQL Editor

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table for authentication and staff management
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    phone_number TEXT,
    password TEXT NOT NULL,
    auth_method TEXT DEFAULT 'password' CHECK (auth_method IN ('password', 'phone')),
    role TEXT NOT NULL DEFAULT 'staff' CHECK (role IN ('super_admin', 'owner', 'manager', 'cafe_manager', 'bar_manager', 'hotel_manager', 'garden_manager', 'waiter', 'kitchen', 'bartender', 'reception', 'hotel_reception', 'staff')),
    business_unit TEXT NOT NULL DEFAULT 'cafe' CHECK (business_unit IN ('all', 'cafe', 'bar', 'hotel', 'garden')),
    name TEXT NOT NULL,
    permissions JSONB DEFAULT '[]',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Business settings for each unit
CREATE TABLE IF NOT EXISTS business_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_unit TEXT NOT NULL UNIQUE CHECK (business_unit IN ('cafe', 'bar', 'hotel', 'garden')),
    name TEXT NOT NULL,
    address TEXT,
    phone TEXT,
    email TEXT,
    gst_number TEXT,
    enable_password_protection BOOLEAN DEFAULT true,
    default_gst_rate DECIMAL(5,2) DEFAULT 18.00,
    enable_waiterless_mode BOOLEAN DEFAULT false,
    enable_table_booking BOOLEAN DEFAULT true,
    enable_room_service BOOLEAN DEFAULT false,
    operating_hours JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Categories for menu items
CREATE TABLE IF NOT EXISTS categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    business_unit TEXT NOT NULL CHECK (business_unit IN ('cafe', 'bar', 'hotel', 'garden')),
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(name, business_unit)
);

-- Menu items
CREATE TABLE IF NOT EXISTS menu_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    category_id UUID REFERENCES categories(id),
    business_unit TEXT NOT NULL CHECK (business_unit IN ('cafe', 'bar', 'hotel', 'garden')),
    is_available BOOLEAN DEFAULT true,
    is_drink BOOLEAN DEFAULT false,
    measurement TEXT,
    measurement_unit TEXT,
    base_measurement DECIMAL(10,2),
    image_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tables for restaurant/cafe/bar
CREATE TABLE IF NOT EXISTS tables (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    table_number TEXT NOT NULL,
    business_unit TEXT NOT NULL CHECK (business_unit IN ('cafe', 'bar', 'hotel', 'garden')),
    capacity INTEGER DEFAULT 4,
    status TEXT DEFAULT 'available' CHECK (status IN ('available', 'occupied', 'reserved', 'maintenance')),
    current_order_id UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(table_number, business_unit)
);

-- Customers
CREATE TABLE IF NOT EXISTS customers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    mobile_number TEXT UNIQUE NOT NULL,
    name TEXT,
    email TEXT,
    visit_count INTEGER DEFAULT 0,
    total_spent DECIMAL(10,2) DEFAULT 0,
    last_visit TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Rooms for hotel
CREATE TABLE IF NOT EXISTS rooms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    number TEXT UNIQUE NOT NULL,
    type TEXT NOT NULL,
    capacity INTEGER DEFAULT 2,
    status TEXT DEFAULT 'available' CHECK (status IN ('available', 'occupied', 'maintenance', 'reserved')),
    price_per_night DECIMAL(10,2) NOT NULL,
    amenities JSONB DEFAULT '[]',
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Orders
CREATE TABLE IF NOT EXISTS orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_number TEXT UNIQUE NOT NULL,
    table_id UUID REFERENCES tables(id),
    table_number TEXT,
    customer_mobile TEXT,
    type TEXT DEFAULT 'dine_in' CHECK (type IN ('dine_in', 'takeaway', 'delivery', 'room_service')),
    business_unit TEXT NOT NULL CHECK (business_unit IN ('cafe', 'bar', 'hotel', 'garden')),
    room_number TEXT,
    source TEXT DEFAULT 'pos' CHECK (source IN ('pos', 'qr', 'online', 'phone')),
    guest_count INTEGER DEFAULT 1,
    items JSONB NOT NULL DEFAULT '[]',
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'preparing', 'ready', 'served', 'completed', 'cancelled')),
    settlement_status TEXT DEFAULT 'pending' CHECK (settlement_status IN ('pending', 'partial', 'completed')),
    bill_id UUID,
    booking_id UUID,
    is_paid BOOLEAN DEFAULT false,
    total_amount DECIMAL(10,2) DEFAULT 0,
    payment_synced_at TIMESTAMPTZ,
    payment_receipt TEXT,
    timeline JSONB DEFAULT '{}',
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    pending_at TIMESTAMPTZ,
    preparing_at TIMESTAMPTZ,
    ready_at TIMESTAMPTZ,
    served_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ
);

-- Bills
CREATE TABLE IF NOT EXISTS bills (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    bill_number TEXT UNIQUE NOT NULL,
    order_id UUID REFERENCES orders(id),
    business_unit TEXT NOT NULL CHECK (business_unit IN ('cafe', 'bar', 'hotel', 'garden')),
    customer_mobile TEXT,
    customer_name TEXT,
    subtotal DECIMAL(10,2) NOT NULL DEFAULT 0,
    discount_percent DECIMAL(5,2) DEFAULT 0,
    discount_amount DECIMAL(10,2) DEFAULT 0,
    gst_percent DECIMAL(5,2) DEFAULT 18.00,
    gst_amount DECIMAL(10,2) DEFAULT 0,
    grand_total DECIMAL(10,2) NOT NULL DEFAULT 0,
    amount_paid DECIMAL(10,2) DEFAULT 0,
    payment_method TEXT,
    payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'partial', 'completed', 'refunded')),
    source TEXT DEFAULT 'pos',
    address TEXT,
    items JSONB NOT NULL DEFAULT '[]',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Bookings for hotel and garden
CREATE TABLE IF NOT EXISTS bookings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_number TEXT UNIQUE NOT NULL,
    customer_mobile TEXT NOT NULL,
    customer_name TEXT NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    room_id UUID REFERENCES rooms(id),
    room_number TEXT,
    base_price DECIMAL(10,2) NOT NULL DEFAULT 0,
    room_service_total DECIMAL(10,2) DEFAULT 0,
    room_service_charges JSONB DEFAULT '[]',
    gst_enabled BOOLEAN DEFAULT true,
    gst_percentage DECIMAL(5,2) DEFAULT 18.00,
    gst_amount DECIMAL(10,2) DEFAULT 0,
    discount_percent DECIMAL(5,2) DEFAULT 0,
    discount_amount DECIMAL(10,2) DEFAULT 0,
    total_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
    advance_payment DECIMAL(10,2) DEFAULT 0,
    payments JSONB DEFAULT '[]',
    total_paid DECIMAL(10,2) DEFAULT 0,
    remaining_balance DECIMAL(10,2) DEFAULT 0,
    payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'partial', 'completed', 'refunded')),
    status TEXT DEFAULT 'confirmed' CHECK (status IN ('pending', 'confirmed', 'checked_in', 'checked_out', 'cancelled')),
    type TEXT DEFAULT 'hotel' CHECK (type IN ('hotel', 'garden')),
    event_type TEXT,
    guest_count INTEGER DEFAULT 1,
    notes TEXT,
    receipt_number TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Inventory
CREATE TABLE IF NOT EXISTS inventory (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    item_name TEXT NOT NULL,
    category TEXT,
    business_unit TEXT NOT NULL CHECK (business_unit IN ('cafe', 'bar', 'hotel', 'garden')),
    current_stock DECIMAL(10,2) DEFAULT 0,
    unit TEXT NOT NULL,
    min_stock_level DECIMAL(10,2) DEFAULT 0,
    max_stock_level DECIMAL(10,2),
    cost_per_unit DECIMAL(10,2) DEFAULT 0,
    supplier TEXT,
    last_restocked TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(item_name, business_unit)
);

-- Stock movements
CREATE TABLE IF NOT EXISTS stock_movements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    inventory_id UUID REFERENCES inventory(id),
    movement_type TEXT NOT NULL CHECK (movement_type IN ('in', 'out', 'adjustment', 'waste')),
    quantity DECIMAL(10,2) NOT NULL,
    reason TEXT,
    reference_id UUID,
    reference_type TEXT,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- GST configuration
CREATE TABLE IF NOT EXISTS gst_config (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_unit TEXT NOT NULL CHECK (business_unit IN ('cafe', 'bar', 'hotel', 'garden')),
    gst_number TEXT NOT NULL,
    cgst_rate DECIMAL(5,2) DEFAULT 9.00,
    sgst_rate DECIMAL(5,2) DEFAULT 9.00,
    igst_rate DECIMAL(5,2) DEFAULT 18.00,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(business_unit)
);

-- System settings
CREATE TABLE IF NOT EXISTS system_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    key TEXT UNIQUE NOT NULL,
    value TEXT,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Audit logs
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    action TEXT NOT NULL,
    user_id UUID REFERENCES users(id),
    username TEXT,
    role TEXT,
    business_unit TEXT,
    details JSONB,
    ip_address TEXT,
    user_agent TEXT,
    success BOOLEAN DEFAULT true,
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Notifications
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    user_id UUID REFERENCES users(id),
    business_unit TEXT,
    is_read BOOLEAN DEFAULT false,
    data JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Settlements
CREATE TABLE IF NOT EXISTS settlements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_unit TEXT NOT NULL CHECK (business_unit IN ('cafe', 'bar', 'hotel', 'garden')),
    date DATE NOT NULL,
    total_sales DECIMAL(10,2) DEFAULT 0,
    total_orders INTEGER DEFAULT 0,
    cash_sales DECIMAL(10,2) DEFAULT 0,
    card_sales DECIMAL(10,2) DEFAULT 0,
    upi_sales DECIMAL(10,2) DEFAULT 0,
    total_gst DECIMAL(10,2) DEFAULT 0,
    total_discounts DECIMAL(10,2) DEFAULT 0,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(business_unit, date)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_business_unit ON orders(business_unit);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);
CREATE INDEX IF NOT EXISTS idx_bills_business_unit ON bills(business_unit);
CREATE INDEX IF NOT EXISTS idx_bills_created_at ON bills(created_at);
CREATE INDEX IF NOT EXISTS idx_menu_items_business_unit ON menu_items(business_unit);
CREATE INDEX IF NOT EXISTS idx_tables_business_unit ON tables(business_unit);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);

-- Note: Default system settings should be configured through admin panel
-- No sample data inserted here

-- Enable Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE bills ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (basic policies - you can customize these)
CREATE POLICY "Users can view their own data" ON users FOR SELECT USING (auth.uid()::text = id::text);
CREATE POLICY "Super admins can view all users" ON users FOR ALL USING (
    EXISTS (
        SELECT 1 FROM users 
        WHERE id::text = auth.uid()::text 
        AND role IN ('super_admin', 'owner')
    )
);

-- Create policies for other tables (similar pattern)
CREATE POLICY "Users can view orders in their business unit" ON orders FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM users 
        WHERE id::text = auth.uid()::text 
        AND (business_unit = orders.business_unit OR business_unit = 'all' OR role IN ('super_admin', 'owner'))
    )
);

CREATE POLICY "Users can view bills in their business unit" ON bills FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM users 
        WHERE id::text = auth.uid()::text 
        AND (business_unit = bills.business_unit OR business_unit = 'all' OR role IN ('super_admin', 'owner'))
    )
);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_bills_updated_at BEFORE UPDATE ON bills FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_menu_items_updated_at BEFORE UPDATE ON menu_items FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_bookings_updated_at BEFORE UPDATE ON bookings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_inventory_updated_at BEFORE UPDATE ON inventory FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_business_settings_updated_at BEFORE UPDATE ON business_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Success message
SELECT 'DEORA Plaza database schema created successfully!' as message;