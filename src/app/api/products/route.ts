import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const products = await db.product.findMany({
      include: {
        category: true
      },
      orderBy: {
        order: 'asc'
      }
    })

    return NextResponse.json(products)
  } catch (error) {
    console.error('Fetch products error:', error)
    return NextResponse.json({ error: 'Terjadi kesalahan' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { name, description, price, discount, image, stock, categoryId, isPromotion, isNew, isRedeemable, redeemPoints, order } = await request.json()

    const product = await db.product.create({
      data: {
        name,
        description,
        price: parseInt(price),
        discount: discount || 0,
        image,
        stock: stock || 0,
        categoryId,
        isPromotion: isPromotion || false,
        isNew: isNew || false,
        isRedeemable: isRedeemable || false,
        redeemPoints: redeemPoints || 0,
        order: order || 0
      },
      include: {
        category: true
      }
    })

    return NextResponse.json(product)
  } catch (error) {
    console.error('Create product error:', error)
    return NextResponse.json({ error: 'Terjadi kesalahan' }, { status: 500 })
  }
}
