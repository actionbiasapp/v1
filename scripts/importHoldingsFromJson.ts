import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const __dirname = path.dirname(new URL(import.meta.url).pathname);
const prisma = new PrismaClient();
const jsonPath = '/Users/kunal/Documents/action bias/v1/backups/accurate-portfolio-2025-07-20T11-25-54-195Z.json';

async function main() {
  // 1. Ensure a test/dev user exists
  let user = await prisma.user.findFirst({ where: { email: 'dev@local.test' } });
  if (!user) {
    user = await prisma.user.create({
      data: {
        email: 'dev@local.test',
        name: 'Dev User',
      },
    });
    console.log('Created test user:', user.id);
  }

  // 2. Read JSON
  const data = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
  const holdings: any[] = data.holdings;

  // 3. Ensure all referenced categories exist
  const categoryNames = [...new Set(holdings.map((h: any) => String(h.category)))] as string[];
  const categories: Record<string, any> = {};
  for (const name of categoryNames) {
    let cat = await prisma.assetCategory.findFirst({ where: { name: name as string, userId: user.id } });
    if (!cat) {
      cat = await prisma.assetCategory.create({
        data: {
          name: name as string,
          userId: user.id,
          targetPercentage: 0,
        },
      });
      console.log('Created category:', name);
    }
    categories[name as string] = cat;
  }

  // 4. Insert holdings
  let count = 0;
  for (const h of holdings) {
    await prisma.holdings.create({
      data: {
        userId: user.id,
        categoryId: categories[String(h.category)].id,
        symbol: h.symbol,
        name: h.name,
        quantity: h.quantity ? Number(h.quantity) : null,
        valueSGD: Number(h.valueSGD),
        valueINR: Number(h.valueINR),
        valueUSD: Number(h.valueUSD),
        entryCurrency: h.entryCurrency,
        costBasis: h.costBasis ? Number(h.costBasis) : null,
        location: h.location,
        currentUnitPrice: h.currentUnitPrice ? Number(h.currentUnitPrice) : null,
        priceSource: h.priceSource || null,
        priceUpdated: h.priceUpdated ? new Date(h.priceUpdated) : null,
        unitPrice: h.unitPrice ? Number(h.unitPrice) : null,
        updatedAt: h.priceUpdated ? new Date(h.priceUpdated) : new Date(),
      },
    });
    count++;
  }
  console.log(`Imported ${count} holdings.`);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 