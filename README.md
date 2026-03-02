# Ayam Geprek Sambal Ijo - Online Ordering System

Sistem pemesanan online untuk Ayam Geprek Sambal Ijo dengan fitur lengkap termasuk sistem point, redeem code, dan integrasi WhatsApp.

## 🚀 Tech Stack

- **Framework:** Next.js 16 with App Router
- **Language:** TypeScript 5
- **Database:** PostgreSQL (Production) / SQLite (Development)
- **ORM:** Prisma
- **Styling:** Tailwind CSS 4 + shadcn/ui
- **State Management:** Zustand, TanStack Query
- **Authentication:** Custom Auth
- **Real-time:** Socket.io
- **Deployment:** Vercel

## ✨ Fitur

- 🍗 **Menu & Produk** - Manajemen menu dengan kategori, diskon, dan promo
- 🛒 **Keranjang Belanja** - Sistem keranjang belanja yang interaktif
- 💳 **Checkout WhatsApp** - Integrasi langsung ke WhatsApp untuk pembayaran
- 💰 **Sistem Point** - Pengumpulan point dari setiap pembelian
- 🎁 **Redeem Code** - Sistem kode redeem untuk hadiah gratis
- 📊 **Dashboard Admin** - Manajemen pesanan, produk, kategori, dan user
- 🔄 **Real-time Updates** - Update pesanan dan point secara real-time
- 👤 **User Profile** - Manajemen profil dan point user
- 🔐 **Forgot Password** - Reset password dengan verifikasi nomor HP

## 📦 Installation

### Prerequisites

- Node.js 18+ or Bun
- PostgreSQL database (for production)
- Git

### Local Development

1. Clone the repository:
```bash
git clone https://github.com/safir2310/ayam-geprek-sambal-ijo.git
cd ayam-geprek-sambal-ijo
```

2. Install dependencies:
```bash
bun install
```

3. Set up environment variables:
```bash
cp .env.example .env
```

Edit `.env` file:
```env
DATABASE_URL="file:./db/custom.db"  # SQLite for local development
NODE_ENV="development"
```

4. Initialize database:
```bash
bun run db:push
```

5. Seed initial data (optional):
```bash
bun run db:seed
```

6. Start development server:
```bash
bun run dev
```

7. Open [http://localhost:3000](http://localhost:3000)

## 🚢 Deployment ke Vercel

### 1. Setup Vercel Postgres

1. Buka [vercel.com](https://vercel.com) dan login dengan GitHub
2. Di dashboard, klik **Storage** atau buat project baru
3. Klik **Create Database** → Pilih **Postgres**
4. Copy `DATABASE_URL` yang diberikan

### 2. Deploy ke Vercel

1. Buka [vercel.com/new](https://vercel.com/new)
2. Import repository: `safir2310/ayam-geprek-sambal-ijo`
3. Di bagian **Environment Variables**, tambahkan:
   ```
   DATABASE_URL = [paste Vercel Postgres DATABASE_URL here]
   NODE_ENV = production
   ```
4. Klik **Deploy**

### 3. Setup Database di Production

Setelah deployment berhasil, jalankan migrasi database:

```bash
# Install Vercel CLI
npm i -g vercel

# Login ke Vercel
vercel login

# Push database schema
vercel env pull .env
prisma db push
```

Atau gunakan Vercel Postgres Dashboard untuk menjalankan query migrasi secara manual.

## 🗄️ Database Schema

Project menggunakan Prisma ORM dengan schema berikut:

- **User** - Data user, role, dan points
- **Product** - Produk menu dengan kategori, harga, dan diskon
- **Category** - Kategori produk
- **Order** - Pesanan dengan status tracking
- **OrderItem** - Item dalam pesanan
- **RedeemCode** - Kode redeem untuk hadiah
- **PointHistory** - Riwayat transaksi point
- **RedeemItem** - Riwayat redeem produk dengan point

Lihat file `prisma/schema.prisma` untuk detail lengkap.

## 🔑 Default Credentials

**Admin User:**
- Username: `admin`
- Password: `admin123`

**Test User:**
- Username: `user`
- Password: `user123`

## 📱 API Endpoints

### Authentication
- `POST /api/auth/login` - Login user
- `POST /api/auth/register` - Register user baru
- `POST /api/auth/forgot-password` - Reset password

### Products
- `GET /api/products` - Get semua produk
- `GET /api/products/[id]` - Get produk by ID
- `POST /api/products` - Buat produk baru (admin)
- `PATCH /api/products/[id]` - Update produk (admin)
- `DELETE /api/products/[id]` - Hapus produk (admin)

### Orders
- `GET /api/orders` - Get semua pesanan (admin)
- `POST /api/orders` - Buat pesanan baru
- `PATCH /api/orders/[id]/status` - Update status pesanan

### Categories
- `GET /api/categories` - Get semua kategori
- `POST /api/categories` - Buat kategori baru (admin)
- `PATCH /api/categories/[id]` - Update kategori (admin)
- `DELETE /api/categories/[id]` - Hapus kategori (admin)

### Points & Redeem
- `POST /api/redeem/generate` - Generate kode redeem
- `POST /api/redeem` - Gunakan kode redeem
- `POST /api/redeem-product` - Redeem produk dengan point

## 🎨 UI Components

Project menggunakan [shadcn/ui](https://ui.shadcn.com/) dengan tema custom berwarna orange. Component tersedia di `src/components/ui/`:
- Button, Input, Card, Dialog, Select, Tabs
- Sheet, ScrollArea, Separator, Badge
- Toast (Sonner), dan banyak lagi

## 🌐 Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── api/               # API Routes
│   ├── admin/             # Admin Dashboard
│   ├── dashboard/         # User Dashboard
│   ├── login/             # Login Page
│   └── page.tsx           # Home Page
├── components/            # React Components
│   └── ui/               # shadcn/ui Components
├── lib/                  # Utilities
│   └── db.ts             # Prisma Client
├── hooks/                # Custom Hooks
│   └── useWebSocket.ts   # WebSocket Hook
└── types/                # TypeScript Types
```

## 🔄 Real-time Features

Project menggunakan Socket.io untuk real-time updates:
- Update status pesanan
- Notifikasi perubahan point
- Update data user

## 🧪 Testing

```bash
bun run lint          # Lint code
bun run db:push      # Push schema changes to DB
bun run db:studio    # Open Prisma Studio
```

## 📝 Environment Variables

| Variable | Description | Required |
|----------|-------------|-----------|
| `DATABASE_URL` | PostgreSQL connection string | Yes |
| `NODE_ENV` | Environment (development/production) | Yes |
| `WEBSOCKET_URL` | WebSocket service URL | Optional |

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

## 📄 License

This project is proprietary software.

## 👤 Author

**Safir** - [@safir2310](https://github.com/safir2310)

## 🙏 Acknowledgments

- [shadcn/ui](https://ui.shadcn.com/) for beautiful UI components
- [Prisma](https://www.prisma.io/) for amazing ORM
- [Next.js](https://nextjs.org/) for the framework
- [Vercel](https://vercel.com/) for hosting
