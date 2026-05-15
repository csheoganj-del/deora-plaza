"use server";

import { isFeatureEnabled, isWaiterlessModeEnabled, getGSTSettings } from "@/actions/businessSettings";
import { createAuditLog } from "@/lib/audit";

/**
 * Internal Order Flow Validator for DEORA Plaza
 * Validates internal order operations between departments and business units
 */

export interface OrderValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  allowedActions: string[];
}

export interface InternalOrderFlowContext {
  orderId: string;
  fromDepartment: string;
  toDepartment: string;
  currentStatus: string;
  orderType: 'supply_request' | 'service_request' | 'room_service' | 'catering' | 'bar_supply';
  userRole: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
}

/**
 * Validate internal order creation between departments
 */
export async function validateInternalOrderCreation(data: {
  fromDepartment: string;
  toDepartment: string;
  orderType: string;
  items: any[];
  priority: string;
}): Promise<OrderValidationResult> {
  const errors: string[] = [];
  const warnings: string[] = [];
  const allowedActions: string[] = [];

  try {
    // Check if departments are different
    if (data.fromDepartment === data.toDepartment) {
      errors.push("Cannot create order to the same department");
    }

    // Check if both departments have their modules enabled
    const fromModuleEnabled = await isFeatureEnabled(`enable${data.fromDepartment.charAt(0).toUpperCase() + data.fromDepartment.slice(1)}Module` as any);
    const toModuleEnabled = await isFeatureEnabled(`enable${data.toDepartment.charAt(0).toUpperCase() + data.toDepartment.slice(1)}Module` as any);
    
    if (!fromModuleEnabled) {
      errors.push(`${data.fromDepartment} module is disabled`);
    }
    
    if (!toModuleEnabled) {
      errors.push(`${data.toDepartment} module is disabled`);
    }

    // Validate items
    if (!data.items || data.items.length === 0) {
      errors.push("At least one item is required");
    }

    // Validate order type and department compatibility
    const compatibility = validateDepartmentCompatibility(data.fromDepartment, data.toDepartment, data.orderType);
    if (!compatibility.isValid) {
      errors.push(compatibility.error || "Invalid department combination for order type");
    }

    // Check priority-based actions
    if (data.priority === 'urgent') {
      allowedActions.push('expedite');
      warnings.push("Urgent orders will be prioritized and may interrupt current workflow");
    }

    // Check if order modification is enabled
    const canModify = await isFeatureEnabled('enableOrderModification');
    if (canModify) {
      allowedActions.push('modify');
    }

    // Check if order cancellation is enabled
    const canCancel = await isFeatureEnabled('enableOrderCancellation');
    if (canCancel) {
      allowedActions.push('cancel');
    }

    // Check waiterless mode for auto-processing
    const isWaiterless = await isWaiterlessModeEnabled(data.toDepartment);
    if (isWaiterless) {
      allowedActions.push('auto_acknowledge');
      warnings.push(`${data.toDepartment} is in waiterless mode - orders will be auto-acknowledged`);
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      allowedActions
    };

  } catch (error) {
    console.error('Error validating internal order creation:', error);
    return {
      isValid: false,
      errors: ['Validation failed due to system error'],
      warnings: [],
      allowedActions: []
    };
  }
}

/**
 * Validate internal order status transition
 */
export async function validateInternalOrderStatusTransition(
  context: InternalOrderFlowContext,
  newStatus: string
): Promise<OrderValidationResult> {
  const errors: string[] = [];
  const warnings: string[] = [];
  const allowedActions: string[] = [];

  try {
    // Define valid status transitions for internal orders
    const validTransitions: Record<string, string[]> = {
      'pending': ['acknowledged', 'cancelled'],
      'acknowledged': ['preparing', 'cancelled'],
      'preparing': ['ready', 'cancelled'],
      'ready': ['dispatched', 'cancelled'],
      'dispatched': ['delivered', 'cancelled'],
      'delivered': ['completed'],
      'completed': [], // Terminal state
      'cancelled': [] // Terminal state
    };

    // Check if transition is valid
    const allowedNextStates = validTransitions[context.currentStatus] || [];
    if (!allowedNextStates.includes(newStatus)) {
      errors.push(`Cannot transition from ${context.currentStatus} to ${newStatus}`);
    }

    // Check cancellation permissions
    if (newStatus === 'cancelled') {
      const canCancel = await isFeatureEnabled('enableOrderCancellation');
      if (!canCancel) {
        errors.push('Order cancellation is disabled');
      } else if (context.userRole !== 'super_admin' && ['completed', 'delivered'].includes(context.currentStatus)) {
        errors.push('Only super admin can cancel completed/delivered orders');
      }
    }

    // Check department-specific rules
    if (newStatus === 'preparing') {
      // Kitchen/Bar departments might have capacity limits
      if (['kitchen', 'bar'].includes(context.toDepartment)) {
        allowedActions.push('check_capacity');
      }
    }

    // Check if this is a high priority order
    if (context.priority === 'urgent' && newStatus === 'acknowledged') {
      allowedActions.push('expedite_preparation');
      warnings.push('Urgent order - consider expediting preparation');
    }

    // Check waiterless mode for auto-transitions
    const isWaiterless = await isWaiterlessModeEnabled(context.toDepartment);
    if (isWaiterless && newStatus === 'ready') {
      allowedActions.push('auto_dispatch');
      warnings.push('Waiterless mode - order will be auto-dispatched when ready');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      allowedActions
    };

  } catch (error) {
    console.error('Error validating internal order status transition:', error);
    return {
      isValid: false,
      errors: ['Status transition validation failed'],
      warnings: [],
      allowedActions: []
    };
  }
}

/**
 * Validate department compatibility for order types
 */
function validateDepartmentCompatibility(
  fromDept: string,
  toDept: string,
  orderType: string
): { isValid: boolean; error?: string } {
  
  const validCombinations: Record<string, string[]> = {
    'supply_request': ['kitchen', 'bar', 'restaurant', 'cafe'], // Any dept can request supplies
    'service_request': ['kitchen', 'bar', 'restaurant', 'cafe', 'hotel'], // Service between operational depts
    'room_service': ['kitchen', 'bar'], // Only kitchen/bar can fulfill room service
    'catering': ['kitchen'], // Only kitchen handles catering
    'bar_supply': ['bar'] // Only bar handles bar supplies
  };

  const allowedTargets = validCombinations[orderType];
  if (!allowedTargets) {
    return { isValid: false, error: `Unknown order type: ${orderType}` };
  }

  if (!allowedTargets.includes(toDept)) {
    return { 
      isValid: false, 
      error: `${orderType} orders cannot be sent to ${toDept}` 
    };
  }

  // Special validations
  if (orderType === 'room_service' && fromDept !== 'hotel') {
    return { 
      isValid: false, 
      error: 'Room service orders can only be created by hotel department' 
    };
  }

  if (orderType === 'catering' && !['hotel', 'garden'].includes(fromDept)) {
    return { 
      isValid: false, 
      error: 'Catering orders can only be created by hotel or garden departments' 
    };
  }

  return { isValid: true };
}

/**
 * Validate internal settlement between departments
 */
export async function validateInternalSettlement(data: {
  fromDepartment: string;
  toDepartment: string;
  amount: number;
  settlementType: 'daily' | 'weekly' | 'monthly' | 'ad_hoc';
  userRole: string;
}): Promise<OrderValidationResult> {
  const errors: string[] = [];
  const warnings: string[] = [];
  const allowedActions: string[] = [];

  try {
    // Check user permissions for settlements
    if (!['super_admin', 'manager'].includes(data.userRole)) {
      errors.push('Insufficient permissions for settlement operations');
    }

    // Validate settlement amount
    if (data.amount <= 0) {
      errors.push('Settlement amount must be greater than zero');
    }

    // Check if departments are different
    if (data.fromDepartment === data.toDepartment) {
      errors.push('Cannot settle between the same department');
    }

    // Check password protection for settlements
    const passwordProtectionEnabled = await isFeatureEnabled('enablePasswordProtection');
    if (passwordProtectionEnabled) {
      allowedActions.push('require_password');
    }

    // Add settlement-specific actions
    allowedActions.push('generate_receipt', 'update_balances', 'audit_trail');

    if (data.settlementType === 'ad_hoc') {
      warnings.push('Ad-hoc settlements require additional approval');
      allowedActions.push('require_approval');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      allowedActions
    };

  } catch (error) {
    console.error('Error validating internal settlement:', error);
    return {
      isValid: false,
      errors: ['Settlement validation failed'],
      warnings: [],
      allowedActions: []
    };
  }
}

/**
 * Get allowed actions for internal order based on current state and settings
 */
export async function getAllowedInternalOrderActions(context: InternalOrderFlowContext): Promise<string[]> {
  const allowedActions: string[] = [];

  try {
    // Basic actions based on status
    switch (context.currentStatus) {
      case 'pending':
        allowedActions.push('acknowledge', 'cancel');
        break;
      case 'acknowledged':
        allowedActions.push('start_preparing', 'cancel');
        break;
      case 'preparing':
        allowedActions.push('mark_ready', 'cancel');
        break;
      case 'ready':
        allowedActions.push('dispatch', 'cancel');
        break;
      case 'dispatched':
        allowedActions.push('mark_delivered');
        break;
      case 'delivered':
        allowedActions.push('complete');
        break;
      case 'completed':
        if (context.userRole === 'super_admin') {
          allowedActions.push('reopen');
        }
        break;
    }

    // Feature-based actions
    const canModify = await isFeatureEnabled('enableOrderModification');
    if (canModify && !['completed', 'cancelled'].includes(context.currentStatus)) {
      allowedActions.push('modify_items', 'change_priority');
    }

    const canCancel = await isFeatureEnabled('enableOrderCancellation');
    if (canCancel && context.currentStatus !== 'cancelled') {
      allowedActions.push('cancel');
    }

    // Priority-based actions
    if (context.priority !== 'urgent' && !['completed', 'cancelled'].includes(context.currentStatus)) {
      allowedActions.push('escalate_priority');
    }

    // Department-specific actions
    if (context.toDepartment === 'kitchen' && context.currentStatus === 'preparing') {
      allowedActions.push('check_ingredients', 'estimate_time');
    }

    if (context.toDepartment === 'bar' && context.currentStatus === 'preparing') {
      allowedActions.push('check_stock', 'prepare_garnish');
    }

    // Remove duplicates
    return [...new Set(allowedActions)];

  } catch (error) {
    console.error('Error getting allowed internal order actions:', error);
    return [];
  }
}

/**
 * Log internal order flow validation events
 */
export async function logInternalOrderFlowEvent(
  action: string,
  context: InternalOrderFlowContext,
  result: OrderValidationResult,
  userId?: string
) {
  try {
    await createAuditLog(
      `INTERNAL_ORDER_${action.toUpperCase()}`,
      {
        orderId: context.orderId,
        fromDepartment: context.fromDepartment,
        toDepartment: context.toDepartment,
        currentStatus: context.currentStatus,
        orderType: context.orderType,
        priority: context.priority,
        userRole: context.userRole,
        validationResult: {
          isValid: result.isValid,
          errorCount: result.errors.length,
          warningCount: result.warnings.length,
          allowedActionsCount: result.allowedActions.length
        }
      },
      result.isValid,
      result.isValid 
        ? `Internal order ${action} validation passed` 
        : `Internal order ${action} validation failed: ${result.errors.join(', ')}`
    );
  } catch (error) {
    console.error('Error logging internal order flow event:', error);
  }
}