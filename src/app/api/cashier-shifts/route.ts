import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// Create new shift for cashier
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { cashierId, cashierName } = body

    if (!cashierId || !cashierName) {
      return NextResponse.json(
        { error: 'Cashier ID and name are required' },
        { status: 400 }
      )
    }

    // Check if cashier has an active shift
    const activeShift = await db.cashierShift.findFirst({
      where: {
        cashierId,
        status: 'active'
      }
    })

    if (activeShift) {
      return NextResponse.json({
        success: true,
        shift: activeShift,
        message: 'Active shift found'
      })
    }

    // Create new shift
    const newShift = await db.cashierShift.create({
      data: {
        cashierId,
        cashierName,
        status: 'active',
        startTime: new Date(),
        paymentMethods: '{}'
      }
    })

    return NextResponse.json({
      success: true,
      shift: newShift,
      message: 'Shift baru berhasil dibuat'
    })
  } catch (error) {
    console.error('[Shift API] Error creating shift:', error)
    return NextResponse.json(
      { error: 'Gagal membuat shift baru' },
      { status: 500 }
    )
  }
}

// Get active shift for a cashier
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const cashierId = searchParams.get('cashierId')

    if (!cashierId) {
      return NextResponse.json(
        { error: 'Cashier ID is required' },
        { status: 400 }
      )
    }

    const activeShift = await db.cashierShift.findFirst({
      where: {
        cashierId,
        status: 'active'
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    if (!activeShift) {
      return NextResponse.json({
        success: true,
        shift: null,
        message: 'No active shift found'
      })
    }

    return NextResponse.json({
      success: true,
      shift: activeShift,
      message: 'Active shift found'
    })
  } catch (error) {
    console.error('[Shift API] Error fetching active shift:', error)
    return NextResponse.json(
      { error: 'Gagal mengambil data shift' },
      { status: 500 }
    )
  }
}
