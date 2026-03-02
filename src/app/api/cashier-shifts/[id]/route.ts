import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// Close a shift
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { totalOrders, totalRevenue, totalPoints, totalItems, paymentMethods } = body

    // Close the shift with final statistics
    const closedShift = await db.cashierShift.update({
      where: { id },
      data: {
        endTime: new Date(),
        status: 'closed',
        totalOrders: totalOrders || 0,
        totalRevenue: totalRevenue || 0,
        totalPoints: totalPoints || 0,
        totalItems: totalItems || 0,
        paymentMethods: paymentMethods ? JSON.stringify(paymentMethods) : '{}'
      }
    })

    return NextResponse.json({
      success: true,
      shift: closedShift,
      message: 'Shift berhasil ditutup'
    })
  } catch (error) {
    console.error('[Shift API] Error closing shift:', error)
    return NextResponse.json(
      { error: 'Gagal menutup shift' },
      { status: 500 }
    )
  }
}
