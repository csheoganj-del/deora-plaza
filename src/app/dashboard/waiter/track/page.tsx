import { Metadata } from 'next';
import WaiterDashboard from '@/components/waiter/WaiterDashboard';

export const metadata: Metadata = {
    title: 'Order Pipeline - DEORA Plaza',
};

export default function TrackOrdersPage() {
    return <WaiterDashboard initialTab="track" soloMode={true} />;
}
