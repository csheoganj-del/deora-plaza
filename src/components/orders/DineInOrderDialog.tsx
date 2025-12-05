"use client"
// DineIn Order Dialog - Adapted from TakeawayOrderDialog

import { useState, useEffect, useMemo } from "react"
import { Loader2, AlertCircle } from "lucide-react"
import { getMenuItems } from "@/actions/menu"
import { createOrder } from "@/actions/orders"
import { useRouter } from "next/navigation"

type MenuItem = {
    id: string
    name: string
    price: number
    category: string
    description: string | null
    isAvailable: boolean
}

interface DineInOrderDialogProps {
    isOpen: boolean
    onClose: () => void
    businessUnit: string
    tableId: string
    tableNumber: string
}

export function DineInOrderDialog({ isOpen, onClose, businessUnit, tableId, tableNumber }: DineInOrderDialogProps) {
    const router = useRouter()
    const [query, setQuery] = useState("")
    const [selectedCategory, setSelectedCategory] = useState("ALL")
    const [cart, setCart] = useState<{ [key: string]: { item: MenuItem; qty: number } }>({})
    const [menuItems, setMenuItems] = useState<MenuItem[]>([])
    const [isLoading, setIsLoading] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [orderType, setOrderType] = useState(businessUnit || "cafe")
    const [guestCount, setGuestCount] = useState(1)

    useEffect(() => {
        if (isOpen) {
            setIsLoading(true)
            setError(null)
            setCart({})
            setOrderType(businessUnit || "cafe")

            getMenuItems().then((rawItems) => {
                const availableItems = rawItems.filter((item: MenuItem) => item.isAvailable)
                setMenuItems(availableItems)
                setIsLoading(false)
            }).catch(err => {
                console.error("Failed to load menu:", err)
                setError("Failed to load menu. Please try again.")
                setIsLoading(false)
            })
        }
    }, [isOpen, businessUnit])

    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                onClose()
            }
        }
        if (isOpen) {
            window.addEventListener('keydown', handleEsc)
        }
        return () => window.removeEventListener('keydown', handleEsc)
    }, [isOpen, onClose])

    const categories = useMemo(() => {
        const set = new Set<string>()
        menuItems.forEach((m) => {
            if (m.category) set.add(m.category)
        })
        return ["ALL", ...Array.from(set)]
    }, [menuItems])

    const filteredMenu = useMemo(() => {
        const q = query.trim().toLowerCase()
        return menuItems.filter((m) => {
            if (selectedCategory !== "ALL" && m.category !== selectedCategory) return false
            if (!q) return true
            return m.name.toLowerCase().includes(q) || (m.category || "").toLowerCase().includes(q)
        })
    }, [menuItems, query, selectedCategory])

    const addItem = (item: MenuItem) => {
        setCart((prev) => {
            const prevEntry = prev[item.id]
            const qty = prevEntry ? prevEntry.qty + 1 : 1
            return { ...prev, [item.id]: { item, qty } }
        })
    }

    const incQty = (id: string) => {
        setCart((prev) => {
            const entry = prev[id]
            if (!entry) return prev
            return { ...prev, [id]: { ...entry, qty: entry.qty + 1 } }
        })
    }

    const decQty = (id: string) => {
        setCart((prev) => {
            const entry = prev[id]
            if (!entry) return prev
            const newQty = entry.qty - 1
            if (newQty <= 0) {
                const { [id]: _, ...rest } = prev
                return rest
            }
            return { ...prev, [id]: { ...entry, qty: newQty } }
        })
    }

    const clearCart = () => setCart({})

    const subtotal = useMemo(() => {
        return Object.values(cart).reduce((s, e) => s + e.item.price * e.qty, 0)
    }, [cart])

    const handleSubmitOrder = async () => {
        if (Object.keys(cart).length === 0) {
            setError("Cannot place an empty order.")
            return
        }

        setIsSubmitting(true)
        setError(null)

        const orderItemsPayload = Object.values(cart).map(e => ({
            menuItemId: e.item.id,
            name: e.item.name,
            quantity: e.qty,
            price: e.item.price
        }))

        try {
            const orderResult = await createOrder({
                businessUnit: orderType,
                type: "dine-in",
                tableId,
                guestCount,
                items: orderItemsPayload,
            })

            if (orderResult.success) {
                alert(`Order for Table ${tableNumber} placed successfully!`)
                clearCart()
                onClose()
                router.refresh()
            } else {
                setError(String(orderResult.error) || "Failed to create order. Please try again.")
            }
        } catch (error) {
            console.error("An error occurred during order submission:", error)
            setError("An unexpected error occurred during submission.")
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
            role="dialog"
            aria-modal="true"
        >
            <div className="bg-white w-full max-w-6xl rounded-xl shadow-xl ring-1 ring-black/5">
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-2 border-b">
                    <div className="flex items-center gap-3">
                        <h3 className="text-lg font-semibold">New Order - Table {tableNumber}</h3>
                        <div className="flex items-center gap-2 ml-4">
                            <label className="text-sm text-gray-600">Type:</label>
                            <select
                                value={orderType}
                                onChange={(e) => setOrderType(e.target.value)}
                                className="px-2 py-1 text-sm border rounded bg-white"
                            >
                                <option value="cafe">Cafe</option>
                                <option value="restaurant">Restaurant</option>
                            </select>
                        </div>
                        <div className="flex items-center gap-2 ml-4">
                            <label className="text-sm text-gray-600">Guests:</label>
                            <input
                                type="number"
                                min="1"
                                value={guestCount}
                                onChange={(e) => setGuestCount(parseInt(e.target.value) || 1)}
                                className="w-16 px-2 py-1 text-sm border rounded"
                            />
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => { clearCart(); onClose(); }}
                            className="text-sm text-gray-500 hover:text-gray-700 px-2 py-1 rounded"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={onClose}
                            aria-label="Close"
                            className="p-1 rounded-md hover:bg-gray-100"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-700" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10 8.586L15.95 2.636a1 1 0 111.414 1.414L11.414 10l5.95 5.95a1 1 0 01-1.414 1.414L10 11.414l-5.95 5.95a1 1 0 01-1.414-1.414L8.586 10 2.636 4.05A1 1 0 114.05 2.636L10 8.586z" clipRule="evenodd" />
                            </svg>
                        </button>
                    </div>
                </div>

                {error && (
                    <div className="p-3 border-b border-red-200 bg-red-50 text-red-700 text-sm flex items-center gap-2">
                        <AlertCircle className="h-4 w-4" />
                        {error}
                    </div>
                )}

                {/* Body */}
                <div className="flex flex-col md:flex-row">
                    {/* Left: Menu */}
                    <div className="w-full md:w-[70%] border-r">
                        <div className="p-3">
                            <div className="flex items-center gap-2">
                                <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search items..." className="flex-1 px-3 py-2 text-sm rounded-md border focus:outline-none focus:ring-1 focus:ring-indigo-400" />
                                <button onClick={() => setQuery("")} className="px-3 py-2 text-sm text-gray-600 hover:text-gray-800 rounded">Reset</button>
                            </div>
                            <div className="mt-2 flex gap-2 overflow-x-auto pb-2">
                                {categories.map((cat) => (
                                    <button key={cat} onClick={() => setSelectedCategory(cat)} className={`text-xs whitespace-nowrap px-3 py-1 rounded-full border ${selectedCategory === cat ? "bg-indigo-600 text-white border-transparent" : "bg-white text-gray-700"}`}>
                                        {cat}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="px-2 pb-4">
                            <div className="h-[60vh] overflow-y-auto overflow-x-hidden divide-y">
                                {isLoading ? (
                                    <div className="flex items-center justify-center p-10 text-sm text-gray-500"><Loader2 className="h-6 w-6 animate-spin mr-2" /> Loading menu...</div>
                                ) : filteredMenu.length === 0 ? (
                                    <div className="p-4 text-sm text-center text-gray-500">No items found.</div>
                                ) : (
                                    filteredMenu.map((it) => {
                                        const inCart = cart[it.id]?.qty || 0
                                        return (
                                            <div key={it.id} className="flex items-center justify-between px-3 py-2 text-sm">
                                                <div className="flex-1 min-w-0" onClick={() => addItem(it)} >
                                                    <div className="flex items-center gap-2">
                                                        <div className="font-medium truncate cursor-pointer hover:text-indigo-600">{it.name}</div>
                                                        <div className="text-xs text-gray-400">· {it.category || "—"}</div>
                                                    </div>
                                                    <div className="text-xs text-gray-500 mt-0.5">₹{Number(it.price).toFixed(2)}</div>
                                                </div>
                                                <div className="flex items-center gap-2 ml-3">
                                                    {inCart > 0 && (
                                                        <div className="flex items-center gap-1 text-sm border rounded-full px-2 py-0.5">
                                                            <button onClick={() => decQty(it.id)} className="px-1 text-gray-600 hover:text-gray-800">-</button>
                                                            <span className="px-1 font-medium">{inCart}</span>
                                                            <button onClick={() => incQty(it.id)} className="px-1 text-gray-600 hover:text-gray-800">+</button>
                                                        </div>
                                                    )}
                                                    <button onClick={() => addItem(it)} className="text-sm px-3 py-1 rounded-md bg-indigo-600 text-white hover:bg-indigo-700" aria-label={`Add ${it.name}`}>Add</button>
                                                </div>
                                            </div>
                                        )
                                    })
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Right: Order Summary */}
                    <div className="w-full md:w-[30%] p-3 bg-gray-50/50 rounded-r-xl">
                        <div className="flex flex-col h-full">
                            <div className="flex-1 overflow-y-auto">
                                <h4 className="text-sm font-semibold mb-2">Your Order</h4>
                                <div className="divide-y">
                                    {Object.keys(cart).length === 0 ? (
                                        <div className="text-sm text-center text-gray-500 py-6">No items in cart</div>
                                    ) : (
                                        Object.values(cart).map(({ item, qty }) => (
                                            <div key={item.id} className="flex items-center justify-between py-2 text-sm">
                                                <div className="min-w-0">
                                                    <div className="truncate font-medium">{item.name}</div>
                                                    <div className="text-xs text-gray-500">₹{Number(item.price).toFixed(2)} × {qty}</div>
                                                </div>
                                                <div className="flex items-center gap-2 ml-3">
                                                    <div className="flex items-center border rounded-full px-2 py-0.5 text-sm">
                                                        <button onClick={() => decQty(item.id)} className="px-1 text-gray-600">-</button>
                                                        <span className="px-2 font-medium">{qty}</span>
                                                        <button onClick={() => incQty(item.id)} className="px-1 text-gray-600">+</button>
                                                    </div>
                                                    <div className="text-sm font-medium w-16 text-right">₹{(item.price * qty).toFixed(2)}</div>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>

                            <div className="mt-3 border-t pt-3">
                                <div className="flex items-center justify-between mt-3 text-base">
                                    <div className="text-gray-700 font-semibold">Total</div>
                                    <div className="font-bold text-lg">₹{subtotal.toFixed(2)}</div>
                                </div>
                                <div className="mt-3 flex items-center gap-2">
                                    <button
                                        onClick={handleSubmitOrder}
                                        disabled={Object.keys(cart).length === 0 || isSubmitting}
                                        className={`w-full py-2 text-sm font-semibold rounded transition-colors ${Object.keys(cart).length === 0 || isSubmitting ? "bg-gray-300 text-gray-500 cursor-not-allowed" : "bg-green-600 text-white hover:bg-green-700"}`}
                                    >
                                        {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin inline-block mr-2" /> : null}
                                        {isSubmitting ? 'Placing Order...' : 'Place Order'}
                                    </button>
                                    <button onClick={() => clearCart()} className="px-3 py-2 text-sm rounded border hover:bg-gray-100">Clear</button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
