-- Create Super Admin User for Deora Plaza Management System
-- Username: kalpeshdeora
-- Password: Deora@123
-- Run this in your Supabase SQL Editor

INSERT INTO users (
    id,
    username,
    "authMethod",
    password,
    role,
    "businessUnit",
    name,
    "isActive",
    "createdAt",
    "updatedAt"
) VALUES (
    gen_random_uuid(),
    'kalpeshdeora',
    'password',
    '$2b$10$DAQbguUJ85FEJ3BL.paeruFBf4X/J0YWIw05Q4rBVpCH8BqY1xMzK',
    'super_admin',
    'all',
    'Kalpesh Deora',
    true,
    NOW(),
    NOW()
);

-- After running this SQL, you can log in with:
-- Username: kalpeshdeora
-- Password: Deora@123
