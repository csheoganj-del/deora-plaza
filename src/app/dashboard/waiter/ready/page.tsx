import { Metadata } from 'next';
import WaiterDashboard from '@/components/waiter/WaiterDashboard';

export const metadata: Metadata = {
    title: 'Ready Orders - DEORA Plaza',
};

export default function ReadyOrdersPage() {
    return <WaiterDashboard initialTab="ready" soloMode={true} />;
}
