# Security Configuration Guide

## Critical: Environment Variables Setup

After deploying the security fixes, you **MUST** configure the following environment variable:

### DELETION_PASSWORD

This password is required for all critical deletion operations including:
- Bill deletion
- Booking deletion  
- Data reset operations

**Setup Instructions:**

1. Create a `.env.local` file in the project root (if it doesn't exist)
2. Add the following line:
   ```
   DELETION_PASSWORD=your_secure_password_here
   ```
3. **IMPORTANT:** The hardcoded password `KappuLokuHimu#1006` has been exposed in version control and **MUST NOT** be used in production
4. Generate a strong password with at least:
   - 12 characters
   - Uppercase and lowercase letters
   - Numbers
   - Special characters

**Example:**
```bash
DELETION_PASSWORD=MySecure#Pass2025!
```

## Password Rotation

The exposed password should be rotated immediately:
1. Update `DELETION_PASSWORD` in `.env.local`
2. Restart the application
3. Inform all authorized administrators of the new password
4. Never commit the `.env.local` file to version control

## Additional Security Notes

- Only super_admin role users can perform deletions
- All deletion attempts are logged in the audit trail
- Failed password attempts are logged for security monitoring

## Questions?

Contact the system administrator for the current deletion password.
