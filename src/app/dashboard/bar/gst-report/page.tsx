import { requireAuth } from "@/lib/auth-helpers"
import GSTReportComponent from "@/components/gst/GSTReportComponent"

export const dynamic = "force-dynamic"

export default async function BarGSTReportPage() {
    const session = await requireAuth()
    
    // Check if user has permission to access bar GST report
    const userRole = session.user.role
    const userBusinessUnit = session.user.businessUnit
    
    const allowedRoles = ['super_admin', 'owner', 'bar_manager']
    const isAuthorized = allowedRoles.includes(userRole) || 
                         (userRole === 'bartender' && userBusinessUnit === 'bar')
    
    if (!isAuthorized) {
        return (
            <div className="flex-1 flex items-center justify-center p-8 pt-6">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-[#EF4444]">Access Denied</h2>
                    <p className="text-[#6B7280] mt-2">You don't have permission to view this GST report.</p>
                </div>
            </div>
        )
    }
    
    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
            <GSTReportComponent businessUnit="bar" unitName="Bar" />
        </div>
    )
}

