import { Metadata } from 'next';
import TabManagement from '@/components/admin/TabManagement';

export const metadata: Metadata = {
  title: 'Tab Management | DEORA Plaza',
  description: 'Manage which tabs and features are visible to users',
};

export default function TabManagementPage() {
  return (
    <div className="container mx-auto py-6">
      <TabManagement />
    </div>
  );
}