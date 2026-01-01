import { Metadata } from 'next';
import WaiterInterface from '@/components/orders/WaiterInterface';
import { DashboardPageWrapper } from '@/components/layout/DashboardPageWrapper';

export const metadata: Metadata = {
  title: 'Waiter Interface - DEORA Plaza',
  description: 'Take orders and manage tables efficiently',
};

export default function WaiterPage() {
  return (
    <DashboardPageWrapper
      title="Waiter Interface"
      description="Take orders and manage tables efficiently"
    >
      <WaiterInterface />
    </DashboardPageWrapper>
  );
}