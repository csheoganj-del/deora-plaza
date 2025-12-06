"use client"
export const dynamic = "force-dynamic"

import { useState } from "react"
import { signIn } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, Lock, Eye, EyeOff } from "lucide-react"

export default function LoginPage() {
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState("")
    const [showPassword, setShowPassword] = useState(false)
    const [cardTransform, setCardTransform] = useState<string>("")
    const [formData, setFormData] = useState({
        username: "",
        password: ""
    })

    const [tiltStyle, setTiltStyle] = useState<{ transform: string }>({ transform: "perspective(800px) rotateX(0deg) rotateY(0deg)" })
    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        const rect = e.currentTarget.getBoundingClientRect()
        const x = e.clientX - rect.left
        const y = e.clientY - rect.top
        const centerX = rect.width / 2
        const centerY = rect.height / 2
        const rotateY = ((x - centerX) / centerX) * 6
        const rotateX = -((y - centerY) / centerY) * 6
        setTiltStyle({ transform: `perspective(800px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)` })
    }
    const resetTilt = () => setTiltStyle({ transform: "perspective(800px) rotateX(0deg) rotateY(0deg)" })

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError("")

        try {
            const result = await signIn("credentials", {
                username: formData.username,
                password: formData.password,
                redirect: false,
            })

            if (result?.error) {
                setError("Invalid username or password")
                setLoading(false)
                return
            }

            if (result?.ok) {
                // Get user session to determine redirect
                const response = await fetch('/api/auth/session')
                const session = await response.json()

                const role = session?.user?.role
                const businessUnit = session?.user?.businessUnit

                // Redirect based on role and business unit
                let redirectPath = '/dashboard'

                if (role === 'super_admin' || role === 'owner') {
                    redirectPath = '/dashboard'
                } else if (businessUnit === 'garden') {
                    redirectPath = '/dashboard/garden'
                } else if (businessUnit === 'cafe') {
                    redirectPath = '/dashboard/tables'
                } else if (businessUnit === 'bar') {
                    redirectPath = '/dashboard/bar'
                } else if (businessUnit === 'hotel') {
                    redirectPath = '/dashboard/hotel'
                }

                window.location.href = redirectPath
            }
        } catch (error) {
            setError("An error occurred. Please try again.")
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center futuristic-bg p-4">
            <div className="w-full max-w-md">
                <div className="text-center mb-8">
                    <div className="h-16 w-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center elevation-2 glow-ring animate-float-3d">
                        <span className="font-bold text-white text-3xl font-serif">D</span>
                    </div>
                    <h1 className="text-3xl font-bold text-slate-900 font-serif tracking-tight">Deora Plaza</h1>
                    <p className="text-slate-500 mt-2">Management System</p>
                </div>

                <Card
                    className="glass-3d tilt-3d rounded-2xl"
                    onMouseMove={(e) => {
                        const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
                        const x = e.clientX - rect.left
                        const y = e.clientY - rect.top
                        const centerX = rect.width / 2
                        const centerY = rect.height / 2
                        const rotateY = ((x - centerX) / centerX) * 6
                        const rotateX = -((y - centerY) / centerY) * 6
                        setCardTransform(`perspective(800px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`)
                    }}
                    onMouseLeave={() => setCardTransform("")}
                    style={{ transform: cardTransform }}
                >
                    <CardHeader className="space-y-1 text-center pb-6 border-b border-slate-100">
                        <CardTitle className="text-xl font-semibold text-slate-900">
                            Welcome Back
                        </CardTitle>
                        <CardDescription className="text-slate-500">
                            Sign in to access your dashboard
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-6">
                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div className="space-y-2">
                                <Label htmlFor="username" className="text-slate-700 font-medium">
                                    Username
                                </Label>
                                <Input
                                    id="username"
                                    type="text"
                                    placeholder="Enter your username"
                                    value={formData.username}
                                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                                    required
                                    className="border-slate-200 focus:ring-amber-500 focus:border-amber-500"
                                />
                            </div>
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <Label htmlFor="password" className="text-slate-700 font-medium">
                                        Password
                                    </Label>
                                </div>
                                <div className="relative">
                                    <Input
                                        id="password"
                                        type={showPassword ? "text" : "password"}
                                        placeholder="••••••••"
                                        value={formData.password}
                                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                        required
                                        className="border-slate-200 focus:ring-amber-500 focus:border-amber-500 pr-10"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700"
                                    >
                                        {showPassword ? (
                                            <EyeOff className="h-4 w-4" />
                                        ) : (
                                            <Eye className="h-4 w-4" />
                                        )}
                                    </button>
                                </div>
                            </div>

                            {error && (
                                <div className="p-3 rounded-md bg-rose-50 border border-rose-200 text-sm text-rose-600 flex items-center justify-center">
                                    {error}
                                </div>
                            )}

                            <Button
                                type="submit"
                                className="w-full bg-slate-900 hover:bg-slate-800 text-white font-medium h-11 interactive-scale-md"
                                disabled={loading}
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Signing in...
                                    </>
                                ) : (
                                    <>
                                        <Lock className="mr-2 h-4 w-4" />
                                        Sign In
                                    </>
                                )}
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                <p className="text-center text-xs text-slate-400 mt-8">
                    &copy; {new Date().getFullYear()} Deora Plaza. All rights reserved.
                </p>
            </div>
        </div>
    )
}
