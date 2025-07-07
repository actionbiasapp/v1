// scripts/migrate-currency-data.ts
// Run this to migrate existing holdings data to multi-currency format

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Approximate exchange rates for initial conversion
const INITIAL_RATES = {
  SGD_TO_USD: 0.74,
  SGD_TO_INR: 63.50,
  USD_TO_SGD: 1.35,
  USD_TO_INR: 85.50,
  INR_TO_SGD: 0.0157,
  INR_TO_USD: 0.0117
};

async function migrateHoldingsData() {
  console.log('Starting currency data migration...');
  
  try {
    // First, get all existing holdings with their current structure
    const existingHoldings = await prisma.$queryRaw`
      SELECT id, "currentValue", currency 
      FROM "Holdings"
    ` as Array<{ id: string; currentValue: number; currency: string }>;
    
    console.log(`Found ${existingHoldings.length} holdings to migrate`);
    
    // Add new columns first (if they don't exist)
    try {
      await prisma.$executeRaw`ALTER TABLE "Holdings" ADD COLUMN IF NOT EXISTS "valueSGD" DECIMAL(65,30)`;
      await prisma.$executeRaw`ALTER TABLE "Holdings" ADD COLUMN IF NOT EXISTS "valueINR" DECIMAL(65,30)`;
      await prisma.$executeRaw`ALTER TABLE "Holdings" ADD COLUMN IF NOT EXISTS "valueUSD" DECIMAL(65,30)`;
      await prisma.$executeRaw`ALTER TABLE "Holdings" ADD COLUMN IF NOT EXISTS "entryCurrency" TEXT DEFAULT 'SGD'`;
      console.log('Added new currency columns');
    } catch (error) {
      console.log('Columns already exist or error adding:', error);
    }
    
    // Migrate each holding
    for (const holding of existingHoldings) {
      const currentValue = holding.currentValue;
      const originalCurrency = holding.currency || 'SGD'; // ✅ FIXED: Use different variable name
      
      let valueSGD: number;
      let valueINR: number;
      let valueUSD: number;
      let entryCurrency: string; // ✅ FIXED: Use separate variable for final currency
      
      // Convert based on original currency
      switch (originalCurrency.toUpperCase()) {
        case 'SGD':
          valueSGD = currentValue;
          valueINR = currentValue * INITIAL_RATES.SGD_TO_INR;
          valueUSD = currentValue * INITIAL_RATES.SGD_TO_USD;
          entryCurrency = 'SGD';
          break;
        case 'USD':
          valueSGD = currentValue * INITIAL_RATES.USD_TO_SGD;
          valueINR = currentValue * INITIAL_RATES.USD_TO_INR;
          valueUSD = currentValue;
          entryCurrency = 'USD';
          break;
        case 'INR':
          valueSGD = currentValue * INITIAL_RATES.INR_TO_SGD;
          valueINR = currentValue;
          valueUSD = currentValue * INITIAL_RATES.INR_TO_USD;
          entryCurrency = 'INR';
          break;
        default:
          // Default to SGD if unknown currency
          valueSGD = currentValue;
          valueINR = currentValue * INITIAL_RATES.SGD_TO_INR;
          valueUSD = currentValue * INITIAL_RATES.SGD_TO_USD;
          entryCurrency = 'SGD'; // ✅ FIXED: Assign to separate variable
      }
      
      // Update the holding with new currency values
      await prisma.$executeRaw`
        UPDATE "Holdings" 
        SET 
          "valueSGD" = ${valueSGD},
          "valueINR" = ${valueINR},
          "valueUSD" = ${valueUSD},
          "entryCurrency" = ${entryCurrency}
        WHERE id = ${holding.id}
      `;
      
      console.log(`Migrated ${holding.id}: ${originalCurrency} ${currentValue} -> SGD ${valueSGD.toFixed(2)}, INR ${valueINR.toFixed(2)}, USD ${valueUSD.toFixed(2)}`);
    }
    
    // Create initial exchange rates
    console.log('Creating initial exchange rates...');
    
    // First create ExchangeRate table if it doesn't exist
    try {
      await prisma.$executeRaw`
        CREATE TABLE IF NOT EXISTS "ExchangeRate" (
          "id" TEXT NOT NULL,
          "fromCurrency" TEXT NOT NULL,
          "toCurrency" TEXT NOT NULL,
          "rate" DECIMAL(65,30) NOT NULL,
          "source" TEXT NOT NULL DEFAULT 'api',
          "isActive" BOOLEAN NOT NULL DEFAULT true,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT "ExchangeRate_pkey" PRIMARY KEY ("id")
        )
      `;
      
      await prisma.$executeRaw`
        CREATE UNIQUE INDEX IF NOT EXISTS "ExchangeRate_fromCurrency_toCurrency_key" 
        ON "ExchangeRate"("fromCurrency", "toCurrency")
      `;
      
      console.log('Created ExchangeRate table');
    } catch (error) {
      console.log('ExchangeRate table already exists');
    }
    
    // Insert initial rates
    const rateEntries = [
      { from: 'SGD', to: 'USD', rate: INITIAL_RATES.SGD_TO_USD },
      { from: 'SGD', to: 'INR', rate: INITIAL_RATES.SGD_TO_INR },
      { from: 'USD', to: 'SGD', rate: INITIAL_RATES.USD_TO_SGD },
      { from: 'USD', to: 'INR', rate: INITIAL_RATES.USD_TO_INR },
      { from: 'INR', to: 'SGD', rate: INITIAL_RATES.INR_TO_SGD },
      { from: 'INR', to: 'USD', rate: INITIAL_RATES.INR_TO_USD }
    ];
    
    for (const entry of rateEntries) {
      await prisma.$executeRaw`
        INSERT INTO "ExchangeRate" ("id", "fromCurrency", "toCurrency", "rate", "source", "isActive")
        VALUES (gen_random_uuid(), ${entry.from}, ${entry.to}, ${entry.rate}, 'initial', true)
        ON CONFLICT ("fromCurrency", "toCurrency") DO UPDATE SET
          "rate" = ${entry.rate},
          "updatedAt" = CURRENT_TIMESTAMP
      `;
    }
    
    console.log('✅ Migration completed successfully!');
    console.log('Next steps:');
    console.log('1. Update your schema.prisma to the new multi-currency version');
    console.log('2. Run: npx prisma db push');
    console.log('3. Run: npx prisma generate');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

migrateHoldingsData();