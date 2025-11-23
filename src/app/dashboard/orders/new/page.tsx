"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { useSession } from "next-auth/react"
import MenuGrid from "@/components/cafe/MenuGrid"
import OrderCart from "@/components/cafe/OrderCart"
import { getMenuItems } from "@/actions/menu"
import { createOrder } from "@/actions/orders"
import { Loader2 } from "lucide-react"
import CustomerLookup from "@/components/cafe/CustomerLookup"

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
    specialInstructions?: string
}

import { Suspense } from "react"

function OrderPageContent() {
    const { data: session } = useSession()
    const searchParams = useSearchParams()
    const tableId = searchParams.get("tableId")
    const tableNumber = searchParams.get("tableNumber")

    const [menuItems, setMenuItems] = useState<MenuItem[]>([])
    const [cart, setCart] = useState<CartItem[]>([])
    const [loading, setLoading] = useState(true)
    const [selectedCustomer, setSelectedCustomer] = useState<any>(null)

    useEffect(() => {
        async function loadMenu() {
            const items = await getMenuItems("cafe")
            setMenuItems(items)
            setLoading(false)
        }
        loadMenu()
    }, [])

    const handleAddItem = (item: MenuItem) => {
        setCart((prev) => {
            const existing = prev.find((i) => i.id === item.id)
            if (existing) {
                return prev.map((i) =>
                    i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i
                )
            }
            return [...prev, { id: item.id, name: item.name, price: item.price, quantity: 1 }]
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
            const result = await createOrder({
                tableId: tableId || undefined,
                items: cart.map(item => ({
                    menuItemId: item.id,
                    name: item.name,
                    quantity: item.quantity,
                    price: item.price,
                    specialInstructions: item.specialInstructions
                })),
                type: "dine-in",
                businessUnit: "cafe",
            })

            if (result.success) {
                alert("Order sent to kitchen successfully!")
                setCart([])
            } else {
                alert("Failed to create order.")
            }
        } catch (error) {
            console.error("Error submitting order:", error)
            alert("An error occurred.")
        } finally {
            setLoading(false)
        }
    }

    if (loading) {
        return <div className="flex h-full items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>
    }

    return (
        <div className="flex h-[calc(100vh-4rem)] gap-4">
            <div className="flex-1 overflow-y-auto pr-2">
                <div className="mb-4 space-y-4">
                    <div>
                        <h1 className="text-2xl font-bold">New Order</h1>
                        <p className="text-muted-foreground">Select items to add to the order</p>
                    </div>
                    <CustomerLookup onSelectCustomer={setSelectedCustomer} />
                </div>
                <MenuGrid items={menuItems} onAddItem={handleAddItem} />
            </div>
            <div className="w-96">
                <OrderCart
                    items={cart}
                    onUpdateQuantity={handleUpdateQuantity}
                    onRemoveItem={handleRemoveItem}
                    onSubmitOrder={handleSubmitOrder}
                    tableNumber={tableNumber || undefined}
                />
            </div>
        </div>
    )
}

export default function OrderPage() {
    return (
        <Suspense fallback={<div className="flex h-full items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>}>
            <OrderPageContent />
        </Suspense>
    )
}
