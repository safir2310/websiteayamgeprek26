'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from '@/components/ui/dialog'
import { motion, AnimatePresence } from 'framer-motion'
import { ShoppingCart, ChefHat, User, Instagram, Facebook, Phone, MapPin, X, Plus, Minus } from 'lucide-react'
import { toast } from 'sonner'
import { useWebSocket } from '@/hooks/useWebSocket'

interface Product {
  id: string
  name: string
  description: string | null
  price: number
  discount: number
  image: string | null
  isPromotion: boolean
  isNew: boolean
  isRedeemable: boolean
  category: {
    name: string
  }
}

interface CartItem {
  id: string
  product: Product
  quantity: number
  subtotal: number
}

interface Category {
  id: string
  name: string
  slug: string
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
}

export default function Home() {
  const [user, setUser] = useState<any>(() => {
    if (typeof window !== 'undefined') {
      const userData = localStorage.getItem('user')
      return userData ? JSON.parse(userData) : null
    }
    return null
  })
  const [cart, setCart] = useState<CartItem[]>(() => {
    if (typeof window !== 'undefined') {
      const savedCart = localStorage.getItem('cart')
      return savedCart ? JSON.parse(savedCart) : []
    }
    return []
  })
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [shopProfile, setShopProfile] = useState<any>(null)
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [isCartOpen, setIsCartOpen] = useState(false)
  const [redeemCode, setRedeemCode] = useState('')
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [isProductDialogOpen, setIsProductDialogOpen] = useState(false)
  const [dialogQuantity, setDialogQuantity] = useState(1)

  // WebSocket connection for real-time point updates
  useWebSocket(user?.id || null, user?.role || null, {
    onPointsChanged: (data) => {
      if (user && data.userId === user.id) {
        const newPoints = data.totalPoints !== undefined
          ? data.totalPoints
          : user.points + (data.type === 'earned' ? (data.pointsAdded || data.points || 0) : -(data.pointsDeducted || data.points || 0))

        setUser({ ...user, points: newPoints })
        const updatedUser = { ...user, points: newPoints }
        localStorage.setItem('user', JSON.stringify(updatedUser))

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
    const fetchData = async () => {
      try {
        const [productsRes, categoriesRes, shopProfileRes] = await Promise.all([
          fetch('/api/products'),
          fetch('/api/categories'),
          fetch('/api/shop-profile')
        ])

        if (productsRes.ok) {
          const productsData = await productsRes.json()
          console.log('[Homepage] Products loaded:', productsData.length)
          setProducts(productsData)
        }

        if (categoriesRes.ok) {
          const categoriesData = await categoriesRes.json()
          setCategories(categoriesData)
        }

        if (shopProfileRes.ok) {
          const shopProfileData = await shopProfileRes.json()
          setShopProfile(shopProfileData)
        }
      } catch (error) {
        console.error('[Homepage] Error fetching data:', error)
      }
    }

    // Initial fetch
    fetchData()

    // Add visibility change listener to refresh data when tab becomes active
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        console.log('[Homepage] Tab became visible, refreshing data...')
        fetchData()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)

    // Cleanup
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [])

  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(cart))
  }, [cart])

  const handleProductClick = (product: Product) => {
    setSelectedProduct(product)
    setDialogQuantity(1)
    setIsProductDialogOpen(true)
  }

  const addToCart = (product: Product, quantity: number = 1) => {
    setCart((prevCart) => {
      const existingItem = prevCart.find((item) => item.id === product.id)
      if (existingItem) {
        toast.success('Keranjang Diperbarui!', {
          description: `Jumlah ${product.name} sekarang ${existingItem.quantity + quantity}`,
          position: 'top-center'
        })
        return prevCart.map((item) =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + quantity, subtotal: (item.quantity + quantity) * product.price }
            : item
        )
      }
      toast.success('Berhasil Ditambahkan!', {
        description: `${product.name} ditambahkan ke keranjang`,
        position: 'top-center'
      })
      return [...prevCart, { id: product.id, product, quantity, subtotal: product.price * quantity }]
    })
  }

  const updateQuantity = (productId: string, delta: number) => {
    setCart((prevCart) =>
      prevCart
        .map((item) =>
          item.id === productId
            ? {
                ...item,
                quantity: Math.max(0, item.quantity + delta),
                subtotal: Math.max(0, item.quantity + delta) * item.product.price
              }
            : item
        )
        .filter((item) => item.quantity > 0)
    )
  }

  const removeFromCart = (productId: string) => {
    setCart((prevCart) => prevCart.filter((item) => item.id !== productId))
  }

  const handleRedeemCode = async () => {
    if (!redeemCode.trim() || !user) {
      toast.error('Kode Tidak Valid', {
        description: 'Silakan login dan masukkan kode redeem yang benar',
        position: 'top-center'
      })
      return
    }

    try {
      const res = await fetch('/api/redeem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: redeemCode, userId: user.id })
      })

      const data = await res.json()

      if (res.ok) {
        setCart((prevCart) => {
          const existingItem = prevCart.find((item) => item.id === data.product.id)
          if (existingItem) {
            // Jika produk sudah ada, tambahkan quantity
            return prevCart.map((item) =>
              item.id === data.product.id
                ? { ...item, quantity: item.quantity + 1, subtotal: 0 }
                : item
            )
          } else {
            // Jika belum ada, tambahkan item baru
            return [
              ...prevCart,
              {
                id: data.product.id,
                product: data.product,
                quantity: 1,
                subtotal: 0 // Gratis karena sudah ditukar dengan poin
              }
            ]
          }
        })
        toast.success('Kode Redeem Berhasil!', {
          description: `Hadiah gratis ${data.product.name} telah ditambahkan ke keranjang`,
          position: 'top-center'
        })
        setRedeemCode('')
      } else {
        toast.error('Kode Redeem Gagal', {
          description: data.error || 'Kode tidak valid atau sudah digunakan',
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

  const getCartTotal = () => {
    return cart.reduce((total, item) => total + item.subtotal, 0)
  }

  const getCartCount = () => {
    return cart.reduce((count, item) => count + item.quantity, 0)
  }

  const handleCheckout = async () => {
    if (!user) {
      toast.warning('Belum Login', {
        description: 'Silakan login terlebih dahulu',
        position: 'top-center'
      })
      window.location.href = '/login'
      return
    }

    if (cart.length === 0) {
      toast.warning('Keranjang Kosong', {
        description: 'Tambahkan produk ke keranjang terlebih dahulu',
        position: 'top-center'
      })
      return
    }

    const orderData = {
      userId: user.id,
      userName: user.username,
      userPhone: user.phone,
      userAddress: user.address || '',
      items: cart.map((item) => ({
        productId: item.product.id,
        quantity: item.quantity,
        price: item.product.price,
        subtotal: item.subtotal
      })),
      total: getCartTotal()
    }

    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData)
      })

      if (res.ok) {
        const data = await res.json()
        const whatsappUrl = data.whatsappUrl
        window.open(whatsappUrl, '_blank')

        toast.success('Pesanan Berhasil Dibuat!', {
          description: `Silakan selesaikan pembayaran via WhatsApp`,
          position: 'top-center'
        })

        setCart([])
        localStorage.removeItem('cart')
        setIsCartOpen(false)
      } else {
        const data = await res.json()
        toast.error('Pesanan Gagal', {
          description: data.error || 'Gagal membuat pesanan',
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

  const filteredProducts = selectedCategory === 'all'
    ? products.filter((product) => !product.isRedeemable)
    : products.filter((product) => !product.isRedeemable && product.category.name.toLowerCase() === selectedCategory)

  const getDiscountedPrice = (product: Product) => {
    return product.discount > 0
      ? Math.round(product.price * (1 - product.discount / 100))
      : product.price
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-orange-50 to-white">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm shadow-md border-b border-orange-200">
        <div className="container mx-auto px-3 sm:px-4 py-2 sm:py-3">
          <div className="flex items-center justify-between">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-2 sm:gap-3"
            >
              <div className="bg-gradient-to-br from-orange-500 to-orange-600 p-1.5 sm:p-2 rounded-full shadow-lg">
                {shopProfile?.logo ? (
                  <img src={shopProfile.logo} alt="Logo" className="w-4 h-4 sm:w-5 sm:h-5 rounded-full" />
                ) : (
                  <ChefHat className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                )}
              </div>
              <div>
                <h1 className="text-sm sm:text-lg font-bold text-orange-600 leading-tight">
                  {shopProfile?.storeName || 'AYAM GEPREK'}<br className="hidden sm:block" /> {shopProfile?.storeName?.includes('SAMBAL') ? '' : 'SAMBAL IJO'}
                </h1>
                <p className="text-[10px] sm:text-xs text-gray-500 hidden sm:block">{shopProfile?.slogan || 'Sambal Pedas Mantap'}</p>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-2"
            >
              <Sheet open={isCartOpen} onOpenChange={setIsCartOpen}>
                <SheetTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    className="relative bg-orange-50 border-orange-200 hover:bg-orange-100 hover:border-orange-300 w-9 h-9 sm:w-10 sm:h-10"
                  >
                    <ShoppingCart className="w-4 h-4 text-orange-600" />
                    {getCartCount() > 0 && (
                      <Badge className="absolute -top-1.5 -right-1.5 sm:-top-2 sm:-right-2 bg-orange-500 text-white text-[10px] sm:text-xs w-4.5 h-4.5 sm:w-5 sm:h-5 flex items-center justify-center p-0">
                        {getCartCount()}
                      </Badge>
                    )}
                  </Button>
                </SheetTrigger>
                <SheetContent className="w-full sm:max-w-md bg-gradient-to-b from-orange-50 to-white flex flex-col p-0">
                  <SheetHeader className="px-6 pt-6 pb-4 border-b border-orange-100 bg-white">
                    <SheetTitle className="text-orange-600">Keranjang Belanja</SheetTitle>
                  </SheetHeader>

                  {/* Scrollable Product List with Fade Overlay */}
                  <div className="flex-1 overflow-y-auto relative">
                    <ScrollArea className="h-full">
                      <div className="px-6 py-4 space-y-4 pb-20">
                        {cart.length === 0 ? (
                          <div className="text-center py-12 text-gray-500">
                            <ShoppingCart className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                            <p>Keranjang kosong</p>
                          </div>
                        ) : (
                          cart.map((item) => (
                            <motion.div
                              key={item.id}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, x: -10 }}
                              className="bg-white rounded-xl p-3 shadow-sm border border-orange-100"
                            >
                              <div className="flex gap-3">
                                {item.product.image && (
                                  <div className="w-16 h-16 rounded-lg overflow-hidden bg-orange-50 flex-shrink-0">
                                    <img
                                      src={item.product.image}
                                      alt={item.product.name}
                                      className="w-full h-full object-cover"
                                    />
                                  </div>
                                )}
                                <div className="flex-1 min-w-0">
                                  <h4 className="font-semibold text-sm text-gray-800 truncate">
                                    {item.product.name}
                                  </h4>
                                  <p className="text-orange-600 font-bold text-sm mt-1">
                                    Rp {item.product.price.toLocaleString('id-ID')}
                                  </p>
                                  {item.subtotal === 0 && (
                                    <Badge className="mt-1 bg-green-500 text-white text-xs">Redeem</Badge>
                                  )}
                                  <div className="flex items-center gap-2 mt-2">
                                    <Button
                                      size="icon"
                                      variant="outline"
                                      className="w-6 h-6 rounded-full bg-orange-50 border-orange-200"
                                      onClick={() => updateQuantity(item.id, -1)}
                                    >
                                      <Minus className="w-3 h-3" />
                                    </Button>
                                    <span className="w-8 text-center font-semibold text-sm">{item.quantity}</span>
                                    <Button
                                      size="icon"
                                      variant="outline"
                                      className="w-6 h-6 rounded-full bg-orange-50 border-orange-200"
                                      onClick={() => updateQuantity(item.id, 1)}
                                    >
                                      <Plus className="w-3 h-3" />
                                    </Button>
                                    <Button
                                      size="icon"
                                      variant="ghost"
                                      className="w-6 h-6 rounded-full text-red-500 hover:text-red-600 hover:bg-red-50 ml-auto"
                                      onClick={() => removeFromCart(item.id)}
                                    >
                                      <X className="w-4 h-4" />
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            </motion.div>
                          ))
                        )}
                      </div>
                    </ScrollArea>

                    {/* Fade Overlay at Bottom */}
                    {cart.length > 2 && (
                      <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-orange-50 to-transparent pointer-events-none" />
                    )}
                  </div>

                  {/* Sticky Checkout Section */}
                  <div className="flex-shrink-0 bg-white border-t border-orange-100 shadow-[-4px_0_12px_rgba(0,0,0,0.05)]">
                    <div className="px-6 py-4 space-y-4">
                      {user && (
                        <div className="p-3 bg-orange-50 rounded-xl border border-orange-100">
                          <div className="flex gap-2">
                            <Input
                              placeholder="Kode Redeem"
                              value={redeemCode}
                              onChange={(e) => setRedeemCode(e.target.value)}
                              className="flex-1 border-orange-200 focus-visible:ring-orange-500 text-sm bg-white"
                            />
                            <Button
                              onClick={handleRedeemCode}
                              className="bg-orange-500 hover:bg-orange-600 text-white text-sm px-3"
                            >
                              Gunakan
                            </Button>
                          </div>
                        </div>
                      )}

                      {cart.length > 0 && (
                        <>
                          <div className="flex justify-between items-center text-lg font-bold">
                            <span className="text-gray-700">Total:</span>
                            <span className="text-orange-600">Rp {getCartTotal().toLocaleString('id-ID')}</span>
                          </div>
                          <Button
                            onClick={handleCheckout}
                            className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-semibold py-4 flex items-center justify-center gap-2 shadow-lg"
                          >
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                            </svg>
                            Checkout WhatsApp
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </SheetContent>
              </Sheet>

              <Button
                variant="outline"
                size="sm"
                className="bg-orange-50 border-orange-200 hover:bg-orange-100 hover:border-orange-300 text-[10px] sm:text-xs px-2 sm:px-3 py-1 sm:py-2 h-8 sm:h-9"
                onClick={() => {
                  if (user) {
                    window.location.href = '/dashboard'
                  } else {
                    window.location.href = '/login'
                  }
                }}
              >
                <User className="w-3 h-3 sm:w-3.5 sm:h-3.5 mr-1 text-orange-600" />
                <span className="hidden sm:inline">{user ? user.username : 'Login'}</span>
                <span className="sm:hidden">Akun</span>
              </Button>
            </motion.div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-orange-500 via-orange-400 to-orange-300 text-white py-8 sm:py-12 md:py-20 overflow-hidden">
        <div className="absolute inset-0 opacity-30 bg-[radial-gradient(white_1px,transparent_1px)] bg-[size:20px_20px]"></div>
        <div className="container mx-auto px-3 sm:px-4 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center max-w-3xl mx-auto"
          >
            {/* Halal Badge Animation */}
            <motion.div
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3, duration: 0.5 }}
              className="inline-flex items-center justify-center mb-4 sm:mb-6"
            >
              <motion.div
                animate={{
                  boxShadow: [
                    '0 0 0 0px rgba(255, 255, 255, 0.7)',
                    '0 0 0 20px rgba(255, 255, 255, 0)',
                    '0 0 0 0px rgba(255, 255, 255, 0)',
                  ],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: 'easeOut',
                }}
                className="relative"
              >
                <div className="bg-white/20 backdrop-blur-sm border-2 border-white/50 rounded-full px-4 py-2 flex items-center gap-2">
                  <motion.div
                    animate={{ rotate: [0, 360] }}
                    transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
                    className="text-green-400"
                  >
                    <svg className="w-6 h-6 sm:w-8 sm:h-8" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2L13.09 8.26L19 7L14.74 11.26L17 17L12 14.5L7 17L9.26 11.26L5 7L10.91 8.26L12 2Z" />
                    </svg>
                  </motion.div>
                  <span className="text-white font-bold text-base sm:text-xl tracking-wider">
                    HALAL
                  </span>
                  <span className="text-white/80 text-[10px] sm:text-xs font-medium">
                    100% Halal
                  </span>
                </div>
              </motion.div>
            </motion.div>
            
            <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-5xl font-bold mb-2 sm:mb-3 leading-tight">
              Nikmati Kelezatan<br className="sm:hidden" />
              <span className="block sm:inline"> {shopProfile?.storeName?.replace('AYAM GEPREK', '').replace('SAMBAL IJO', '').trim() || 'Ayam Geprek'} </span>
              <span className="text-yellow-200">Sambal Ijo</span>
            </h2>
            <p className="text-sm sm:text-base md:text-xl opacity-90 mb-4 sm:mb-6 leading-relaxed px-2">
              {shopProfile?.slogan || 'Sambal pedas mantap dengan cita rasa otentik. Pesan sekarang dan nikmati kelezatannya!'}
            </p>
            <Button
              size="lg"
              className="bg-white text-orange-600 hover:bg-orange-50 font-semibold px-4 sm:px-6 py-3 sm:py-5 text-xs sm:text-base shadow-xl hover:shadow-2xl transition-all"
              onClick={() => document.getElementById('products')?.scrollIntoView({ behavior: 'smooth' })}
            >
              <ShoppingCart className="w-4 h-4 sm:w-5 sm:h-5 mr-1 sm:mr-2" />
              Pesan Sekarang
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-3 sm:py-4 bg-white sticky top-14 sm:top-16 z-40 border-b border-orange-100 shadow-sm">
        <div className="container mx-auto px-3 sm:px-4">
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            <Button
              variant={selectedCategory === 'all' ? 'default' : 'outline'}
              size="sm"
              className={`${
                selectedCategory === 'all'
                  ? 'bg-orange-500 hover:bg-orange-600 text-white border-orange-500'
                  : 'border-orange-200 text-gray-700 hover:bg-orange-50 hover:border-orange-300'
              } rounded-full whitespace-nowrap text-xs sm:text-sm px-3 py-1.5`}
              onClick={() => setSelectedCategory('all')}
            >
              Semua
            </Button>
            {categories.map((category) => (
              <Button
                key={category.id}
                variant={selectedCategory === category.slug ? 'default' : 'outline'}
                size="sm"
                className={`${
                  selectedCategory === category.slug
                    ? 'bg-orange-500 hover:bg-orange-600 text-white border-orange-500'
                    : 'border-orange-200 text-gray-700 hover:bg-orange-50 hover:border-orange-300'
                } rounded-full whitespace-nowrap text-xs sm:text-sm px-3 py-1.5`}
                onClick={() => setSelectedCategory(category.slug)}
              >
                {category.name}
              </Button>
            ))}
          </div>
        </div>
      </section>

      {/* Products Grid */}
      <section id="products" className="py-6 sm:py-8 flex-1">
        <div className="container mx-auto px-3 sm:px-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2 sm:gap-3">
            <AnimatePresence>
              {filteredProducts.map((product, index) => (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ delay: index * 0.03 }}
                  whileHover={{ y: -3 }}
                  className="cursor-pointer group"
                  onClick={() => handleProductClick(product)}
                >
                  <Card className="overflow-hidden border border-orange-100 hover:border-orange-300 transition-all duration-300 shadow-sm hover:shadow-lg bg-white">
                    <div className="relative aspect-square bg-gradient-to-br from-orange-50 to-orange-100 overflow-hidden">
                      {product.image ? (
                        <img
                          src={product.image}
                          alt={product.name}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <ChefHat className="w-8 h-8 sm:w-10 sm:h-10 text-orange-300" />
                        </div>
                      )}
                      {product.isPromotion && (
                        <Badge className="absolute top-1 sm:top-1 left-1 sm:left-1 bg-red-500 text-white text-[9px] sm:text-[10px] font-bold px-1.5 py-0.5">
                          PROMO
                        </Badge>
                      )}
                      {product.isNew && (
                        <Badge className="absolute top-1 sm:top-1 right-1 sm:right-1 bg-green-500 text-white text-[9px] sm:text-[10px] font-bold px-1.5 py-0.5">
                          BARU
                        </Badge>
                      )}
                      {product.discount > 0 && (
                        <Badge className="absolute bottom-1 left-1 sm:left-1 bg-orange-500 text-white text-[9px] sm:text-[10px] font-bold px-1.5 py-0.5">
                          -{product.discount}%
                        </Badge>
                      )}
                    </div>
                    <CardContent className="p-1.5 sm:p-2">
                      <h3 className="font-semibold text-[10px] sm:text-xs text-gray-800 mb-1 line-clamp-2 leading-tight min-h-[2.2rem] sm:min-h-[1.2rem]">
                        {product.name}
                      </h3>
                      <div className="flex items-center justify-between gap-1">
                        <div className="flex-1 min-w-0">
                          {product.discount > 0 ? (
                            <div>
                              <p className="text-[9px] sm:text-[10px] text-gray-400 line-through">
                                Rp {product.price.toLocaleString('id-ID')}
                              </p>
                              <p className="text-xs sm:text-sm font-bold text-orange-600 leading-tight truncate">
                                Rp {getDiscountedPrice(product).toLocaleString('id-ID')}
                              </p>
                            </div>
                          ) : (
                            <p className="text-xs sm:text-sm font-bold text-orange-600 leading-tight truncate">
                              Rp {product.price.toLocaleString('id-ID')}
                            </p>
                          )}
                        </div>
                        <Button
                          size="icon"
                          className="bg-orange-500 hover:bg-orange-600 text-white rounded-full w-6 h-6 sm:w-7 sm:h-7 p-0 flex-shrink-0"
                          onClick={(e) => {
                            e.stopPropagation()
                            addToCart(product)
                          }}
                        >
                          <Plus className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {filteredProducts.length === 0 && (
            <div className="text-center py-20 text-gray-500">
              <ChefHat className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <p className="text-lg">Tidak ada produk tersedia</p>
            </div>
          )}
        </div>
      </section>

      {/* Product Detail Dialog */}
      <Dialog open={isProductDialogOpen} onOpenChange={setIsProductDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          {selectedProduct && (
            <>
              <DialogHeader>
                <DialogTitle className="text-xl font-bold text-gray-900">
                  {selectedProduct.name}
                </DialogTitle>
                <DialogDescription className="text-sm text-gray-500">
                  {selectedProduct.category.name}
                </DialogDescription>
              </DialogHeader>
              <div className="mt-4 space-y-4">
                {selectedProduct.image && (
                  <div className="relative aspect-video rounded-lg overflow-hidden bg-orange-50">
                    <img
                      src={selectedProduct.image}
                      alt={selectedProduct.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}

                <div className="flex items-center gap-2">
                  {selectedProduct.isPromotion && (
                    <Badge className="bg-red-500 text-white text-xs font-bold">PROMO</Badge>
                  )}
                  {selectedProduct.isNew && (
                    <Badge className="bg-green-500 text-white text-xs font-bold">BARU</Badge>
                  )}
                  {selectedProduct.discount > 0 && (
                    <Badge className="bg-orange-500 text-white text-xs font-bold">
                      -{selectedProduct.discount}%
                    </Badge>
                  )}
                </div>

                {selectedProduct.description && (
                  <p className="text-gray-600 text-sm leading-relaxed">
                    {selectedProduct.description}
                  </p>
                )}

                <div className="border-t border-orange-100 pt-4">
                  <div className="flex items-end gap-2 mb-4">
                    {selectedProduct.discount > 0 ? (
                      <>
                        <p className="text-2xl font-bold text-orange-600">
                          Rp {getDiscountedPrice(selectedProduct).toLocaleString('id-ID')}
                        </p>
                        <p className="text-sm text-gray-400 line-through mb-1">
                          Rp {selectedProduct.price.toLocaleString('id-ID')}
                        </p>
                      </>
                    ) : (
                      <p className="text-2xl font-bold text-orange-600">
                        Rp {selectedProduct.price.toLocaleString('id-ID')}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="flex items-center border border-orange-200 rounded-lg">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="w-8 h-8 rounded-l-lg hover:bg-orange-50"
                        onClick={() => setDialogQuantity(Math.max(1, dialogQuantity - 1))}
                      >
                        <Minus className="w-4 h-4" />
                      </Button>
                      <span className="w-10 text-center font-semibold">{dialogQuantity}</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="w-8 h-8 rounded-r-lg hover:bg-orange-50"
                        onClick={() => setDialogQuantity(dialogQuantity + 1)}
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                    <Button
                      className="flex-1 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold"
                      onClick={() => {
                        addToCart(selectedProduct, dialogQuantity)
                        setIsProductDialogOpen(false)
                      }}
                    >
                      <ShoppingCart className="w-4 h-4 mr-2" />
                      Tambah ke Keranjang
                    </Button>
                  </div>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Footer */}
      <footer className="bg-gradient-to-r from-orange-500 via-yellow-400 to-orange-400 border-t border-orange-300 mt-auto">
        <div className="container mx-auto px-3 sm:px-4 py-6 sm:py-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="bg-white/20 backdrop-blur-sm p-1.5 rounded-full">
                  {shopProfile?.logo ? (
                    <img src={shopProfile.logo} alt="Logo" className="w-5 h-5 sm:w-6 sm:h-6 rounded-full" />
                  ) : (
                    <ChefHat className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                  )}
                </div>
                <h3 className="text-base sm:text-lg font-bold text-white">{shopProfile?.storeName || 'AYAM GEPREK SAMBAL IJO'}</h3>
              </div>
              <p className="text-white/90 text-xs sm:text-sm">{shopProfile?.slogan || 'Sambal Pedas Mantap'}</p>
              <div className="flex gap-3 mt-3">
                {shopProfile?.instagram && (
                  <a
                    href={shopProfile.instagram.startsWith('http') ? shopProfile.instagram : `https://instagram.com/${shopProfile.instagram.replace('@', '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white hover:text-white transition-all p-2 rounded-full"
                  >
                    <Instagram className="w-4 h-4 sm:w-5 sm:h-5" />
                  </a>
                )}
                {shopProfile?.facebook && (
                  <a
                    href={shopProfile.facebook.startsWith('http') ? shopProfile.facebook : `https://facebook.com/${shopProfile.facebook}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white hover:text-white transition-all p-2 rounded-full"
                  >
                    <Facebook className="w-4 h-4 sm:w-5 sm:h-5" />
                  </a>
                )}
              </div>
            </div>
            <div>
              <h4 className="font-bold text-white mb-3 text-sm">Kontak</h4>
              <div className="space-y-2 text-white/90 text-xs sm:text-sm">
                {shopProfile?.whatsapp && (
                  <a
                    href={`https://wa.me/${shopProfile.whatsapp.replace(/\D/g, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 hover:text-white transition-colors bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-lg px-3 py-2"
                  >
                    <Phone className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    <span>{shopProfile.whatsapp}</span>
                  </a>
                )}
                {shopProfile?.address && (
                  <div className="flex items-start gap-2 bg-white/10 backdrop-blur-sm rounded-lg px-3 py-2">
                    <MapPin className="w-3.5 h-3.5 sm:w-4 sm:h-4 mt-0.5 flex-shrink-0" />
                    <span className="text-[10px] sm:text-xs leading-tight whitespace-pre-line">
                      {shopProfile.address}
                    </span>
                  </div>
                )}
              </div>
            </div>
            <div>
              <h4 className="font-bold text-white mb-3 text-sm">Jam Operasional</h4>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg px-3 py-2">
                <p className="text-white/90 text-xs sm:text-sm whitespace-pre-line">
                  {shopProfile?.operatingHours || 'Senin - Minggu\n10:00 - 22:00 WIB'}
                </p>
              </div>
            </div>
          </div>
          <Separator className="my-4 sm:my-6 bg-white/30" />
          <div className="text-center text-white/80 text-[10px] sm:text-xs">
            © 2024 {shopProfile?.storeName || 'Ayam Geprek Sambal Ijo'}. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  )
}
