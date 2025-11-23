"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { signIn } from "@/lib/firebase/auth"
import { setAuthCookie } from "@/lib/firebase/auth-server"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2 } from "lucide-react"

export default function LoginPage() {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState("")
    const [formData, setFormData] = useState({
        email: "",
        password: ""
    })

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError("")

        try {
            // Sign in with Firebase
            const result = await signIn(formData.email, formData.password)

            if (!result.success) {
                setError(result.error || "Failed to sign in")
                setLoading(false)
                return
            }

            // Get ID token
            const token = await result.user?.getIdToken()

            if (!token) {
                setError("Failed to get authentication token")
                setLoading(false)
                return
            }

            // Set auth cookie
            await setAuthCookie(token)

            // Redirect to dashboard
            router.push("/dashboard")
            router.refresh()
        } catch (err: any) {
            setError(err.message || "An error occurred")
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-black via-gray-900 to-black p-4">
            {/* Animated background */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute -inset-[10px] opacity-50">
                    <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-amber-500/20 rounded-full blur-3xl animate-pulse"></div>
                    <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-orange-500/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
                </div>
            </div>

            <Card className="w-full max-w-md relative z-10 bg-white/5 backdrop-blur-xl border-white/10 shadow-2xl">
                <CardHeader className="space-y-1 text-center">
                    <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/20">
                        <span className="text-3xl font-bold text-black">D</span>
                    </div>
                    <CardTitle className="text-3xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
                        DEORA PLAZA
                    </CardTitle>
                    <CardDescription className="text-gray-400">
                        Management System
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="email" className="text-gray-300">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="your@email.com"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                required
                                className="bg-black/40 border-white/10 text-white placeholder:text-gray-500 focus:border-amber-500"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="password" className="text-gray-300">Password</Label>
                            <Input
                                id="password"
                                type="password"
                                placeholder="••••••••"
                                value={formData.password}
                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                required
                                className="bg-black/40 border-white/10 text-white placeholder:text-gray-500 focus:border-amber-500"
                            />
                        </div>

                        {error && (
                            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                                {error}
                            </div>
                        )}

                        <Button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-black font-bold shadow-lg shadow-amber-900/20"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Signing in...
                                </>
                            ) : (
                                "Sign In"
                            )}
                        </Button>
                    </form>

                    <div className="mt-6 text-center text-sm text-gray-500">
                        <p>Powered by Firebase 🔥</p>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
