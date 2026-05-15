$file = "src\components\billing\BillGenerator.tsx"
$content = Get-Content $file -Raw

# Replace the button onClick
$content = $content -replace 'onClick=\{\(\) => \{[^}]+if \(onAddItems\)[^}]+onAddItems\(\)[^}]+\} else \{[^}]+alert\([^)]+\)[^}]+\}[^}]+\}\}', 'onClick={() => { setShowItemSelector(!showItemSelector); if (!showItemSelector && menuItems.length === 0) { fetchMenuItems() } }}'

# Replace button text
$content = $content -replace '\+ Add Items', '{showItemSelector ? <X className="h-4 w-4 mr-1" /> : <Plus className="h-4 w-4 mr-1" />} {showItemSelector ? ''Close'' : ''Add Items''}'

Set-Content $file -Value $content -NoNewline
