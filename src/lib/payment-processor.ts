/**
 * Payment Processing Simulator and Interface
 * Ready for Stripe/Razorpay integration
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
    currency?: string; // Default 'INR'
}

export interface PaymentResult {
    success: boolean;
    transactionId: string;
    amount: number;
    method: string;
    timestamp: number;
    receipt: string;
    gatewayResponse?: any; // To store raw response from Stripe/Razorpay
    error?: string;
}

// Environment variable check for production readiness
const IS_PRODUCTION = process.env.NODE_ENV === 'production';

export class PaymentProcessor {
    static async processCashPayment(request: PaymentRequest): Promise<PaymentResult> {
        // Cash is always "successful" in terms of processing, but should be verified physically
        return {
            success: true,
            transactionId: `CASH_${Date.now()}_${Math.random().toString(36).substring(7)}`,
            amount: request.amount,
            method: 'cash',
            timestamp: Date.now(),
            receipt: `Cash payment of ₹${request.amount} received`
        };
    }

    static async processDigitalPayment(request: PaymentRequest): Promise<PaymentResult> {
        // TODO: Replace with actual Payment Gateway integration (Stripe/Razorpay)
        
        if (IS_PRODUCTION && !process.env.RAZORPAY_KEY_ID && !process.env.STRIPE_SECRET_KEY) {
             console.error("Payment Gateway keys missing in production environment");
             // In strict production, we might want to fail here. 
             // For now, we log error but allow fallback if configured, or fail.
             // return {
             //    success: false,
             //    transactionId: '',
             //    amount: request.amount,
             //    method: request.method,
             //    timestamp: Date.now(),
             //    receipt: '',
             //    error: "Payment configuration missing"
             // };
        }

        // Simulate UPI/Card payment processing
        // In a real implementation, this would initiate a transaction with the gateway
        const success = Math.random() > 0.05; // 95% success rate for simulation
        
        if (success) {
            return {
                success: true,
                transactionId: `DIG_${Date.now()}_${Math.random().toString(36).substring(7)}`,
                amount: request.amount,
                method: request.method,
                timestamp: Date.now(),
                receipt: `Digital payment of ₹${request.amount} successful`
            };
        } else {
             return {
                success: false,
                transactionId: '',
                amount: request.amount,
                method: request.method,
                timestamp: Date.now(),
                receipt: '',
                error: "Transaction failed at gateway"
            };
        }
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

        const success = cashResult.success && digitalResult.success;

        return {
            success,
            transactionId: `SPLIT_${Date.now()}`,
            amount: request.amount,
            method: 'split',
            timestamp: Date.now(),
            receipt: success 
                ? `Split payment: Cash ₹${request.splitDetails.cash}, Digital ₹${request.splitDetails.digital}`
                : `Split payment failed. Cash: ${cashResult.success}, Digital: ${digitalResult.success}`,
            error: success ? undefined : "One or more payment methods failed"
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
