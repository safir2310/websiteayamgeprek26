import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    console.log('[Upload] Starting file upload...')

    const formData = await request.formData()
    const file = formData.get('file') as File

    console.log('[Upload] File received:', file?.name, file?.type, file?.size)

    if (!file) {
      console.error('[Upload] No file provided')
      return NextResponse.json({ error: 'Tidak ada file yang diupload' }, { status: 400 })
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      console.error('[Upload] Invalid file type:', file.type)
      return NextResponse.json(
        { error: 'Tipe file tidak valid. Hanya JPEG, PNG, dan WebP yang diizinkan' },
        { status: 400 }
      )
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024 // 5MB
    if (file.size > maxSize) {
      console.error('[Upload] File too large:', file.size)
      return NextResponse.json(
        { error: 'Ukuran file terlalu besar. Maksimal 5MB' },
        { status: 400 }
      )
    }

    console.log('[Upload] Converting file to base64...')

    // Convert file to base64 data URL
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const base64 = buffer.toString('base64')
    const mimeType = file.type
    const dataUrl = `data:${mimeType};base64,${base64}`

    console.log('[Upload] Base64 conversion complete, size:', dataUrl.length)

    // Return the data URL
    return NextResponse.json({
      success: true,
      url: dataUrl,
      filename: file.name
    })
  } catch (error) {
    console.error('[Upload] Upload error:', error)
    return NextResponse.json(
      { error: 'Gagal mengupload gambar: ' + (error instanceof Error ? error.message : 'Unknown error') },
      { status: 500 }
    )
  }
}
