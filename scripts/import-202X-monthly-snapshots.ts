#!/usr/bin/env tsx

/**
 * 202X One Sheet Monthly Snapshots Import Script
 * 
 * This script imports monthly financial data from the 202X One Sheet CSV format
 * and replaces all existing monthly snapshots in the database.
 * 
 * Expected CSV format:
 * MTH-YEAR,INCOME (SGD),TOTAL EXPENSES (SGD),SAVINGS (SGD)
 * Jan-2015,$0.00,$658.31,$0.00
 * Feb-2015,"$16,531.00","$11,414.12",$0.00
 * 
 * Usage:
 * npm run import-202X-snapshots
 */

import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as readline from 'readline';

const prisma = new PrismaClient();

interface CSVRow {
  monthYear: string;
  income: number;
  expenses: number;
  savings: number;
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

// Month name to number mapping
const monthMap: { [key: string]: number } = {
  'Jan': 1, 'Feb': 2, 'Mar': 3, 'Apr': 4, 'May': 5, 'Jun': 6,
  'Jul': 7, 'Aug': 8, 'Sep': 9, 'Oct': 10, 'Nov': 11, 'Dec': 12
};

// Helper function to parse month-year string (e.g., "Jan-2015" -> year: 2015, month: 1)
function parseMonthYear(monthYear: string): { year: number; month: number } {
  const [monthStr, yearStr] = monthYear.split('-');
  const year = parseInt(yearStr, 10);
  const month = monthMap[monthStr];
  
  if (isNaN(year) || !month) {
    throw new Error(`Invalid month-year format: ${monthYear}. Expected format: Jan-2015`);
  }
  
  return { year, month };
}

// Helper function to clean and parse numeric values
function parseNumericValue(value: string): number {
  if (!value || value.trim() === '' || value === '$0.00') {
    return 0;
  }
  
  // Remove currency symbols, quotes, and whitespace, but keep commas for now
  let cleaned = value.replace(/[€£¥₹"\s]/g, '');
  
  // Remove dollar sign (including after minus sign)
  cleaned = cleaned.replace(/\$/g, '');
  
  // Remove commas
  cleaned = cleaned.replace(/,/g, '');
  
  const parsed = parseFloat(cleaned);
  
  if (isNaN(parsed)) {
    throw new Error(`Invalid numeric value: ${value} (cleaned: ${cleaned})`);
  }
  
  return parsed;
}

// Helper function to validate CSV row
function validateRow(row: any): CSVRow | null {
  // Check if this is an empty row (all fields empty or just month-year with empty values)
  if (!row.monthYear || row.monthYear.trim() === '' || 
      !row.income || row.income.trim() === '' ||
      !row.expenses || row.expenses.trim() === '') {
    return null; // Return null for empty rows
  }
  
  return {
    monthYear: row.monthYear.toString().trim(),
    income: parseNumericValue(row.income.toString()),
    expenses: parseNumericValue(row.expenses.toString()),
    savings: parseNumericValue(row.savings.toString())
  };
}

// Helper function to process CSV row
function processRow(csvRow: CSVRow): ProcessedRow | null {
  // Skip empty rows
  if (!csvRow.monthYear || csvRow.monthYear.trim() === '') {
    return null;
  }
  
  const { year, month } = parseMonthYear(csvRow.monthYear);
  
  // Calculate portfolio value and net worth
  // For this import, we'll use a simple calculation based on savings
  // You may want to adjust this logic based on your actual data
  const portfolioValue = Math.max(0, csvRow.savings * 12); // Rough estimate
  const netWorth = csvRow.income - csvRow.expenses + csvRow.savings;
  
  return {
    year,
    month,
    income: csvRow.income,
    expenses: csvRow.expenses,
    portfolioValue: Math.max(0, portfolioValue),
    netWorth: Math.max(0, netWorth),
    notes: `Imported from 202X One Sheet - ${csvRow.monthYear}`
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
async function import202XMonthlySnapshots(): Promise<void> {
  const csvFilePath = './app/202X One Sheet - Monthly Snapshot - Sheet1.csv';
  
  console.log(`🚀 Starting import from: ${csvFilePath}`);
  
  // Check if file exists
  if (!fs.existsSync(csvFilePath)) {
    throw new Error(`CSV file not found: ${csvFilePath}`);
  }
  
  // Get user ID
  const userId = await getUserId();
  console.log(`📋 Using user ID: ${userId}`);
  
  // Delete all existing monthly snapshots for this user
  console.log(`🗑️  Deleting all existing monthly snapshots...`);
  await prisma.monthlySnapshot.deleteMany({
    where: { userId }
  });
  console.log(`✅ Deleted all existing snapshots`);
  
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
      // Parse CSV line properly handling quoted values
      const values: string[] = [];
      let current = '';
      let inQuotes = false;
      
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          values.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }
      values.push(current.trim()); // Add the last value
      
      // Remove quotes from values
      const cleanValues = values.map(v => v.replace(/^"|"$/g, ''));
      
      // Map values to object (assuming standard order)
      const row = {
        monthYear: cleanValues[0],
        income: cleanValues[1],
        expenses: cleanValues[2],
        savings: cleanValues[3]
      };
      
      const validatedRow = validateRow(row);
      
      if (validatedRow) {
        const processedRow = processRow(validatedRow);
        
        if (processedRow) {
          rows.push(processedRow);
          console.log(`✅ Processed line ${lineNumber}: ${processedRow.year}-${processedRow.month.toString().padStart(2, '0')}`);
        } else {
          console.log(`⏭️  Skipped empty line ${lineNumber}`);
        }
      } else {
        console.log(`⏭️  Skipped empty line ${lineNumber}`);
      }
      
    } catch (error) {
      console.error(`❌ Error processing line ${lineNumber}: ${error}`);
      console.error(`   Line content: ${line}`);
      throw error;
    }
  }
  
  console.log(`📊 Total rows to import: ${rows.length}`);
  
  // Import to database
  let importedCount = 0;
  let errorCount = 0;
  
  for (const row of rows) {
    try {
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
  console.log(`   ❌ Errors: ${errorCount}`);
  console.log(`   📊 Total processed: ${rows.length}`);
  
  if (errorCount > 0) {
    console.log('\n⚠️  Some rows failed to import. Check the errors above.');
  } else {
    console.log('\n🎉 Import completed successfully!');
    console.log(`📅 Data spans from ${rows[0]?.year}-${rows[0]?.month.toString().padStart(2, '0')} to ${rows[rows.length-1]?.year}-${rows[rows.length-1]?.month.toString().padStart(2, '0')}`);
  }
}

// CLI interface
async function main() {
  try {
    await import202XMonthlySnapshots();
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

export { import202XMonthlySnapshots }; 