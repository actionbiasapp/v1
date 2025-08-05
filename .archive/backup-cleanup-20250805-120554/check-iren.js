const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkIREN() {
  try {
    const holding = await prisma.holdings.findFirst({
      where: { symbol: 'IREN' }
    });
    
    console.log('IREN Holding:', JSON.stringify(holding, null, 2));
    
    if (holding) {
      console.log('\nKey Values:');
      console.log('Quantity:', holding.quantity);
      console.log('Unit Price:', holding.unitPrice);
      console.log('Cost Basis:', holding.costBasis);
      console.log('Current Unit Price:', holding.currentUnitPrice);
      console.log('Entry Currency:', holding.entryCurrency);
      console.log('Value SGD:', holding.valueSGD);
      console.log('Value USD:', holding.valueUSD);
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkIREN(); 