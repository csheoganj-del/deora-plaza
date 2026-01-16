import { Metadata } from 'next';
import WaiterDashboard from '@/components/waiter/WaiterDashboard';

export const metadata: Metadata = {
    title: 'New Order - DEORA Plaza',
};

export default function NewOrderPage() {
    return <WaiterDashboard initialTab="new-order" soloMode={true} />;
}
