import { Metadata } from 'next';
import StaffPerformance from '@/components/staff/StaffPerformance';
import { DashboardPageWrapper } from '@/components/layout/DashboardPageWrapper';

export const metadata: Metadata = {
  title: 'Staff Performance - DEORA Plaza',
  description: 'Track team productivity and achievements',
};

export default function StaffPerformancePage() {
  return (
    <DashboardPageWrapper
      title="Staff Performance"
      description="Track team productivity and achievements"
    >
      <StaffPerformance />
    </DashboardPageWrapper>
  );
}