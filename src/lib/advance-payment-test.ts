/**
 * Advance Payment Workflow Tester
 */

export interface AdvancePaymentScenario {
    bookingId: string;
    bookingType: 'hotel' | 'garden';
    baseAmount: number;
    advancePercent: number;
    additionalCharges?: number;
    gstRate: number;
}

export interface AdvancePaymentResult {
    bookingId: string;
    baseAmount: number;
    advanceAmount: number;
    additionalCharges: number;
    totalBeforeGST: number;
    gstAmount: number;
    finalTotal: number;
    advanceAdjusted: number;
    balanceDue: number;
    breakdown: string;
}

export function calculateAdvancePayment(scenario: AdvancePaymentScenario): AdvancePaymentResult {
    const { bookingId, baseAmount, advancePercent, additionalCharges = 0, gstRate } = scenario;
    
    // Calculate advance amount
    const advanceAmount = (baseAmount * advancePercent) / 100;
    
    // Calculate total before GST
    const totalBeforeGST = baseAmount + additionalCharges;
    
    // Calculate GST on total amount
    const gstAmount = (totalBeforeGST * gstRate) / 100;
    
    // Calculate final total
    const finalTotal = totalBeforeGST + gstAmount;
    
    // Calculate balance due after advance adjustment
    const balanceDue = finalTotal - advanceAmount;
    
    const breakdown = `Base: ₹${baseAmount} + Extras: ₹${additionalCharges} + GST: ₹${gstAmount.toFixed(2)} = ₹${finalTotal.toFixed(2)} - Advance: ₹${advanceAmount} = Balance: ₹${balanceDue.toFixed(2)}`;
    
    return {
        bookingId,
        baseAmount,
        advanceAmount,
        additionalCharges,
        totalBeforeGST,
        gstAmount: parseFloat(gstAmount.toFixed(2)),
        finalTotal: parseFloat(finalTotal.toFixed(2)),
        advanceAdjusted: advanceAmount,
        balanceDue: parseFloat(balanceDue.toFixed(2)),
        breakdown
    };
}

export function testAdvancePayments() {
    const testScenarios = [
        {
            bookingId: "HOTEL001",
            bookingType: "hotel" as const,
            baseAmount: 7500, // 3 nights × 2500
            advancePercent: 40,
            additionalCharges: 800, // Room service
            gstRate: 15
        },
        {
            bookingId: "GARDEN001", 
            bookingType: "garden" as const,
            baseAmount: 50000, // Wedding package
            advancePercent: 50,
            additionalCharges: 5000, // Extra decorations
            gstRate: 10
        },
        {
            bookingId: "HOTEL002",
            bookingType: "hotel" as const,
            baseAmount: 5000, // 2 nights × 2500
            advancePercent: 30,
            additionalCharges: 0,
            gstRate: 15
        }
    ];

    console.log('💰 Advance Payment Test Results:');
    
    testScenarios.forEach(scenario => {
        const result = calculateAdvancePayment(scenario);
        console.log(`\n   ${scenario.bookingType.toUpperCase()} Booking (${scenario.bookingId}):`);
        console.log(`   ├─ Base Amount: ₹${result.baseAmount}`);
        console.log(`   ├─ Advance (${scenario.advancePercent}%): ₹${result.advanceAmount}`);
        console.log(`   ├─ Additional Charges: ₹${result.additionalCharges}`);
        console.log(`   ├─ GST (${scenario.gstRate}%): ₹${result.gstAmount}`);
        console.log(`   ├─ Final Total: ₹${result.finalTotal}`);
        console.log(`   └─ Balance Due: ₹${result.balanceDue}`);
    });
}
