-- Update existing user 'kalpeshdeora' with password authentication
-- This updates the existing user to enable password login
-- Password: Deora@123

UPDATE users
SET 
    "authMethod" = 'password',
    password = '$2b$10$DAQbguUJ85FEJ3BL.paeruFBf4X/J0YWIw05Q4rBVpCH8BqY1xMzK',
    role = 'super_admin',
    "businessUnit" = 'all',
    "isActive" = true,
    "updatedAt" = NOW()
WHERE username = 'kalpeshdeora';

-- After running this SQL, you can log in with:
-- Username: kalpeshdeora
-- Password: Deora@123
