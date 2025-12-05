import re

# Read the file
with open('src/actions/billing.ts', 'r', encoding='utf-8') as f:
    content = f.read()

# New function implementation that finds the first missing number
new_function = '''// Get the next sequential bill number (reuses deleted numbers to fill gaps)
async function getNextBillNumber(): Promise<string> {
    const today = new Date();
    const dateString = `${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}${String(today.getDate()).padStart(2, '0')}`;
    
    // Get all bills to find existing numbers
    const billsSnapshot = await adminDb.collection('bills').get();
    
    if (billsSnapshot.empty) {
        // No bills exist, start from 1
        return `BILL-${dateString}-001`;
    }
    
    // Extract all existing bill numbers
    const existingNumbers: number[] = [];
    billsSnapshot.forEach(doc => {
        const billNumber = doc.data()?.billNumber;
        if (billNumber && typeof billNumber === 'string') {
            // Extract the number part from "BILL-20251205-003"
            const parts = billNumber.split('-');
            if (parts.length === 3) {
                const num = parseInt(parts[2], 10);
                if (!isNaN(num)) {
                    existingNumbers.push(num);
                }
            }
        }
    });
    
    // Sort the numbers
    existingNumbers.sort((a, b) => a - b);
    
    // Find the first missing number in the sequence
    let nextNumber = 1;
    for (const num of existingNumbers) {
        if (num === nextNumber) {
            nextNumber++;
        } else if (num > nextNumber) {
            // Found a gap, use this number
            break;
        }
    }
    
    return `BILL-${dateString}-${String(nextNumber).padStart(3, '0')}`;
}'''

# Find and replace the entire function
pattern = r'// Get the next sequential bill number.*?^}'
content = re.sub(pattern, new_function, content, flags=re.MULTILINE | re.DOTALL)

# Write back
with open('src/actions/billing.ts', 'w', encoding='utf-8') as f:
    f.write(content)

print("Bill numbering updated to reuse deleted numbers!")
