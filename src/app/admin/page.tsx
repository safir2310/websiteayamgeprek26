'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { ScrollArea } from '@/components/ui/scroll-area'
import ImageUpload from '@/components/ImageUpload'
import ExportReportDialog from '@/components/ExportReportDialog'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter
} from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { motion } from 'framer-motion'
import {
  ChefHat,
  Package,
  Users,
  ShoppingCart,
  LogOut,
  Plus,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  AlertCircle,
  Clock,
  Printer,
  ShoppingBag,
  Store,
  MapPin,
  Phone as PhoneIcon,
  Instagram as InstagramIcon,
  Facebook as FacebookIcon,
  Clock as ClockIcon,
  Download
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
  createdAt: string
}

interface Product {
  id: string
  name: string
  description: string | null
  price: number
  discount: number
  image: string | null
  stock: number
  categoryId: string
  isPromotion: boolean
  isNew: boolean
  isRedeemable: boolean
  redeemPoints: number
  order: number
  category: {
    name: string
  }
}

interface Category {
  id: string
  name: string
  slug: string
  description: string | null
  order: number
}

interface Order {
  id: string
  userId: string
  userName: string
  userPhone: string
  userAddress: string
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
  user: {
    username: string
  }
}

interface ShopProfile {
  id: string
  storeName: string
  slogan: string
  whatsapp: string
  instagram: string | null
  facebook: string | null
  address: string | null
  operatingHours: string
  logo: string | null
  updatedAt: string
  createdAt: string
}

export default function AdminPage() {
  const [user, setUser] = useState<any>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [orders, setOrders] = useState<Order[]>([])
  const [redeemableProducts, setRedeemableProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null)
  
  // Product form
  const [productForm, setProductForm] = useState({
    name: '',
    description: '',
    price: '',
    discount: '',
    image: '',
    stock: '',
    categoryId: '',
    isPromotion: false,
    isNew: false,
    isRedeemable: false,
    redeemPoints: '0',
    order: '0'
  })
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [productDialogOpen, setProductDialogOpen] = useState(false)

  // Category form
  const [categoryForm, setCategoryForm] = useState({
    name: '',
    slug: '',
    description: '',
    order: '0'
  })
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false)

  // Shop profile form
  const [shopProfile, setShopProfile] = useState<ShopProfile | null>(null)
  const [shopProfileForm, setShopProfileForm] = useState({
    storeName: '',
    slogan: '',
    whatsapp: '',
    instagram: '',
    facebook: '',
    address: '',
    operatingHours: '',
    logo: ''
  })
  const [savingShopProfile, setSavingShopProfile] = useState(false)

  // Export dialog
  const [exportDialogOpen, setExportDialogOpen] = useState(false)

  // WebSocket connection for admins
  useWebSocket(null, 'admin', {
    onNewOrder: (data) => {
      // Refresh orders when new order is created
      fetch('/api/orders')
        .then((res) => res.json())
        .then((data) => setOrders(data))
    },
    onOrderStatusChanged: (data) => {
      // Update order when status changes
      setOrders((prevOrders) =>
        prevOrders.map((order) =>
          order.id === data.orderId
            ? { ...order, status: data.status }
            : order
        )
      )
    },
    onUserChanged: (data) => {
      // Refresh users when user data changes
      fetch('/api/users')
        .then((res) => res.json())
        .then((data) => setUsers(data))
    }
  })

  useEffect(() => {
    const userData = localStorage.getItem('user')
    if (!userData) {
      window.location.href = '/login'
      return
    }

    const parsedUser = JSON.parse(userData)
    if (parsedUser.role !== 'admin') {
      window.location.href = '/dashboard'
      return
    }

    setUser(parsedUser)
    fetchData()

    // Add visibility change listener to refresh data when tab becomes active
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        console.log('[Admin] Tab became visible, refreshing data...')
        fetchData()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)

    // Cleanup
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [])

  // Auto-refresh data every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchData()
    }, 30000) // 30 seconds

    return () => clearInterval(interval)
  }, [])

  const fetchData = async () => {
    try {
      const [productsRes, categoriesRes, usersRes, ordersRes, redeemableProductsRes, shopProfileRes] = await Promise.all([
        fetch('/api/products'),
        fetch('/api/categories'),
        fetch('/api/users'),
        fetch('/api/orders'),
        fetch('/api/products?isRedeemable=true'),
        fetch('/api/shop-profile')
      ])

      if (productsRes.ok) {
        const productsData = await productsRes.json()
        setProducts(productsData)
        // Filter out redeemable products
        setRedeemableProducts(productsData.filter((p: any) => p.isRedeemable === true))
      }
      if (categoriesRes.ok) setCategories(await categoriesRes.json())
      if (usersRes.ok) setUsers(await usersRes.json())
      if (ordersRes.ok) setOrders(await ordersRes.json())
      if (shopProfileRes.ok) {
        const shopProfileData = await shopProfileRes.json()
        setShopProfile(shopProfileData)
        setShopProfileForm({
          storeName: shopProfileData.storeName || '',
          slogan: shopProfileData.slogan || '',
          whatsapp: shopProfileData.whatsapp || '',
          instagram: shopProfileData.instagram || '',
          facebook: shopProfileData.facebook || '',
          address: shopProfileData.address || '',
          operatingHours: shopProfileData.operatingHours || '',
          logo: shopProfileData.logo || ''
        })
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

  const handleSaveProduct = async () => {
    try {
      const url = editingProduct
        ? `/api/products/${editingProduct.id}`
        : '/api/products'
      const method = editingProduct ? 'PATCH' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: productForm.name,
          description: productForm.description,
          price: parseInt(productForm.price),
          discount: parseInt(productForm.discount),
          image: productForm.image,
          stock: parseInt(productForm.stock),
          categoryId: productForm.categoryId,
          isPromotion: productForm.isPromotion,
          isNew: productForm.isNew,
          isRedeemable: productForm.isRedeemable,
          redeemPoints: parseInt(productForm.redeemPoints),
          order: parseInt(productForm.order)
        })
      })

      if (res.ok) {
        setProductDialogOpen(false)
        setEditingProduct(null)
        resetProductForm()
        fetchData()

        toast.success('Produk Berhasil Disimpan!', {
          description: editingProduct ? 'Produk berhasil diupdate' : 'Produk baru berhasil ditambahkan',
          position: 'top-center'
        })
      } else {
        const data = await res.json()
        toast.error('Gagal Menyimpan Produk', {
          description: data.error || 'Gagal menyimpan produk',
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

  const handleDeleteProduct = async (id: string) => {
    if (!confirm('Yakin ingin menghapus produk ini?')) return

    try {
      const res = await fetch(`/api/products/${id}`, { method: 'DELETE' })
      if (res.ok) {
        fetchData()
        toast.success('Produk Berhasil Dihapus!', {
          description: 'Produk telah dihapus dari sistem',
          position: 'top-center'
        })
      } else {
        const data = await res.json()
        toast.error('Gagal Menghapus Produk', {
          description: data.details || data.error || 'Produk gagal dihapus',
          position: 'top-center'
        })
      }
    } catch (error) {
      console.error('[handleDeleteProduct] Error:', error)
      toast.error('Terjadi Kesalahan', {
        description: 'Silakan coba lagi nanti',
        position: 'top-center'
      })
    }
  }

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product)
    setProductForm({
      name: product.name,
      description: product.description || '',
      price: product.price.toString(),
      discount: product.discount.toString(),
      image: product.image || '',
      stock: product.stock.toString(),
      categoryId: product.categoryId,
      isPromotion: product.isPromotion,
      isNew: product.isNew,
      isRedeemable: product.isRedeemable,
      redeemPoints: product.redeemPoints.toString(),
      order: product.order.toString()
    })
    setProductDialogOpen(true)
  }

  const handleSaveRedeemableProduct = async () => {
    try {
      const url = editingProduct
        ? `/api/products/${editingProduct.id}`
        : '/api/products'
      const method = editingProduct ? 'PATCH' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: productForm.name,
          description: productForm.description,
          price: parseInt(productForm.price),
          discount: parseInt(productForm.discount),
          image: productForm.image,
          stock: parseInt(productForm.stock),
          categoryId: productForm.categoryId,
          isPromotion: productForm.isPromotion,
          isNew: productForm.isNew,
          isRedeemable: true,
          redeemPoints: parseInt(productForm.redeemPoints),
          order: parseInt(productForm.order)
        })
      })

      if (res.ok) {
        setProductDialogOpen(false)
        setEditingProduct(null)
        resetProductForm()
        fetchData()

        toast.success('Produk Poin Berhasil Disimpan!', {
          description: editingProduct ? 'Produk tukar point berhasil diupdate' : 'Produk tukar point baru ditambahkan',
          position: 'top-center'
        })
      } else {
        const errorData = await res.json()
        toast.error('Gagal Menyimpan Produk Poin', {
          description: errorData.error || 'Gagal menyimpan produk tukar point',
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

  const handleEditRedeemableProduct = (product: Product) => {
    setEditingProduct(product)
    setProductForm({
      name: product.name,
      description: product.description || '',
      price: product.price.toString(),
      discount: product.discount.toString(),
      image: product.image || '',
      stock: product.stock.toString(),
      categoryId: product.categoryId,
      isPromotion: product.isPromotion,
      isNew: product.isNew,
      isRedeemable: product.isRedeemable,
      redeemPoints: product.redeemPoints.toString(),
      order: product.order.toString()
    })
    setProductDialogOpen(true)
  }

  const resetProductForm = () => {
    setProductForm({
      name: '',
      description: '',
      price: '',
      discount: '',
      image: '',
      stock: '',
      categoryId: '',
      isPromotion: false,
      isNew: false,
      isRedeemable: false,
      redeemPoints: '0',
      order: '0'
    })
  }

  const setupRedeemableProductForm = () => {
    setProductForm({
      name: '',
      description: '',
      price: '0',
      discount: '0',
      image: '',
      stock: '10',
      categoryId: '',
      isPromotion: false,
      isNew: false,
      isRedeemable: true,
      redeemPoints: '0',
      order: '0'
    })
    setEditingProduct(null)
    setProductDialogOpen(true)
  }

  const handleSaveCategory = async () => {
    try {
      const url = editingCategory
        ? `/api/categories/${editingCategory.id}`
        : '/api/categories'
      const method = editingCategory ? 'PATCH' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: categoryForm.name,
          slug: categoryForm.slug,
          description: categoryForm.description,
          order: parseInt(categoryForm.order)
        })
      })

      if (res.ok) {
        setCategoryDialogOpen(false)
        setEditingCategory(null)
        resetCategoryForm()
        fetchData()

        toast.success('Kategori Berhasil Disimpan!', {
          description: editingCategory ? 'Kategori berhasil diupdate' : 'Kategori baru berhasil ditambahkan',
          position: 'top-center'
        })
      } else {
        const data = await res.json()
        toast.error('Gagal Menyimpan Kategori', {
          description: data.error || 'Gagal menyimpan kategori',
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

  const handleDeleteCategory = async (id: string) => {
    if (!confirm('Yakin ingin menghapus kategori ini?')) return

    try {
      const res = await fetch(`/api/categories/${id}`, { method: 'DELETE' })
      if (res.ok) {
        fetchData()
        toast.success('Kategori Berhasil Dihapus!', {
          description: 'Kategori telah dihapus dari sistem',
          position: 'top-center'
        })
      } else {
        toast.error('Gagal Menghapus Kategori', {
          description: 'Kategori gagal dihapus',
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

  const handleEditCategory = (category: Category) => {
    setEditingCategory(category)
    setCategoryForm({
      name: category.name,
      slug: category.slug,
      description: category.description || '',
      order: category.order.toString()
    })
    setCategoryDialogOpen(true)
  }

  const resetCategoryForm = () => {
    setCategoryForm({
      name: '',
      slug: '',
      description: '',
      order: '0'
    })
  }

  const handleUpdateOrderStatus = async (orderId: string, status: string) => {
    const previousOrders = [...orders]
    const orderIndex = orders.findIndex(o => o.id === orderId)
    
    if (orderIndex === -1) return

    // Optimistic update - update UI immediately
    setUpdatingOrderId(orderId)
    const updatedOrders = [...orders]
    updatedOrders[orderIndex] = { ...updatedOrders[orderIndex], status }
    setOrders(updatedOrders)

    try {
      const res = await fetch(`/api/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      })

      if (res.ok) {
        const data = await res.json()
        // Update with server data
        setOrders(prevOrders => 
          prevOrders.map(o => o.id === orderId ? data : o)
        )
        
        toast.success('Status Pesanan Diupdate!', {
          description: `Pesanan diubah menjadi: ${status}`,
          position: 'top-center'
        })
      } else {
        // Revert on error
        setOrders(previousOrders)
        const errorData = await res.json()
        toast.error('Gagal Update Status', {
          description: errorData.error || 'Gagal mengupdate status pesanan',
          position: 'top-center'
        })
      }
    } catch (error) {
      // Revert on error
      setOrders(previousOrders)
      toast.error('Terjadi Kesalahan', {
        description: 'Silakan coba lagi nanti',
        position: 'top-center'
      })
    } finally {
      setUpdatingOrderId(null)
    }
  }

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Yakin ingin menghapus user ini?')) return

    try {
      const res = await fetch(`/api/user/${userId}`, { method: 'DELETE' })
      if (res.ok) {
        fetchData()
        toast.success('User Berhasil Dihapus!', {
          description: 'User telah dihapus dari sistem',
          position: 'top-center'
        })
      } else {
        toast.error('Gagal Menghapus User', {
          description: 'User gagal dihapus',
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

  const handleDeleteRedeemableProduct = async (id: string) => {
    if (!confirm('Yakin ingin menghapus produk tukar point ini?')) return

    try {
      const res = await fetch(`/api/products/${id}`, { method: 'DELETE' })
      if (res.ok) {
        fetchData()
        toast.success('Produk Berhasil Dihapus!', {
          description: 'Produk tukar point telah dihapus dari sistem',
          position: 'top-center'
        })
      } else {
        const data = await res.json()
        toast.error('Gagal Menghapus Produk', {
          description: data.details || data.error || 'Produk gagal dihapus',
          position: 'top-center'
        })
      }
    } catch (error) {
      console.error('[handleDeleteRedeemableProduct] Error:', error)
      toast.error('Terjadi Kesalahan', {
        description: 'Silakan coba lagi nanti',
        position: 'top-center'
      })
    }
  }

  const handleSaveShopProfile = async () => {
    setSavingShopProfile(true)
    try {
      const res = await fetch('/api/shop-profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(shopProfileForm)
      })

      if (res.ok) {
        const data = await res.json()
        setShopProfile(data)
        toast.success('Profil Toko Berhasil Disimpan!', {
          description: 'Data toko berhasil diupdate',
          position: 'top-center'
        })
      } else {
        const errorData = await res.json()
        toast.error('Gagal Menyimpan Profil', {
          description: errorData.error || 'Gagal menyimpan profil toko',
          position: 'top-center'
        })
      }
    } catch (error) {
      toast.error('Terjadi Kesalahan', {
        description: 'Silakan coba lagi nanti',
        position: 'top-center'
      })
    } finally {
      setSavingShopProfile(false)
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
            <p><strong>Nama:</strong> ${order.userName}</p>
            <p><strong>No HP:</strong> ${order.userPhone}</p>
            <p><strong>Alamat:</strong> ${order.userAddress}</p>
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
                <p className="text-[10px] sm:text-xs text-gray-500">Admin Dashboard</p>
              </div>
            </div>
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
      </header>

      {/* Main Content */}
      <main className="flex-1 container mx-auto px-2 sm:px-4 py-3 sm:py-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-4 mb-4 sm:mb-6">
          <Card className="border-2 border-orange-100">
            <CardContent className="pt-4 sm:pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] sm:text-sm text-gray-500">Total Produk</p>
                  <p className="text-xl sm:text-2xl font-bold text-orange-600">{products.length}</p>
                </div>
                <Package className="w-6 h-6 sm:w-8 sm:h-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>
          <Card className="border-2 border-orange-100">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] sm:text-sm text-gray-500">Total User</p>
                  <p className="text-xl sm:text-2xl font-bold text-orange-600">{users.length}</p>
                </div>
                <Users className="w-6 h-6 sm:w-8 sm:h-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>
          <Card className="border-2 border-orange-100">
            <CardContent className="pt-4 sm:pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] sm:text-sm text-gray-500">Total Pesanan</p>
                  <p className="text-xl sm:text-2xl font-bold text-orange-600">{orders.length}</p>
                </div>
                <ShoppingCart className="w-6 h-6 sm:w-8 sm:h-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>
          <Card className="border-2 border-orange-100">
            <CardContent className="pt-4 sm:pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] sm:text-sm text-gray-500">Pending</p>
                  <p className="text-xl sm:text-2xl font-bold text-orange-600">
                    {orders.filter(o => o.status === 'pending').length}
                  </p>
                </div>
                <Clock className="w-6 h-6 sm:w-8 sm:h-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="orders" className="space-y-3 sm:space-y-6">
          <TabsList className="w-full bg-orange-50 p-0.5 sm:p-1 flex overflow-x-auto scrollbar-hide gap-0.5 sm:gap-1">
            <TabsTrigger value="orders" className="data-[state=active]:bg-orange-500 data-[state=active]:text-white flex-shrink-0 min-w-max px-2 sm:px-3 py-2 sm:py-2.5 text-xs sm:text-sm">
              <ShoppingCart className="w-3.5 h-3.5 sm:w-4 sm:h-4 sm:mr-2" />
              <span className="hidden sm:inline">Pesanan</span>
            </TabsTrigger>
            <TabsTrigger value="products" className="data-[state=active]:bg-orange-500 data-[state=active]:text-white flex-shrink-0 min-w-max px-2 sm:px-3 py-2 sm:py-2.5 text-xs sm:text-sm">
              <Package className="w-3.5 h-3.5 sm:w-4 sm:h-4 sm:mr-2" />
              <span className="hidden sm:inline">Produk</span>
            </TabsTrigger>
            <TabsTrigger value="redeemable-products" className="data-[state=active]:bg-purple-500 data-[state=active]:text-white flex-shrink-0 min-w-max px-2 sm:px-3 py-2 sm:py-2.5 text-xs sm:text-sm">
              <ShoppingBag className="w-3.5 h-3.5 sm:w-4 sm:h-4 sm:mr-2" />
              <span className="hidden sm:inline">Produk Poin</span>
              <span className="sm:hidden">Poin</span>
            </TabsTrigger>
            <TabsTrigger value="categories" className="data-[state=active]:bg-orange-500 data-[state=active]:text-white flex-shrink-0 min-w-max px-2 sm:px-3 py-2 sm:py-2.5 text-xs sm:text-sm">
              <Package className="w-3.5 h-3.5 sm:w-4 sm:h-4 sm:mr-2" />
              <span className="hidden sm:inline">Kategori</span>
              <span className="sm:hidden">Kat</span>
            </TabsTrigger>
            <TabsTrigger value="users" className="data-[state=active]:bg-orange-500 data-[state=active]:text-white flex-shrink-0 min-w-max px-2 sm:px-3 py-2 sm:py-2.5 text-xs sm:text-sm">
              <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4 sm:mr-2" />
              <span className="hidden sm:inline">User</span>
            </TabsTrigger>
            <TabsTrigger value="shop-profile" className="data-[state=active]:bg-green-500 data-[state=active]:text-white flex-shrink-0 min-w-max px-2 sm:px-3 py-2 sm:py-2.5 text-xs sm:text-sm">
              <Store className="w-3.5 h-3.5 sm:w-4 sm:h-4 sm:mr-2" />
              <span className="hidden sm:inline">Profil Toko</span>
              <span className="sm:hidden">Toko</span>
            </TabsTrigger>
          </TabsList>

          {/* Orders Tab */}
          <TabsContent value="orders">
            <Card className="border-2 border-orange-100">
              <CardHeader className="flex flex-row items-center justify-between px-3 sm:px-6 py-3 sm:py-4">
                <CardTitle className="flex items-center gap-2 text-orange-600 text-base sm:text-lg">
                  <ShoppingCart className="w-4 h-4 sm:w-5 sm:h-5" />
                  Kelola Pesanan
                </CardTitle>
                <Button
                  onClick={() => setExportDialogOpen(true)}
                  className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white"
                  size="sm"
                >
                  <Download className="w-4 h-4 mr-2" />
                  <span className="hidden sm:inline">Ekspor</span>
                </Button>
              </CardHeader>
              <CardContent className="px-3 sm:px-6">
                <ScrollArea className="h-[350px] sm:h-[600px]">
                  <div className="space-y-4">
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
                          className="border border-orange-100 rounded-xl p-4 hover:shadow-md transition-shadow"
                        >
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <h4 className="font-bold text-gray-800">
                                Order #{order.id.slice(-6).toUpperCase()}
                              </h4>
                              <p className="text-sm text-gray-500">
                                {new Date(order.createdAt).toLocaleString('id-ID')}
                              </p>
                              <p className="text-sm text-gray-600">
                                <span className="font-medium">{order.userName}</span> - {order.userPhone}
                              </p>
                            </div>
                            {getStatusBadge(order.status)}
                          </div>
                          <div className="space-y-2 mb-3">
                            {order.items.map((item, index) => (
                              <div key={index} className="flex justify-between text-sm">
                                <span>{item.product.name} x{item.quantity}</span>
                                <span>Rp {item.subtotal.toLocaleString('id-ID')}</span>
                              </div>
                            ))}
                          </div>
                          <div className="flex items-center justify-between pt-3 border-t border-orange-100">
                            <div className="text-lg font-bold text-orange-600">
                              Total: Rp {order.total.toLocaleString('id-ID')}
                            </div>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => printReceipt(order)}
                                className="border-orange-200 text-orange-600 hover:bg-orange-50"
                              >
                                <Printer className="w-4 h-4 mr-1" />
                                Cetak
                              </Button>
                              <Select
                                value={order.status}
                                onValueChange={(value) => handleUpdateOrderStatus(order.id, value)}
                                disabled={updatingOrderId === order.id}
                              >
                                <SelectTrigger className="w-[180px]">
                                  {updatingOrderId === order.id ? (
                                    <div className="flex items-center gap-2">
                                      <div className="animate-spin h-4 w-4 border-2 border-orange-500 border-t-transparent rounded-full" />
                                      <span>Updating...</span>
                                    </div>
                                  ) : (
                                    <SelectValue />
                                  )}
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="pending">Menunggu</SelectItem>
                                  <SelectItem value="approved">Disetujui</SelectItem>
                                  <SelectItem value="processing">Diproses</SelectItem>
                                  <SelectItem value="completed">Selesai</SelectItem>
                                  <SelectItem value="cancelled">Batal</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                          {order.pointsEarned > 0 && order.status === 'completed' && (
                            <div className="mt-3 p-2 bg-green-50 rounded-lg text-center text-green-600 text-sm font-medium">
                              +{order.pointsEarned} Poin diberikan ke {order.user.username}
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

          {/* Products Tab */}
          <TabsContent value="products">
            <Card className="border-2 border-orange-100">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-orange-600 text-base sm:text-lg">
                  <Package className="w-4 h-4 sm:w-5 sm:h-5" />
                  Kelola Produk
                </CardTitle>
                <Dialog open={productDialogOpen} onOpenChange={setProductDialogOpen}>
                  <DialogTrigger asChild>
                    <Button
                      className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700"
                      onClick={() => {
                        resetProductForm()
                        setEditingProduct(null)
                      }}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Tambah Produk
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>
                        {editingProduct ? 'Edit Produk' : 'Tambah Produk Baru'}
                      </DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid gap-2">
                        <label className="text-sm font-medium">Nama Produk</label>
                        <Input
                          value={productForm.name}
                          onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                          className="border-orange-200 focus-visible:ring-orange-500"
                        />
                      </div>
                      <div className="grid gap-2">
                        <label className="text-sm font-medium">Deskripsi</label>
                        <Textarea
                          value={productForm.description}
                          onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                          className="border-orange-200 focus-visible:ring-orange-500"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                          <label className="text-sm font-medium">Harga</label>
                          <Input
                            type="number"
                            value={productForm.price}
                            onChange={(e) => setProductForm({ ...productForm, price: e.target.value })}
                            className="border-orange-200 focus-visible:ring-orange-500"
                          />
                        </div>
                        <div className="grid gap-2">
                          <label className="text-sm font-medium">Diskon (%)</label>
                          <Input
                            type="number"
                            value={productForm.discount}
                            onChange={(e) => setProductForm({ ...productForm, discount: e.target.value })}
                            className="border-orange-200 focus-visible:ring-orange-500"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                          <label className="text-sm font-medium">Stok</label>
                          <Input
                            type="number"
                            value={productForm.stock}
                            onChange={(e) => setProductForm({ ...productForm, stock: e.target.value })}
                            className="border-orange-200 focus-visible:ring-orange-500"
                          />
                        </div>
                        <div className="grid gap-2">
                          <label className="text-sm font-medium">Urutan</label>
                          <Input
                            type="number"
                            value={productForm.order}
                            onChange={(e) => setProductForm({ ...productForm, order: e.target.value })}
                            className="border-orange-200 focus-visible:ring-orange-500"
                          />
                        </div>
                      </div>
                      <div className="grid gap-2">
                        <label className="text-sm font-medium">Gambar Produk</label>
                        <ImageUpload
                          value={productForm.image}
                          onChange={(url) => setProductForm({ ...productForm, image: url })}
                          maxSize={5}
                        />
                      </div>
                      <div className="grid gap-2">
                        <label className="text-sm font-medium">Kategori</label>
                        <Select
                          value={productForm.categoryId}
                          onValueChange={(value) => setProductForm({ ...productForm, categoryId: value })}
                        >
                          <SelectTrigger className="border-orange-200">
                            <SelectValue placeholder="Pilih kategori" />
                          </SelectTrigger>
                          <SelectContent>
                            {categories.map((cat) => (
                              <SelectItem key={cat.id} value={cat.id}>
                                {cat.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex gap-4">
                        <label className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={productForm.isPromotion}
                            onChange={(e) => setProductForm({ ...productForm, isPromotion: e.target.checked })}
                            className="rounded border-orange-200"
                          />
                          <span className="text-sm font-medium">Promo</span>
                        </label>
                        <label className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={productForm.isNew}
                            onChange={(e) => setProductForm({ ...productForm, isNew: e.target.checked })}
                            className="rounded border-orange-200"
                          />
                          <span className="text-sm font-medium">Produk Baru</span>
                        </label>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setProductDialogOpen(false)
                          setEditingProduct(null)
                          resetProductForm()
                        }}
                        className="border-orange-200 text-orange-600 hover:bg-orange-50"
                      >
                        Batal
                      </Button>
                      <Button
                        onClick={handleSaveProduct}
                        className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700"
                      >
                        {editingProduct ? 'Update' : 'Simpan'}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent className="px-3 sm:px-6">
                <ScrollArea className="h-[350px] sm:h-[600px]">
                  <div className="space-y-4">
                    {products.length === 0 ? (
                      <div className="text-center py-12 text-gray-500">
                        <Package className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                        <p>Belum ada produk</p>
                      </div>
                    ) : (
                      products.map((product) => (
                        <motion.div
                          key={product.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          className="border border-orange-100 rounded-xl p-4 hover:shadow-md transition-shadow"
                        >
                          <div className="flex items-start gap-4">
                            {product.image && (
                              <div className="w-20 h-20 rounded-lg overflow-hidden bg-orange-50 flex-shrink-0">
                                <img
                                  src={product.image}
                                  alt={product.name}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <h4 className="font-bold text-gray-800">{product.name}</h4>
                              <p className="text-sm text-gray-500 line-clamp-1">{product.description}</p>
                              <div className="flex items-center gap-2 mt-2">
                                {product.isPromotion && (
                                  <Badge className="bg-red-500 text-white text-xs">PROMO</Badge>
                                )}
                                {product.isNew && (
                                  <Badge className="bg-green-500 text-white text-xs">BARU</Badge>
                                )}
                                {product.discount > 0 && (
                                  <Badge className="bg-orange-500 text-white text-xs">
                                    -{product.discount}%
                                  </Badge>
                                )}
                              </div>
                              <p className="text-lg font-bold text-orange-600 mt-2">
                                Rp {product.price.toLocaleString('id-ID')}
                              </p>
                            </div>
                            <div className="flex gap-2">
                              <Button
                                size="icon"
                                variant="outline"
                                onClick={() => handleEditProduct(product)}
                                className="border-orange-200 text-orange-600 hover:bg-orange-50"
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                size="icon"
                                variant="outline"
                                onClick={() => handleDeleteProduct(product.id)}
                                className="border-red-200 text-red-600 hover:bg-red-50"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </motion.div>
                      ))
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Categories Tab */}
          <TabsContent value="categories">
            <Card className="border-2 border-orange-100">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-orange-600 text-base sm:text-lg">
                  <Package className="w-4 h-4 sm:w-5 sm:h-5" />
                  Kelola Kategori
                </CardTitle>
                <Dialog open={categoryDialogOpen} onOpenChange={setCategoryDialogOpen}>
                  <DialogTrigger asChild>
                    <Button
                      className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700"
                      onClick={() => {
                        resetCategoryForm()
                        setEditingCategory(null)
                      }}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Tambah Kategori
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>
                        {editingCategory ? 'Edit Kategori' : 'Tambah Kategori Baru'}
                      </DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid gap-2">
                        <label className="text-sm font-medium">Nama Kategori</label>
                        <Input
                          value={categoryForm.name}
                          onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                          className="border-orange-200 focus-visible:ring-orange-500"
                        />
                      </div>
                      <div className="grid gap-2">
                        <label className="text-sm font-medium">Slug</label>
                        <Input
                          value={categoryForm.slug}
                          onChange={(e) => setCategoryForm({ ...categoryForm, slug: e.target.value })}
                          className="border-orange-200 focus-visible:ring-orange-500"
                        />
                      </div>
                      <div className="grid gap-2">
                        <label className="text-sm font-medium">Deskripsi</label>
                        <Textarea
                          value={categoryForm.description}
                          onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
                          className="border-orange-200 focus-visible:ring-orange-500"
                        />
                      </div>
                      <div className="grid gap-2">
                        <label className="text-sm font-medium">Urutan</label>
                        <Input
                          type="number"
                          value={categoryForm.order}
                          onChange={(e) => setCategoryForm({ ...categoryForm, order: e.target.value })}
                          className="border-orange-200 focus-visible:ring-orange-500"
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setCategoryDialogOpen(false)
                          setEditingCategory(null)
                          resetCategoryForm()
                        }}
                        className="border-orange-200 text-orange-600 hover:bg-orange-50"
                      >
                        Batal
                      </Button>
                      <Button
                        onClick={handleSaveCategory}
                        className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700"
                      >
                        {editingCategory ? 'Update' : 'Simpan'}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent className="px-3 sm:px-6">
                <div className="space-y-4">
                  {categories.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">
                      <Package className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                      <p>Belum ada kategori</p>
                    </div>
                  ) : (
                    categories.map((category) => (
                      <motion.div
                        key={category.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="border border-orange-100 rounded-xl p-4 hover:shadow-md transition-shadow flex items-center justify-between"
                      >
                        <div>
                          <h4 className="font-bold text-gray-800">{category.name}</h4>
                          <p className="text-sm text-gray-500">Slug: {category.slug}</p>
                          {category.description && (
                            <p className="text-sm text-gray-500 mt-1">{category.description}</p>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="icon"
                            variant="outline"
                            onClick={() => handleEditCategory(category)}
                            className="border-orange-200 text-orange-600 hover:bg-orange-50"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="outline"
                            onClick={() => handleDeleteCategory(category.id)}
                            className="border-red-200 text-red-600 hover:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </motion.div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Redeemable Products Tab */}
          <TabsContent value="redeemable-products">
            <Card className="border-2 border-purple-100">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-purple-600">
                  <ShoppingBag className="w-4 h-4 sm:w-5 sm:h-5" />
                  Produk Tukar Point
                </CardTitle>
                <Dialog open={productDialogOpen} onOpenChange={setProductDialogOpen}>
                  <DialogTrigger asChild>
                    <Button
                      className="bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700"
                      onClick={() => {
                        setupRedeemableProductForm()
                      }}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Tambah Produk Poin
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>
                        {editingProduct ? 'Edit Produk Poin' : 'Tambah Produk Poin Baru'}
                      </DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid gap-2">
                        <label className="text-sm font-medium">Nama Produk</label>
                        <Input
                          value={productForm.name}
                          onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                          className="border-purple-200 focus-visible:ring-purple-500"
                        />
                      </div>
                      <div className="grid gap-2">
                        <label className="text-sm font-medium">Deskripsi</label>
                        <Textarea
                          value={productForm.description}
                          onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                          className="border-purple-200 focus-visible:ring-purple-500"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                          <label className="text-sm font-medium">Harga Normal</label>
                          <Input
                            type="number"
                            value={productForm.price}
                            onChange={(e) => setProductForm({ ...productForm, price: e.target.value })}
                            className="border-purple-200 focus-visible:ring-purple-500"
                          />
                        </div>
                        <div className="grid gap-2">
                          <label className="text-sm font-medium">Poin Tukar</label>
                          <Input
                            type="number"
                            value={productForm.redeemPoints}
                            onChange={(e) => setProductForm({ ...productForm, redeemPoints: e.target.value })}
                            className="border-purple-200 focus-visible:ring-purple-500"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                          <label className="text-sm font-medium">Stok</label>
                          <Input
                            type="number"
                            value={productForm.stock}
                            onChange={(e) => setProductForm({ ...productForm, stock: e.target.value })}
                            className="border-purple-200 focus-visible:ring-purple-500"
                          />
                        </div>
                        <div className="grid gap-2">
                          <label className="text-sm font-medium">Urutan</label>
                          <Input
                            type="number"
                            value={productForm.order}
                            onChange={(e) => setProductForm({ ...productForm, order: e.target.value })}
                            className="border-purple-200 focus-visible:ring-purple-500"
                          />
                        </div>
                      </div>
                      <div className="grid gap-2">
                        <label className="text-sm font-medium">Gambar Produk</label>
                        <ImageUpload
                          value={productForm.image}
                          onChange={(url) => setProductForm({ ...productForm, image: url })}
                          maxSize={5}
                        />
                      </div>
                      <div className="grid gap-2">
                        <label className="text-sm font-medium">Kategori</label>
                        <Select
                          value={productForm.categoryId}
                          onValueChange={(value) => setProductForm({ ...productForm, categoryId: value })}
                        >
                          <SelectTrigger className="border-purple-200">
                            <SelectValue placeholder="Pilih kategori" />
                          </SelectTrigger>
                          <SelectContent>
                            {categories.map((cat) => (
                              <SelectItem key={cat.id} value={cat.id}>
                                {cat.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex gap-4">
                        <label className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={productForm.isPromotion}
                            onChange={(e) => setProductForm({ ...productForm, isPromotion: e.target.checked })}
                            className="rounded border-purple-200"
                          />
                          <span className="text-sm font-medium">Promo</span>
                        </label>
                        <label className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={productForm.isNew}
                            onChange={(e) => setProductForm({ ...productForm, isNew: e.target.checked })}
                            className="rounded border-purple-200"
                          />
                          <span className="text-sm font-medium">Produk Baru</span>
                        </label>
                        <label className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={productForm.isRedeemable}
                            onChange={(e) => setProductForm({ ...productForm, isRedeemable: e.target.checked })}
                            className="rounded border-purple-200"
                          />
                          <span className="text-sm font-medium">Bisa Ditukar dengan Poin</span>
                        </label>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setProductDialogOpen(false)
                          setEditingProduct(null)
                          resetProductForm()
                        }}
                        className="border-purple-200 text-purple-600 hover:bg-purple-50"
                      >
                        Batal
                      </Button>
                      <Button
                        onClick={() => {
                          // Check if editing existing redeemable product or creating new one
                          if (editingProduct && editingProduct.isRedeemable) {
                            handleSaveRedeemableProduct()
                          } else if (editingProduct) {
                            handleSaveProduct()
                          } else {
                            // Creating new product - use the form's isRedeemable value
                            if (productForm.isRedeemable) {
                              handleSaveRedeemableProduct()
                            } else {
                              handleSaveProduct()
                            }
                          }
                        }}
                        className="bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700"
                      >
                        {editingProduct ? 'Update' : 'Simpan'}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent className="px-3 sm:px-6">
                <ScrollArea className="h-[350px] sm:h-[600px]">
                  <div className="space-y-4">
                    {products.filter(p => p.isRedeemable).length === 0 ? (
                      <div className="text-center py-12 text-gray-500">
                        <ShoppingBag className="w-16 h-16 mx-auto mb-4 text-purple-300" />
                        <p>Belum ada produk tukar point</p>
                        <p className="text-xs mt-2">Klik tombol "Tambah Produk Poin" untuk menambah produk</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {products.filter(p => p.isRedeemable).map((product) => (
                          <motion.div
                            key={product.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="border border-purple-200 rounded-xl p-4 hover:shadow-md transition-shadow bg-white"
                          >
                            <div className="flex items-start gap-3">
                              {product.image && (
                                <div className="w-20 h-20 rounded-lg overflow-hidden bg-purple-50 flex-shrink-0">
                                  <img
                                    src={product.image}
                                    alt={product.name}
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                              )}
                              <div className="flex-1 min-w-0">
                                <h4 className="font-bold text-gray-800">{product.name}</h4>
                                <p className="text-sm text-gray-500 line-clamp-1">{product.description}</p>
                                <div className="flex items-center gap-2 mt-2">
                                  {product.isPromotion && (
                                    <Badge className="bg-red-500 text-white text-xs">PROMO</Badge>
                                  )}
                                  {product.isNew && (
                                    <Badge className="bg-green-500 text-white text-xs">BARU</Badge>
                                  )}
                                </div>
                                <div className="flex items-center gap-2">
                                  <p className="text-sm text-gray-500">Poin:</p>
                                  <p className="font-bold text-purple-600">{product.redeemPoints}</p>
                                </div>
                                <div className="flex items-center gap-2">
                                  <p className="text-sm text-gray-500">Harga:</p>
                                  <p className="font-bold text-orange-600">Rp {product.price.toLocaleString('id-ID')}</p>
                                </div>
                                <div className="flex items-center gap-2">
                                  <p className="text-sm text-gray-500">Stok:</p>
                                  <p className={`font-semibold ${product.stock > 5 ? 'text-green-600' : product.stock > 0 ? 'text-yellow-600' : 'text-red-500'}`}>
                                    {product.stock}
                                  </p>
                                </div>
                              </div>
                              <div className="flex gap-2 mt-2">
                                <Button
                                  size="icon"
                                  variant="outline"
                                  onClick={() => handleEditRedeemableProduct(product)}
                                  className="border-purple-200 text-purple-600 hover:bg-purple-50"
                                >
                                  <Edit className="w-4 h-4" />
                                </Button>
                                <Button
                                  size="icon"
                                  variant="outline"
                                  onClick={() => handleDeleteRedeemableProduct(product.id)}
                                  className="border-red-200 text-red-600 hover:bg-red-50"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users">
            <Card className="border-2 border-orange-100">
              <CardHeader className="px-3 sm:px-6 py-3 sm:py-4">
                <CardTitle className="flex items-center gap-2 text-orange-600 text-base sm:text-lg">
                  <Users className="w-4 h-4 sm:w-5 sm:h-5" />
                  Kelola User
                </CardTitle>
              </CardHeader>
              <CardContent className="px-3 sm:px-6">
                <ScrollArea className="h-[350px] sm:h-[600px]">
                  <div className="space-y-4">
                    {users.length === 0 ? (
                      <div className="text-center py-12 text-gray-500">
                        <Users className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                        <p>Belum ada user</p>
                      </div>
                    ) : (
                      users.map((userData) => (
                        <motion.div
                          key={userData.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          className="border border-orange-100 rounded-xl p-4 hover:shadow-md transition-shadow"
                        >
                          <div className="flex items-start justify-between">
                            <div>
                              <h4 className="font-bold text-gray-800">{userData.username}</h4>
                              <p className="text-sm text-gray-500">{userData.email}</p>
                              <p className="text-sm text-gray-500">{userData.phone}</p>
                              <div className="flex items-center gap-2 mt-2">
                                <Badge className={userData.role === 'admin' ? 'bg-purple-500' : 'bg-blue-500'}>
                                  {userData.role}
                                </Badge>
                                <Badge className="bg-orange-500">
                                  {userData.points} Poin
                                </Badge>
                              </div>
                            </div>
                            {userData.role !== 'admin' && (
                              <Button
                                size="icon"
                                variant="outline"
                                onClick={() => handleDeleteUser(userData.id)}
                                className="border-red-200 text-red-600 hover:bg-red-50"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                        </motion.div>
                      ))
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Shop Profile Tab */}
          <TabsContent value="shop-profile">
            <Card className="border-2 border-green-100">
              <CardHeader className="px-3 sm:px-6 py-3 sm:py-4">
                <CardTitle className="flex items-center gap-2 text-green-600">
                  <Store className="w-4 h-4 sm:w-5 sm:h-5" />
                  Kelola Profil Toko
                </CardTitle>
              </CardHeader>
              <CardContent className="px-3 sm:px-6">
                <div className="space-y-6">
                  <div className="grid gap-4">
                    <div className="grid gap-2">
                      <label className="text-sm font-medium text-gray-700">Nama Toko</label>
                      <Input
                        value={shopProfileForm.storeName}
                        onChange={(e) => setShopProfileForm({ ...shopProfileForm, storeName: e.target.value })}
                        className="border-green-200 focus-visible:ring-green-500"
                        placeholder="Masukkan nama toko"
                      />
                    </div>
                    <div className="grid gap-2">
                      <label className="text-sm font-medium text-gray-700">Slogan</label>
                      <Input
                        value={shopProfileForm.slogan}
                        onChange={(e) => setShopProfileForm({ ...shopProfileForm, slogan: e.target.value })}
                        className="border-green-200 focus-visible:ring-green-500"
                        placeholder="Masukkan slogan toko"
                      />
                    </div>
                    <div className="grid gap-2">
                      <label className="text-sm font-medium text-gray-700">Nomor WhatsApp</label>
                      <Input
                        value={shopProfileForm.whatsapp}
                        onChange={(e) => setShopProfileForm({ ...shopProfileForm, whatsapp: e.target.value })}
                        className="border-green-200 focus-visible:ring-green-500"
                        placeholder="Contoh: 6285260812758"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <label className="text-sm font-medium text-gray-700">Instagram</label>
                        <Input
                          value={shopProfileForm.instagram}
                          onChange={(e) => setShopProfileForm({ ...shopProfileForm, instagram: e.target.value })}
                          className="border-green-200 focus-visible:ring-green-500"
                          placeholder="@username"
                        />
                      </div>
                      <div className="grid gap-2">
                        <label className="text-sm font-medium text-gray-700">Facebook</label>
                        <Input
                          value={shopProfileForm.facebook}
                          onChange={(e) => setShopProfileForm({ ...shopProfileForm, facebook: e.target.value })}
                          className="border-green-200 focus-visible:ring-green-500"
                          placeholder="URL Facebook"
                        />
                      </div>
                    </div>
                    <div className="grid gap-2">
                      <label className="text-sm font-medium text-gray-700">Alamat</label>
                      <Textarea
                        value={shopProfileForm.address}
                        onChange={(e) => setShopProfileForm({ ...shopProfileForm, address: e.target.value })}
                        className="border-green-200 focus-visible:ring-green-500 min-h-[100px]"
                        placeholder="Masukkan alamat lengkap toko"
                      />
                    </div>
                    <div className="grid gap-2">
                      <label className="text-sm font-medium text-gray-700">Jam Operasional</label>
                      <Textarea
                        value={shopProfileForm.operatingHours}
                        onChange={(e) => setShopProfileForm({ ...shopProfileForm, operatingHours: e.target.value })}
                        className="border-green-200 focus-visible:ring-green-500 min-h-[80px]"
                        placeholder="Contoh: Senin - Minggu&#10;10:00 - 22:00 WIB"
                      />
                    </div>
                    <div className="grid gap-2">
                      <label className="text-sm font-medium text-gray-700">URL Logo</label>
                      <Input
                        value={shopProfileForm.logo}
                        onChange={(e) => setShopProfileForm({ ...shopProfileForm, logo: e.target.value })}
                        className="border-green-200 focus-visible:ring-green-500"
                        placeholder="URL gambar logo"
                      />
                    </div>
                  </div>

                  {/* Preview */}
                  <div className="border-2 border-green-100 rounded-xl p-6 bg-gradient-to-b from-green-50 to-white">
                    <h3 className="font-bold text-green-600 mb-4 flex items-center gap-2">
                      <Store className="w-4 h-4 sm:w-5 sm:h-5" />
                      Preview Footer
                    </h3>
                    <div className="bg-gradient-to-r from-orange-500 via-yellow-400 to-orange-400 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        {shopProfileForm.logo ? (
                          <img src={shopProfileForm.logo} alt="Logo" className="w-10 h-10 rounded-full bg-white/20" />
                        ) : (
                          <div className="bg-white/20 p-2 rounded-full">
                            <ChefHat className="w-6 h-6 text-white" />
                          </div>
                        )}
                        <div>
                          <h4 className="font-bold text-white text-base">{shopProfileForm.storeName || 'Nama Toko'}</h4>
                          <p className="text-white/90 text-sm">{shopProfileForm.slogan || 'Slogan'}</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-3 text-white/90 text-xs">
                        <div className="flex items-center gap-2 bg-white/10 rounded px-2 py-1">
                          <PhoneIcon className="w-3.5 h-3.5" />
                          <span>{shopProfileForm.whatsapp || 'WhatsApp'}</span>
                        </div>
                        {shopProfileForm.address && (
                          <div className="flex items-start gap-2 bg-white/10 rounded px-2 py-1">
                            <MapPin className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                            <span className="line-clamp-2">{shopProfileForm.address}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <Button
                    onClick={handleSaveShopProfile}
                    disabled={savingShopProfile}
                    className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-semibold py-6"
                  >
                    {savingShopProfile ? (
                      <div className="flex items-center gap-2">
                        <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full" />
                        <span>Menyimpan...</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <Store className="w-4 h-4 sm:w-5 sm:h-5" />
                        <span>Simpan Profil Toko</span>
                      </div>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      {/* Export Dialog */}
      <ExportReportDialog
        open={exportDialogOpen}
        onOpenChange={setExportDialogOpen}
        orders={orders}
      />

      {/* Footer */}
      <footer className="bg-gradient-to-b from-orange-800 to-orange-900 border-t border-orange-700 py-4 sm:py-6">
        <div className="container mx-auto px-2 sm:px-4 text-center text-gray-300 text-[10px] sm:text-sm">
          © 2024 Ayam Geprek Sambal Ijo. All rights reserved.
        </div>
      </footer>
    </div>
  )
}
