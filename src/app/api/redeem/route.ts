import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const { code, userId } = await request.json()

    if (!code || !userId) {
      return NextResponse.json({ error: 'Kode dan user ID wajib diisi' }, { status: 400 })
    }

    // Find active redeem code
    const redeemCode = await db.redeemCode.findUnique({
      where: { code },
      include: { 
        user: true,
        redeemItem: {
          include: {
            product: {
              include: {
                category: true
              }
            }
          }
        }
      }
    })

    if (!redeemCode) {
      return NextResponse.json({ error: 'Kode tidak valid' }, { status: 400 })
    }

    if (redeemCode.status !== 'active') {
      return NextResponse.json({ error: 'Kode sudah digunakan' }, { status: 400 })
    }

    if (redeemCode.userId !== userId) {
      return NextResponse.json({ error: 'Kode tidak valid untuk user ini' }, { status: 400 })
    }

    // Get the product from redeem item
    if (!redeemCode.redeemItem || !redeemCode.redeemItem.product) {
      return NextResponse.json({ error: 'Produk redeem tidak ditemukan' }, { status: 404 })
    }

    const product = redeemCode.redeemItem.product

    // Update redeem code status
    const updatedRedeemCode = await db.redeemCode.update({
      where: { id: redeemCode.id },
      data: {
        status: 'used',
        usedAt: new Date()
      }
    })

    // Add point history
    await db.pointHistory.create({
      data: {
        userId: redeemCode.userId,
        type: 'redeemed',
        points: redeemCode.pointsUsed,
        description: `Klaim produk dengan kode redeem - ${product.name}`,
        redeemCodeId: redeemCode.id
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Kode berhasil digunakan!',
      product: product,
      pointsUsed: redeemCode.pointsUsed
    })
  } catch (error) {
    console.error('Redeem code error:', error)
    return NextResponse.json({ error: 'Terjadi kesalahan' }, { status: 500 })
  }
}
