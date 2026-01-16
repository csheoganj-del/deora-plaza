import { Metadata } from 'next';
import WaiterDashboard from '@/components/waiter/WaiterDashboard';
import { DashboardPageWrapper } from '@/components/layout/DashboardPageWrapper';

export const metadata: Metadata = {
  title: 'Waiter Dashboard - DEORA Plaza',
  description: 'Manage service, deliveries, and order amendments',
};

export default function WaiterPage() {
  return (
    <div className="pb-20">
      <WaiterDashboard />
    </div>
  );
}