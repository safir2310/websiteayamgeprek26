import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/shop-profile - Get shop profile
export async function GET() {
  try {
    // Try to get existing profile
    let shopProfile = await db.shopProfile.findFirst()

    // If no profile exists, create default one
    if (!shopProfile) {
      shopProfile = await db.shopProfile.create({
        data: {
          storeName: 'AYAM GEPREK SAMBAL IJO',
          slogan: 'Sambal Pedas Mantap',
          whatsapp: '6285260812758',
          instagram: '',
          facebook: '',
          address: 'Jl. Medan – Banda Aceh, Simpang Camat, Gampong Tijue, Kec. Pidie, Kab. Pidie, 24151',
          operatingHours: 'Senin - Minggu\n10:00 - 22:00 WIB',
          logo: ''
        }
      })
    }

    return NextResponse.json(shopProfile)
  } catch (error) {
    console.error('Error fetching shop profile:', error)
    return NextResponse.json(
      { error: 'Failed to fetch shop profile' },
      { status: 500 }
    )
  }
}

// POST /api/shop-profile - Create new shop profile
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Check if profile already exists
    const existingProfile = await db.shopProfile.findFirst()
    if (existingProfile) {
      return NextResponse.json(
        { error: 'Shop profile already exists. Use PUT to update.' },
        { status: 400 }
      )
    }

    const shopProfile = await db.shopProfile.create({
      data: {
        storeName: body.storeName || 'AYAM GEPREK SAMBAL IJO',
        slogan: body.slogan || 'Sambal Pedas Mantap',
        whatsapp: body.whatsapp || '6285260812758',
        instagram: body.instagram || '',
        facebook: body.facebook || '',
        address: body.address || '',
        operatingHours: body.operatingHours || 'Senin - Minggu\n10:00 - 22:00 WIB',
        logo: body.logo || ''
      }
    })

    return NextResponse.json(shopProfile, { status: 201 })
  } catch (error) {
    console.error('Error creating shop profile:', error)
    return NextResponse.json(
      { error: 'Failed to create shop profile' },
      { status: 500 }
    )
  }
}

// PUT /api/shop-profile - Update shop profile
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()

    // Get existing profile
    const existingProfile = await db.shopProfile.findFirst()
    if (!existingProfile) {
      // Create if doesn't exist
      const shopProfile = await db.shopProfile.create({
        data: {
          storeName: body.storeName || 'AYAM GEPREK SAMBAL IJO',
          slogan: body.slogan || 'Sambal Pedas Mantap',
          whatsapp: body.whatsapp || '6285260812758',
          instagram: body.instagram || '',
          facebook: body.facebook || '',
          address: body.address || '',
          operatingHours: body.operatingHours || 'Senin - Minggu\n10:00 - 22:00 WIB',
          logo: body.logo || ''
        }
      })
      return NextResponse.json(shopProfile, { status: 201 })
    }

    // Update existing profile
    const shopProfile = await db.shopProfile.update({
      where: { id: existingProfile.id },
      data: {
        storeName: body.storeName,
        slogan: body.slogan,
        whatsapp: body.whatsapp,
        instagram: body.instagram,
        facebook: body.facebook,
        address: body.address,
        operatingHours: body.operatingHours,
        logo: body.logo
      }
    })

    return NextResponse.json(shopProfile)
  } catch (error) {
    console.error('Error updating shop profile:', error)
    return NextResponse.json(
      { error: 'Failed to update shop profile' },
      { status: 500 }
    )
  }
}
