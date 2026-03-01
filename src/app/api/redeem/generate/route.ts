import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import crypto from 'crypto'

// Helper function to emit WebSocket event (non-blocking)
async function emitEvent(event: string, data: any) {
  try {
    if (process.env.NODE_ENV !== 'production') {
      await fetch('http://localhost:3003/emit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ event, data }),
        signal: AbortSignal.timeout(1000)
      }).catch(() => {
        console.log('WebSocket service not available, skipping event emission')
      })
    }
  } catch (error) {
    console.log('WebSocket emit failed:', error)
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId, points } = await request.json()

    if (!userId || !points || points <= 0) {
      return NextResponse.json({ error: 'User ID dan poin wajib diisi' }, { status: 400 })
    }

    // Get user
    const user = await db.user.findUnique({
      where: { id: userId }
    })

    if (!user) {
      return NextResponse.json({ error: 'User tidak ditemukan' }, { status: 404 })
    }

    // Check if user has enough points
    if (user.points < points) {
      return NextResponse.json({ error: 'Poin tidak cukup' }, { status: 400 })
    }

    // Generate redeem code
    const code = `REDEEM-${crypto.randomBytes(4).toString('hex').toUpperCase()}`

    // Create redeem code
    const redeemCode = await db.redeemCode.create({
      data: {
        code,
        userId,
        pointsUsed: points,
        status: 'active'
      }
    })

    // Deduct points from user
    const updatedUser = await db.user.update({
      where: { id: userId },
      data: {
        points: {
          decrement: points
        }
      }
    })

    // Add point history
    await db.pointHistory.create({
      data: {
        userId,
        type: 'redeemed',
        points,
        description: `Membuat kode redeem - ${code}`,
        redeemCodeId: redeemCode.id
      }
    })

    // Emit WebSocket event for points update (non-blocking)
    emitEvent('points:updated', {
      userId: updatedUser.id,
      username: updatedUser.username,
      pointsDeducted: points,
      totalPoints: updatedUser.points,
      type: 'redeemed',
      description: `Membuat kode redeem - ${code}`
    })

    return NextResponse.json({
      message: 'Kode redeem berhasil dibuat',
      redeemCode
    })
  } catch (error) {
    console.error('Generate redeem code error:', error)
    return NextResponse.json({ error: 'Terjadi kesalahan' }, { status: 500 })
  }
}
