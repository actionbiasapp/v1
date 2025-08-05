#!/usr/bin/env tsx

/**
 * Monthly Snapshots CSV Import Script
 * 
 * This script imports monthly financial data from CSV files into the database.
 * Expected CSV format:
 * 
 * period,income,expenses,portfolio_value,net_worth,notes
 * 2024-01,8500,3200,125000,125000,January snapshot
 * 2024-02,8500,3100,128000,128000,February snapshot
 * 
 * Usage:
 * npm run import-monthly-snapshots <csv-file-path>
 * 
 * Example:
 * npm run import-monthly-snapshots ./data/monthly-snapshots-2024.csv
 */

import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';
import * as readline from 'readline';

const prisma = new PrismaClient();

interface CSVRow {
  period: string;
  income: number;
  expenses: number;
  portfolio_value: number;
  net_worth: number;
  notes?: string;
}

interface ProcessedRow {
  year: number;
  month: number;
  income: number;
  expenses: number;
  portfolioValue: number;
  netWorth: number;
  notes?: string;
}

// Helper function to parse period string (e.g., "2024-01" -> year: 2024, month: 1)
function parsePeriod(period: string): { year: number; month: number } {
  const [yearStr, monthStr] = period.split('-');
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10);
  
  if (isNaN(year) || isNaN(month) || month < 1 || month > 12) {
    throw new Error(`Invalid period format: ${period}. Expected format: YYYY-MM`);
  }
  
  return { year, month };
}

// Helper function to clean and parse numeric values
function parseNumericValue(value: string): number {
  // Remove currency symbols, commas, and whitespace
  const cleaned = value.replace(/[$,€£¥₹\s]/g, '');
  const parsed = parseFloat(cleaned);
  
  if (isNaN(parsed)) {
    throw new Error(`Invalid numeric value: ${value}`);
  }
  
  return parsed;
}

// Helper function to validate CSV row
function validateRow(row: any): CSVRow {
  const requiredFields = ['period', 'income', 'expenses', 'portfolio_value', 'net_worth'];
  
  for (const field of requiredFields) {
    if (!row[field]) {
      throw new Error(`Missing required field: ${field}`);
    }
  }
  
  return {
    period: row.period.toString().trim(),
    income: parseNumericValue(row.income.toString()),
    expenses: parseNumericValue(row.expenses.toString()),
    portfolio_value: parseNumericValue(row.portfolio_value.toString()),
    net_worth: parseNumericValue(row.net_worth.toString()),
    notes: row.notes?.toString().trim() || undefined
  };
}

// Helper function to process CSV row
function processRow(csvRow: CSVRow): ProcessedRow {
  const { year, month } = parsePeriod(csvRow.period);
  
  return {
    year,
    month,
    income: csvRow.income,
    expenses: csvRow.expenses,
    portfolioValue: csvRow.portfolio_value,
    netWorth: csvRow.net_worth,
    notes: csvRow.notes
  };
}

// Helper function to get user ID (for now, using a default user)
async function getUserId(): Promise<string> {
  // Try to find an existing user
  const user = await prisma.user.findFirst();
  if (user) {
    return user.id;
  }
  
  // Create a default user if none exists
  const newUser = await prisma.user.create({
    data: {
      email: 'default@example.com',
      name: 'Default User'
    }
  });
  
  return newUser.id;
}

// Main import function
async function importMonthlySnapshots(csvFilePath: string): Promise<void> {
  console.log(`🚀 Starting import from: ${csvFilePath}`);
  
  // Check if file exists
  if (!fs.existsSync(csvFilePath)) {
    throw new Error(`CSV file not found: ${csvFilePath}`);
  }
  
  // Get user ID
  const userId = await getUserId();
  console.log(`📋 Using user ID: ${userId}`);
  
  // Read and parse CSV
  const fileStream = fs.createReadStream(csvFilePath);
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });
  
  const rows: ProcessedRow[] = [];
  let lineNumber = 0;
  let headerSkipped = false;
  
  for await (const line of rl) {
    lineNumber++;
    
    // Skip empty lines
    if (!line.trim()) continue;
    
    // Skip header row
    if (!headerSkipped) {
      console.log(`📖 Skipping header: ${line}`);
      headerSkipped = true;
      continue;
    }
    
    try {
      // Parse CSV line (simple comma-separated for now)
      const values = line.split(',').map(v => v.trim().replace(/^"|"$/g, ''));
      
      // Map values to object (assuming standard order)
      const row = {
        period: values[0],
        income: values[1],
        expenses: values[2],
        portfolio_value: values[3],
        net_worth: values[4],
        notes: values[5] || undefined
      };
      
      const validatedRow = validateRow(row);
      const processedRow = processRow(validatedRow);
      rows.push(processedRow);
      
      console.log(`✅ Processed line ${lineNumber}: ${processedRow.year}-${processedRow.month.toString().padStart(2, '0')}`);
      
    } catch (error) {
      console.error(`❌ Error processing line ${lineNumber}: ${error}`);
      console.error(`   Line content: ${line}`);
      throw error;
    }
  }
  
  console.log(`📊 Total rows to import: ${rows.length}`);
  
  // Import to database
  let importedCount = 0;
  let skippedCount = 0;
  let errorCount = 0;
  
  for (const row of rows) {
    try {
      // Check if snapshot already exists for this period
      const existing = await prisma.monthlySnapshot.findUnique({
        where: {
          userId_year_month: {
            userId,
            year: row.year,
            month: row.month
          }
        }
      });
      
      if (existing) {
        console.log(`⏭️  Skipping existing snapshot: ${row.year}-${row.month.toString().padStart(2, '0')}`);
        skippedCount++;
        continue;
      }
      
      // Create new snapshot
      await prisma.monthlySnapshot.create({
        data: {
          userId,
          year: row.year,
          month: row.month,
          income: row.income,
          expenses: row.expenses,
          portfolioValue: row.portfolioValue,
          netWorth: row.netWorth,
          notes: row.notes
        }
      });
      
      console.log(`✅ Imported: ${row.year}-${row.month.toString().padStart(2, '0')} | Income: $${row.income.toLocaleString()} | Expenses: $${row.expenses.toLocaleString()} | Savings: $${(row.income - row.expenses).toLocaleString()}`);
      importedCount++;
      
    } catch (error) {
      console.error(`❌ Error importing ${row.year}-${row.month.toString().padStart(2, '0')}: ${error}`);
      errorCount++;
    }
  }
  
  // Summary
  console.log('\n📈 Import Summary:');
  console.log(`   ✅ Successfully imported: ${importedCount}`);
  console.log(`   ⏭️  Skipped (already exists): ${skippedCount}`);
  console.log(`   ❌ Errors: ${errorCount}`);
  console.log(`   📊 Total processed: ${rows.length}`);
  
  if (errorCount > 0) {
    console.log('\n⚠️  Some rows failed to import. Check the errors above.');
  } else {
    console.log('\n🎉 Import completed successfully!');
  }
}

// CLI interface
async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log('📋 Monthly Snapshots CSV Import Script');
    console.log('');
    console.log('Usage:');
    console.log('  npm run import-monthly-snapshots <csv-file-path>');
    console.log('');
    console.log('Example:');
    console.log('  npm run import-monthly-snapshots ./data/monthly-snapshots-2024.csv');
    console.log('');
    console.log('Expected CSV format:');
    console.log('  period,income,expenses,portfolio_value,net_worth,notes');
    console.log('  2024-01,8500,3200,125000,125000,January snapshot');
    console.log('  2024-02,8500,3100,128000,128000,February snapshot');
    console.log('');
    console.log('Notes:');
    console.log('  - period: YYYY-MM format (e.g., 2024-01)');
    console.log('  - income, expenses, portfolio_value, net_worth: numeric values (can include $, commas)');
    console.log('  - notes: optional text description');
    console.log('  - Existing snapshots for the same period will be skipped');
    process.exit(1);
  }
  
  const csvFilePath = args[0];
  
  try {
    await importMonthlySnapshots(csvFilePath);
  } catch (error) {
    console.error('💥 Import failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
if (require.main === module) {
  main();
}

export { importMonthlySnapshots }; 