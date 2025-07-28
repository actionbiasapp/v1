const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkDataConsistency() {
  try {
    console.log('🔍 Checking data consistency across all holdings...\n');
    
    const holdings = await prisma.holdings.findMany({
      include: {
        category: true
      }
    });
    
    let issuesFound = 0;
    let fixesApplied = 0;
    
    for (const holding of holdings) {
      console.log(`\n📊 Checking ${holding.symbol} (${holding.name})...`);
      
      // Check if we have quantity and currentUnitPrice
      if (holding.quantity && holding.currentUnitPrice) {
        const calculatedValue = holding.quantity * holding.currentUnitPrice;
        const storedValue = Number(holding.valueSGD);
        const difference = Math.abs(calculatedValue - storedValue);
        
        // Check for significant discrepancies (>1% or >$10)
        const percentDifference = (difference / storedValue) * 100;
        const isSignificant = difference > 10 || percentDifference > 1;
        
        if (isSignificant) {
          issuesFound++;
          console.log(`⚠️  Value mismatch detected:`);
          console.log(`   Calculated: ${calculatedValue} ${holding.entryCurrency}`);
          console.log(`   Stored: ${storedValue} ${holding.entryCurrency}`);
          console.log(`   Difference: ${difference.toFixed(2)} (${percentDifference.toFixed(2)}%)`);
          
          // Ask if we should fix this
          const shouldFix = process.argv.includes('--fix');
          if (shouldFix) {
            try {
              // Update the stored values to match calculated
              await prisma.holdings.update({
                where: { id: holding.id },
                data: {
                  valueSGD: calculatedValue,
                  valueUSD: calculatedValue / 1.35, // Approximate
                  valueINR: calculatedValue * 83, // Approximate
                  priceUpdated: new Date(),
                  priceSource: 'consistency_fix'
                }
              });
              
              console.log(`✅ Fixed: Updated stored values to match calculated`);
              fixesApplied++;
            } catch (error) {
              console.log(`❌ Failed to fix: ${error.message}`);
            }
          }
        } else {
          console.log(`✅ Values consistent (difference: ${difference.toFixed(2)})`);
        }
      } else {
        console.log(`ℹ️  No quantity/currentUnitPrice - using stored values`);
      }
      
      // Check for other potential issues
      if (holding.unitPrice && holding.currentUnitPrice) {
        const priceChange = ((holding.currentUnitPrice - holding.unitPrice) / holding.unitPrice) * 100;
        if (Math.abs(priceChange) > 50) {
          console.log(`⚠️  Large price change: ${priceChange.toFixed(2)}%`);
        }
      }
      
      // Check for null priceSource
      if (!holding.priceSource) {
        console.log(`⚠️  Missing price source`);
      }
    }
    
    console.log(`\n📈 Summary:`);
    console.log(`   Total holdings: ${holdings.length}`);
    console.log(`   Issues found: ${issuesFound}`);
    console.log(`   Fixes applied: ${fixesApplied}`);
    
    if (issuesFound > 0 && !process.argv.includes('--fix')) {
      console.log(`\n💡 Run with --fix flag to automatically fix issues`);
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkDataConsistency(); 