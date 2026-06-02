// prisma/seed.ts
import { PrismaClient } from '@prisma/client';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import * as bcrypt from 'bcrypt';
import 'dotenv/config';

const adapter = new PrismaMariaDb(process.env.DATABASE_URL!);
const prisma = new PrismaClient({ adapter });

async function main() {
  // ===== ADMIN =====
  await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      name: 'Admin',
      username: 'admin',
      email: 'admin@example.com',
      password: await bcrypt.hash('admin123', 10),
      role: 'ADMIN',
    },
  });

  // ===== CATEGORIES =====
  const sepatu = await prisma.category.upsert({
    where: { slug: 'sepatu' },
    update: {},
    create: { name: 'Sepatu', slug: 'sepatu' },
  });

  const kaos = await prisma.category.upsert({
    where: { slug: 'kaos' },
    update: {},
    create: { name: 'Kaos', slug: 'kaos' },
  });

  const celana = await prisma.category.upsert({
    where: { slug: 'celana' },
    update: {},
    create: { name: 'Celana', slug: 'celana' },
  });

  // ===== PRODUCTS =====
  await prisma.product.upsert({
    where: { slug: 'nike-air-max' },
    update: {},
    create: {
      name: 'Nike Air Max',
      description: 'Sepatu Nike terbaik untuk olahraga',
      price: 1500000,
      stock: 50,
      slug: 'nike-air-max',
      categoryId: sepatu.id,
    },
  });

  await prisma.product.upsert({
    where: { slug: 'adidas-samba' },
    update: {},
    create: {
      name: 'Adidas Samba',
      description: 'Sepatu Adidas klasik dan stylish',
      price: 1200000,
      stock: 30,
      slug: 'adidas-samba',
      categoryId: sepatu.id,
    },
  });

  await prisma.product.upsert({
    where: { slug: 'kaos-polos-putih' },
    update: {},
    create: {
      name: 'Kaos Polos Putih',
      description: 'Kaos polos bahan cotton combed 30s',
      price: 75000,
      stock: 100,
      slug: 'kaos-polos-putih',
      categoryId: kaos.id,
    },
  });

  await prisma.product.upsert({
    where: { slug: 'kaos-polos-hitam' },
    update: {},
    create: {
      name: 'Kaos Polos Hitam',
      description: 'Kaos polos bahan cotton combed 30s',
      price: 75000,
      stock: 100,
      slug: 'kaos-polos-hitam',
      categoryId: kaos.id,
    },
  });

  await prisma.product.upsert({
    where: { slug: 'celana-jeans-slim' },
    update: {},
    create: {
      name: 'Celana Jeans Slim',
      description: 'Celana jeans slim fit bahan denim',
      price: 350000,
      stock: 40,
      slug: 'celana-jeans-slim',
      categoryId: celana.id,
    },
  });

  console.log('Seeder selesai ✅');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());