const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
  const admin1Email = process.env.SEED_ADMIN1_EMAIL || 'admin1@example.com';
  const admin1Password = process.env.SEED_ADMIN1_PASSWORD || 'password123';
  const admin2Email = process.env.SEED_ADMIN2_EMAIL || 'admin2@example.com';
  const admin2Password = process.env.SEED_ADMIN2_PASSWORD || 'password123';

  const hash1 = await bcrypt.hash(admin1Password, 10);
  const hash2 = await bcrypt.hash(admin2Password, 10);

  await prisma.user.upsert({
    where: { email: admin1Email },
    update: { password: hash1, role: 'ADMIN' },
    create: { email: admin1Email, password: hash1, role: 'ADMIN' },
  });

  await prisma.user.upsert({
    where: { email: admin2Email },
    update: { password: hash2, role: 'ADMIN' },
    create: { email: admin2Email, password: hash2, role: 'ADMIN' },
  });

  console.log('Seeded admin users:', admin1Email, admin2Email);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
