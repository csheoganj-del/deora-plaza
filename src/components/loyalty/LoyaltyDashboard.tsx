"use client";

import { useState, useEffect } from "react";
;
import { unifiedLoyaltyManager, LoyaltyCustomer, LoyaltyReward, LoyaltyTransaction } from "@/lib/unified-loyalty";
import { BusinessUnitType } from "@/lib/business-units";


export function LoyaltyDashboard() {
  const [loading, setLoading] = useState(true);
  const [selectedBusinessUnit, setSelectedBusinessUnit] = useState<BusinessUnitType | 'all'>('all');
  const [stats, setStats] = useState({
    totalCustomers: 0,
    activeCustomers: 0,
    totalPointsIssued: 0,
    totalPointsRedeemed: 0,
    totalRewardsRedeemed: 0,
    averagePointsPerCustomer: 0,
    averageSpendingPerCustomer: 0,
    customerRetentionRate: 0,
    programEngagementRate: 0
  });
  const [tierDistribution, setTierDistribution] = useState<Record<string, number>>({});
  const [topRewards, setTopRewards] = useState<Array<{ rewardId: string; name: string; redemptions: number }>>([]);
  const [recentTransactions, setRecentTransactions] = useState<LoyaltyTransaction[]>([]);
  const [availableRewards, setAvailableRewards] = useState<LoyaltyReward[]>([]);
  const [activePromotions, setActivePromotions] = useState<any[]>([]);

  useEffect(() => {
    loadDashboardData();
  }, [selectedBusinessUnit]);

  const loadDashboardData = () => {
    setLoading(true);
    
    // Get loyalty stats
    const loyaltyStats = unifiedLoyaltyManager.getLoyaltyStats();
    setStats({
      totalCustomers: loyaltyStats.totalCustomers,
      activeCustomers: loyaltyStats.activeCustomers,
      totalPointsIssued: loyaltyStats.totalPointsIssued,
      totalPointsRedeemed: loyaltyStats.totalPointsRedeemed,
      totalRewardsRedeemed: loyaltyStats.totalRewardsRedeemed,
      averagePointsPerCustomer: loyaltyStats.averagePointsPerCustomer,
      averageSpendingPerCustomer: loyaltyStats.averageSpendingPerCustomer,
      customerRetentionRate: loyaltyStats.customerRetentionRate,
      programEngagementRate: loyaltyStats.programEngagementRate
    });
    
    setTierDistribution(loyaltyStats.customerTierDistribution);
    setTopRewards(loyaltyStats.topRewards);
    setRecentTransactions(loyaltyStats.recentTransactions);
    
    // Get available rewards
    const rewards = unifiedLoyaltyManager.getRewards({ 
      businessUnit: selectedBusinessUnit === 'all' ? undefined : (selectedBusinessUnit as string).toUpperCase() as any,
      activeOnly: true 
    });
    setAvailableRewards(rewards.slice(0, 6));
    
    setLoading(false);
  };

  const getTierLabel = (tier: string) => {
    return tier.charAt(0) + tier.slice(1).toLowerCase();
  };

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'BRONZE': return 'bg-[#F59E0B]/10 text-[#F59E0B]800';
      case 'SILVER': return 'bg-[#F1F5F9] text-[#111827]';
      case 'GOLD': return 'bg-[#F59E0B]/10 text-[#F59E0B]800';
      case 'PLATINUM': return 'bg-[#EDEBFF] text-purple-800';
      case 'DIAMOND': return 'bg-[#EDEBFF]/30 text-[#6D5DFB]';
      default: return 'bg-[#F1F5F9] text-[#111827]';
    }
  };

  const getTransactionTypeColor = (type: string) => {
    switch (type) {
      case 'earn': return 'text-[#22C55E] bg-[#BBF7D0]';
      case 'redeem': return 'text-[#EF4444] bg-[#FEE2E2]';
      case 'bonus': return 'text-[#6D5DFB] bg-[#EDEBFF]/30';
      default: return 'text-[#6B7280] bg-[#F1F5F9]';
    }
  };

  const getRewardTypeLabel = (type: string) => {
    return type.replace('_', ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#6D5DFB] mx-auto mb-4"></div>
        <p className="text-center text-[#6B7280]">Loading loyalty data...</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-[#111827]">Customer Loyalty Program</h1>
          <p className="text-[#6B7280]">Unified loyalty management across all business units</p>
        </div>
        
        <select
          value={selectedBusinessUnit}
          onChange={(e) => setSelectedBusinessUnit(e.target.value as BusinessUnitType | 'all')}
          className="px-4 py-2 border border-[#9CA3AF] rounded-md focus:outline-none focus:ring-2 focus:ring-[#6D5DFB]"
        >
          <option value="all">All Business Units</option>
          <option value={BusinessUnitType.CAFE}>Cafe</option>
          <option value={BusinessUnitType.RESTAURANT}>Restaurant</option>
          <option value={BusinessUnitType.BAR}>Bar</option>
          <option value={BusinessUnitType.HOTEL}>Hotel</option>
          <option value={BusinessUnitType.MARRIAGE_GARDEN}>Marriage Garden</option>
        </select>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="premium-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-[#6B7280]">Total Members</p>
              <p className="text-2xl font-bold text-[#111827]">{stats.totalCustomers}</p>
              <p className="text-xs text-[#9CA3AF]">{stats.activeCustomers} active</p>
            </div>
            <div className="p-3 bg-[#EDEBFF] rounded-lg">
              <svg className="w-6 h-6 text-[#C084FC]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="premium-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-[#6B7280]">Points Issued</p>
              <p className="text-2xl font-bold text-[#22C55E]">{stats.totalPointsIssued.toLocaleString()}</p>
              <p className="text-xs text-[#9CA3AF]">{stats.totalPointsRedeemed.toLocaleString()} redeemed</p>
            </div>
            <div className="p-3 bg-[#BBF7D0] rounded-lg">
              <svg className="w-6 h-6 text-[#22C55E]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
            </div>
          </div>
        </div>

        <div className="premium-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-[#6B7280]">Rewards Redeemed</p>
              <p className="text-2xl font-bold text-[#6D5DFB]">{stats.totalRewardsRedeemed}</p>
              <p className="text-xs text-[#9CA3AF]">Total redemptions</p>
            </div>
            <div className="p-3 bg-[#EDEBFF]/30 rounded-lg">
              <svg className="w-6 h-6 text-[#6D5DFB]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
              </svg>
            </div>
          </div>
        </div>

        <div className="premium-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-[#6B7280]">Retention Rate</p>
              <p className="text-2xl font-bold text-[#C084FC]">{stats.customerRetentionRate.toFixed(1)}%</p>
              <p className="text-xs text-[#9CA3AF]">{stats.programEngagementRate.toFixed(1)}% engaged</p>
            </div>
            <div className="p-3 bg-[#EDEBFF] rounded-lg">
              <svg className="w-6 h-6 text-[#C084FC]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Tier Distribution */}
        <div className="premium-card">
          <div className="p-4 border-b">
            <h3 className="text-lg font-semibold text-[#111827]">Customer Tiers</h3>
            <p className="text-sm text-[#6B7280]">Distribution across loyalty tiers</p>
          </div>
          <div className="p-4">
            <div className="space-y-3">
              {Object.entries(tierDistribution).map(([tier, count]: [string, number]) => (
                <div key={tier} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <span className={`text-xs px-2 py-1 rounded-full ${getTierColor(tier)}`}>
                      {getTierLabel(tier)}
                    </span>
                    <span className="text-sm text-[#111827]">{count} customers</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-32 bg-[#E5E7EB] rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full ${
                          tier === 'BRONZE' ? 'bg-[#F59E0B]/100' :
                          tier === 'SILVER' ? 'bg-[#F8FAFC]' :
                          tier === 'GOLD' ? 'bg-[#F59E0B]/100' :
                          tier === 'PLATINUM' ? 'bg-[#EDEBFF]0' :
                          'bg-[#6D5DFB]'
                        }`}
                        style={{ width: `${stats.activeCustomers > 0 ? (count / stats.activeCustomers) * 100 : 0}%` }}
                      ></div>
                    </div>
                    <span className="text-xs text-[#9CA3AF]">
                      {stats.activeCustomers > 0 ? ((count / stats.activeCustomers) * 100).toFixed(1) : 0}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Top Rewards */}
        <div className="premium-card">
          <div className="p-4 border-b">
            <h3 className="text-lg font-semibold text-[#111827]">Popular Rewards</h3>
            <p className="text-sm text-[#6B7280]">Most redeemed rewards</p>
          </div>
          <div className="p-4">
            <div className="space-y-3">
              {topRewards.length === 0 ? (
                <div className="text-center text-[#9CA3AF] py-4">
                  No rewards redeemed yet
                </div>
              ) : (
                topRewards.map((reward, index) => (
                  <div key={reward.rewardId} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-[#EDEBFF]/30 rounded-full flex items-center justify-center">
                        <span className="text-xs font-medium text-[#6D5DFB]">#{index + 1}</span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-[#111827]">{reward.name}</p>
                        <p className="text-xs text-[#9CA3AF]">{reward.redemptions} redemptions</p>
                      </div>
                    </div>
                    <div className="text-sm text-[#9CA3AF]">
                      {reward.redemptions}x
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Available Rewards */}
      <div className="premium-card">
        <div className="p-4 border-b">
          <h3 className="text-lg font-semibold text-[#111827]">Available Rewards</h3>
          <p className="text-sm text-[#6B7280]">Rewards customers can redeem</p>
        </div>
        <div className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {availableRewards.length === 0 ? (
              <div className="col-span-full text-center text-[#9CA3AF] py-4">
                No rewards available for this business unit
              </div>
            ) : (
              availableRewards.map((reward) => (
                <div key={reward.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-medium text-[#111827]">{reward.name}</h4>
                    <span className="text-xs px-2 py-1 bg-[#EDEBFF]/30 text-[#6D5DFB] rounded-full">
                      {reward.requiredPoints} pts
                    </span>
                  </div>
                  <p className="text-sm text-[#6B7280] mb-3">{reward.description}</p>
                  <div className="flex justify-between items-center text-xs text-[#9CA3AF]">
                    <span>{getRewardTypeLabel(reward.type)}</span>
                    {reward.usageLimit && (
                      <span>{reward.usageLimit - (reward.currentUsage % (reward.usageLimit || 1))} left</span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="premium-card">
        <div className="p-4 border-b">
          <h3 className="text-lg font-semibold text-[#111827]">Recent Activity</h3>
          <p className="text-sm text-[#6B7280]">Latest loyalty transactions</p>
        </div>
        <div className="overflow-x-auto">
          {recentTransactions.length === 0 ? (
            <div className="p-6 text-center text-[#9CA3AF]">
              No recent activity
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-[#F8FAFC]">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-[#9CA3AF] uppercase">Date</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-[#9CA3AF] uppercase">Customer</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-[#9CA3AF] uppercase">Business Unit</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-[#9CA3AF] uppercase">Type</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-[#9CA3AF] uppercase">Points</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-[#9CA3AF] uppercase">Description</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {recentTransactions.map((transaction) => {
                  const customer = unifiedLoyaltyManager.getLoyaltyCustomer(transaction.customerId);
                  return (
                    <tr key={transaction.id}>
                      <td className="px-4 py-3">
                        <span className="text-sm text-[#111827]">
                          {new Date(transaction.createdAt).toLocaleDateString()}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm text-[#111827]">
                          {customer?.loyaltyNumber || 'Unknown'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm text-[#111827]">
                          {transaction.businessUnit.replace('_', ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-1 rounded-full ${getTransactionTypeColor(transaction.type)}`}>
                          {transaction.type}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-sm font-medium ${
                          transaction.points > 0 ? 'text-[#22C55E]' : 'text-[#EF4444]'
                        }`}>
                          {transaction.points > 0 ? '+' : ''}{transaction.points}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm text-[#111827]">{transaction.description}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

