import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import crypto from 'crypto'

export async function POST(request: NextRequest) {
  try {
    const { username, password, role } = await request.json()

    if (!username || !password) {
      return NextResponse.json({ error: 'Username dan password wajib diisi' }, { status: 400 })
    }

    // Find user by username
    const user = await db.user.findUnique({
      where: { username }
    })

    if (!user) {
      return NextResponse.json({ error: 'Username atau password salah' }, { status: 401 })
    }

    // Check if role matches
    if (user.role !== role) {
      return NextResponse.json({ error: 'Role tidak sesuai' }, { status: 401 })
    }

    // Simple password check (in production, use bcrypt)
    if (user.password !== password) {
      return NextResponse.json({ error: 'Username atau password salah' }, { status: 401 })
    }

    // Generate simple token
    const token = crypto.randomBytes(32).toString('hex')

    return NextResponse.json({
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        phone: user.phone,
        address: user.address,
        role: user.role,
        points: user.points
      },
      token
    })
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json({ error: 'Terjadi kesalahan' }, { status: 500 })
  }
}
