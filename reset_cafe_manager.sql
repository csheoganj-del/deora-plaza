-- Reset or Create cafe_manager user
-- Username: cafe_manager
-- Password: Deora@123

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
    'cafe_manager',
    'password',
    '$2b$10$DAQbguUJ85FEJ3BL.paeruFBf4X/J0YWIw05Q4rBVpCH8BqY1xMzK', -- Hash for 'Deora@123'
    'manager',
    'cafe',
    'Cafe Manager',
    true,
    NOW(),
    NOW()
)
ON CONFLICT (username) DO UPDATE SET
    password = '$2b$10$DAQbguUJ85FEJ3BL.paeruFBf4X/J0YWIw05Q4rBVpCH8BqY1xMzK',
    "authMethod" = 'password',
    "isActive" = true,
    "updatedAt" = NOW();
