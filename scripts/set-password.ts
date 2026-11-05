// Usage: npm run user:password -- <email> <new-password>
import { PrismaClient } from "@prisma/client";
import { hashPassword } from "../lib/auth";

async function main() {
  const [email, password] = process.argv.slice(2);
  if (!email || !password || password.length < 8) {
    console.error("Usage: npm run user:password -- <email> <new-password (8+ chars)>");
    process.exit(1);
  }
  const prisma = new PrismaClient();
  try {
    const user = await prisma.user.update({
      where: { email: email.toLowerCase() },
      data: { passwordHash: await hashPassword(password) },
    });
    console.log(`Password updated for ${user.email}.`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
