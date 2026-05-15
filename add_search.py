import re

# Read the file
with open('src/components/billing/BillGenerator.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Find the item selector section and add search input
search_section = '''                                <Label className="text-sm font-medium mb-2 block">Select Items to Add</Label>
                                {loadingMenu ? ('''

replacement = '''                                <Label className="text-sm font-medium mb-2 block">Select Items to Add</Label>
                                
                                {/* Search Input */}
                                <Input
                                    type="text"
                                    placeholder="Search menu items..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="mb-2 h-8"
                                />

                                {loadingMenu ? ('''

content = content.replace(search_section, replacement)

# Add filter to menuItems.map
old_map = 'menuItems.map((menuItem: any) => ('
new_map = '''menuItems
                                            .filter(item => 
                                                item.name.toLowerCase().includes(searchQuery.toLowerCase())
                                            )
                                            .map((menuItem: any) => ('''

content = content.replace(old_map, new_map)

# Add "No items found" message before the closing div
old_closing = '''                                        ))}
                                    </div>
                                )}'''

new_closing = '''                                        ))}
                                        {menuItems.filter(item => 
                                            item.name.toLowerCase().includes(searchQuery.toLowerCase())
                                        ).length === 0 && (
                                            <div className="text-center py-4 text-sm text-gray-500">
                                                No items found
                                            </div>
                                        )}
                                    </div>
                                )}'''

content = content.replace(old_closing, new_closing)

# Write back
with open('src/components/billing/BillGenerator.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("Search feature added successfully!")
