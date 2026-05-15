import { Metadata } from 'next';
import AdminSettings from '@/components/admin/AdminSettings';

export const metadata: Metadata = {
  title: 'Admin Settings | DEORA Plaza',
  description: 'System administration and configuration settings',
};

export default function AdminSettingsPage() {
  return (
    <div className="container mx-auto py-6">
      <AdminSettings />
    </div>
  );
}