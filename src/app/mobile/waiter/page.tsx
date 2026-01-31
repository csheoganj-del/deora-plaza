"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import WaiterMobile from "@/components/waiter/WaiterMobile";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

export default function MobileWaiterApp() {
    const router = useRouter();
    const supabase = createClient();
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");

    useEffect(() => {
        checkAuth();
    }, []);

    const checkAuth = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
            setIsAuthenticated(true);
        }
        setIsLoading(false);
    };

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setIsLoading(true);

        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email: username,
                password: password,
            });

            if (error) throw error;

            if (data.session) {
                setIsAuthenticated(true);
            }
        } catch (err: any) {
            setError(err.message || "Login failed");
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading) {
        return (
            <div className="h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800">
                <Loader2 className="w-8 h-8 text-white animate-spin" />
            </div>
        );
    }

    if (!isAuthenticated) {
        return (
            <div className="h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800 p-6">
                <div className="w-full max-w-md">
                    <div className="text-center mb-8">
                        <h1 className="text-3xl font-bold text-white mb-2">DEORA PLAZA</h1>
                        <p className="text-white/60">Waiter Access</p>
                    </div>

                    <form onSubmit={handleLogin} className="space-y-4">
                        <div>
                            <label className="text-white/80 text-sm mb-2 block">Username</label>
                            <Input
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                placeholder="waiter_rahul"
                                className="bg-white/10 border-white/20 text-white placeholder:text-white/40 h-12"
                                required
                            />
                        </div>

                        <div>
                            <label className="text-white/80 text-sm mb-2 block">Password</label>
                            <Input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                className="bg-white/10 border-white/20 text-white placeholder:text-white/40 h-12"
                                required
                            />
                        </div>

                        {error && (
                            <div className="bg-rose-500/10 border border-rose-500/30 text-rose-400 p-3 rounded-lg text-sm">
                                {error}
                            </div>
                        )}

                        <Button
                            type="submit"
                            disabled={isLoading}
                            className="w-full h-12 bg-primary hover:bg-primary/90 text-white font-bold"
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Logging in...
                                </>
                            ) : (
                                "Login"
                            )}
                        </Button>
                    </form>

                    <p className="text-center text-white/40 text-xs mt-6">
                        © 2025 DEORA Plaza • Secure Staff Access Portal
                    </p>
                </div>
            </div>
        );
    }

    return <WaiterMobile />;
}
