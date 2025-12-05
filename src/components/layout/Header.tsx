"use client"

import { useState } from "react"
import { signOut, useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Bell, LogOut, User, Settings, Menu } from "lucide-react"
import { GeometricPattern } from "@/components/ui/rajasthani-patterns"
import { Dialog, DialogTrigger } from "@/components/ui/dialog" // Import Dialog and DialogTrigger
import { BusinessSettingsForm } from "@/components/dashboard/BusinessSettingsForm" // Import BusinessSettingsForm

export function Header() {
    const { data: session } = useSession()
    const [isSettingsDialogOpen, setIsSettingsDialogOpen] = useState(false) // State for dialog visibility

    return (
        <header className="sticky top-0 w-full z-40 h-16 flex items-center justify-between px-6 bg-white/80 backdrop-blur-md border-b border-slate-200/50 transition-all duration-300">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" className="md:hidden text-slate-600 hover:bg-slate-100">
                    <Menu className="h-5 w-5" />
                </Button>
                <div className="hidden md:flex items-center gap-2">
                    <h2 className="text-lg font-semibold text-slate-800 tracking-tight">
                        {session?.user?.businessUnit ?
                            `${session.user.businessUnit.charAt(0).toUpperCase() + session.user.businessUnit.slice(1)} Dashboard`
                            : 'Dashboard'}
                    </h2>
                </div>
            </div>

            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" className="text-slate-500 hover:bg-slate-100 hover:text-slate-900">
                    <Bell className="h-5 w-5" />
                </Button>

                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="relative h-9 w-9 rounded-full ring-2 ring-slate-100 hover:ring-amber-500 transition-all">
                            <Avatar className="h-9 w-9">
                                <AvatarImage src="/avatars/01.png" alt={session?.user?.name || ""} />
                                <AvatarFallback className="bg-slate-900 text-white font-bold">
                                    {session?.user?.name?.charAt(0) || "U"}
                                </AvatarFallback>
                            </Avatar>
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-56 bg-white border-slate-100 shadow-xl" align="end" forceMount>
                        <DropdownMenuLabel className="font-normal">
                            <div className="flex flex-col space-y-1">
                                <p className="text-sm font-medium leading-none text-slate-900">{session?.user?.name}</p>
                                <p className="text-xs leading-none text-slate-500">
                                    {session?.user?.role}
                                </p>
                            </div>
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator className="bg-slate-100" />
                        <Dialog open={isSettingsDialogOpen} onOpenChange={setIsSettingsDialogOpen}>
                            <DialogTrigger asChild>
                                <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="focus:bg-slate-50 focus:text-slate-900 cursor-pointer text-slate-600">
                                    <User className="mr-2 h-4 w-4" />
                                    <span>Profile</span>
                                </DropdownMenuItem>
                            </DialogTrigger>
                            <BusinessSettingsForm onClose={() => setIsSettingsDialogOpen(false)} />
                        </Dialog>
                        <DropdownMenuItem className="focus:bg-slate-50 focus:text-slate-900 cursor-pointer text-slate-600">
                            <Settings className="mr-2 h-4 w-4" />
                            <span>Settings</span>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator className="bg-slate-100" />
                        <DropdownMenuItem
                            className="text-red-600 focus:bg-red-50 focus:text-red-700 cursor-pointer"
                            onClick={() => signOut()}
                        >
                            <LogOut className="mr-2 h-4 w-4" />
                            <span>Log out</span>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </header>
    )
}

