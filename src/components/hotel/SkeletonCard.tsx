import { Card, CardContent, CardHeader } from "@/components/ui/card"

export function SkeletonCard() {
    return (
        <Card className="border-slate-100 bg-white shadow-sm animate-pulse">
            <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                    <div className="flex-1">
                        <div className="h-4 w-16 bg-slate-200 rounded mb-2" />
                        <div className="h-8 w-24 bg-slate-200 rounded" />
                    </div>
                    <div className="h-6 w-20 bg-slate-200 rounded-full" />
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="h-8 w-full bg-slate-200 rounded" />
                <div className="flex justify-between items-center">
                    <div className="h-6 w-20 bg-slate-200 rounded" />
                    <div className="h-8 w-24 bg-slate-200 rounded" />
                </div>
            </CardContent>
        </Card>
    )
}

export function SkeletonStats() {
    return (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
            {[...Array(4)].map((_, i) => (
                <Card key={i} className="border-slate-200 shadow-sm animate-pulse">
                    <CardContent className="p-6">
                        <div className="h-4 w-24 bg-slate-200 rounded mb-2" />
                        <div className="h-8 w-32 bg-slate-200 rounded mb-1" />
                        <div className="h-3 w-40 bg-slate-200 rounded" />
                    </CardContent>
                </Card>
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
