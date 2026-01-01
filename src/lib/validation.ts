import { z } from 'zod'

/**
 * SECURITY: Input validation schemas using Zod
 * All server actions should validate inputs to prevent injection attacks
 */

// Common schemas
export const mobileSchema = z.string().regex(/^[0-9]{10}$/, 'Mobile number must be 10 digits')
export const emailSchema = z.string().email('Invalid email address')
export const positiveNumberSchema = z.number().positive('Must be a positive number')
export const percentageSchema = z.number().min(0).max(100, 'Must be between 0 and 100')

// Bill validation
export const createBillSchema = z.object({
    orderId: z.string().min(1, 'Order ID is required'),
    businessUnit: z.enum(['cafe', 'bar', 'hotel', 'garden'], {
        message: 'Invalid business unit'
    }),
    customerMobile: mobileSchema.optional(),
    customerName: z.string().max(100).optional(),
    subtotal: positiveNumberSchema,
    discountPercent: percentageSchema.optional(),
    discountAmount: z.number().min(0).optional(),
    gstPercent: percentageSchema,
    gstAmount: z.number().min(0),
    grandTotal: positiveNumberSchema,
    paymentMethod: z.enum(['cash', 'card', 'upi', 'online']).optional(),
    source: z.enum(['dine-in', 'takeaway', 'online', 'zomato', 'swiggy', 'external']).optional(),
    externalPlatform: z.enum(['zomato', 'swiggy', 'uber_eats', 'foodpanda', 'other']).optional(),
    address: z.string().max(500).optional(),
    items: z.array(z.any()).optional(),
})

// Order validation
export const createOrderSchema = z.object({
    tableId: z.string().optional(),
    tableNumber: z.string().optional(),
    customerMobile: z.string().optional(),
    type: z.enum(['dine-in', 'takeaway', 'delivery']),
    businessUnit: z.enum(['cafe', 'bar', 'hotel', 'garden']),
    roomNumber: z.string().optional(),
    source: z.enum(['pos', 'mobile', 'website']).optional(),
    guestCount: z.number().int().positive().optional(),
    items: z.array(z.object({
        menuItemId: z.string(),
        name: z.string(),
        quantity: z.number().int().positive(),
        price: z.number().positive(),
        specialInstructions: z.string().optional(),
    })).min(1),
})

// Customer validation
export const createCustomerSchema = z.object({
    mobileNumber: mobileSchema,
    name: z.string().min(1).max(100),
    email: emailSchema.optional(),
})

// User validation
export const createUserSchema = z.object({
    username: z.string().min(3).max(30),
    email: z.string().email(),
    password: z.string()
        .min(8, 'Password must be at least 8 characters')
        .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
        .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
        .regex(/[0-9]/, 'Password must contain at least one number')
        .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),
    role: z.enum(['super_admin', 'owner', 'manager', 'cafe_manager', 'bar_manager', 'hotel_manager', 'garden_manager', 'waiter', 'kitchen', 'bartender', 'reception', 'hotel_reception']),
    businessUnit: z.enum(['all', 'cafe', 'bar', 'hotel', 'garden']),
    name: z.string().min(1).max(100),
})

// Table validation
export const createTableSchema = z.object({
    tableNumber: z.string().min(1).max(10),
    businessUnit: z.enum(['cafe', 'bar', 'hotel', 'garden']),
    capacity: z.number().int().positive().max(50),
})

// Menu item validation
export const createMenuItemSchema = z.object({
    name: z.string().min(1).max(100),
    description: z.string().max(500).optional(),
    price: positiveNumberSchema,
    category: z.string().min(1).max(50),
    businessUnit: z.enum(['cafe', 'bar', 'hotel', 'garden']),
    isAvailable: z.boolean().optional(),
    isDrink: z.boolean().optional(),
})

// Booking validation (Hotel/Garden)
export const createBookingSchema = z.object({
    customerName: z.string().min(1).max(100),
    customerMobile: mobileSchema,
    startDate: z.date(),
    endDate: z.date(),
    basePrice: positiveNumberSchema,
    gstEnabled: z.boolean().optional(),
    gstPercentage: percentageSchema.optional(),
    discountPercent: percentageSchema.optional(),
    totalAmount: positiveNumberSchema,
    advancePayment: z.number().min(0).optional(),
    notes: z.string().max(1000).optional(),
})

// Password validation for sensitive operations
export const deletePasswordSchema = z.string()
    .min(12, 'Deletion password must be at least 12 characters')
    .regex(/[A-Z]/, 'Must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Must contain at least one number')
    .regex(/[^A-Za-z0-9]/, 'Must contain at least one special character')

/**
 * Helper function to safely validate data
 * Returns validated data or throws error with details
 */
export function validateInput<T>(schema: z.ZodSchema<T>, data: unknown): T {
    try {
        return schema.parse(data)
    } catch (error) {
        if (error instanceof z.ZodError) {
            const errorMessages = error.issues.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')
            throw new Error(`Validation failed: ${errorMessages}`)
        }
        throw error
    }
}

