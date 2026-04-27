import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
async function main() {
  try {
    const beats = await prisma.beat.findMany({
      where: { status: { not: "draft" } },
      include: { producer: { select: { name: true } } },
    });
    console.log("Found beats:", beats.length);
    console.log("First beat:", JSON.stringify(beats[0], null, 2));
  } catch (err) {
    console.error("Prisma error:", err);
  } finally {
    await prisma.$disconnect();
  }
}
main();
