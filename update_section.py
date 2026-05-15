import re

# Read the file
with open('src/components/billing/BillGenerator.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Read the replacement section
with open('order-items-section.txt', 'r', encoding='utf-8') as f:
    new_section = f.read()

# Remove the comment lines from new_section
new_section = '\n'.join([line for line in new_section.split('\n') if not line.strip().startswith('//')])

# Find and replace the order items section (lines 273-301)
# Pattern to match the entire Card component for Order Items
pattern = r'(\s*\{/\* Order Items Summary \*/\}\s*<Card>.*?</Card>)'
replacement = new_section

# Use DOTALL flag to match across newlines
content = re.sub(pattern, replacement, content, count=1, flags=re.DOTALL)

# Write back
with open('src/components/billing/BillGenerator.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("Updated successfully!")
