import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

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

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    // Get all redeemable products
    const products = await db.product.findMany({
      where: {
        isRedeemable: true,
        stock: {
          gt: 0
        }
      },
      include: {
        category: true
      },
      orderBy: {
        order: 'asc'
      }
    })

    // If userId provided, check which products user can afford
    if (userId) {
      const user = await db.user.findUnique({
        where: { id: userId }
      })

      if (user) {
        const affordableProducts = products.map(product => ({
          ...product,
          canAfford: user.points >= product.redeemPoints
        }))
        return NextResponse.json(affordableProducts)
      }
    }

    return NextResponse.json(products)
  } catch (error) {
    console.error('Fetch redeemable products error:', error)
    return NextResponse.json({ error: 'Terjadi kesalahan' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId, productId } = await request.json()

    if (!userId || !productId) {
      return NextResponse.json(
        { error: 'User ID dan Product ID wajib diisi' },
        { status: 400 }
      )
    }

    // Get user
    const user = await db.user.findUnique({
      where: { id: userId }
    })

    if (!user) {
      return NextResponse.json({ error: 'User tidak ditemukan' }, { status: 404 })
    }

    // Get product
    const product = await db.product.findUnique({
      where: { id: productId }
    })

    if (!product) {
      return NextResponse.json({ error: 'Produk tidak ditemukan' }, { status: 404 })
    }

    // Check if product is redeemable
    if (!product.isRedeemable) {
      return NextResponse.json(
        { error: 'Produk ini tidak dapat ditukar dengan point' },
        { status: 400 }
      )
    }

    // Check if user has enough points
    if (user.points < product.redeemPoints) {
      return NextResponse.json({ error: 'Poin tidak cukup' }, { status: 400 })
    }

    // Check product stock
    if (product.stock <= 0) {
      return NextResponse.json(
        { error: 'Stok produk habis' },
        { status: 400 }
      )
    }

    // Deduct points from user
    const updatedUser = await db.user.update({
      where: { id: userId },
      data: {
        points: {
          decrement: product.redeemPoints
        }
      }
    })

    // Decrease product stock
    await db.product.update({
      where: { id: productId },
      data: {
        stock: {
          decrement: 1
        }
      }
    })

    // Create redeem item record
    await db.redeemItem.create({
      data: {
        userId,
        productId,
        pointsUsed: product.redeemPoints
      }
    })

    // Add point history
    await db.pointHistory.create({
      data: {
        userId,
        type: 'exchanged',
        points: product.redeemPoints,
        description: `Menukar point - ${product.name}`
      }
    })

    // Emit WebSocket event for points update (non-blocking)
    emitEvent('points:updated', {
      userId: updatedUser.id,
      username: updatedUser.username,
      pointsDeducted: product.redeemPoints,
      totalPoints: updatedUser.points,
      type: 'exchanged',
      description: `Menukar point - ${product.name}`
    })

    return NextResponse.json({
      success: true,
      message: 'Berhasil menukar point dengan produk',
      product,
      pointsUsed: product.redeemPoints,
      remainingPoints: updatedUser.points
    })
  } catch (error) {
    console.error('Exchange points error:', error)
    return NextResponse.json({ error: 'Terjadi kesalahan' }, { status: 500 })
  }
}
