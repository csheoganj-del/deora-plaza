-- Database Performance Optimization Script for DEORA
-- Run this in Supabase SQL Editor to add critical performance indexes

-- Performance indexes for frequently queried tables
-- These indexes will dramatically improve query performance

-- Orders table indexes (most critical)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_orders_businessunit_status 
ON orders(businessUnit, status);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_orders_createdat 
ON orders(created_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_orders_businessunit_createdat 
ON orders(businessUnit, created_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_orders_status_createdat 
ON orders(status, created_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_orders_customermobile 
ON orders(customer_mobile) WHERE customer_mobile IS NOT NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_orders_ordernumber 
ON orders(order_number);

-- Bills table indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_bills_businessunit_createdat 
ON bills(businessUnit, created_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_bills_createdat 
ON bills(created_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_bills_customermobile 
ON bills(customer_mobile) WHERE customer_mobile IS NOT NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_bills_billnumber 
ON bills(bill_number);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_bills_paymentstatus 
ON bills(payment_status);

-- Menu items table indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_menu_items_businessunit_available 
ON menu_items(businessUnit, isAvailable);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_menu_items_category 
ON menu_items(category);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_menu_items_businessunit_category 
ON menu_items(businessUnit, category);

-- Users table indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_role 
ON users(role);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_businessunit 
ON users(businessUnit);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_isactive 
ON users(isActive);

-- Customers table indexes (if exists)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_customers_mobile 
ON customers(mobile_number);

-- Tables table indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tables_businessunit 
ON tables(businessUnit);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tables_status 
ON tables(status);

-- Bookings table indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_bookings_dates 
ON bookings(start_date, end_date);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_bookings_customermobile 
ON bookings(customer_mobile);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_bookings_status 
ON bookings(status);

-- Audit logs table indexes (for performance and retention)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_logs_timestamp 
ON audit_logs(timestamp DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_logs_action_timestamp 
ON audit_logs(action, timestamp DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_logs_userid 
ON audit_logs(user_id) WHERE user_id IS NOT NULL;

-- Composite indexes for complex queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_orders_businessunit_status_createdat 
ON orders(businessUnit, status, created_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_bills_businessunit_paymentstatus_createdat 
ON bills(businessUnit, payment_status, created_at DESC);

-- Partial indexes for common query patterns
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_orders_active 
ON orders(created_at DESC) 
WHERE status IN ('pending', 'preparing', 'ready');

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_menu_items_available 
ON menu_items(name) 
WHERE isAvailable = true;

-- Add table statistics for better query planning
ANALYZE orders;
ANALYZE bills;
ANALYZE menu_items;
ANALYZE users;
ANALYZE customers;
ANALYZE tables;
ANALYZE bookings;
ANALYZE audit_logs;

-- Create a function to automatically update statistics
CREATE OR REPLACE FUNCTION update_table_stats()
RETURNS void AS $$
BEGIN
    ANALYZE orders;
    ANALYZE bills;
    ANALYZE menu_items;
    ANALYZE users;
    ANALYZE customers;
    ANALYZE tables;
    ANALYZE bookings;
    ANALYZE audit_logs;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger to update stats after major data changes
-- This helps maintain optimal query performance
CREATE OR REPLACE FUNCTION auto_update_stats_trigger()
RETURNS trigger AS $$
BEGIN
    -- Update statistics for the modified table
    EXECUTE format('ANALYZE %I', TG_TABLE_NAME);
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Add triggers to high-traffic tables (optional - use with caution)
-- COMMENT ON TRIGGER auto_update_stats_trigger ON orders IS 'Updates table statistics after major changes';
-- CREATE TRIGGER orders_stats_trigger
--     AFTER INSERT OR UPDATE OR DELETE ON orders
--     FOR EACH STATEMENT
--     EXECUTE FUNCTION auto_update_stats_trigger();

-- Performance monitoring view
CREATE OR REPLACE VIEW performance_metrics AS
SELECT 
    schemaname,
    tablename,
    attname,
    n_distinct,
    correlation
FROM pg_stats 
WHERE schemaname = 'public' 
    AND tablename IN ('orders', 'bills', 'menu_items', 'users', 'customers', 'tables', 'bookings', 'audit_logs')
ORDER BY tablename, attname;

-- Query performance analysis view
CREATE OR REPLACE VIEW slow_queries AS
SELECT 
    query,
    calls,
    total_time,
    mean_time,
    rows
FROM pg_stat_statements 
WHERE query ILIKE '%orders%' 
    OR query ILIKE '%bills%'
    OR query ILIKE '%menu_items%'
ORDER BY mean_time DESC
LIMIT 20;

-- Index usage statistics
CREATE OR REPLACE VIEW index_usage_stats AS
SELECT 
    schemaname,
    tablename,
    indexname,
    idx_scan,
    idx_tup_read,
    idx_tup_fetch
FROM pg_stat_user_indexes 
WHERE schemaname = 'public'
ORDER BY idx_scan DESC;

-- Table size monitoring
CREATE OR REPLACE VIEW table_sizes AS
SELECT 
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size,
    pg_total_relation_size(schemaname||'.'||tablename) as size_bytes
FROM pg_tables 
WHERE schemaname = 'public'
    AND tablename IN ('orders', 'bills', 'menu_items', 'users', 'customers', 'tables', 'bookings', 'audit_logs')
ORDER BY size_bytes DESC;

-- Performance optimization recommendations
CREATE OR REPLACE VIEW optimization_recommendations AS
SELECT 
    'Add missing indexes' as recommendation,
    'Consider adding indexes on frequently filtered columns' as details
UNION ALL
SELECT 
    'Vacuum and analyze tables regularly',
    'Run VACUUM ANALYZE on high-traffic tables weekly'
UNION ALL
SELECT 
    'Monitor slow queries',
    'Use pg_stat_statements to identify and optimize slow queries'
UNION ALL
SELECT 
    'Consider partitioning',
    'Large tables like orders and audit_logs could benefit from partitioning';

-- Grant necessary permissions
GRANT SELECT ON performance_metrics TO authenticated, service_role;
GRANT SELECT ON slow_queries TO authenticated, service_role;
GRANT SELECT ON index_usage_stats TO authenticated, service_role;
GRANT SELECT ON table_sizes TO authenticated, service_role;
GRANT SELECT ON optimization_recommendations TO authenticated, service_role;

-- Performance optimization complete
SELECT 'Database performance optimization completed successfully!' as status;
