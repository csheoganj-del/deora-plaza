import { Metadata } from 'next';
import KitchenDisplay from '@/components/kitchen/KitchenDisplay';
import { DashboardPageWrapper } from '@/components/layout/DashboardPageWrapper';

export const metadata: Metadata = {
  title: 'Kitchen Display System - DEORA Plaza',
  description: 'Real-time kitchen display with order timers and status management',
};

export default function KitchenDisplayPage() {
  return (
    <DashboardPageWrapper
      title="Kitchen Display System"
      description="Real-time kitchen display with order timers and status management"
    >
      <KitchenDisplay />
    </DashboardPageWrapper>
  );
}