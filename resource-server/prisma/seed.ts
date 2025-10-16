import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  await prisma.consent.createMany({
    data: [
      {
        subject: '1234567890',
        purpose: 'account_information',
        scopes: ['accounts.read', 'transactions.read']
      },
      {
        subject: '0987654321',
        purpose: 'payment_initiation',
        scopes: ['payments.initiate']
      }
    ],
    skipDuplicates: true
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
