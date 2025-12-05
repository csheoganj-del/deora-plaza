import { Card, CardContent } from "@/components/ui/card"

type HotelStatsCardProps = {
    label: string
    value: string | number
    subtext?: string
    variant?: "default" | "highlight" | "warning"
}

export default function HotelStatsCard({ label, value, subtext, variant = "default" }: HotelStatsCardProps) {
    const variantClasses = {
        default: "text-slate-900",
        highlight: "text-blue-600",
        warning: "text-rose-600"
    }

    return (
        <Card className="border-slate-200 shadow-sm">
            <CardContent className="p-6">
                <p className="text-sm font-medium text-slate-500">{label}</p>
                <p className={`text-3xl font-bold mt-2 ${variantClasses[variant]}`}>
                    {value}
                </p>
                {subtext && <p className="text-xs text-slate-400 mt-1">{subtext}</p>}
            </CardContent>
        </Card>
    )
}
