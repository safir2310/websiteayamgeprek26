'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  ShoppingCart,
  Search,
  Plus,
  Minus,
  Trash2,
  Printer,
  User,
  LogOut,
  Package,
  X,
  CreditCard,
  DollarSign,
  CheckCircle,
  Bell,
  Clock,
  Calendar,
  MapPin,
  Phone,
  ShoppingBag,
  Star,
  FileText,
  TrendingUp,
  Wallet,
  Receipt
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'

interface User {
  id: string
  username: string
  email: string
  role: string
  points: number
}

interface Product {
  id: string
  name: string
  description: string
  price: number
  discount: number
  image: string
  stock: number
  categoryId: string
  isPromotion: boolean
  isNew: boolean
  isRedeemable: boolean
  redeemPoints: number
  order: number
  category: {
    id: string
    name: string
    slug: string
  }
}

interface Category {
  id: string
  name: string
  slug: string
  description: string
  order: number
}

interface CartItem {
  product: Product
  quantity: number
  subtotal: number
}

interface Order {
  id: string
  userId: string
  userName: string
  userPhone: string
  userAddress: string
  total: number
  status: string
  paymentMethod?: string
  cashReceived?: number
  cashChange?: number
  isCashierOrder: boolean
  createdAt: string
  shiftId?: string
  items: OrderItem[]
  pointsEarned: number
}

interface OrderItem {
  id: string
  productId: string
  quantity: number
  price: number
  subtotal: number
  product: Product
}

interface CashierShift {
  id: string
  cashierId: string
  cashierName: string
  startTime: string
  endTime?: string
  totalOrders: number
  totalRevenue: number
  totalPoints: number
  totalItems: number
  status: string
  paymentMethods: string
  createdAt: string
  updatedAt: string
}

export default function KasirPage() {
  const router = useRouter()
  const pollingRef = useRef<NodeJS.Timeout | null>(null)
  const clockRef = useRef<NodeJS.Timeout | null>(null)

  // User state
  const [user, setUser] = useState<User | null>(null)

  // Products and categories state
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)

  // Cart state
  const [cart, setCart] = useState<CartItem[]>([])

  // Search and filter state
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')

  // Order processing state
  const [processingOrder, setProcessingOrder] = useState(false)

  // Payment modal state
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [paymentReceived, setPaymentReceived] = useState<number>(0)
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<'cash' | 'card' | 'transfer'>('cash')

  // Online orders state
  const [onlineOrderCount, setOnlineOrderCount] = useState(0)
  const [lastCheckedOrderCount, setLastCheckedOrderCount] = useState(0)
  const [showOrdersNotification, setShowOrdersNotification] = useState(false)
  const [showOnlineOrdersModal, setShowOnlineOrdersModal] = useState(false)
  const [onlineOrders, setOnlineOrders] = useState<Order[]>([])
  const [loadingOnlineOrders, setLoadingOnlineOrders] = useState(false)

  // Closing modal state
  const [showClosingModal, setShowClosingModal] = useState(false)
  const [loadingClosingData, setLoadingClosingData] = useState(false)
  const [closingData, setClosingData] = useState<{
    totalOrders: number
    totalRevenue: number
    totalPoints: number
    totalItems: number
    paymentMethods: { [key: string]: number }
    orders: Order[]
  } | null>(null)

  // Shift state
  const [currentShiftId, setCurrentShiftId] = useState<string | null>(null)

  // Clock state
  const [currentTime, setCurrentTime] = useState(new Date())

  // Check authentication and role
  useEffect(() => {
    const userStr = localStorage.getItem('user')
    if (!userStr) {
      toast.error('Anda harus login terlebih dahulu')
      router.push('/login')
      return
    }

    const userData = JSON.parse(userStr)
    if (userData.role !== 'cashier' && userData.role !== 'admin') {
      toast.error('Anda tidak memiliki akses ke halaman ini')
      router.push('/')
      return
    }

    setUser(userData)
  }, [router])

  // Initialize shift when user is loaded
  useEffect(() => {
    if (user) {
      createOrGetShift(user.id, user.username)
    }
  }, [user])

  // Fetch products and categories
  useEffect(() => {
    if (user) {
      fetchProducts()
      fetchCategories()
    }
  }, [user])

  // Poll for online orders
  useEffect(() => {
    if (user) {
      checkOnlineOrders()

      pollingRef.current = setInterval(() => {
        checkOnlineOrders()
      }, 10000) // Check every 10 seconds

      return () => {
        if (pollingRef.current) {
          clearInterval(pollingRef.current)
        }
      }
    }
  }, [user, lastCheckedOrderCount])

  // Update clock every second
  useEffect(() => {
    clockRef.current = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)

    return () => {
      if (clockRef.current) {
        clearInterval(clockRef.current)
      }
    }
  }, [])

  // Show notification when new orders arrive
  useEffect(() => {
    if (onlineOrderCount > lastCheckedOrderCount && lastCheckedOrderCount > 0) {
      setShowOrdersNotification(true)
      toast.success(`Pesanan Online Baru!`, {
        description: `${onlineOrderCount - lastCheckedOrderCount} pesanan baru`,
        position: 'top-right'
      })
    }
  }, [onlineOrderCount, lastCheckedOrderCount])

  const createOrGetShift = async (cashierId: string, cashierName: string) => {
    try {
      const res = await fetch('/api/cashier-shifts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cashierId, cashierName })
      })

      const data = await res.json()
      if (data.success && data.shift) {
        setCurrentShiftId(data.shift.id)
      }
    } catch (error) {
      console.error('Error creating/getting shift:', error)
      toast.error('Gagal membuat shift')
    }
  }

  const fetchProducts = async () => {
    try {
      const res = await fetch('/api/products')
      const data = await res.json()
      setProducts(data)
      setLoading(false)
    } catch (error) {
      console.error('Error fetching products:', error)
      toast.error('Gagal memuat produk')
      setLoading(false)
    }
  }

  const fetchCategories = async () => {
    try {
      const res = await fetch('/api/categories')
      const data = await res.json()
      setCategories(data)
    } catch (error) {
      console.error('Error fetching categories:', error)
    }
  }

  const checkOnlineOrders = async () => {
    try {
      const res = await fetch('/api/orders?isCashierOrder=false&status=pending')
      const data = await res.json()
      setOnlineOrderCount(data.length || 0)
    } catch (error) {
      console.error('Error checking online orders:', error)
    }
  }

  const fetchOnlineOrders = async () => {
    setLoadingOnlineOrders(true)
    try {
      const res = await fetch('/api/orders?isCashierOrder=false&status=pending')
      const data = await res.json()
      setOnlineOrders(data)
    } catch (error) {
      console.error('Error fetching online orders:', error)
      toast.error('Gagal memuat pesanan online')
    } finally {
      setLoadingOnlineOrders(false)
    }
  }

  const addToCart = (product: Product) => {
    if (product.stock <= 0) {
      toast.error('Stok habis!')
      return
    }

    setCart((prevCart) => {
      const existingItem = prevCart.find((item) => item.product.id === product.id)
      const currentQuantity = existingItem ? existingItem.quantity : 0

      if (currentQuantity >= product.stock) {
        toast.error('Stok tidak mencukupi!')
        return prevCart
      }

      if (existingItem) {
        return prevCart.map((item) =>
          item.product.id === product.id
            ? {
                ...item,
                quantity: item.quantity + 1,
                subtotal: (item.quantity + 1) * item.product.price
              }
            : item
        )
      }

      return [
        ...prevCart,
        {
          product,
          quantity: 1,
          subtotal: product.price
        }
      ]
    })

    toast.success(`${product.name} ditambahkan ke keranjang`, {
      position: 'bottom-right'
    })
  }

  const updateQuantity = (productId: string, delta: number) => {
    setCart((prevCart) => {
      return prevCart
        .map((item) => {
          if (item.product.id === productId) {
            const newQuantity = item.quantity + delta
            if (newQuantity <= 0) {
              return null
            }
            if (newQuantity > item.product.stock) {
              toast.error('Stok tidak mencukupi!')
              return item
            }
            return {
              ...item,
              quantity: newQuantity,
              subtotal: newQuantity * item.product.price
            }
          }
          return item
        })
        .filter((item): item is CartItem => item !== null)
    })
  }

  const removeFromCart = (productId: string) => {
    setCart((prevCart) => prevCart.filter((item) => item.product.id !== productId))
    toast.success('Produk dihapus dari keranjang')
  }

  const getCartTotal = () => {
    return cart.reduce((total, item) => total + item.subtotal, 0)
  }

  const handlePayment = async () => {
    if (cart.length === 0) {
      toast.error('Keranjang kosong!')
      return
    }

    if (!currentShiftId) {
      toast.error('Shift tidak valid. Silakan refresh halaman.')
      return
    }

    if (selectedPaymentMethod === 'cash' && paymentReceived < getCartTotal()) {
      toast.error('Pembayaran kurang!')
      return
    }

    setProcessingOrder(true)

    try {
      const cashReceived = selectedPaymentMethod === 'cash' ? paymentReceived : getCartTotal()
      const cashChange = selectedPaymentMethod === 'cash' ? paymentReceived - getCartTotal() : 0

      const orderData = {
        userId: user?.id || '',
        userName: user?.username || 'Kasir',
        userPhone: '-',
        userAddress: '-',
        items: cart.map((item) => ({
          productId: item.product.id,
          quantity: item.quantity,
          price: item.product.price,
          subtotal: item.subtotal
        })),
        total: getCartTotal(),
        paymentMethod: selectedPaymentMethod,
        cashReceived,
        cashChange,
        isCashierOrder: true,
        shiftId: currentShiftId
      }

      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData)
      })

      const data = await res.json()

      if (res.ok) {
        const pointsEarned = Math.floor(getCartTotal() / 1000)
        
        // Print receipt
        printReceipt(data.order, selectedPaymentMethod, cashChange, pointsEarned)

        // Show success toast
        toast.success('Pesanan berhasil!', {
          description: `Total: Rp ${getCartTotal().toLocaleString('id-ID')}`,
          position: 'top-center'
        })

        if (pointsEarned > 0) {
          toast.success(`+${pointsEarned} poin diperoleh!`, {
            position: 'top-center'
          })
        }

        // Reset cart and close modal
        setCart([])
        setPaymentReceived(0)
        setShowPaymentModal(false)
      } else {
        toast.error(data.error || 'Gagal membuat pesanan')
      }
    } catch (error) {
      console.error('Error creating order:', error)
      toast.error('Terjadi kesalahan saat membuat pesanan')
    } finally {
      setProcessingOrder(false)
    }
  }

  const printReceipt = (order: Order, paymentMethod: string, change: number, pointsEarned: number) => {
    const orderId = order.id.slice(-6).toUpperCase()
    const date = new Date(order.createdAt).toLocaleString('id-ID', {
      dateStyle: 'medium',
      timeStyle: 'short'
    })

    let receipt = `
╔══════════════════════════════════════╗
║     AYAM GEPREK SAMBAL IJO          ║
║    Sambal Pedas Mantap              ║
╚══════════════════════════════════════╝

No. Pesanan: ${orderId}
Tanggal: ${date}
Kasir: ${user?.username || '-'}

-----------------------------------
ITEM:
`
    order.items.forEach((item, index) => {
      receipt += `${index + 1}. ${item.product.name}\n`
      receipt += `   ${item.quantity} x Rp ${item.price.toLocaleString('id-ID')}\n`
      receipt += `   = Rp ${item.subtotal.toLocaleString('id-ID')}\n\n`
    })

    receipt += `-----------------------------------\n`
    receipt += `TOTAL: Rp ${order.total.toLocaleString('id-ID')}\n\n`
    receipt += `Metode Pembayaran: ${paymentMethod === 'cash' ? 'Tunai' : paymentMethod === 'card' ? 'Kartu' : 'Transfer'}\n`

    if (paymentMethod === 'cash') {
      receipt += `Uang Diterima: Rp ${order.cashReceived?.toLocaleString('id-ID') || 0}\n`
      receipt += `Kembalian: Rp ${change.toLocaleString('id-ID')}\n`
    }

    if (pointsEarned > 0) {
      receipt += `\nPoin Diperoleh: ${pointsEarned}\n`
    }

    receipt += `
-----------------------------------
Terima kasih atas kunjungan Anda!
Selamat menikmati!
`
    console.log(receipt)

    // In a real application, you would use a print library or send to a thermal printer
    const printWindow = window.open('', '_blank')
    if (printWindow) {
      printWindow.document.write(`<pre>${receipt}</pre>`)
      printWindow.document.close()
      printWindow.print()
    }
  }

  const fetchClosingData = async () => {
    if (!currentShiftId) {
      toast.error('Shift tidak valid')
      return
    }

    setLoadingClosingData(true)
    try {
      const res = await fetch(`/api/orders?isCashierOrder=true&shiftId=${currentShiftId}`)
      const orders: Order[] = await res.json()

      const totalOrders = orders.length
      const totalRevenue = orders.reduce((sum, order) => sum + order.total, 0)
      const totalPoints = orders.reduce((sum, order) => sum + (order.pointsEarned || 0), 0)
      const totalItems = orders.reduce((sum, order) => sum + order.items.reduce((s, i) => s + i.quantity, 0), 0)

      const paymentMethods: { [key: string]: number } = {}
      orders.forEach((order) => {
        const method = order.paymentMethod || 'cash'
        paymentMethods[method] = (paymentMethods[method] || 0) + order.total
      })

      setClosingData({
        totalOrders,
        totalRevenue,
        totalPoints,
        totalItems,
        paymentMethods,
        orders
      })
    } catch (error) {
      console.error('Error fetching closing data:', error)
      toast.error('Gagal memuat data penutupan kasir')
    } finally {
      setLoadingClosingData(false)
    }
  }

  const printClosingReport = () => {
    if (!closingData || !currentShiftId) return

    const date = new Date().toLocaleString('id-ID', {
      dateStyle: 'medium',
      timeStyle: 'short'
    })

    let report = `
╔══════════════════════════════════════╗
║     LAPORAN PENUTUPAN KASIR         ║
╚══════════════════════════════════════╝

Tanggal: ${date}
Kasir: ${user?.username || '-'}
Shift ID: ${currentShiftId.slice(-6).toUpperCase()}

═══════════════════════════════════════
RINGKASAN PENJUALAN
═══════════════════════════════════════

Total Pesanan: ${closingData.totalOrders}
Total Pendapatan: Rp ${closingData.totalRevenue.toLocaleString('id-ID')}
Total Item Terjual: ${closingData.totalItems}
Total Poin: ${closingData.totalPoints}

═══════════════════════════════════════
METODE PEMBAYARAN
═══════════════════════════════════════
`

    Object.entries(closingData.paymentMethods).forEach(([method, amount]) => {
      const methodName = method === 'cash' ? 'Tunai' : method === 'card' ? 'Kartu' : 'Transfer'
      report += `${methodName}: Rp ${amount.toLocaleString('id-ID')}\n`
    })

    report += `
═══════════════════════════════════════
DETAIL PESANAN
═══════════════════════════════════════
`

    closingData.orders.forEach((order, index) => {
      const orderId = order.id.slice(-6).toUpperCase()
      const orderTime = new Date(order.createdAt).toLocaleTimeString('id-ID')
      report += `\n${index + 1}. Order #${orderId} - ${orderTime}\n`
      report += `   Total: Rp ${order.total.toLocaleString('id-ID')}\n`
      order.items.forEach((item) => {
        report += `   - ${item.product.name} x${item.quantity}\n`
      })
    })

    report += `
═══════════════════════════════════════
Laporan ini dicetak pada: ${date}
═══════════════════════════════════════
`

    console.log(report)

    const printWindow = window.open('', '_blank')
    if (printWindow) {
      printWindow.document.write(`<pre>${report}</pre>`)
      printWindow.document.close()
      printWindow.print()
    }
  }

  const handleCloseCashier = async () => {
    if (!currentShiftId || !closingData) return

    try {
      const res = await fetch(`/api/cashier-shifts/${currentShiftId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          totalOrders: closingData.totalOrders,
          totalRevenue: closingData.totalRevenue,
          totalPoints: closingData.totalPoints,
          totalItems: closingData.totalItems,
          paymentMethods: closingData.paymentMethods
        })
      })

      const data = await res.json()

      if (res.ok) {
        toast.success('Shift berhasil ditutup')
        printClosingReport()
        handleLogout()
      } else {
        toast.error(data.error || 'Gagal menutup shift')
      }
    } catch (error) {
      console.error('Error closing shift:', error)
      toast.error('Terjadi kesalahan saat menutup shift')
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('user')
    localStorage.removeItem('token')
    router.push('/login')
  }

  const handleOpenOnlineOrders = async () => {
    setShowOrdersNotification(false)
    setLastCheckedOrderCount(onlineOrderCount)
    setShowOnlineOrdersModal(true)
    await fetchOnlineOrders()
  }

  const handleAcceptOrder = async (orderId: string) => {
    try {
      const res = await fetch(`/api/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'processing' })
      })

      if (res.ok) {
        toast.success('Pesanan diterima')
        await fetchOnlineOrders()
        await checkOnlineOrders()
      } else {
        toast.error('Gagal menerima pesanan')
      }
    } catch (error) {
      console.error('Error accepting order:', error)
      toast.error('Terjadi kesalahan')
    }
  }

  const handleOpenClosingModal = async () => {
    setShowClosingModal(true)
    await fetchClosingData()
  }

  // Filter products
  const filteredProducts = products.filter((product) => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = selectedCategory === 'all' || product.categoryId === selectedCategory
    return matchesSearch && matchesCategory
  })

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 via-white to-orange-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Memuat...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-orange-50 via-white to-orange-50">
      {/* Header */}
      <header className="bg-white shadow-md border-b border-orange-100 sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="bg-gradient-to-br from-orange-500 to-orange-600 p-2 rounded-lg">
                <ShoppingBag className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-800">Kasir</h1>
                <p className="text-sm text-gray-500 flex items-center gap-1">
                  <User className="w-3 h-3" />
                  {user.username}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Online Orders Notification */}
              <Button
                variant="outline"
                size="sm"
                onClick={handleOpenOnlineOrders}
                className="relative border-orange-200 hover:border-orange-400 hover:bg-orange-50"
              >
                <Bell className={`w-4 h-4 ${showOrdersNotification ? 'animate-pulse text-orange-600' : ''}`} />
                {onlineOrderCount > 0 && (
                  <Badge
                    variant="destructive"
                    className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs"
                  >
                    {onlineOrderCount}
                  </Badge>
                )}
              </Button>

              {/* Close Cashier Button */}
              <Button
                variant="outline"
                size="sm"
                onClick={handleOpenClosingModal}
                className="border-orange-200 hover:border-orange-400 hover:bg-orange-50"
              >
                <Receipt className="w-4 h-4 mr-2" />
                Tutup Kasir
              </Button>

              {/* Logout Button */}
              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
                className="border-red-200 hover:border-red-400 hover:bg-red-50 text-red-600"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 container mx-auto px-4 py-6 flex gap-6">
        {/* Product Grid */}
        <div className="flex-1 flex flex-col gap-4">
          {/* Search and Filter */}
          <div className="flex gap-4 flex-wrap">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Cari produk..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 border-orange-200 focus-visible:ring-orange-500"
              />
            </div>

            <div className="flex gap-2 overflow-x-auto pb-2">
              <Button
                variant={selectedCategory === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedCategory('all')}
                className={selectedCategory === 'all' ? 'bg-orange-500 hover:bg-orange-600' : 'border-orange-200'}
              >
                Semua
              </Button>
              {categories.map((category) => (
                <Button
                  key={category.id}
                  variant={selectedCategory === category.id ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedCategory(category.id)}
                  className={selectedCategory === category.id ? 'bg-orange-500 hover:bg-orange-600' : 'border-orange-200'}
                >
                  {category.name}
                </Button>
              ))}
            </div>
          </div>

          {/* Products Grid */}
          {loading ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredProducts.map((product) => (
                <motion.div
                  key={product.id}
                  whileHover={{ scale: 1.02 }}
                  transition={{ type: 'spring', stiffness: 300 }}
                >
                  <Card
                    className="cursor-pointer hover:shadow-lg transition-shadow border-orange-100 overflow-hidden"
                    onClick={() => addToCart(product)}
                  >
                    {product.image && (
                      <div className="relative h-40 bg-orange-50">
                        <img
                          src={product.image}
                          alt={product.name}
                          className="w-full h-full object-cover"
                        />
                        {product.isPromotion && (
                          <Badge className="absolute top-2 left-2 bg-red-500">
                            Promo
                          </Badge>
                        )}
                        {product.isNew && (
                          <Badge className="absolute top-2 right-2 bg-green-500">
                            Baru
                          </Badge>
                        )}
                        {product.stock <= 0 && (
                          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                            <Badge variant="destructive">Habis</Badge>
                          </div>
                        )}
                      </div>
                    )}
                    <CardContent className="p-4">
                      <h3 className="font-semibold text-gray-800 mb-1 line-clamp-1">{product.name}</h3>
                      <p className="text-xs text-gray-500 mb-2 line-clamp-2">{product.description}</p>
                      <div className="flex items-center justify-between">
                        <div>
                          {product.discount > 0 ? (
                            <>
                              <p className="text-sm text-red-500 font-bold">
                                Rp {((product.price * (100 - product.discount)) / 100).toLocaleString('id-ID')}
                              </p>
                              <p className="text-xs text-gray-400 line-through">
                                Rp {product.price.toLocaleString('id-ID')}
                              </p>
                            </>
                          ) : (
                            <p className="text-sm text-orange-600 font-bold">
                              Rp {product.price.toLocaleString('id-ID')}
                            </p>
                          )}
                        </div>
                        <Badge variant="outline" className="text-xs">
                          Stok: {product.stock}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* Shopping Cart Sidebar */}
        <motion.div
          initial={{ x: 300, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="w-80 flex flex-col gap-4"
        >
          <Card className="border-orange-100 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
              <CardTitle className="flex items-center gap-2">
                <ShoppingCart className="w-5 h-5" />
                Keranjang
                {cart.length > 0 && (
                  <Badge variant="secondary" className="ml-auto">
                    {cart.length}
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <ScrollArea className="h-64 pr-4">
                {cart.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-gray-400">
                    <ShoppingBag className="w-12 h-12 mb-2" />
                    <p className="text-sm">Keranjang kosong</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {cart.map((item) => (
                      <motion.div
                        key={item.product.id}
                        layout
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="flex gap-2 p-2 bg-orange-50 rounded-lg"
                      >
                        {item.product.image && (
                          <img
                            src={item.product.image}
                            alt={item.product.name}
                            className="w-16 h-16 object-cover rounded-md"
                          />
                        )}
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-sm text-gray-800 line-clamp-1">{item.product.name}</h4>
                          <p className="text-xs text-orange-600 font-bold">
                            Rp {item.subtotal.toLocaleString('id-ID')}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-6 w-6 p-0 border-orange-200"
                              onClick={() => updateQuantity(item.product.id, -1)}
                            >
                              <Minus className="w-3 h-3" />
                            </Button>
                            <span className="text-sm font-medium w-6 text-center">{item.quantity}</span>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-6 w-6 p-0 border-orange-200"
                              onClick={() => updateQuantity(item.product.id, 1)}
                            >
                              <Plus className="w-3 h-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-6 w-6 p-0 text-red-500 hover:text-red-700 hover:bg-red-50 ml-auto"
                              onClick={() => removeFromCart(item.product.id)}
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </ScrollArea>

              <Separator className="my-4" />

              <div className="space-y-2">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="font-medium">Rp {getCartTotal().toLocaleString('id-ID')}</span>
                </div>
                <div className="flex justify-between items-center text-lg font-bold">
                  <span className="text-gray-800">Total</span>
                  <span className="text-orange-600">Rp {getCartTotal().toLocaleString('id-ID')}</span>
                </div>
              </div>

              <Button
                className="w-full mt-4 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700"
                disabled={cart.length === 0 || processingOrder}
                onClick={() => setShowPaymentModal(true)}
              >
                {processingOrder ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Memproses...
                  </>
                ) : (
                  <>
                    <CreditCard className="w-4 h-4 mr-2" />
                    Bayar
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-orange-100 sticky bottom-0 z-40">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-4">
              <p className="text-gray-600 flex items-center gap-2">
                <User className="w-4 h-4" />
                {user.username}
              </p>
              <p className="text-gray-600 flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                {currentTime.toLocaleDateString('id-ID', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric'
                })}
              </p>
            </div>
            <div className="flex items-center gap-2 text-orange-600 font-medium">
              <Clock className="w-4 h-4" />
              {currentTime.toLocaleTimeString('id-ID')}
            </div>
          </div>
        </div>
      </footer>

      {/* Payment Modal */}
      <AnimatePresence>
        {showPaymentModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => !processingOrder && setShowPaymentModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-xl shadow-2xl w-full max-w-md"
              onClick={(e) => e.stopPropagation()}
            >
              <Card>
                <CardHeader className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
                  <CardTitle className="flex items-center justify-between">
                    <span>Pembayaran</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-white hover:bg-white/20"
                      onClick={() => !processingOrder && setShowPaymentModal(false)}
                      disabled={processingOrder}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                  <div className="text-center py-4">
                    <p className="text-gray-600 mb-1">Total Pembayaran</p>
                    <p className="text-3xl font-bold text-orange-600">
                      Rp {getCartTotal().toLocaleString('id-ID')}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Metode Pembayaran</label>
                    <div className="grid grid-cols-3 gap-2">
                      <Button
                        variant={selectedPaymentMethod === 'cash' ? 'default' : 'outline'}
                        onClick={() => setSelectedPaymentMethod('cash')}
                        className={selectedPaymentMethod === 'cash' ? 'bg-orange-500' : 'border-orange-200'}
                      >
                        <DollarSign className="w-4 h-4 mr-1" />
                        Tunai
                      </Button>
                      <Button
                        variant={selectedPaymentMethod === 'card' ? 'default' : 'outline'}
                        onClick={() => setSelectedPaymentMethod('card')}
                        className={selectedPaymentMethod === 'card' ? 'bg-orange-500' : 'border-orange-200'}
                      >
                        <CreditCard className="w-4 h-4 mr-1" />
                        Kartu
                      </Button>
                      <Button
                        variant={selectedPaymentMethod === 'transfer' ? 'default' : 'outline'}
                        onClick={() => setSelectedPaymentMethod('transfer')}
                        className={selectedPaymentMethod === 'transfer' ? 'bg-orange-500' : 'border-orange-200'}
                      >
                        <Wallet className="w-4 h-4 mr-1" />
                        Transfer
                      </Button>
                    </div>
                  </div>

                  {selectedPaymentMethod === 'cash' && (
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">Uang Diterima</label>
                      <Input
                        type="number"
                        value={paymentReceived || ''}
                        onChange={(e) => setPaymentReceived(Number(e.target.value) || 0)}
                        placeholder="Masukkan jumlah uang"
                        className="border-orange-200 focus-visible:ring-orange-500"
                      />
                      {paymentReceived >= getCartTotal() && (
                        <div className="bg-green-50 p-3 rounded-lg">
                          <p className="text-sm text-gray-600">Kembalian:</p>
                          <p className="text-2xl font-bold text-green-600">
                            Rp {(paymentReceived - getCartTotal()).toLocaleString('id-ID')}
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="bg-orange-50 p-3 rounded-lg">
                    <p className="text-sm text-gray-600">Poin yang akan diperoleh:</p>
                    <p className="text-lg font-bold text-orange-600">
                      +{Math.floor(getCartTotal() / 1000)} poin
                    </p>
                    <p className="text-xs text-gray-500">(1 poin per Rp 1.000)</p>
                  </div>

                  <Button
                    className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700"
                    disabled={processingOrder || (selectedPaymentMethod === 'cash' && paymentReceived < getCartTotal())}
                    onClick={handlePayment}
                  >
                    {processingOrder ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Memproses...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Proses Pembayaran
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Online Orders Modal */}
      <AnimatePresence>
        {showOnlineOrdersModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowOnlineOrdersModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <Card>
                <CardHeader className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
                  <CardTitle className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <ShoppingBag className="w-5 h-5" />
                      Pesanan Online
                      {onlineOrders.length > 0 && (
                        <Badge variant="secondary" className="ml-2">
                          {onlineOrders.length}
                        </Badge>
                      )}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-white hover:bg-white/20"
                      onClick={() => setShowOnlineOrdersModal(false)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <ScrollArea className="h-96 pr-4">
                    {loadingOnlineOrders ? (
                      <div className="flex items-center justify-center h-full">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
                      </div>
                    ) : onlineOrders.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-full text-gray-400">
                        <ShoppingBag className="w-12 h-12 mb-2" />
                        <p className="text-sm">Tidak ada pesanan online</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {onlineOrders.map((order) => (
                          <Card key={order.id} className="border-orange-100">
                            <CardContent className="p-4">
                              <div className="flex items-start justify-between mb-3">
                                <div>
                                  <p className="font-semibold text-gray-800">
                                    Order #{order.id.slice(-6).toUpperCase()}
                                  </p>
                                  <p className="text-sm text-gray-600">{order.userName}</p>
                                </div>
                                <Badge variant="outline" className="text-orange-600 border-orange-200">
                                  {new Date(order.createdAt).toLocaleTimeString('id-ID')}
                                </Badge>
                              </div>

                              <div className="space-y-1 mb-3">
                                <p className="text-xs text-gray-500 flex items-center gap-1">
                                  <Phone className="w-3 h-3" />
                                  {order.userPhone}
                                </p>
                                <p className="text-xs text-gray-500 flex items-start gap-1">
                                  <MapPin className="w-3 h-3 mt-0.5" />
                                  {order.userAddress}
                                </p>
                              </div>

                              <Separator className="my-3" />

                              <div className="space-y-2 mb-3">
                                {order.items.map((item) => (
                                  <div key={item.id} className="flex justify-between text-sm">
                                    <span className="text-gray-700">
                                      {item.product.name} x{item.quantity}
                                    </span>
                                    <span className="font-medium">
                                      Rp {item.subtotal.toLocaleString('id-ID')}
                                    </span>
                                  </div>
                                ))}
                              </div>

                              <Separator className="my-3" />

                              <div className="flex items-center justify-between">
                                <p className="text-sm text-gray-600">Total</p>
                                <p className="text-lg font-bold text-orange-600">
                                  Rp {order.total.toLocaleString('id-ID')}
                                </p>
                              </div>

                              <Button
                                className="w-full mt-4 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700"
                                onClick={() => handleAcceptOrder(order.id)}
                              >
                                <CheckCircle className="w-4 h-4 mr-2" />
                                Terima Pesanan
                              </Button>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}
                  </ScrollArea>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Closing Modal */}
      <AnimatePresence>
        {showClosingModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => !processingOrder && setShowClosingModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <Card>
                <CardHeader className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
                  <CardTitle className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <FileText className="w-5 h-5" />
                      Tutup Kasir
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-white hover:bg-white/20"
                      onClick={() => !processingOrder && setShowClosingModal(false)}
                      disabled={processingOrder}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  {loadingClosingData ? (
                    <div className="flex items-center justify-center h-64">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
                    </div>
                  ) : closingData ? (
                    <div className="space-y-6">
                      {/* Summary Cards */}
                      <div className="grid grid-cols-2 gap-4">
                        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
                          <CardContent className="p-4">
                            <div className="flex items-center gap-2 text-orange-600 mb-2">
                              <ShoppingBag className="w-4 h-4" />
                              <span className="text-sm font-medium">Total Pesanan</span>
                            </div>
                            <p className="text-2xl font-bold text-gray-800">{closingData.totalOrders}</p>
                          </CardContent>
                        </Card>

                        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
                          <CardContent className="p-4">
                            <div className="flex items-center gap-2 text-green-600 mb-2">
                              <TrendingUp className="w-4 h-4" />
                              <span className="text-sm font-medium">Total Pendapatan</span>
                            </div>
                            <p className="text-2xl font-bold text-gray-800">
                              Rp {closingData.totalRevenue.toLocaleString('id-ID')}
                            </p>
                          </CardContent>
                        </Card>

                        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
                          <CardContent className="p-4">
                            <div className="flex items-center gap-2 text-blue-600 mb-2">
                              <Package className="w-4 h-4" />
                              <span className="text-sm font-medium">Total Item</span>
                            </div>
                            <p className="text-2xl font-bold text-gray-800">{closingData.totalItems}</p>
                          </CardContent>
                        </Card>

                        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
                          <CardContent className="p-4">
                            <div className="flex items-center gap-2 text-purple-600 mb-2">
                              <Star className="w-4 h-4" />
                              <span className="text-sm font-medium">Total Poin</span>
                            </div>
                            <p className="text-2xl font-bold text-gray-800">{closingData.totalPoints}</p>
                          </CardContent>
                        </Card>
                      </div>

                      {/* Payment Methods */}
                      <div>
                        <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                          <Wallet className="w-4 h-4" />
                          Metode Pembayaran
                        </h3>
                        <div className="grid grid-cols-3 gap-2">
                          {Object.entries(closingData.paymentMethods).map(([method, amount]) => (
                            <Card key={method} className="border-orange-100">
                              <CardContent className="p-3 text-center">
                                <p className="text-xs text-gray-600 mb-1">
                                  {method === 'cash' ? 'Tunai' : method === 'card' ? 'Kartu' : 'Transfer'}
                                </p>
                                <p className="text-sm font-bold text-orange-600">
                                  Rp {amount.toLocaleString('id-ID')}
                                </p>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex gap-3">
                        <Button
                          variant="outline"
                          className="flex-1 border-orange-200 hover:border-orange-400 hover:bg-orange-50"
                          onClick={printClosingReport}
                        >
                          <Printer className="w-4 h-4 mr-2" />
                          Cetak Laporan
                        </Button>
                        <Button
                          className="flex-1 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700"
                          onClick={handleCloseCashier}
                          disabled={processingOrder}
                        >
                          {processingOrder ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                              Memproses...
                            </>
                          ) : (
                            <>
                              <CheckCircle className="w-4 h-4 mr-2" />
                              Tutup Shift & Logout
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  ) : null}
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
