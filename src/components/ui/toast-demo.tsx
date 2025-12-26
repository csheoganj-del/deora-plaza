"use client"

import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/notification-toast"

export function ToastDemo() {
  const { addToast } = useToast()

  const showSuccessToast = () => {
    addToast({
      title: "Success!",
      description: "Your action was completed successfully.",
      type: "success",
      duration: 3000,
    })
  }

  const showErrorToast = () => {
    addToast({
      title: "Error occurred",
      description: "Something went wrong. Please try again.",
      type: "error",
      duration: 5000,
    })
  }

  const showWarningToast = () => {
    addToast({
      title: "Warning",
      description: "Please review your input before proceeding.",
      type: "warning",
      duration: 4000,
    })
  }

  const showInfoToast = () => {
    addToast({
      title: "Information",
      description: "Here's some helpful information for you.",
      type: "info",
      duration: 3000,
      action: {
        label: "Learn More",
        onClick: () => console.log("Learn more clicked!")
      }
    })
  }

  return (
    <div className="flex flex-wrap gap-2">
      <Button onClick={showSuccessToast} variant="default">
        Success Toast
      </Button>
      <Button onClick={showErrorToast} variant="destructive">
        Error Toast
      </Button>
      <Button onClick={showWarningToast} variant="outline">
        Warning Toast
      </Button>
      <Button onClick={showInfoToast} variant="secondary">
        Info Toast
      </Button>
    </div>
  )
}

