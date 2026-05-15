import { Metadata } from 'next';
import InventoryManager from '@/components/inventory/InventoryManager';
import { DashboardPageWrapper } from '@/components/layout/DashboardPageWrapper';

export const metadata: Metadata = {
  title: 'Inventory Management - DEORA Plaza',
  description: 'Manage stock levels and inventory across all business units',
};

export default function InventoryPage() {
  return (
    <div className="pb-20">
      <InventoryManager />
    </div>
  );
}