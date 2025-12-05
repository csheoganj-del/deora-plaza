import { Card, CardContent } from "@/components/ui/card"
import { LucideIcon } from "lucide-react"

type EmptyStateCardProps = {
    icon: LucideIcon
    title: string
    description: string
    action?: { label: string; onClick: () => void }
}

export default function EmptyStateCard({ icon: Icon, title, description, action }: EmptyStateCardProps) {
    return (
        <Card className="border-slate-200 shadow-sm">
            <CardContent className="p-12 text-center">
                <div className="flex justify-center mb-4">
                    <Icon className="h-12 w-12 text-slate-300" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">{title}</h3>
                <p className="text-sm text-slate-500 mb-4">{description}</p>
                {action && (
                    <button
                        onClick={action.onClick}
                        className="text-sm font-medium text-blue-600 hover:text-blue-700"
                    >
                        {action.label}
                    </button>
                )}
            </CardContent>
        </Card>
    )
}
