


type HotelStatsCardProps = {
    label: string
    value: string | number
    subtext?: string
    variant?: "default" | "highlight" | "warning"
}

export default function HotelStatsCard({ label, value, subtext, variant = "default" }: HotelStatsCardProps) {
    const variantClasses = {
        default: "text-white",
        highlight: "text-purple-400",
        warning: "text-rose-400"
    }

    return (
        <div className="premium-card">
            <div className="p-8 p-6">
                <p className="text-sm font-medium text-white/50">{label}</p>
                <p className={`text-3xl font-bold mt-2 ${variantClasses[variant]}`}>
                    {value}
                </p>
                {subtext && <p className="text-xs text-white/50 mt-1">{subtext}</p>}
            </div>
        </div>
    )
}

