
import { Metadata } from 'next';
import SalesAnalytics from '@/components/analytics/SalesAnalytics';

export const metadata: Metadata = {
  title: 'Analytics - DEORA Plaza',
  description: 'Sales analytics and business intelligence dashboard',
};

export default function AnalyticsPage() {
  return <SalesAnalytics />;
}