-- DATA DIAGNOSTIC: List all triggers on the rooms table
-- Run this in the Supabase SQL Editor to verify which triggers are actually active.

SELECT 
    trigger_name,
    event_manipulation,
    event_object_table,
    action_statement
FROM 
    information_schema.triggers
WHERE 
    event_object_table = 'rooms'
    And event_object_schema = 'public';
