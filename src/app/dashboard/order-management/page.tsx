import { Metadata } from 'next';
import OrderModification from '@/components/orders/OrderModification';
import { DashboardPageWrapper } from '@/components/layout/DashboardPageWrapper';

export const metadata: Metadata = {
  title: 'Order Management - DEORA Plaza',
  description: 'Modify and cancel existing orders',
};

export default function OrderManagementPage() {
  return (
    <DashboardPageWrapper
      title="Order Management"
      description="Modify and cancel existing orders"
    >
      <OrderModification />
    </DashboardPageWrapper>
  );
}