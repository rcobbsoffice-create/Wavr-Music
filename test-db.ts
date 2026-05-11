import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  try {
    console.log("Testing database connection...")
    const count = await prisma.user.count()
    console.log(`Connection successful! Found ${count} users.`)
  } catch (err) {
    console.error("Database connection failed!")
    console.error(err)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main()
