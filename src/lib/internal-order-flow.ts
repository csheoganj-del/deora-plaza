"use server";

import { createDocument, updateDocument, queryDocuments } from "@/lib/supabase/database";
import { createAuditLog } from "@/lib/audit";
import { isWaiterlessModeEnabled, isFeatureEnabled } from "@/actions/businessSettings";

/**
 * Internal Order Flow System for DEORA Plaza
 * Manages orders between different departments and business units
 */

export interface InternalOrderRequest {
  fromDepartment: string;
  toDepartment: string;
  orderType: 'supply_request' | 'service_request' | 'room_service' | 'catering' | 'bar_supply';
  items: Array<{
    itemId: string;
    name: string;
    quantity: number;
    unit?: string;
    notes?: string;
  }>;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  requestedBy: string;
  requestedFor?: string; // Customer/room/table
  deliveryLocation?: string;
  specialInstructions?: string;
  expectedDeliveryTime?: string;
}

export interface InternalOrderResponse {
  success: boolean;
  orderId?: string;
  orderNumber?: string;
  error?: string;
  estimatedTime?: number; // in minutes
}

export interface OrderStatusUpdate {
  orderId: string;
  newStatus: 'pending' | 'acknowledged' | 'preparing' | 'ready' | 'dispatched' | 'delivered' | 'completed' | 'cancelled';
  updatedBy: string;
  notes?: string;
  estimatedTime?: number;
}

/**
 * Create internal order between departments
 */
export async function createInternalOrder(request: InternalOrderRequest): Promise<InternalOrderResponse> {
  try {
    console.log('🔄 Creating internal order:', request);

    // Validate request
    if (!request.fromDepartment || !request.toDepartment) {
      return {
        success: false,
        error: 'From and To departments are required'
      };
    }

    if (!request.items || request.items.length === 0) {
      return {
        success: false,
        error: 'At least one item is required'
      };
    }

    // Generate order number
    const timestamp = Date.now();
    const orderNumber = `INT-${request.orderType.toUpperCase()}-${timestamp}`;

    // Calculate estimated time based on order type and priority
    const estimatedTime = calculateEstimatedTime(request.orderType, request.priority);

    // Create internal order
    const orderData = {
      orderNumber,
      fromDepartment: request.fromDepartment,
      toDepartment: request.toDepartment,
      orderType: request.orderType,
      items: request.items,
      priority: request.priority,
      requestedBy: request.requestedBy,
      requestedFor: request.requestedFor,
      deliveryLocation: request.deliveryLocation,
      specialInstructions: request.specialInstructions,
      expectedDeliveryTime: request.expectedDeliveryTime,
      estimatedTime,
      status: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      timeline: [{
        status: 'pending',
        timestamp: new Date().toISOString(),
        actor: request.requestedBy,
        message: `Internal order created by ${request.fromDepartment}`,
        metadata: { orderType: request.orderType, priority: request.priority }
      }]
    };

    const result = await createDocument('internal_orders', orderData);

    if (!result.success) {
      return {
        success: false,
        error: result.error || 'Failed to create internal order'
      };
    }

    // Create notification for receiving department
    await createInternalOrderNotification(orderData, 'new_order');

    // Send integrated notification
    try {
      const { getIntegratedNotificationSystem } = await import("@/lib/integrated-notification-system");
      const notificationSystem = getIntegratedNotificationSystem();
      
      await notificationSystem.handleInternalOrderNotification(
        result.data?.id || '',
        orderNumber,
        request.orderType,
        request.fromDepartment,
        request.toDepartment,
        'pending',
        {
          priority: request.priority,
          itemCount: request.items.length,
          estimatedTime,
          specialInstructions: request.specialInstructions
        }
      );
    } catch (notificationError) {
      console.warn("Failed to send integrated internal order notification:", notificationError);
    }

    // Audit log
    await createAuditLog(
      'INTERNAL_ORDER_CREATED',
      {
        orderId: result.data?.id,
        orderNumber,
        fromDepartment: request.fromDepartment,
        toDepartment: request.toDepartment,
        orderType: request.orderType,
        itemCount: request.items.length,
        priority: request.priority
      },
      true,
      `Internal order ${orderNumber} created from ${request.fromDepartment} to ${request.toDepartment}`
    );

    return {
      success: true,
      orderId: result.data?.id,
      orderNumber,
      estimatedTime
    };

  } catch (error) {
    console.error('❌ Error creating internal order:', error);
    
    await createAuditLog(
      'INTERNAL_ORDER_ERROR',
      {
        fromDepartment: request.fromDepartment,
        toDepartment: request.toDepartment,
        error: error instanceof Error ? error.message : String(error)
      },
      false,
      `Internal order creation failed: ${error instanceof Error ? error.message : String(error)}`
    );

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Internal order creation failed'
    };
  }
}

/**
 * Update internal order status
 */
export async function updateInternalOrderStatus(update: OrderStatusUpdate): Promise<{ success: boolean; error?: string }> {
  try {
    console.log('🔄 Updating internal order status:', update);

    // Get current order
    const { data: orderData, error: orderError } = await supabaseServer
      .from('internal_orders')
      .select('*')
      .eq('id', update.orderId)
      .single();

    if (orderError || !orderData) {
      return { success: false, error: 'Internal order not found' };
    }

    // Validate status transition
    const validTransition = validateStatusTransition(orderData.status, update.newStatus);
    if (!validTransition.isValid) {
      return { success: false, error: validTransition.error };
    }

    // Update order
    const now = new Date().toISOString();
    const timeline = orderData.timeline || [];
    timeline.push({
      status: update.newStatus,
      timestamp: now,
      actor: update.updatedBy,
      message: update.notes || `Status updated to ${update.newStatus}`,
      metadata: { estimatedTime: update.estimatedTime }
    });

    const updateData: any = {
      status: update.newStatus,
      [`${update.newStatus}At`]: now,
      updatedAt: now,
      timeline
    };

    if (update.estimatedTime) {
      updateData.estimatedTime = update.estimatedTime;
    }

    await updateDocument('internal_orders', update.orderId, updateData);

    // Create notification for status change
    await createInternalOrderNotification(orderData, 'status_update', update.newStatus);

    // Send integrated notification
    try {
      const { getIntegratedNotificationSystem } = await import("@/lib/integrated-notification-system");
      const notificationSystem = getIntegratedNotificationSystem();
      
      await notificationSystem.handleInternalOrderNotification(
        update.orderId,
        orderData.orderNumber,
        orderData.orderType,
        orderData.fromDepartment,
        orderData.toDepartment,
        update.newStatus,
        {
          priority: orderData.priority,
          estimatedTime: update.estimatedTime,
          notes: update.notes,
          updatedBy: update.updatedBy
        }
      );
    } catch (notificationError) {
      console.warn("Failed to send integrated internal order status notification:", notificationError);
    }

    // Handle completion
    if (update.newStatus === 'completed') {
      await handleOrderCompletion(update.orderId, orderData);
    }

    // Audit log
    await createAuditLog(
      'INTERNAL_ORDER_STATUS_UPDATED',
      {
        orderId: update.orderId,
        orderNumber: orderData.orderNumber,
        oldStatus: orderData.status,
        newStatus: update.newStatus,
        updatedBy: update.updatedBy
      },
      true,
      `Internal order ${orderData.orderNumber} status updated from ${orderData.status} to ${update.newStatus}`
    );

    return { success: true };

  } catch (error) {
    console.error('❌ Error updating internal order status:', error);
    
    await createAuditLog(
      'INTERNAL_ORDER_STATUS_ERROR',
      {
        orderId: update.orderId,
        error: error instanceof Error ? error.message : String(error)
      },
      false,
      `Internal order status update failed: ${error instanceof Error ? error.message : String(error)}`
    );

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Status update failed'
    };
  }
}

/**
 * Get internal orders for a department
 */
export async function getInternalOrders(
  department: string,
  direction: 'incoming' | 'outgoing' | 'all' = 'all',
  status?: string
): Promise<any[]> {
  try {
    const filters: any[] = [];

    if (direction === 'incoming') {
      filters.push({ field: 'toDepartment', operator: '==', value: department });
    } else if (direction === 'outgoing') {
      filters.push({ field: 'fromDepartment', operator: '==', value: department });
    } else {
      // For 'all', we need to get orders where department is either from or to
      // This requires two separate queries and merging results
    }

    if (status) {
      filters.push({ field: 'status', operator: '==', value: status });
    }

    let orders: any[] = [];

    if (direction === 'all') {
      // Get incoming orders
      const incomingFilters = [
        { field: 'toDepartment', operator: '==', value: department },
        ...(status ? [{ field: 'status', operator: '==', value: status }] : [])
      ];
      const incomingOrders = await queryDocuments('internal_orders', incomingFilters, 'createdAt', 'desc');

      // Get outgoing orders
      const outgoingFilters = [
        { field: 'fromDepartment', operator: '==', value: department },
        ...(status ? [{ field: 'status', operator: '==', value: status }] : [])
      ];
      const outgoingOrders = await queryDocuments('internal_orders', outgoingFilters, 'createdAt', 'desc');

      // Merge and sort by creation date
      orders = [...incomingOrders, ...outgoingOrders].sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    } else {
      orders = await queryDocuments('internal_orders', filters, 'createdAt', 'desc');
    }

    return orders.map((order: any) => ({
      ...order,
      createdAt: order.createdAt ? new Date(order.createdAt).toISOString() : null,
      updatedAt: order.updatedAt ? new Date(order.updatedAt).toISOString() : null,
      timeline: Array.isArray(order.timeline)
        ? order.timeline.map((entry: any) => ({
            ...entry,
            timestamp: entry.timestamp ? new Date(entry.timestamp).toISOString() : null,
          }))
        : order.timeline,
    }));

  } catch (error) {
    console.error('Error fetching internal orders:', error);
    return [];
  }
}

/**
 * Calculate estimated time based on order type and priority
 */
function calculateEstimatedTime(orderType: string, priority: string): number {
  const baseTime = {
    'supply_request': 30,
    'service_request': 15,
    'room_service': 20,
    'catering': 60,
    'bar_supply': 10
  };

  const priorityMultiplier = {
    'urgent': 0.5,
    'high': 0.7,
    'medium': 1.0,
    'low': 1.5
  };

  const base = baseTime[orderType as keyof typeof baseTime] || 30;
  const multiplier = priorityMultiplier[priority as keyof typeof priorityMultiplier] || 1.0;

  return Math.round(base * multiplier);
}

/**
 * Validate status transition
 */
function validateStatusTransition(currentStatus: string, newStatus: string): { isValid: boolean; error?: string } {
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

  const allowedNextStates = validTransitions[currentStatus] || [];
  
  if (!allowedNextStates.includes(newStatus)) {
    return {
      isValid: false,
      error: `Cannot transition from ${currentStatus} to ${newStatus}`
    };
  }

  return { isValid: true };
}

/**
 * Create notification for internal order
 */
async function createInternalOrderNotification(orderData: any, type: string, newStatus?: string) {
  try {
    let message = '';
    let recipient = '';

    switch (type) {
      case 'new_order':
        message = `New ${orderData.orderType} from ${orderData.fromDepartment}`;
        recipient = orderData.toDepartment;
        break;
      case 'status_update':
        message = `Order ${orderData.orderNumber} is now ${newStatus}`;
        recipient = orderData.fromDepartment;
        break;
    }

    await createDocument('notifications', {
      type: 'internal_order',
      orderId: orderData.id,
      businessUnit: recipient,
      message,
      title: 'Internal Order Update',
      recipient,
      metadata: {
        orderNumber: orderData.orderNumber,
        orderType: orderData.orderType,
        fromDepartment: orderData.fromDepartment,
        toDepartment: orderData.toDepartment,
        priority: orderData.priority
      },
      isRead: false,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString() // 4 hours
    });

  } catch (error) {
    console.warn('Failed to create internal order notification:', error);
  }
}

/**
 * Handle order completion
 */
async function handleOrderCompletion(orderId: string, orderData: any) {
  try {
    // Update any related external orders if this was a supply request
    if (orderData.orderType === 'supply_request' && orderData.relatedOrderId) {
      await updateDocument('orders', orderData.relatedOrderId, {
        supplyStatus: 'fulfilled',
        updatedAt: new Date().toISOString()
      });
    }

    // Create completion notification
    await createDocument('notifications', {
      type: 'internal_order_completed',
      orderId,
      businessUnit: orderData.fromDepartment,
      message: `Internal order ${orderData.orderNumber} completed successfully`,
      title: 'Order Completed',
      recipient: orderData.fromDepartment,
      isRead: false,
      createdAt: new Date().toISOString()
    });

  } catch (error) {
    console.warn('Failed to handle order completion:', error);
  }
}

/**
 * Get internal order statistics for dashboard
 */
export async function getInternalOrderStats(department: string): Promise<{
  pending: number;
  inProgress: number;
  completed: number;
  avgCompletionTime: number;
}> {
  try {
    const orders = await getInternalOrders(department, 'all');
    
    const pending = orders.filter(o => o.status === 'pending').length;
    const inProgress = orders.filter(o => ['acknowledged', 'preparing', 'ready', 'dispatched'].includes(o.status)).length;
    const completed = orders.filter(o => o.status === 'completed').length;
    
    // Calculate average completion time for completed orders
    const completedOrders = orders.filter(o => o.status === 'completed' && o.completedAt);
    let avgCompletionTime = 0;
    
    if (completedOrders.length > 0) {
      const totalTime = completedOrders.reduce((sum, order) => {
        const created = new Date(order.createdAt).getTime();
        const completed = new Date(order.completedAt).getTime();
        return sum + (completed - created);
      }, 0);
      
      avgCompletionTime = Math.round(totalTime / completedOrders.length / (1000 * 60)); // Convert to minutes
    }

    return {
      pending,
      inProgress,
      completed,
      avgCompletionTime
    };

  } catch (error) {
    console.error('Error fetching internal order stats:', error);
    return {
      pending: 0,
      inProgress: 0,
      completed: 0,
      avgCompletionTime: 0
    };
  }
}