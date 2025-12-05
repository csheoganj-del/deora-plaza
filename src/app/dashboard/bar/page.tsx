"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { getBarMenu } from "@/actions/bar"
import { getMenuItems } from "@/actions/menu"
import { createBarOrder } from "@/actions/bar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Beer, UtensilsCrossed, Plus, Minus, Trash2, Search, Wine, GlassWater, ShoppingCart, Loader2 } from "lucide-react"
import BarQueue from "@/components/bar/BarQueue"

type MenuItem = {
    id: string
    name: string
    price: number
    category: string
    description: string | null
}

type CartItem = {
    id: string
    name: string
    price: number
    quantity: number
    type: "drink" | "food"
}

export default function BarPage() {
    const { data: session } = useSession()
    const [drinkMenu, setDrinkMenu] = useState<MenuItem[]>([])
    const [foodMenu, setFoodMenu] = useState<MenuItem[]>([])
    const [cart, setCart] = useState<CartItem[]>([])
    const [tableNumber, setTableNumber] = useState("")
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState("")
    const [activeTab, setActiveTab] = useState("drinks")

    useEffect(() => {
        async function loadMenus() {
            const { drinks, food } = await getBarMenu()
            setDrinkMenu(drinks)
            setFoodMenu(food)
            setLoading(false)
        }
        loadMenus()
    }, [])

    const handleAddItem = (item: MenuItem, type: "drink" | "food") => {
        setCart((prev) => {
            const existing = prev.find((i) => i.id === item.id)
            if (existing) {
                return prev.map((i) =>
                    i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i
                )
            }
            return [...prev, { id: item.id, name: item.name, price: item.price, quantity: 1, type }]
        })
    }

    const handleUpdateQuantity = (id: string, delta: number) => {
        setCart((prev) => {
            return prev.map((item) => {
                if (item.id === id) {
                    const newQuantity = Math.max(0, item.quantity + delta)
                    return { ...item, quantity: newQuantity }
                }
                return item
            }).filter((item) => item.quantity > 0)
        })
    }

    const handleRemoveItem = (id: string) => {
        setCart((prev) => prev.filter((item) => item.id !== id))
    }

    const handleSubmitOrder = async () => {
        if (cart.length === 0) return

        setLoading(true)
        try {
            const items = cart.map(item => ({
                menuItemId: item.id,
                name: item.name,
                quantity: item.quantity,
                price: item.price,
                businessUnit: item.type === 'drink' ? 'bar' : 'cafe'
            }))

            const result = await createBarOrder({
                items
            })

            if (result.success) {
                setCart([])
                setTableNumber("")
                // Ideally show success toast here
            }
        } catch (error) {
            console.error("Failed to create order", error)
        } finally {
            setLoading(false)
        }
    }

    const totalAmount = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0)

    const filteredDrinks = drinkMenu.filter(item =>
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.category.toLowerCase().includes(searchQuery.toLowerCase())
    )

    const filteredFood = foodMenu.filter(item =>
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.category.toLowerCase().includes(searchQuery.toLowerCase())
    )

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center bg-slate-50">
                <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
            </div>
        )
    }

    return (
        <div className="flex h-screen bg-slate-50 overflow-hidden">
            {/* Left Side - Menu */}
            <div className="flex-1 flex flex-col p-6 overflow-hidden">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">Bar & POS</h1>
                        <p className="text-slate-500 text-sm">Create orders and manage service</p>
                    </div>
                    <div className="relative w-64">
                        <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                        <Input
                            placeholder="Search menu..."
                            className="pl-9 bg-white border-slate-200 focus:ring-amber-500"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>

                <Tabs defaultValue="drinks" value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
                    <TabsList className="bg-white border border-slate-200 p-1 w-full justify-start mb-4">
                        <TabsTrigger value="drinks" className="data-[state=active]:bg-slate-900 data-[state=active]:text-white text-slate-500 flex-1">
                            <Wine className="mr-2 h-4 w-4" /> Drinks
                        </TabsTrigger>
                        <TabsTrigger value="food" className="data-[state=active]:bg-slate-900 data-[state=active]:text-white text-slate-500 flex-1">
                            <UtensilsCrossed className="mr-2 h-4 w-4" /> Food & Snacks
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="drinks" className="flex-1 overflow-y-auto pr-2">
                        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 pb-20">
                            {filteredDrinks.map((item) => (
                                <Card key={item.id} className="cursor-pointer hover:shadow-md transition-all border-slate-200 bg-white group" onClick={() => handleAddItem(item, "drink")}>
                                    <CardContent className="p-4 flex flex-col justify-between h-full">
                                        <div>
                                            <div className="flex justify-between items-start mb-2">
                                                <Badge variant="outline" className="border-amber-200 text-amber-700 bg-amber-50">{item.category}</Badge>
                                                <span className="font-bold text-slate-900">₹{item.price}</span>
                                            </div>
                                            <h3 className="font-bold text-slate-800 mb-1 group-hover:text-amber-600 transition-colors">{item.name}</h3>
                                            <p className="text-xs text-slate-500 line-clamp-2">{item.description}</p>
                                        </div>
                                        <Button size="sm" variant="secondary" className="w-full mt-4 bg-slate-100 hover:bg-amber-50 hover:text-amber-600">
                                            <Plus className="h-4 w-4 mr-1" /> Add
                                        </Button>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </TabsContent>

                    <TabsContent value="food" className="flex-1 overflow-y-auto pr-2">
                        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 pb-20">
                            {filteredFood.map((item) => (
                                <Card key={item.id} className="cursor-pointer hover:shadow-md transition-all border-slate-200 bg-white group" onClick={() => handleAddItem(item, "food")}>
                                    <CardContent className="p-4 flex flex-col justify-between h-full">
                                        <div>
                                            <div className="flex justify-between items-start mb-2">
                                                <Badge variant="outline" className="border-emerald-200 text-emerald-700 bg-emerald-50">{item.category}</Badge>
                                                <span className="font-bold text-slate-900">₹{item.price}</span>
                                            </div>
                                            <h3 className="font-bold text-slate-800 mb-1 group-hover:text-emerald-600 transition-colors">{item.name}</h3>
                                            <p className="text-xs text-slate-500 line-clamp-2">{item.description}</p>
                                        </div>
                                        <Button size="sm" variant="secondary" className="w-full mt-4 bg-slate-100 hover:bg-emerald-50 hover:text-emerald-600">
                                            <Plus className="h-4 w-4 mr-1" /> Add
                                        </Button>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </TabsContent>
                </Tabs>
            </div>

            {/* Right Side - Cart & Queue */}
            <div className="w-96 bg-white border-l border-slate-200 flex flex-col h-full shadow-xl z-20">
                <div className="p-4 border-b border-slate-100 bg-slate-50/50">
                    <h2 className="font-bold text-lg text-slate-900 flex items-center gap-2">
                        <ShoppingCart className="h-5 w-5 text-amber-500" />
                        Current Order
                    </h2>
                </div>

                <div className="flex-1 overflow-y-auto p-4">
                    {cart.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-4">
                            <div className="h-16 w-16 rounded-full bg-slate-100 flex items-center justify-center">
                                <Beer className="h-8 w-8 text-slate-300" />
                            </div>
                            <p>Cart is empty</p>
                            <p className="text-xs text-center max-w-[200px]">Select items from the menu to start a new order</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {cart.map((item) => (
                                <div key={item.id} className="flex items-center justify-between bg-slate-50 p-3 rounded-lg border border-slate-100">
                                    <div className="flex-1">
                                        <p className="font-medium text-slate-900 text-sm">{item.name}</p>
                                        <p className="text-xs text-slate-500">₹{item.price} x {item.quantity}</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Button size="icon" variant="ghost" className="h-6 w-6 rounded-full hover:bg-slate-200" onClick={() => handleUpdateQuantity(item.id, -1)}>
                                            <Minus className="h-3 w-3" />
                                        </Button>
                                        <span className="text-sm font-bold w-4 text-center">{item.quantity}</span>
                                        <Button size="icon" variant="ghost" className="h-6 w-6 rounded-full hover:bg-slate-200" onClick={() => handleUpdateQuantity(item.id, 1)}>
                                            <Plus className="h-3 w-3" />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="p-4 bg-slate-50 border-t border-slate-200 space-y-4">
                    <div className="space-y-2">
                        <div className="flex justify-between text-sm text-slate-500">
                            <span>Subtotal</span>
                            <span>₹{totalAmount}</span>
                        </div>
                        <div className="flex justify-between text-sm text-slate-500">
                            <span>Tax (5%)</span>
                            <span>₹{Math.round(totalAmount * 0.05)}</span>
                        </div>
                        <Separator className="bg-slate-200" />
                        <div className="flex justify-between font-bold text-lg text-slate-900">
                            <span>Total</span>
                            <span>₹{Math.round(totalAmount * 1.05)}</span>
                        </div>
                    </div>

                    <Button
                        className="w-full bg-amber-500 hover:bg-amber-600 text-white font-bold h-12 text-lg shadow-lg shadow-amber-500/20"
                        disabled={cart.length === 0 || loading}
                        onClick={handleSubmitOrder}
                    >
                        {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Place Order"}
                    </Button>
                </div>

                {/* Active Orders Queue Preview */}
                <div className="border-t border-slate-200 bg-slate-100 p-4 max-h-48 overflow-y-auto">
                    <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Active Queue</h3>
                    <BarQueue />
                </div>
            </div>
        </div>
    )
}
