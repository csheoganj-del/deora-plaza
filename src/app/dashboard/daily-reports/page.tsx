import { Metadata } from 'next';
import DailyReports from '@/components/reports/DailyReports';
import { DashboardPageWrapper } from '@/components/layout/DashboardPageWrapper';

export const metadata: Metadata = {
  title: 'Daily Reports - DEORA Plaza',
  description: 'Automated daily business summary and insights',
};

export default function DailyReportsPage() {
  return (
    <DashboardPageWrapper
      title="Daily Reports"
      description="Automated daily business summary and insights"
    >
      <DailyReports />
    </DashboardPageWrapper>
  );
}