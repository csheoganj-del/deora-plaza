import { LoadingLogo } from "@/components/ui/LoadingLogo"

export default function Loading() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-[var(--bg-main)]">
            <LoadingLogo message="Preparing your experience..." />
        </div>
    )
}

