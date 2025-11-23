"use client"

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
import { User, LogOut } from "lucide-react"

export default function Header() {
    const { data: session } = useSession()

    return (
        <header className="flex h-14 items-center justify-between border-b bg-white px-4 dark:bg-gray-800 md:px-6">
            <div className="flex items-center gap-4">
                {/* Mobile menu trigger could go here */}
                <h1 className="text-lg font-semibold md:text-xl">Dashboard</h1>
            </div>
            <div className="flex items-center gap-4">
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="rounded-full">
                            <User className="h-5 w-5" />
                            <span className="sr-only">Toggle user menu</span>
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuLabel>My Account</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="font-medium">
                            {session?.user?.username}
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-xs text-muted-foreground">
                            {session?.user?.role}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => signOut({ callbackUrl: "/login" })}>
                            <LogOut className="mr-2 h-4 w-4" />
                            Log out
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </header>
    )
}
