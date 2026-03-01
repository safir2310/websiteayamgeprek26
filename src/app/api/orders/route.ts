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

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (userId) {
      const orders = await db.order.findMany({
        where: { userId },
        include: {
          items: {
            include: {
              product: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      })
      return NextResponse.json(orders)
    }

    const orders = await db.order.findMany({
      include: {
        items: {
          include: {
            product: true
          }
        },
        user: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json(orders)
  } catch (error) {
    console.error('Fetch orders error:', error)
    return NextResponse.json({ error: 'Terjadi kesalahan' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId, userName, userPhone, userAddress, items, total } = await request.json()

    if (!userId || !items || items.length === 0) {
      return NextResponse.json({ error: 'Data pesanan tidak lengkap' }, { status: 400 })
    }

    // Calculate points to earn (1 point per 1000 IDR)
    const pointsEarned = Math.floor(total / 1000)

    // Create order
    const order = await db.order.create({
      data: {
        userId,
        userName,
        userPhone,
        userAddress,
        total,
        status: 'pending',
        pointsEarned,
        items: {
          create: items.map((item: any) => ({
            productId: item.productId,
            quantity: item.quantity,
            price: item.price,
            subtotal: item.subtotal
          }))
        }
      },
      include: {
        items: {
          include: {
            product: true
          }
        },
        user: true
      }
    })

    // Generate WhatsApp message
    const orderId = order.id.slice(-6).toUpperCase()
    let message = `*AYAM GEPREK SAMBAL IJO*\n\n`
    message += `ID Pesanan: ${orderId}\n`
    message += `Nama: ${userName}\n`
    message += `No HP: ${userPhone}\n`
    message += `Alamat: ${userAddress}\n\n`
    message += `*Detail Pesanan:*\n`

    order.items.forEach((item, index) => {
      message += `${index + 1}. ${item.product.name}\n`
      message += `   Qty: ${item.quantity}\n`
      message += `   Harga: Rp ${item.price.toLocaleString('id-ID')}\n`
      message += `   Subtotal: Rp ${item.subtotal.toLocaleString('id-ID')}\n\n`
    })

    message += `*Total: Rp ${total.toLocaleString('id-ID')}*\n\n`
    message += `Status: Menunggu Persetujuan`

    // Save WhatsApp message
    await db.order.update({
      where: { id: order.id },
      data: { whatsappMessage: message }
    })

    // Create WhatsApp URL
    const whatsappPhone = '6285260812758'
    const encodedMessage = encodeURIComponent(message)
    const whatsappUrl = `https://wa.me/${whatsappPhone}?text=${encodedMessage}`

    // Emit WebSocket event for new order
    await emitEvent('order:created', {
      orderId: order.id,
      userId: order.userId,
      userName: order.userName,
      total: order.total,
      status: order.status,
      createdAt: order.createdAt
    })

    return NextResponse.json({
      order,
      whatsappUrl
    })
  } catch (error) {
    console.error('Create order error:', error)
    return NextResponse.json({ error: 'Terjadi kesalahan' }, { status: 500 })
  }
}
