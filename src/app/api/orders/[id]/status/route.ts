import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// Helper function to emit WebSocket event (non-blocking)
async function emitEvent(event: string, data: any) {
  try {
    // Only attempt to emit if we're not in a serverless environment
    if (process.env.NODE_ENV !== 'production') {
      await fetch('http://localhost:3003/emit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ event, data }),
        signal: AbortSignal.timeout(1000) // 1 second timeout
      }).catch(() => {
        // Silently fail if WebSocket service is not available
        console.log('WebSocket service not available, skipping event emission')
      })
    }
  } catch (error) {
    // Silently fail - WebSocket is optional
    console.log('WebSocket emit failed:', error)
  }
}

// PUT method for order status update (redirects to PATCH)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return await PATCH(request, { params })
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { status } = await request.json()

    // Get current order
    const currentOrder = await db.order.findUnique({
      where: { id },
      include: { user: true }
    })

    if (!currentOrder) {
      return NextResponse.json({ error: 'Pesanan tidak ditemukan' }, { status: 404 })
    }

    // Update order status
    const order = await db.order.update({
      where: { id },
      data: { status },
      include: {
        items: {
          include: {
            product: true
          }
        },
        user: true
      }
    })

    // Emit WebSocket event for order status update (non-blocking)
    emitEvent('order:status:updated', {
      orderId: order.id,
      userId: order.userId,
      userName: order.userName,
      status: order.status,
      total: order.total,
      updatedAt: order.updatedAt
    })

    // If status is completed, add points to user
    if (status === 'completed' && currentOrder.status !== 'completed') {
      // Update user points
      const updatedUser = await db.user.update({
        where: { id: currentOrder.userId },
        data: {
          points: {
            increment: currentOrder.pointsEarned
          }
        }
      })

      // Add point history
      await db.pointHistory.create({
        data: {
          userId: currentOrder.userId,
          type: 'earned',
          points: currentOrder.pointsEarned,
          description: `Pesanan selesai - Order #${id.slice(-6).toUpperCase()}`,
          orderId: id
        }
      })

      // Emit WebSocket event for points update (non-blocking)
      emitEvent('points:updated', {
        userId: currentOrder.userId,
        username: updatedUser.username,
        pointsAdded: currentOrder.pointsEarned,
        totalPoints: updatedUser.points,
        type: 'earned',
        orderId: id,
        description: `Pesanan selesai - Order #${id.slice(-6).toUpperCase()}`
      })
    }

    return NextResponse.json(order)
  } catch (error) {
    console.error('Update order status error:', error)
    return NextResponse.json({ error: 'Terjadi kesalahan' }, { status: 500 })
  }
}
