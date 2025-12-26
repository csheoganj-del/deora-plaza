# Final Setup Instructions

## Database Setup

### 1. Run Database Initialization Scripts

Navigate to your project root and run:

```bash
npm run setup:database
```

This will:
- Create all required database tables
- Seed initial data (users, menu items, tables, counters)
- Set up business settings with default values

### 2. Configure Business Settings

After database setup, configure your business information:

1. Start the development server: `npm run dev`
2. Log in with super admin credentials:
   - Username: `kalpeshdeora`
   - Password: `Kalpesh!1006`
3. Access the business settings through your profile menu
4. Update your business information:
   - Business Name
   - Address
   - Mobile Number
   - Enable/disable waiterless mode
   - Enable/disable GST and set default GST percentage
   - Enable/disable bar module functionality

## Verification

After completing the setup, you should be able to:
1. Access the business settings page through your profile menu
2. See and edit all business information fields
3. Enable/disable waiterless mode
4. Enable/disable GST and set default GST percentage
5. Enable/disable bar module functionality
6. See business information on printed invoices
7. See GST percentage on invoices when enabled

## Troubleshooting

If you encounter any issues:

1. **Database Connection Errors**:
   - Verify your `.env` file contains correct Supabase credentials
   - Ensure Supabase project is active and accessible

2. **Authentication Issues**:
   - Confirm NEXTAUTH_SECRET is set in your `.env` file
   - Check that you're using the correct login credentials

3. **Missing Data**:
   - Re-run the setup scripts: `npm run setup:database`
   - Check Supabase table editor to verify data was inserted

4. **Permission Errors**:
   - Ensure you're logged in with appropriate user role
   - Super admin (`kalpeshdeora`) has access to all features