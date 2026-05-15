# GST Toggle Access Fix Documentation

## Issue Description
The GST toggle switch in the Business Settings form was disabled (greyed out) for bar managers, preventing them from enabling or disabling GST functionality. This was inconsistent with the intended role-based access control design where bar managers should have access to certain business settings.

## Root Cause
In the `BusinessSettingsForm.tsx` component, the GST toggle switch and GST percentage input field were restricted to admin users only:

```tsx
// Before fix
<Switch
    id="gstEnabled"
    checked={!!settings.gstEnabled}
    onCheckedChange={(checked) => setSettings(prev => ({ ...prev, gstEnabled: checked }))}
    disabled={!isAdmin}  // Only admins could modify
/>

<Input
    id="gstPercentage"
    type="number"
    value={settings.gstPercentage}
    onChange={(e) => {
        const value = parseFloat(e.target.value) || 0;
        setSettings(prev => ({ ...prev, gstPercentage: value }));
    }}
    className="w-24"
    disabled={!isAdmin}  // Only admins could modify
    min="0"
    max="100"
    step="0.5"
/>
```

## Solution
Updated the component to allow both admin users and bar managers to modify GST settings, following the same pattern used for the "Enable Bar Module" setting:

```tsx
// After fix
<Switch
    id="gstEnabled"
    checked={!!settings.gstEnabled}
    onCheckedChange={(checked) => setSettings(prev => ({ ...prev, gstEnabled: checked }))}
    disabled={!isAdmin && !isBarManager}  // Admins AND bar managers can modify
/>

<Input
    id="gstPercentage"
    type="number"
    value={settings.gstPercentage}
    onChange={(e) => {
        const value = parseFloat(e.target.value) || 0;
        setSettings(prev => ({ ...prev, gstPercentage: value }));
    }}
    className="w-24"
    disabled={!isAdmin && !isBarManager}  // Admins AND bar managers can modify
    min="0"
    max="100"
    step="0.5"
/>
```

## Rationale
1. **Consistency**: The "Enable Bar Module" setting already allowed both admins and bar managers to modify it, so applying the same logic to GST settings maintains consistency.

2. **Role Appropriateness**: Bar managers need control over operational settings like GST for their specific business unit.

3. **Business Requirements**: Based on the role-based access control principles, bar managers should be able to manage settings relevant to their unit's operations.

## Testing
A test script `src/test-gst-toggle-access.ts` was created to verify that the fix works correctly:
- Super admins and owners can access GST settings (unchanged)
- Bar managers can now access GST settings (fixed)
- Other roles (cafe managers, waiters, etc.) cannot access GST settings (unchanged)

## Impact
- Bar managers can now enable/disable GST functionality in their dashboard
- GST percentage can be modified by bar managers
- No impact on other user roles
- Maintains security by still restricting access from lower-level roles