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
import { Beer, UtensilsCrossed, Plus, Minus, Trash2, Search, Wine, GlassWater } from "lucide-react"
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
                // Calculate total from created orders
                const total = result.orders ? result.orders.reduce((sum: number, order: any) => sum + order.totalAmount, 0) : 0

                // Show success animation or toast (using alert for now)
                alert(`Order Placed Successfully!\nTotal: ₹${total}`)
                setCart([])
                setTableNumber("")
            } else {
                alert("Failed to create order")
            }
        } catch (error) {
            console.error("Error submitting order:", error)
            alert("An error occurred")
        } finally {
            setLoading(false)
        }
    }

    const filteredDrinks = drinkMenu.filter(item =>
        item.name.toLowerCase().includes(searchQuery.toLowerCase())
    )
    const filteredFood = foodMenu.filter(item =>
        item.name.toLowerCase().includes(searchQuery.toLowerCase())
    )

    const drinkTotal = cart.filter(i => i.type === "drink").reduce((sum, item) => sum + item.price * item.quantity, 0)
    const foodTotal = cart.filter(i => i.type === "food").reduce((sum, item) => sum + item.price * item.quantity, 0)
    const total = drinkTotal + foodTotal

    return (
        <div className="flex h-[calc(100vh-4rem)] gap-4 p-4 bg-black/95 text-white overflow-hidden">
            {/* Left: Menu & Order Entry */}
            <div className="flex-1 flex flex-col gap-4 min-w-0">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold bg-gradient-to-r from-amber-400 to-orange-600 bg-clip-text text-transparent">
                            Bar Station
                        </h1>
                        <p className="text-gray-400 text-sm">Manage orders and inventory</p>
                    </div>
                    <div className="relative w-64">
                        <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                        <Input
                            placeholder="Search menu..."
                            className="pl-9 bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:border-amber-500"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>

                <div className="flex-1 flex gap-4 min-h-0">
                    {/* Menu Grid */}
                    <Card className="flex-1 bg-white/5 border-white/10 backdrop-blur-sm flex flex-col min-h-0">
                        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
                            <div className="px-4 pt-4">
                                <TabsList className="w-full bg-black/40 border border-white/10">
                                    <TabsTrigger value="drinks" className="flex-1 data-[state=active]:bg-amber-600 data-[state=active]:text-white">
                                        <Wine className="mr-2 h-4 w-4" /> Drinks
                                    </TabsTrigger>
                                    <TabsTrigger value="food" className="flex-1 data-[state=active]:bg-blue-600 data-[state=active]:text-white">
                                        <UtensilsCrossed className="mr-2 h-4 w-4" /> Food (Cafe)
                                    </TabsTrigger>
                                </TabsList>
                            </div>

                            <TabsContent value="drinks" className="flex-1 overflow-hidden p-0 m-0">
                                <ScrollArea className="h-full p-4">
                                    <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                                        {filteredDrinks.map((item) => (
                                            <button
                                                key={item.id}
                                                onClick={() => handleAddItem(item, "drink")}
                                                className="flex flex-col items-start p-3 rounded-lg bg-white/5 hover:bg-amber-500/20 border border-white/5 hover:border-amber-500/50 transition-all group text-left"
                                            >
                                                <div className="flex w-full justify-between items-start mb-1">
                                                    <span className="font-medium text-gray-200 group-hover:text-white truncate w-full pr-2">{item.name}</span>
                                                    <span className="text-amber-400 font-bold">₹{item.price}</span>
                                                </div>
                                                <p className="text-xs text-gray-500 line-clamp-1">{item.description || "No description"}</p>
                                            </button>
                                        ))}
                                    </div>
                                </ScrollArea>
                            </TabsContent>

                            <TabsContent value="food" className="flex-1 overflow-hidden p-0 m-0">
                                <ScrollArea className="h-full p-4">
                                    <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                                        {filteredFood.map((item) => (
                                            <button
                                                key={item.id}
                                                onClick={() => handleAddItem(item, "food")}
                                                className="flex flex-col items-start p-3 rounded-lg bg-white/5 hover:bg-blue-500/20 border border-white/5 hover:border-blue-500/50 transition-all group text-left"
                                            >
                                                <div className="flex w-full justify-between items-start mb-1">
                                                    <span className="font-medium text-gray-200 group-hover:text-white truncate w-full pr-2">{item.name}</span>
                                                    <span className="text-blue-400 font-bold">₹{item.price}</span>
                                                </div>
                                                <p className="text-xs text-gray-500 line-clamp-1">{item.description || "No description"}</p>
                                            </button>
                                        ))}
                                    </div>
                                </ScrollArea>
                            </TabsContent>
                        </Tabs>
                    </Card>

                    {/* Current Order Panel */}
                    <Card className="w-80 bg-white/5 border-white/10 backdrop-blur-sm flex flex-col">
                        <CardHeader className="pb-2 border-b border-white/10">
                            <CardTitle className="text-white flex items-center gap-2">
                                <GlassWater className="h-5 w-5 text-amber-500" />
                                New Order
                            </CardTitle>
                            <Input
                                placeholder="Table No."
                                value={tableNumber}
                                onChange={(e) => setTableNumber(e.target.value)}
                                className="mt-2 bg-black/20 border-white/10 text-white h-8"
                            />
                        </CardHeader>
                        <CardContent className="flex-1 overflow-hidden p-0 flex flex-col">
                            <ScrollArea className="flex-1 p-3">
                                {cart.length === 0 ? (
                                    <div className="h-full flex flex-col items-center justify-center text-gray-500 opacity-50">
                                        <Beer className="h-12 w-12 mb-2" />
                                        <p className="text-sm">Empty Cart</p>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {cart.map((item) => (
                                            <div key={item.id} className="bg-black/20 rounded p-2 flex items-center justify-between group">
                                                <div className="flex-1 min-w-0 mr-2">
                                                    <div className="flex items-center gap-1 mb-1">
                                                        <Badge variant="outline" className={`h-4 px-1 text-[10px] ${item.type === 'drink' ? 'text-amber-400 border-amber-400/30' : 'text-blue-400 border-blue-400/30'}`}>
                                                            {item.type === 'drink' ? 'D' : 'F'}
                                                        </Badge>
                                                        <span className="text-sm font-medium text-gray-200 truncate">{item.name}</span>
                                                    </div>
                                                    <div className="text-xs text-gray-500">₹{item.price} x {item.quantity}</div>
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <button onClick={() => handleUpdateQuantity(item.id, -1)} className="p-1 hover:bg-white/10 rounded text-gray-400 hover:text-white"><Minus className="h-3 w-3" /></button>
                                                    <span className="text-sm w-4 text-center font-medium text-white">{item.quantity}</span>
                                                    <button onClick={() => handleUpdateQuantity(item.id, 1)} className="p-1 hover:bg-white/10 rounded text-gray-400 hover:text-white"><Plus className="h-3 w-3" /></button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </ScrollArea>

                            <div className="p-4 bg-black/40 border-t border-white/10 space-y-3">
                                <div className="space-y-1 text-sm">
                                    <div className="flex justify-between text-gray-400">
                                        <span>Drinks</span>
                                        <span>₹{drinkTotal}</span>
                                    </div>
                                    <div className="flex justify-between text-gray-400">
                                        <span>Food</span>
                                        <span>₹{foodTotal}</span>
                                    </div>
                                    <div className="flex justify-between text-lg font-bold text-white pt-2 border-t border-white/10">
                                        <span>Total</span>
                                        <span className="text-amber-400">₹{total}</span>
                                    </div>
                                </div>
                                <Button
                                    className="w-full bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white font-bold shadow-lg shadow-orange-900/20"
                                    disabled={cart.length === 0 || loading}
                                    onClick={handleSubmitOrder}
                                >
                                    Place Order
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Right: Active Queue */}
            <div className="w-80 min-w-0 bg-white/5 border-l border-white/10 backdrop-blur-sm p-4 flex flex-col">
                <BarQueue />
            </div>
        </div>
    )
}
