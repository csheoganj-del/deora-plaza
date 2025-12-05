/**
 * Discount utility functions for calculating customer tiers and discounts
 */

export type DiscountTier = 'regular' | 'silver' | 'gold' | 'platinum'

export interface TierRequirements {
  minVisits: number
  minSpent: number
  defaultDiscount: number
}

export const TIER_CONFIG: Record<DiscountTier, TierRequirements> = {
  regular: {
    minVisits: 0,
    minSpent: 0,
    defaultDiscount: 0,
  },
  silver: {
    minVisits: 10,
    minSpent: 10000,
    defaultDiscount: 5,
  },
  gold: {
    minVisits: 25,
    minSpent: 25000,
    defaultDiscount: 10,
  },
  platinum: {
    minVisits: 50,
    minSpent: 50000,
    defaultDiscount: 15,
  },
}

/**
 * Calculate the appropriate customer tier based on visit count and total spending
 */
export function calculateCustomerTier(
  visitCount: number,
  totalSpent: number
): DiscountTier {
  if (visitCount >= TIER_CONFIG.platinum.minVisits || totalSpent >= TIER_CONFIG.platinum.minSpent) {
    return 'platinum'
  }
  if (visitCount >= TIER_CONFIG.gold.minVisits || totalSpent >= TIER_CONFIG.gold.minSpent) {
    return 'gold'
  }
  if (visitCount >= TIER_CONFIG.silver.minVisits || totalSpent >= TIER_CONFIG.silver.minSpent) {
    return 'silver'
  }
  return 'regular'
}

/**
 * Get the default discount percentage for a given tier
 */
export function getDefaultDiscount(tier: DiscountTier): number {
  return TIER_CONFIG[tier]?.defaultDiscount || 0
}

/**
 * Calculate discount amount and final amount after discount
 */
export function applyDiscount(
  amount: number,
  percent: number
): {
  discountAmount: number
  finalAmount: number
} {
  const validPercent = validateDiscount(percent) ? percent : 0
  const discountAmount = (amount * validPercent) / 100
  const finalAmount = amount - discountAmount

  return {
    discountAmount: Math.round(discountAmount * 100) / 100, // Round to 2 decimals
    finalAmount: Math.round(finalAmount * 100) / 100,
  }
}

/**
 * Validate that discount percentage is within acceptable range
 */
export function validateDiscount(percent: number): boolean {
  return typeof percent === 'number' && percent >= 0 && percent <= 100 && !isNaN(percent)
}

/**
 * Get tier badge color for UI display
 */
export function getTierColor(tier: DiscountTier): string {
  const colors: Record<DiscountTier, string> = {
    regular: 'bg-gray-100 text-gray-800',
    silver: 'bg-slate-100 text-slate-800',
    gold: 'bg-yellow-100 text-yellow-800',
    platinum: 'bg-purple-100 text-purple-800',
  }
  return colors[tier] || colors.regular
}

/**
 * Get tier display name
 */
export function getTierDisplayName(tier: DiscountTier): string {
  const names: Record<DiscountTier, string> = {
    regular: 'Regular',
    silver: 'Silver',
    gold: 'Gold',
    platinum: 'Platinum',
  }
  return names[tier] || 'Regular'
}

/**
 * Calculate bill totals with discount and GST
 */
export function calculateBillTotals(
  subtotal: number,
  discountPercent: number,
  gstPercent: number
): {
  subtotal: number
  discountPercent: number
  discountAmount: number
  discountedSubtotal: number
  gstPercent: number
  gstAmount: number
  grandTotal: number
} {
  const { discountAmount, finalAmount: discountedSubtotal } = applyDiscount(
    subtotal,
    discountPercent
  )
  const gstAmount = (discountedSubtotal * gstPercent) / 100
  const grandTotal = discountedSubtotal + gstAmount

  return {
    subtotal: Math.round(subtotal * 100) / 100,
    discountPercent,
    discountAmount,
    discountedSubtotal,
    gstPercent,
    gstAmount: Math.round(gstAmount * 100) / 100,
    grandTotal: Math.round(grandTotal * 100) / 100,
  }
}
