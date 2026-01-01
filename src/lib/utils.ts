import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function playBeep(frequency = 880, duration = 120) {
  if (typeof window === "undefined") return
  const Ctx: any = (window as any).AudioContext || (window as any).webkitAudioContext
  const ctx = new Ctx()
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.type = "sine"
  osc.frequency.value = frequency
  osc.connect(gain)
  gain.connect(ctx.destination)
  gain.gain.setValueAtTime(0.1, ctx.currentTime)
  osc.start()
  setTimeout(() => { osc.stop(); ctx.close() }, duration)
}

export function showToast(message: string, type: "success" | "error" | "info" = "info") {
  if (typeof document === "undefined") return
  const containerId = "toast-container-global"
  let container = document.getElementById(containerId)
  if (!container) {
    container = document.createElement("div")
    container.id = containerId
    container.className = "fixed top-4 right-4 z-[1000] space-y-2"
    document.body.appendChild(container)
  }
  const toast = document.createElement("div")
  const base = "rounded-lg shadow-lg px-4 py-2 text-sm"
  const color = type === "success" ? "bg-green-600 text-white" : type === "error" ? "bg-red-600 text-white" : "bg-slate-800 text-white"
  toast.className = `${base} ${color}`
  toast.textContent = message
  container.appendChild(toast)
  setTimeout(() => toast.remove(), 2500)
}

export function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  })
}

