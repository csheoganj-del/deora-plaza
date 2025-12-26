/**
 * Database field whitelists for security
 * Only these fields are allowed in queries to prevent column enumeration attacks
 */

export const ALLOWED_FIELDS = {
    bills: [
        'id', 'billNumber', 'orderId', 'businessUnit', 'customerMobile', 'customerName',
        'subtotal', 'discountPercent', 'discountAmount', 'gstPercent', 'gstAmount',
        'grandTotal', 'amountPaid', 'paymentMethod', 'paymentStatus', 'source', 'address', 'items',
        'createdAt', 'updatedAt'
    ],
    orders: [
        'id', 'orderNumber', 'tableId', 'tableNumber', 'customerMobile', 'type', 'businessUnit',
        'roomNumber', 'source', 'guestCount', 'items', 'status', 'settlementStatus', 'billId',
        'bookingId', 'isPaid', 'totalAmount', 'paymentSyncedAt', 'paymentReceipt', 'timeline',
        'createdBy', 'createdAt', 'updatedAt', 'pendingAt', 'preparingAt', 'readyAt', 'servedAt', 'completedAt'
    ],
    customers: [
        'id', 'mobileNumber', 'name', 'email', 'visitCount', 'totalSpent', 'lastVisit',
        'createdAt', 'updatedAt'
    ],
    users: [
        'id', 'username', 'email', 'phoneNumber', 'authMethod', 'password', 'role', 'businessUnit', 'name', 'isActive',
        'createdAt', 'updatedAt'
    ],
    tables: [
        'id', 'tableNumber', 'businessUnit', 'capacity', 'status', 'currentOrderId',
        'createdAt', 'updatedAt'
    ],
    menu_items: [
        'id', 'name', 'description', 'price', 'category', 'businessUnit',
        'isAvailable', 'isDrink', 'measurement', 'measurementUnit', 'baseMeasurement', 'createdAt', 'updatedAt'
    ],
    bookings: [
        'id', 'bookingNumber', 'customerMobile', 'customerName', 'startDate', 'endDate', 'roomId', 'roomNumber',
        'basePrice', 'roomServiceTotal', 'roomServiceCharges', 'gstEnabled', 'gstPercentage', 'gstAmount',
        'discountPercent', 'discountAmount', 'totalAmount', 'advancePayment', 'payments', 'totalPaid',
        'remainingBalance', 'paymentStatus', 'status', 'type', 'eventType', 'guestCount', 'notes', 'receiptNumber',
        'createdAt', 'updatedAt'
    ],
    rooms: [
        'id', 'number', 'type', 'capacity', 'status', 'pricePerNight',
        'amenities', 'description', 'isActive', 'createdAt', 'updatedAt'
    ],
    audit_logs: [
        'id', 'action', 'userId', 'username', 'role', 'businessUnit', 'details',
        'ipAddress', 'userAgent', 'success', 'errorMessage', 'createdAt'
    ],
    discounts: [
        'id', 'code', 'type', 'value', 'description', 'isActive', 'validFrom', 'validUntil',
        'usageCount', 'maxUsage', 'minOrderValue', 'applicableBusinessUnits', 'createdAt', 'updatedAt'
    ],
    user_locations: [
        'user_id', 'latitude', 'longitude', 'timestamp', 'metadata'
    ],
    location_permissions: [
        'user_id', 'userId', 'canTrack', 'canView', 'canExport', 'consentGiven', 'consentDate', 'retentionDays'
    ],
    geofences: [
        'id', 'name', 'coordinates', 'radius', 'isActive', 'type', 'createdAt', 'updatedAt'
    ],
    location_events: [
        'id', 'userId', 'eventType', 'coordinates', 'timestamp', 'metadata'
    ],
    activity_logs: [
        'id', 'activity_type', 'description', 'latitude', 'longitude', 'timestamp', 'user_id', 'metadata'
    ]
} as const;

export const ALLOWED_OPERATORS = [
    '==', '!=', '>', '<', '>=', '<=', 'in'
] as const;

/**
 * Validate that a field is allowed for a given collection
 */
export function isFieldAllowed(collection: string, field: string): boolean {
    const allowedFields = ALLOWED_FIELDS[collection as keyof typeof ALLOWED_FIELDS];
    if (!allowedFields) {
        console.error(`Unknown collection: ${collection}`);
        return false;
    }
    return (allowedFields as unknown as string[]).includes(field);
}

/**
 * Validate that an operator is allowed
 */
export function isOperatorAllowed(operator: string): boolean {
    return ALLOWED_OPERATORS.includes(operator as any);
}

/**
 * Validate query filters for security
 */
export function validateQueryFilters(
    collection: string,
    filters: { field: string; operator: string; value: any }[]
): { valid: boolean; error?: string } {
    for (const filter of filters) {
        if (!isFieldAllowed(collection, filter.field)) {
            return {
                valid: false,
                error: `Field '${filter.field}' is not allowed for collection '${collection}'`
            };
        }

        if (!isOperatorAllowed(filter.operator)) {
            return {
                valid: false,
                error: `Operator '${filter.operator}' is not allowed`
            };
        }
    }

    return { valid: true };
}

