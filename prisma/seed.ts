// eslint-disable-next-line @typescript-eslint/no-require-imports
const { PrismaClient } = require('@prisma/client')
// eslint-disable-next-line @typescript-eslint/no-require-imports
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding database...')

  await prisma.analyticsEvent.deleteMany()
  await prisma.notification.deleteMany()
  await prisma.license.deleteMany()
  await prisma.orderItem.deleteMany()
  await prisma.order.deleteMany()
  await prisma.beat.deleteMany()
  await prisma.session.deleteMany()
  await prisma.payout.deleteMany()
  await prisma.supportTicket.deleteMany()
  await prisma.merchProduct.deleteMany()
  await prisma.user.deleteMany()
  await prisma.promoCode.deleteMany()

  const passwordHash = await bcrypt.hash('password123', 10)
  const adminHash = await bcrypt.hash('admin123', 10)

  const admin = await prisma.user.create({
    data: {
      email: 'admin@wavr.com',
      password: adminHash,
      name: 'Platform Admin',
      role: 'admin',
      plan: 'free',
      verified: true,
    },
  })

  const producer1 = await prisma.user.create({
    data: {
      email: 'producer@wavr.com',
      password: passwordHash,
      name: 'DJ Phantom',
      role: 'producer',
      plan: 'producer_pro',
      verified: true,
      bio: 'Trap & Drill specialist from Atlanta. 10+ years in the game.',
    },
  })

  const producer2 = await prisma.user.create({
    data: {
      email: 'wavegod@wavr.com',
      password: passwordHash,
      name: 'WaveGod',
      role: 'producer',
      plan: 'indie',
      verified: true,
      bio: 'R&B and Soul producer. Making waves since 2015.',
    },
  })

  const producer3 = await prisma.user.create({
    data: {
      email: 'afroking@wavr.com',
      password: passwordHash,
      name: 'Afro King',
      role: 'producer',
      plan: 'producer_pro',
      verified: true,
      bio: 'Afrobeats producer based in Lagos. Connecting continents through music.',
    },
  })

  const beatData = [
    { title: 'Midnight Drip', producerId: producer1.id, genre: 'Trap', bpm: 140, key: 'C# Min', mood: 'Dark', tags: JSON.stringify(['dark', 'heavy', 'melodic']), priceBasic: 29.99, pricePremium: 99.99, priceExclusive: 299.99, plays: 14823, featured: true, status: 'active' },
    { title: 'Summer Haze', producerId: producer2.id, genre: 'R&B', bpm: 88, key: 'F Maj', mood: 'Chill', tags: JSON.stringify(['smooth', 'chill', 'vibes']), priceBasic: 39.99, pricePremium: 119.99, priceExclusive: 349.99, plays: 9214, featured: true, status: 'active' },
    { title: 'Lagos Nights', producerId: producer3.id, genre: 'Afrobeats', bpm: 102, key: 'A Maj', mood: 'Energetic', tags: JSON.stringify(['afro', 'dance', 'vibrant']), priceBasic: 29.99, pricePremium: 99.99, priceExclusive: 299.99, plays: 22100, featured: true, status: 'active' },
    { title: 'Brooklyn Drill', producerId: producer1.id, genre: 'Drill', bpm: 144, key: 'G Min', mood: 'Aggressive', tags: JSON.stringify(['drill', 'street', 'hard']), priceBasic: 49.99, pricePremium: 149.99, priceExclusive: 499.99, plays: 31450, featured: true, status: 'active' },
    { title: 'Neon Dreams', producerId: producer2.id, genre: 'Pop', bpm: 128, key: 'D Maj', mood: 'Happy', tags: JSON.stringify(['pop', 'bright', 'catchy']), priceBasic: 29.99, pricePremium: 99.99, priceExclusive: 299.99, plays: 7823, featured: false, status: 'active' },
    { title: "Hustler's Anthem", producerId: producer1.id, genre: 'Hip-Hop', bpm: 96, key: 'E Min', mood: 'Motivated', tags: JSON.stringify(['boom bap', 'classic', 'gritty']), priceBasic: 39.99, pricePremium: 119.99, priceExclusive: 399.99, plays: 18600, featured: false, status: 'active' },
    { title: 'Crimson Clouds', producerId: producer2.id, genre: 'R&B', bpm: 72, key: 'Bb Min', mood: 'Melancholic', tags: JSON.stringify(['emotional', 'soul', 'deep']), priceBasic: 29.99, pricePremium: 99.99, priceExclusive: 299.99, plays: 5340, featured: false, status: 'active' },
    { title: 'Flex Season', producerId: producer1.id, genre: 'Trap', bpm: 138, key: 'F# Min', mood: 'Aggressive', tags: JSON.stringify(['flex', '808s', 'hard hitting']), priceBasic: 49.99, pricePremium: 149.99, priceExclusive: 499.99, plays: 25900, featured: false, status: 'active' },
    { title: 'Ivory Coast Rhythm', producerId: producer3.id, genre: 'Afrobeats', bpm: 106, key: 'G Maj', mood: 'Energetic', tags: JSON.stringify(['afro', 'tropical', 'vibrant']), priceBasic: 39.99, pricePremium: 119.99, priceExclusive: 399.99, plays: 12480, featured: false, status: 'active' },
    { title: 'City Lights', producerId: producer2.id, genre: 'Hip-Hop', bpm: 90, key: 'C Maj', mood: 'Chill', tags: JSON.stringify(['melodic', 'urban', 'smooth']), priceBasic: 29.99, pricePremium: 99.99, priceExclusive: 299.99, plays: 8900, featured: false, status: 'active' },
    { title: 'Glacier', producerId: producer1.id, genre: 'Pop', bpm: 118, key: 'A Min', mood: 'Dark', tags: JSON.stringify(['cold', 'ethereal', 'cinematic']), priceBasic: 29.99, pricePremium: 99.99, priceExclusive: 299.99, plays: 6720, featured: false, status: 'active' },
    { title: 'Fire & Smoke', producerId: producer1.id, genre: 'Drill', bpm: 142, key: 'D Min', mood: 'Aggressive', tags: JSON.stringify(['fire', 'drill', 'aggressive']), priceBasic: 59.99, pricePremium: 179.99, priceExclusive: 599.99, plays: 41200, featured: true, status: 'active' },
  ]

  const beats = await Promise.all(beatData.map((b) => prisma.beat.create({ data: b })))

  const merch = [
    { name: 'WAVR Classic Tee', description: 'Premium cotton tee with embroidered WAVR logo', category: 'T-Shirts', price: 34.99, sizes: JSON.stringify(['XS', 'S', 'M', 'L', 'XL', 'XXL']), colors: JSON.stringify(['Black', 'White', 'Purple']) },
    { name: 'Midnight Drip Hoodie', description: 'Heavy-weight pullover hoodie, DJ Phantom collab', category: 'Hoodies', price: 69.99, sizes: JSON.stringify(['S', 'M', 'L', 'XL', 'XXL']), colors: JSON.stringify(['Black', 'Charcoal']) },
    { name: 'Lagos Nights Cap', description: 'Structured 6-panel cap with Afro King branding', category: 'Hats', price: 29.99, sizes: JSON.stringify(['One Size']), colors: JSON.stringify(['Orange', 'Black']) },
    { name: 'WaveGod Phone Case', description: 'Slim hard case with WaveGod wave design', category: 'Phone Cases', price: 24.99, sizes: JSON.stringify(['iPhone 15', 'iPhone 15 Pro', 'Galaxy S24']), colors: JSON.stringify(['Clear', 'Black']) },
    { name: 'Trap Season Zip-Up', description: 'Full zip fleece hoodie, premium finish', category: 'Hoodies', price: 79.99, sizes: JSON.stringify(['S', 'M', 'L', 'XL', 'XXL']), colors: JSON.stringify(['Yellow', 'Black']) },
    { name: 'BeatKing Vintage Tee', description: 'Washed vintage tee with distressed print', category: 'T-Shirts', price: 39.99, sizes: JSON.stringify(['XS', 'S', 'M', 'L', 'XL']), colors: JSON.stringify(['Forest Green', 'Teal']) },
    { name: 'Frostbeats Snapback', description: 'Adjustable snapback with embroidered logo', category: 'Hats', price: 32.99, sizes: JSON.stringify(['One Size']), colors: JSON.stringify(['Sky Blue', 'Navy']) },
    { name: 'WAVR Oversized Hoodie', description: 'Oversized drop-shoulder hoodie, limited edition', category: 'Hoodies', price: 74.99, sizes: JSON.stringify(['S', 'M', 'L', 'XL', 'XXL']), colors: JSON.stringify(['Fuchsia', 'Purple', 'Black']) },
  ]

  const merchProducts = await Promise.all(
    merch.map((m) => prisma.merchProduct.create({ data: m }))
  )

  // Sample license purchases (producer buying another producer's beat, realistic for sampling)
  await Promise.all([
    prisma.license.create({
      data: { beatId: beats[0].id, buyerId: producer2.id, type: 'premium', price: 99.99, terms: 'Non-exclusive premium license. 500k streams limit.' },
    }),
    prisma.license.create({
      data: { beatId: beats[3].id, buyerId: producer3.id, type: 'basic', price: 49.99, terms: 'Non-exclusive basic license. MP3 only. 50k streams limit.' },
    }),
    prisma.license.create({
      data: { beatId: beats[2].id, buyerId: producer2.id, type: 'exclusive', price: 299.99, terms: 'Exclusive license. Beat removed from marketplace.' },
    }),
  ])

  const order = await prisma.order.create({
    data: {
      userId: producer2.id,
      status: 'shipped',
      total: 104.98,
      shippingAddress: JSON.stringify({ name: 'WaveGod', street: '123 Music Ave', city: 'Los Angeles', state: 'CA', zip: '90001', country: 'US' }),
      trackingNumber: 'USPS9400111899223456789',
      items: {
        create: [
          { productId: merchProducts[0].id, quantity: 2, size: 'M', color: 'Black', price: 34.99 },
          { productId: merchProducts[2].id, quantity: 1, size: 'One Size', color: 'Orange', price: 29.99 },
        ],
      },
    },
  })

  await Promise.all([
    prisma.notification.create({
      data: { userId: producer1.id, type: 'purchase', title: 'New License Purchase', message: 'WaveGod purchased a Premium license for "Midnight Drip"', link: '/producer' },
    }),
    prisma.notification.create({
      data: { userId: producer2.id, type: 'order', title: 'Order Shipped', message: 'Your merch order has shipped! Tracking: USPS9400111899223456789', link: '/dashboard', read: true },
    }),
    prisma.notification.create({
      data: { userId: admin.id, type: 'admin', title: 'New User Signup', message: '5 new producers signed up in the last 24 hours.', link: '/admin' },
    }),
  ])

  const countries = ['US', 'UK', 'NG', 'GH', 'CA', 'DE', 'FR']
  const analyticsEvents = []
  for (let i = 0; i < 50; i++) {
    const beat = beats[Math.floor(Math.random() * beats.length)]
    analyticsEvents.push({
      beatId: beat.id,
      userId: producer1.id,
      type: 'play',
      country: countries[Math.floor(Math.random() * countries.length)],
      createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
    })
  }
  await prisma.analyticsEvent.createMany({ data: analyticsEvents })

  await prisma.payout.create({ data: { userId: producer1.id, amount: 450.0, status: 'paid', method: 'stripe', processedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } })
  await prisma.payout.create({ data: { userId: producer2.id, amount: 200.0, status: 'pending', method: 'stripe' } })

  await prisma.promoCode.create({ data: { code: 'WAVR20', discount: 20, maxUses: 100, uses: 14, active: true } })
  await prisma.promoCode.create({ data: { code: 'LAUNCH50', discount: 50, maxUses: 50, uses: 50, active: false } })

  console.log(`\nSeed complete! Created: 1 admin, 3 producers, ${beats.length} beats, ${merchProducts.length} merch`)
  console.log('\nDemo login credentials:')
  console.log('  Admin:    admin@wavr.com / admin123')
  console.log('  Producer: producer@wavr.com / password123')

  void order
}

main()
  .catch((e) => { console.error('Seed error:', e); process.exit(1) })
  .finally(async () => { await prisma.$disconnect() })
