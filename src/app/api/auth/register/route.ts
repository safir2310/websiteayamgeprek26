import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import crypto from 'crypto'

export async function POST(request: NextRequest) {
  try {
    const { username, password, email, phone, dateOfBirth, verificationCode, role } = await request.json()

    if (!username || !password || !email || !phone) {
      return NextResponse.json({ error: 'Semua field wajib diisi' }, { status: 400 })
    }

    // Check if username already exists
    const existingUser = await db.user.findUnique({
      where: { username }
    })

    if (existingUser) {
      return NextResponse.json({ error: 'Username sudah digunakan' }, { status: 400 })
    }

    // Check if email already exists
    const existingEmail = await db.user.findUnique({
      where: { email }
    })

    if (existingEmail) {
      return NextResponse.json({ error: 'Email sudah digunakan' }, { status: 400 })
    }

    // For admin, verify date of birth matches verification code
    if (role === 'admin') {
      if (!dateOfBirth || !verificationCode) {
        return NextResponse.json({ error: 'Tanggal lahir dan kode verifikasi wajib diisi' }, { status: 400 })
      }

      // Format date of birth to match verification code (remove dashes)
      const dobCode = dateOfBirth.replace(/-/g, '')

      if (verificationCode !== dobCode) {
        return NextResponse.json({ error: 'Kode verifikasi tidak valid' }, { status: 400 })
      }
    }

    // Create user
    const user = await db.user.create({
      data: {
        username,
        password,
        email,
        phone,
        dateOfBirth: role === 'admin' ? dateOfBirth : null,
        role: role || 'user',
        points: 0
      }
    })

    return NextResponse.json({
      message: 'Registrasi berhasil',
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        phone: user.phone,
        role: user.role
      }
    })
  } catch (error) {
    console.error('Register error:', error)
    return NextResponse.json({ error: 'Terjadi kesalahan' }, { status: 500 })
  }
}
