# Table Form Resize Summary

## Problem
The table creation window in the bar manager dashboard was opening at full screen width, making it less user-friendly and compact than desired.

## Solution
Adjusted the width of the table creation dialogs to make them more compact and user-friendly:

### Changes Made

1. **TableForm Component** (`src/components/tables/TableForm.tsx`)
   - Added `className="max-w-md"` to the DialogContent component
   - This makes the table creation form dialog more compact (maximum width of medium size instead of full width)

2. **TableManager Component** (`src/components/tables/TableManager.tsx`)
   - Changed the main dialog width from `max-w-lg` to `max-w-2xl`
   - This provides a better balance between screen utilization and readability
   - Removed invalid `className` prop from TableForm usage

## Width Specifications
- **Table Creation Form**: `max-w-md` (medium width - approximately 28rem or 448px)
- **Table Management Dialog**: `max-w-2xl` (2 extra-large - approximately 42rem or 672px)

## Benefits
1. **Improved User Experience**: More compact dialogs that don't overwhelm the screen
2. **Better Focus**: Users can focus on the task at hand without distraction from excessive white space
3. **Responsive Design**: Dialogs now adapt better to different screen sizes
4. **Consistency**: Both dialogs now have appropriate sizing for their content

## Files Modified
1. `src/components/tables/TableForm.tsx` - Adjusted form dialog width
2. `src/components/tables/TableManager.tsx` - Adjusted main dialog width and fixed prop usage

## Verification
After applying these changes:
- The table creation form will appear as a compact dialog in the center of the screen
- The table management dialog will have a more reasonable width that's not full screen
- Both dialogs will maintain proper spacing and readability
- The changes apply to both cafe and bar manager dashboards since they use the same components