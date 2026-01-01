import { useState, useEffect } from 'react';

interface PaymentRecord {
  id: string;
  bookingId: string;
  customerMobile: string;
  eventType: string;
  amount: number;
  type: 'advance' | 'final' | 'partial' | 'refund';
  date: string;
  receiptNumber: string;
  bookingStartDate: string;
  bookingEndDate: string;
}

interface GardenStats {
  totalRevenue: number;
  advancePayments: number;
  finalPayments: number;
  totalBookings: number;
  totalGuests: number;
  paymentRecords: PaymentRecord[];
  period: string;
  totalExpectedRevenue: number;
  totalPendingRevenue: number;
}

export function useGardenStats(period: string = 'all') {
  const [stats, setStats] = useState<GardenStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchStats() {
      try {
        setLoading(true);
        setError(null);
        
        const response = await fetch(`/api/garden-stats?period=${period}`);
        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.error || 'Failed to fetch garden stats');
        }
        
        setStats(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
      } finally {
        setLoading(false);
      }
    }

    fetchStats();
  }, [period]);

  return { stats, loading, error };
}

