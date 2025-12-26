/**
 * GST Calculation Tester with Real Scenarios
 */

export interface GSTCalculationInput {
    baseAmount: number;
    discountPercent: number;
    gstRate: number;
    businessUnit: string;
}

export interface GSTCalculationResult {
    baseAmount: number;
    discountAmount: number;
    discountedAmount: number;
    gstAmount: number;
    cgst: number;
    sgst: number;
    finalAmount: number;
    breakdown: string;
}

export function calculateGST(input: GSTCalculationInput): GSTCalculationResult {
    const { baseAmount, discountPercent, gstRate } = input;
    
    // Step 1: Calculate discount
    const discountAmount = (baseAmount * discountPercent) / 100;
    const discountedAmount = baseAmount - discountAmount;
    
    // Step 2: Calculate GST on discounted amount
    const gstAmount = (discountedAmount * gstRate) / 100;
    const cgst = gstAmount / 2;
    const sgst = gstAmount / 2;
    
    // Step 3: Calculate final amount
    const finalAmount = discountedAmount + gstAmount;
    
    // Create breakdown string
    const breakdown = `Base: ₹${baseAmount} | Discount: ₹${discountAmount.toFixed(2)} | GST: ₹${gstAmount.toFixed(2)} | Final: ₹${finalAmount.toFixed(2)}`;
    
    return {
        baseAmount,
        discountAmount: parseFloat(discountAmount.toFixed(2)),
        discountedAmount: parseFloat(discountedAmount.toFixed(2)),
        gstAmount: parseFloat(gstAmount.toFixed(2)),
        cgst: parseFloat(cgst.toFixed(2)),
        sgst: parseFloat(sgst.toFixed(2)),
        finalAmount: parseFloat(finalAmount.toFixed(2)),
        breakdown
    };
}

export function testGSTCalculations() {
    const testCases = [
        {
            name: "Restaurant Order (5% GST)",
            baseAmount: 980,
            discountPercent: 10,
            gstRate: 5,
            businessUnit: "restaurant"
        },
        {
            name: "Cafe Order (12% GST)",
            baseAmount: 390,
            discountPercent: 5,
            gstRate: 12,
            businessUnit: "cafe"
        },
        {
            name: "Bar Order (18% GST)",
            baseAmount: 1400,
            discountPercent: 0,
            gstRate: 18,
            businessUnit: "bar"
        },
        {
            name: "Hotel Booking (15% GST)",
            baseAmount: 7500,
            discountPercent: 0,
            gstRate: 15,
            businessUnit: "hotel"
        },
        {
            name: "Garden Event (10% GST)",
            baseAmount: 50000,
            discountPercent: 5,
            gstRate: 10,
            businessUnit: "garden"
        }
    ];

    console.log('🧮 GST Calculation Test Results:');
    
    testCases.forEach(testCase => {
        const result = calculateGST(testCase);
        console.log(`\n   ${testCase.name}:`);
        console.log(`   ├─ Base Amount: ₹${result.baseAmount}`);
        console.log(`   ├─ Discount (${testCase.discountPercent}%): ₹${result.discountAmount}`);
        console.log(`   ├─ Discounted Amount: ₹${result.discountedAmount}`);
        console.log(`   ├─ GST (${testCase.gstRate}%): ₹${result.gstAmount}`);
        console.log(`   ├─ CGST: ₹${result.cgst} | SGST: ₹${result.sgst}`);
        console.log(`   └─ Final Amount: ₹${result.finalAmount}`);
    });
}
