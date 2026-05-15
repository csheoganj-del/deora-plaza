# PowerShell script to run the comprehensive fix
Write-Host "Starting comprehensive fix for customerCount column issue..." -ForegroundColor Green

# Instructions for the user
Write-Host "`nPlease follow these steps:" -ForegroundColor Yellow
Write-Host "1. Open your Supabase Dashboard" -ForegroundColor Cyan
Write-Host "2. Navigate to SQL Editor" -ForegroundColor Cyan
Write-Host "3. Copy the content of comprehensive-fix.sql file" -ForegroundColor Cyan
Write-Host "4. Paste it into the SQL Editor" -ForegroundColor Cyan
Write-Host "5. Click 'RUN'" -ForegroundColor Cyan
Write-Host "6. After successful execution, restart your Supabase project:" -ForegroundColor Cyan
Write-Host "   - Go to Settings -> General -> Restart Project" -ForegroundColor Cyan

# Show the path to the SQL file
Write-Host "`nThe SQL fix file is located at:" -ForegroundColor Yellow
Write-Host "c:\Users\MASTER PC\Downloads\DEORA\comprehensive-fix.sql" -ForegroundColor White

# Pause to let the user read the instructions
Write-Host "`nPress any key to continue..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")