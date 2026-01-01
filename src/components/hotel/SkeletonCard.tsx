


export function SkeletonCard() {
    return (
        <div className="premium-card">
            <div className="p-8 border-b border-[#E5E7EB] pb-3">
                <div className="flex items-start justify-between">
                    <div className="flex-1">
                        <div className="h-4 w-16 bg-[#E5E7EB] rounded mb-2" />
                        <div className="h-8 w-24 bg-[#E5E7EB] rounded" />
                    </div>
                    <div className="h-6 w-20 bg-[#E5E7EB] rounded-full" />
                </div>
            </div>
            <div className="p-8 space-y-4">
                <div className="h-8 w-full bg-[#E5E7EB] rounded" />
                <div className="flex justify-between items-center">
                    <div className="h-6 w-20 bg-[#E5E7EB] rounded" />
                    <div className="h-8 w-24 bg-[#E5E7EB] rounded" />
                </div>
            </div>
        </div>
    )
}

export function SkeletonStats() {
    return (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
            {[...Array(4)].map((_, i) => (
                <div className="premium-card">
                    <div className="p-8 p-6">
                        <div className="h-4 w-24 bg-[#E5E7EB] rounded mb-2" />
                        <div className="h-8 w-32 bg-[#E5E7EB] rounded mb-1" />
                        <div className="h-3 w-40 bg-[#E5E7EB] rounded" />
                    </div>
                </div>
            ))}
        </div>
    )
}

export function SkeletonGrid() {
    return (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {[...Array(8)].map((_, i) => (
                <SkeletonCard key={i} />
            ))}
        </div>
    )
}

