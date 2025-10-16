import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const main = async (): Promise<void> => {
  await prisma.auditLog.deleteMany();
  await prisma.consent.deleteMany();

  const consent = await prisma.consent.create({
    data: {
      customerId: 'demo-user',
      provider: 'riyada-demo',
      scopes: ['accounts.read', 'payments.write'],
      status: 'ACTIVE',
      expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24),
    },
  });

  await prisma.auditLog.create({
    data: {
      consentId: consent.id,
      event: 'SEEDED',
      metadata: { note: 'Seed data bootstrap' },
    },
  });
};

void main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
