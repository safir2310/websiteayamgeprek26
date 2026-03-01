import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const { username, lastFourDigits, newPassword } = await request.json()

    // Validate input
    if (!username || !lastFourDigits || !newPassword) {
      return NextResponse.json(
        { error: 'Semua field harus diisi' },
        { status: 400 }
      )
    }

    // Validate last 4 digits
    if (!/^\d{4}$/.test(lastFourDigits)) {
      return NextResponse.json(
        { error: '4 digit terakhir harus berupa angka' },
        { status: 400 }
      )
    }

    // Validate password length
    if (newPassword.length < 4) {
      return NextResponse.json(
        { error: 'Password minimal 4 karakter' },
        { status: 400 }
      )
    }

    // Find user by username
    const user = await db.user.findUnique({
      where: { username }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'Username tidak ditemukan' },
        { status: 404 }
      )
    }

    // Verify last 4 digits of phone number
    const userLastFour = user.phone.slice(-4)
    if (userLastFour !== lastFourDigits) {
      return NextResponse.json(
        { error: '4 digit terakhir nomor HP tidak cocok' },
        { status: 400 }
      )
    }

    // Update password
    const updatedUser = await db.user.update({
      where: { username },
      data: { password: newPassword }
    })

    return NextResponse.json({
      success: true,
      message: 'Password berhasil direset',
      user: {
        id: updatedUser.id,
        username: updatedUser.username,
        email: updatedUser.email,
        phone: updatedUser.phone,
        role: updatedUser.role,
        points: updatedUser.points,
        address: updatedUser.address
      }
    })
  } catch (error) {
    console.error('Forgot password error:', error)
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}
