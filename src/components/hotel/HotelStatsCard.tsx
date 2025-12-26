


type HotelStatsCardProps = {
    label: string
    value: string | number
    subtext?: string
    variant?: "default" | "highlight" | "warning"
}

export default function HotelStatsCard({ label, value, subtext, variant = "default" }: HotelStatsCardProps) {
    const variantClasses = {
        default: "text-[#111827]",
        highlight: "text-[#6D5DFB]",
        warning: "text-[#EF4444]"
    }

    return (
        <div className="premium-card">
            <div className="p-8 p-6">
                <p className="text-sm font-medium text-[#9CA3AF]">{label}</p>
                <p className={`text-3xl font-bold mt-2 ${variantClasses[variant]}`}>
                    {value}
                </p>
                {subtext && <p className="text-xs text-[#9CA3AF] mt-1">{subtext}</p>}
            </div>
        </div>
    )
}

