/**
 * Payment Processing Simulator
 */

export interface PaymentRequest {
    orderId: string;
    amount: number;
    method: 'cash' | 'upi' | 'card' | 'split';
    splitDetails?: {
        cash?: number;
        digital?: number;
    };
    advanceAdjustment?: number;
}

export interface PaymentResult {
    success: boolean;
    transactionId: string;
    amount: number;
    method: string;
    timestamp: number;
    receipt: string;
}

export class PaymentProcessor {
    static async processCashPayment(request: PaymentRequest): Promise<PaymentResult> {
        // Simulate cash payment processing
        return {
            success: true,
            transactionId: `CASH_${Date.now()}`,
            amount: request.amount,
            method: 'cash',
            timestamp: Date.now(),
            receipt: `Cash payment of ₹${request.amount} received`
        };
    }

    static async processDigitalPayment(request: PaymentRequest): Promise<PaymentResult> {
        // Simulate UPI/Card payment processing
        const success = Math.random() > 0.1; // 90% success rate
        
        return {
            success,
            transactionId: success ? `DIG_${Date.now()}` : '',
            amount: request.amount,
            method: request.method,
            timestamp: Date.now(),
            receipt: success 
                ? `Digital payment of ₹${request.amount} successful`
                : 'Payment failed - please try again'
        };
    }

    static async processSplitPayment(request: PaymentRequest): Promise<PaymentResult> {
        if (!request.splitDetails) {
            throw new Error('Split details required for split payment');
        }

        const cashResult = await this.processCashPayment({
            ...request,
            amount: request.splitDetails.cash || 0
        });

        const digitalResult = await this.processDigitalPayment({
            ...request,
            amount: request.splitDetails.digital || 0
        });

        return {
            success: cashResult.success && digitalResult.success,
            transactionId: `SPLIT_${Date.now()}`,
            amount: request.amount,
            method: 'split',
            timestamp: Date.now(),
            receipt: `Split payment: Cash ₹${request.splitDetails.cash}, Digital ₹${request.splitDetails.digital}`
        };
    }

    static async processAdvanceAdjustment(request: PaymentRequest): Promise<PaymentResult> {
        const remainingAmount = request.amount - (request.advanceAdjustment || 0);
        
        if (remainingAmount <= 0) {
            return {
                success: true,
                transactionId: `ADV_${Date.now()}`,
                amount: request.amount,
                method: 'advance_adjustment',
                timestamp: Date.now(),
                receipt: `Full payment covered by advance. Advance: ₹${request.advanceAdjustment}`
            };
        }

        // Process remaining amount
        return await this.processCashPayment({
            ...request,
            amount: remainingAmount
        });
    }
}
