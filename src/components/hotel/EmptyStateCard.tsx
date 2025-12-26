

import { LucideIcon } from "lucide-react"

type EmptyStateCardProps = {
    icon: LucideIcon
    title: string
    description: string
    action?: { label: string; onClick: () => void }
}

export default function EmptyStateCard({ icon: Icon, title, description, action }: EmptyStateCardProps) {
    return (
        <div className="premium-card">
            <div className="p-8 p-12 text-center">
                <div className="flex justify-center mb-4">
                    <Icon className="h-12 w-12 text-[#9CA3AF]" />
                </div>
                <h3 className="text-lg font-semibold text-[#111827] mb-2">{title}</h3>
                <p className="text-sm text-[#9CA3AF] mb-4">{description}</p>
                {action && (
                    <button
                        onClick={action.onClick}
                        className="text-sm font-medium text-[#6D5DFB] hover:text-[#6D5DFB]/90"
                    >
                        {action.label}
                    </button>
                )}
            </div>
        </div>
    )
}

