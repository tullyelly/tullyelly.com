import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  await prisma.message.upsert({
    where: { id: 1 },
    update: { text: 'Hello World' },
    create: { id: 1, text: 'Hello World' },
  });
  console.log('Seeded: Hello World');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
