import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      userId,
      userName,
      userPhone,
      userAddress,
      items,
      total,
      paymentMethod,
      cashReceived,
      cashChange,
      shiftId
    } = body

    console.log('[Cashier Order] Received data:', { userId, userName, itemCount: items?.length, total, shiftId })

    // Validate required fields
    if (!userId || !items || items.length === 0 || !total) {
      return NextResponse.json(
        { error: 'Data tidak lengkap' },
        { status: 400 }
      )
    }

    // Check stock and calculate points
    let pointsEarned = 0
    for (const item of items) {
      const product = await db.product.findUnique({
        where: { id: item.productId }
      })

      if (!product) {
        return NextResponse.json(
          { error: `Produk dengan ID ${item.productId} tidak ditemukan` },
          { status: 404 }
        )
      }

      if (product.stock < item.quantity) {
        return NextResponse.json(
          { error: `Stok ${product.name} tidak cukup. Sisa stok: ${product.stock}` },
          { status: 400 }
        )
      }
    }

    let createdOrder: any = null

    try {
      // Create order and update stock in transaction
      createdOrder = await db.$transaction(async (tx) => {
        // Create order
        const newOrder = await tx.order.create({
          data: {
            userId,
            userName,
            userPhone,
            userAddress,
            total,
            status: 'completed', // Kasir orders are automatically completed
            pointsEarned: 0, // Will be calculated after order creation
            items: {
              create: items.map((item: any) => ({
                productId: item.productId,
                quantity: item.quantity,
                price: item.price,
                subtotal: item.subtotal
              }))
            },
            paymentMethod: paymentMethod || 'cash',
            cashReceived: cashReceived || 0,
            cashChange: cashChange || 0,
            isCashierOrder: true,
            shiftId: shiftId || null
          },
          include: {
            items: {
              include: {
                product: {
                  select: {
                    name: true,
                    price: true
                  }
                }
              }
            },
            user: {
              select: {
                username: true
              }
            }
          }
        })

        // Update stock for each product
        for (const item of items) {
          await tx.product.update({
            where: { id: item.productId },
            data: {
              stock: {
                decrement: item.quantity
              }
            }
          })
        }

        // Calculate points (1 point per 1,000 Rupiah spent)
        pointsEarned = Math.floor(total / 1000)

        // Update user points
        if (pointsEarned > 0) {
          await tx.user.update({
            where: { id: userId },
            data: {
              points: {
                increment: pointsEarned
              }
            }
          })

          // Update order points
          await tx.order.update({
            where: { id: newOrder.id },
            data: { pointsEarned }
          })
        }

        // Create points history
        if (pointsEarned > 0) {
          await tx.pointHistory.create({
            data: {
              userId,
              orderId: newOrder.id,
              points: pointsEarned,
              type: 'earned',
              description: `Pesanan kasir - ${items.length} item`
            }
          })
        }

        // Fetch updated user to get current points
        const updatedUser = await tx.user.findUnique({
          where: { id: userId },
          select: { points: true }
        })

        return { ...newOrder, userPoints: updatedUser?.points || 0 }
      })
    } catch (transactionError) {
      console.error('[Cashier Order] Transaction error:', transactionError)
      throw transactionError
    }

    return NextResponse.json({
      success: true,
      order: createdOrder,
      pointsEarned,
      userPoints: createdOrder.userPoints,
      message: 'Pesanan berhasil dibuat'
    })
  } catch (error) {
    console.error('[Cashier Order] Error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Gagal membuat pesanan'
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}
