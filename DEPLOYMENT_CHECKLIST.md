# ✅ Deployment Checklist - Ayam Geprek Sambal Ijo

## Sebelum Deploy

- [ ] **Update Environment Variables**
  - Buat file `.env.production` dengan:
    ```
    DATABASE_URL="file:./db/custom.db"
    NODE_ENV="production"
    ```

- [ ] **Test Locally**
  - Jalankan `bun run build`
  - Jalankan `bun start`
  - Test semua halaman:
    - `/` - Home page
    - `/login` - Login
    - `/register` - Register
    - `/dashboard` - User dashboard
    - `/admin` - Admin dashboard

- [ ] **Database Setup**
  - Pastikan schema sudah final
  - Jalankan `bun run db:push` untuk migrasi
  - Test database operations

- [ ] **Code Review**
  - Hapus console.log (optional)
  - Pastikan tidak ada hardcoded localhost URLs di production
  - Cek error handling di semua API routes

## Deploy ke Vercel

### Step 1: Push ke GitHub
```bash
git add .
git commit -m "Ready for production"
git push origin main
```

### Step 2: Import di Vercel
1. Login ke [vercel.com](https://vercel.com)
2. Klik "Add New Project"
3. Import dari GitHub
4. Set environment variables:
   - `DATABASE_URL` = `file:./db/custom.db`
   - `NODE_ENV` = `production`

### Step 3: Configure Settings
- **Framework Preset**: Next.js
- **Build Command**: `bun run build`
- **Output Directory**: `.next`
- **Install Command**: `bun install`

### Step 4: Deploy
Klik "Deploy"

### Step 5: Post-Deploy
1. Test URL production
2. Register user baru
3. Login sebagai admin (admin/admin123)
4. Buat test order
5. Cek WhatsApp integration

## Perbedaan Production vs Development

### Fitur yang TIDAK ada di Production:
❌ Real-time WebSocket updates
❌ Live notification antara admin & user

### Fitur yang ADA di Production:
✅ User registration & login
✅ Product catalog & filtering
✅ Shopping cart
✅ WhatsApp checkout (085260812758)
✅ Order management
✅ Order status tracking (perlu refresh)
✅ Point system
✅ Redeem codes
✅ Receipt printing
✅ Admin dashboard
✅ All CRUD operations

## Troubleshooting Common Issues

### Issue 1: "function is pending state"
**Solusi:**
- Tunggu 2-3 menit
- Coba refresh halaman
- Jika masih error, redeploy dari Vercel dashboard

### Issue 2: Database connection error
**Solusi:**
- Cek `DATABASE_URL` di environment variables
- Pastikan Prisma client sudah ter-generate: `bun run db:generate`
- Rebuild dan redeploy

### Issue 3: WhatsApp tidak terbuka
**Solusi:**
- Pastikan nomor WhatsApp formatnya benar: 6285260812758
- Test dengan membuka URL WhatsApp manual
- Cek browser pop-up blocker

### Issue 4: Login tidak bekerja
**Solusi:**
- Pastikan localStorage enabled di browser
- Cek network tab untuk API errors
- Test dengan user baru (bukan admin)

## Production URL Setup

Setelah deploy:
1. Update `NEXT_PUBLIC_APP_URL` di environment variables dengan production URL
2. Rebuild dan redeploy
3. Test semua redirect URLs

## Backup & Maintenance

### Database Backup
Production menggunakan file-based SQLite. Untuk backup:
1. Download file `custom.db` dari server
2. Simpan di lokasi aman

### Monitoring
- Check Vercel logs regularly
- Monitor error rates
- Track performance metrics

## Scaling Considerations

Jika traffic meningkat, pertimbangkan:
1. Pindah ke PostgreSQL/MySQL
2. Add CDN untuk static assets
3. Implement caching layer
4. Use Vercel Edge Functions untuk API routes

## Contact untuk Support

- WhatsApp: 085260812758
- Email: admin@ayamgeprek.com

## Catatan Penting

🚨 **WebSocket service HANYA untuk development**
- Di production (Vercel/serverless), WebSocket otomatis disabled
- Semua fungsi lain tetap berjalan normal
- User perlu refresh halaman untuk update terbaru
- Ini adalah expected behavior untuk serverless deployment

📝 **Admin Credentials Default**
- Username: `admin`
- Password: `admin123`
- **TOLONG GANTI PASSWORD SETELAH FIRST LOGIN!**

🎯 **Testing Checklist Production**
- [ ] Register new user
- [ ] Login sebagai user
- [ ] Add products to cart
- [ ] Checkout (WhatsApp opens)
- [ ] Login sebagai admin
- [ ] Lihat pesanan baru di admin dashboard
- [ ] Update status pesanan
- [ ] Cek point terupdate di user dashboard
- [ ] Generate redeem code
- [ ] Print receipt

---

**Last Updated:** 2024
**Version:** 1.0.0
