// Unified Customer Loyalty Program System
export interface BusinessUnitType {
  CAFE: 'cafe';
  RESTAURANT: 'restaurant';
  BAR: 'bar';
  HOTEL: 'hotel';
  MARRIAGE_GARDEN: 'marriage_garden';
}

export interface LoyaltyTier {
  BRONZE: 'bronze';
  SILVER: 'silver';
  GOLD: 'gold';
  PLATINUM: 'platinum';
  DIAMOND: 'diamond';
}

export interface LoyaltyCustomer {
  id: string;
  customerId: string; // Reference to main customer
  loyaltyNumber: string;
  currentTier: keyof LoyaltyTier;
  points: number;
  lifetimePoints: number;
  totalSpent: number;
  visitCount: number;
  lastVisitDate: string;
  enrollmentDate: string;
  preferredBusinessUnits: (keyof BusinessUnitType)[];
  preferences: {
    communication: 'email' | 'sms' | 'both' | 'none';
    marketing: boolean;
    promotions: boolean;
    birthdayOffers: boolean;
    anniversaryOffers: boolean;
  };
  rewards: string[]; // Reward IDs
  achievements: string[]; // Achievement IDs
  isActive: boolean;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface LoyaltyTransaction {
  id: string;
  customerId: string;
  businessUnit: keyof BusinessUnitType;
  orderId?: string;
  type: 'earn' | 'redeem' | 'expire' | 'adjust' | 'bonus';
  points: number;
  amount: number; // Transaction amount in currency
  description: string;
  referenceId?: string; // Order ID, Reward ID, etc.
  expiryDate?: string;
  processedAt: string;
  createdAt: string;
}

export interface LoyaltyReward {
  id: string;
  name: string;
  description: string;
  type: 'discount' | 'free_item' | 'upgrade' | 'experience' | 'cashback';
  category: 'food' | 'beverage' | 'accommodation' | 'event' | 'general';
  businessUnits: (keyof BusinessUnitType)[];
  requiredPoints: number;
  value: number; // Monetary value or percentage
  validFrom: string;
  validTo: string;
  usageLimit?: number; // Per customer
  totalLimit?: number; // Total usage limit
  currentUsage: number;
  isActive: boolean;
  conditions?: string;
  image?: string;
  createdAt: string;
  updatedAt: string;
}

export interface LoyaltyAchievement {
  id: string;
  name: string;
  description: string;
  type: 'visits' | 'spending' | 'milestone' | 'special' | 'referral';
  category: 'frequency' | 'value' | 'engagement' | 'loyalty';
  businessUnits: (keyof BusinessUnitType)[];
  criteria: {
    visits?: number;
    spending?: number;
    points?: number;
    days?: number;
    specific?: string;
  };
  pointsReward: number;
  badge?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface LoyaltyPromotion {
  id: string;
  name: string;
  description: string;
  type: 'points_multiplier' | 'bonus_points' | 'tier_upgrade' | 'special_reward';
  businessUnits: (keyof BusinessUnitType)[];
  validFrom: string;
  validTo: string;
  conditions: {
    minSpending?: number;
    dayOfWeek?: number[];
    timeSlot?: { start: string; end: string };
    customerTier?: (keyof LoyaltyTier)[];
    items?: string[];
  };
  multiplier?: number; // For points_multiplier type
  bonusPoints?: number; // For bonus_points type
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface LoyaltyStats {
  totalCustomers: number;
  activeCustomers: number;
  totalPointsIssued: number;
  totalPointsRedeemed: number;
  totalRewardsRedeemed: number;
  customerTierDistribution: Record<keyof LoyaltyTier, number>;
  businessUnitDistribution: Record<string, number>;
  averagePointsPerCustomer: number;
  averageSpendingPerCustomer: number;
  customerRetentionRate: number;
  programEngagementRate: number;
  topRewards: Array<{ rewardId: string; name: string; redemptions: number }>;
  recentTransactions: LoyaltyTransaction[];
}

export interface LoyaltyAnalytics {
  period: string; // YYYY-MM
  customerGrowth: {
    newCustomers: number;
    returningCustomers: number;
    churnRate: number;
  };
  revenueImpact: {
    loyaltyRevenue: number;
    upliftPercentage: number;
    averageOrderValue: {
      loyalty: number;
      nonLoyalty: number;
    };
  };
  engagementMetrics: {
    activeMembers: number;
    redemptionRate: number;
    pointsEarned: number;
    pointsRedeemed: number;
  };
  tierProgression: {
    upgrades: number;
    downgrades: number;
    tierChanges: Record<keyof LoyaltyTier, number>;
  };
}

export class UnifiedLoyaltyManager {
  private static instance: UnifiedLoyaltyManager;
  private customers: LoyaltyCustomer[] = [];
  private transactions: LoyaltyTransaction[] = [];
  private rewards: LoyaltyReward[] = [];
  private achievements: LoyaltyAchievement[] = [];
  private promotions: LoyaltyPromotion[] = [];

  private constructor() {
    this.initializeMockData();
  }

  public static getInstance(): UnifiedLoyaltyManager {
    if (!UnifiedLoyaltyManager.instance) {
      UnifiedLoyaltyManager.instance = new UnifiedLoyaltyManager();
    }
    return UnifiedLoyaltyManager.instance;
  }

  private initializeMockData() {
    // Initialize empty arrays - data should be loaded from database
    this.rewards = [];
    this.achievements = [];
    this.promotions = [];
    this.customers = [];
    this.transactions = [];
  }
    this.transactions = [
      {
        id: 'transaction_1',
        customerId: 'loyalty_1',
        businessUnit: 'BAR',
        orderId: 'order_1',
        type: 'earn',
        points: 25,
        amount: 25.00,
        description: 'Points earned from purchase',
        referenceId: 'order_1',
        processedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: 'transaction_2',
        customerId: 'loyalty_1',
        businessUnit: 'BAR',
        type: 'redeem',
        points: -100,
        amount: 0,
        description: 'Redeemed Free Coffee',
        referenceId: 'reward_1',
        processedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
      }
    ];
  }

  // Customer Management
  public getLoyaltyCustomer(customerId: string): LoyaltyCustomer | null {
    return this.customers.find(c => c.customerId === customerId) || null;
  }

  public getLoyaltyCustomerByNumber(loyaltyNumber: string): LoyaltyCustomer | null {
    return this.customers.find(c => c.loyaltyNumber === loyaltyNumber) || null;
  }

  public enrollCustomer(customerData: Omit<LoyaltyCustomer, 'id' | 'loyaltyNumber' | 'currentTier' | 'points' | 'lifetimePoints' | 'totalSpent' | 'visitCount' | 'lastVisitDate' | 'rewards' | 'achievements' | 'createdAt' | 'updatedAt'>): LoyaltyCustomer {
    const loyaltyNumber = this.generateLoyaltyNumber();
    const customer: LoyaltyCustomer = {
      ...customerData,
      id: `loyalty_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      loyaltyNumber,
      currentTier: 'BRONZE',
      points: 0,
      lifetimePoints: 0,
      totalSpent: 0,
      visitCount: 0,
      lastVisitDate: '',
      rewards: [],
      achievements: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.customers.push(customer);
    
    // Award enrollment bonus
    this.awardPoints(customer.id, 50, 'Enrollment bonus', 'bonus');
    
    // Check for first visit achievement
    this.checkAchievements(customer.id);
    
    return customer;
  }

  private generateLoyaltyNumber(): string {
    const prefix = 'LOY';
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `${prefix}${timestamp}${random}`;
  }

  // Points Management
  public awardPoints(customerId: string, points: number, description: string, type: LoyaltyTransaction['type'], orderId?: string, businessUnit?: keyof BusinessUnitType): boolean {
    const customer = this.customers.find(c => c.id === customerId);
    if (!customer || !customer.isActive) return false;

    // Check for active promotions
    const multiplier = this.getPointsMultiplier(businessUnit);
    const finalPoints = Math.floor(points * multiplier);

    const transaction: LoyaltyTransaction = {
      id: `transaction_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      customerId,
      businessUnit: businessUnit || 'CAFE',
      orderId,
      type,
      points: finalPoints,
      amount: 0,
      description,
      referenceId: orderId,
      processedAt: new Date().toISOString(),
      createdAt: new Date().toISOString()
    };

    this.transactions.push(transaction);

    // Update customer points
    customer.points += finalPoints;
    customer.lifetimePoints += finalPoints;
    customer.updatedAt = new Date().toISOString();

    // Check for tier upgrade
    this.checkTierUpgrade(customerId);
    
    // Check for achievements
    this.checkAchievements(customerId);

    return true;
  }

  public redeemReward(customerId: string, rewardId: string): boolean {
    const customer = this.customers.find(c => c.id === customerId);
    const reward = this.rewards.find(r => r.id === rewardId);

    if (!customer || !reward || !customer.isActive || !reward.isActive) return false;
    if (customer.points < reward.requiredPoints) return false;

    // Check usage limits
    const customerRedemptions = this.getCustomerRewardRedemptions(customerId, rewardId);
    if (reward.usageLimit && customerRedemptions >= reward.usageLimit) return false;
    if (reward.totalLimit && reward.currentUsage >= reward.totalLimit) return false;

    // Create redemption transaction
    const transaction: LoyaltyTransaction = {
      id: `transaction_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      customerId,
      businessUnit: reward.businessUnits[0], // Use first business unit
      type: 'redeem',
      points: -reward.requiredPoints,
      amount: 0,
      description: `Redeemed ${reward.name}`,
      referenceId: rewardId,
      processedAt: new Date().toISOString(),
      createdAt: new Date().toISOString()
    };

    this.transactions.push(transaction);

    // Update customer
    customer.points -= reward.requiredPoints;
    customer.rewards.push(rewardId);
    customer.updatedAt = new Date().toISOString();

    // Update reward usage
    reward.currentUsage++;
    reward.updatedAt = new Date().toISOString();

    return true;
  }

  private getPointsMultiplier(businessUnit?: keyof BusinessUnitType): number {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const currentTime = today.getHours() * 60 + today.getMinutes();

    const activePromotions = this.promotions.filter(promo => 
      promo.isActive &&
      new Date(promo.validFrom) <= today &&
      new Date(promo.validTo) >= today &&
      (!businessUnit || promo.businessUnits.includes(businessUnit))
    );

    let multiplier = 1;
    for (const promo of activePromotions) {
      if (promo.type === 'points_multiplier' && promo.multiplier) {
        // Check day of week condition
        if (promo.conditions.dayOfWeek && !promo.conditions.dayOfWeek.includes(dayOfWeek)) {
          continue;
        }
        
        // Check time slot condition
        if (promo.conditions.timeSlot) {
          const promoStart = this.timeToMinutes(promo.conditions.timeSlot.start);
          const promoEnd = this.timeToMinutes(promo.conditions.timeSlot.end);
          if (currentTime < promoStart || currentTime > promoEnd) {
            continue;
          }
        }

        multiplier = Math.max(multiplier, promo.multiplier);
      }
    }

    return multiplier;
  }

  private timeToMinutes(time: string): number {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  }

  // Tier Management
  private checkTierUpgrade(customerId: string): boolean {
    const customer = this.customers.find(c => c.id === customerId);
    if (!customer) return false;

    let newTier = customer.currentTier;
    
    // Tier thresholds (can be made configurable)
    const tierThresholds = {
      BRONZE: 0,
      SILVER: 500,
      GOLD: 1500,
      PLATINUM: 3000,
      DIAMOND: 5000
    };

    for (const [tier, threshold] of Object.entries(tierThresholds)) {
      if (customer.lifetimePoints >= threshold) {
        newTier = tier as keyof LoyaltyTier;
      }
    }

    if (newTier !== customer.currentTier) {
      customer.currentTier = newTier;
      customer.updatedAt = new Date().toISOString();
      
      // Award tier upgrade bonus
      const tierBonus: Record<keyof LoyaltyTier, number> = {
        BRONZE: 0,
        SILVER: 100,
        GOLD: 250,
        PLATINUM: 500,
        DIAMOND: 1000
      };
      
      if (tierBonus[newTier]) {
        this.awardPoints(customerId, tierBonus[newTier], `Tier upgrade to ${newTier}`, 'bonus');
      }
      
      return true;
    }

    return false;
  }

  // Achievement Management
  private checkAchievements(customerId: string): boolean {
    const customer = this.customers.find(c => c.id === customerId);
    if (!customer) return false;

    let newAchievement = false;

    for (const achievement of this.achievements) {
      if (!achievement.isActive || customer.achievements.includes(achievement.id)) continue;

      let achieved = false;

      if (achievement.criteria.visits && customer.visitCount >= achievement.criteria.visits) {
        achieved = true;
      }
      if (achievement.criteria.spending && customer.totalSpent >= achievement.criteria.spending) {
        achieved = true;
      }
      if (achievement.criteria.points && customer.lifetimePoints >= achievement.criteria.points) {
        achieved = true;
      }

      if (achieved) {
        customer.achievements.push(achievement.id);
        this.awardPoints(customerId, achievement.pointsReward, `Achievement: ${achievement.name}`, 'bonus');
        newAchievement = true;
      }
    }

    return newAchievement;
  }

  // Analytics and Reporting
  public getLoyaltyStats(): LoyaltyStats {
    const activeCustomers = this.customers.filter(c => c.isActive);
    
    const tierDistribution: Record<keyof LoyaltyTier, number> = {
      BRONZE: 0,
      SILVER: 0,
      GOLD: 0,
      PLATINUM: 0,
      DIAMOND: 0
    };

    const businessUnitDistribution: Record<string, number> = {};
    
    activeCustomers.forEach(customer => {
      tierDistribution[customer.currentTier]++;
      customer.preferredBusinessUnits.forEach(bu => {
        businessUnitDistribution[bu] = (businessUnitDistribution[bu] || 0) + 1;
      });
    });

    const totalPointsIssued = this.transactions
      .filter(t => t.points > 0)
      .reduce((sum, t) => sum + t.points, 0);
    
    const totalPointsRedeemed = Math.abs(this.transactions
      .filter(t => t.points < 0)
      .reduce((sum, t) => sum + t.points, 0));

    const totalRewardsRedeemed = this.transactions
      .filter(t => t.type === 'redeem')
      .length;

    const averagePointsPerCustomer = activeCustomers.length > 0 
      ? activeCustomers.reduce((sum, c) => sum + c.points, 0) / activeCustomers.length 
      : 0;

    const averageSpendingPerCustomer = activeCustomers.length > 0
      ? activeCustomers.reduce((sum, c) => sum + c.totalSpent, 0) / activeCustomers.length
      : 0;

    const customerRetentionRate = this.calculateRetentionRate();
    const programEngagementRate = this.calculateEngagementRate();

    const topRewards = this.getTopRewards();
    const recentTransactions = this.transactions
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 10);

    return {
      totalCustomers: this.customers.length,
      activeCustomers: activeCustomers.length,
      totalPointsIssued,
      totalPointsRedeemed,
      totalRewardsRedeemed,
      customerTierDistribution: tierDistribution,
      businessUnitDistribution,
      averagePointsPerCustomer,
      averageSpendingPerCustomer,
      customerRetentionRate,
      programEngagementRate,
      topRewards,
      recentTransactions
    };
  }

  private calculateRetentionRate(): number {
    // Simple retention calculation based on repeat visits
    const activeCustomers = this.customers.filter(c => c.isActive);
    const returningCustomers = activeCustomers.filter(c => c.visitCount > 1);
    return activeCustomers.length > 0 ? (returningCustomers.length / activeCustomers.length) * 100 : 0;
  }

  private calculateEngagementRate(): number {
    const activeCustomers = this.customers.filter(c => c.isActive);
    const engagedCustomers = activeCustomers.filter(c => 
      c.points > 0 || c.rewards.length > 0 || c.achievements.length > 0
    );
    return activeCustomers.length > 0 ? (engagedCustomers.length / activeCustomers.length) * 100 : 0;
  }

  private getTopRewards(): Array<{ rewardId: string; name: string; redemptions: number }> {
    const rewardRedemptions: Record<string, number> = {};
    
    this.transactions
      .filter(t => t.type === 'redeem')
      .forEach(t => {
        if (t.referenceId) {
          rewardRedemptions[t.referenceId] = (rewardRedemptions[t.referenceId] || 0) + 1;
        }
      });

    return Object.entries(rewardRedemptions)
      .map(([rewardId, redemptions]) => {
        const reward = this.rewards.find(r => r.id === rewardId);
        return {
          rewardId,
          name: reward?.name || 'Unknown',
          redemptions
        };
      })
      .sort((a, b) => b.redemptions - a.redemptions)
      .slice(0, 5);
  }

  // Reward Management
  public getRewards(filter?: {
    businessUnit?: keyof BusinessUnitType;
    category?: string;
    activeOnly?: boolean;
    customerPoints?: number; // Only show rewards customer can afford
  }): LoyaltyReward[] {
    let filteredRewards = this.rewards;

    if (filter?.businessUnit) {
      filteredRewards = filteredRewards.filter(reward => 
        reward.businessUnits.includes(filter.businessUnit!)
      );
    }
    if (filter?.category) {
      filteredRewards = filteredRewards.filter(reward => reward.category === filter.category);
    }
    if (filter?.activeOnly) {
      filteredRewards = filteredRewards.filter(reward => reward.isActive);
    }
    if (filter?.customerPoints !== undefined) {
      filteredRewards = filteredRewards.filter(reward => reward.requiredPoints <= filter.customerPoints!);
    }

    return filteredRewards.sort((a, b) => a.requiredPoints - b.requiredPoints);
  }

  public createReward(rewardData: Omit<LoyaltyReward, 'id' | 'currentUsage' | 'createdAt' | 'updatedAt'>): LoyaltyReward {
    const reward: LoyaltyReward = {
      ...rewardData,
      id: `reward_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      currentUsage: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.rewards.push(reward);
    return reward;
  }

  // Customer Visit Tracking
  public recordVisit(customerId: string, businessUnit: keyof BusinessUnitType, amount: number, orderId?: string): boolean {
    const customer = this.customers.find(c => c.id === customerId);
    if (!customer || !customer.isActive) return false;

    // Update visit stats
    customer.visitCount++;
    customer.totalSpent += amount;
    customer.lastVisitDate = new Date().toISOString().split('T')[0];
    customer.updatedAt = new Date().toISOString();

    // Award points (1 point per $1 spent by default)
    const basePoints = Math.floor(amount);
    this.awardPoints(customerId, basePoints, `Visit to ${businessUnit}`, 'earn', orderId, businessUnit);

    return true;
  }

  // Helper methods
  private getCustomerRewardRedemptions(customerId: string, rewardId: string): number {
    return this.transactions.filter(t => 
      t.customerId === customerId && 
      t.type === 'redeem' && 
      t.referenceId === rewardId
    ).length;
  }

  public getCustomerTransactions(customerId: string, limit?: number): LoyaltyTransaction[] {
    const transactions = this.transactions
      .filter(t => t.customerId === customerId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    
    return limit ? transactions.slice(0, limit) : transactions;
  }

  public getCustomers(filter?: {
    tier?: keyof LoyaltyTier;
    businessUnit?: keyof BusinessUnitType;
    activeOnly?: boolean;
  }): LoyaltyCustomer[] {
    let filteredCustomers = this.customers;

    if (filter?.tier) {
      filteredCustomers = filteredCustomers.filter(c => c.currentTier === filter.tier);
    }
    if (filter?.businessUnit) {
      filteredCustomers = filteredCustomers.filter(c => 
        c.preferredBusinessUnits.includes(filter.businessUnit!)
      );
    }
    if (filter?.activeOnly) {
      filteredCustomers = filteredCustomers.filter(c => c.isActive);
    }

    return filteredCustomers.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }

  public updateCustomerPreferences(customerId: string, preferences: Partial<LoyaltyCustomer['preferences']>): boolean {
    const customer = this.customers.find(c => c.id === customerId);
    if (!customer) return false;

    Object.assign(customer.preferences, preferences);
    customer.updatedAt = new Date().toISOString();
    return true;
  }
}

// Export singleton instance
export const unifiedLoyaltyManager = UnifiedLoyaltyManager.getInstance();

