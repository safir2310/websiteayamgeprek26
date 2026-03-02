import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { emitWebSocketEvent } from '@/lib/websocket'

// Generate unique redeem code
function generateRedeemCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let code = ''
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return code
}

export async function GET(request: NextRequest) {
  try {
    const products = await db.product.findMany({
      where: { isRedeemable: true },
      include: { category: true },
      orderBy: { order: 'asc' }
    })

    return NextResponse.json(products)
  } catch (error) {
    console.error('Fetch redeem products error:', error)
    return NextResponse.json({ error: 'Terjadi kesalahan' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId, productId } = await request.json()

    if (!userId || !productId) {
      return NextResponse.json({ error: 'User ID dan Product ID wajib diisi' }, { status: 400 })
    }

    // Get user and product
    const user = await db.user.findUnique({ where: { id: userId } })
    const product = await db.product.findUnique({
      where: { id: productId },
      include: { category: true }
    })

    if (!user) {
      return NextResponse.json({ error: 'User tidak ditemukan' }, { status: 404 })
    }

    if (!product) {
      return NextResponse.json({ error: 'Produk tidak ditemukan' }, { status: 404 })
    }

    if (!product.isRedeemable) {
      return NextResponse.json({ error: 'Produk ini tidak bisa ditukar dengan poin' }, { status: 400 })
    }

    // Check stock
    if (product.stock <= 0) {
      return NextResponse.json({ error: 'Stok produk habis' }, { status: 400 })
    }

    // Check if user has enough points
    if (user.points < product.redeemPoints) {
      return NextResponse.json({ error: 'Poin tidak cukup' }, { status: 400 })
    }

    // Decrease product stock
    const updatedProduct = await db.product.update({
      where: { id: productId },
      data: { stock: { decrement: 1 } }
    })

    // Deduct points from user
    const updatedUser = await db.user.update({
      where: { id: userId },
      data: { points: { decrement: product.redeemPoints } }
    })

    // Create redeem item record
    const redeemItem = await db.redeemItem.create({
      data: {
        userId,
        productId,
        pointsUsed: product.redeemPoints
      }
    })

    // Generate unique redeem code
    let redeemCode = generateRedeemCode()
    
    // Ensure code is unique
    let isUnique = false
    let attempts = 0
    while (!isUnique && attempts < 10) {
      const existingCode = await db.redeemCode.findUnique({
        where: { code: redeemCode }
      })
      if (!existingCode) {
        isUnique = true
      } else {
        redeemCode = generateRedeemCode()
        attempts++
      }
    }

    // Create redeem code record linked to redeem item
    const createdRedeemCode = await db.redeemCode.create({
      data: {
        code: redeemCode,
        userId,
        pointsUsed: product.redeemPoints,
        status: 'active',
        redeemItemId: redeemItem.id
      }
    })

    // Add point history
    await db.pointHistory.create({
      data: {
        userId,
        type: 'exchanged',
        points: product.redeemPoints,
        description: `Tukar poin dengan ${product.name}`,
        orderId: null,
        redeemCodeId: createdRedeemCode.id
      }
    })

    // Emit WebSocket event for real-time point updates
    emitWebSocketEvent('points:updated', {
      userId: updatedUser.id,
      username: updatedUser.username,
      pointsDeducted: product.redeemPoints,
      totalPoints: updatedUser.points,
      type: 'exchanged',
      description: `Tukar poin dengan ${product.name}`
    })

    return NextResponse.json({
      success: true,
      message: 'Berhasil menukar poin dengan produk',
      product: updatedProduct,
      pointsUsed: product.redeemPoints,
      remainingPoints: updatedUser.points,
      redeemCode: redeemCode
    })
  } catch (error) {
    console.error('Redeem product error:', error)
    return NextResponse.json({ error: 'Terjadi kesalahan' }, { status: 500 })
  }
}
