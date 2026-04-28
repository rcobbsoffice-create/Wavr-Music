import { PrismaClient } from '@prisma/client'

// Manually use the DIRECT_URL for testing
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: "postgresql://postgres:mixtheworld2026@db.ozvcectjbdadvznxspsm.supabase.co:5432/postgres"
    }
  }
})

async function main() {
  try {
    console.log("Testing DIRECT database connection...")
    const count = await prisma.user.count()
    console.log(`Connection successful! Found ${count} users.`)
  } catch (err) {
    console.error("DIRECT Database connection failed!")
    console.error(err)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main()
