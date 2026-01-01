import { Metadata } from 'next';
import SalesAnalytics from '@/components/analytics/SalesAnalytics';
import { DashboardPageWrapper } from '@/components/layout/DashboardPageWrapper';

export const metadata: Metadata = {
  title: 'Analytics - DEORA Plaza',
  description: 'Sales analytics and business intelligence dashboard',
};

export default function AnalyticsPage() {
  return (
    <DashboardPageWrapper
      title="Analytics Dashboard"
      description="Track sales performance, customer trends, and business insights"
    >
      <SalesAnalytics />
    </DashboardPageWrapper>
  );
}