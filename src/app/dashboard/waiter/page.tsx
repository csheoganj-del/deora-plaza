import { Metadata } from 'next';
import WaiterPageClient from './WaiterPageClient';

export const metadata: Metadata = {
  title: 'Waiter Dashboard - DEORA Plaza',
  description: 'Manage service, deliveries, and order amendments',
};

export default function WaiterPage() {
  return <WaiterPageClient />;
}