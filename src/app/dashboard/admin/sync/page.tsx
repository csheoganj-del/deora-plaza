import { Metadata } from 'next';
import { SyncDashboard } from '@/components/admin/sync-dashboard';

export const metadata: Metadata = {
  title: 'Database Sync - DEORA Plaza',
  description: 'Monitor and manage database synchronization between Supabase and Firebase',
};

export default function SyncPage() {
  return (
    <div className="container mx-auto py-6">
      <SyncDashboard />
    </div>
  );
}