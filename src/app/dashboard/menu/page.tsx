import { getMenuItems } from "@/actions/menu"
import MenuManagement from "@/components/menu/MenuManagement"
import { DashboardPageWrapper } from '@/components/layout/DashboardPageWrapper';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Menu Management - DEORA Plaza',
  description: 'Manage menu items across all business units',
};

export const dynamic = "force-dynamic"

export default async function MenuPage() {
    const items = await getMenuItems()

    return (
        <DashboardPageWrapper
            title="Menu Management"
            description="Manage items for all business units"
        >
            <MenuManagement initialItems={items} />
        </DashboardPageWrapper>
    )
}

