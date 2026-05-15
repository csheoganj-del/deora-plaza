/**
 * QR Code Generation for Waiterless Mode
 */

export interface QRCodeData {
    tableId: string;
    businessUnit: string;
    restaurantId: string;
    timestamp: number;
}

export function generateQRCodeData(tableId: string, businessUnit: string): QRCodeData {
    return {
        tableId,
        businessUnit,
        restaurantId: 'DEORA_PLAZA',
        timestamp: Date.now()
    };
}

export function generateQRCodeURL(qrData: QRCodeData): string {
    const baseUrl = process.env.QR_CODE_BASE_URL || 'http://localhost:3000/qr-order';
    const encodedData = btoa(JSON.stringify(qrData));
    return `${baseUrl}?data=${encodedData}`;
}

export function validateQRCodeData(encodedData: string): QRCodeData | null {
    try {
        const decoded = atob(encodedData);
        const qrData = JSON.parse(decoded) as QRCodeData;
        
        // Validate required fields
        if (!qrData.tableId || !qrData.businessUnit || !qrData.restaurantId) {
            return null;
        }
        
        // Check if QR code is not too old (24 hours)
        const maxAge = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
        if (Date.now() - qrData.timestamp > maxAge) {
            return null;
        }
        
        return qrData;
    } catch (error) {
        return null;
    }
}

// Test QR code generation
export function testQRCodeGeneration() {
    const testCases = [
        { tableId: 'T001', businessUnit: 'restaurant' },
        { tableId: 'T002', businessUnit: 'cafe' },
        { tableId: 'B001', businessUnit: 'bar' },
        { tableId: 'G001', businessUnit: 'garden' }
    ];

    console.log('🧪 Testing QR Code Generation:');
    
    testCases.forEach(testCase => {
        const qrData = generateQRCodeData(testCase.tableId, testCase.businessUnit);
        const qrUrl = generateQRCodeURL(qrData);
        const encodedData = qrUrl.split('data=')[1];
        const validatedData = validateQRCodeData(encodedData);
        
        console.log(`   ${testCase.businessUnit.toUpperCase()} Table ${testCase.tableId}:`);
        console.log(`   ├─ QR URL: ${qrUrl}`);
        console.log(`   └─ Validation: ${validatedData ? '✅ Valid' : '❌ Invalid'}`);
    });
}
