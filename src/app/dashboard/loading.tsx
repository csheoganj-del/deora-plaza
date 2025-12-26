import { LoadingLogo } from "@/components/ui/LoadingLogo"

export default function Loading() {
    return (
        <div className="w-full h-full flex items-center justify-center min-h-[500px] bg-[var(--bg-main)]">
            <LoadingLogo message="Loading Dashboard..." />
        </div>
    )
}

