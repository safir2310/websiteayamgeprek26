'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from '@/components/ui/dialog'
import { motion } from 'framer-motion'
import {
  ChefHat,
  User,
  ShoppingCart,
  Star,
  LogOut,
  MapPin,
  Phone,
  Mail,
  Printer,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  ShoppingBag,
  Zap,
  Copy
} from 'lucide-react'
import { useWebSocket } from '@/hooks/useWebSocket'
import { toast } from 'sonner'

interface User {
  id: string
  username: string
  email: string
  phone: string
  address: string | null
  role: string
  points: number
}

interface Order {
  id: string
  total: number
  status: string
  createdAt: string
  pointsEarned: number
  items: {
    product: {
      name: string
      price: number
    }
    quantity: number
    subtotal: number
  }[]
}

interface PointHistory {
  id: string
  type: string
  points: number
  description: string | null
  createdAt: string
}

interface RedeemableProduct {
  id: string
  name: string
  description: string | null
  price: number
  image: string | null
  redeemPoints: number
  stock: number
  category: {
    name: string
  }
  canAfford?: boolean
}

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null)
  const [orders, setOrders] = useState<Order[]>([])
  const [pointHistory, setPointHistory] = useState<PointHistory[]>([])
  const [redeemableProducts, setRedeemableProducts] = useState<RedeemableProduct[]>([])
  const [isEditing, setIsEditing] = useState(false)
  const [editForm, setEditForm] = useState({
    username: '',
    email: '',
    phone: '',
    address: ''
  })
  const [loading, setLoading] = useState(true)
  const [exchangingProductId, setChangingProductId] = useState<string | null>(null)
  const [redeemCodeDialog, setRedeemCodeDialog] = useState<{
    isOpen: boolean
    code: string
    productName: string
  }>({ isOpen: false, code: '', productName: '' })


  // WebSocket connection
  useWebSocket(user?.id || null, user?.role || null, {
    onOrderStatusChanged: (data) => {
      // Update orders when status changes
      setOrders((prevOrders) =>
        prevOrders.map((order) =>
          order.id === data.orderId
            ? { ...order, status: data.status }
            : order
        )
      )
    },
    onPointsChanged: (data) => {
      // Update user points
      if (user && data.userId === user.id) {
        // Use totalPoints from event if available, otherwise calculate
        const newPoints = data.totalPoints !== undefined
          ? data.totalPoints
          : user.points + (data.type === 'earned' ? (data.pointsAdded || data.points || 0) : -(data.pointsDeducted || data.points || 0))

        setUser({ ...user, points: newPoints })

        // Update localStorage to persist the new points
        const updatedUser = { ...user, points: newPoints }
        localStorage.setItem('user', JSON.stringify(updatedUser))

        // Refresh point history
        fetch(`/api/points/history?userId=${user.id}`)
          .then((res) => res.json())
          .then((data) => setPointHistory(data))

        // Update redeemable products canAfford status
        setRedeemableProducts(prevProducts =>
          prevProducts.map(p => ({
            ...p,
            canAfford: newPoints >= p.redeemPoints
          }))
        )

        // Show toast notification
        if (data.type === 'earned') {
          toast.success(`+${data.pointsAdded || data.points} Poin Didapat!`, {
            description: data.description || 'Pesanan selesai',
            position: 'top-center'
          })
        } else if (data.type === 'redeemed') {
          toast.warning(`-${data.pointsDeducted || data.points} Poin Digunakan`, {
            description: data.description || 'Menukar poin',
            position: 'top-center'
          })
        }
      }
    }
  })

  useEffect(() => {
    const userData = localStorage.getItem('user')
    if (!userData) {
      window.location.href = '/login'
      return
    }

    const parsedUser = JSON.parse(userData)
    setUser(parsedUser)
    setEditForm({
      username: parsedUser.username,
      email: parsedUser.email,
      phone: parsedUser.phone,
      address: parsedUser.address || ''
    })

    fetchData(parsedUser.id)

    // Add visibility change listener to refresh data when tab becomes active
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && parsedUser.id) {
        console.log('[Dashboard] Tab became visible, refreshing data...')
        fetchData(parsedUser.id)
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)

    // Cleanup
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [])

  const fetchData = async (userId: string) => {
    try {
      // Fetch current user data to get latest points
      const userRes = await fetch(`/api/user/${userId}`)
      const ordersRes = await fetch(`/api/orders?userId=${userId}`)
      const pointsRes = await fetch(`/api/points/history?userId=${userId}`)
      const productsRes = await fetch('/api/redeem-product')

      let currentPoints = user?.points || 0

      // Update user with fresh data from database
      if (userRes.ok) {
        const userData = await userRes.json()
        setUser(userData)
        localStorage.setItem('user', JSON.stringify(userData))
        currentPoints = userData.points
      }

      if (ordersRes.ok) {
        const ordersData = await ordersRes.json()
        setOrders(ordersData)
      }

      if (pointsRes.ok) {
        const pointsData = await pointsRes.json()
        setPointHistory(pointsData)
      }

      if (productsRes.ok) {
        const productsData = await productsRes.json()
        // Add canAfford property to each product using current points
        const productsWithAffordability = productsData.map((p: any) => ({
          ...p,
          canAfford: currentPoints >= p.redeemPoints
        }))
        setRedeemableProducts(productsWithAffordability)
      }
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('user')
    localStorage.removeItem('token')
    window.location.href = '/'
  }

  const handleUpdateProfile = async () => {
    if (!user) return

    try {
      const res = await fetch(`/api/user/${user.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm)
      })

      if (res.ok) {
        const updatedUser = await res.json()
        setUser(updatedUser)
        localStorage.setItem('user', JSON.stringify(updatedUser))
        setIsEditing(false)

        toast.success('Profil Berhasil Diupdate!', {
          description: 'Perubahan profil Anda telah disimpan',
          position: 'top-center'
        })
      } else {
        const data = await res.json()
        toast.error('Gagal Update Profil', {
          description: data.error || 'Gagal mengupdate profil',
          position: 'top-center'
        })
      }
    } catch (error) {
      toast.error('Terjadi Kesalahan', {
        description: 'Silakan coba lagi nanti',
        position: 'top-center'
      })
    }
  }

  const handleExchangeProduct = async (productId: string) => {
    if (!user) return

    const product = redeemableProducts.find(p => p.id === productId)
    if (!product) return

    if (user.points < product.redeemPoints) {
      toast.warning('Poin Tidak Cukup', {
        description: `Anda membutuhkan ${product.redeemPoints} poin`,
        position: 'top-center'
      })
      return
    }

    if (product.stock <= 0) {
      toast.error('Stok Habis', {
        description: 'Produk ini sudah habis',
        position: 'top-center'
      })
      return
    }

    setChangingProductId(productId)

    try {
      const res = await fetch('/api/redeem-product', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          productId
        })
      })

      if (res.ok) {
        const data = await res.json()
        
        // Show redeem code dialog
        setRedeemCodeDialog({
          isOpen: true,
          code: data.redeemCode,
          productName: product.name
        })
        
        // Refresh redeemable products with updated stock
        const productsRes = await fetch('/api/redeem-product')
        if (productsRes.ok) {
          const productsData = await productsRes.json()
          // Update canAfford based on remaining points
          const productsWithAffordability = productsData.map((p: any) => ({
            ...p,
            canAfford: data.remainingPoints >= p.redeemPoints
          }))
          setRedeemableProducts(productsWithAffordability)
        }

        toast.success('Berhasil Menukar Poin!', {
          description: `Anda mendapatkan ${product.name}`,
          position: 'top-center'
        })
      } else {
        const errorData = await res.json()
        toast.error('Gagal Menukar Poin', {
          description: errorData.error || 'Gagal menukar poin',
          position: 'top-center'
        })
      }
    } catch (error) {
      toast.error('Terjadi Kesalahan', {
        description: 'Silakan coba lagi nanti',
        position: 'top-center'
      })
    } finally {
      setChangingProductId(null)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge className="bg-yellow-500"><Clock className="w-3 h-3 mr-1" /> Menunggu</Badge>
      case 'approved':
        return <Badge className="bg-blue-500"><CheckCircle className="w-3 h-3 mr-1" /> Disetujui</Badge>
      case 'processing':
        return <Badge className="bg-purple-500"><AlertCircle className="w-3 h-3 mr-1" /> Diproses</Badge>
      case 'completed':
        return <Badge className="bg-green-500"><CheckCircle className="w-3 h-3 mr-1" /> Selesai</Badge>
      case 'cancelled':
        return <Badge className="bg-red-500"><XCircle className="w-3 h-3 mr-1" /> Batal</Badge>
      default:
        return <Badge>{status}</Badge>
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      toast.success('Kode Berhasil Disalin!', {
        description: 'Kode telah disalin ke clipboard',
        position: 'top-center'
      })
    }).catch(() => {
      toast.error('Gagal Menyalin Kode', {
        description: 'Silakan salin manual',
        position: 'top-center'
      })
    })
  }

  const printReceipt = (order: Order) => {
    const printWindow = window.open('', '_blank')
    if (!printWindow) return

    const orderId = order.id.slice(-6).toUpperCase()
    let receiptContent = `
      <html>
        <head>
          <title>Struk Pesanan #${orderId}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto; }
            .header { text-align: center; margin-bottom: 20px; }
            .header h1 { color: #f97316; margin: 0; }
            .order-info { margin-bottom: 20px; padding: 10px; background: #fff7ed; border-radius: 8px; }
            .items { margin-bottom: 20px; }
            .item { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #f1f5f9; }
            .total { font-size: 18px; font-weight: bold; text-align: right; margin-top: 20px; color: #f97316; }
            .status { text-align: center; margin-top: 20px; padding: 10px; border-radius: 8px; }
            .footer { text-align: center; margin-top: 30px; color: #64748b; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>AYAM GEPREK SAMBAL IJO</h1>
            <p>Sambal Pedas Mantap</p>
          </div>
          <div class="order-info">
            <p><strong>ID Pesanan:</strong> #${orderId}</p>
            <p><strong>Tanggal:</strong> ${new Date(order.createdAt).toLocaleString('id-ID')}</p>
            <p><strong>Status:</strong> ${order.status}</p>
          </div>
          <div class="items">
            <h3>Detail Pesanan:</h3>
    `

    order.items.forEach((item, index) => {
      receiptContent += `
        <div class="item">
          <span>${index + 1}. ${item.product.name} x${item.quantity}</span>
          <span>Rp ${item.subtotal.toLocaleString('id-ID')}</span>
        </div>
      `
    })

    receiptContent += `
          </div>
          <div class="total">
            Total: Rp ${order.total.toLocaleString('id-ID')}
          </div>
          <div class="status">
            ${getStatusBadge(order.status).props.children}
          </div>
          ${order.pointsEarned > 0 ? `<p style="text-align: center; margin-top: 20px; color: green;">+${order.pointsEarned} Poin didapat!</p>` : ''}
          <div class="footer">
            <p>Terima kasih telah berbelanja di Ayam Geprek Sambal Ijo</p>
            <p>Jl. Medan – Banda Aceh, Simpang Camat, Gampong Tijue, Kec. Pidie, Kab. Pidie, 24151</p>
            <p>085260812758</p>
          </div>
        </body>
      </html>
    `

    printWindow.document.write(receiptContent)
    printWindow.document.close()
    printWindow.print()
  }

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-900 via-orange-700 to-orange-500">
        <div className="text-center">
          <ChefHat className="w-16 h-16 text-orange-300 mx-auto mb-4 animate-pulse" />
          <p className="text-gray-300">Memuat...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-orange-900 via-orange-700 to-orange-500">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm shadow-sm border-b border-orange-100">
        <div className="container mx-auto px-2 sm:px-4 py-2 sm:py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="bg-gradient-to-br from-orange-500 to-orange-600 p-1.5 sm:p-2 rounded-full shadow-lg">
                <ChefHat className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <div>
                <h1 className="text-lg sm:text-xl font-bold text-orange-600 leading-tight">
                  AYAM GEPREK SAMBAL IJO
                </h1>
                <p className="text-[10px] sm:text-xs text-gray-500">Dashboard</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={() => window.location.href = '/'}
                className="border-orange-200 text-orange-600 hover:bg-orange-50 px-2 sm:px-3 py-1.5 sm:py-2 h-8 sm:h-9 text-xs sm:text-sm"
              >
                <ShoppingCart className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-2" />
                <span className="hidden sm:inline">Belanja</span>
              </Button>
              <Button
                variant="outline"
                onClick={handleLogout}
                className="border-red-200 text-red-600 hover:bg-red-50 px-2 sm:px-3 py-1.5 sm:py-2 h-8 sm:h-9 text-xs sm:text-sm"
              >
                <LogOut className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-2" />
                <span className="hidden sm:inline">Keluar</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 container mx-auto px-2 sm:px-4 py-3 sm:py-6">
        {/* User Info Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 sm:mb-6"
        >
          <Card className="border-2 border-orange-100 shadow-lg overflow-hidden">
            <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white p-3 sm:p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 sm:gap-4">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 bg-white/20 rounded-full flex items-center justify-center">
                    <User className="w-6 h-6 sm:w-8 sm:h-8" />
                  </div>
                  <div>
                    <h2 className="text-xl sm:text-2xl font-bold">{user.username}</h2>
                    <p className="text-[10px] sm:text-sm text-orange-100">{user.email}</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-1 sm:gap-2 mb-1">
                    <Star className="w-4 h-4 sm:w-5 sm:h-5 fill-yellow-300 text-yellow-300" />
                    <span className="text-xl sm:text-2xl font-bold">{user.points}</span>
                  </div>
                  <p className="text-[10px] sm:text-sm text-orange-100">Poin</p>
                </div>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Tabs */}
        <Tabs defaultValue="orders" className="space-y-3 sm:space-y-6">
          <TabsList className="w-full bg-orange-50 p-0.5 sm:p-1 flex overflow-x-auto scrollbar-hide gap-0.5 sm:gap-1">
            <TabsTrigger value="orders" className="data-[state=active]:bg-orange-500 data-[state=active]:text-white flex-1 min-w-max px-2 sm:px-3 py-2 sm:py-2.5 text-xs sm:text-sm">
              <ShoppingCart className="w-3.5 h-3.5 sm:w-4 sm:h-4 sm:mr-2" />
              <span className="hidden sm:inline">Pesanan Saya</span>
              <span className="sm:hidden">Pesanan</span>
            </TabsTrigger>
            <TabsTrigger value="points" className="data-[state=active]:bg-orange-500 data-[state=active]:text-white flex-1 min-w-max px-2 sm:px-3 py-2 sm:py-2.5 text-xs sm:text-sm">
              <Star className="w-3.5 h-3.5 sm:w-4 sm:h-4 sm:mr-2" />
              <span className="hidden sm:inline">Poin & Redeem</span>
              <span className="sm:hidden">Poin</span>
            </TabsTrigger>
            <TabsTrigger value="profile" className="data-[state=active]:bg-orange-500 data-[state=active]:text-white flex-1 min-w-max px-2 sm:px-3 py-2 sm:py-2.5 text-xs sm:text-sm">
              <User className="w-3.5 h-3.5 sm:w-4 sm:h-4 sm:mr-2" />
              <span className="hidden sm:inline">Profil</span>
              <span className="sm:hidden">Profil</span>
            </TabsTrigger>
          </TabsList>

          {/* Orders Tab */}
          <TabsContent value="orders">
            <Card className="border-2 border-orange-100">
              <CardHeader className="px-3 sm:px-6 py-3 sm:py-4">
                <CardTitle className="flex items-center gap-2 text-orange-600 text-base sm:text-lg">
                  <ShoppingCart className="w-4 h-4 sm:w-5 sm:h-5" />
                  Riwayat Pesanan
                </CardTitle>
              </CardHeader>
              <CardContent className="px-3 sm:px-6">
                <ScrollArea className="h-[350px] sm:h-[500px]">
                  <div className="space-y-2 sm:space-y-4">
                    {orders.length === 0 ? (
                      <div className="text-center py-12 text-gray-500">
                        <ShoppingCart className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                        <p>Belum ada pesanan</p>
                      </div>
                    ) : (
                      orders.map((order) => (
                        <motion.div
                          key={order.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          className="border border-orange-100 rounded-xl p-2.5 sm:p-4 hover:shadow-md transition-shadow"
                        >
                          <div className="flex items-start justify-between mb-2 sm:mb-3">
                            <div>
                              <h4 className="font-bold text-gray-800 text-sm sm:text-base">
                                Order #{order.id.slice(-6).toUpperCase()}
                              </h4>
                              <p className="text-[10px] sm:text-sm text-gray-500">
                                {new Date(order.createdAt).toLocaleString('id-ID')}
                              </p>
                            </div>
                            {getStatusBadge(order.status)}
                          </div>
                          <div className="space-y-1 sm:space-y-2 mb-2 sm:mb-3">
                            {order.items.map((item, index) => (
                              <div key={index} className="flex justify-between text-xs sm:text-sm">
                                <span>{item.product.name} x{item.quantity}</span>
                                <span>Rp {item.subtotal.toLocaleString('id-ID')}</span>
                              </div>
                            ))}
                          </div>
                          <div className="flex items-center justify-between pt-2 sm:pt-3 border-t border-orange-100">
                            <div className="text-base sm:text-lg font-bold text-orange-600">
                              Total: Rp {order.total.toLocaleString('id-ID')}
                            </div>
                            <div className="flex gap-1.5 sm:gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => printReceipt(order)}
                                className="border-orange-200 text-orange-600 hover:bg-orange-50 px-2 sm:px-3 h-7 sm:h-8 text-xs"
                              >
                                <Printer className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-1" />
                                <span className="hidden sm:inline">Cetak</span>
                              </Button>
                            </div>
                          </div>
                          {order.pointsEarned > 0 && order.status === 'completed' && (
                            <div className="mt-2 sm:mt-3 p-1.5 sm:p-2 bg-green-50 rounded-lg text-center text-green-600 text-[10px] sm:text-sm font-medium">
                              +{order.pointsEarned} Poin didapat!
                            </div>
                          )}
                        </motion.div>
                      ))
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Points & Redeem Tab */}
          <TabsContent value="points">
            <Tabs defaultValue="products" className="space-y-6">
              <TabsList className="w-full bg-orange-50 p-0.5 sm:p-1 flex gap-0.5 sm:gap-1">
                <TabsTrigger value="products" className="data-[state=active]:bg-orange-500 data-[state=active]:text-white flex-1 min-w-max px-2 sm:px-3 py-2 sm:py-2.5 text-xs sm:text-sm">
                  <ShoppingBag className="w-3.5 h-3.5 sm:w-4 sm:h-4 sm:mr-2" />
                  <span className="hidden sm:inline">Produk Poin</span>
                  <span className="sm:hidden">Produk</span>
                </TabsTrigger>
                <TabsTrigger value="history" className="data-[state=active]:bg-orange-500 data-[state=active]:text-white flex-1 min-w-max px-2 sm:px-3 py-2 sm:py-2.5 text-xs sm:text-sm">
                  <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4 sm:mr-2" />
                  <span className="hidden sm:inline">Riwayat</span>
                  <span className="sm:hidden">Riwayat</span>
                </TabsTrigger>
              </TabsList>

              {/* Products for Points Sub-Tab */}
              <TabsContent value="products">
                <Card className="border-2 border-orange-100">
                  <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2 px-3 sm:px-6 py-3 sm:py-4">
                    <div className="space-y-0.5 sm:space-y-1">
                      <CardTitle className="flex items-center gap-2 text-orange-600 text-base sm:text-lg">
                        <ShoppingBag className="w-4 h-4 sm:w-5 sm:h-5" />
                        Produk yang Bisa Ditukar
                      </CardTitle>
                      <p className="text-[10px] sm:text-sm text-gray-500">Poin Anda: <span className="font-bold text-orange-600">{user.points}</span></p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => user && fetchData(user.id)}
                      className="border-orange-200 text-orange-600 hover:bg-orange-50 px-2 sm:px-3 h-7 sm:h-8 text-xs"
                    >
                      <ShoppingCart className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-2" />
                      <span className="hidden sm:inline">Refresh</span>
                    </Button>
                  </CardHeader>
                  <CardContent className="px-3 sm:px-6">
                    {redeemableProducts.length === 0 ? (
                      <div className="text-center py-12 text-gray-500">
                        <ShoppingBag className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                        <p>Belum ada produk yang tersedia</p>
                        <p className="text-xs mt-2">Tanya admin untuk menambahkan produk tukar point</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-4">
                        {redeemableProducts.map((product) => (
                          <Card 
                            key={product.id} 
                            className={`overflow-hidden border-2 transition-all duration-300 shadow-sm hover:shadow-xl ${
                              product.canAfford 
                                ? 'border-orange-200 bg-white hover:border-orange-400 cursor-pointer' 
                                : 'border-gray-200 bg-gray-50 opacity-60'
                            }`}
                          >
                            <div className="relative aspect-square bg-gradient-to-br from-orange-50 to-orange-100 overflow-hidden">
                              {product.image ? (
                                <img
                                  src={product.image}
                                  alt={product.name}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <ShoppingBag className="w-16 h-16 text-orange-300" />
                                </div>
                              )}
                              <div className="absolute top-2 right-2">
                                <Badge className="bg-purple-500 text-white text-xs font-bold">
                                  {product.redeemPoints} Poin
                                </Badge>
                              </div>
                              {product.canAfford && product.stock > 0 && (
                                <div className="absolute top-2 left-2">
                                  <Badge className="bg-green-500 text-white text-[10px] font-bold">
                                    Tersedia
                                  </Badge>
                                </div>
                              )}
                            </div>
                            <CardContent className="p-4">
                              <h3 className="font-bold text-gray-800 mb-1 line-clamp-1">{product.name}</h3>
                              {product.description && (
                                <p className="text-sm text-gray-500 mb-2 line-clamp-2">{product.description}</p>
                              )}
                              <div className="flex items-center justify-between mb-3">
                                <p className="text-sm text-gray-500">Harga:</p>
                                <p className="font-bold text-orange-600">Rp {product.price.toLocaleString('id-ID')}</p>
                              </div>
                              <div className="flex items-center justify-between mb-2">
                                <p className="text-sm text-gray-500">Stok:</p>
                                <p className={`font-semibold ${product.stock > 5 ? 'text-green-600' : product.stock > 0 ? 'text-yellow-600' : 'text-red-500'}`}>
                                  {product.stock}
                                </p>
                              </div>
                              <Button
                                onClick={() => handleExchangeProduct(product.id)}
                                disabled={exchangingProductId === product.id || !product.canAfford || product.stock <= 0}
                                className={`w-full ${
                                  !product.canAfford || product.stock <= 0
                                    ? 'bg-gray-400 cursor-not-allowed'
                                    : 'bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700'
                                } text-white`}
                              >
                                {exchangingProductId === product.id ? (
                                  <div className="flex items-center justify-center gap-2">
                                    <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                                    <span>Proses...</span>
                                  </div>
                                ) : (
                                  <>
                                    {product.canAfford && product.stock > 0 ? 'Tukar Poin' : 'Poin Tidak Cukup'}
                                  </>
                                )}
                              </Button>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Point History Sub-Tab */}
              <TabsContent value="history">
                <Card className="border-2 border-orange-100">
                  <CardHeader className="px-3 sm:px-6 py-3 sm:py-4">
                    <CardTitle className="flex items-center gap-2 text-orange-600 text-base sm:text-lg">
                      <Star className="w-4 h-4 sm:w-5 sm:h-5" />
                      Riwayat Poin
                    </CardTitle>
                    <p className="text-[10px] sm:text-sm text-gray-500">Total poin Anda: <span className="font-bold text-orange-600">{user.points}</span></p>
                  </CardHeader>
                  <CardContent className="px-3 sm:px-6">
                    <ScrollArea className="h-[250px] sm:h-[300px]">
                      <div className="space-y-2 sm:space-y-3">
                        {pointHistory.length === 0 ? (
                          <div className="text-center py-8 text-gray-500">
                            <Star className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                            <p>Belum ada riwayat poin</p>
                          </div>
                        ) : (
                          pointHistory.map((history) => (
                            <div
                              key={history.id}
                              className={`flex items-center justify-between p-2 sm:p-3 rounded-lg ${
                                history.type === 'earned'
                                  ? 'bg-green-50'
                                  : history.type === 'exchanged'
                                    ? 'bg-purple-50'
                                    : 'bg-orange-50'
                              }`}
                            >
                              <div>
                                <p className="font-medium text-xs sm:text-sm text-gray-800">
                                  {history.description || 
                                    (history.type === 'earned' 
                                      ? 'Poin didapat' 
                                      : history.type === 'exchanged'
                                        ? 'Tukar dengan produk'
                                        : 'Poin ditukar'
                                    )
                                  }
                                </p>
                                <p className="text-xs text-gray-500">
                                  {new Date(history.createdAt).toLocaleString('id-ID')}
                                </p>
                              </div>
                              <span
                                className={`font-bold ${
                                  history.type === 'earned' 
                                    ? 'text-green-600' 
                                    : history.type === 'exchanged'
                                      ? 'text-purple-600'
                                      : 'text-orange-600'
                                }`}
                              >
                                {history.type === 'earned' || history.type === 'exchanged' ? '+' : '-'}{history.points}
                              </span>
                            </div>
                          ))
                        )}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </TabsContent>

          {/* Profile Tab */}
          <TabsContent value="profile">
            <Card className="border-2 border-orange-100 max-w-2xl mx-auto">
              <CardHeader className="px-3 sm:px-6 py-3 sm:py-4">
                <CardTitle className="flex items-center gap-2 text-orange-600 text-base sm:text-lg">
                  <User className="w-4 h-4 sm:w-5 sm:h-5" />
                  Profil Saya
                </CardTitle>
              </CardHeader>
              <CardContent className="px-3 sm:px-6 space-y-3 sm:space-y-4">
                <div className="space-y-1.5 sm:space-y-2">
                  <label className="text-[10px] sm:text-sm font-medium text-gray-700">Username</label>
                  {isEditing ? (
                    <Input
                      value={editForm.username}
                      onChange={(e) => setEditForm({ ...editForm, username: e.target.value })}
                      className="border-orange-200 focus-visible:ring-orange-500 text-sm"
                    />
                  ) : (
                    <p className="text-gray-800 font-medium text-sm sm:text-base">{user.username}</p>
                  )}
                </div>

                <div className="space-y-1.5 sm:space-y-2">
                  <label className="text-[10px] sm:text-sm font-medium text-gray-700">Email</label>
                  {isEditing ? (
                    <Input
                      type="email"
                      value={editForm.email}
                      onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                      className="border-orange-200 focus-visible:ring-orange-500 text-sm"
                    />
                  ) : (
                    <div className="flex items-center gap-2 text-gray-800">
                      <Mail className="w-4 h-4 text-gray-500" />
                      <span className="font-medium">{user.email}</span>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">No HP</label>
                  {isEditing ? (
                    <Input
                      type="tel"
                      value={editForm.phone}
                      onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                      className="border-orange-200 focus-visible:ring-orange-500"
                    />
                  ) : (
                    <div className="flex items-center gap-2 text-gray-800">
                      <Phone className="w-4 h-4 text-gray-500" />
                      <span className="font-medium">{user.phone}</span>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Alamat</label>
                  {isEditing ? (
                    <Textarea
                      value={editForm.address}
                      onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                      className="border-orange-200 focus-visible:ring-orange-500 min-h-[100px]"
                    />
                  ) : (
                    <div className="flex items-start gap-2 text-gray-800">
                      <MapPin className="w-4 h-4 text-gray-500 mt-1 flex-shrink-0" />
                      <span className="font-medium">{user.address || 'Belum diisi'}</span>
                    </div>
                  )}
                </div>

                <div className="flex gap-3 pt-4">
                  {isEditing ? (
                    <>
                      <Button
                        onClick={handleUpdateProfile}
                        className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700"
                      >
                        Simpan
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setIsEditing(false)
                          setEditForm({
                            username: user.username,
                            email: user.email,
                            phone: user.phone,
                            address: user.address || ''
                          })
                        }}
                        className="border-orange-200 text-orange-600 hover:bg-orange-50"
                      >
                        Batal
                      </Button>
                    </>
                  ) : (
                    <Button
                      onClick={() => setIsEditing(true)}
                      variant="outline"
                      className="border-orange-200 text-orange-600 hover:bg-orange-50"
                    >
                      Edit Profil
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      {/* Footer */}
      <footer className="bg-gradient-to-b from-orange-800 to-orange-900 border-t border-orange-700 py-4 sm:py-6">
        <div className="container mx-auto px-2 sm:px-4 text-center text-gray-300 text-[10px] sm:text-sm">
          © 2026 Ayam Geprek Sambal Ijo. All rights reserved.
        </div>
      </footer>

      {/* Redeem Code Dialog */}
      <Dialog open={redeemCodeDialog.isOpen} onOpenChange={(open) => setRedeemCodeDialog({ ...redeemCodeDialog, isOpen: open })}>
        <DialogContent className="max-w-md mx-4">
          <DialogHeader className="px-4 sm:px-6 py-3 sm:py-4">
            <DialogTitle className="text-green-600 text-base sm:text-lg">🎉 Kode Redeem Anda!</DialogTitle>
            <DialogDescription className="text-xs sm:text-sm">
              Simpan kode ini untuk mengklaim produk gratis Anda
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 sm:space-y-4 py-3 sm:py-4 px-4 sm:px-6">
            <div className="bg-gradient-to-br from-orange-50 to-orange-100 border-2 border-orange-200 rounded-xl p-4 sm:p-6 text-center">
              <p className="text-xs sm:text-sm text-gray-600 mb-1 sm:mb-2">Produk:</p>
              <p className="font-bold text-base sm:text-lg text-gray-800 mb-2 sm:mb-4">{redeemCodeDialog.productName}</p>
              
              <p className="text-xs sm:text-sm text-gray-600 mb-1 sm:mb-2">Kode Redeem:</p>
              <div className="flex items-center gap-2 bg-white rounded-lg p-2 sm:p-3 border-2 border-dashed border-orange-300">
                <motion.p 
                  className="text-xl sm:text-3xl font-mono font-bold text-orange-600 tracking-wider flex-1"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  {redeemCodeDialog.code}
                </motion.p>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => copyToClipboard(redeemCodeDialog.code)}
                  className="hover:bg-orange-100 text-orange-600 w-8 h-8 sm:w-10 sm:h-10"
                >
                  <Copy className="w-4 h-4 sm:w-5 sm:h-5" />
                </Button>
              </div>
              
              <div className="mt-3 sm:mt-4 p-2 sm:p-3 bg-white/60 rounded-lg">
                <p className="text-[10px] sm:text-xs text-gray-600">
                  <span className="font-semibold text-orange-600">💡 Tips:</span> 
                  Gunakan kode ini di halaman utama untuk mendapatkan produk gratis
                </p>
              </div>
            </div>
            
            <div className="flex gap-2 sm:gap-3">
              <Button
                variant="outline"
                onClick={() => copyToClipboard(redeemCodeDialog.code)}
                className="flex-1 border-orange-200 text-orange-600 hover:bg-orange-50 text-xs sm:text-sm px-2 sm:px-3 h-8 sm:h-10"
              >
                <Copy className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                Salin Kode
              </Button>
              <Button
                onClick={() => setRedeemCodeDialog({ isOpen: false, code: '', productName: '' })}
                className="flex-1 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white text-xs sm:text-sm px-2 sm:px-3 h-8 sm:h-10"
              >
                Mengerti
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
