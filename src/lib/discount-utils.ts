// Discount and Customer Tier Management Utilities

export type DiscountTier = 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond'

export interface CustomerTierInfo {
  tier: DiscountTier
  discountPercentage: number
  totalSpent: number
  visitsCount: number
  color: string
  displayName: string
}

export interface BillTotals {
  subtotal: number
  discountAmount: number
  gstAmount: number
  total: number
  grandTotal: number
  discountPercentage: number
  gstPercentage: number
}

// Tier thresholds based on total spending
const TIER_THRESHOLDS = {
  bronze: 0,
  silver: 10000,
  gold: 25000,
  platinum: 50000,
  diamond: 100000
}

// Default discount percentages for each tier
const TIER_DISCOUNTS = {
  bronze: 0,
  silver: 5,
  gold: 10,
  platinum: 15,
  diamond: 20
}

// Tier colors for UI display
const TIER_COLORS = {
  bronze: 'bg-amber-100 text-amber-800 border-amber-200',
  silver: 'bg-gray-100 text-gray-800 border-gray-200',
  gold: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  platinum: 'bg-purple-100 text-purple-800 border-purple-200',
  diamond: 'bg-blue-100 text-blue-800 border-blue-200'
}

// Tier display names
const TIER_NAMES = {
  bronze: 'Bronze',
  silver: 'Silver',
  gold: 'Gold',
  platinum: 'Platinum',
  diamond: 'Diamond'
}

/**
 * Calculate customer tier based on total spending
 */
export function calculateCustomerTier(totalSpent: number): DiscountTier {
  if (totalSpent >= TIER_THRESHOLDS.diamond) return 'diamond'
  if (totalSpent >= TIER_THRESHOLDS.platinum) return 'platinum'
  if (totalSpent >= TIER_THRESHOLDS.gold) return 'gold'
  if (totalSpent >= TIER_THRESHOLDS.silver) return 'silver'
  return 'bronze'
}

/**
 * Get default discount percentage for a tier
 */
export function getDefaultDiscount(tier: DiscountTier): number {
  return TIER_DISCOUNTS[tier] || 0
}

/**
 * Get tier color classes for UI display
 */
export function getTierColor(tier: DiscountTier): string {
  return TIER_COLORS[tier] || TIER_COLORS.bronze
}

/**
 * Get tier display name
 */
export function getTierDisplayName(tier: DiscountTier): string {
  return TIER_NAMES[tier] || 'Bronze'
}

/**
 * Get complete customer tier information
 */
export function getCustomerTierInfo(totalSpent: number, visitsCount: number): CustomerTierInfo {
  const tier = calculateCustomerTier(totalSpent)
  return {
    tier,
    discountPercentage: getDefaultDiscount(tier),
    totalSpent,
    visitsCount,
    color: getTierColor(tier),
    displayName: getTierDisplayName(tier)
  }
}

/**
 * Calculate bill totals with discount and GST
 */
export function calculateBillTotals(
  subtotal: number,
  discountPercentage: number = 0,
  gstPercentage: number = 18,
  discountType: 'percentage' | 'fixed' = 'percentage',
  fixedDiscountAmount: number = 0
): BillTotals {
  // Calculate discount based on type
  const discountAmount = discountType === 'percentage'
    ? (subtotal * discountPercentage) / 100
    : fixedDiscountAmount;

  const discountedSubtotal = subtotal - discountAmount;
  const gstAmount = (discountedSubtotal * gstPercentage) / 100;
  const total = discountedSubtotal + gstAmount;

  return {
    subtotal,
    discountAmount,
    gstAmount,
    total,
    grandTotal: total,
    discountPercentage: discountType === 'percentage' ? discountPercentage : 0,
    gstPercentage
  };
}

/**
 * Calculate next tier requirements
 */
export function getNextTierRequirement(currentTier: DiscountTier, totalSpent: number): {
  nextTier: DiscountTier | null
  amountNeeded: number
  nextTierName: string
} {
  const tiers: DiscountTier[] = ['bronze', 'silver', 'gold', 'platinum', 'diamond']
  const currentIndex = tiers.indexOf(currentTier)

  if (currentIndex === -1 || currentIndex === tiers.length - 1) {
    return {
      nextTier: null,
      amountNeeded: 0,
      nextTierName: 'Maximum tier reached'
    }
  }

  const nextTier = tiers[currentIndex + 1]
  const amountNeeded = TIER_THRESHOLDS[nextTier] - totalSpent

  return {
    nextTier,
    amountNeeded: Math.max(0, amountNeeded),
    nextTierName: getTierDisplayName(nextTier)
  }
}

/**
 * Format currency for display
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  }).format(amount)
}

/**
 * Calculate loyalty points based on spending
 */
export function calculateLoyaltyPoints(amount: number, tier: DiscountTier): number {
  const basePoints = Math.floor(amount / 100) // 1 point per ₹100
  const multiplier = {
    bronze: 1,
    silver: 1.2,
    gold: 1.5,
    platinum: 2,
    diamond: 2.5
  }[tier] || 1

  return Math.floor(basePoints * multiplier)
}

/**
 * Validate discount percentage
 */
export function validateDiscountPercentage(percentage: number, maxDiscount: number = 50): boolean {
  return percentage >= 0 && percentage <= maxDiscount
}

/**
 * Get tier benefits description
 */
export function getTierBenefits(tier: DiscountTier): string[] {
  const benefits = {
    bronze: ['Basic customer support', 'Standard pricing'],
    silver: ['5% discount on all orders', 'Priority customer support', '1.2x loyalty points'],
    gold: ['10% discount on all orders', 'Free delivery on orders above ₹500', '1.5x loyalty points', 'Birthday special offers'],
    platinum: ['15% discount on all orders', 'Free delivery on all orders', '2x loyalty points', 'Exclusive menu previews', 'Complimentary appetizer monthly'],
    diamond: ['20% discount on all orders', 'Free delivery on all orders', '2.5x loyalty points', 'VIP customer support', 'Exclusive events access', 'Personal chef consultation']
  }

  return benefits[tier] || benefits.bronze
}