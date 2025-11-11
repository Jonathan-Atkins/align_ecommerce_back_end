import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const admin1Email = process.env.SEED_ADMIN1_EMAIL || 'admin1@example.com';
  const admin1Password = process.env.SEED_ADMIN1_PASSWORD || 'password123';
  const admin2Email = process.env.SEED_ADMIN2_EMAIL || 'admin2@example.com';
  const admin2Password = process.env.SEED_ADMIN2_PASSWORD || 'password123';

  const salt = await bcrypt.genSalt(10);
  const hash1 = await bcrypt.hash(admin1Password, salt);
  const hash2 = await bcrypt.hash(admin2Password, salt);

  await prisma.admin.upsert({
    where: { email: admin1Email },
    update: {},
    create: { email: admin1Email, password: hash1 },
  });

  await prisma.admin.upsert({
    where: { email: admin2Email },
    update: {},
    create: { email: admin2Email, password: hash2 },
  });

  console.log('Seeded admin users:', admin1Email, admin2Email);
}

main()
  .catch((e) => {
    // eslint-disable-next-line no-console
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const adminPassword = process.env.ADMIN_PASSWORD || 'ChangeMe123!';
  const hashed = await bcrypt.hash(adminPassword, 10);

  const admins = [
    { email: process.env.ADMIN1_EMAIL || 'admin1@example.com', password: hashed },
    { email: process.env.ADMIN2_EMAIL || 'admin2@example.com', password: hashed },
  ];

  for (const a of admins) {
    await prisma.user.upsert({
      where: { email: a.email },
      update: { password: a.password, isAdmin: true, role: 'ADMIN' },
      create: { email: a.email, password: a.password, isAdmin: true, role: 'ADMIN' },
    });
  }

  console.log('Seeded admin users (emails from ADMIN1_EMAIL/ADMIN2_EMAIL or defaults).');
}

main()
  .catch((e) => {
    // eslint-disable-next-line no-console
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
