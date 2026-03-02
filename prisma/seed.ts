import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding database...')

  // Create categories
  const makanan = await prisma.category.upsert({
    where: { slug: 'makanan' },
    update: {},
    create: {
      name: 'Makanan',
      slug: 'makanan',
      description: 'Menu makanan lezat',
      order: 1
    }
  })

  const minuman = await prisma.category.upsert({
    where: { slug: 'minuman' },
    update: {},
    create: {
      name: 'Minuman',
      slug: 'minuman',
      description: 'Menu minuman segar',
      order: 2
    }
  })

  const promo = await prisma.category.upsert({
    where: { slug: 'promo' },
    update: {},
    create: {
      name: 'Promo',
      slug: 'promo',
      description: 'Menu promo spesial',
      order: 3
    }
  })

  const diskon = await prisma.category.upsert({
    where: { slug: 'diskon' },
    update: {},
    create: {
      name: 'Diskon',
      slug: 'diskon',
      description: 'Menu diskon menarik',
      order: 4
    }
  })

  const terbaru = await prisma.category.upsert({
    where: { slug: 'terbaru' },
    update: {},
    create: {
      name: 'Terbaru',
      slug: 'terbaru',
      description: 'Menu terbaru kami',
      order: 5
    }
  })

  console.log('Categories created:', { makanan, minuman, promo, diskon, terbaru })

  // Create products
  const products = [
    {
      name: 'Ayam Geprek Sambal Ijo',
      description: 'Ayam goreng geprek dengan sambal ijo pedas mantap',
      price: 15000,
      discount: 0,
      image: '',
      stock: 100,
      categoryId: makanan.id,
      isPromotion: false,
      isNew: false,
      order: 1
    },
    {
      name: 'Ayam Geprek Sambal Merah',
      description: 'Ayam goreng geprek dengan sambal merah pedas nampol',
      price: 15000,
      discount: 0,
      image: '',
      stock: 100,
      categoryId: makanan.id,
      isPromotion: false,
      isNew: false,
      order: 2
    },
    {
      name: 'Ayam Geprek Keju',
      description: 'Ayam geprek dengan topping keju lumer',
      price: 18000,
      discount: 0,
      image: '',
      stock: 50,
      categoryId: makanan.id,
      isPromotion: true,
      isNew: false,
      order: 3
    },
    {
      name: 'Ayam Geprek Telur',
      description: 'Ayam geprek dengan telur mata sapi',
      price: 17000,
      discount: 10,
      image: '',
      stock: 80,
      categoryId: makanan.id,
      isPromotion: false,
      isNew: false,
      order: 4
    },
    {
      name: 'Es Teh Manis',
      description: 'Es teh manis segar',
      price: 5000,
      discount: 0,
      image: '',
      stock: 200,
      categoryId: minuman.id,
      isPromotion: false,
      isNew: false,
      order: 1
    },
    {
      name: 'Es Jeruk',
      description: 'Es jeruk peras segar',
      price: 6000,
      discount: 0,
      image: '',
      stock: 150,
      categoryId: minuman.id,
      isPromotion: false,
      isNew: false,
      order: 2
    },
    {
      name: 'Jus Alpukat',
      description: 'Jus alpukat kental dengan coklat',
      price: 12000,
      discount: 0,
      image: '',
      stock: 50,
      categoryId: minuman.id,
      isPromotion: true,
      isNew: false,
      order: 3
    },
    {
      name: 'Paket Hemat 1',
      description: 'Ayam geprek + nasi + es teh',
      price: 18000,
      discount: 20,
      image: '',
      stock: 50,
      categoryId: promo.id,
      isPromotion: true,
      isNew: false,
      order: 1
    },
    {
      name: 'Paket Hemat 2',
      description: 'Ayam geprek + nasi + es jeruk',
      price: 19000,
      discount: 15,
      image: '',
      stock: 50,
      categoryId: promo.id,
      isPromotion: true,
      isNew: false,
      order: 2
    },
    {
      name: 'Ayam Geprek Mozarella',
      description: 'Ayam geprek dengan mozarella meleleh',
      price: 20000,
      discount: 0,
      image: '',
      stock: 30,
      categoryId: terbaru.id,
      isPromotion: false,
      isNew: true,
      order: 1
    },
    {
      name: 'Nasi Uduk Ayam Geprek',
      description: 'Nasi uduk dengan ayam geprek sambal ijo',
      price: 18000,
      discount: 0,
      image: '',
      stock: 60,
      categoryId: terbaru.id,
      isPromotion: false,
      isNew: true,
      order: 2
    },
    {
      name: 'Es Teh Manis',
      description: 'Es teh manis segar',
      price: 0,
      discount: 0,
      image: '',
      stock: 100,
      categoryId: minuman.id,
      isPromotion: false,
      isNew: false,
      isRedeemable: true,
      redeemPoints: 10,
      order: 3
    },
    {
      name: 'Jus Jeruk',
      description: 'Jus jeruk peras segar',
      price: 0,
      discount: 0,
      image: '',
      stock: 80,
      categoryId: minuman.id,
      isPromotion: false,
      isNew: false,
      isRedeemable: true,
      redeemPoints: 12,
      order: 4
    },
    {
      name: 'Roti Goreng',
      description: 'Roti goreng renyah',
      price: 0,
      discount: 0,
      image: '',
      stock: 50,
      categoryId: minuman.id,
      isPromotion: false,
      isNew: false,
      isRedeemable: true,
      redeemPoints: 15,
      order: 5
    },
    {
      name: 'Aqua Botol',
      description: 'Aqua botol 330ml',
      price: 0,
      discount: 0,
      image: '',
      stock: 40,
      categoryId: minuman.id,
      isPromotion: false,
      isNew: true,
      isRedeemable: true,
      redeemPoints: 20,
      order: 6
    },
    {
      name: 'Kupon Voucher Rp 5.000',
      description: 'Kupon diskon Rp 5.000',
      price: 0,
      discount: 0,
      image: '',
      stock: 20,
      categoryId: promo.id,
      isPromotion: false,
      isNew: false,
      isRedeemable: true,
      redeemPoints: 50,
      order: 1
    },
    {
      name: 'Kupon Voucher Rp 10.000',
      description: 'Kupon diskon Rp 10.000',
      price: 0,
      discount: 0,
      image: '',
      stock: 10,
      categoryId: promo.id,
      isPromotion: false,
      isNew: false,
      isRedeemable: true,
      redeemPoints: 100,
      order: 2
    }
  ]

  // Delete existing products
  await prisma.product.deleteMany({})

  for (const product of products) {
    await prisma.product.create({
      data: product
    })
  }

  console.log('Products created:', products.length)

  // Create admin user (default password: admin123)
  const admin = await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      password: 'admin123',
      email: 'admin@ayamgeprek.com',
      phone: '085260812758',
      address: 'Toko Ayam Geprek Sambal Ijo',
      role: 'admin',
      points: 0,
      dateOfBirth: '1990-01-01'
    }
  })

  console.log('Admin user created:', admin.username)

  console.log('Database seeded successfully!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
