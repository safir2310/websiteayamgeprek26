# 🚀 Setup Otomatis DNS Records dari Resend ke Vercel

Script ini akan **otomatis** menambahkan DNS records dari Resend ke Vercel tanpa perlu menginput manual di dashboard!

---

## ✨ Fitur

- ✅ Otomatis mengambil DNS records dari Resend
- ✅ Otomatis menambahkan DNS records ke Vercel
- ✅ Verifikasi DNS records yang berhasil ditambahkan
- ✅ Menampilkan hasil dalam format tabel yang mudah dibaca
- ✅ Menangani error dengan jelas dan memberikan solusi

---

## 📋 Prasyarat

Sebelum menjalankan script, pastikan:

1. ✅ **Domain sudah ditambahkan di Resend**
   - Buka: https://resend.com/domains/add
   - Masukkan domain Anda dan klik "Add Domain"

2. ✅ **Domain sudah ditambahkan di Vercel**
   - Buka: https://vercel.com/dashboard/domains
   - Pastikan domain sudah terhubung ke project Anda

3. ✅ **Vercel API Token sudah dibuat**
   - Buka: https://vercel.com/account/tokens
   - Klik "Create Token"
   - Beri nama (contoh: "DNS Setup")
   - Pilih scope: **Full Account** atau minimal **Domains - Edit**
   - Copy token yang muncul

4. ✅ **Resend API Key sudah ada** (sudah diset di .env)

---

## 🔧 Cara Penggunaan

### Langkah 1: Tambahkan Vercel API Token ke .env

Buka file `.env` dan tambahkan:

```env
# Vercel API Token untuk setup DNS otomatis
VERCEL_API_TOKEN=re_xxxxxxxxxxxxxxxxxxxxx
```

Token ini didapatkan dari: https://vercel.com/account/tokens

### Langkah 2: Set Nama Domain di .env

Tambahkan nama domain Anda ke `.env`:

```env
# Domain name untuk setup DNS (tanpa http://, tanpa www.)
DOMAIN_NAME=ayamgepreksambalijo.com
```

⚠️ **PENTING:**
- Hanya nama domain saja
- TANPA `http://` atau `https://`
- TANPA `www.`
- Contoh benar: `ayamgepreksambalijo.com`
- Contoh salah: `https://ayamgepreksambalijo.com` atau `www.ayamgepreksambalijo.com`

### Langkah 3: Jalankan Script

Jalankan perintah berikut di terminal:

```bash
bun run dns:setup
```

Atau:

```bash
bun run scripts/setup-dns-auto.js
```

---

## 📊 Apa yang Dilakukan Script

Script akan melakukan langkah-langkah berikut secara otomatis:

### 1. ✅ Validasi Config
- Mengecek apakah `RESEND_API_KEY` ada
- Mengecek apakah `VERCEL_API_TOKEN` ada
- Mengecek apakah `DOMAIN_NAME` ada
- Membersihkan nama domain dari karakter tidak perlu

### 2. ✅ Ambil DNS Records dari Resend
- Menghubungi API Resend
- Mencari domain yang sesuai
- Mengambil semua DNS records yang diperlukan:
  - 1 TXT record untuk verification
  - 1 TXT record untuk SPF
  - 1 CNAME record untuk DKIM

### 3. ✅ Cari Domain di Vercel
- Menghubungi API Vercel
- Mencari domain yang sesuai
- Memastikan domain sudah ada di Vercel

### 4. ✅ Tambahkan DNS Records ke Vercel
- Menambahkan setiap DNS record satu per satu
- Menampilkan progress untuk setiap record
- Menangani error jika record sudah ada

### 5. ✅ Verifikasi Hasil
- Mengambil semua DNS records di Vercel
- Menampilkan dalam format tabel
- Menampilkan ringkasan hasil

---

## 🎯 Contoh Output

```
============================================================
🚀 Setup Otomatis DNS Records dari Resend ke Vercel
============================================================

ℹ️  Domain target: ayamgepreksambalijo.com

ℹ️  Mengambil DNS records dari Resend...
✅ Domain ditemukan: ayamgepreksambalijo.com
ℹ️  Status: not_verified
✅ Berhasil mengambil 3 DNS records dari Resend

📋 DNS Records yang akan ditambahkan:
────────────────────────────────────────────────────────────
┌─────────┬───────┬───────────┬────────────────────────────┐
│ (index) │  No   │   Type    │           Name             │
├─────────┼───────┼───────────┼────────────────────────────┤
│    0    │   1   │   'TXT'   │            '@'             │
│    1    │   2   │   'TXT'   │         '_resend'          │
│    2    │   3   │  'CNAME'  │          'resend'          │
└─────────┴───────┴───────────┴────────────────────────────┘
────────────────────────────────────────────────────────────

ℹ️  Menunggu 3 detik sebelum melanjutkan...

ℹ️  Mencari domain di Vercel...
✅ Domain ditemukan di Vercel: ayamgepreksambalijo.com

ℹ️  Menambahkan DNS records ke Vercel...
ℹ️  Menambahkan TXT record: @
✅ ✓ TXT @ → resend Verification Token: re_abc...
ℹ️  Menambahkan TXT record: _resend
✅ ✓ TXT _resend → v=spf1 include:_spf.resend.com ~all
ℹ️  Menambahkan CNAME record: resend
✅ ✓ CNAME resend → resend._domainkey.resend.com

🔍 Memverifikasi DNS Records di Vercel...
✅ Ditemukan 5 DNS records di Vercel

============================================================
📊 Hasil Akhir
============================================================
✅ Berhasil menambahkan 3 DNS records

📋 Semua DNS Records di Vercel:
────────────────────────────────────────────────────────────
┌─────────┬───────┬───────────┬────────────────────────────┐
│ (index) │  No   │   Type    │           Name             │
├─────────┼───────┼───────────┼────────────────────────────┤
│    0    │   1   │    'A'    │            '@'             │
│    1    │   2   │  'CNAME'  │           'www'            │
│    2    │   3   │   'TXT'   │            '@'             │  ← Baru
│    3    │   4   │   'TXT'   │         '_resend'          │  ← Baru
│    4    │   5   │  'CNAME'  │          'resend'          │  ← Baru
└─────────┴───────┴───────────┴────────────────────────────┘
────────────────────────────────────────────────────────────

============================================================
⏳ Langkah Selanjutnya:
============================================================
ℹ️  1. Tunggu 5-30 menit untuk propagasi DNS
ℹ️  2. Buka Resend Dashboard: https://resend.com/domains
ℹ️  3. Cek status verifikasi domain Anda
ℹ️  4. Klik Refresh sampai status: ✅ Verified
ℹ️  5. Beritahu developer untuk update kode email pengirim
============================================================

✅ Setup DNS selesai! 🎉
```

---

## ❌ Error Handling

### Error 1: "VERCEL_API_TOKEN belum diset!"

**Solusi:**
1. Buka: https://vercel.com/account/tokens
2. Buat token baru
3. Tambahkan ke `.env`: `VERCEL_API_TOKEN=re_xxxxxx`

---

### Error 2: "DOMAIN_NAME belum diset!"

**Solusi:**
Tambahkan ke `.env`:
```env
DOMAIN_NAME=namadomain.com
```

---

### Error 3: "Domain 'xxx' tidak ditemukan di Resend"

**Solusi:**
1. Buka: https://resend.com/domains/add
2. Tambahkan domain Anda terlebih dahulu
3. Jalankan script lagi

---

### Error 4: "Domain 'xxx' tidak ditemukan di Vercel"

**Solusi:**
1. Buka: https://vercel.com/dashboard/domains
2. Tambahkan domain ke project Vercel Anda
3. Jalankan script lagi

---

### Error 5: "Record already exists"

**Ini BUKAN error!** Script akan menandainya sebagai sukses karena record sudah ada.

---

## 🔒 Security

⚠️ **PENTING:**
- Jangan commit file `.env` ke git
- Jangan share `VERCEL_API_TOKEN` ke orang lain
- Token memiliki akses ke account Vercel Anda
- Jika token bocor, hapus dan buat token baru di Vercel

---

## 📝 Environment Variables

| Variable | Diperlukan? | Dari Mana? | Contoh |
|----------|-------------|------------|--------|
| `RESEND_API_KEY` | ✅ Ya | https://resend.com/api-keys | `re_abc123...` |
| `VERCEL_API_TOKEN` | ✅ Ya | https://vercel.com/account/tokens | `vercel_token_xyz...` |
| `DOMAIN_NAME` | ✅ Ya | Domain Anda | `ayamgepreksambalijo.com` |

---

## ⏱️ Waktu Eksekusi

Script biasanya berjalan dalam **5-10 detik**, tergantung:
- Kecepatan internet
- Respons API dari Resend dan Vercel
- Jumlah DNS records yang ditambahkan

---

## 🎉 Setelah Berhasil

### Langkah Selanjutnya:

1. **Tunggu 5-30 menit**
   - DNS perlu waktu untuk propagasi ke seluruh internet

2. **Cek Status di Resend**
   - Buka: https://resend.com/domains
   - Klik domain Anda
   - Klik **Refresh** sampai status: **✅ Verified**

3. **Beritahu Developer**
   - Kirim pesan: "Domain sudah verified di Resend!"
   - Sertakan nama domain Anda

4. **Developer akan update kode**
   - Mengubah email pengirim dari `onboarding@resend.dev` ke domain Anda
   - Contoh: `info@ayamgepreksambalijo.com`

5. **Test Email**
   - Coba kirim email laporan dari dashboard admin
   - Email akan terkirim dari domain Anda sendiri!

---

## 📞 Bantuan

Jika mengalami masalah:

### Cek Logs
- Script akan menampilkan error message yang jelas
- Baca error message dan ikuti solusi yang diberikan

### Manual Setup
Jika script tidak berfungsi, Anda bisa menambahkan DNS records secara manual:
- Buka: `VERCEL_DNS_SETUP_GUIDE.md`
- Ikuti panduan manual step-by-step

### Hubungi Support
- **Vercel Support**: https://vercel.com/support
- **Resend Support**: Chat di dashboard Resend

---

## 📚 Dokumentasi Terkait

- [VERCEL_DNS_SETUP_GUIDE.md](./VERCEL_DNS_SETUP_GUIDE.md) - Panduan manual setup DNS
- [DNS_CONFIGURATION_GUIDE.md](./DNS_CONFIGURATION_GUIDE.md) - Panduan konfigurasi DNS umum
- [DNS_CONFIG_VERCEL.md](./DNS_CONFIG_VERCEL.md) - Panduan DNS untuk domain di Vercel
- [EMAIL_FIX_NOTES.md](./EMAIL_FIX_NOTES.md) - Catatan perbaikan email

---

## 🚀 Selamat Menggunakan!

Dengan script ini, Anda tidak perlu lagi menambahkan DNS records secara manual. Semua dilakukan secara otomatis!

Jika berhasil, jangan lupa untuk menunggu 5-30 menit untuk propagasi DNS sebelum mengecek status di Resend.

**Happy automating! 🎉**
