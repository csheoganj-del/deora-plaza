import { Metadata } from 'next';
import WaiterMobile from '@/components/waiter/WaiterMobile';

export const metadata: Metadata = {
    title: 'Waiter - DEORA Plaza',
};

export default function WaiterMobilePage() {
    return <WaiterMobile />;
}
