import { AlertCircle } from "lucide-react"

type FormErrorProps = {
    message?: string
}

export default function FormError({ message }: FormErrorProps) {
    if (!message) return null
    return (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
            <AlertCircle className="h-4 w-4 text-red-600 flex-shrink-0" />
            <span className="text-sm text-red-600">{message}</span>
        </div>
    )
}
