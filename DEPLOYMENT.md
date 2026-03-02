# Deployment Guide - Ayam Geprek Sambal Ijo

## Environment Variables

Buat file `.env.production` di root project:

```env
DATABASE_URL="file:./db/custom.db"
NODE_ENV="production"
```

## Deployment Options

### Option 1: Vercel (Recommended)

1. Push code ke GitHub
2. Import project di Vercel
3. Set environment variables
4. Deploy

**Catatan:**
- WebSocket service tidak akan berjalan di production (serverless)
- Real-time updates hanya tersedia di development environment
- Semua fungsi lain tetap berjalan normal

### Option 2: Self-Hosted dengan WebSocket (Full Features)

Jika ingin fitur real-time WebSocket di production:

1. Deploy Next.js app
2. Deploy WebSocket service secara terpisah (VPS, Docker, dll)
3. Set `WEBSOCKET_URL` di environment variables
4. Update code untuk menggunakan `WEBSOCKET_URL` di production

## Perbedaan Development vs Production

### Development (Local):
- ✅ Real-time WebSocket updates
- ✅ Socket.io client terhubung ke localhost:3003
- ✅ Live notification antara admin & user

### Production (Serverless):
- ❌ Real-time WebSocket updates (disabled)
- ✅ Semua fungsi lain normal
- ✅ User perlu refresh untuk update terbaru
- ✅ WhatsApp checkout tetap berjalan
- ✅ Database operations tetap berjalan

## Dependencies untuk Production

Pastikan dependencies ini ada di `package.json`:

```json
{
  "dependencies": {
    "@prisma/client": "^6.19.2",
    "framer-motion": "^11.0.0",
    "lucide-react": "^0.344.0",
    "next": "16.1.3",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "class-variance-authority": "^0.7.0",
    "clsx": "^2.1.0",
    "tailwind-merge": "^2.2.0",
    "tailwindcss-animate": "^1.0.7",
    "socket.io-client": "^4.8.3"
  }
}
```

## Database Setup

Production akan menggunakan SQLite dengan file-based database.

Untuk production environment yang lebih scalable, pertimbangkan untuk menggunakan:
- PostgreSQL (Vercel Postgres, Neon, Supabase)
- MySQL (PlanetScale, AWS RDS)

Jika mengganti database, update `prisma/schema.prisma` dan `.env.production`.

## Build Command

```bash
bun run build
```

## Start Command

Production:
```bash
bun start
```

## Troubleshooting

### Error: "PreconditionFailed: function is pending state"

Solusi:
1. Tunggu beberapa menit dan coba lagi
2. Check deployment logs untuk error spesifik
3. Pastikan environment variables sudah di-set
4. Coba redeploy

### Error: "Database connection failed"

Solusi:
1. Pastikan `DATABASE_URL` di-set dengan benar
2. Check database file permissions
3. Run `bun run db:push` untuk migrasi

### WebSocket tidak connect di production

Ini adalah **expected behavior** - WebSocket hanya aktif di development untuk menghindari issue di serverless environment.

## Monitoring

Setelah deploy:
1. Check `/` - Home page
2. Check `/login` - Login page
3. Login dengan admin (username: admin, password: admin123)
4. Check `/admin` - Admin dashboard
5. Check `/dashboard` - User dashboard

## Performance Tips

1. Enable Next.js image optimization
2. Use CDN untuk static assets
3. Implement caching untuk API responses
4. Enable compression
