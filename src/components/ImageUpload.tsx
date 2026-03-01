'use client'

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Upload, X, Image as ImageIcon, Loader2 } from 'lucide-react'
import { motion } from 'framer-motion'
import { toast } from 'sonner'

interface ImageUploadProps {
  value?: string
  onChange: (url: string) => void
  maxSize?: number // in MB
}

export default function ImageUpload({ value, onChange, maxSize = 5 }: ImageUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [preview, setPreview] = useState<string | null>(value || null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    console.log('[ImageUpload] File selected:', file.name, file.type, file.size)

    // Validate file size
    if (file.size > maxSize * 1024 * 1024) {
      toast.error('Ukuran File Terlalu Besar', {
        description: `Maksimal ${maxSize}MB`,
        position: 'top-center'
      })
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
      return
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      toast.error('Tipe File Tidak Valid', {
        description: 'Hanya JPEG, PNG, dan WebP yang diizinkan',
        position: 'top-center'
      })
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
      return
    }

    // Create preview
    const reader = new FileReader()
    reader.onloadend = () => {
      setPreview(reader.result as string)
      console.log('[ImageUpload] Preview created')
    }
    reader.onerror = () => {
      console.error('[ImageUpload] Failed to create preview')
      toast.error('Gagal Membaca File', {
        description: 'Terjadi kesalahan saat membaca file',
        position: 'top-center'
      })
    }
    reader.readAsDataURL(file)

    // Upload file
    setUploading(true)
    try {
      console.log('[ImageUpload] Starting upload...')

      const formData = new FormData()
      formData.append('file', file)

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      })

      console.log('[ImageUpload] Upload response status:', res.status)

      const data = await res.json()
      console.log('[ImageUpload] Upload response data:', data)

      if (res.ok && data.url) {
        onChange(data.url)
        toast.success('Upload Berhasil!', {
          description: 'Gambar berhasil diupload',
          position: 'top-center'
        })
      } else {
        console.error('[ImageUpload] Upload failed:', data)
        toast.error('Upload Gagal', {
          description: data.error || 'Gagal mengupload gambar',
          position: 'top-center'
        })
        setPreview(value || null)
        if (fileInputRef.current) {
          fileInputRef.current.value = ''
        }
      }
    } catch (error) {
      console.error('[ImageUpload] Upload error:', error)
      toast.error('Terjadi Kesalahan', {
        description: error instanceof Error ? error.message : 'Silakan coba lagi nanti',
        position: 'top-center'
      })
      setPreview(value || null)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    } finally {
      setUploading(false)
    }
  }

  const handleRemove = () => {
    setPreview(null)
    onChange('')
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleButtonClick = () => {
    fileInputRef.current?.click()
  }

  return (
    <div className="space-y-2">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp"
        onChange={handleFileSelect}
        className="hidden"
      />

      {preview ? (
        <Card className="border-2 border-orange-200 overflow-hidden">
          <CardContent className="p-0">
            <div className="relative aspect-square bg-gradient-to-br from-orange-50 to-orange-100">
              <img
                src={preview}
                alt="Preview"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    onClick={handleRemove}
                    disabled={uploading}
                    className="rounded-full"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <Card
            className="border-2 border-dashed border-orange-300 hover:border-orange-400 transition-colors cursor-pointer overflow-hidden"
            onClick={handleButtonClick}
          >
            <CardContent className="p-0">
              <div className="aspect-square flex flex-col items-center justify-center bg-gradient-to-br from-orange-50 to-orange-100 text-gray-600">
                {uploading ? (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex flex-col items-center gap-3"
                  >
                    <Loader2 className="w-12 h-12 text-orange-500 animate-spin" />
                    <p className="text-sm font-medium text-orange-600">Mengupload...</p>
                  </motion.div>
                ) : (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex flex-col items-center gap-3"
                  >
                    <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center">
                      <Upload className="w-8 h-8 text-orange-500" />
                    </div>
                    <div className="text-center px-4">
                      <p className="text-sm font-medium text-gray-700 mb-1">
                        Klik untuk upload gambar
                      </p>
                      <p className="text-xs text-gray-500">
                        JPEG, PNG, atau WebP (Maks. {maxSize}MB)
                      </p>
                    </div>
                  </motion.div>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {preview && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleButtonClick}
          disabled={uploading}
          className="w-full border-orange-200 text-orange-600 hover:bg-orange-50"
        >
          <Upload className="w-4 h-4 mr-2" />
          Ganti Gambar
        </Button>
      )}
    </div>
  )
}
