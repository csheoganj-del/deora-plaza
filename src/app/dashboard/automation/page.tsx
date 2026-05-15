import { Metadata } from 'next';
import AutoInventoryManager from '@/components/automation/AutoInventoryManager';
import { DashboardPageWrapper } from '@/components/layout/DashboardPageWrapper';

export const metadata: Metadata = {
  title: 'Automation Center - DEORA Plaza',
  description: 'Intelligent automation for inventory and operations',
};

export default function AutomationPage() {
  return (
    <DashboardPageWrapper
      title="Automation Center"
      description="Intelligent automation for inventory and operations"
    >
      <AutoInventoryManager />
    </DashboardPageWrapper>
  );
}