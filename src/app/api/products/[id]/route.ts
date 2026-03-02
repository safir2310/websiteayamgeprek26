import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const product = await db.product.findUnique({
      where: { id },
      include: {
        category: true
      }
    })

    if (!product) {
      return NextResponse.json({ error: 'Produk tidak ditemukan' }, { status: 404 })
    }

    return NextResponse.json(product)
  } catch (error) {
    console.error('Fetch product error:', error)
    return NextResponse.json({ error: 'Terjadi kesalahan' }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { name, description, price, discount, image, stock, categoryId, isPromotion, isNew, isRedeemable, redeemPoints, order } = await request.json()

    const updateData: any = {}
    if (name !== undefined) updateData.name = name
    if (description !== undefined) updateData.description = description
    if (price !== undefined) updateData.price = parseInt(price)
    if (discount !== undefined) updateData.discount = discount
    if (image !== undefined) updateData.image = image
    if (stock !== undefined) updateData.stock = stock
    if (categoryId !== undefined) updateData.categoryId = categoryId
    if (isPromotion !== undefined) updateData.isPromotion = isPromotion
    if (isNew !== undefined) updateData.isNew = isNew
    if (isRedeemable !== undefined) updateData.isRedeemable = isRedeemable
    if (redeemPoints !== undefined) updateData.redeemPoints = redeemPoints
    if (order !== undefined) updateData.order = order

    const product = await db.product.update({
      where: { id },
      data: updateData,
      include: {
        category: true
      }
    })

    return NextResponse.json(product)
  } catch (error) {
    console.error('Update product error:', error)
    return NextResponse.json({ error: 'Terjadi kesalahan' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Check if product exists
    const product = await db.product.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            orderItems: true,
            redeemItems: true
          }
        }
      }
    })

    if (!product) {
      return NextResponse.json({ error: 'Produk tidak ditemukan' }, { status: 404 })
    }

    // Check if product is referenced in orders or redeems
    if (product._count.orderItems > 0 || product._count.redeemItems > 0) {
      return NextResponse.json({
        error: 'Tidak dapat menghapus produk yang sudah terpakai',
        details: product._count.orderItems > 0
          ? `Produk ini ada dalam ${product._count.orderItems} pesanan`
          : `Produk ini ada dalam ${product._count.redeemItems} redeem item`
      }, { status: 400 })
    }

    // Delete the product
    await db.product.delete({
      where: { id }
    })

    console.log('[DELETE Product] Product deleted successfully:', id)

    return NextResponse.json({ message: 'Produk berhasil dihapus' })
  } catch (error) {
    console.error('[DELETE Product] Error:', error)
    return NextResponse.json({
      error: 'Gagal menghapus produk',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
