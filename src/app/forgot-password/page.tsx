'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { motion } from 'framer-motion'
import { ChefHat, ArrowLeft, Lock, Smartphone, CheckCircle } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'

export default function ForgotPasswordPage() {
  const [formData, setFormData] = useState({
    username: '',
    lastFourDigits: '',
    newPassword: '',
    confirmPassword: ''
  })
  const [isLoading, setIsLoading] = useState(false)
  const [step, setStep] = useState(1) // Step 1: Input username & phone, Step 2: Success

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    // Validate passwords match
    if (formData.newPassword !== formData.confirmPassword) {
      toast.error('Password Tidak Cocok', {
        description: 'Password baru dan konfirmasi harus sama',
        position: 'top-center'
      })
      setIsLoading(false)
      return
    }

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: formData.username,
          lastFourDigits: formData.lastFourDigits,
          newPassword: formData.newPassword
        })
      })

      const data = await res.json()

      if (res.ok) {
        // Show success toast
        toast.success('Password Berhasil Direset!', {
          description: 'Anda sekarang bisa login dengan password baru',
          position: 'top-center'
        })

        // Move to success step
        setStep(2)

        // Auto redirect after 2 seconds
        setTimeout(() => {
          window.location.href = '/login'
        }, 2000)
      } else {
        toast.error('Reset Password Gagal', {
          description: data.error || 'Gagal mereset password',
          position: 'top-center'
        })
      }
    } catch (error) {
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
        <Link href="/login">
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
              Lupa Password
            </motion.h1>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="text-gray-600 mt-2"
            >
              {step === 1
                ? 'Masukkan 4 digit terakhir nomor HP Anda untuk mereset password'
                : 'Password berhasil direset!'}
            </motion.p>
          </motion.div>

          {step === 1 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.5 }}
            >
              <Card className="border-2 border-orange-100 shadow-xl bg-white/95 backdrop-blur-sm">
                <CardContent className="p-8">
                  <form onSubmit={handleSubmit} className="space-y-5">
                    {/* Username */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">
                        Username
                      </label>
                      <Input
                        type="text"
                        placeholder="Masukkan username"
                        value={formData.username}
                        onChange={(e) =>
                          setFormData({ ...formData, username: e.target.value })
                        }
                        className="border-orange-200 focus-visible:ring-orange-500 focus-visible:border-orange-500 rounded-xl h-12"
                        required
                      />
                    </div>

                    {/* Last 4 Digits of Phone */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                        <Smartphone className="w-4 h-4 text-orange-500" />
                        4 Digit Terakhir Nomor HP
                      </label>
                      <Input
                        type="text"
                        placeholder="Contoh: 2758"
                        value={formData.lastFourDigits}
                        onChange={(e) => {
                          // Only allow numbers and max 4 digits
                          const value = e.target.value.replace(/\D/g, '').slice(0, 4)
                          setFormData({ ...formData, lastFourDigits: value })
                        }}
                        maxLength={4}
                        className="border-orange-200 focus-visible:ring-orange-500 focus-visible:border-orange-500 rounded-xl h-12 text-center text-lg tracking-widest"
                        required
                      />
                      <p className="text-xs text-gray-500">
                        Masukkan 4 digit terakhir nomor HP yang terdaftar
                      </p>
                    </div>

                    {/* New Password */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                        <Lock className="w-4 h-4 text-orange-500" />
                        Password Baru
                      </label>
                      <Input
                        type="password"
                        placeholder="Masukkan password baru"
                        value={formData.newPassword}
                        onChange={(e) =>
                          setFormData({ ...formData, newPassword: e.target.value })
                        }
                        className="border-orange-200 focus-visible:ring-orange-500 focus-visible:border-orange-500 rounded-xl h-12"
                        required
                        minLength={4}
                      />
                    </div>

                    {/* Confirm Password */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                        <Lock className="w-4 h-4 text-orange-500" />
                        Konfirmasi Password
                      </label>
                      <Input
                        type="password"
                        placeholder="Ulangi password baru"
                        value={formData.confirmPassword}
                        onChange={(e) =>
                          setFormData({ ...formData, confirmPassword: e.target.value })
                        }
                        className="border-orange-200 focus-visible:ring-orange-500 focus-visible:border-orange-500 rounded-xl h-12"
                        required
                        minLength={4}
                      />
                      {formData.confirmPassword &&
                        formData.newPassword !== formData.confirmPassword && (
                          <p className="text-xs text-red-500">
                            Password tidak cocok
                          </p>
                        )}
                    </div>

                    <Button
                      type="submit"
                      disabled={isLoading}
                      className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold py-6 rounded-xl h-12 text-base"
                    >
                      {isLoading ? 'Memproses...' : 'Reset Password'}
                    </Button>
                  </form>

                  <div className="mt-6 text-center">
                    <p className="text-gray-600 text-sm">
                      Ingat password lagi?{' '}
                      <Link
                        href="/login"
                        className="text-orange-600 hover:text-orange-700 font-medium hover:underline"
                      >
                        Login
                      </Link>
                    </p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center"
            >
              <Card className="border-2 border-green-100 shadow-xl bg-white/95 backdrop-blur-sm">
                <CardContent className="p-12">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                    className="inline-flex items-center justify-center w-20 h-20 bg-green-500 rounded-full shadow-xl mb-6"
                  >
                    <CheckCircle className="w-10 h-10 text-white" />
                  </motion.div>
                  <h2 className="text-2xl font-bold text-gray-800 mb-2">
                    Password Berhasil Direset!
                  </h2>
                  <p className="text-gray-600 mb-6">
                    Anda akan dialihkan ke halaman login dalam beberapa detik...
                  </p>
                  <Button
                    onClick={() => (window.location.href = '/login')}
                    className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white"
                  >
                    Login Sekarang
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          )}
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
