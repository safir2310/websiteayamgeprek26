'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { motion } from 'framer-motion'
import { ChefHat, User, ShieldCheck, ArrowLeft, Lock } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'

export default function LoginPage() {
  const [role, setRole] = useState<'user' | 'admin'>('user')
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  })
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          role
        })
      })

      const data = await res.json()

      if (res.ok) {
        localStorage.setItem('user', JSON.stringify(data.user))
        localStorage.setItem('token', data.token)

        // Success toast
        toast.success('Login Berhasil!', {
          description: `Selamat datang, ${data.user.username}!`,
          position: 'top-center'
        })

        // Redirect after short delay
        setTimeout(() => {
          if (data.user.role === 'admin') {
            window.location.href = '/admin'
          } else {
            window.location.href = '/dashboard'
          }
        }, 1500)
      } else {
        // Error toast
        toast.error('Login Gagal', {
          description: data.error || 'Username atau password salah',
          position: 'top-center'
        })
      }
    } catch (error) {
      // Error toast
      toast.error('Terjadi Kesalahan', {
        description: 'Silakan coba lagi nanti',
        position: 'top-center'
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-orange-900 via-orange-700 to-orange-500">
      {/* Header */}
      <header className="p-4">
        <Link href="/">
          <Button variant="ghost" className="text-white hover:text-orange-200">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Kembali
          </Button>
        </Link>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-md">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="text-center mb-8"
          >
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-orange-500 to-orange-600 rounded-full shadow-xl mb-4"
            >
              <ChefHat className="w-10 h-10 text-white" />
            </motion.div>
            <motion.h1
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-2xl font-bold text-orange-600"
            >
              AYAM GEPREK SAMBAL IJO
            </motion.h1>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.5 }}
          >
            <Card className="border-2 border-orange-100 shadow-xl bg-white/95 backdrop-blur-sm">
              <CardContent className="p-8">
                {/* Role Toggle */}
                <div className="flex bg-orange-50 rounded-lg p-1 mb-6">
                  <button
                    onClick={() => setRole('user')}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-md transition-all duration-300 ${
                      role === 'user'
                        ? 'bg-white text-orange-600 shadow-md'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    <User className="w-4 h-4" />
                    <span className="font-medium">User</span>
                  </button>
                  <button
                    onClick={() => setRole('admin')}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-md transition-all duration-300 ${
                      role === 'admin'
                        ? 'bg-white text-orange-600 shadow-md'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    <ShieldCheck className="w-4 h-4" />
                    <span className="font-medium">Admin</span>
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="space-y-2">
                    <Input
                      type="text"
                      placeholder="Username"
                      value={formData.username}
                      onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                      className="border-orange-200 focus-visible:ring-orange-500 focus-visible:border-orange-500 rounded-xl h-12"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <Input
                        type="password"
                        placeholder="Password"
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        className="pl-10 border-orange-200 focus-visible:ring-orange-500 focus-visible:border-orange-500 rounded-xl h-12"
                        required
                      />
                    </div>
                  </div>

                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold py-6 rounded-xl h-12 text-base"
                  >
                    {isLoading ? 'Memproses...' : 'Login'}
                  </Button>
                </form>

                <div className="mt-4 text-center">
                  <Link
                    href="/forgot-password"
                    className="text-sm text-orange-600 hover:text-orange-700 font-medium hover:underline"
                  >
                    Lupa Password?
                  </Link>
                </div>

                <div className="mt-6 text-center">
                  <p className="text-gray-600 text-sm">
                    Belum punya akun?{' '}
                    <Link href="/register" className="text-orange-600 hover:text-orange-700 font-medium hover:underline">
                      Daftar
                    </Link>
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gradient-to-b from-orange-800 to-orange-900 border-t border-orange-700 py-6">
        <div className="container mx-auto px-4 text-center text-gray-300 text-sm">
          © 2024 Ayam Geprek Sambal Ijo. All rights reserved.
        </div>
      </footer>
    </div>
  )
}
