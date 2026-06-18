import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const EMAIL    = 'admin@hotelbooking.com';
const PASSWORD = 'Admin1234';

async function main() {
  const hashed = await bcrypt.hash(PASSWORD, 12);

  const existing = await prisma.user.findUnique({ where: { email: EMAIL } });

  if (existing) {
    // Update role and password if account already exists
    await prisma.user.update({
      where: { email: EMAIL },
      data: { role: 'ADMIN', password: hashed, isActive: true },
    });
    console.log(`Updated existing account → role set to ADMIN`);
  } else {
    await prisma.user.create({
      data: {
        email: EMAIL,
        password: hashed,
        firstName: 'Admin',
        lastName: 'User',
        role: 'ADMIN',
        isActive: true,
      },
    });
    console.log(`Created new admin account`);
  }

  console.log(`\nEmail:    ${EMAIL}`);
  console.log(`Password: ${PASSWORD}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
