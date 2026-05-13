import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const superAdmins = await prisma.user.findMany({
    where: { role: { name: 'SUPER_ADMIN' } },
    select: { uniEmail: true, username: true }
  });
  console.log("SuperAdmins:", superAdmins);
}
main().catch(console.error).finally(() => prisma.$disconnect());
