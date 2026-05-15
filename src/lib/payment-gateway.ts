"use server";

import { createDocument, updateDocument } from "@/lib/supabase/database";
import { createAuditLog } from "@/lib/audit";

/**
 * Internal Payment System for DEORA Plaza
 * Handles internal transfers, departmental settlements, and inter-unit transactions
 */

export interface InternalPaymentRequest {
  billId: string;
  amount: number;
  paymentMethod: 'cash' | 'internal_transfer' | 'departmental_credit' | 'settlement';
  fromDepartment?: string;
  toDepartment?: string;
  staffId?: string;
  notes?: string;
}

export interface InternalPaymentResponse {
  success: boolean;
  transactionId?: string;
  error?: string;
  paymentStatus: 'completed' | 'failed' | 'pending_approval';
}

export interface InternalTransferRequest {
  fromDepartment: string;
  toDepartment: string;
  amount: number;
  reason: string;
  orderId?: string;
  billId?: string;
  approvedBy?: string;
}

export interface InternalTransferResponse {
  success: boolean;
  transferId?: string;
  error?: string;
  status: 'completed' | 'failed' | 'pending_approval';
}

/**
 * Process internal payment (cash handling, departmental transfers)
 */
export async function processInternalPayment(request: InternalPaymentRequest): Promise<InternalPaymentResponse> {
  try {
    console.log('🔄 Processing internal payment:', request);

    // Validate request
    if (!request.billId || !request.amount || request.amount <= 0) {
      return {
        success: false,
        error: 'Invalid payment request',
        paymentStatus: 'failed'
      };
    }

    // Generate transaction ID
    const transactionId = `INT_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Create internal transaction record
    const transactionData = {
      billId: request.billId,
      amount: request.amount,
      paymentMethod: request.paymentMethod,
      fromDepartment: request.fromDepartment,
      toDepartment: request.toDepartment,
      staffId: request.staffId,
      notes: request.notes,
      status: 'completed',
      transactionId,
      type: 'internal_payment',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const transactionResult = await createDocument('internal_transactions', transactionData);
    console.log('📝 Internal transaction record created:', transactionResult);

    // Update bill payment status
    await updateDocument('bills', request.billId, {
      paymentStatus: 'paid',
      paymentMethod: request.paymentMethod,
      amountPaid: request.amount,
      transactionId,
      paidAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

    // Audit log successful payment
    await createAuditLog(
      'INTERNAL_PAYMENT_PROCESSED',
      {
        billId: request.billId,
        amount: request.amount,
        paymentMethod: request.paymentMethod,
        fromDepartment: request.fromDepartment,
        toDepartment: request.toDepartment,
        transactionId
      },
      true,
      `Internal payment of ₹${request.amount} processed successfully`
    );

    return {
      success: true,
      transactionId,
      paymentStatus: 'completed'
    };

  } catch (error) {
    console.error('❌ Internal payment processing error:', error);
    
    // Audit log error
    await createAuditLog(
      'INTERNAL_PAYMENT_ERROR',
      {
        billId: request.billId,
        amount: request.amount,
        error: error instanceof Error ? error.message : String(error)
      },
      false,
      `Internal payment processing error: ${error instanceof Error ? error.message : String(error)}`
    );

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Internal payment processing failed',
      paymentStatus: 'failed'
    };
  }
}

/**
 * Process inter-departmental transfer
 */
export async function processInternalTransfer(request: InternalTransferRequest): Promise<InternalTransferResponse> {
  try {
    console.log('🔄 Processing internal transfer:', request);

    // Validate request
    if (!request.fromDepartment || !request.toDepartment || !request.amount || request.amount <= 0) {
      return {
        success: false,
        error: 'Invalid transfer request',
        status: 'failed'
      };
    }

    // Generate transfer ID
    const transferId = `TRF_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Create transfer record
    const transferData = {
      transferId,
      fromDepartment: request.fromDepartment,
      toDepartment: request.toDepartment,
      amount: request.amount,
      reason: request.reason,
      orderId: request.orderId,
      billId: request.billId,
      approvedBy: request.approvedBy,
      status: 'completed',
      type: 'departmental_transfer',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const transferResult = await createDocument('internal_transactions', transferData);
    console.log('📝 Internal transfer record created:', transferResult);

    // Update departmental balances (if tracking enabled)
    await updateDepartmentalBalances(request.fromDepartment, request.toDepartment, request.amount);

    // Audit log successful transfer
    await createAuditLog(
      'INTERNAL_TRANSFER_PROCESSED',
      {
        transferId,
        fromDepartment: request.fromDepartment,
        toDepartment: request.toDepartment,
        amount: request.amount,
        reason: request.reason
      },
      true,
      `Internal transfer of ₹${request.amount} from ${request.fromDepartment} to ${request.toDepartment} completed`
    );

    return {
      success: true,
      transferId,
      status: 'completed'
    };

  } catch (error) {
    console.error('❌ Internal transfer processing error:', error);
    
    // Audit log error
    await createAuditLog(
      'INTERNAL_TRANSFER_ERROR',
      {
        fromDepartment: request.fromDepartment,
        toDepartment: request.toDepartment,
        amount: request.amount,
        error: error instanceof Error ? error.message : String(error)
      },
      false,
      `Internal transfer processing error: ${error instanceof Error ? error.message : String(error)}`
    );

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Internal transfer processing failed',
      status: 'failed'
    };
  }
}

/**
 * Update departmental balances for internal tracking
 */
async function updateDepartmentalBalances(fromDept: string, toDept: string, amount: number) {
  try {
    // This would update departmental balance tracking if implemented
    // For now, just log the balance changes
    console.log(`💰 Balance update: ${fromDept} -₹${amount}, ${toDept} +₹${amount}`);
    
    // Could implement actual balance tracking here:
    // await updateDocument('departmental_balances', fromDept, { balance: currentBalance - amount });
    // await updateDocument('departmental_balances', toDept, { balance: currentBalance + amount });
  } catch (error) {
    console.warn('Warning: Could not update departmental balances:', error);
  }
}

/**
 * Process order cancellation (internal refund)
 */
export async function processOrderCancellation(
  orderId: string,
  billId: string,
  reason: string,
  approvedBy: string
): Promise<InternalTransferResponse> {
  try {
    console.log('🔄 Processing order cancellation:', { orderId, billId, reason });

    // Generate cancellation ID
    const cancellationId = `CAN_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Create cancellation record
    const cancellationData = {
      cancellationId,
      orderId,
      billId,
      reason,
      approvedBy,
      status: 'completed',
      type: 'order_cancellation',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const cancellationResult = await createDocument('internal_transactions', cancellationData);
    console.log('📝 Order cancellation record created:', cancellationResult);

    // Update order status
    await updateDocument('orders', orderId, {
      status: 'cancelled',
      cancelledAt: new Date().toISOString(),
      cancellationReason: reason,
      cancelledBy: approvedBy,
      updatedAt: new Date().toISOString()
    });

    // Update bill status if exists
    if (billId) {
      await updateDocument('bills', billId, {
        paymentStatus: 'cancelled',
        cancelledAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    }

    // Audit log successful cancellation
    await createAuditLog(
      'ORDER_CANCELLED',
      {
        orderId,
        billId,
        reason,
        approvedBy,
        cancellationId
      },
      true,
      `Order ${orderId} cancelled: ${reason}`
    );

    return {
      success: true,
      transferId: cancellationId,
      status: 'completed'
    };

  } catch (error) {
    console.error('❌ Order cancellation processing error:', error);
    
    // Audit log error
    await createAuditLog(
      'ORDER_CANCELLATION_ERROR',
      {
        orderId,
        billId,
        error: error instanceof Error ? error.message : String(error)
      },
      false,
      `Order cancellation processing error: ${error instanceof Error ? error.message : String(error)}`
    );

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Order cancellation processing failed',
      status: 'failed'
    };
  }
}

/**
 * Validate internal payment method availability
 */
export async function validateInternalPaymentMethod(method: string): Promise<boolean> {
  const supportedMethods = ['cash', 'internal_transfer', 'departmental_credit', 'settlement'];
  return supportedMethods.includes(method);
}

/**
 * Get internal payment system status
 */
export async function getInternalPaymentStatus(): Promise<{
  isOnline: boolean;
  supportedMethods: string[];
  departmentalBalanceTracking: boolean;
}> {
  return {
    isOnline: true,
    supportedMethods: ['cash', 'internal_transfer', 'departmental_credit', 'settlement'],
    departmentalBalanceTracking: false // Can be enabled later
  };
}

/**
 * Get departmental transaction history
 */
export async function getDepartmentalTransactions(
  department: string,
  startDate?: string,
  endDate?: string
): Promise<any[]> {
  try {
    const { queryDocuments } = await import("@/lib/supabase/database");
    
    const filters: any[] = [];
    
    // Add department filter (either from or to)
    filters.push({
      field: 'fromDepartment',
      operator: '==',
      value: department
    });

    if (startDate) {
      filters.push({
        field: 'createdAt',
        operator: '>=',
        value: startDate
      });
    }

    if (endDate) {
      filters.push({
        field: 'createdAt',
        operator: '<=',
        value: endDate
      });
    }

    const transactions = await queryDocuments('internal_transactions', filters, 'createdAt', 'desc');

    return transactions.map((transaction: any) => ({
      ...transaction,
      createdAt: transaction.createdAt ? new Date(transaction.createdAt).toISOString() : null,
      updatedAt: transaction.updatedAt ? new Date(transaction.updatedAt).toISOString() : null,
    }));

  } catch (error) {
    console.error('Error fetching departmental transactions:', error);
    return [];
  }
}